"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { authClient } from "@/lib/auth-client";

type StatRow = {
  gameSlug: string;
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  highestScore: number;
};

export function StatsView() {
  const { data: session } = authClient.useSession();
  const isAccount = Boolean(session?.user && !(session.user as { isAnonymous?: boolean }).isAnonymous);
  const [gameSlug, setGameSlug] = useState("");

  const games = useQuery(api.games.list);
  const mine = useQuery(api.stats.myStats) as StatRow[] | undefined;
  const board = useQuery(api.stats.leaderboard, { gameSlug });

  const overall = mine?.find((row) => row.gameSlug === "");
  const perGame = (mine ?? []).filter((row) => row.gameSlug !== "");
  const nameFor = (slug: string) => games?.find((game) => game.slug === slug)?.name ?? slug;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl w-full mx-auto px-5 py-12 lg:px-10 lg:py-16 flex flex-col gap-10">
        <header className="flex flex-col gap-2">
          <h1 className="display">Stats</h1>
          <p className="body text-[var(--color-text-secondary)]">
            Scores are kept for accounts. Guest games are played and forgotten.
          </p>
        </header>

        {!isAccount ? (
          <Card variant="flat">
            <p className="text-sm text-[var(--color-text-secondary)]">
              You are playing as a guest. <Link href="/login" className="underline">Sign in</Link> and every game
              after that lands on your record.
            </p>
          </Card>
        ) : !overall ? (
          <Card variant="flat">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Nothing here yet. Finish a game and it shows up.
            </p>
          </Card>
        ) : (
          <section className="flex flex-col gap-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ["Played", overall.gamesPlayed],
                ["Won", overall.gamesWon],
                ["Total score", overall.totalScore],
                ["Best game", overall.highestScore],
              ].map(([label, value], index) => (
                <Card key={String(label)} className="rise-in" style={{ "--i": index } as CSSProperties}>
                  <p className="label">{label}</p>
                  <p className="section-title mt-1">{value}</p>
                </Card>
              ))}
            </div>

            {perGame.length > 0 && (
              <Card>
                <p className="label mb-4">By game</p>
                <div className="auth-stack">
                  {perGame.map((row) => (
                    <div key={row.gameSlug} className="flex items-center justify-between">
                      <span>{nameFor(row.gameSlug)}</span>
                      <span className="small muted">{row.gamesWon} of {row.gamesPlayed} won · {row.totalScore} pts</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </section>
        )}

        <section className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between border-b border-[var(--color-border)] pb-3">
            <h2 className="section-title">Leaderboard</h2>
            <span className="label">Top 20</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="tag" data-selected={gameSlug === "" ? "true" : undefined} onClick={() => setGameSlug("")}>
              All games
            </button>
            {(games ?? []).map((game) => (
              <button key={game.slug} type="button" className="tag" data-selected={gameSlug === game.slug ? "true" : undefined} onClick={() => setGameSlug(game.slug)}>
                {game.name}
              </button>
            ))}
          </div>

          {board === undefined ? (
            <div className="auth-skeleton" />
          ) : board.length === 0 ? (
            <p className="panel text-sm text-[var(--color-text-secondary)]">
              Nobody has finished a game here yet. Be first.
            </p>
          ) : (
            <Card>
              <div className="auth-stack">
                {board.map((row, index) => (
                  <div key={row.userId} className="flex items-center justify-between">
                    <span><span className="muted mr-2">{index + 1}</span>{row.name}</span>
                    <span className="small muted">{row.gamesWon} won · <b>{row.totalScore}</b> pts</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </section>

        <Link href="/"><Button variant="tertiary">Back to games</Button></Link>
      </main>
    </div>
  );
}
