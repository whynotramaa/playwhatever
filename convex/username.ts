/**
 * Username rules, shared by the Convex validators and the login UI so both
 * reject the same strings with the same wording. The client checks format
 * before it ever hits the network; the server re-checks because the client
 * is not trusted.
 */

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;

const SHAPE = /^[a-z][a-z0-9_]*$/;

// Route segments and support-impersonation risks. Keep it short; this is not
// a moderation system.
const RESERVED = new Set([
  "about", "admin", "api", "auth", "games", "help", "host", "join", "login",
  "logout", "me", "new", "play", "playwhatever", "profile", "room", "rooms",
  "root", "settings", "signup", "support", "system", "team", "welcome",
]);

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

/** Returns a human-readable problem, or null when the name is well formed. */
export function validateUsername(normalized: string): string | null {
  if (normalized.length < USERNAME_MIN) {
    return `At least ${USERNAME_MIN} characters.`;
  }
  if (normalized.length > USERNAME_MAX) {
    return `At most ${USERNAME_MAX} characters.`;
  }
  if (!SHAPE.test(normalized)) {
    return "Start with a letter. Use letters, numbers, and underscores.";
  }
  if (RESERVED.has(normalized)) {
    return "That one is reserved.";
  }
  return null;
}
