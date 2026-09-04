/**
 * The launch games. Content, not component code (architecture rule 7).
 * `slug` is the stable key; everything else is editable in the dashboard.
 */
export type GameSeed = {
  slug: string;
  mark: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  playerMin: number;
  playerMax: number;
  estimatedMinutes: number;
  categories: string[];
  accentColor: string;
  isPublished: boolean;
  sortOrder: number;
};

export const GAMES: GameSeed[] = [
  {
    slug: "traitors",
    mark: "🕵️",
    name: "Traitors",
    shortDescription: "Spot the odd name before the room turns on you.",
    longDescription:
      "Most players share a name. One player gets a similar name, speaks under pressure, and tries to survive the vote.",
    playerMin: 3,
    playerMax: 12,
    estimatedMinutes: 15,
    categories: ["Popular", "Bluff", "Indian", "Quick games"],
    accentColor: "#ffdfd9",
    isPublished: true,
    sortOrder: 1,
  },
  {
    slug: "guess-the-liar",
    mark: "🤥",
    name: "Guess the Liar",
    shortDescription: "One question, one liar, and a room full of opinions.",
    longDescription:
      "Everyone answers the same question. One player has been told to lie about it. The answers go up together, the room argues, and everybody votes for whoever is faking it.",
    playerMin: 3,
    playerMax: 12,
    estimatedMinutes: 15,
    categories: ["Popular", "Bluff", "Indian", "Global"],
    accentColor: "#d4edff",
    isPublished: true,
    sortOrder: 5,
  },
  {
    slug: "dumb-charadess",
    mark: "\ud83c\udfad",
    name: "Dumb Charadess",
    shortDescription: "One guesser, no hints, and a room acting its heart out.",
    longDescription:
      "Everybody but one player sees the same word. They act it out one at a time, thirty seconds each, and the guesser types. Right answer, plus a point. Out of tries, minus one. The guesser's chair goes round the table.",
    playerMin: 3,
    playerMax: 12,
    estimatedMinutes: 20,
    categories: ["Popular", "Acting", "Indian", "Global"],
    accentColor: "#ded4ff",
    isPublished: true,
    sortOrder: 3,
  },
  {
    slug: "ipl-guessr",
    mark: "🏏",
    name: "IPL Guessr",
    shortDescription: "Eight guesses to name the IPL player. Fastest one wins.",
    longDescription:
      "One player from any IPL season is hiding. Every guess you make comes back marked against the answer's team, country, role, batting hand, birth year and debut season. Eight tries, everyone racing the same clock.",
    playerMin: 1,
    playerMax: 12,
    estimatedMinutes: 12,
    categories: ["Popular", "Cricket", "Indian", "Quick games"],
    accentColor: "#d9f3e4",
    isPublished: true,
    sortOrder: 2,
  },
  {
    slug: "make-your-team",
    mark: "\ud83e\uddfe",
    name: "Make Your Team",
    shortDescription: "One purse each. Outbid the room, then find out what you bought.",
    longDescription:
      "The host picks a pool and hands everyone the same budget. Lots come up one at a time and the room bids in turn order until only one bidder is left. Spend it all early and you watch the rest of the auction. At the end the squads are scored and ranked into tiers.",
    playerMin: 2,
    playerMax: 8,
    estimatedMinutes: 18,
    categories: ["Popular", "Auction", "Indian", "Global"],
    accentColor: "#fff36a",
    isPublished: true,
    sortOrder: 4,
  },
];
