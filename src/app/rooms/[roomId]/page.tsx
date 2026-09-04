import type { Metadata } from "next";
import { Lobby } from "./Lobby";

// A room is one evening and one code. There is nothing here to index.
export const metadata: Metadata = { title: "Room · PlayWhatever", robots: { index: false } };

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return <Lobby roomId={roomId} />;
}
