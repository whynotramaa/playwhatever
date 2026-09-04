import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Published games, in shelf order.
 *
 * No server-side search. There are six games, so the client filters the list
 * it already has. Revisit if the catalogue ever outgrows one screen.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("games")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    // An unpublished game is not found as far as players are concerned.
    return game?.isPublished ? game : null;
  },
});
