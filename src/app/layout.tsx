import type { Metadata } from "next";
import { ReactNode } from "react";
import { zarathustra, poppins, notoDevanagari } from "@/styles/fonts";
import "@/styles/globals.css";
import { ThemeProvider } from "@/lib/theme";
import { ConvexClientProvider } from "./ConvexClientProvider";

export const metadata: Metadata = {
  title: "PlayWhatever — Multiplayer Party Games",
  description: "Fast, low-friction Indian and global party games for everyone.",
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
            {children}
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
