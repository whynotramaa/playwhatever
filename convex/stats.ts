import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

/**
 * Platform-owned player statistics. Games call this at the end of a session
 * and never touch the table themselves.
 *
 * Guests are skipped on purpose: a guest has no profile row, and PLAN.md
 * phase 12 keeps anonymous scores out of the permanent record until the
 * player links an account.
 */
export async function recordGameResult(
  ctx: MutationCtx,
  userId: string,
  { won, score, gameSlug }: { won: boolean; score: number; gameSlug: string }
) {
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .first();
  if (!profile) return;

  // The all-games row and this game's row, same numbers.
  for (const slug of ["", gameSlug]) {
    const existing = await ctx.db
      .query("playerStats")
      .withIndex("by_user_and_game", (q) => q.eq("userId", userId).eq("gameSlug", slug))
      .first();
    const now = Date.now();

    if (!existing) {
      await ctx.db.insert("playerStats", {
        userId,
        gameSlug: slug,
        gamesPlayed: 1,
        gamesWon: won ? 1 : 0,
        // Only games that score rounds write this. Traitors does not.
        roundsWon: 0,
        totalScore: score,
        highestScore: score,
        favoriteGame: slug === "" ? gameSlug : undefined,
        lastPlayedAt: now,
      });
      continue;
    }

    await ctx.db.patch(existing._id, {
      gamesPlayed: existing.gamesPlayed + 1,
      gamesWon: existing.gamesWon + (won ? 1 : 0),
      totalScore: existing.totalScore + score,
      highestScore: Math.max(existing.highestScore, score),
      lastPlayedAt: now,
    });
  }
}

/**
 * Closes a session for every game: room status, then one stats row per player.
 *
 * Scores are already on the roomPlayers rows by the time this runs. A game
 * module decides who won; the platform decides what that means for the record.
 */
export async function finishSession(
  ctx: MutationCtx,
  session: Doc<"gameSessions">,
  winnerIds: string[]
) {
  const players = await ctx.db
    .query("roomPlayers")
    .withIndex("by_roomId", (q) => q.eq("roomId", session.roomId))
    .take(12);
  const game = await ctx.db.get(session.gameId);
  for (const player of players) {
    await recordGameResult(ctx, player.userId, {
      won: winnerIds.includes(player._id),
      score: player.score,
      gameSlug: game?.slug ?? "",
    });
  }
  await ctx.db.patch(session.roomId, { status: "finished", finishedAt: Date.now() });
}

/** Highest score takes it. A tie is a shared win, not a coin flip. */
export function topScorers(players: Doc<"roomPlayers">[]) {
  const best = Math.max(...players.map((player) => player.score));
  return players.filter((player) => player.score === best).map((player) => player._id as string);
}

/** Top scorers, all games or one of them. `gameSlug: ""` is the global board. */
export const leaderboard = query({
  args: { gameSlug: v.optional(v.string()) },
  handler: async (ctx, { gameSlug }) => {
    const rows = await ctx.db
      .query("playerStats")
      .withIndex("by_game_and_score", (q) => q.eq("gameSlug", gameSlug ?? ""))
      .order("desc")
      .take(20);
    return await Promise.all(
      rows.map(async (row) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", row.userId))
          .first();
        return {
          userId: row.userId,
          name: profile?.username ?? profile?.displayName ?? "Someone",
          gamesPlayed: row.gamesPlayed,
          gamesWon: row.gamesWon,
          totalScore: row.totalScore,
          highestScore: row.highestScore,
        };
      })
    );
  },
});

/** Every stats row for the signed-in user. Empty for guests, by design. */
export const myStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("playerStats")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});
