import { ConvexError, v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { authComponent } from "./auth";
import { startSession as startTraitors } from "./traitors";
import { startSession as startLiar } from "./liar";
import { startSession as startIpl } from "./ipl";
import { startSession as startCharades } from "./charades";

/**
 * The one door into a game. Every module gets the same guarantees: the caller
 * is the host, the room is waiting, the seats are filled, and the session row
 * exists. What happens in the first round is the module's business.
 */
type GameStarter = (ctx: MutationCtx, session: Doc<"gameSessions">, players: Doc<"roomPlayers">[]) => Promise<void>;

const STARTERS: Record<string, GameStarter> = {
  traitors: startTraitors,
  "guess-the-liar": startLiar,
  "ipl-guessr": startIpl,
  "dumb-charadess": startCharades,
};

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_ROOM_PLAYERS = 12;

function makeRoomCode() {
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

function cleanDisplayName(value: string) {
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > 24) {
    throw new ConvexError("Use a display name between 1 and 24 characters.");
  }
  return name;
}

async function currentUser(ctx: Parameters<typeof authComponent.getAuthUser>[0]) {
  try {
    return await authComponent.getAuthUser(ctx);
  } catch {
    throw new ConvexError("Your session expired. Please join again.");
  }
}

export const getByCode = query({
  args: { roomCode: v.string() },
  returns: v.any(),
  handler: async (ctx, { roomCode }) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_roomCode", (q) => q.eq("roomCode", roomCode.trim().toUpperCase()))
      .first();
    if (!room || room.status === "closed") return null;
    const game = await ctx.db.get(room.gameId);
    const players = await ctx.db
      .query("roomPlayers")
      .withIndex("by_roomId", (q) => q.eq("roomId", room._id))
      .take(MAX_ROOM_PLAYERS);
    const currentSession = await ctx.db
      .query("gameSessions")
      .withIndex("by_roomId", (q) => q.eq("roomId", room._id))
      .order("desc")
      .first();
    return { room, game, players, currentSession };
  },
});

export const get = query({
  args: { roomId: v.id("rooms") },
  returns: v.any(),
  handler: async (ctx, { roomId }) => {
    const room = await ctx.db.get(roomId);
    if (!room || room.status === "closed") return null;
    const game = await ctx.db.get(room.gameId);
    const players = await ctx.db
      .query("roomPlayers")
      .withIndex("by_roomId", (q) => q.eq("roomId", roomId))
      .take(MAX_ROOM_PLAYERS);
    let currentPlayer = null;
    try {
      const user = await authComponent.getAuthUser(ctx);
      currentPlayer = players.find((player) => player.userId === user._id) ?? null;
    } catch {
      // The realtime room itself remains readable while auth is rehydrating.
    }
    const currentSession = await ctx.db
      .query("gameSessions")
      .withIndex("by_roomId", (q) => q.eq("roomId", roomId))
      .order("desc")
      .first();
    return { room, game, players, currentPlayer, currentSession };
  },
});

/**
 * Only the settings a game actually supports survive this, at values it can
 * cope with. The form mirrors these rules (`src/lib/games.ts`); this is the
 * copy that counts.
 */
function cleanSettings(slug: string, raw: Record<string, unknown> | undefined) {
  const clamp = (value: unknown, fallback: number, min: number, max: number) => {
    const parsed = Math.floor(Number(value ?? fallback));
    return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
  };
  const settings: Record<string, unknown> = {};
  if (slug === "traitors") {
    settings.adult = raw?.adult === true;
  }
  if (slug === "guess-the-liar") {
    settings.adult = raw?.adult === true;
    settings.rounds = clamp(raw?.rounds, 5, 1, 20);
  }
  if (slug === "ipl-guessr") {
    settings.rounds = clamp(raw?.rounds, 5, 1, 20);
    settings.timerSeconds = clamp(raw?.timerSeconds, 120, 30, 180);
  }
  if (slug === "dumb-charadess") {
    // No round count: everybody guesses once, so the players are the rounds.
    // Seconds here are one clue-giver's turn, not the whole round.
    settings.timerSeconds = clamp(raw?.timerSeconds, 30, 15, 120);
    settings.maxTries = clamp(raw?.maxTries, 3, 1, 6);
  }
  return settings;
}

export const create = mutation({
  args: {
    gameSlug: v.string(),
    displayName: v.string(),
    maxPlayers: v.optional(v.number()),
    settings: v.optional(v.any()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await currentUser(ctx);
    // Guests play, accounts host. The room outlives the tab it was made in, so
    // it needs an owner who can come back to it.
    if (user.isAnonymous) throw new ConvexError("Sign in to host a room. Guests can still join with a code.");
    const game = await ctx.db
      .query("games")
      .withIndex("by_slug", (q) => q.eq("slug", args.gameSlug))
      .first();
    if (!game?.isPublished) throw new ConvexError("That game is not available yet.");

    const maxPlayers = Math.floor(args.maxPlayers ?? game.playerMax);
    if (maxPlayers < game.playerMin || maxPlayers > Math.min(game.playerMax, MAX_ROOM_PLAYERS)) {
      throw new ConvexError(`Choose between ${game.playerMin} and ${Math.min(game.playerMax, MAX_ROOM_PLAYERS)} players.`);
    }

    let roomCode = makeRoomCode();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const existing = await ctx.db
        .query("rooms")
        .withIndex("by_roomCode", (q) => q.eq("roomCode", roomCode))
        .first();
      if (!existing || existing.status === "closed") break;
      roomCode = makeRoomCode();
    }

    const now = Date.now();
    const roomId = await ctx.db.insert("rooms", {
      roomCode,
      gameId: game._id,
      hostUserId: user._id,
      status: "waiting",
      maxPlayers,
      settings: cleanSettings(game.slug, args.settings),
      createdAt: now,
    });
    await ctx.db.insert("roomPlayers", {
      roomId,
      userId: user._id,
      displayName: cleanDisplayName(args.displayName),
      isHost: true,
      status: "connected",
      score: 0,
      joinedAt: now,
      lastSeenAt: now,
    });
    return { roomId, roomCode };
  },
});

export const join = mutation({
  args: { roomCode: v.string(), displayName: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await currentUser(ctx);
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_roomCode", (q) => q.eq("roomCode", args.roomCode.trim().toUpperCase()))
      .first();
    if (!room || room.status === "closed") throw new ConvexError("That room does not exist.");

    // A seat you already hold gets you back in, even mid-game. Reconnecting is
    // not joining, so it happens before the room-status check.
    const existing = await ctx.db
      .query("roomPlayers")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", room._id).eq("userId", user._id))
      .first();
    if (existing) {
      if (existing.status === "removed") throw new ConvexError("The host removed you from this room.");
      await ctx.db.patch(existing._id, { status: "connected", lastSeenAt: Date.now() });
      return { roomId: room._id, roomCode: room.roomCode };
    }

    if (room.status !== "waiting") throw new ConvexError("That game has already started.");

    const players = await ctx.db
      .query("roomPlayers")
      .withIndex("by_roomId", (q) => q.eq("roomId", room._id))
      .take(MAX_ROOM_PLAYERS);
    const seated = players.filter((player) => player.status !== "removed");
    if (seated.length >= room.maxPlayers) {
      throw new ConvexError("That room is full.");
    }

    const displayName = cleanDisplayName(args.displayName);
    // Two players called "Rohit" makes the vote list meaningless.
    if (seated.some((player) => player.displayName.toLowerCase() === displayName.toLowerCase())) {
      throw new ConvexError("Somebody in this room already goes by that name.");
    }

    await ctx.db.insert("roomPlayers", {
      roomId: room._id,
      userId: user._id,
      displayName,
      isHost: false,
      status: "connected",
      score: 0,
      joinedAt: Date.now(),
      lastSeenAt: Date.now(),
    });
    return { roomId: room._id, roomCode: room.roomCode };
  },
});

export const leave = mutation({
  args: { roomId: v.id("rooms") },
  returns: v.null(),
  handler: async (ctx, { roomId }) => {
    const user = await currentUser(ctx);
    const player = await ctx.db
      .query("roomPlayers")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", roomId).eq("userId", user._id))
      .first();
    if (player) {
      await ctx.db.patch(player._id, {
        status: "disconnected",
        lastSeenAt: Date.now(),
        inVoice: false,
      });
    }
    return null;
  },
});

/**
 * Presence, cheaply. Every open room screen calls this on a timer and the UI
 * decides who looks away from a stale `lastSeenAt`. No cron, no connection
 * table, and a missed beat costs nothing.
 *
 * Returns this deployment's clock. `lastSeenAt` is stamped here, so a client
 * comparing it against its own `Date.now()` is comparing two different clocks
 * and will call a player away over nothing but skew.
 */
export const heartbeat = mutation({
  args: { roomId: v.id("rooms") },
  returns: v.number(),
  handler: async (ctx, { roomId }) => {
    try {
      const user = await authComponent.getAuthUser(ctx);
      const player = await ctx.db
        .query("roomPlayers")
        .withIndex("by_room_and_user", (q) => q.eq("roomId", roomId).eq("userId", user._id))
        .first();
      if (player && player.status === "connected") {
        await ctx.db.patch(player._id, { lastSeenAt: Date.now() });
      } else if (player && player.status === "disconnected") {
        await ctx.db.patch(player._id, { status: "connected", lastSeenAt: Date.now() });
      }
    } catch {
      // No session yet. The next beat will land.
    }
    return Date.now();
  },
});

/** Host throws a player out. They cannot take the seat back (see `join`). */
export const removePlayer = mutation({
  args: { roomId: v.id("rooms"), playerId: v.id("roomPlayers") },
  returns: v.null(),
  handler: async (ctx, { roomId, playerId }) => {
    const user = await currentUser(ctx);
    const room = await ctx.db.get(roomId);
    if (!room) throw new ConvexError("That room does not exist.");
    if (room.hostUserId !== user._id) throw new ConvexError("Only the host can remove players.");
    const player = await ctx.db.get(playerId);
    if (!player || player.roomId !== roomId) throw new ConvexError("That player is not in this room.");
    if (player.isHost) throw new ConvexError("The host cannot be removed.");
    await ctx.db.patch(playerId, { status: "removed", removedAt: Date.now() });
    return null;
  },
});

/** Host closes the room for good. Closed rooms read as gone everywhere. */
export const close = mutation({
  args: { roomId: v.id("rooms") },
  returns: v.null(),
  handler: async (ctx, { roomId }) => {
    const user = await currentUser(ctx);
    const room = await ctx.db.get(roomId);
    if (!room) throw new ConvexError("That room does not exist.");
    if (room.hostUserId !== user._id) throw new ConvexError("Only the host can close the room.");
    await ctx.db.patch(roomId, { status: "closed", finishedAt: Date.now() });
    return null;
  },
});

/**
 * The host stops a game that is under way. The session, its rounds and their
 * submissions go, scores go back to zero, and the room drops to the lobby
 * where the same players can start again without rejoining. Closing the room
 * is the other button: that one ends the evening.
 */
export const endGame = mutation({
  args: { roomId: v.id("rooms") },
  returns: v.null(),
  handler: async (ctx, { roomId }) => {
    const user = await currentUser(ctx);
    const room = await ctx.db.get(roomId);
    if (!room || room.status === "closed") throw new ConvexError("That room does not exist.");
    if (room.hostUserId !== user._id) throw new ConvexError("Only the host can end the game.");

    const sessions = await ctx.db
      .query("gameSessions")
      .withIndex("by_roomId", (q) => q.eq("roomId", roomId))
      .collect();
    for (const session of sessions) {
      const rounds = await ctx.db
        .query("rounds")
        .withIndex("by_sessionId", (q) => q.eq("sessionId", session._id))
        .collect();
      for (const round of rounds) {
        const submissions = await ctx.db
          .query("submissions")
          .withIndex("by_roundId", (q) => q.eq("roundId", round._id))
          .collect();
        for (const submission of submissions) await ctx.db.delete(submission._id);
        await ctx.db.delete(round._id);
      }
      await ctx.db.delete(session._id);
    }

    // A fresh game on the same room starts everyone level.
    const players = await ctx.db
      .query("roomPlayers")
      .withIndex("by_roomId", (q) => q.eq("roomId", roomId))
      .take(MAX_ROOM_PLAYERS);
    for (const player of players) {
      if (player.score !== 0) await ctx.db.patch(player._id, { score: 0 });
    }

    await ctx.db.patch(roomId, { status: "waiting" });
    return null;
  },
});

export const startGame = mutation({
  args: { roomId: v.id("rooms") },
  returns: v.any(),
  handler: async (ctx, { roomId }) => {
    const user = await currentUser(ctx);
    const room = await ctx.db.get(roomId);
    if (!room || room.status === "closed") throw new ConvexError("That room does not exist.");
    if (room.status !== "waiting") throw new ConvexError("This room has already started.");
    if (room.hostUserId !== user._id) throw new ConvexError("Only the host can start the game.");

    const game = await ctx.db.get(room.gameId);
    const starter = game ? STARTERS[game.slug] : undefined;
    if (!game || !starter) throw new ConvexError("That game is not playable yet.");

    const players = (
      await ctx.db
        .query("roomPlayers")
        .withIndex("by_roomId", (q) => q.eq("roomId", roomId))
        .take(MAX_ROOM_PLAYERS)
    ).filter((player) => player.status !== "removed");
    if (players.length < game.playerMin) throw new ConvexError(`Need at least ${game.playerMin} players.`);

    const now = Date.now();
    const sessionId = await ctx.db.insert("gameSessions", {
      roomId,
      gameId: room.gameId,
      currentRound: 0,
      totalRounds: 0,
      state: { kind: game.slug },
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(roomId, { status: "in_progress", startedAt: now });

    const session = await ctx.db.get(sessionId);
    if (!session) throw new ConvexError("The game could not be started.");
    await starter(ctx, session, players);
    return { sessionId };
  },
});
