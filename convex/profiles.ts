import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { normalizeUsername, validateUsername } from "./username";

/**
 * Availability check for the username field.
 *
 * Cost: one indexed point read, and only when the client already knows the
 * string is well formed. The UI debounces and skips short input, so typing
 * "rohit_sharma" costs one document read, not twelve.
 */
export const isUsernameAvailable = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const name = normalizeUsername(username);
    const problem = validateUsername(name);
    if (problem) {
      return { available: false, problem };
    }
    const taken = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", name))
      .first();
    return { available: taken === null, problem: null };
  },
});

/**
 * The signed-in user's profile, or null. Reads the identity subject directly
 * rather than going through the Better Auth component, which would cost two
 * extra round trips for a value the JWT already carries.
 */
export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    return await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();
  },
});

/**
 * Claims a username and creates the profile on first authenticated use.
 *
 * The availability query above is advisory. This is the check that counts:
 * Convex mutations are transactional, so the read and the write cannot
 * interleave with a competing claim.
 */
export const claimUsername = mutation({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const user = await authComponent.getAuthUser(ctx);
    if (user.isAnonymous) {
      throw new ConvexError("Guests do not need a username.");
    }
    if (!user.emailVerified) {
      throw new ConvexError("Confirm your email before picking a username.");
    }

    const name = normalizeUsername(username);
    const problem = validateUsername(name);
    if (problem) {
      throw new ConvexError(problem);
    }

    // identity.subject and the Better Auth user _id are the same value.
    const userId = user._id as string;
    const mine = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    const taken = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", name))
      .first();
    if (taken && taken._id !== mine?._id) {
      throw new ConvexError("That username is taken.");
    }

    const now = Date.now();
    if (mine) {
      await ctx.db.patch(mine._id, { username: name, updatedAt: now });
      return { username: name };
    }
    await ctx.db.insert("profiles", {
      userId,
      username: name,
      displayName: user.name || name,
      avatarUrl: user.image ?? undefined,
      isAnonymous: false,
      createdAt: now,
      updatedAt: now,
    });
    return { username: name };
  },
});

/**
 * Moves a guest's seat to the account they just signed in with.
 *
 * Called by the Better Auth anonymous plugin at link time, right before it
 * deletes the anonymous user. Only rows keyed by the old user id need moving:
 * a guest never has a profile, and guest stats are deliberately not stored
 * (PLAN.md phase 12 item 9).
 */
export const transferGuestData = internalMutation({
  args: { fromUserId: v.string(), toUserId: v.string() },
  handler: async (ctx, { fromUserId, toUserId }) => {
    const seats = await ctx.db
      .query("roomPlayers")
      .withIndex("by_userId", (q) => q.eq("userId", fromUserId))
      .collect();
    for (const seat of seats) {
      // A room the account already sits in would end up with two seats.
      const existing = await ctx.db
        .query("roomPlayers")
        .withIndex("by_room_and_user", (q) => q.eq("roomId", seat.roomId).eq("userId", toUserId))
        .first();
      if (existing) {
        await ctx.db.delete(seat._id);
      } else {
        await ctx.db.patch(seat._id, { userId: toUserId });
      }
    }
    const hosted = await ctx.db
      .query("rooms")
      .withIndex("by_host", (q) => q.eq("hostUserId", fromUserId))
      .collect();
    for (const room of hosted) {
      await ctx.db.patch(room._id, { hostUserId: toUserId });
    }
    return { seats: seats.length, hosted: hosted.length };
  },
});
