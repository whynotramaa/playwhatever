import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query, type MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { authComponent } from "./auth";
import { pickForGame } from "./content";
import { finishSession } from "./stats";

const MAX_PLAYERS = 12;
const REVEAL_MS = 7_000;
const MAX_GUESS_LENGTH = 60;
const DEFAULT_TURN_MS = 30_000;
const DEFAULT_TRIES = 3;

/**
 * A guess is typed, not spoken, so it is compared with the keyboard taken out
 * of it: case, spaces, punctuation and the difference between "&" and "and"
 * are not what the round is about.
 */
function normalize(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");
}

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

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
 * Deals a round: one guesser, everybody else holding the same word.
 *
 * The guesser rotates by round number rather than at random, so over a full
 * game everybody sits in the chair the same number of times. The word is
 * written into the round row, never into the session state, because the
 * session state is what the guesser's screen subscribes to.
 */
async function startRound(ctx: MutationCtx, session: Doc<"gameSessions">, usedContentIds: string[]) {
  const { items } = await pickForGame(ctx, session.gameId, 24);
  const word = items.find((item) => !usedContentIds.includes(item._id)) ?? items[0];
  if (!word) throw new ConvexError("No words are loaded. Run: npx convex run seed:run");

  const playerIds = session.state.playerIds as string[];
  const roundNumber = session.currentRound + 1;
  const guesserId = playerIds[(roundNumber - 1) % playerIds.length];
  // Fresh order every round, so the same person is not always opening.
  const clueOrder = shuffle(playerIds.filter((id) => id !== guesserId)) as Id<"roomPlayers">[];
  const turnMs = session.state.turnDurationMs as number;
  const now = Date.now();

  const roundId = await ctx.db.insert("rounds", {
    sessionId: session._id,
    roundNumber,
    contentId: word._id,
    status: "active",
    state: {
      word: word.title,
      aliases: (word.metadata?.aliases as string[] | undefined) ?? [],
      category: word.category,
      guesserId,
    },
    startedAt: now,
  });

  await ctx.db.patch(session._id, {
    currentRound: roundNumber,
    updatedAt: now,
    state: {
      ...session.state,
      phase: "clueing",
      roundId,
      guesserId,
      clueOrder,
      currentIndex: 0,
      turnStartedAt: now,
      triesLeft: session.state.maxTries,
      guesses: [],
      usedContentIds: [...usedContentIds, word._id],
      reveal: null,
    },
  });

  await ctx.scheduler.runAfter(turnMs, internal.charades.autoAdvanceTurn, {
    sessionId: session._id,
    roundId,
    playerId: clueOrder[0],
  });
}

export async function startSession(ctx: MutationCtx, session: Doc<"gameSessions">, players: Doc<"roomPlayers">[]) {
  const room = await ctx.db.get(session.roomId);
  const playerIds = players.map((player) => player._id);
  // One turn in the chair each. That is the game, not a setting.
  await ctx.db.patch(session._id, {
    totalRounds: playerIds.length,
    state: {
      ...session.state,
      playerIds,
      turnDurationMs: Number(room?.settings?.timerSeconds ?? 30) * 1000 || DEFAULT_TURN_MS,
      maxTries: Number(room?.settings?.maxTries ?? DEFAULT_TRIES),
      // Tries spent across the game. Never scores; breaks ties at the end.
      triesUsed: {},
    },
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
    if (game?.slug !== "dumb-charadess") return null;
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
      // The clock and the turn order still render while auth rehydrates.
    }

    // The whole game is who can see this string. It goes to everyone except
    // the person guessing, and to nobody at all until the round is over.
    const isGuesser = me?._id === session.state.guesserId;
    const over = session.state.phase === "revealing" || session.state.phase === "finished";
    const { word, aliases: _aliases, ...publicRound } = round.state;

    return {
      game,
      session,
      round: { ...round, state: { ...publicRound, word: isGuesser && !over ? null : word } },
      players,
      me: me ? { ...me, isGuesser } : null,
    };
  },
});

/** Ends the current clue-giver's turn, whether they passed or ran out. */
async function advanceTurn(ctx: MutationCtx, session: Doc<"gameSessions">, expectedPlayerId: string) {
  const state = session.state;
  if (state.phase !== "clueing" || state.clueOrder[state.currentIndex] !== expectedPlayerId) return;

  const nextIndex = state.currentIndex + 1;
  if (nextIndex >= state.clueOrder.length) {
    // Everybody has had a go and the word is still standing.
    await endRound(ctx, session, false, "Nobody's clue landed.");
    return;
  }

  const now = Date.now();
  await ctx.db.patch(session._id, {
    updatedAt: now,
    state: { ...state, currentIndex: nextIndex, turnStartedAt: now },
  });
  await ctx.scheduler.runAfter(state.turnDurationMs, internal.charades.autoAdvanceTurn, {
    sessionId: session._id,
    roundId: state.roundId as Id<"rounds">,
    playerId: state.clueOrder[nextIndex] as Id<"roomPlayers">,
  });
}

export const passTurn = mutation({
  args: { sessionId: v.id("gameSessions") },
  returns: v.null(),
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session?.state?.roundId) throw new ConvexError("Game not found.");
    const player = await playerIn(ctx, session);
    if (session.state.phase !== "clueing" || session.state.clueOrder[session.state.currentIndex] !== player._id) {
      throw new ConvexError("It is not your turn.");
    }
    await advanceTurn(ctx, session, player._id);
    return null;
  },
});

export const autoAdvanceTurn = internalMutation({
  args: { sessionId: v.id("gameSessions"), roundId: v.id("rounds"), playerId: v.id("roomPlayers") },
  returns: v.null(),
  handler: async (ctx, { sessionId, roundId, playerId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session?.state?.roundId) return null;
    // A stale timer from a turn that was already passed must not skip anyone.
    if (session.state.roundId !== roundId) return null;
    await advanceTurn(ctx, session, playerId);
    return null;
  },
});

/**
 * The guesser's only move.
 *
 * Wrong guesses cost a try, not a point: the minus lands once, at the end of
 * the round, however many tries it took to get there. Tries spent are kept
 * because they are the tiebreak on the final board, not because they score.
 */
export const guess = mutation({
  args: { sessionId: v.id("gameSessions"), text: v.string() },
  returns: v.null(),
  handler: async (ctx, { sessionId, text }) => {
    const session = await ctx.db.get(sessionId);
    if (!session?.state?.roundId) throw new ConvexError("Game not found.");
    if (session.state.phase !== "clueing") throw new ConvexError("This round is over.");
    const player = await playerIn(ctx, session);
    if (player._id !== session.state.guesserId) throw new ConvexError("You are not guessing this round.");
    if (session.state.triesLeft <= 0) throw new ConvexError("You are out of tries.");

    const clean = text.trim().slice(0, MAX_GUESS_LENGTH);
    if (!clean) throw new ConvexError("Type something first.");

    const round = await ctx.db.get(session.state.roundId as Id<"rounds">);
    if (!round) throw new ConvexError("Game not found.");
    const answers = [round.state.word as string, ...((round.state.aliases as string[]) ?? [])];
    const correct = answers.some((answer) => normalize(answer) === normalize(clean));

    const triesLeft = session.state.triesLeft - 1;
    const triesUsed = {
      ...session.state.triesUsed,
      [player._id]: (session.state.triesUsed?.[player._id] ?? 0) + 1,
    };

    await ctx.db.insert("submissions", {
      roundId: round._id,
      playerId: player._id,
      action: "guess",
      result: { text: clean, correct },
      score: 0,
      createdAt: Date.now(),
    });

    await ctx.db.patch(session._id, {
      updatedAt: Date.now(),
      state: {
        ...session.state,
        triesLeft,
        triesUsed,
        guesses: [...session.state.guesses, { text: clean, correct }],
      },
    });

    if (correct || triesLeft <= 0) {
      const fresh = await ctx.db.get(sessionId);
      if (fresh) await endRound(ctx, fresh, correct, correct ? null : "Out of tries.");
    }
    return null;
  },
});

/** One point for getting there, one point off for not. Nothing else scores. */
async function endRound(
  ctx: MutationCtx,
  session: Doc<"gameSessions">,
  correct: boolean,
  reason: string | null
) {
  const round = await ctx.db.get(session.state.roundId as Id<"rounds">);
  if (!round || round.status === "complete") return;

  const guesser = await ctx.db.get(session.state.guesserId as Id<"roomPlayers">);
  if (guesser) await ctx.db.patch(guesser._id, { score: guesser.score + (correct ? 1 : -1) });

  const now = Date.now();
  await ctx.db.patch(round._id, { status: "complete", endedAt: now });
  await ctx.db.patch(session._id, {
    updatedAt: now,
    state: {
      ...session.state,
      phase: "revealing",
      reveal: {
        word: round.state.word,
        category: round.state.category,
        guesserId: session.state.guesserId,
        guesserName: guesser?.displayName ?? "They",
        correct,
        reason,
        triesUsed: session.state.maxTries - session.state.triesLeft,
        endsAt: now + REVEAL_MS,
      },
    },
  });
  await ctx.scheduler.runAfter(REVEAL_MS, internal.charades.afterReveal, {
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
      await finish(ctx, session);
      return null;
    }
    await startRound(ctx, session, (session.state.usedContentIds as string[]) ?? []);
    return null;
  },
});

/**
 * Top score wins. Where two players tie, the one who spent fewer tries getting
 * there is ahead: tries never move the score during the game, so this is the
 * only place they matter, which is what keeps a cautious player from being
 * punished mid-game for thinking out loud.
 */
async function finish(ctx: MutationCtx, session: Doc<"gameSessions">) {
  const players = (
    await ctx.db
      .query("roomPlayers")
      .withIndex("by_roomId", (q) => q.eq("roomId", session.roomId))
      .take(MAX_PLAYERS)
  ).filter((player) => player.status !== "removed");

  const triesUsed = (session.state.triesUsed ?? {}) as Record<string, number>;
  const best = Math.max(...players.map((player) => player.score));
  const leaders = players.filter((player) => player.score === best);
  const fewest = Math.min(...leaders.map((player) => triesUsed[player._id] ?? 0));
  const winnerIds = leaders
    .filter((player) => (triesUsed[player._id] ?? 0) === fewest)
    .map((player) => player._id as string);

  await ctx.db.patch(session._id, {
    updatedAt: Date.now(),
    state: { ...session.state, phase: "finished", winnerIds, triesUsed },
  });
  await finishSession(ctx, session, winnerIds);
}
