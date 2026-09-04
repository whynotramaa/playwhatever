/**
 * The word, handed to the clue-givers on a vintage cinema stub.
 *
 * A ticket, not a card, because a ticket is a thing you hold facing yourself.
 * The tear runs down the side rather than across the bottom, so it does not
 * read as the same object as the Traitors postcard.
 */
export function MovieTicket({
  word,
  category,
  serial,
}: {
  word: string;
  category?: string;
  serial: number;
}) {
  return (
    <article className="movie-ticket">
      <span className="movie-ticket-stub" aria-hidden="true">Admit One</span>
      <div className="movie-ticket-body">
        <span className="movie-ticket-brand">Dumb Charadess · Matinee</span>
        <p className="display movie-ticket-word">{word}</p>
        <span className="movie-ticket-meta">
          <b>{category ?? "Anything"}</b>
          <span>No. {String(serial).padStart(3, "0")}</span>
        </span>
      </div>
    </article>
  );
}
