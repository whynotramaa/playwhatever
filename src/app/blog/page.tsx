import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { POSTS } from "@/content/blog";

export const metadata: Metadata = {
  title: "Game rules · PlayWhatever",
  description: "How every PlayWhatever game runs: the round, the scoring, and what a host can change.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndex() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl w-full mx-auto px-5 py-12 lg:px-10 lg:py-16 flex flex-col gap-10">
        <header className="flex flex-col gap-2">
          <h1 className="display">Rules</h1>
          <p className="body text-[var(--color-text-secondary)]">
            One page per game. What it is, how a round runs, how it scores.
          </p>
        </header>

        <div className="flex flex-col gap-3">
          {POSTS.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="daily-strip">
              <span className="daily-copy">
                <span className="label">{post.players} · {post.genre}</span>
                <span className="card-title text-lg font-normal">{post.title}</span>
                <span className="small muted">{post.description}</span>
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
