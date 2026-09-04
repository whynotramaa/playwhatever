"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { IplAnswerRow, IplBoard, IplGuessBox, type Guess } from "@/components/IplBoard";
import { errorText } from "@/lib/errors";

/**
 * Player of the Day. The same IPL player for everybody, one attempt each,
 * eight guesses, and two boards: today's, and the running total.
 *
 * Registered players only, so it does not wrap in GuestSessionGate — that
 * would hand the visitor a guest session, which is the one identity a daily
 * cannot count.
 */
export function DailyScreen() {
  const { data: session, isPending } = authClient.useSession();
  const today = useQuery(api.daily.today, {});
  const roster = useQuery(api.ipl.roster, {});
  const board = useQuery(api.daily.dailyBoard, {});
  const global = useQuery(api.daily.globalBoard, {});
  const start = useMutation(api.daily.start);
  const submitGuess = useMutation(api.daily.guess);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const opened = useRef(false);

  const registered = today?.registered === true;

  // Opening the page opens the day. One call per mount; the mutation is a
  // no-op once the attempt row exists.
  useEffect(() => {
    if (!registered || opened.current || today?.attempt) return;
    opened.current = true;
    start({}).catch((thrown) => setError(errorText(thrown, "Could not open today's puzzle.")));
  }, [registered, today, start]);

  if (isPending || today === undefined) {
    return <AuthShell title="Player of the Day"><div className="auth-skeleton" /></AuthShell>;
  }

  const isGuest = Boolean((session?.user as { isAnonymous?: boolean } | undefined)?.isAnonymous);
  if (!registered) {
    return (
      <AuthShell
        title="Player of the Day"
        subtitle="One IPL player, the same one for everybody, eight guesses. A new one every day."
      >
        <Card>
          <p className="body">
            {isGuest || session?.user
              ? "The daily needs an account, because one attempt a day only means something if the same person is on the other end of it."
              : "Sign in to play today's player and take a place on the board."}
          </p>
        </Card>
        <Link href="/login"><Button variant="primary" isBlock>Sign in</Button></Link>
        <Link href="/"><Button variant="tertiary" isBlock>Back to games</Button></Link>
      </AuthShell>
    );
  }

  const attempt = today.attempt;
  const guesses: Guess[] = attempt?.guesses ?? [];
  const triesLeft = today.maxTries - guesses.length;
  const finished = attempt?.finished === true;

  const send = async (name: string) => {
    setPending(true);
    setError(null);
    try {
      await submitGuess({ name });
    } catch (thrown) {
      setError(errorText(thrown, "Could not send that guess."));
    }
    setPending(false);
  };

  return (
    <main className="auth-shell">
      <div className="auth-column ipl-game">
        <span className="auth-brand-mark" aria-hidden="true">*</span>
        <header className="auth-head">
          <p className="label">Player of the day · {today.dateKey}</p>
          <h1 className="page-title">
            {finished
              ? attempt?.solvedInTries != null ? "Got it." : "Not today."
              : "Who is the IPL player?"}
          </h1>
          {!finished && (
            <p className="auth-sub">
              Everyone gets the same player and one go at it. {triesLeft}{" "}
              {triesLeft === 1 ? "try" : "tries"} left.
            </p>
          )}
        </header>

        {finished && today.answer ? (
          <>
            <Card>
              <p className="label">Today&rsquo;s player</p>
              <p className="section-title mt-2">{today.answer.name}</p>
              <div className="mt-4"><IplAnswerRow name={today.answer.name} attrs={today.answer} /></div>
              <p className="small muted mt-3">
                {attempt?.solvedInTries != null
                  ? `You had it in ${attempt.solvedInTries}. That is ${attempt.score} ${attempt.score === 1 ? "point" : "points"}.`
                  : "Eight guesses, no luck. Nothing on the board today."}
              </p>
            </Card>
            <IplBoard guesses={guesses} />
          </>
        ) : (
          <>
            <IplBoard guesses={guesses} />
            <IplGuessBox
              roster={roster}
              guesses={guesses}
              pending={pending}
              onGuess={(name) => void send(name)}
            />
          </>
        )}

        {error && <p className="auth-note" role="alert"><span className="is-error">{error}</span></p>}

        <Card>
          <div className="flex items-center justify-between mb-4">
            <span className="label">Today</span>
            <span className="small muted">Fewest guesses, then fastest</span>
          </div>
          {board === undefined ? (
            <div className="auth-skeleton" />
          ) : board.length === 0 ? (
            <p className="auth-note">Nobody has finished today yet.</p>
          ) : (
            <div className="auth-stack">
              {board.map((row: { rank: number; userId: string; name: string; tries: number | null; score: number; elapsedMs: number | null }) => (
                <div key={row.userId} className="flex items-center justify-between gap-3">
                  <span className="truncate"><span className="muted mr-2">{row.rank}</span>{row.name}</span>
                  <span className="small muted flex-none">
                    {row.tries != null ? `${row.tries} ${row.tries === 1 ? "try" : "tries"}` : "no luck"}
                    {row.elapsedMs != null && row.tries != null ? ` · ${Math.round(row.elapsedMs / 1000)}s` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <span className="label">All time</span>
            <span className="small muted">Total points</span>
          </div>
          {global === undefined ? (
            <div className="auth-skeleton" />
          ) : global.length === 0 ? (
            <p className="auth-note">Nobody is on the board yet. Be first.</p>
          ) : (
            <div className="auth-stack">
              {global.map((row: { rank: number; userId: string; name: string; totalScore: number; daysSolved: number; currentStreak: number }) => (
                <div key={row.userId} className="flex items-center justify-between gap-3">
                  <span className="truncate">
                    <span className="muted mr-2">{row.rank}</span>{row.name}
                    {row.currentStreak > 1 && <span className="small muted"> · {row.currentStreak} day run</span>}
                  </span>
                  <b className="flex-none">{row.totalScore}</b>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Link href="/"><Button variant="tertiary" isBlock>Back to games</Button></Link>
      </div>
    </main>
  );
}
