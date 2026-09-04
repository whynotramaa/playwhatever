"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { AuthShell } from "@/components/AuthShell";
import { PlayScreen } from "./PlayScreen";
import { LiarScreen } from "./LiarScreen";
import { IplScreen } from "./IplScreen";
import { CharadesScreen } from "./CharadesScreen";

/**
 * The room knows which game it is; the platform picks the screen. A new game
 * is a module, a screen, and one line here.
 */
const SCREENS: Record<string, (props: { roomId: string; sessionId: string }) => React.ReactNode> = {
  traitors: PlayScreen,
  "guess-the-liar": LiarScreen,
  "ipl-guessr": IplScreen,
  "dumb-charadess": CharadesScreen,
};

export function PlayRouter({ roomId, sessionId }: { roomId: string; sessionId: string }) {
  const data = useQuery(api.rooms.get, { roomId: roomId as Id<"rooms"> });
  const router = useRouter();
  const status = data === null ? "closed" : data?.room.status;

  useEffect(() => {
    // The host ended the game, or closed the room. Either way this screen is
    // no longer the room, and the lobby knows what to say about both.
    if (status && status !== "in_progress" && status !== "finished") {
      router.replace(`/rooms/${roomId}`);
    }
  }, [status, roomId, router]);

  if (data === undefined) return <AuthShell title="Loading the table"><div className="auth-skeleton" /></AuthShell>;
  const Screen = data?.game ? SCREENS[data.game.slug] : undefined;
  if (!Screen) {
    return (
      <AuthShell title="Game unavailable">
        <p className="auth-note">This room is playing something that has no screen yet.</p>
      </AuthShell>
    );
  }
  return <Screen roomId={roomId} sessionId={sessionId} />;
}
