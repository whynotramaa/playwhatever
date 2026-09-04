# Games

This document describes the game ideas and their intended player experience.
`Traitors` is the first game to build.

## Traitors

### Summary

`Traitors` is a short social deduction game for 3–12 players. Most players
receive the same name. One player receives a similar but different name and
must avoid being identified during the speaking rounds.

Example for five players:

```text
4 players → Rohit Sharma
1 traitor → Virat Kohli
```

Both names must belong to the same similarity group. In this example, both
are Indian international cricketers from the same broad era. The pair should
be recognisable as related without making the answer obvious.

### Name-pair rules

Every round contains:

- one `innocentName`, given to most players;
- one `traitorName`, given to exactly one player;
- one `similarityGroup`, used to validate the pair and select content.

Good pairs share at least two meaningful traits, such as:

- Indian cricketers from a similar era;
- Bollywood actors known for similar roles;
- Indian cities in the same region;
- famous memes from the same period;
- politicians, athletes, movies, or events from the same category.

Avoid pairs where one name is much more famous, where the two names are
commonly confused, or where the traitor can be identified from a single
obvious clue.

The first version reveals the role on the private card:

```text
Your name: Rohit Sharma
You are innocent.
```

```text
Your name: Virat Kohli
You are the traitor.
```

The role hint should be configurable later. Possible future settings are:

- show role clearly;
- show only the name and let the player infer their role;
- hide the role from everyone, including the traitor.

### Round flow

#### 1. Deal private cards

The game randomly selects a valid name pair, assigns the common name to the
innocents, assigns the similar name to one random traitor, and shows each
player only their own card.

No player should see another player's name or role.

#### 2. Create speaking order

Players are randomly shuffled into a speaking order. The order is shown as a
list, with the active player highlighted.

The order is reshuffled after every elimination. Eliminated players are
removed from all future speaking and voting rounds.

#### 3. Speaking turns

Each remaining player gets one 30-second speaking turn.

During a turn:

- the active player is highlighted;
- a 30-second countdown is visible;
- the player may speak to the group in person;
- a `Pass the chance` button ends the turn early;
- the next player becomes active when the timer ends or the chance is passed.

Players may discuss freely between turns because they are assumed to be
together in the physical world. The app does not provide voice chat in this
version.

The app should prevent the active player from passing twice, prevent inactive
players from advancing the turn, and automatically advance when the timer
reaches zero.

#### 4. Vote

After every remaining player has had a turn, a voting modal opens:

> Vote out the player you think is the traitor.

Each remaining player selects one player to eliminate. A player cannot vote
for themselves.

After voting closes, the player with the most votes is eliminated. The result
should show the eliminated player's name and whether they were the traitor.

#### 5. Reveal result

Use a short reveal animation before showing the result. The intended visual is
four or five small rocks rolling across the result area; one rock bursts open
to reveal the outcome.

The animation must remain subtle and skippable. It is decorative feedback,
not a blocking loading state.

Examples:

```text
Rohit Sharma was voted out.
Rohit Sharma was not the traitor.
```

```text
Virat Kohli was voted out.
Virat Kohli was the traitor.
```

#### 6. Continue or finish

If the eliminated player was innocent:

1. remove them from the room's active player list;
2. check whether the traitor has survived to the final-player condition;
3. if the game is not over, deal a fresh name pair to the remaining players;
4. reshuffle the remaining speaking order;
5. start the next speaking round.

If the eliminated player was the traitor, the innocent players win immediately.

The previous names should not be reused in the next round unless the content
pool is too small. The first version can use a fresh valid pair each round.

### Win conditions

Innocents win when the traitor is voted out.

The traitor wins when they survive until the final-player condition. For the
first version, the traitor wins when only two active players remain and the
traitor is still alive.

This gives the traitor a clear objective without requiring a final vote that
would always expose them by elimination count.

### Tie handling

The first implementation needs one deterministic tie rule. Recommended:

1. tied players remain in the game;
2. tied players get a 15-second re-discussion;
3. tied players are put to a revote;
4. if the revote ties again, eliminate nobody and begin the next round.

This avoids random elimination deciding the game while still keeping the flow
moving.

### Player states

```text
active
speaking
voting
eliminated
winner
```

### Round states

```text
dealing
speaking
voting
revealing
continuing
finished
```

### First implementation scope

Build only:

- private name and role cards;
- valid similar name pairs;
- random assignment;
- random speaking order;
- 30-second turn timer;
- pass-the-chance action;
- voting modal;
- vote counting;
- elimination;
- rock reveal animation;
- reshuffle and repeat;
- traitor and innocent win states.

Do not build yet:

- voice chat;
- matchmaking;
- spectator mode;
- persistent game-specific rankings;
- custom name-pair creation;
- hidden-role configuration beyond the first clear role-card mode.

## IPL Guessr

### Summary

`IPL Guessr` hides one player from any IPL season. Everyone in the room gets
eight guesses and the same clock, and every guess comes back marked against
the answer.

The room is not deducing from clues. It is spending guesses to buy
information, and the person who spends fewest and fastest wins the round.

### What a guess returns

A guess must be a real player from the roster. It comes back as a row of six
marks:

```text
Team    the franchise the player is most associated with
Nat     IND AUS SA WI NZ SL ENG AFG BAN
Role    Bat | Bowl | All | WK
Bat     R | L
Born    birth year, with an arrow
Debut   first IPL season played, with an arrow
```

Green means the guess matches the answer on that column. Yellow with an arrow
means it does not, and points the way the answer sits: up for later or older
than the guess, down for earlier or younger.

There are no other hints. No letters, no initials, no category reveal, no
narrowing prompt from the app. `CORPUS-IPL.md` explains why the columns are
these six and not others.

### Round flow

1. The app picks a player nobody has had this session.
2. Everyone guesses in private, at their own speed, up to eight times.
3. A round ends when every player has solved it or run out of guesses, or when
   the host's clock runs out, whichever comes first.
4. The answer is revealed with the order people got there and how many tries
   each took.

No player ever sees another player's board. A grid of somebody else's wrong
guesses is a free hint, which is the one thing this game does not give out.

### Scoring

```text
solved in n tries     9 - n points, so eight for a first-guess call, one for scraping in
first to solve        3 more
never solved          nothing
```

Speed only pays through the first-solve bonus. Being right matters more than
being quick, but being quick breaks the tie.

### Settings

The host sets the number of rounds and the seconds per round. Tries are fixed
at eight and are not a dial.

### Player count

One to twelve. A single player gets the same game with nobody to race, which
is the practice mode and needs no separate code path.

## Player of the Day

### Summary

One IPL player, the same one for everybody, eight guesses, one attempt each
per day. It shares the marking rules with `IPL Guessr` and nothing else: there
is no room, no host and no lobby.

### Who can play

Registered players only. A guest has no durable identity, so "once a day"
would mean "once per cleared cookie jar", and a leaderboard built on that is
not a leaderboard. Guests get the sign-in prompt instead.

### The day

The day turns over at midnight IST rather than UTC, which would otherwise flip
the puzzle at half past five in the morning. The puzzle is chosen the first
time anyone opens a new day and then frozen into a row, so a later content
seed cannot retroactively change what yesterday's answer was. A player does
not come round again for sixty days.

### Scoring and boards

```text
solved in n tries   9 - n points, eight down to one
never solved        nothing
```

Two boards:

- **Today**, ranked by fewest guesses, with the clock breaking ties. The clock
  starts on the first guess, not when the page opened.
- **All time**, ranked by running total, carrying days played, days solved and
  the current run of solved days.

### Solo IPL Guessr

Separately from the daily, `IPL Guessr` itself supports one player. Its
`playerMin` is 1, so a single host creates a room, starts it, and plays the
same game with nobody to race. That is the practice mode and it needs no
separate code path.

## Other game ideas

These are planned after `Traitors` and should reuse the same room, player,
timer, voting, results, and statistics infrastructure where possible.

### Guess the Liar

Everyone receives the same question except one player, who receives a blank
or altered question. Players answer aloud, discuss, and vote for the player
whose answer seems inconsistent.

The main difference from `Traitors` is that `Traitors` is based on hidden
names and clues, while `Guess the Liar` is based on hidden prompts and answers.

### Guess the Person / Event

Players identify an Indian or internet-culture person, event, meme, movie, or
moment from clues. Content may be grouped by cricket, Bollywood, Indian
history, internet moments, and global pop culture.

### Guess the Word

One player or the group tries to identify a secret word from rapid clues,
without using forbidden words or syllables.

### Auction House

Players receive a shared budget and bid against one another for a team of
players, celebrities, movies, events, or other themed items. The first version
should launch with one category and one scoring rule before expanding.

### Indian Monopoly-style game

A larger strategy game inspired by Indian cities, businesses, landmarks, and
culture. This is a later project, not part of the first game release.

## Platform features

### Physical-room play

The first release assumes players are physically together. The app provides
private information, timers, speaking order, voting, and reveals while the
players talk in person.

### Voice rooms

Voice runs for as long as the room exists and follows players from the lobby
into a game without dropping the call. Audio is peer-to-peer; Convex carries
the handshake and one shared fact, which is who is muted.

The mute model is deliberately asymmetric:

```text
a player   mutes and unmutes themselves, and nobody else
the host   mutes everyone, and can never unmute anyone
```

A host can quiet a room to get a round started. Every microphone comes back on
only when the person it belongs to says so. There is no host unmute anywhere in
`convex/voice.ts`, which is the point rather than an omission.

### Stats page

Logged-in users should eventually see shared stats such as games played,
wins, win rate, streaks, favourite games, traitor wins, and how often they
were voted out. Guests can play first and keep stats only after linking an
account.

### Random matchmaking — later

Players can eventually join a random group, vote on a game, and enter a room.
Private invite rooms should work well before matchmaking is added.

## Questions to settle before implementation

1. Should a new name pair be dealt after every innocent elimination, or should
   the original names remain for the entire game?
2. Should players be allowed to vote for eliminated players, or only active
   players? This draft assumes active players only.
3. Is the recommended final condition correct: traitor wins when two active
   players remain, or should the game continue until one player remains?
4. Please provide 5–10 example name pairs for the first content pack so the
   similarity rules can be tuned against real examples.
