import type { Metadata } from "next";
import { StatsView } from "./StatsView";

export const metadata: Metadata = {
  title: "Stats · PlayWhatever",
  description: "Your record across every game, and the leaderboard behind it.",
  alternates: { canonical: "/stats" },
};

export default function StatsPage() {
  return <StatsView />;
}
