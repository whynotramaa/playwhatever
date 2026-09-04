import { VoiceDock } from "@/components/VoiceDock";
import { RoomExit } from "@/components/RoomExit";

/**
 * Everything under a room shares one voice call. The dock lives here rather
 * than on a page so that starting a game re-renders the screen underneath it
 * without tearing down the peer connections.
 */
export default async function RoomLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return (
    <div className="room-shell">
      <RoomExit roomId={roomId} />
      {children}
      <VoiceDock roomId={roomId} />
    </div>
  );
}
