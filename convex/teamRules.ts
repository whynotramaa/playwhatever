/**
 * The rules of an auction, shared by the game module (`team.ts`), the host's
 * setup dialog and the play screen. Everything here is a fact both sides of
 * the wire have to agree on, so it is written once.
 */

/** The pools a host can auction. `key` is the `category` on a content row. */
export const TEAM_CATEGORIES = [
  { key: "cricket", label: "Cricketers", blurb: "IPL, India, and the greats of the world game." },
  { key: "football", label: "Footballers", blurb: "Europe, South America, and one from Bengaluru." },
  { key: "bollywood", label: "Film stars", blurb: "Bollywood, plus the south when it matters." },
  { key: "characters", label: "Film characters", blurb: "Gabbar, Rancho, Rocky bhai and the rest." },
  { key: "movies", label: "Movies", blurb: "Everything a room can argue about after dinner." },
] as const;

export type TeamCategory = (typeof TEAM_CATEGORIES)[number]["key"];

export const categoryLabel = (key: string) =>
  TEAM_CATEGORIES.find((entry) => entry.key === key)?.label ?? "Mixed bag";

export const DEFAULT_CATEGORY: TeamCategory = "cricket";

/** The keypad. Six buttons, so a raise is never more than one tap. */
export const RAISES = [1, 2, 3, 4, 5, 6] as const;

export const DEFAULT_BUDGET = 20;
export const BUDGET_MIN = 5;
export const BUDGET_MAX = 200;

export const POOL_MIN = 3;
export const POOL_MAX = 30;

/** Seconds a player has to raise or walk before the auctioneer moves on. */
export const TURN_SECONDS = 20;

/**
 * Where a squad lands. Tiers are cut against the best squad in the room, not
 * against an absolute number, because the pool a room bought from is the only
 * thing its scores mean anything against.
 */
export type Tier = "S" | "A" | "B" | "C";

export function tierFor(score: number, best: number): Tier {
  if (best <= 0) return "C";
  const share = score / best;
  if (share >= 0.9) return "S";
  if (share >= 0.75) return "A";
  if (share >= 0.55) return "B";
  return "C";
}

export const TIER_ORDER: Tier[] = ["S", "A", "B", "C"];

export const TIER_COLOR: Record<Tier, string> = {
  S: "#f4e900",
  A: "#ff6652",
  B: "#a8baff",
  C: "#8c8b99",
};
