# IPL Guessr content corpus

150 players, already seeded. You said not to block on approval, so this
document is the record of what went in and the place to argue with it, rather
than a gate in front of it. It lives at `convex/seed/ipl.ts`.

## The game this is written for

One hidden player, eight guesses, everyone in the room racing the same clock.
A guess comes back marked against six facts and nothing else. There are no
clue cards, no letters, no host reading anything out. The only information in
the game is the shape of the wrong answers you have already spent.

That puts three demands on every row:

1. **The name has to be guessable.** A player nobody in the room could name
   unprompted is a dead round, no matter how many IPL games they played.
2. **The six facts have to be settled.** Every column is either right or
   wrong in front of a room of people who will argue about it. A disputed
   fact is worse than a missing player.
3. **The pool has to spread.** If two thirds of the roster is a top-order
   Indian right-hander who debuted in 2008, the first guess tells you nothing.

## How a row works

```text
title    the player's common name, the string that gets typed   "AB de Villiers"
team     the franchise they are most associated with            RCB
country  IND AUS SA WI NZ SL ENG AFG BAN
role     bat | bowl | all | wk
bat      R | L
born     birth year
debut    first IPL season they actually played in
```

Name matching lowercases and strips everything that is not a letter or a
digit, so `ab de villiers` and `AB De Villiers!` are the same string. The
guess box also takes the top suggestion on Enter, which is what stops anyone
losing a try to a spelling of `Muttiah Muralitharan`.

## Why these six columns and not the others

**Team is one franchise, not a history.** Most of this roster has worn three
or four shirts. Storing every one of them turns the green square into a
question about what counts, and it needs a seventh column to show. One
franchise, the one a room would name if you said the player's name out loud.
Defunct sides keep their own codes (DCH, PWI, RPS, GL, KTK) rather than being
folded into whoever bought the licence.

**Born, not age.** An age column is wrong every February. A birth year is
right forever and asks exactly the same question.

**Debut season, not caps or runs.** Debut is a fact a cricket room actually
carries around. Career numbers are a stats lookup, and they move.

**No bowling style.** Right-arm medium covers half the roster, so the column
would be a coin flip that costs a guess. Batting hand splits the pool closer
to evenly and is easier to be sure about.

## What is in

| Group | Players |
|---|---|
| India | 79 |
| Overseas | 71 |
| **Total** | **150** |

The overseas half runs South Africa, Australia, West Indies, New Zealand,
England, Sri Lanka, Afghanistan and Bangladesh. Every franchise that has ever
played a season appears at least once. Coverage runs from 2008 to 2024, so a
guess of `Shane Warne` and a guess of `Rachin Ravindra` are both legal and
both tell you something.

Difficulty is authoring metadata for now. Nothing reads it yet, so a hard row
is as likely to come up as an easy one.

## What I left out, on purpose

- **Squad filler.** Anyone whose whole IPL career is a handful of games nobody
  remembers. The roster is the players a room can name, not the players who
  were registered.
- **The 2025 intake.** A rookie needs a season behind them before eight people
  in a room all recognise the name.
- **Bowling style and jersey number.** Both were considered, both were cut.
  See above for style. Numbers change, and half of them are not public.
- **Full team histories.** The natural upgrade if the green square starts
  feeling too binary. Adding a `teams` array turns an exact-team match green
  and a shared-franchise match yellow, and it needs no other change.

## Questions

1. **Team histories.** Worth the authoring pass, or does one franchise per
   player carry the game fine?
2. **Volume.** 150 supports a long evening at five rounds a room. Say the word
   and it goes to 250, which would let the difficulty filter mean something.
3. **Difficulty as a room setting.** Should a host be able to ask for easy
   players only, so a room that is not deep into cricket still has a chance?
4. **Franchise rounds.** `category` is the team code, so a CSK-only or
   Mumbai-only room is one filter argument away whenever you want it.
