import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

export type ContentFilter = {
  region?: "india" | "south_asia" | "global" | "mixed";
  category?: string;
  difficulty?: string;
};

const published = (rows: Doc<"gameContent">[]) => rows.filter((r) => r.isPublished);

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Picks content for a round. This is the whole point of the content layer: a
 * game module asks for what it wants and never learns how any of it is stored.
 *
 * Widens the filter rather than returning short (PLAN.md phase 4 item 7).
 * Narrow filters on a young corpus would otherwise hand a game two items and
 * a broken round. The returned `widened` flag says whether that happened.
 *
 * Call this from a mutation or action. It uses Math.random, so calling it from
 * a query would make that query uncacheable.
 */
export async function pickForGame(
  ctx: QueryCtx | MutationCtx,
  gameId: Id<"games">,
  count: number,
  filter: ContentFilter = {}
): Promise<{ items: Doc<"gameContent">[]; widened: boolean }> {
  const all = published(
    await ctx.db
      .query("gameContent")
      .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
      .collect()
  );

  // Most specific first, then drop one constraint at a time.
  const tiers = [
    all.filter(
      (r) =>
        (!filter.region || r.region === filter.region) &&
        (!filter.category || r.category === filter.category) &&
        (!filter.difficulty || r.difficulty === filter.difficulty)
    ),
    all.filter(
      (r) =>
        (!filter.region || r.region === filter.region) &&
        (!filter.category || r.category === filter.category)
    ),
    all.filter((r) => !filter.category || r.category === filter.category),
    all,
  ];

  for (let i = 0; i < tiers.length; i += 1) {
    if (tiers[i].length >= count) {
      return { items: shuffle(tiers[i]).slice(0, count), widened: i > 0 };
    }
  }
  // Corpus genuinely cannot fill the round. Hand back everything there is.
  return { items: shuffle(all).slice(0, count), widened: true };
}

/** Browse content. For the dashboard and for checking corpus coverage. */
export const listForGame = query({
  args: {
    gameId: v.id("games"),
    region: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, { gameId, region, category }) => {
    const rows = published(
      await ctx.db
        .query("gameContent")
        .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
        .collect()
    );
    return rows.filter(
      (r) => (!region || r.region === region) && (!category || r.category === category)
    );
  },
});

/** Per-game counts by region, so gaps in the corpus are visible. */
export const coverage = query({
  args: {},
  handler: async (ctx) => {
    const games = await ctx.db.query("games").collect();
    const rows = await ctx.db.query("gameContent").collect();
    return games.map((game) => {
      const mine = rows.filter((r) => r.gameId === game._id);
      const indian = mine.filter((r) => r.region === "india" || r.region === "south_asia");
      return {
        slug: game.slug,
        name: game.name,
        total: mine.length,
        indian: indian.length,
        global: mine.filter((r) => r.region === "global").length,
        categories: [...new Set(mine.map((r) => r.category))].sort(),
      };
    });
  },
});
