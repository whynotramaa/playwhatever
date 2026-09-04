import type { Metadata } from "next";
import { postForGame } from "@/content/blog";
import { GameDetail } from "./GameDetail";

/**
 * The rules post is also the game's description of record, so the title and
 * the meta description come off the same entry the rules page renders.
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = postForGame(slug);
  if (!post) return {};
  const name = post.title.replace(/ rules$/, "");
  return {
    title: `${name} · PlayWhatever`,
    description: post.description,
    alternates: { canonical: `/games/${slug}` },
    openGraph: { title: name, description: post.description, url: `/games/${slug}` },
  };
}

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <GameDetail slug={slug} />;
}
