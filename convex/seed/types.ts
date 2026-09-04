/** The shape of a seeded content record, shared by every game's seed file. */
export type ContentSeed = {
  gameSlug: string;
  contentType: "person" | "event" | "meme" | "phrase" | "image" | "prompt" | "pair";
  title: string;
  description?: string;
  region: "india" | "south_asia" | "global" | "mixed";
  category: string;
  difficulty?: "easy" | "medium" | "hard";
  metadata?: Record<string, unknown>;
};
