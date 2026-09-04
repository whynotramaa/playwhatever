import { ConvexError, v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { authComponent } from "./auth";

const MAX_ROOM_PLAYERS = 12;
// An SDP offer runs a few KB. Anything past this is not a handshake.
const MAX_PAYLOAD = 16_000;

/**
 * Room voice, platform-owned (PLAN.md phase 13). Games may sit inside a room
 * that has voice; no game module owns a peer connection, a microphone
 * permission, or a mute button.
 *
 * The audio is peer-to-peer. Convex carries only the handshake and one piece
 * of shared state: who is muted. That state is the whole permission model.
 */

/** The caller's seat in this room, or null. Never trusts a client-sent id. */
async function seatIn(ctx: QueryCtx | MutationCtx, roomId: Id<"rooms">) {
  const user = await authComponent.getAuthUser(ctx);
  const player = await ctx.db
    .query("roomPlayers")
    .withIndex("by_room_and_user", (q) => q.eq("roomId", roomId).eq("userId", user._id))
    .first();
  if (!player || player.status === "removed") return null;
  return player;
}

async function requireSeat(ctx: MutationCtx, roomId: Id<"rooms">) {
  let seat = null;
  try {
    seat = await seatIn(ctx, roomId);
  } catch {
    throw new ConvexError("Your session expired. Please join again.");
  }
  if (!seat) throw new ConvexError("You are not in this room.");
  return seat;
}

/** Handshake messages addressed to me. The client deletes them as it applies them. */
export const signals = query({
  args: { roomId: v.id("rooms") },
  returns: v.any(),
  handler: async (ctx, { roomId }) => {
    let me = null;
    try {
      me = await seatIn(ctx, roomId);
    } catch {
      return [];
    }
    if (!me) return [];
    return await ctx.db
      .query("voiceSignals")
      .withIndex("by_recipient", (q) => q.eq("toPlayerId", me._id))
      .collect();
  },
});

export const sendSignal = mutation({
  args: {
    roomId: v.id("rooms"),
    toPlayerId: v.id("roomPlayers"),
    kind: v.union(v.literal("offer"), v.literal("answer"), v.literal("ice")),
    payload: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { roomId, toPlayerId, kind, payload }) => {
    const me = await requireSeat(ctx, roomId);
    if (payload.length > MAX_PAYLOAD) throw new ConvexError("That is not a handshake.");
    const to = await ctx.db.get(toPlayerId);
    if (!to || to.roomId !== roomId) throw new ConvexError("That player is not in this room.");
    await ctx.db.insert("voiceSignals", {
      roomId,
      fromPlayerId: me._id,
      toPlayerId,
      kind,
      payload,
      createdAt: Date.now(),
    });
    return null;
  },
});

export const ackSignals = mutation({
  args: { roomId: v.id("rooms"), ids: v.array(v.id("voiceSignals")) },
  returns: v.null(),
  handler: async (ctx, { roomId, ids }) => {
    const me = await requireSeat(ctx, roomId);
    for (const id of ids) {
      const signal = await ctx.db.get(id);
      // Only ever your own mail.
      if (signal && signal.toPlayerId === me._id) await ctx.db.delete(id);
    }
    return null;
  },
});

/**
 * Enter the call. Joins unmuted: the mic permission prompt was the consent,
 * and a party game where everyone arrives silent starts badly.
 */
export const join = mutation({
  args: { roomId: v.id("rooms") },
  returns: v.null(),
  handler: async (ctx, { roomId }) => {
    const me = await requireSeat(ctx, roomId);
    // Anything already queued for this seat belongs to a dead session.
    // ponytail: no cron sweep. Signals are cleared on join and on leave, which
    // covers every path that produces them; add one if orphans ever pile up.
    const stale = await ctx.db
      .query("voiceSignals")
      .withIndex("by_recipient", (q) => q.eq("toPlayerId", me._id))
      .collect();
    for (const signal of stale) await ctx.db.delete(signal._id);
    await ctx.db.patch(me._id, { inVoice: true, micMuted: false });
    return null;
  },
});

export const leave = mutation({
  args: { roomId: v.id("rooms") },
  returns: v.null(),
  handler: async (ctx, { roomId }) => {
    const me = await requireSeat(ctx, roomId);
    const stale = await ctx.db
      .query("voiceSignals")
      .withIndex("by_recipient", (q) => q.eq("toPlayerId", me._id))
      .collect();
    for (const signal of stale) await ctx.db.delete(signal._id);
    await ctx.db.patch(me._id, { inVoice: false, micMuted: false });
    return null;
  },
});

/**
 * Your microphone, your switch, both ways. This mutation writes one row and it
 * is always the caller's own, so there is no shape of argument that lets one
 * player reach another player's mic.
 */
export const setMyMute = mutation({
  args: { roomId: v.id("rooms"), muted: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { roomId, muted }) => {
    const me = await requireSeat(ctx, roomId);
    await ctx.db.patch(me._id, { micMuted: muted });
    return null;
  },
});

/**
 * The host's one voice control, and it only points one way.
 *
 * This writes `true` and nothing but `true`. There is deliberately no host
 * unmute anywhere in this file: a host can quiet the room to get a round
 * started, and every microphone comes back on only when the person it belongs
 * to says so, through `setMyMute`.
 *
 * ponytail: the mute is applied by each client to its own outgoing track, so
 * it holds against the app, not against a patched client. Real enforcement
 * needs an SFU that can drop the audio server-side; that arrives with the
 * media server, if it ever arrives.
 */
export const muteEveryone = mutation({
  args: { roomId: v.id("rooms") },
  returns: v.number(),
  handler: async (ctx, { roomId }) => {
    const room = await ctx.db.get(roomId);
    if (!room) throw new ConvexError("That room does not exist.");
    const me = await requireSeat(ctx, roomId);
    if (room.hostUserId !== me.userId) throw new ConvexError("Only the host can mute the room.");

    const players = await ctx.db
      .query("roomPlayers")
      .withIndex("by_roomId", (q) => q.eq("roomId", roomId))
      .take(MAX_ROOM_PLAYERS);

    let muted = 0;
    for (const player of players) {
      if (player.status === "removed" || !player.inVoice || player.micMuted === true) continue;
      await ctx.db.patch(player._id, { micMuted: true });
      muted += 1;
    }
    return muted;
  },
});
