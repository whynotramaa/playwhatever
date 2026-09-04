# Make Your Team content corpus

132 lots across five pools, seeded with the game. You said not to block on
approval, so this document is the record of what went in and the place to
argue with it rather than a gate in front of it. It lives at
`convex/seed/team.ts`.

## The game this is written for

Everybody starts with the same budget. Lots come up one at a time and the room
bids for them in turn order. When everyone but one bidder has walked away, the
lot is sold and the money leaves that player's purse for good. At the end the
squads are scored and ranked into tiers, and the ranking is the thing people
screenshot.

That puts three demands on every row:

1. **A room has to have an opinion about it.** The whole game is somebody
   paying eleven rupees for Gabbar because they refuse to let you have him. A
   name nobody feels anything about is a lot that goes unsold.
2. **The rating has to be defensible after the fact.** The number is hidden
   during the auction and revealed at the end. If the room thinks the number
   is wrong, the result is worthless, so a rating is a rough consensus rank
   inside its own pool, never a cross-pool comparison.
3. **The pool has to have a middle.** If a pool is twenty superstars, every
   lot goes to whoever still has money and the bidding is arithmetic. Each
   pool runs from the high nineties down into the high seventies so that a
   cheap lot late in the auction is a real decision.

## How a row works

```text
title        the name, as a room would say it out loud    "Rocky Bhai"
category     the pool: cricket football bollywood characters movies
description  the tag, also stored in metadata
metadata     { tag, rating }
```

`tag` is the line printed under the name on the lot card. It is not a
description; it is the thing the room shouts when the name comes up. `Jhukega
nahi` does more work than "police drama protagonist" ever will.

`rating` is 0-100 and is the only number the game hides. A visible rating
turns an auction into a price check.

## Why rating and not price

An auction already has a price: whatever somebody paid. Storing a second price
would just tell players they overpaid. The rating is worth, not cost, and the
gap between the two is the entire game. Paying fourteen for a 99 is a good
evening. Paying fourteen for an 84 is a story.

## Scoring and tiers

A squad scores the sum of its ratings. Nothing is subtracted for money left
over, because hoarding is already punished by owning nobody.

Tiers are cut against the best squad in the room, not against an absolute
number:

```text
S   90% or more of the best squad's score
A   75% to 90%
B   55% to 75%
C   below 55%
```

Cutting against the room means a three-player game and an eight-player game
both produce a readable tier list, and a room that bought from the movies pool
is not quietly ranked against a room that bought cricketers.

## The pools

### Cricketers, 28 lots, mixed region

India-weighted, because the room is. Runs Sachin at 99 down to Bhuvneshwar at
78. Includes retired greats deliberately: Warne and Lara are in the pool so
that a cricket auction is not just a current-XI draft.

### Footballers, 26 lots, global

Messi 99, Ronaldo 98, and then a long middle. Sunil Chhetri is in at 80 and is
the one row here that exists for the room rather than for the ranking, which is
the correct reason for a row to exist.

### Film stars, 26 lots, India

Bollywood plus the south where a name carries nationally. Rajinikanth at 96 and
Kamal Haasan at 93 are not courtesy entries.

### Film characters, 26 lots, India

The most fun pool to bid on and the hardest to rate. Gabbar tops it at 95.
Kabir Singh sits at the bottom at 76 on purpose: a room will still fight over
him, and losing that fight should cost something.

### Movies, 26 lots, India

Sholay at 97 down to Masaan at 82. This pool has the tightest spread because
the films nobody would name are simply not in it.

## What is deliberately not in

- **No living-person controversy.** Nobody is rated on anything but their work.
- **No cross-pool ratings.** A 92 cricketer and a 92 movie are not comparable
  and the game never puts them in the same auction.
- **No images.** A lot card is a name, a tag and a price. An image is another
  asset to license, host and watch fail to load, and the name is the thing the
  room is arguing about anyway.
- **No aliases.** Nothing is typed in this game, so spelling never costs
  anybody a turn.
