"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { GuestSessionGate } from "@/components/GuestSessionGate";
import { errorText } from "@/lib/errors";
import { ROOM_CODE_LENGTH, normalizeRoomCode } from "@/lib/games";

export function JoinRoomForm({ initialCode }: { initialCode: string }) {
  return <GuestSessionGate><JoinRoom initialCode={initialCode} /></GuestSessionGate>;
}

/**
 * Two steps, in the order the player knows the answers.
 *
 * The code identifies the room, so it comes first and the lookup runs on it.
 * Only then is there a name to ask for: by that point the screen can say which
 * game it is and who is already sitting there, which is what makes the name
 * feel like a choice rather than a form field. A code arriving in the URL
 * skips straight to the name.
 */
function JoinRoom({ initialCode }: { initialCode: string }) {
  const [roomCode, setRoomCode] = useState(normalizeRoomCode(initialCode));
  const [displayName, setDisplayName] = useState("");
  const room = useQuery(api.rooms.getByCode, { roomCode });
  const join = useMutation(api.rooms.join);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const complete = roomCode.length === ROOM_CODE_LENGTH;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!complete) return;
    setPending(true);
    setError(null);
    try {
      const result = await join({ roomCode, displayName });
      router.push(`/rooms/${result.roomId}`);
    } catch (thrown) {
      setPending(false);
      setError(errorText(thrown, "Could not join the room."));
    }
  };

  const hint =
    !complete ? null
    : room === undefined ? "Looking for that room..."
    : room === null ? "No open room with that code."
    : room.room.status !== "waiting" ? "That game has started. If you already have a seat, you can rejoin."
    : null;

  return (
    <AuthShell
      title={complete ? "What should we call you?" : "Join a room"}
      subtitle={
        complete && room?.game
          ? `${room.game.name} · ${room.players.length} player${room.players.length === 1 ? "" : "s"} here`
          : complete
            ? `Room ${roomCode}`
            : "Enter the room code from your host."
      }
    >
      <form className="auth-stack" onSubmit={submit}>
        {complete ? (
          <>
            <Input
              label="Your name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="banana"
              maxLength={24}
              required
              autoFocus
            />
            {hint && !error && <p className="auth-note">{hint}</p>}
            {error && <p className="auth-note" role="alert"><span className="is-error">{error}</span></p>}
            <Button type="submit" variant="primary" isBlock isLoading={pending} disabled={!displayName.trim()}>
              Join room
            </Button>
            <Button type="button" variant="tertiary" isBlock onClick={() => { setRoomCode(""); setError(null); }}>
              Use a different code
            </Button>
          </>
        ) : (
          <>
            <Input
              label="Room code"
              value={roomCode}
              onChange={(event) => setRoomCode(normalizeRoomCode(event.target.value))}
              className="code-type"
              placeholder="ABC123"
              maxLength={ROOM_CODE_LENGTH}
              autoComplete="off"
              required
              autoFocus
            />
            <p className="auth-note">Six characters, from whoever is hosting.</p>
          </>
        )}
      </form>
    </AuthShell>
  );
}
