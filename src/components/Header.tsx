"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { Button } from "./Button";
import { BackLink } from "./BackLink";
import { ConfirmDialog } from "./Modal";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const [askSignOut, setAskSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  // The shelf is where back would go, so it is the one screen without it.
  const isHome = usePathname() === "/";
  // A guest session is not an account, so the header still offers the sign-in.
  const account = session?.user && !(session.user as { isAnonymous?: boolean }).isAnonymous ? session.user : null;
  // The handle is what a player is known by in a room. An email address is an
  // account detail, and it does not belong in a header other people can see.
  const profile = useQuery(api.profiles.getMyProfile, account ? {} : "skip");
  const handle = profile?.username ? `@${profile.username}` : account?.name || null;

  return (
    <header className="topbar">
      <Link href="/" className="logo">
        <span className="logo-mark" aria-hidden="true">*</span>
        <span className="logo-word font-normal text-xl tracking-tight heading-display">PlayWhatever</span>
      </Link>

      {!isHome && <BackLink />}

      <div className="spacer" />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          className="btn-icon btn btn-tertiary"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun className="w-5 h-5 text-[var(--color-yellow)]" /> : <Moon className="w-5 h-5" />}
        </button>

        {account ? (
          <>
            {handle && <Link href="/stats" className="small muted hidden sm:inline">{handle}</Link>}
            <Button
              variant="tertiary"
              size="icon"
              aria-label="Sign out"
              data-tip="Sign out"
              onClick={() => setAskSignOut(true)}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </>
        ) : (
          <Link href="/login">
            <Button variant="tertiary" size="sm">
              Sign in
            </Button>
          </Link>
        )}
      </div>

      <ConfirmDialog
        isOpen={askSignOut}
        title="Sign out"
        body="Your stats and rooms stay put. Sign back in whenever you want them again."
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        isPending={signingOut}
        onConfirm={() => {
          setSigningOut(true);
          void authClient.signOut().then(() => router.push("/"));
        }}
        onClose={() => setAskSignOut(false)}
      />
    </header>
  );
}
