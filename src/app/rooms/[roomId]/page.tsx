import { Lobby } from "./Lobby";

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return <Lobby roomId={roomId} />;
}
