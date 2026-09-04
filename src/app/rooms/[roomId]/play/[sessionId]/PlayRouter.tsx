"use client";

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
