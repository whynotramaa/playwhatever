import type { Metadata } from "next";
import { DailyScreen } from "./DailyScreen";

export const metadata: Metadata = {
  title: "Player of the Day · PlayWhatever",
  description: "One IPL player, the same one for everybody, eight guesses. A new player every day.",
  alternates: { canonical: "/daily" },
};

export default function DailyPage() {
  return <DailyScreen />;
}
