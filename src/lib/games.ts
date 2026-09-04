/** Room codes are six characters, A-Z and 0-9. Typed in two places, shaped here. */
export const normalizeRoomCode = (value: string) =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);

export const ROOM_CODE_LENGTH = 6;

/**
 * The one tag that says what a game actually is. Every game carries "Popular"
 * and "Indian", and "Quick games" only repeats the clock, so none of those
 * tells you anything on a card.
 */
const SHARED_TAGS = new Set(["Popular", "Indian", "Global", "Quick games"]);

export function genreLabel(categories: string[]) {
  return categories.find((name) => !SHARED_TAGS.has(name)) ?? categories[0] ?? "Party";
}

/**
 * A game's cover art. `ipl-guessr` was re-shot and the old file is still on
 * disk, so the exception lives here rather than being spelled out at each of
 * the three call sites that need a path.
 */
export const artFor = (slug: string) =>
  `/game-art/${slug === "ipl-guessr" ? "ipl-guessr-v2" : slug}.webp`;

/** A game one person can sit down and play on their own, with no room to fill. */
export const hasSolo = (game: { playerMin: number }) => game.playerMin <= 1;

export type SettingKey = "rounds" | "adult" | "timer" | "tries" | "budget" | "pool" | "category";

/**
 * The settings each game supports. Mirrored by `cleanSettings` in
 * `convex/rooms.ts`, which is where they are actually enforced.
 */
export const GAME_SETTINGS: Record<string, SettingKey[]> = {
  traitors: ["adult"],
  // The spicy question pack rides the same switch as the Traitors adult pairs.
  "guess-the-liar": ["rounds", "adult"],
  // Tries are fixed at eight. A wordle with a dial on it is not a wordle.
  "ipl-guessr": ["rounds", "timer"],
  // No rounds dial: the chair goes round the table once, so players set it.
  "dumb-charadess": ["timer", "tries"],
  // The pool is picked in a dialog, because five named choices with a line of
  // explanation each is not a form field.
  "make-your-team": ["category", "budget", "pool"],
};

export const settingsFor = (slug: string) => GAME_SETTINGS[slug] ?? [];
