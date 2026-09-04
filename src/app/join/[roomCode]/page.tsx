import { JoinRoomForm } from "./JoinRoomForm";

export default async function JoinRoomPage({
  params,
}: {
  params: Promise<{ roomCode: string }>;
}) {
  const { roomCode } = await params;
  return <JoinRoomForm initialCode={roomCode} />;
}
