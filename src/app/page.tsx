"use client";

import { Fragment, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { GameCard } from "@/components/Card";
import { Input } from "@/components/Input";
import { ArrowRight, Search, Trophy } from "lucide-react";
import { ROOM_CODE_LENGTH, artFor, genreLabel, normalizeRoomCode } from "@/lib/games";

type Game = {
  _id: string;
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  playerMin: number;
  playerMax: number;
  estimatedMinutes: number;
  categories: string[];
  accentColor: string;
};

export default function Home() {
  const games = useQuery(api.games.list) as Game[] | undefined;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const router = useRouter();

  // Six games. Filtering the list the client already has beats a search index.
  // A tag every game carries narrows nothing, so it never becomes a chip. Four
  // is what fits on a phone before the row wraps.
  const categories = useMemo(() => {
    const shelf = games ?? [];
    const counts = new Map<string, number>();
    for (const game of shelf) {
      for (const name of game.categories) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts]
      .filter(([, count]) => count < shelf.length)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name]) => name);
  }, [games]);
  const goToRoom = (event: FormEvent) => {
    event.preventDefault();
    router.push(`/join/${code}`);
  };

  const needle = query.trim().toLowerCase();
  const filtered = (games ?? []).filter((game) => {
    const matchesCategory = !category || game.categories.includes(category);
    const haystack = `${game.name} ${game.shortDescription} ${game.longDescription} ${game.categories.join(" ")}`.toLowerCase();
    return matchesCategory && (!needle || haystack.includes(needle));
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-5 py-12 lg:px-10 lg:py-16 flex flex-col gap-16">
        <section className="flex flex-col items-start gap-4 max-w-2xl">
          <h1 className="display">
            Fast games for your <span className="text-[var(--color-coral)]">crew</span>.
          </h1>
          <p className="body text-[var(--color-text-secondary)] text-lg">
            Host a room or walk in as a guest. Bollywood, cricket, memes, five-minute rounds.
          </p>
          {/* Most arrivals are here because somebody sent them a code, so the
              code goes on the page rather than one click behind it. The name
              is asked for on the other side, once the room is known. */}
          <form className="join-inline" onSubmit={goToRoom}>
            <Input
              label="Room code"
              value={code}
              onChange={(event) => setCode(normalizeRoomCode(event.target.value))}
              placeholder="ABC123"
              className="code-type"
              maxLength={ROOM_CODE_LENGTH}
              autoComplete="off"
            />
            <Button type="submit" variant="primary" disabled={code.length !== ROOM_CODE_LENGTH}>
              Join with a code
            </Button>
          </form>
        </section>

        <section id="games" className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between border-b border-[var(--color-border)] pb-3">
            <h2 className="section-title">Games</h2>
            <span className="label">{games ? `${games.length} on the shelf` : "Loading"}</span>
          </div>

          <Input
            leftIcon={<Search />}
            placeholder="Search games, Bollywood, cricket, memes..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button type="button" className="tag" data-selected={category === null ? "true" : undefined} onClick={() => setCategory(null)}>
                All
              </button>
              {categories.map((name) => (
                <button key={name} type="button" className="tag" data-selected={category === name ? "true" : undefined} onClick={() => setCategory(name === category ? null : name)}>
                  {name}
                </button>
              ))}
            </div>
          )}

          {games === undefined ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="auth-skeleton" />
              <div className="auth-skeleton" />
              <div className="auth-skeleton" />
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {filtered.map((game, index) => (
                <Fragment key={game._id}>
                  {index === 3 && <Daily />}
                  <GameCard
                    className="rise-in"
                    style={{ "--i": index } as CSSProperties}
                    title={game.name}
                    description={game.shortDescription}
                    playerCount={`${game.playerMin}\u2013${game.playerMax} players`}
                    genre={genreLabel(game.categories)}
                    artwork={artFor(game.slug)}
                    onClick={() => router.push(`/games/${game.slug}`)}
                  />
                </Fragment>
              ))}
              {filtered.length <= 3 && <Daily />}
            </div>
          ) : (
            <p className="panel text-sm text-[var(--color-text-secondary)]">
              Nothing matches that. Try “Bollywood”, “cricket”, or clear the filter.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

/**
 * The daily is not on the shelf: one player, once a day, no room to host. It
 * sits in the grid as a full-width row so it reads as part of the shelf
 * without pretending to be a game you can gather people for.
 */
function Daily() {
  return (
    <Link href="/daily" className="daily-strip md:col-span-3">
      <span className="daily-mark" aria-hidden="true"><Trophy strokeWidth={1.5} /></span>
      <span className="daily-copy">
        <span className="label">Player of the day</span>
        <span className="card-title text-lg font-normal">Same IPL player for everyone</span>
        <span className="small muted">Eight guesses, one go, a global board.</span>
      </span>
      <ArrowRight className="w-4 h-4 flex-none" aria-hidden="true" />
    </Link>
  );
}
