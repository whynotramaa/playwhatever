import React, { ReactNode } from "react";
import Link from "next/link";
import { BackLink } from "@/components/BackLink";

/**
 * The single-column layout shared by every auth screen. One centered stack,
 * same on a phone and a laptop, per DESIGN.md section 19 (focused forms stay
 * narrow on desktop).
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="auth-shell">
      <div className="auth-column">
        <div className="auth-top">
          <BackLink />
          <Link href="/" className="auth-brand" aria-label="PlayWhatever home">
            <span className="auth-brand-mark" aria-hidden="true">*</span>
          </Link>
        </div>

        <header className="auth-head">
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="auth-sub">{subtitle}</p>}
        </header>

        {children}

        {footer && <div className="auth-foot">{footer}</div>}
      </div>
    </main>
  );
}
