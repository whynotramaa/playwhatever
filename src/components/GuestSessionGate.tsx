"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { AuthShell } from "@/components/AuthShell";

export function GuestSessionGate({ children }: { children: ReactNode }) {
  const { data: session, isPending, refetch } = authClient.useSession();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // One attempt per mount. The effect re-runs while the new session is still
  // in flight, and a second anonymous sign-in is refused outright.
  const attempted = useRef(false);

  useEffect(() => {
    if (isPending || session || attempted.current) return;
    attempted.current = true;
    setStarting(true);
    authClient.signIn.anonymous().then(({ error: signInError }) => {
      // "cannot sign in again anonymously" means the browser already holds a
      // guest session. That is the state we wanted, so read it rather than
      // stopping on a dead end.
      if (signInError && !/again anonymously/i.test(signInError.message ?? "")) {
        setError(signInError.message ?? "Could not start a guest session.");
      } else if (signInError) {
        void refetch();
      }
      setStarting(false);
    });
  }, [isPending, session, refetch]);

  if (isPending || starting) {
    return (
      <AuthShell title="One moment">
        <div className="auth-stack" aria-busy="true">
          <div className="auth-skeleton" />
          <div className="auth-skeleton is-short" />
        </div>
      </AuthShell>
    );
  }
  if (error) {
    return (
      <AuthShell title="Could not join">
        <p className="auth-note" role="alert"><span className="is-error">{error}</span></p>
      </AuthShell>
    );
  }
  return <>{children}</>;
}
