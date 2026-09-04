"use client";

import { Fragment } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";

type Player = { _id: string; displayName: string; score: number; status?: string };

/**
 * The end of every game. A module supplies the headline and the winners; the
 * ranking, the guest nudge and the two ways out are the platform's.
 */
export function GameResults({
  gameSlug,
  players,
  winnerIds,
  headline,
  sub,
  mark = "🏆",
  winnerTag,
  children,
}: {
  gameSlug?: string;
  players: Player[];
  winnerIds: string[];
  headline: string;
  sub?: string;
  mark?: React.ReactNode;
  /** Overrides the "Winner"/"Winners" line, for a win that has a name of its own. */
  winnerTag?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const isGuest = Boolean((session?.user as { isAnonymous?: boolean } | undefined)?.isAnonymous);
  const ranking = [...players].sort((a, b) => b.score - a.score);
  const winners = ranking.filter((player) => winnerIds.includes(player._id));

  return (
    <main className="auth-shell">
      <div className="auth-column">
        <div className="traitor-reveal" aria-hidden="true"><span>●</span><span>●</span><span>●</span><span>●</span><b>✦</b></div>
        <header className="auth-head"><h1 className="page-title">{headline}</h1>{sub && <p className="auth-sub">{sub}</p>}</header>

        {children}

        {winners.length > 0 && (
          <article className="postcard postcard-winner">
            <span className="postcard-mark" aria-hidden="true">विजेता</span>
            <span className="postcard-stamp" aria-hidden="true">{mark}</span>
            <p className="display postcard-word">
              {winners.map((player, index) => (
                <Fragment key={player._id}>
                  {index > 0 && <Scribble />}
                  {player.displayName}
                </Fragment>
              ))}
            </p>
            <p className="postcard-role">{winnerTag ?? (winners.length > 1 ? "Winners" : "Winner")}</p>
            <span className="postcard-punch" aria-hidden="true" />
          </article>
        )}

        <Card data-tone="sky">
          <div className="flex items-center justify-between mb-4"><span className="label">Scores</span><span className="small muted" data-tip="Everyone who sat at this table">{players.length} players</span></div>
          <div className="auth-stack">
            {ranking.map((player, index) => (
              <div key={player._id} className="flex items-center justify-between">
                <span><span className="muted mr-2">{index + 1}</span>{player.displayName}</span>
                <b>{player.score}</b>
              </div>
            ))}
          </div>
        </Card>

        {isGuest && (
          <Card variant="flat">
            <p className="text-sm text-[var(--color-text-secondary)]">
              You played as a guest, so this score disappears with the room.{" "}
              <Link href="/login" className="underline">Sign in</Link> and it stays on your record, along with the seat you are sitting in.
            </p>
          </Card>
        )}

        {gameSlug && <Button variant="primary" isBlock data-tip="Opens a fresh room with the same settings" onClick={() => router.push(`/games/${gameSlug}/create`)}>Play again</Button>}
        <Button variant="tertiary" isBlock onClick={() => router.push("/")}>Back to games</Button>
      </div>
    </main>
  );
}

/**
 * What separates one winner's name from the next. A comma is typesetting; this
 * is the line somebody would have drawn between two names on a real card.
 */
function Scribble() {
  return (
    <svg className="postcard-scribble" viewBox="0 0 56 14" fill="none" aria-hidden="true">
      <path
        d="M2 8.4c4.6-6 8.6 4.6 13.4-.6 4.8-5.2 8.4 5.4 13.2.2 4.8-5.2 8.6 5.2 13.4.2 3-3.1 5.6-1.4 7.6 1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
