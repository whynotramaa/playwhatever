"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { DoorOpen, Square } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

/**
 * The way out of a room, from inside a game. The lobby has its own buttons in
 * the page; a running game has no chrome to put them in, so they live up in
 * the corner where they are reachable without being in the way.
 */
export function RoomExit({ roomId }: { roomId: string }) {
  const data = useQuery(api.rooms.get, { roomId: roomId as Id<"rooms"> });
  const leave = useMutation(api.rooms.leave);
  const endGame = useMutation(api.rooms.endGame);
  const router = useRouter();
  const [pending, setPending] = useState(false);

  // The lobby already carries Leave and Close, so this only shows once a game
  // is actually running.
  const playing = data?.room.status === "in_progress" || data?.room.status === "finished";
  if (!playing) return null;
  const isHost = Boolean(data?.currentPlayer?.isHost);

  const quit = () => {
    if (!window.confirm("Leave this room? The game carries on without you.")) return;
    setPending(true);
    void leave({ roomId: roomId as Id<"rooms"> }).finally(() => router.push("/"));
  };

  const stop = () => {
    if (!window.confirm("End the game for everyone and go back to the lobby?")) return;
    setPending(true);
    void endGame({ roomId: roomId as Id<"rooms"> }).finally(() => setPending(false));
  };

  return (
    <div className="room-exit">
      {isHost && (
        <button type="button" className="room-exit-btn" disabled={pending} onClick={stop} data-tip="Back to the lobby for everyone">
          <Square className="w-3.5 h-3.5" aria-hidden="true" />
          End game
        </button>
      )}
      <button type="button" className="room-exit-btn" disabled={pending} onClick={quit} data-tip="You leave, the room stays">
        <DoorOpen className="w-3.5 h-3.5" aria-hidden="true" />
        Leave
      </button>
    </div>
  );
}
