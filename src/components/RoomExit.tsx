"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { DoorOpen, Square } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ConfirmDialog } from "@/components/Modal";

type Ask = "end" | "leave" | null;

/**
 * The way out of a room, from inside a game. The lobby has its own buttons in
 * the page; a running game has no chrome to put them in, so they live up in
 * the corner where they are reachable without being in the way.
 *
 * They are still real controls: 44px of touch target, a label next to the
 * icon, and a dialog in the product's own voice rather than a system alert.
 * On a phone the label collapses and the icon keeps the target.
 */
export function RoomExit({ roomId }: { roomId: string }) {
  const data = useQuery(api.rooms.get, { roomId: roomId as Id<"rooms"> });
  const leave = useMutation(api.rooms.leave);
  const endGame = useMutation(api.rooms.endGame);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [ask, setAsk] = useState<Ask>(null);

  // The lobby already carries Leave and Close, so this only shows once a game
  // is actually running.
  const playing = data?.room.status === "in_progress" || data?.room.status === "finished";
  if (!playing) return null;
  const isHost = Boolean(data?.currentPlayer?.isHost);

  const quit = () => {
    setPending(true);
    void leave({ roomId: roomId as Id<"rooms"> }).finally(() => router.push("/"));
  };

  const stop = () => {
    setPending(true);
    void endGame({ roomId: roomId as Id<"rooms"> }).finally(() => {
      setPending(false);
      setAsk(null);
    });
  };

  return (
    <>
      <div className="room-exit">
        {isHost && (
          <button type="button" className="room-exit-btn" disabled={pending} onClick={() => setAsk("end")}>
            <Square className="w-4 h-4" aria-hidden="true" />
            <span>End game</span>
          </button>
        )}
        <button type="button" className="room-exit-btn is-quiet" disabled={pending} onClick={() => setAsk("leave")}>
          <DoorOpen className="w-4 h-4" aria-hidden="true" />
          <span>Leave</span>
        </button>
      </div>

      <ConfirmDialog
        isOpen={ask === "end"}
        title="End the game"
        body="Everyone drops back to the lobby and the scores go to zero. The room stays open, so you can start something else with the same people."
        confirmLabel="End it"
        isPending={pending}
        onConfirm={stop}
        onClose={() => setAsk(null)}
      />
      <ConfirmDialog
        isOpen={ask === "leave"}
        title="Leave the room"
        body="The game carries on without you. You can walk back in with the same code while it is still running."
        confirmLabel="Leave"
        isPending={pending}
        onConfirm={quit}
        onClose={() => setAsk(null)}
      />
    </>
  );
}
