"use client";

import { FormEvent, useState } from "react";
import { Check } from "lucide-react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { authClient } from "@/lib/auth-client";
import { errorText } from "@/lib/errors";
import { Modal } from "@/components/Modal";
import { settingsFor } from "@/lib/games";
import { DEFAULT_BUDGET, DEFAULT_CATEGORY, TEAM_CATEGORIES, categoryLabel } from "../../../../../convex/teamRules";

export function CreateRoomForm({ slug }: { slug: string }) {
  const { data: session, isPending } = authClient.useSession();
  const isAccount = Boolean(session?.user && !(session.user as { isAnonymous?: boolean }).isAnonymous);

  if (isPending) {
    return <AuthShell title="One moment"><div className="auth-skeleton" /></AuthShell>;
  }
  if (!isAccount) {
    return (
      <AuthShell
        title="Sign in to host"
        subtitle="A room outlives the tab you made it in, so hosting needs an account. Joining one does not."
      >
        <Link href="/login" className="w-full"><Button variant="primary" className="w-full">Sign in</Button></Link>
      </AuthShell>
    );
  }
  return <CreateRoom slug={slug} />;
}

function CreateRoom({ slug }: { slug: string }) {
  const game = useQuery(api.games.getBySlug, { slug });
  const createRoom = useMutation(api.rooms.create);
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(0);
  const [rounds, setRounds] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [maxTries, setMaxTries] = useState(3);
  const [adult, setAdult] = useState(false);
  const [budget, setBudget] = useState(DEFAULT_BUDGET);
  const [pool, setPool] = useState(12);
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORY);
  const [picking, setPicking] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (game === undefined) return <AuthShell title="Loading game"><div className="auth-skeleton" /></AuthShell>;
  if (!game) return <AuthShell title="Game unavailable"><p className="auth-note">That game is not ready yet.</p></AuthShell>;

  const settings = settingsFor(slug);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await createRoom({
        gameSlug: slug,
        displayName,
        maxPlayers: maxPlayers || game.playerMax,
        // The server keeps only what this game supports.
        settings: { rounds, adult, timerSeconds, maxTries, budget, pool, category },
      });
      router.push(`/rooms/${result.roomId}`);
    } catch (thrown) {
      setPending(false);
      setError(errorText(thrown, "Could not create the room."));
    }
  };

  return (
    <AuthShell title={`Host ${game.name}`} subtitle={game.longDescription}>
      <form className="auth-stack" onSubmit={submit}>
        <Input label="Your name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="banana" maxLength={24} required />
        <Input label="Player limit" type="number" min={game.playerMin} max={game.playerMax} value={maxPlayers || game.playerMax} onChange={(event) => setMaxPlayers(Number(event.target.value))} />

        {settings.includes("rounds") && (
          <Input label="Rounds" type="number" min={1} max={20} value={rounds} onChange={(event) => setRounds(Number(event.target.value))} />
        )}

        {settings.includes("timer") && (
          <Input label="Seconds per round" type="number" min={30} max={180} step={10} value={timerSeconds} onChange={(event) => setTimerSeconds(Number(event.target.value))} />
        )}

        {settings.includes("tries") && (
          <Input label="Guesses allowed" type="number" min={1} max={6} value={maxTries} onChange={(event) => setMaxTries(Number(event.target.value))} />
        )}

        {settings.includes("category") && (
          <div className="field">
            <span className="auth-label">Pool</span>
            {/* Five named choices with a line of explanation each is a dialog,
                not a select. The room only sees this once, and it decides what
                the whole auction is about. */}
            <button type="button" className="picker-row" onClick={() => setPicking(true)}>
              <span>
                <span className="picker-value">{categoryLabel(category)}</span>
                <span className="small muted">
                  {TEAM_CATEGORIES.find((entry) => entry.key === category)?.blurb}
                </span>
              </span>
              <span className="picker-change">Change</span>
            </button>
          </div>
        )}

        {settings.includes("budget") && (
          <Input label="Budget each" type="number" min={5} max={200} value={budget} onChange={(event) => setBudget(Number(event.target.value))} hint="Everyone gets the same purse, in rupees." />
        )}

        {settings.includes("pool") && (
          <Input label="Lots in the auction" type="number" min={3} max={30} value={pool} onChange={(event) => setPool(Number(event.target.value))} hint="How many names come up for bidding." />
        )}

        {settings.includes("adult") && (
          <label className="setting-row">
            <span>
              <span className="auth-label">Adult content</span>
              <span className="small muted">Spicier pairs and questions.</span>
            </span>
            <span className="switch">
              <input type="checkbox" checked={adult} onChange={(event) => setAdult(event.target.checked)} />
              <span className="switch-track"><span className="switch-knob" /></span>
            </span>
          </label>
        )}

        {error && <p className="auth-note" role="alert"><span className="is-error">{error}</span></p>}
        <Button type="submit" variant="primary" isBlock isLoading={pending}>Create room</Button>
      </form>

      <Modal isOpen={picking} onClose={() => setPicking(false)} title="What are we bidding on">
        <div className="picker-list">
          {TEAM_CATEGORIES.map((entry) => (
            <button
              key={entry.key}
              type="button"
              className="picker-option"
              data-selected={entry.key === category ? "true" : undefined}
              onClick={() => { setCategory(entry.key); setPicking(false); }}
            >
              <span>
                <span className="picker-value">{entry.label}</span>
                <span className="small muted">{entry.blurb}</span>
              </span>
              {entry.key === category && <Check className="w-5 h-5 flex-none" aria-hidden="true" />}
            </button>
          ))}
        </div>
      </Modal>
    </AuthShell>
  );
}
