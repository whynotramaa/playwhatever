"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { GuestSessionGate } from "@/components/GuestSessionGate";
import { InvitationTicket } from "@/components/InvitationTicket";
import { errorText } from "@/lib/errors";
import { useServerNow } from "@/lib/useServerNow";

// A player who has not checked in for this long is drawn as away. Two missed
// beats, so a slow phone does not flicker.
const STALE_MS = 45_000;

export function Lobby({ roomId }: { roomId: string }) {
  return <GuestSessionGate><LobbyContent roomId={roomId as Id<"rooms">} /></GuestSessionGate>;
}

type LobbyPlayer = { _id: Id<"roomPlayers">; displayName: string; isHost: boolean; status: string; lastSeenAt: number };

function LobbyContent({ roomId }: { roomId: Id<"rooms"> }) {
  const data = useQuery(api.rooms.get, { roomId });
  const start = useMutation(api.rooms.startGame);
  const leave = useMutation(api.rooms.leave);
  const removePlayer = useMutation(api.rooms.removePlayer);
  const closeRoom = useMutation(api.rooms.close);
  const router = useRouter();
  const now = useServerNow(roomId);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reconnecting mid-game, or after it ended, lands on the right screen.
    const live = data?.room.status === "in_progress" || data?.room.status === "finished";
    if (live && data?.currentSession?._id) router.replace(`/rooms/${roomId}/play/${data.currentSession._id}`);
  }, [data, roomId, router]);

  if (data === undefined) return <AuthShell title="Joining room"><div className="auth-skeleton" /></AuthShell>;
  if (!data) return <AuthShell title="Room closed"><p className="auth-note">This room has closed or does not exist.</p><Button variant="secondary" isBlock className="mt-4" onClick={() => router.push("/")}>Back to games</Button></AuthShell>;
  if (data.currentPlayer?.status === "removed") {
    return <AuthShell title="You were removed"><p className="auth-note">The host took you out of this room.</p><Button variant="secondary" isBlock className="mt-4" onClick={() => router.push("/")}>Back to games</Button></AuthShell>;
  }

  const players: LobbyPlayer[] = data.players.filter((player: LobbyPlayer) => player.status !== "removed");
  const host = players.find((player) => player.isHost);
  const isHost = data.currentPlayer?.isHost;
  const canStart = players.length >= (data.game?.playerMin ?? 3);
  const isAway = (player: LobbyPlayer) => player.status === "disconnected" || now - player.lastSeenAt > STALE_MS;

  const guard = async (action: () => Promise<unknown>) => {
    setPending(true); setError(null);
    try { await action(); } catch (thrown) { setError(errorText(thrown, "That did not work.")); }
    setPending(false);
  };

  // Native share where the platform has it, clipboard everywhere else.
  const share = async () => {
    const url = `${window.location.origin}/join/${data.room.roomCode}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${data.game?.name ?? "PlayWhatever"} room`, text: `Join my room. Code ${data.room.roomCode}.`, url });
        return;
      } catch {
        // Dismissed the sheet, or the platform refused. Fall through to copy.
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="auth-shell">
      <div className="auth-column">
        <span className="auth-brand-mark" aria-hidden="true">*</span>
        <header className="auth-head"><h1 className="page-title">{data.game?.name ?? "Room"}</h1><p className="auth-sub">Share the ticket. Anyone with the code can walk in.</p></header>

        <InvitationTicket
          gameName={data.game?.name ?? "Room"}
          hostName={host?.displayName ?? "Host"}
          roomCode={data.room.roomCode}
          playerCount={players.length}
          maxPlayers={data.room.maxPlayers}
          status={canStart ? "Ready to start" : "Waiting for players"}
          action={
            <Button variant="yellow" size="sm" className="mt-2 text-xs" data-tip="Copies the join link" onClick={() => void share()}>
              {copied ? "Copied" : "Share link"}
            </Button>
          }
        />

        {data.game && (
          <Card variant="flat" data-tone="lavender">
            <div className="flex items-center justify-between mb-3">
              <span className="label">How it plays</span>
              <span className="small muted" data-tip="Room size and a rough length">
                {data.game.playerMin}-{data.game.playerMax} · {data.game.estimatedMinutes} mins
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">{data.game.longDescription}</p>
          </Card>
        )}

        <Card>
          <div className="flex items-center justify-between mb-4"><span className="label">Players</span><span className="small muted" data-tip="Seats taken">{players.length} / {data.room.maxPlayers}</span></div>
          <div className="auth-stack">
            {players.map((player, index) => (
              <div key={player._id} className="flex items-center justify-between gap-3 rise-in" style={{ "--i": index } as CSSProperties}>
                <span className={isAway(player) ? "muted" : undefined}>{player.displayName}</span>
                <span className="flex items-center gap-2">
                  {isAway(player) && <span className="label">Away</span>}
                  {player.isHost && <span className="label">Host</span>}
                  {isHost && !player.isHost && (
                    <button type="button" className="label" data-tip={`Remove ${player.displayName} from the room`} style={{ color: "var(--color-danger)", cursor: "pointer" }} onClick={() => void guard(() => removePlayer({ roomId, playerId: player._id }))}>
                      Remove
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {host && !isHost && isAway(host) && <p className="auth-note">The host has gone quiet. The room stays open.</p>}
        {error && <p className="auth-note" role="alert"><span className="is-error">{error}</span></p>}

        {isHost ? (
          <>
            <Button variant="primary" isBlock isLoading={pending} data-tip={canStart ? "Nobody can join once it starts" : "Waiting on more players"} disabled={!canStart} onClick={() => void guard(() => start({ roomId }))}>{canStart ? "Start game" : `Need ${data.game?.playerMin ?? 3} players`}</Button>
            <Button variant="tertiary" isBlock onClick={() => { if (window.confirm("Close this room for everyone?")) void guard(() => closeRoom({ roomId }).then(() => router.push("/"))); }}>Close room</Button>
          </>
        ) : (
          <>
            <p className="auth-note">Waiting for the host to start the game.</p>
            <Button variant="tertiary" isBlock onClick={() => { void leave({ roomId }); router.push("/"); }}>Leave room</Button>
          </>
        )}
      </div>
    </main>
  );
}
