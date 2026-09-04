import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query, type MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { authComponent } from "./auth";
import { pickForGame } from "./content";
import { finishSession, topScorers } from "./stats";
import { compare, key, MAX_TRIES, pointsFor, type Attrs, type Guess } from "./iplRules";

const MAX_PLAYERS = 12;
const REVEAL_MS = 9_000;
const DEFAULT_ROUNDS = 5;
const DEFAULT_SECONDS = 120;

/**
 * IPL Guessr. One hidden player, eight tries, everybody racing the same clock.
 *
 * The only help anybody gets is the shape of their own wrong guesses, so the
 * board is the entire game and it is computed here. A client that could see
 * another player's grid could read the answer off it, so `get` hands back
 * nobody's rows but your own.
 */
const clamp = (value: unknown, fallback: number, min: number, max: number) => {
  const parsed = Math.floor(Number(value ?? fallback));
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
};

async function startRound(ctx: MutationCtx, session: Doc<"gameSessions">, usedContentIds: string[]) {
  const { items } = await pickForGame(ctx, session.gameId, 24);
  const player = items.find((item) => !usedContentIds.includes(item._id)) ?? items[0];
  if (!player) throw new ConvexError("No players are loaded. Run: npx convex run seed:run");

  const now = Date.now();
  const ms = (session.state.seconds as number) * 1000;
  const roundNumber = session.currentRound + 1;

  const roundId = await ctx.db.insert("rounds", {
    sessionId: session._id,
    roundNumber,
    contentId: player._id,
    status: "active",
    // Never returned to a client while the round is live.
    state: { answerName: player.title, answer: player.metadata as Attrs },
    startedAt: now,
  });

  await ctx.db.patch(session._id, {
    currentRound: roundNumber,
    updatedAt: now,
    state: {
      ...session.state,
      phase: "guessing",
      roundId,
      deadline: now + ms,
      guesses: {},
      solved: {},
      order: [],
      usedContentIds: [...usedContentIds, player._id],
      reveal: null,
    },
  });

  await ctx.scheduler.runAfter(ms, internal.ipl.closeRound, { sessionId: session._id, roundNumber });
}

export async function startSession(
  ctx: MutationCtx,
  session: Doc<"gameSessions">,
  players: Doc<"roomPlayers">[]
) {
  const room = await ctx.db.get(session.roomId);
  const rounds = clamp(room?.settings?.rounds, DEFAULT_ROUNDS, 1, 20);
  const seconds = clamp(room?.settings?.timerSeconds, DEFAULT_SECONDS, 30, 180);
  await ctx.db.patch(session._id, {
    totalRounds: rounds,
    state: { ...session.state, playerIds: players.map((player) => player._id), seconds },
  });
  const fresh = await ctx.db.get(session._id);
  if (!fresh) throw new ConvexError("The game could not be started.");
  await startRound(ctx, fresh, []);
}

/** Every name the guess box will accept. Static per deployment, so cacheable. */
export const roster = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_slug", (q) => q.eq("slug", "ipl-guessr"))
      .first();
    if (!game) return [];
    const rows = await ctx.db
      .query("gameContent")
      .withIndex("by_gameId", (q) => q.eq("gameId", game._id))
      .collect();
    return rows.filter((row) => row.isPublished).map((row) => row.title).sort();
  },
});

export const get = query({
  args: { sessionId: v.id("gameSessions") },
  returns: v.any(),
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session?.state?.roundId) return null;
    const game = await ctx.db.get(session.gameId);
    if (game?.slug !== "ipl-guessr") return null;

    const players = await ctx.db
      .query("roomPlayers")
      .withIndex("by_roomId", (q) => q.eq("roomId", session.roomId))
      .take(MAX_PLAYERS);
    let me = null;
    try {
      const user = await authComponent.getAuthUser(ctx);
      me = players.find((player) => player.userId === user._id) ?? null;
    } catch {
      // The clock and the roster still render while auth rehydrates.
    }

    const { guesses, ...publicState } = session.state as {
      guesses: Record<string, Guess[]>;
      solved: Record<string, number>;
    } & Record<string, unknown>;
    const solved = session.state.solved as Record<string, number>;

    return {
      game,
      session: {
        ...session,
        // The rest of the app reads state loosely; keep it that way here so
        // rebuilding the object does not pin a narrower type on the client.
        state: {
          ...publicState,
          maxTries: MAX_TRIES,
          // How far everyone else has got, and nothing they have seen.
          board: players.map((player) => ({
            playerId: player._id,
            displayName: player.displayName,
            tries: (guesses[player._id] ?? []).length,
            solved: solved[player._id] ?? null,
          })),
        } as Record<string, any>,
      },
      players,
      me: me
        ? {
            ...me,
            guesses: guesses[me._id] ?? [],
            solved: solved[me._id] ?? null,
          }
        : null,
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

/**
 * Points fall with every try, so eight guesses is worth a point and one guess
 * is worth eight. Three more for whoever gets there first, because the brief
 * is to be right and to be quick, and only the bonus pays for quick.
 */
export const guess = mutation({
  args: { sessionId: v.id("gameSessions"), name: v.string() },
  returns: v.any(),
  handler: async (ctx, { sessionId, name }) => {
    const session = await ctx.db.get(sessionId);
    if (!session?.state?.roundId) throw new ConvexError("Game not found.");
    if (session.state.phase !== "guessing") throw new ConvexError("This round is over.");

    const player = await playerIn(ctx, session);
    const solved = { ...(session.state.solved as Record<string, number>) };
    const mine = ((session.state.guesses as Record<string, Guess[]>)[player._id] ?? []) as Guess[];
    if (solved[player._id] != null) throw new ConvexError("You already got this one.");
    if (mine.length >= MAX_TRIES) throw new ConvexError("You are out of guesses.");

    const wanted = key(name);
    if (!wanted) throw new ConvexError("Type a player name first.");
    if (mine.some((entry) => key(entry.name) === wanted)) {
      throw new ConvexError("You already guessed that one.");
    }

    const rows = await ctx.db
      .query("gameContent")
      .withIndex("by_gameId", (q) => q.eq("gameId", session.gameId))
      .collect();
    const picked = rows.find((row) => row.isPublished && key(row.title) === wanted);
    if (!picked) throw new ConvexError("No IPL player by that name. Pick one from the list.");

    const round = await ctx.db.get(session.state.roundId as Id<"rounds">);
    if (!round) throw new ConvexError("Game not found.");
    const attrs = picked.metadata as Attrs;
    const correct = picked._id === round.contentId;
    const entry: Guess = {
      name: picked.title,
      ...attrs,
      correct,
      marks: compare(attrs, round.state.answer as Attrs),
    };

    const guesses = {
      ...(session.state.guesses as Record<string, Guess[]>),
      [player._id]: [...mine, entry],
    };
    const order = [...((session.state.order as string[]) ?? [])];
    const tries = mine.length + 1;

    if (correct) {
      const first = order.length === 0;
      solved[player._id] = tries;
      order.push(player._id);
      await ctx.db.patch(player._id, {
        score: player.score + pointsFor(tries) + (first ? 3 : 0),
      });
    }

    // One row per player per round, written when they stop guessing.
    if (correct || tries >= MAX_TRIES) {
      await ctx.db.insert("submissions", {
        roundId: round._id,
        playerId: player._id,
        action: "guess",
        result: { tries, solved: correct },
        score: correct ? pointsFor(tries) : 0,
        createdAt: Date.now(),
      });
    }

    await ctx.db.patch(session._id, {
      updatedAt: Date.now(),
      state: { ...session.state, guesses, solved, order },
    });

    const everyoneDone = (session.state.playerIds as string[]).every(
      (id) => solved[id] != null || (guesses[id]?.length ?? 0) >= MAX_TRIES
    );
    if (everyoneDone) {
      const fresh = await ctx.db.get(sessionId);
      if (fresh) await reveal(ctx, fresh);
    }
    return { correct, tries };
  },
});

/** The clock ran out. Whoever had not finished simply did not finish. */
export const closeRound = internalMutation({
  args: { sessionId: v.id("gameSessions"), roundNumber: v.number() },
  returns: v.null(),
  handler: async (ctx, { sessionId, roundNumber }) => {
    const session = await ctx.db.get(sessionId);
    if (!session?.state?.roundId) return null;
    if (session.state.phase !== "guessing" || session.currentRound !== roundNumber) return null;
    await reveal(ctx, session);
    return null;
  },
});

async function reveal(ctx: MutationCtx, session: Doc<"gameSessions">) {
  const round = await ctx.db.get(session.state.roundId as Id<"rounds">);
  if (!round) return;
  const now = Date.now();
  await ctx.db.patch(round._id, { status: "complete", endedAt: now });
  await ctx.db.patch(session._id, {
    updatedAt: now,
    state: {
      ...session.state,
      phase: "revealing",
      reveal: {
        answerName: round.state.answerName,
        answer: round.state.answer,
        order: session.state.order ?? [],
        solved: session.state.solved ?? {},
        endsAt: now + REVEAL_MS,
      },
    },
  });
  await ctx.scheduler.runAfter(REVEAL_MS, internal.ipl.afterReveal, {
    sessionId: session._id,
    roundNumber: session.currentRound,
  });
}

export const afterReveal = internalMutation({
  args: { sessionId: v.id("gameSessions"), roundNumber: v.number() },
  returns: v.null(),
  handler: async (ctx, { sessionId, roundNumber }) => {
    const session = await ctx.db.get(sessionId);
    if (!session?.state?.roundId) return null;
    if (session.state.phase !== "revealing" || session.currentRound !== roundNumber) return null;

    if (session.currentRound >= session.totalRounds) {
      const players = await ctx.db
        .query("roomPlayers")
        .withIndex("by_roomId", (q) => q.eq("roomId", session.roomId))
        .take(MAX_PLAYERS);
      const winnerIds = topScorers(players.filter((player) => player.status !== "removed"));
      await ctx.db.patch(session._id, {
        updatedAt: Date.now(),
        state: { ...session.state, phase: "finished", winnerIds },
      });
      await finishSession(ctx, session, winnerIds);
      return null;
    }

    await startRound(ctx, session, (session.state.usedContentIds as string[]) ?? []);
    return null;
  },
});
