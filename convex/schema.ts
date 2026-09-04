import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({
    userId: v.string(),
    // Lowercased handle. Absent for guests, who only ever get a displayName.
    username: v.optional(v.string()),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    isAnonymous: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_username", ["username"]),

  games: defineTable({
    slug: v.string(),
    name: v.string(),
    shortDescription: v.string(),
    longDescription: v.string(),
    playerMin: v.number(),
    playerMax: v.number(),
    estimatedMinutes: v.number(),
    categories: v.array(v.string()),
    accentColor: v.string(),
    // Shelf emoji. Content, not component code (architecture rule 7).
    mark: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    isPublished: v.boolean(),
    sortOrder: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_published", ["isPublished", "sortOrder"]),

  gameContent: defineTable({
    gameId: v.id("games"),
    contentType: v.union(
      v.literal("person"),
      v.literal("event"),
      v.literal("meme"),
      v.literal("phrase"),
      v.literal("image"),
      v.literal("prompt"),
      v.literal("pair")
    ),
    title: v.string(),
    description: v.optional(v.string()),
    region: v.union(
      v.literal("india"),
      v.literal("south_asia"),
      v.literal("global"),
      v.literal("mixed")
    ),
    category: v.string(),
    difficulty: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    metadata: v.optional(v.any()),
    isPublished: v.boolean(),
  })
    .index("by_gameId", ["gameId"])
    .index("by_game_region_category", ["gameId", "region", "category"]),

  rooms: defineTable({
    roomCode: v.string(),
    gameId: v.id("games"),
    hostUserId: v.string(),
    status: v.union(
      v.literal("waiting"),
      v.literal("starting"),
      v.literal("in_progress"),
      v.literal("round_complete"),
      v.literal("finished"),
      v.literal("closed")
    ),
    maxPlayers: v.number(),
    settings: v.any(),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
  })
    .index("by_roomCode", ["roomCode"])
    .index("by_status", ["status"])
    .index("by_host", ["hostUserId"]),

  roomPlayers: defineTable({
    roomId: v.id("rooms"),
    userId: v.string(),
    displayName: v.string(),
    isHost: v.boolean(),
    status: v.union(
      v.literal("connected"),
      v.literal("disconnected"),
      v.literal("removed")
    ),
    score: v.number(),
    joinedAt: v.number(),
    lastSeenAt: v.number(),
    removedAt: v.optional(v.number()),
    // Voice. Absent on every row written before voice existed, which reads
    // correctly as "not in the call, not muted".
    inVoice: v.optional(v.boolean()),
    micMuted: v.optional(v.boolean()),
  })
    .index("by_roomId", ["roomId"])
    .index("by_room_and_user", ["roomId", "userId"])
    .index("by_userId", ["userId"]),

  /**
   * WebRTC handshake traffic, one row per message, deleted by the recipient as
   * soon as it is applied. Convex carries the metadata; the audio itself never
   * touches the database.
   */
  voiceSignals: defineTable({
    roomId: v.id("rooms"),
    fromPlayerId: v.id("roomPlayers"),
    toPlayerId: v.id("roomPlayers"),
    kind: v.union(v.literal("offer"), v.literal("answer"), v.literal("ice")),
    payload: v.string(),
    createdAt: v.number(),
  }).index("by_recipient", ["toPlayerId"]),

  gameSessions: defineTable({
    roomId: v.id("rooms"),
    gameId: v.id("games"),
    currentRound: v.number(),
    totalRounds: v.number(),
    state: v.any(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_roomId", ["roomId"]),

  rounds: defineTable({
    sessionId: v.id("gameSessions"),
    roundNumber: v.number(),
    contentId: v.optional(v.id("gameContent")),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("locked"),
      v.literal("revealing"),
      v.literal("complete")
    ),
    state: v.any(),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
  }).index("by_sessionId", ["sessionId"]),

  submissions: defineTable({
    roundId: v.id("rounds"),
    playerId: v.id("roomPlayers"),
    action: v.string(),
    result: v.optional(v.any()),
    score: v.number(),
    createdAt: v.number(),
  })
    .index("by_roundId", ["roundId"])
    .index("by_round_player", ["roundId", "playerId"]),

  /**
   * Player of the Day. One puzzle per day, the same one for everybody, frozen
   * into a row the first time anyone opens it so that a later seed run cannot
   * retroactively change what yesterday's answer was.
   */
  dailyPuzzles: defineTable({
    // YYYY-MM-DD on the IST clock. See `dateKeyFor` in daily.ts.
    dateKey: v.string(),
    contentId: v.id("gameContent"),
    answerName: v.string(),
    answer: v.any(),
    createdAt: v.number(),
  }).index("by_dateKey", ["dateKey"]),

  /** One attempt per registered player per day. The index enforces the "once". */
  dailyAttempts: defineTable({
    userId: v.string(),
    dateKey: v.string(),
    puzzleId: v.id("dailyPuzzles"),
    guesses: v.array(v.any()),
    solvedInTries: v.optional(v.number()),
    finished: v.boolean(),
    score: v.number(),
    elapsedMs: v.optional(v.number()),
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
  })
    .index("by_user_and_date", ["userId", "dateKey"])
    .index("by_date_and_score", ["dateKey", "score"])
    .index("by_userId", ["userId"]),

  /** The running total behind the global board. One row per player. */
  dailyStats: defineTable({
    userId: v.string(),
    totalScore: v.number(),
    daysPlayed: v.number(),
    daysSolved: v.number(),
    currentStreak: v.number(),
    bestStreak: v.number(),
    lastDateKey: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_totalScore", ["totalScore"]),

  playerStats: defineTable({
    userId: v.string(),
    // "" is the all-games row. A slug is that game's row. Two writes per
    // finished game, so a leaderboard is one indexed read either way.
    gameSlug: v.string(),
    gamesPlayed: v.number(),
    gamesWon: v.number(),
    roundsWon: v.number(),
    totalScore: v.number(),
    highestScore: v.number(),
    favoriteGame: v.optional(v.string()),
    favoriteCategory: v.optional(v.string()),
    lastPlayedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_user_and_game", ["userId", "gameSlug"])
    .index("by_game_and_score", ["gameSlug", "totalScore"]),
});
