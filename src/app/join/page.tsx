import type { Metadata } from "next";
import { JoinRoomForm } from "./[roomCode]/JoinRoomForm";

export const metadata: Metadata = {
  title: "Join a room · PlayWhatever",
  robots: { index: false },
};

export default function JoinPage() {
  return <JoinRoomForm initialCode="" />;
}
