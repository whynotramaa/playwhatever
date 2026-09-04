import type { MetadataRoute } from "next";
import { POSTS } from "@/content/blog";

const SITE = "https://playwhatever.ramaa.tech";

/**
 * Every page a stranger can open and read. The game and rules rows come off
 * the post list, so a new game with a rules page lands here on the same edit.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const games = POSTS.filter((post) => post.gameSlug).map((post) => ({
    url: `${SITE}/games/${post.gameSlug}`,
    lastModified: now,
    priority: 0.8,
  }));
  const rules = POSTS.map((post) => ({
    url: `${SITE}/blog/${post.slug}`,
    lastModified: now,
    priority: 0.6,
  }));

  return [
    { url: SITE, lastModified: now, priority: 1 },
    { url: `${SITE}/blog`, lastModified: now, priority: 0.7 },
    { url: `${SITE}/daily`, lastModified: now, priority: 0.7 },
    { url: `${SITE}/stats`, lastModified: now, priority: 0.5 },
    ...games,
    ...rules,
  ];
}
