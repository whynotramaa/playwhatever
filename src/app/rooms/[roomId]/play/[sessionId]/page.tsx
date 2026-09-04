import { PlayRouter } from "./PlayRouter";

export default async function PlayPage({
  params,
}: {
  params: Promise<{ roomId: string; sessionId: string }>;
}) {
  const { roomId, sessionId } = await params;
  return <PlayRouter roomId={roomId} sessionId={sessionId} />;
}
