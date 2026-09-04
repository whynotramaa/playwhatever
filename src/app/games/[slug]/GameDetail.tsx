"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { artFor, genreLabel, hasSolo } from "@/lib/games";
import { SoloButton } from "@/components/SoloButton";

export function GameDetail({ slug }: { slug: string }) {
  const game = useQuery(api.games.getBySlug, { slug });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl w-full mx-auto px-5 py-12 lg:px-10 lg:py-16 flex flex-col gap-8">
        {game === undefined ? (
          <div className="auth-skeleton" />
        ) : !game ? (
          <>
            <h1 className="page-title">Not on the shelf</h1>
            <p className="body text-[var(--color-text-secondary)]">
              This game is not published yet. It will show up here when it is ready.
            </p>
            <Link href="/"><Button variant="secondary">Back to games</Button></Link>
          </>
        ) : (
          <>
            <div className="game-detail-art" style={{ background: game.accentColor }}>
              <img src={artFor(game.slug)} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} />
            </div>
            <div className="flex items-center gap-4">
              <div>
                <h1 className="page-title">{game.name}</h1>
                <p className="small muted">
                  {game.playerMin}-{game.playerMax} players · {genreLabel(game.categories)}
                </p>
              </div>
            </div>

            <p className="body text-lg text-[var(--color-text-secondary)]">{game.longDescription}</p>

            <div className="flex flex-wrap gap-2">
              {game.categories.map((name: string) => <span key={name} className="tag">{name}</span>)}
            </div>

            <Card variant="flat">
              <p className="text-sm text-[var(--color-text-secondary)]">
                Everyone plays on their own phone in the same room. The host creates the room, the rest join with the code.
              </p>
            </Card>

            <div className="flex flex-wrap gap-3">
              <Link href={`/games/${game.slug}/create`}><Button variant="primary">Host a room</Button></Link>
              {hasSolo(game) && <SoloButton slug={game.slug} />}
              <Link href="/join"><Button variant="secondary">Join with a code</Button></Link>
            </div>

            {/* The rules are a footnote, not a fourth action competing with
                the three above it. */}
            <Link href={`/blog/${game.slug}`} className="quiet-link">Read the rules</Link>
          </>
        )}
      </main>
    </div>
  );
}
