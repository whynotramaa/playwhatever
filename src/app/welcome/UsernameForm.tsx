"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Authenticated, AuthLoading, Unauthenticated, useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { Check, LoaderCircle, X } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { normalizeUsername, validateUsername, USERNAME_MAX } from "../../../convex/username";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";

export function UsernameForm() {
  return (
    <>
      <AuthLoading>
        <AuthShell title="One moment">
          <div className="auth-stack" aria-busy="true">
            <div className="auth-skeleton" />
            <div className="auth-skeleton is-short" />
          </div>
        </AuthShell>
      </AuthLoading>
      <Unauthenticated>
        <RedirectTo href="/login" />
      </Unauthenticated>
      <Authenticated>
        <Picker />
      </Authenticated>
    </>
  );
}

function RedirectTo({ href }: { href: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(href);
  }, [href, router]);
  return null;
}

function Picker() {
  const router = useRouter();
  const profile = useQuery(api.profiles.getMyProfile);
  const claim = useMutation(api.profiles.claimUsername);

  const [raw, setRaw] = useState("");
  const [debounced, setDebounced] = useState("");
  const [pending, setPending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Someone who already has a handle should never see this screen.
  useEffect(() => {
    if (profile?.username) router.replace("/");
  }, [profile, router]);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(raw), 350);
    return () => clearTimeout(timer);
  }, [raw]);

  const name = normalizeUsername(raw);
  const formatProblem = name.length === 0 ? null : validateUsername(name);
  const settled = debounced === raw;

  // Three gates before a single byte goes over the wire: non-empty, locally
  // valid, and the user has stopped typing.
  const lookup = useQuery(
    api.profiles.isUsernameAvailable,
    name.length > 0 && !formatProblem && settled ? { username: name } : "skip"
  );

  const checking = name.length > 0 && !formatProblem && (!settled || lookup === undefined);
  const available = lookup?.available === true;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!available || pending) return;
    setPending(true);
    setServerError(null);
    try {
      await claim({ username: name });
      router.replace("/");
    } catch (thrown) {
      setPending(false);
      setServerError(
        thrown instanceof ConvexError
          ? String(thrown.data)
          : "Could not save that username. Try again."
      );
    }
  };

  const status = serverError
    ? { tone: "error" as const, text: serverError }
    : formatProblem
      ? { tone: "error" as const, text: formatProblem }
      : checking
        ? { tone: "muted" as const, text: "Checking…" }
        : available
          ? { tone: "ok" as const, text: `${name} is yours.` }
          : lookup && !lookup.available
            ? { tone: "error" as const, text: "Taken. Try another." }
            : { tone: "muted" as const, text: "Letters, numbers, and underscores." };

  return (
    <AuthShell
      title="Pick a username"
      subtitle="This is how your crew finds you in a room. You can only set it once."
    >
      <form className="auth-stack" onSubmit={submit}>
        <div className="field">
          <label htmlFor="username" className="auth-label">
            Username
          </label>
          <div className="auth-handle" data-tone={status.tone}>
            <span className="auth-handle-at" aria-hidden="true">@</span>
            <input
              id="username"
              className="input"
              value={raw}
              onChange={(e) => {
                setServerError(null);
                setRaw(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, USERNAME_MAX));
              }}
              placeholder="rohit_sharma"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              aria-describedby="username-status"
            />
            <span className="auth-handle-status" aria-hidden="true">
              {checking && <LoaderCircle className="w-4 h-4 auth-spin" />}
              {!checking && available && <Check className="w-4 h-4" />}
              {!checking && name.length > 0 && (formatProblem || lookup?.available === false) && (
                <X className="w-4 h-4" />
              )}
            </span>
          </div>

          {/* Reserved height so the button never moves as the status changes. */}
          <p id="username-status" className="auth-note is-reserved" data-tone={status.tone} role="status">
            {status.text}
          </p>
        </div>

        <Button type="submit" variant="primary" isBlock isLoading={pending} disabled={!available}>
          Continue
        </Button>
      </form>
    </AuthShell>
  );
}
