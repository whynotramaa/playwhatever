import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in · PlayWhatever",
  description: "Sign in to host rooms and keep your stats.",
};

export default function LoginPage() {
  return <LoginForm />;
}
