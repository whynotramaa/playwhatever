/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as charades from "../charades.js";
import type * as content from "../content.js";
import type * as daily from "../daily.js";
import type * as games from "../games.js";
import type * as http from "../http.js";
import type * as ipl from "../ipl.js";
import type * as iplRules from "../iplRules.js";
import type * as liar from "../liar.js";
import type * as profiles from "../profiles.js";
import type * as rooms from "../rooms.js";
import type * as seed from "../seed.js";
import type * as seed_charades from "../seed/charades.js";
import type * as seed_games from "../seed/games.js";
import type * as seed_ipl from "../seed/ipl.js";
import type * as seed_liar from "../seed/liar.js";
import type * as seed_traitors from "../seed/traitors.js";
import type * as seed_types from "../seed/types.js";
import type * as stats from "../stats.js";
import type * as traitors from "../traitors.js";
import type * as username from "../username.js";
import type * as voice from "../voice.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  charades: typeof charades;
  content: typeof content;
  daily: typeof daily;
  games: typeof games;
  http: typeof http;
  ipl: typeof ipl;
  iplRules: typeof iplRules;
  liar: typeof liar;
  profiles: typeof profiles;
  rooms: typeof rooms;
  seed: typeof seed;
  "seed/charades": typeof seed_charades;
  "seed/games": typeof seed_games;
  "seed/ipl": typeof seed_ipl;
  "seed/liar": typeof seed_liar;
  "seed/traitors": typeof seed_traitors;
  "seed/types": typeof seed_types;
  stats: typeof stats;
  traitors: typeof traitors;
  username: typeof username;
  voice: typeof voice;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
