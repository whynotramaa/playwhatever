/**
 * The rules, written out. One entry per shipped game plus the daily puzzle.
 *
 * This is also the site's list of indexable game pages: `sitemap.ts` and the
 * game page's `generateMetadata` both read it, so a game gets its rules page,
 * its sitemap row and its own title in one edit.
 */
export type Post = {
  slug: string;
  /** The game's slug under /games, or null for the daily, which has no room. */
  gameSlug: string | null;
  title: string;
  /** Used as the page description and the card line on /blog. */
  description: string;
  players: string;
  genre: string;
  art: string;
  shot?: { src: string; caption: string };
  sections: { heading: string; body?: string; steps?: string[] }[];
};

export const POSTS: Post[] = [
  {
    slug: "traitors",
    gameSlug: "traitors",
    title: "Traitors rules",
    description:
      "Most of the room shares one name. One player holds a similar one and has to talk their way through the vote.",
    players: "3 to 12 players",
    genre: "Bluff",
    art: "/game-art/traitors.webp",
    shot: { src: "/blog/home.png", caption: "The shelf. A room code box sits on the front page for people who were sent one." },
    sections: [
      {
        heading: "What the game is",
        body: "Everyone gets a name in private. Most of the room gets the same one. One player, the traitor, gets a name from the same family, close enough to talk around and different enough to slip on. Nobody is told which they hold.",
      },
      {
        heading: "How a round runs",
        steps: [
          "Names go out in private and the speaking order is shuffled.",
          "Each player gets 30 seconds to say something about their name. You can pass early.",
          "The room votes. Every player has one vote and can change it until the clock stops.",
          "The result is its own screen, so nobody misses what their vote did.",
          "If nobody is voted out, a fresh set of names goes out and the order is shuffled again.",
        ],
      },
      {
        heading: "Ties",
        body: "A tie gives the tied players 15 seconds to argue, then a revote between only them. A second tie sends nobody out and the next round starts.",
      },
      {
        heading: "How it ends",
        body: "The room wins when the traitor is voted out. The traitor wins by surviving until two players are left. Winning is worth 3 points to a traitor and 2 to each player still standing on the room's side. Rounds themselves do not score.",
      },
    ],
  },
  {
    slug: "guess-the-liar",
    gameSlug: "guess-the-liar",
    title: "Guess the Liar rules",
    description:
      "Everyone answers the same question except one player, who was told to make it up. The room reads the answers and votes.",
    players: "3 to 12 players",
    genre: "Bluff",
    art: "/game-art/guess-the-liar.webp",
    sections: [
      {
        heading: "What the game is",
        body: "One question goes to the whole room. One player is quietly told to lie about it. Everyone writes an answer, the answers go up together, and the room argues about which one is invented.",
      },
      {
        heading: "How a round runs",
        steps: [
          "The question appears. The liar sees the same question and the instruction to fake it.",
          "Everyone writes an answer, up to 120 characters.",
          "All answers go up at once, with names attached.",
          "The room votes for whoever it thinks is lying.",
          "The liar is named, and the next question starts.",
        ],
      },
      {
        heading: "How scoring works",
        body: "Voting for the liar is worth 2 points. If fewer than half the votes cast land on the liar, the liar survives and takes 3.",
      },
      {
        heading: "What the host can change",
        body: "Round count, 1 to 20, five by default. There is also an adult switch on the question pool.",
      },
    ],
  },
  {
    slug: "dumb-charadess",
    gameSlug: "dumb-charadess",
    title: "Dumb Charadess rules",
    description:
      "The room shares a word and acts it out one player at a time. One guesser sees none of it and types.",
    players: "3 to 12 players",
    genre: "Acting",
    art: "/game-art/dumb-charadess.webp",
    sections: [
      {
        heading: "What the game is",
        body: "Everybody except one player sees the word. They act it out in turn while the guesser watches and types. The guesser's chair moves round the table, so the round count is the player count.",
      },
      {
        heading: "How a round runs",
        steps: [
          "The word goes to everyone but the guesser.",
          "Each actor gets 30 seconds, one after another.",
          "The guesser types whenever they think they have it.",
          "The word is revealed when the guess lands or the tries run out.",
        ],
      },
      {
        heading: "How scoring works",
        body: "Getting there is worth 1 point to the guesser. Running out of tries costs 1. Tries spent never move the score during the game, but they break ties on the final board, so the player who got there on fewer is ahead.",
      },
      {
        heading: "What the host can change",
        body: "Seconds per turn, 15 to 120, thirty by default. Guesses allowed, 1 to 6, three by default.",
      },
    ],
  },
  {
    slug: "ipl-guessr",
    gameSlug: "ipl-guessr",
    title: "IPL Guessr rules",
    description:
      "One hidden IPL player, eight guesses, and six columns of feedback on every name you spend.",
    players: "1 to 12 players",
    genre: "Cricket",
    art: "/game-art/ipl-guessr-v2.webp",
    sections: [
      {
        heading: "What the game is",
        body: "A player from any IPL season is hiding. Everyone in the room races the same clock with their own eight guesses. You are not deducing from clues. You are spending guesses to buy information.",
      },
      {
        heading: "What a guess returns",
        body: "Every guess must be a real player from the roster, and comes back marked against the answer in six columns: team, country, role, batting hand, birth year and debut season. Year columns also mark higher or lower, so the arrow tells you which way to move.",
      },
      {
        heading: "How scoring works",
        body: "Solving in n tries pays 9 minus n, so eight points for a first-guess call and one for scraping in on the eighth. Solving first pays 3 more. Missing pays nothing. Speed only pays through that first-solve bonus, so being right matters more than being quick.",
      },
      {
        heading: "What the host can change",
        body: "Round count, 1 to 20, five by default. Seconds per round, 30 to 180, two minutes by default.",
      },
    ],
  },
  {
    slug: "make-your-team",
    gameSlug: "make-your-team",
    title: "Make Your Team rules",
    description:
      "Everyone gets the same purse. Lots come up one at a time, the room bids in turn order, and the squads are ranked at the end.",
    players: "2 to 8 players",
    genre: "Auction",
    art: "/game-art/make-your-team.webp",
    sections: [
      {
        heading: "What the game is",
        body: "The host picks a pool, cricketers or footballers or film stars or characters or movies, and hands everyone the same budget. Names come up one at a time and the room bids for them. What you end up with is your squad, and at the end the squads are ranked into tiers.",
      },
      {
        heading: "How a lot runs",
        steps: [
          "A name comes up. The bid starts at zero and a different player opens each lot.",
          "On your turn you raise by 1 to 6 rupees on the keypad, or you leave the bid.",
          "Leaving is final for that lot. You cannot come back to it.",
          "Twenty seconds to act. Silence counts as leaving, so the auction never stalls.",
          "When everyone else has walked away, the lot goes to the last bidder at their own bid and the money leaves their purse.",
        ],
      },
      {
        heading: "Money",
        body: "You can never bid more than you hold, and the auctioneer skips anyone who cannot cover the next rupee. Spend everything on the first three names and you watch the rest of the auction. A lot nobody bids on goes unsold and the game moves on.",
      },
      {
        heading: "How it is scored",
        body: "Every name carries a hidden rating, and a squad scores the sum of its ratings. Money left in the purse is worth nothing, so hoarding only costs you. The best squad in the room sets the top of the table and everyone else is cut into S, A, B and C against it. The tier list saves as an image, sized for a story.",
      },
    ],
  },
  {
    slug: "player-of-the-day",
    gameSlug: null,
    title: "Player of the Day rules",
    description:
      "The same hidden IPL player for everybody, one attempt a day, on a board that runs all year.",
    players: "Solo, against everyone",
    genre: "Cricket",
    art: "/game-art/ipl-guessr.webp",
    shot: { src: "/blog/daily.png", caption: "The daily asks a guest to sign in before it deals a player." },
    sections: [
      {
        heading: "What the game is",
        body: "One IPL player, the same one for everybody, eight guesses, one go. It shares its marking rules with IPL Guessr and nothing else. There is no room, no host and no lobby.",
      },
      {
        heading: "Who can play",
        body: "Accounts only. A guest has no durable identity, so once a day would mean once per cleared cookie jar, and a board built on that is not a board. Guests get the sign-in prompt instead.",
      },
      {
        heading: "How scoring works",
        body: "Solving in n tries pays 9 minus n, eight down to one. Missing pays nothing.",
      },
      {
        heading: "The two boards",
        body: "Today ranks by fewest guesses, with the clock breaking ties. That clock starts on your first guess, not when the page opened. All time ranks by running total and carries days played and days solved.",
      },
    ],
  },
];

export const postFor = (slug: string) => POSTS.find((post) => post.slug === slug);
export const postForGame = (gameSlug: string) => POSTS.find((post) => post.gameSlug === gameSlug);
