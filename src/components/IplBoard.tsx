"use client";

import { FormEvent, useMemo, useState, type CSSProperties } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

/**
 * The guess board, shared by the multiplayer room game and the daily Player of
 * the Day. Both modes ask the same question and mark it the same way, so they
 * draw the same grid.
 */
export type Mark = "hit" | "miss" | "up" | "down";

export type Attrs = {
  team: string;
  country: string;
  role: string;
  bat: string;
  born: number;
  debut: number;
};

export type Guess = Attrs & {
  name: string;
  correct: boolean;
  marks: Record<keyof Attrs, Mark>;
};

export const ROLE: Record<string, string> = { bat: "Bat", bowl: "Bowl", all: "All", wk: "WK" };
export const COLUMNS = ["Team", "Nat", "Role", "Bat", "Born", "Debut"] as const;

/** Direction lives in the glyph, so the yellow only ever means "not this". */
const arrow = (mark: Mark) => (mark === "up" ? "↑" : mark === "down" ? "↓" : "");

const cellsOf = (attrs: Attrs): [keyof Attrs, string][] => [
  ["team", attrs.team],
  ["country", attrs.country],
  ["role", ROLE[attrs.role] ?? attrs.role],
  ["bat", attrs.bat],
  ["born", String(attrs.born)],
  ["debut", String(attrs.debut)],
];

function HeadRow() {
  return (
    <div className="ipl-row ipl-head" aria-hidden="true">
      <span className="ipl-cell is-name">Player</span>
      {COLUMNS.map((column) => (
        <span key={column} className="ipl-cell">{column}</span>
      ))}
    </div>
  );
}

function GuessRow({ guess, index }: { guess: Guess; index: number }) {
  return (
    <div className="ipl-row rise-in" style={{ "--i": index } as CSSProperties}>
      <span className="ipl-cell is-name" data-mark={guess.correct ? "hit" : undefined}>
        {guess.name}
      </span>
      {cellsOf(guess).map(([field, value]) => (
        <span key={field} className="ipl-cell" data-mark={guess.marks[field]}>
          {value}
          {arrow(guess.marks[field]) && <b className="ipl-arrow">{arrow(guess.marks[field])}</b>}
        </span>
      ))}
    </div>
  );
}

/** The answer, all green. Shown once the round or the day is over. */
export function IplAnswerRow({ name, attrs }: { name: string; attrs: Attrs }) {
  return (
    <div className="ipl-board">
      <HeadRow />
      <div className="ipl-row">
        <span className="ipl-cell is-name" data-mark="hit">{name}</span>
        {cellsOf(attrs).map(([field, value]) => (
          <span key={field} className="ipl-cell" data-mark="hit">{value}</span>
        ))}
      </div>
    </div>
  );
}

export function IplBoard({ guesses }: { guesses: Guess[] }) {
  return (
    <div className="ipl-board">
      <HeadRow />
      {guesses.length === 0 ? (
        <p className="auth-note">
          Guess anybody. What comes back is green for a match, yellow with an arrow for the
          direction to move.
        </p>
      ) : (
        guesses.map((guess, index) => <GuessRow key={guess.name} guess={guess} index={index} />)
      )}
    </div>
  );
}

/**
 * The guess field. Suggestions are filtered from the roster the client already
 * holds, so typing costs nothing, and Enter takes the top one — nobody should
 * lose a try to the spelling of "Muttiah Muralitharan".
 */
export function IplGuessBox({
  roster,
  guesses,
  pending,
  onGuess,
}: {
  roster: string[] | undefined;
  guesses: Guess[];
  pending: boolean;
  onGuess: (name: string) => void;
}) {
  const [draft, setDraft] = useState("");

  const suggestions = useMemo(() => {
    const typed = draft.trim().toLowerCase();
    if (!typed || !roster) return [];
    const taken = new Set(guesses.map((guess) => guess.name));
    return roster
      .filter((name) => !taken.has(name) && name.toLowerCase().includes(typed))
      .sort((a, b) => a.toLowerCase().indexOf(typed) - b.toLowerCase().indexOf(typed))
      .slice(0, 6);
  }, [draft, roster, guesses]);

  const send = (name: string) => {
    if (!name.trim() || pending) return;
    onGuess(name);
    setDraft("");
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    send(suggestions[0] ?? draft);
  };

  return (
    <form className="auth-stack" onSubmit={submit}>
      <Input
        label="Your guess"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="start typing a name"
        autoComplete="off"
        maxLength={40}
        autoFocus
      />
      {suggestions.length > 0 && (
        <div className="ipl-suggest">
          {suggestions.map((name) => (
            <button key={name} type="button" onClick={() => send(name)} disabled={pending}>
              {name}
            </button>
          ))}
        </div>
      )}
      <Button type="submit" variant="primary" isBlock isLoading={pending} disabled={!draft.trim()}>
        Guess
      </Button>
    </form>
  );
}
