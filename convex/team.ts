import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query, type MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { authComponent } from "./auth";
import { pickForGame } from "./content";
import { finishSession, topScorers } from "./stats";
import {
  DEFAULT_BUDGET,
  DEFAULT_CATEGORY,
  RAISES,
  TURN_SECONDS,
} from "./teamRules";

const MAX_PLAYERS = 12;
const SOLD_MS = 4_500;
const TURN_MS = TURN_SECONDS * 1_000;

/**
 * Make Your Team. One purse each, one lot at a time, turn-order bidding.
 *
 * Nothing in this game is secret while it runs, so unlike the guessing games
 * `get` hands back the whole state. The one hidden number is each lot's
 * rating, which is what the squads are scored on at the end; a client that
 * could read it would be bidding against a price tag instead of against the
 * room.
 *
 * The auctioneer is a scheduled mutation. Every turn carries a `seq`, and a
 * timeout that arrives for a turn that has already moved on does nothing, so
 * a raise and its own timer cannot both fire.
 */
type Lot = { title: string; tag: string; rating: number };
type Owned = Lot & { price: number };

type State = {
  kind: string;
  category: string;
  budget: number;
  phase: "bidding" | "sold" | "finished";
  playerIds: string[];
  lots: Lot[];
  lot: number;
  bid: number;
  bidderId: string | null;
  turnId: string | null;
  seq: number;
  deadline: number;
  out: string[];
  purses: Record<string, number>;
  squads: Record<string, Owned[]>;
  sold: { lot: Lot; price: number; winnerId: string | null } | null;
  winnerIds?: string[];
};

const clamp = (value: unknown, fallback: number, min: number, max: number) => {
  const parsed = Math.floor(Number(value ?? fallback));
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
};

/** Whoever acts next: not out, not already holding the lot, and can afford it. */
function nextBidder(state: State, from: string | null) {
  const order = state.playerIds;
  const start = from ? order.indexOf(from) : -1;
  for (let step = 1; step <= order.length; step += 1) {
    const id = order[(start + step + order.length) % order.length];
    if (state.out.includes(id)) continue;
    if (id === state.bidderId) continue;
    if (state.purses[id] < state.bid + 1) continue;
    return id;
  }
  return null;
}

async function openLot(ctx: MutationCtx, session: Doc<"gameSessions">, index: number) {
  const state = session.state as State;
  const now = Date.now();

  if (index >= state.lots.length) {
    await settle(ctx, session);
    return;
  }

  const next: State = {
    ...state,
    phase: "bidding",
    lot: index,
    bid: 0,
    bidderId: null,
    out: state.playerIds.filter((id) => state.purses[id] < 1),
    seq: state.seq + 1,
    deadline: now + TURN_MS,
    sold: null,
    turnId: null,
  };
  // A different player opens each lot, so nobody is permanently last to act.
  // `nextBidder` looks at whoever comes after the seat it is handed, so it
  // gets the seat before the opener.
  const count = state.playerIds.length;
  next.turnId = nextBidder(next, state.playerIds[(index - 1 + count) % count]);
  // A room with no money left is a finished auction, whatever the pool says.
  if (!next.turnId) {
    await ctx.db.patch(session._id, { updatedAt: now, state: next });
    const fresh = await ctx.db.get(session._id);
    if (fresh) await settle(ctx, fresh);
    return;
  }

  await ctx.db.patch(session._id, {
    currentRound: index + 1,
    updatedAt: now,
    state: next,
  });
  await ctx.scheduler.runAfter(TURN_MS, internal.team.turnExpired, {
    sessionId: session._id,
    seq: next.seq,
  });
}

export async function startSession(
  ctx: MutationCtx,
  session: Doc<"gameSessions">,
  players: Doc<"roomPlayers">[]
) {
  const room = await ctx.db.get(session.roomId);
  const budget = clamp(room?.settings?.budget, DEFAULT_BUDGET, 5, 200);
  const category = String(room?.settings?.category ?? DEFAULT_CATEGORY);
  const pool = clamp(room?.settings?.pool, players.length * 3, 3, 30);

  const { items } = await pickForGame(ctx, session.gameId, pool, { category });
  if (items.length === 0) {
    throw new ConvexError("No lots are loaded. Run: npx convex run seed:run");
  }
  const lots: Lot[] = items.map((item) => {
    const meta = (item.metadata ?? {}) as { tag?: string; rating?: number };
    return {
      title: item.title,
      tag: meta.tag ?? item.description ?? "",
      rating: Number(meta.rating ?? 70),
    };
  });

  const playerIds = players.map((player) => player._id as string);
  const state: State = {
    kind: "make-your-team",
    category,
    budget,
    phase: "bidding",
    playerIds,
    lots,
    lot: 0,
    bid: 0,
    bidderId: null,
    turnId: null,
    seq: 0,
    deadline: 0,
    out: [],
    purses: Object.fromEntries(playerIds.map((id) => [id, budget])),
    squads: Object.fromEntries(playerIds.map((id) => [id, [] as Owned[]])),
    sold: null,
  };

  await ctx.db.patch(session._id, { totalRounds: lots.length, state });
  const fresh = await ctx.db.get(session._id);
  if (!fresh) throw new ConvexError("The game could not be started.");
  await openLot(ctx, fresh, 0);
}

export const get = query({
  args: { sessionId: v.id("gameSessions") },
  returns: v.any(),
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session?.state?.playerIds) return null;
    const game = await ctx.db.get(session.gameId);
    if (game?.slug !== "make-your-team") return null;

    const players = await ctx.db
      .query("roomPlayers")
      .withIndex("by_roomId", (q) => q.eq("roomId", session.roomId))
      .take(MAX_PLAYERS);
    let me = null;
    try {
      const user = await authComponent.getAuthUser(ctx);
      me = players.find((player) => player.userId === user._id) ?? null;
    } catch {
      // The board still renders while auth rehydrates.
    }

    const state = session.state as State;
    const finished = state.phase === "finished";
    // Ratings are the answer key. They go out only once nobody can bid on them.
    const lots = finished ? state.lots : state.lots.map(({ rating: _r, ...rest }) => rest);
    const current = state.lots[state.lot];

    return {
      game,
      session: {
        ...session,
        state: {
          ...state,
          lots,
          // The lot on the block, without what it is worth.
          current: current ? { title: current.title, tag: current.tag } : null,
          squads: finished
            ? state.squads
            : Object.fromEntries(
                Object.entries(state.squads).map(([id, owned]) => [
                  id,
                  owned.map(({ rating: _r, ...rest }) => rest),
                ])
              ),
          sold: state.sold
            ? {
                ...state.sold,
                lot: finished
                  ? state.sold.lot
                  : { title: state.sold.lot.title, tag: state.sold.lot.tag },
              }
            : null,
        },
      },
      players,
      me,
    };
  },
});

async function playerIn(ctx: MutationCtx, session: Doc<"gameSessions">) {
  const user = await authComponent.getAuthUser(ctx);
  const player = await ctx.db
    .query("roomPlayers")
    .withIndex("by_room_and_user", (q) => q.eq("roomId", session.roomId).eq("userId", user._id))
    .first();
  if (!player || player.status === "removed") throw new ConvexError("You are not in this room.");
  return player;
}

/** Hands the turn on, or closes the lot when there is nobody left to ask. */
async function advance(ctx: MutationCtx, session: Doc<"gameSessions">, state: State) {
  const turn = nextBidder(state, state.turnId);
  const now = Date.now();

  if (!turn) {
    const lot = state.lots[state.lot];
    const winnerId = state.bidderId;
    const purses = { ...state.purses };
    const squads = { ...state.squads };
    if (winnerId) {
      purses[winnerId] = purses[winnerId] - state.bid;
      squads[winnerId] = [...(squads[winnerId] ?? []), { ...lot, price: state.bid }];
    }
    const next: State = {
      ...state,
      phase: "sold",
      purses,
      squads,
      seq: state.seq + 1,
      deadline: now + SOLD_MS,
      turnId: null,
      sold: { lot, price: state.bid, winnerId },
    };
    await ctx.db.patch(session._id, { updatedAt: now, state: next });
    await ctx.scheduler.runAfter(SOLD_MS, internal.team.nextLot, {
      sessionId: session._id,
      seq: next.seq,
    });
    return;
  }

  const next: State = { ...state, turnId: turn, seq: state.seq + 1, deadline: now + TURN_MS };
  await ctx.db.patch(session._id, { updatedAt: now, state: next });
  await ctx.scheduler.runAfter(TURN_MS, internal.team.turnExpired, {
    sessionId: session._id,
    seq: next.seq,
  });
}

/** Raise by 1 to 6. The keypad is the only way in, so the amounts are fixed. */
export const raise = mutation({
  args: { sessionId: v.id("gameSessions"), amount: v.number() },
  returns: v.null(),
  handler: async (ctx, { sessionId, amount }) => {
    const session = await ctx.db.get(sessionId);
    if (!session?.state?.playerIds) throw new ConvexError("Game not found.");
    const state = session.state as State;
    if (state.phase !== "bidding") throw new ConvexError("That lot is closed.");

    const player = await playerIn(ctx, session);
    const id = player._id as string;
    if (state.turnId !== id) throw new ConvexError("Not your turn.");
    if (!(RAISES as readonly number[]).includes(amount)) throw new ConvexError("Bid 1 to 6.");

    const bid = state.bid + amount;
    if (bid > state.purses[id]) throw new ConvexError("You cannot cover that bid.");

    await advance(ctx, session, { ...state, bid, bidderId: id });
    return null;
  },
});

/** Walk away. You are out of this lot and it does not come back. */
export const leaveBid = mutation({
  args: { sessionId: v.id("gameSessions") },
  returns: v.null(),
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session?.state?.playerIds) throw new ConvexError("Game not found.");
    const state = session.state as State;
    if (state.phase !== "bidding") throw new ConvexError("That lot is closed.");

    const player = await playerIn(ctx, session);
    const id = player._id as string;
    if (state.turnId !== id) throw new ConvexError("Not your turn.");

    await advance(ctx, session, { ...state, out: [...state.out, id] });
    return null;
  },
});

/** Nobody acted. Silence is walking away, so the auction never stalls. */
export const turnExpired = internalMutation({
  args: { sessionId: v.id("gameSessions"), seq: v.number() },
  returns: v.null(),
  handler: async (ctx, { sessionId, seq }) => {
    const session = await ctx.db.get(sessionId);
    if (!session?.state?.playerIds) return null;
    const state = session.state as State;
    if (state.phase !== "bidding" || state.seq !== seq || !state.turnId) return null;
    await advance(ctx, session, { ...state, out: [...state.out, state.turnId] });
    return null;
  },
});

export const nextLot = internalMutation({
  args: { sessionId: v.id("gameSessions"), seq: v.number() },
  returns: v.null(),
  handler: async (ctx, { sessionId, seq }) => {
    const session = await ctx.db.get(sessionId);
    if (!session?.state?.playerIds) return null;
    const state = session.state as State;
    if (state.phase !== "sold" || state.seq !== seq) return null;
    await openLot(ctx, session, state.lot + 1);
    return null;
  },
});

/** The squads are scored on what they are worth, not on what they cost. */
async function settle(ctx: MutationCtx, session: Doc<"gameSessions">) {
  const state = session.state as State;
  const players = (
    await ctx.db
      .query("roomPlayers")
      .withIndex("by_roomId", (q) => q.eq("roomId", session.roomId))
      .take(MAX_PLAYERS)
  ).filter((player) => player.status !== "removed");

  for (const player of players) {
    const owned = state.squads[player._id as string] ?? [];
    const score = owned.reduce((total, lot) => total + lot.rating, 0);
    if (player.score !== score) await ctx.db.patch(player._id, { score });
  }

  const scored = players.map((player) => ({
    ...player,
    score: (state.squads[player._id as string] ?? []).reduce((t, lot) => t + lot.rating, 0),
  }));
  const winnerIds = topScorers(scored);

  await ctx.db.patch(session._id, {
    updatedAt: Date.now(),
    state: { ...state, phase: "finished", turnId: null, sold: null, winnerIds },
  });
  const fresh = await ctx.db.get(session._id);
  if (fresh) await finishSession(ctx, fresh, winnerIds);
}
