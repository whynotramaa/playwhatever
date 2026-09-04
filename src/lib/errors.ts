import { ConvexError } from "convex/values";

/**
 * The message a Convex mutation meant to show.
 *
 * A thrown ConvexError arrives with the readable string in `data`; its
 * `message` is wrapped in request ids and stack noise that nobody should read
 * in a party game.
 */
export function errorText(thrown: unknown, fallback: string) {
  if (thrown instanceof ConvexError) {
    return typeof thrown.data === "string" ? thrown.data : fallback;
  }
  return thrown instanceof Error ? thrown.message : fallback;
}
