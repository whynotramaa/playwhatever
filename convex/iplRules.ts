/**
 * The rules of an IPL guess, shared by the multiplayer room game (`ipl.ts`)
 * and the daily Player of the Day (`daily.ts`).
 *
 * Both modes ask the same question and mark it the same way, so the marking
 * lives here rather than being written twice and drifting.
 */
export const MAX_TRIES = 8;

export type Attrs = {
  team: string;
  country: string;
  role: string;
  bat: string;
  born: number;
  debut: number;
};

export type Mark = "hit" | "miss" | "up" | "down";

export type Guess = Attrs & {
  name: string;
  correct: boolean;
  marks: Record<keyof Attrs, Mark>;
};

/** Name matching is forgiving about spacing, case and punctuation, nothing else. */
export const key = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

/** `up` means the answer sits above the guess, so guess higher next time. */
export function compare(guess: Attrs, answer: Attrs): Record<keyof Attrs, Mark> {
  const same = (a: string, b: string): Mark => (a === b ? "hit" : "miss");
  const near = (a: number, b: number): Mark => (a === b ? "hit" : a < b ? "up" : "down");
  return {
    team: same(guess.team, answer.team),
    country: same(guess.country, answer.country),
    role: same(guess.role, answer.role),
    bat: same(guess.bat, answer.bat),
    born: near(guess.born, answer.born),
    debut: near(guess.debut, answer.debut),
  };
}

/** Eight for a first-guess call, one for scraping in on the last try. */
export const pointsFor = (tries: number) => Math.max(1, MAX_TRIES + 1 - tries);
