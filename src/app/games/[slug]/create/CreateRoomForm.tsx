"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { GuestSessionGate } from "@/components/GuestSessionGate";
import { errorText } from "@/lib/errors";
import { settingsFor } from "@/lib/games";

export function CreateRoomForm({ slug }: { slug: string }) {
  return <GuestSessionGate><CreateRoom slug={slug} /></GuestSessionGate>;
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
        settings: { rounds, adult, timerSeconds, maxTries },
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
        <Input label="Your name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="banana" maxLength={24} required autoFocus />
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
    </AuthShell>
  );
}
