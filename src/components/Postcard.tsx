import clsx from "clsx";

/**
 * The traitor's mask, drawn rather than typed. An emoji is whatever font the
 * device happens to ship; this is the same face on every phone in the room,
 * and it takes the paper's ink colour like the rest of the printing.
 */
export function MaskMark({ className }: { className?: string }) {
  return (
    <svg className={clsx("mask-mark", className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 6.2c0-1.5 1.4-2 3.4-2 2.6 0 4.1 1.1 5.6 1.1s3-1.1 5.6-1.1c2 0 3.4.5 3.4 2 0 5-2.4 11.4-5.4 13-1.7.9-2.8-.1-3.6-.1s-1.9 1-3.6.1C5.4 17.6 3 11.2 3 6.2Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M6.6 9.4c1-1.2 3-1.2 4 0-1 1.6-3 1.6-4 0Z" fill="currentColor" />
      <path d="M13.4 9.4c1-1.2 3-1.2 4 0-1 1.6-3 1.6-4 0Z" fill="currentColor" />
      <path d="M10.4 14.4c1-.6 2.2-.6 3.2 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/**
 * The private card a player is dealt, drawn as a piece of Indian post.
 *
 * It says a word and what that word makes you. Nothing else: a card you have
 * to keep from the table is read in a glance and then covered, so any line of
 * instruction on it is a line nobody reads. The rules live in the lobby.
 */
export function Postcard({
  word,
  role,
  className,
}: {
  word: string;
  role: "traitor" | "innocent";
  className?: string;
}) {
  return (
    <article className={clsx("postcard", className)} data-role={role}>
      <span className="postcard-mark" aria-hidden="true">डाक</span>
      <span className="postcard-stamp" aria-hidden="true">
        {role === "traitor" ? <MaskMark /> : "🪷"}
      </span>
      <p className="display postcard-word">{word}</p>
      <p className="postcard-role">
        {role === "traitor" && <MaskMark className="is-inline" />}
        {role === "traitor" ? "Traitor" : "Innocent"}
      </p>
      <span className="postcard-punch" aria-hidden="true" />
    </article>
  );
}
