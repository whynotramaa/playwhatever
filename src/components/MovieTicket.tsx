import type { ReactNode } from "react";

/**
 * The cinema stub. Oxblood ink on aged cream, the tear running down the side
 * rather than across the bottom so it does not read as the same object as the
 * Traitors postcard.
 *
 * Two games hold something up for the room to look at, so per DESIGN.md §21
 * the geometry lives here once: Dumb Charadess hands over a word, Make Your
 * Team puts a lot on the block and stamps it when the gavel falls.
 */
export function MovieTicket({
  word,
  category,
  serial,
  brand = "Dumb Charadess · Matinee",
  stub = "Admit One",
  serialLabel = "No.",
  stamp,
}: {
  word: string;
  category?: string;
  serial: number;
  brand?: string;
  stub?: string;
  serialLabel?: string;
  stamp?: ReactNode;
}) {
  return (
    <article className="movie-ticket" data-stamped={stamp ? "true" : undefined}>
      <span className="movie-ticket-stub" aria-hidden="true">{stub}</span>
      <div className="movie-ticket-body">
        <span className="movie-ticket-brand">{brand}</span>
        <p className="display movie-ticket-word">{word}</p>
        <span className="movie-ticket-meta">
          <b>{category ?? "Anything"}</b>
          <span>{serialLabel} {String(serial).padStart(3, "0")}</span>
        </span>
      </div>
      {stamp && <span className="movie-ticket-stamp">{stamp}</span>}
    </article>
  );
}
