/** Room codes are six characters, A-Z and 0-9. Typed in two places, shaped here. */
export const normalizeRoomCode = (value: string) =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);

export const ROOM_CODE_LENGTH = 6;

/** Games carry categories, not a region field. This reads one off the other. */
export function regionLabel(categories: string[]) {
  const indian = categories.includes("Indian");
  const global = categories.includes("Global");
  if (indian && global) return "India & Global";
  return indian ? "India" : global ? "Global" : categories[0] ?? "Party";
}

export type SettingKey = "rounds" | "adult" | "timer" | "tries";

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
};

export const settingsFor = (slug: string) => GAME_SETTINGS[slug] ?? [];
