import { ConvexError, v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { authComponent } from "./auth";
import { compare, key, MAX_TRIES, pointsFor, type Attrs, type Guess } from "./iplRules";

/**
 * Player of the Day. One IPL player, the same one for everybody, one attempt
 * each, eight tries.
 *
 * The daily is deliberately not a room: there is no host, no lobby and no
 * session. It shares the marking rules with the room game (`iplRules.ts`) and
 * nothing else.
 *
 * Registered players only. A guest has no durable identity, so "once a day"
 * would mean "once per cleared cookie jar", and a leaderboard built on that is
 * not a leaderboard.
 */

// The audience is Indian, so the day turns over at midnight IST rather than
// at midnight UTC, which would flip the puzzle at 5:30 in the morning.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
// How far back to look before a player may come round again.
const NO_REPEAT_DAYS = 60;
const BOARD_SIZE = 20;

export function dateKeyFor(now: number) {
  return new Date(now + IST_OFFSET_MS).toISOString().slice(0, 10);
}

function previousKey(dateKey: string) {
  const day = new Date(`${dateKey}T00:00:00.000Z`).getTime() - 24 * 60 * 60 * 1000;
  return new Date(day).toISOString().slice(0, 10);
}

/** The signed-in, non-guest user, or null. */
async function registeredUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
    .first();
  if (!profile || profile.isAnonymous) return null;
  return { userId: identity.subject, profile };
}

async function nameFor(ctx: QueryCtx, userId: string) {
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .first();
  return profile?.username ?? profile?.displayName ?? "Someone";
}

/**
 * Today's puzzle, created on first sight and then left alone.
 *
 * Two people opening a fresh day at the same instant both try to create it;
 * Convex mutations are serializable, so the second one reads the first one's
 * row and takes it.
 */
async function puzzleForToday(ctx: MutationCtx, dateKey: string) {
  const existing = await ctx.db
    .query("dailyPuzzles")
    .withIndex("by_dateKey", (q) => q.eq("dateKey", dateKey))
    .first();
  if (existing) return existing;

  const game = await ctx.db
    .query("games")
    .withIndex("by_slug", (q) => q.eq("slug", "ipl-guessr"))
    .first();
  if (!game) throw new ConvexError("The IPL roster is not loaded. Run: npx convex run seed:run");

  const roster = (
    await ctx.db
      .query("gameContent")
      .withIndex("by_gameId", (q) => q.eq("gameId", game._id))
      .collect()
  ).filter((row) => row.isPublished);
  if (roster.length === 0) throw new ConvexError("The IPL roster is empty.");

  // Nobody should meet the same player twice in two months.
  const recent = await ctx.db.query("dailyPuzzles").order("desc").take(NO_REPEAT_DAYS);
  const spent = new Set(recent.map((row) => row.contentId as string));
  const fresh = roster.filter((row) => !spent.has(row._id));
  const pool = fresh.length > 0 ? fresh : roster;
  const picked = pool[Math.floor(Math.random() * pool.length)];

  const id = await ctx.db.insert("dailyPuzzles", {
    dateKey,
    contentId: picked._id,
    answerName: picked.title,
    answer: picked.metadata as Attrs,
    createdAt: Date.now(),
  });
  const created = await ctx.db.get(id);
  if (!created) throw new ConvexError("Could not open today's puzzle.");
  return created;
}

/**
 * Opens today for the signed-in player: creates the day's puzzle if this is
 * the first visit of the day, and their attempt row if this is their first
 * visit. Safe to call on every mount.
 */
export const start = mutation({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const me = await registeredUser(ctx);
    if (!me) throw new ConvexError("Sign in to play the daily.");
    const dateKey = dateKeyFor(Date.now());
    const puzzle = await puzzleForToday(ctx, dateKey);

    const existing = await ctx.db
      .query("dailyAttempts")
      .withIndex("by_user_and_date", (q) => q.eq("userId", me.userId).eq("dateKey", dateKey))
      .first();
    if (existing) return { dateKey, alreadyStarted: true };

    await ctx.db.insert("dailyAttempts", {
      userId: me.userId,
      dateKey,
      puzzleId: puzzle._id,
      guesses: [],
      finished: false,
      score: 0,
      startedAt: Date.now(),
    });
    return { dateKey, alreadyStarted: false };
  },
});

/**
 * Today, as this player sees it. The answer is in the payload only once they
 * are finished with it, so an open attempt cannot be read out of the network
 * tab.
 */
export const today = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const dateKey = dateKeyFor(Date.now());
    const me = await registeredUser(ctx);
    if (!me) return { dateKey, registered: false, attempt: null, maxTries: MAX_TRIES };

    const attempt = await ctx.db
      .query("dailyAttempts")
      .withIndex("by_user_and_date", (q) => q.eq("userId", me.userId).eq("dateKey", dateKey))
      .first();
    if (!attempt) {
      return { dateKey, registered: true, attempt: null, maxTries: MAX_TRIES };
    }

    const puzzle = attempt.finished ? await ctx.db.get(attempt.puzzleId) : null;
    return {
      dateKey,
      registered: true,
      maxTries: MAX_TRIES,
      attempt: {
        guesses: attempt.guesses as Guess[],
        finished: attempt.finished,
        solvedInTries: attempt.solvedInTries ?? null,
        score: attempt.score,
        elapsedMs: attempt.elapsedMs ?? null,
      },
      answer: puzzle ? { name: puzzle.answerName, ...(puzzle.answer as Attrs) } : null,
    };
  },
});

/** Runs the streak and the running total after an attempt closes. */
async function recordDay(
  ctx: MutationCtx,
  userId: string,
  { dateKey, solved, score }: { dateKey: string; solved: boolean; score: number }
) {
  const existing = await ctx.db
    .query("dailyStats")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .first();

  if (!existing) {
    await ctx.db.insert("dailyStats", {
      userId,
      totalScore: score,
      daysPlayed: 1,
      daysSolved: solved ? 1 : 0,
      currentStreak: solved ? 1 : 0,
      bestStreak: solved ? 1 : 0,
      lastDateKey: dateKey,
    });
    return;
  }

  // A solved day extends the run only if yesterday was also solved. A missed
  // or failed day ends it.
  const continues = solved && existing.currentStreak > 0 && existing.lastDateKey === previousKey(dateKey);
  const currentStreak = solved ? (continues ? existing.currentStreak + 1 : 1) : 0;

  await ctx.db.patch(existing._id, {
    totalScore: existing.totalScore + score,
    daysPlayed: existing.daysPlayed + 1,
    daysSolved: existing.daysSolved + (solved ? 1 : 0),
    currentStreak,
    bestStreak: Math.max(existing.bestStreak, currentStreak),
    lastDateKey: dateKey,
  });
}

export const guess = mutation({
  args: { name: v.string() },
  returns: v.any(),
  handler: async (ctx, { name }) => {
    const me = await registeredUser(ctx);
    if (!me) throw new ConvexError("Sign in to play the daily.");
    const dateKey = dateKeyFor(Date.now());

    const attempt = await ctx.db
      .query("dailyAttempts")
      .withIndex("by_user_and_date", (q) => q.eq("userId", me.userId).eq("dateKey", dateKey))
      .first();
    if (!attempt) throw new ConvexError("Open today's puzzle first.");
    if (attempt.finished) throw new ConvexError("You have already played today.");

    const mine = attempt.guesses as Guess[];
    if (mine.length >= MAX_TRIES) throw new ConvexError("You are out of guesses.");

    const wanted = key(name);
    if (!wanted) throw new ConvexError("Type a player name first.");
    if (mine.some((entry) => key(entry.name) === wanted)) {
      throw new ConvexError("You already guessed that one.");
    }

    const puzzle = await ctx.db.get(attempt.puzzleId);
    if (!puzzle) throw new ConvexError("Today's puzzle is missing.");

    const game = await ctx.db
      .query("games")
      .withIndex("by_slug", (q) => q.eq("slug", "ipl-guessr"))
      .first();
    if (!game) throw new ConvexError("The IPL roster is not loaded.");
    const picked = (
      await ctx.db
        .query("gameContent")
        .withIndex("by_gameId", (q) => q.eq("gameId", game._id))
        .collect()
    ).find((row) => row.isPublished && key(row.title) === wanted);
    if (!picked) throw new ConvexError("No IPL player by that name. Pick one from the list.");

    const attrs = picked.metadata as Attrs;
    const correct = picked._id === puzzle.contentId;
    const entry: Guess = {
      name: picked.title,
      ...attrs,
      correct,
      marks: compare(attrs, puzzle.answer as Attrs),
    };

    const guesses = [...mine, entry];
    const tries = guesses.length;
    const done = correct || tries >= MAX_TRIES;
    const now = Date.now();

    await ctx.db.patch(attempt._id, {
      guesses,
      // The clock starts on the first guess, not when the page opened. Opening
      // the daily and going to make tea should not cost you the tiebreak.
      startedAt: mine.length === 0 ? now : attempt.startedAt,
      finished: done,
      solvedInTries: correct ? tries : undefined,
      score: correct ? pointsFor(tries) : 0,
      elapsedMs: done ? now - (mine.length === 0 ? now : attempt.startedAt) : undefined,
      finishedAt: done ? now : undefined,
    });

    if (done) {
      await recordDay(ctx, me.userId, {
        dateKey,
        solved: correct,
        score: correct ? pointsFor(tries) : 0,
      });
    }
    return { correct, tries, finished: done };
  },
});

/**
 * Today's board. Fewest guesses first, and the clock breaks the tie, so being
 * quick is worth something without being worth more than being right.
 */
export const dailyBoard = query({
  args: { dateKey: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, { dateKey }) => {
    const day = dateKey ?? dateKeyFor(Date.now());
    const rows = await ctx.db
      .query("dailyAttempts")
      .withIndex("by_date_and_score", (q) => q.eq("dateKey", day))
      .order("desc")
      .take(100);

    const finished = rows.filter((row) => row.finished);
    finished.sort(
      (a, b) => b.score - a.score || (a.elapsedMs ?? Infinity) - (b.elapsedMs ?? Infinity)
    );

    return await Promise.all(
      finished.slice(0, BOARD_SIZE).map(async (row, index) => ({
        rank: index + 1,
        userId: row.userId,
        name: await nameFor(ctx, row.userId),
        tries: row.solvedInTries ?? null,
        score: row.score,
        elapsedMs: row.elapsedMs ?? null,
      }))
    );
  },
});

/** The all-time board. One row per player, highest running total first. */
export const globalBoard = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("dailyStats")
      .withIndex("by_totalScore")
      .order("desc")
      .take(BOARD_SIZE);
    return await Promise.all(
      rows.map(async (row, index) => ({
        rank: index + 1,
        userId: row.userId,
        name: await nameFor(ctx, row.userId),
        totalScore: row.totalScore,
        daysPlayed: row.daysPlayed,
        daysSolved: row.daysSolved,
        currentStreak: row.currentStreak,
        bestStreak: row.bestStreak,
      }))
    );
  },
});

/** The signed-in player's own daily record, or null for a guest. */
export const myDaily = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const me = await registeredUser(ctx);
    if (!me) return null;
    return await ctx.db
      .query("dailyStats")
      .withIndex("by_userId", (q) => q.eq("userId", me.userId))
      .first();
  },
});
