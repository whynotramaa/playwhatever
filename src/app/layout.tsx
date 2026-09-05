import type { Metadata } from "next";
import { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { zarathustra, poppins, notoDevanagari } from "@/styles/fonts";
import "@/styles/globals.css";
import { ThemeProvider } from "@/lib/theme";
import { ConvexClientProvider } from "./ConvexClientProvider";

export const metadata: Metadata = {
  // Absolute URLs for the share card. Vercel gives the deployment its own
  // hostname, so this names the one people are actually sent to.
  metadataBase: new URL("https://playwhatever.ramaa.tech"),
  title: "PlayWhatever — Multiplayer Party Games",
  description: "Fast, low-friction Indian and global party games for everyone.",
  openGraph: {
    title: "PlayWhatever",
    description: "Fast party games for your crew. Host a room, share the code, everybody plays on their own phone.",
    url: "/",
    siteName: "PlayWhatever",
    type: "website",
  },
  alternates: { canonical: "/" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${zarathustra.variable} ${poppins.variable} ${notoDevanagari.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] selection:bg-[var(--color-coral-soft)] selection:text-[var(--color-bg-deep)]">
        <ThemeProvider>
          <ConvexClientProvider>
            <span className="page-frame" aria-hidden="true"><i /><i /><i /><i /></span>
            {children}
          </ConvexClientProvider>
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
