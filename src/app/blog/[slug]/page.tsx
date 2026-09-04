import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { POSTS, postFor } from "@/content/blog";

export const dynamicParams = false;

export function generateStaticParams() {
  return POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = postFor(slug);
  if (!post) return {};
  return {
    title: `${post.title} · PlayWhatever`,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { title: post.title, description: post.description, url: `/blog/${post.slug}`, type: "article" },
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = postFor(slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl w-full mx-auto px-5 py-12 lg:px-10 lg:py-16 flex flex-col gap-8">
        {/* Search engines read the rules as an article; people read the page. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: post.title,
              description: post.description,
              mainEntityOfPage: `https://playwhatever.ramaa.tech/blog/${post.slug}`,
              publisher: { "@type": "Organization", name: "PlayWhatever" },
            }),
          }}
        />

        <div className="game-detail-art">
          <img src={post.art} alt="" />
        </div>

        <header className="flex flex-col gap-2">
          <p className="label">{post.players} · {post.genre}</p>
          <h1 className="display">{post.title}</h1>
          <p className="body text-lg text-[var(--color-text-secondary)]">{post.description}</p>
        </header>

        {post.sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-3">
            <h2 className="section-title">{section.heading}</h2>
            {section.body && <p className="body text-[var(--color-text-secondary)]">{section.body}</p>}
            {section.steps && (
              <ol className="rules-steps">
                {section.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            )}
          </section>
        ))}

        {post.shot && (
          <figure className="rules-shot">
            <img src={post.shot.src} alt={post.shot.caption} />
            <figcaption className="small muted">{post.shot.caption}</figcaption>
          </figure>
        )}

        <div className="flex flex-wrap gap-3">
          {post.gameSlug && (
            <Link href={`/games/${post.gameSlug}`} className="small underline">Host this game</Link>
          )}
          {!post.gameSlug && <Link href="/daily" className="small underline">Play today&apos;s player</Link>}
          <Link href="/blog" className="small muted underline">All rules</Link>
        </div>
      </main>
    </div>
  );
}
