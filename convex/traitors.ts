import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query, type MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { authComponent } from "./auth";
import { pickForGame } from "./content";
import { finishSession } from "./stats";

const TURN_MS = 30_000;
const REVEAL_MS = 6_000;
const VOTE_MS = 60_000;
const DISCUSS_MS = 15_000;
const MAX_PLAYERS = 12;

type Assignment = { name: string; isTraitor: boolean };

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

async function userId(ctx: MutationCtx) {
  return (await authComponent.getAuthUser(ctx))._id;
}

async function getSession(ctx: MutationCtx, sessionId: Id<"gameSessions">) {
  const session = await ctx.db.get(sessionId);
  if (!session || session.state?.kind !== "traitors") throw new ConvexError("Game not found.");
  return session;
}

/**
 * Takes one name pair from the content layer.
 *
 * Pairs are stored symmetrically, so which half is the traitor's name is
 * decided here rather than in the corpus. Adult pairs stay out unless the host
 * turned them on, and a pair already dealt this game is skipped while the pool
 * still has anything else to offer (GAMES.md, "continue or finish").
 */
async function pickPair(ctx: MutationCtx, session: Doc<"gameSessions">, usedPairIds: string[]) {
  const room = await ctx.db.get(session.roomId);
  const adultAllowed = room?.settings?.adult === true;
  const { items } = await pickForGame(ctx, session.gameId, 12);
  const allowed = items.filter((item) => adultAllowed || item.metadata?.adult !== true);
  const chosen = allowed.find((item) => !usedPairIds.includes(item._id)) ?? allowed[0];
  if (!chosen?.metadata?.a || !chosen?.metadata?.b) {
    throw new ConvexError("No name pairs are loaded. Run: npx convex run seed:run");
  }
  const flip = Math.random() < 0.5;
  return {
    id: chosen._id,
    innocent: flip ? chosen.metadata.a : chosen.metadata.b,
    traitor: flip ? chosen.metadata.b : chosen.metadata.a,
    group: chosen.category,
  };
}

async function startRound(
  ctx: MutationCtx,
  session: Doc<"gameSessions">,
  players: Doc<"roomPlayers">[],
  traitorId: Id<"roomPlayers">,
  usedPairIds: string[]
) {
  const pair = await pickPair(ctx, session, usedPairIds);
  const order = shuffle(players.map((player) => player._id));
  const assignments: Record<string, Assignment> = {};
  for (const player of players) {
    assignments[player._id] = {
      name: player._id === traitorId ? pair.traitor : pair.innocent,
      isTraitor: player._id === traitorId,
    };
  }
  const now = Date.now();
  const roundId = await ctx.db.insert("rounds", {
    sessionId: session._id,
    roundNumber: session.currentRound + 1,
    contentId: pair.id,
    status: "active",
    state: { pairGroup: pair.group, assignments, eliminated: [] },
    startedAt: now,
  });
  await ctx.db.patch(session._id, {
    currentRound: session.currentRound + 1,
    updatedAt: now,
    state: {
      kind: "traitors",
      phase: "speaking",
      activePlayerIds: players.map((player) => player._id),
      speakingOrder: order,
      currentPlayerIndex: 0,
      turnStartedAt: now,
      turnDurationMs: TURN_MS,
      traitorId,
      votes: {},
      eliminated: session.state?.eliminated ?? [],
      usedPairIds: [...usedPairIds, pair.id],
      winner: null,
      reveal: null,
      roundId,
    },
  });
  await ctx.scheduler.runAfter(TURN_MS, internal.traitors.autoAdvanceTurn, {
    sessionId: session._id,
    roundId,
    playerId: order[0],
  });
}

export const get = query({
  args: { sessionId: v.id("gameSessions") },
  returns: v.any(),
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session || session.state?.kind !== "traitors") return null;
    const round = await ctx.db.get(session.state.roundId as Id<"rounds">);
    if (!round) return null;
    const players = await ctx.db
      .query("roomPlayers")
      .withIndex("by_roomId", (q) => q.eq("roomId", session.roomId))
      .take(MAX_PLAYERS);
    let me = null;
    try {
      const user = await authComponent.getAuthUser(ctx);
      me = players.find((player) => player.userId === user._id) ?? null;
    } catch {
      // The page can render the public turn state while auth is rehydrating.
    }
    const assignments = round.state?.assignments ?? {};
    const { traitorId: _traitorId, ...publicSessionState } = session.state;
    const { assignments: _assignments, ...publicRoundState } = round.state;
    const game = await ctx.db.get(session.gameId);
    return {
      game,
      session: { ...session, state: publicSessionState },
      round: { ...round, state: publicRoundState },
      players,
      me: me ? { ...me, assignment: assignments[me._id] ?? null } : null,
    };
  },
});

/**
 * Traitors' half of starting a game. The room, the seats, the host check and
 * the session record are the platform's job (see `rooms.startGame`).
 */
export async function startSession(ctx: MutationCtx, session: Doc<"gameSessions">, players: Doc<"roomPlayers">[]) {
  const traitor = players[Math.floor(Math.random() * players.length)];
  await startRound(ctx, session, players, traitor._id, []);
}

export const passTurn = mutation({
  args: { sessionId: v.id("gameSessions") },
  returns: v.null(),
  handler: async (ctx, { sessionId }) => {
    const session = await getSession(ctx, sessionId);
    const id = await userId(ctx);
    const state = session.state;
    const playerId = state.speakingOrder[state.currentPlayerIndex];
    const player = await ctx.db.get(playerId as Id<"roomPlayers">);
    if (!player || player.userId !== id || state.phase !== "speaking") throw new ConvexError("It is not your turn.");
    await advanceTurn(ctx, session, state.roundId, playerId);
    return null;
  },
});

async function advanceTurn(
  ctx: MutationCtx,
  session: Doc<"gameSessions">,
  roundId: Id<"rounds">,
  expectedPlayerId: Id<"roomPlayers">
) {
  const state = session.state;
  if (state.phase !== "speaking" || state.speakingOrder[state.currentPlayerIndex] !== expectedPlayerId) return;
  const nextIndex = state.currentPlayerIndex + 1;
  if (nextIndex < state.speakingOrder.length) {
    const now = Date.now();
    const nextPlayerId = state.speakingOrder[nextIndex];
    await ctx.db.patch(session._id, { updatedAt: now, state: { ...state, currentPlayerIndex: nextIndex, turnStartedAt: now } });
    await ctx.scheduler.runAfter(TURN_MS, internal.traitors.autoAdvanceTurn, { sessionId: session._id, roundId, playerId: nextPlayerId });
    return;
  }
  await beginVoting(ctx, session, state);
}

/**
 * Opens the vote and schedules its close.
 *
 * The deadline is the whole point: a player who closes their tab used to hold
 * the room hostage, because resolution waited for a vote from every active
 * player. Whatever is on the table when the clock runs out is the result.
 */
async function beginVoting(ctx: MutationCtx, session: Doc<"gameSessions">, state: Record<string, unknown>) {
  const now = Date.now();
  const votingEndsAt = now + VOTE_MS;
  await ctx.db.patch(session._id, { updatedAt: now, state: { ...state, phase: "voting", votingEndsAt } });
  await ctx.scheduler.runAfter(VOTE_MS, internal.traitors.closeVoting, {
    sessionId: session._id,
    roundNumber: session.currentRound,
    deadline: votingEndsAt,
  });
}

export const autoAdvanceTurn = internalMutation({
  args: { sessionId: v.id("gameSessions"), roundId: v.id("rounds"), playerId: v.id("roomPlayers") },
  returns: v.null(),
  handler: async (ctx, { sessionId, roundId, playerId }) => {
    const session = await ctx.db.get(sessionId);
    if (session) await advanceTurn(ctx, session, roundId, playerId);
    return null;
  },
});

export const vote = mutation({
  args: { sessionId: v.id("gameSessions"), targetPlayerId: v.id("roomPlayers") },
  returns: v.null(),
  handler: async (ctx, { sessionId, targetPlayerId }) => {
    const session = await getSession(ctx, sessionId);
    const id = await userId(ctx);
    if (session.state.phase !== "voting") throw new ConvexError("Voting is not open.");
    const voters = session.state.activePlayerIds as string[];
    const voter = await ctx.db
      .query("roomPlayers")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", session.roomId).eq("userId", id))
      .first();
    if (!voter || !voters.includes(voter._id) || voter._id === targetPlayerId) throw new ConvexError("That vote is not allowed.");
    const tiedIds = session.state.tiedIds as string[] | null | undefined;
    if (tiedIds && !tiedIds.includes(targetPlayerId)) throw new ConvexError("Vote for one of the tied players.");
    const target = await ctx.db.get(targetPlayerId);
    if (!target || !voters.includes(targetPlayerId)) throw new ConvexError("That player is not active.");
    const roundId = session.state.roundId as Id<"rounds">;
    const previous = await ctx.db
      .query("submissions")
      .withIndex("by_round_player", (q) => q.eq("roundId", roundId).eq("playerId", voter._id))
      .first();
    if (previous) {
      await ctx.db.patch(previous._id, { result: { targetPlayerId } });
    } else {
      await ctx.db.insert("submissions", {
        roundId,
        playerId: voter._id,
        action: "vote",
        result: { targetPlayerId },
        score: 0,
        createdAt: Date.now(),
      });
    }
    const votes = { ...session.state.votes, [voter._id]: targetPlayerId };
    await ctx.db.patch(session._id, { updatedAt: Date.now(), state: { ...session.state, votes } });
    if (Object.keys(votes).length === voters.length) await resolveVote(ctx, { ...session, state: { ...session.state, votes } });
    return null;
  },
});

/**
 * Counts the votes and moves the room into the reveal.
 *
 * Nothing else happens here. The result screen is a phase of its own so that
 * every player sees who went out and whether they were the traitor before the
 * next deal wipes the board (GAMES.md, "reveal result").
 */
async function resolveVote(ctx: MutationCtx, session: Doc<"gameSessions">) {
  const votes = session.state.votes as Record<string, string>;
  if (Object.keys(votes).length === 0) {
    await endInDeadlock(ctx, session, "Nobody voted.");
    return;
  }

  const counts: Record<string, number> = {};
  for (const target of Object.values(votes)) counts[target] = (counts[target] ?? 0) + 1;
  const max = Math.max(...Object.values(counts));
  const tied = Object.keys(counts).filter((playerId) => counts[playerId] === max);

  if (tied.length !== 1) {
    // GAMES.md tie rule: one re-discussion, one revote, then nobody goes out.
    if (session.state.revote) {
      await endInDeadlock(ctx, session, "The room could not agree.");
      return;
    }
    const now = Date.now();
    await ctx.db.patch(session._id, {
      updatedAt: now,
      state: {
        ...session.state,
        phase: "discussing",
        tiedIds: tied,
        revote: true,
        votes: {},
        votingEndsAt: null,
        discussEndsAt: now + DISCUSS_MS,
      },
    });
    await ctx.scheduler.runAfter(DISCUSS_MS, internal.traitors.openRevote, {
      sessionId: session._id,
      roundNumber: session.currentRound,
    });
    return;
  }

  const eliminatedId = tied[0] as Id<"roomPlayers">;
  const eliminated = await ctx.db.get(eliminatedId);
  const wasTraitor = eliminatedId === session.state.traitorId;
  const nextActive = (session.state.activePlayerIds as string[]).filter((id) => id !== eliminatedId);
  // Traitor caught, or too few players left for another speaking round.
  const gameOver = wasTraitor || nextActive.length <= 2;
  const now = Date.now();

  await ctx.db.patch(eliminatedId, { status: "removed", removedAt: now });
  await ctx.db.patch(session.state.roundId as Id<"rounds">, { status: "complete", endedAt: now });
  await ctx.db.patch(session._id, {
    updatedAt: now,
    state: {
      ...session.state,
      phase: "revealing",
      activePlayerIds: nextActive,
      eliminated: [...session.state.eliminated, eliminatedId],
      votes: {},
      revote: false,
      tiedIds: null,
      votingEndsAt: null,
      reveal: {
        playerId: eliminatedId,
        displayName: eliminated?.displayName ?? "That player",
        wasTraitor,
        gameOver,
        winner: gameOver ? (wasTraitor ? "innocents" : "traitor") : null,
        endsAt: now + REVEAL_MS,
      },
    },
  });
  await ctx.scheduler.runAfter(REVEAL_MS, internal.traitors.afterReveal, {
    sessionId: session._id,
    roundNumber: session.currentRound,
  });
}

/** Nobody is eliminated. Say so on the reveal screen, then deal again. */
async function endInDeadlock(ctx: MutationCtx, session: Doc<"gameSessions">, reason: string) {
  const now = Date.now();
  await ctx.db.patch(session.state.roundId as Id<"rounds">, { status: "complete", endedAt: now });
  await ctx.db.patch(session._id, {
    updatedAt: now,
    state: {
      ...session.state,
      phase: "revealing",
      votes: {},
      revote: false,
      tiedIds: null,
      votingEndsAt: null,
      reveal: { playerId: null, displayName: null, wasTraitor: false, gameOver: false, winner: null, reason, endsAt: now + REVEAL_MS },
    },
  });
  await ctx.scheduler.runAfter(REVEAL_MS, internal.traitors.afterReveal, {
    sessionId: session._id,
    roundNumber: session.currentRound,
  });
}

/** Closes voting on the clock, with whatever votes are in. */
export const closeVoting = internalMutation({
  args: { sessionId: v.id("gameSessions"), roundNumber: v.number(), deadline: v.number() },
  returns: v.null(),
  handler: async (ctx, { sessionId, roundNumber, deadline }) => {
    const session = await ctx.db.get(sessionId);
    if (!session || session.state?.kind !== "traitors") return null;
    // A stale timer from an earlier vote in this round must not close this one.
    if (session.state.phase !== "voting" || session.currentRound !== roundNumber) return null;
    if (session.state.votingEndsAt !== deadline) return null;
    await resolveVote(ctx, session);
    return null;
  },
});

/** Ends the 15-second re-discussion and reopens the vote on the tied players. */
export const openRevote = internalMutation({
  args: { sessionId: v.id("gameSessions"), roundNumber: v.number() },
  returns: v.null(),
  handler: async (ctx, { sessionId, roundNumber }) => {
    const session = await ctx.db.get(sessionId);
    if (!session || session.state?.kind !== "traitors") return null;
    if (session.state.phase !== "discussing" || session.currentRound !== roundNumber) return null;
    await beginVoting(ctx, session, session.state);
    return null;
  },
});

/** Ends the game or deals the next round once the reveal has been seen. */
export const afterReveal = internalMutation({
  args: { sessionId: v.id("gameSessions"), roundNumber: v.number() },
  returns: v.null(),
  handler: async (ctx, { sessionId, roundNumber }) => {
    const session = await ctx.db.get(sessionId);
    if (!session || session.state?.kind !== "traitors") return null;
    // A reveal that already moved on, or a stale schedule from an older round.
    if (session.state.phase !== "revealing" || session.currentRound !== roundNumber) return null;

    const state = session.state;
    if (state.reveal?.gameOver) {
      await finishGame(ctx, session, state.reveal.winner);
      return null;
    }

    const players: Doc<"roomPlayers">[] = [];
    for (const id of state.activePlayerIds as string[]) {
      const player = await ctx.db.get(id as Id<"roomPlayers">);
      if (player) players.push(player);
    }
    await startRound(ctx, session, players, state.traitorId, state.usedPairIds ?? []);
    return null;
  },
});

/**
 * Ends the session: scores, room status, and the permanent record.
 *
 * The traitor takes three for surviving. Innocents take two each, but only the
 * ones still standing when the traitor was caught. Nothing is scored on the
 * client (architecture rule 5).
 */
async function finishGame(ctx: MutationCtx, session: Doc<"gameSessions">, winner: "traitor" | "innocents") {
  const state = session.state;
  const survivors = state.activePlayerIds as string[];
  const players = await ctx.db
    .query("roomPlayers")
    .withIndex("by_roomId", (q) => q.eq("roomId", session.roomId))
    .take(MAX_PLAYERS);

  const winnerIds: string[] = [];
  for (const player of players) {
    const isTraitor = player._id === state.traitorId;
    const won = winner === "traitor" ? isTraitor : !isTraitor && survivors.includes(player._id);
    if (won) winnerIds.push(player._id);
    const score = player.score + (won ? (isTraitor ? 3 : 2) : 0);
    if (score !== player.score) await ctx.db.patch(player._id, { score });
  }

  await ctx.db.patch(session._id, {
    updatedAt: Date.now(),
    state: { ...state, phase: "finished", winner, revealedTraitorId: state.traitorId },
  });
  await finishSession(ctx, session, winnerIds);
}
