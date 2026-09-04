import type { Metadata } from "next";
import { UsernameForm } from "./UsernameForm";

export const metadata: Metadata = {
  title: "Pick a username · PlayWhatever",
};

export default function WelcomePage() {
  return <UsernameForm />;
}
