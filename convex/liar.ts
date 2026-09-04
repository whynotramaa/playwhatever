import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query, type MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { authComponent } from "./auth";
import { pickForGame } from "./content";
import { finishSession, topScorers } from "./stats";

const MAX_PLAYERS = 12;
const ANSWER_MS = 60_000;
const VOTE_MS = 90_000;
const REVEAL_MS = 8_000;
const MAX_ANSWER_LENGTH = 120;
const DEFAULT_ROUNDS = 5;

/**
 * One question, one liar, everybody else honest.
 *
 * The answers only mean anything next to each other, so they stay sealed until
 * the last one is in. The liar is drawn fresh every round: nobody is stuck
 * lying all evening, and nobody is safe.
 */
async function startRound(ctx: MutationCtx, session: Doc<"gameSessions">, usedContentIds: string[]) {
  const room = await ctx.db.get(session.roomId);
  const adultAllowed = room?.settings?.adult === true;
  const { items } = await pickForGame(ctx, session.gameId, 12);
  const allowed = items.filter((item) => adultAllowed || item.metadata?.adult !== true);
  const question = allowed.find((item) => !usedContentIds.includes(item._id)) ?? allowed[0];
  if (!question) throw new ConvexError("No questions are loaded. Run: npx convex run seed:run");

  const playerIds = session.state.playerIds as string[];
  const liarId = playerIds[Math.floor(Math.random() * playerIds.length)];
  const now = Date.now();

  const roundId = await ctx.db.insert("rounds", {
    sessionId: session._id,
    roundNumber: session.currentRound + 1,
    contentId: question._id,
    status: "active",
    state: { question: question.title, category: question.category, liarId },
    startedAt: now,
  });

  await ctx.db.patch(session._id, {
    currentRound: session.currentRound + 1,
    updatedAt: now,
    state: {
      ...session.state,
      phase: "answering",
      roundId,
      liarId,
      answers: {},
      votes: {},
      deadline: now + ANSWER_MS,
      usedContentIds: [...usedContentIds, question._id],
      reveal: null,
    },
  });

  await ctx.scheduler.runAfter(ANSWER_MS, internal.liar.closeAnswers, {
    sessionId: session._id,
    roundNumber: session.currentRound + 1,
  });
}

export async function startSession(ctx: MutationCtx, session: Doc<"gameSessions">, players: Doc<"roomPlayers">[]) {
  const room = await ctx.db.get(session.roomId);
  const rounds = Math.min(20, Math.max(1, Math.floor(Number(room?.settings?.rounds ?? DEFAULT_ROUNDS))));
  await ctx.db.patch(session._id, {
    totalRounds: rounds,
    state: { ...session.state, playerIds: players.map((player) => player._id) },
  });
  const fresh = await ctx.db.get(session._id);
  if (!fresh) throw new ConvexError("The game could not be started.");
  await startRound(ctx, fresh, []);
}

export const get = query({
  args: { sessionId: v.id("gameSessions") },
  returns: v.any(),
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session?.state?.roundId) return null;
    const game = await ctx.db.get(session.gameId);
    if (game?.slug !== "guess-the-liar") return null;
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
      // The question and the clock still render while auth rehydrates.
    }

    const answering = session.state.phase === "answering";
    const answers = session.state.answers as Record<string, string>;
    const { liarId: _liarId, ...publicRound } = round.state;
    const { liarId: hiddenLiar, ...publicSession } = session.state;

    return {
      game,
      session: {
        ...session,
        state: {
          ...publicSession,
          // An answer nobody has seen yet is worth nothing to the room.
          answers: answering ? {} : answers,
          answered: Object.keys(answers),
          // The liar is named only once the votes are in.
          liarId: session.state.phase === "revealing" || session.state.phase === "finished" ? hiddenLiar : null,
        },
      },
      round: { ...round, state: publicRound },
      players,
      me: me
        ? {
            ...me,
            isLiar: me._id === round.state.liarId,
            answer: answers[me._id] ?? null,
            vote: (session.state.votes as Record<string, string>)[me._id] ?? null,
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

export const submitAnswer = mutation({
  args: { sessionId: v.id("gameSessions"), text: v.string() },
  returns: v.null(),
  handler: async (ctx, { sessionId, text }) => {
    const session = await ctx.db.get(sessionId);
    if (!session?.state?.roundId) throw new ConvexError("Game not found.");
    if (session.state.phase !== "answering") throw new ConvexError("Answers are closed.");
    const player = await playerIn(ctx, session);
    if (session.state.answers[player._id] !== undefined) throw new ConvexError("You already answered.");

    const clean = text.trim().slice(0, MAX_ANSWER_LENGTH);
    if (!clean) throw new ConvexError("Write something first.");

    await ctx.db.insert("submissions", {
      roundId: session.state.roundId as Id<"rounds">,
      playerId: player._id,
      action: "answer",
      result: { text: clean },
      score: 0,
      createdAt: Date.now(),
    });

    const answers = { ...session.state.answers, [player._id]: clean };
    await ctx.db.patch(session._id, { updatedAt: Date.now(), state: { ...session.state, answers } });

    const waiting = (session.state.playerIds as string[]).filter((id) => answers[id] === undefined);
    if (waiting.length === 0) {
      const fresh = await ctx.db.get(sessionId);
      if (fresh) await openVoting(ctx, fresh);
    }
    return null;
  },
});

/** Deadline on answers. Anyone who stayed quiet simply has no answer up. */
export const closeAnswers = internalMutation({
  args: { sessionId: v.id("gameSessions"), roundNumber: v.number() },
  returns: v.null(),
  handler: async (ctx, { sessionId, roundNumber }) => {
    const session = await ctx.db.get(sessionId);
    if (!session?.state?.roundId) return null;
    if (session.state.phase !== "answering" || session.currentRound !== roundNumber) return null;
    await openVoting(ctx, session);
    return null;
  },
});

async function openVoting(ctx: MutationCtx, session: Doc<"gameSessions">) {
  const now = Date.now();
  await ctx.db.patch(session._id, {
    updatedAt: now,
    state: { ...session.state, phase: "voting", deadline: now + VOTE_MS },
  });
  await ctx.scheduler.runAfter(VOTE_MS, internal.liar.closeVoting, {
    sessionId: session._id,
    roundNumber: session.currentRound,
  });
}

export const vote = mutation({
  args: { sessionId: v.id("gameSessions"), targetPlayerId: v.id("roomPlayers") },
  returns: v.null(),
  handler: async (ctx, { sessionId, targetPlayerId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session?.state?.roundId) throw new ConvexError("Game not found.");
    if (session.state.phase !== "voting") throw new ConvexError("Voting is not open.");
    const player = await playerIn(ctx, session);
    if (player._id === targetPlayerId) throw new ConvexError("You cannot vote for yourself.");
    if (!(session.state.playerIds as string[]).includes(targetPlayerId)) {
      throw new ConvexError("That player is not in this round.");
    }

    const votes = { ...session.state.votes, [player._id]: targetPlayerId };
    await ctx.db.patch(session._id, { updatedAt: Date.now(), state: { ...session.state, votes } });

    const waiting = (session.state.playerIds as string[]).filter((id) => votes[id] === undefined);
    if (waiting.length === 0) {
      const fresh = await ctx.db.get(sessionId);
      if (fresh) await reveal(ctx, fresh);
    }
    return null;
  },
});

export const closeVoting = internalMutation({
  args: { sessionId: v.id("gameSessions"), roundNumber: v.number() },
  returns: v.null(),
  handler: async (ctx, { sessionId, roundNumber }) => {
    const session = await ctx.db.get(sessionId);
    if (!session?.state?.roundId) return null;
    if (session.state.phase !== "voting" || session.currentRound !== roundNumber) return null;
    await reveal(ctx, session);
    return null;
  },
});

/**
 * Two each for the people who caught the liar. Three for the liar if most of
 * the room pointed somewhere else. Getting away with it has to pay more than
 * being one of several who guessed right.
 */
async function reveal(ctx: MutationCtx, session: Doc<"gameSessions">) {
  const round = await ctx.db.get(session.state.roundId as Id<"rounds">);
  if (!round) return;
  const liarId = session.state.liarId as string;
  const votes = session.state.votes as Record<string, string>;
  const caughtBy = Object.entries(votes)
    .filter(([, target]) => target === liarId)
    .map(([voter]) => voter);
  const cast = Object.keys(votes).length;
  const liarSurvived = caughtBy.length * 2 < cast;

  for (const voterId of caughtBy) {
    const player = await ctx.db.get(voterId as Id<"roomPlayers">);
    if (player) await ctx.db.patch(player._id, { score: player.score + 2 });
  }
  if (liarSurvived) {
    const liar = await ctx.db.get(liarId as Id<"roomPlayers">);
    if (liar) await ctx.db.patch(liar._id, { score: liar.score + 3 });
  }

  const now = Date.now();
  await ctx.db.patch(round._id, { status: "complete", endedAt: now });
  await ctx.db.patch(session._id, {
    updatedAt: now,
    state: {
      ...session.state,
      phase: "revealing",
      reveal: { liarId, caughtBy, liarSurvived, endsAt: now + REVEAL_MS },
    },
  });
  await ctx.scheduler.runAfter(REVEAL_MS, internal.liar.afterReveal, {
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
