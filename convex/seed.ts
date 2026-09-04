import { internalMutation } from "./_generated/server";
import { GAMES } from "./seed/games";
import { PAIRS } from "./seed/traitors";
import { QUESTIONS } from "./seed/liar";
import { PLAYERS } from "./seed/ipl";
import { WORDS } from "./seed/charades";

/**
 * Idempotent seed. Run with:
 *   npx convex run seed:run
 *
 * Games are matched on slug and patched, because there are six of them and
 * they are structural. Content is inserted only when a record with the same
 * title does not already exist for that game, so re-running never clobbers an
 * edit somebody made in the dashboard (PLAN.md phase 15).
 */
export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    let gamesInserted = 0;
    let gamesUpdated = 0;

    const gameIdBySlug = new Map<string, string>();

    for (const game of GAMES) {
      const existing = await ctx.db
        .query("games")
        .withIndex("by_slug", (q) => q.eq("slug", game.slug))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, game);
        gameIdBySlug.set(game.slug, existing._id);
        gamesUpdated += 1;
      } else {
        const id = await ctx.db.insert("games", game);
        gameIdBySlug.set(game.slug, id);
        gamesInserted += 1;
      }
    }

    let contentInserted = 0;
    let contentSkipped = 0;

    // One read per game rather than one per record.
    const seenTitles = new Map<string, Set<string>>();
    for (const [slug, gameId] of gameIdBySlug) {
      const rows = await ctx.db
        .query("gameContent")
        .withIndex("by_gameId", (q) => q.eq("gameId", gameId as never))
        .collect();
      seenTitles.set(slug, new Set(rows.map((r) => r.title)));
    }

    for (const item of [...PAIRS, ...QUESTIONS, ...PLAYERS, ...WORDS]) {
      const gameId = gameIdBySlug.get(item.gameSlug);
      if (!gameId) {
        throw new Error(`Content references unknown game slug: ${item.gameSlug}`);
      }
      const titles = seenTitles.get(item.gameSlug)!;
      if (titles.has(item.title)) {
        contentSkipped += 1;
        continue;
      }
      const { gameSlug: _slug, ...rest } = item;
      await ctx.db.insert("gameContent", {
        ...rest,
        gameId: gameId as never,
        isPublished: true,
      });
      titles.add(item.title);
      contentInserted += 1;
    }

    return { gamesInserted, gamesUpdated, contentInserted, contentSkipped };
  },
});

/**
 * Deletes any game that is no longer in the seed, and all of its content.
 *
 * `seed/games.ts` is the shelf. Anything in the database that is not on it was
 * dropped on purpose, so this is how it leaves:
 *   npx convex run seed:pruneRemovedGames
 */
export const pruneRemovedGames = internalMutation({
  args: {},
  handler: async (ctx) => {
    const keep = new Set(GAMES.map((game) => game.slug));
    const games = await ctx.db.query("games").collect();
    let gamesDeleted = 0;
    let contentDeleted = 0;
    for (const game of games) {
      if (keep.has(game.slug)) continue;
      const rows = await ctx.db
        .query("gameContent")
        .withIndex("by_gameId", (q) => q.eq("gameId", game._id))
        .collect();
      for (const row of rows) {
        await ctx.db.delete(row._id);
        contentDeleted += 1;
      }
      await ctx.db.delete(game._id);
      gamesDeleted += 1;
    }
    return { gamesDeleted, contentDeleted };
  },
});
