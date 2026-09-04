"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * One step back from a focused screen. History rather than a fixed route: the
 * same shell is reached from the shelf, a game page, and a shared link, and
 * only the browser knows which. A cold tab has nothing to go back to, so that
 * case goes home instead of leaving a control that does nothing.
 */
export function BackLink() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="back-link"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
    >
      <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
      Back
    </button>
  );
}
