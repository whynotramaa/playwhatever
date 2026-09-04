import type { MetadataRoute } from "next";

/**
 * Rooms, sign-in and the join flow are all one-off screens tied to a person or
 * a code. There is nothing on them worth indexing and every one of them would
 * be a dead link by the time a crawler came back.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/rooms/", "/join/", "/login", "/welcome", "/api/"],
    },
    sitemap: "https://playwhatever.ramaa.tech/sitemap.xml",
  };
}
