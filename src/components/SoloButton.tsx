"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { User } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/Button";
import { errorText } from "@/lib/errors";

/**
 * One tap from the shelf to the board, for a game that does not need anybody
 * else. It opens a one-seat room and starts it in the same breath, so the
 * lobby, the code and the ticket never appear: there is nobody to invite.
 *
 * A guest can do this. The sign-in wall exists because a room outlives the tab
 * that made it, and a room of one does not.
 */
export function SoloButton({ slug }: { slug: string }) {
  const { data: session } = authClient.useSession();
  const createRoom = useMutation(api.rooms.create);
  const startGame = useMutation(api.rooms.startGame);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const play = async () => {
    setPending(true);
    setError(null);
    try {
      let user = session?.user;
      if (!user) {
        await authClient.signIn.anonymous();
        user = (await authClient.getSession()).data?.user;
      }
      const room = await createRoom({
        gameSlug: slug,
        displayName: user?.name?.slice(0, 24) || "You",
        maxPlayers: 1,
      });
      const started = await startGame({ roomId: room.roomId });
      router.push(`/rooms/${room.roomId}/play/${started.sessionId}`);
    } catch (thrown) {
      setPending(false);
      setError(errorText(thrown, "Could not start a solo game."));
    }
  };

  return (
    <>
      <Button variant="secondary" isLoading={pending} data-tip="Straight to the board, no room to fill" onClick={() => void play()}>
        <User className="w-4 h-4" aria-hidden="true" />
        Play solo
      </Button>
      {error && <p className="auth-note w-full" role="alert"><span className="is-error">{error}</span></p>}
    </>
  );
}
