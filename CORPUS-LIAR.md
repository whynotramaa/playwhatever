# Guess the Liar content corpus

Draft for review. **Nothing here is in the database.**

## The game this is written for

Everyone sees the same question. Everyone answers it. One player has been told
privately that they are the liar and has to answer falsely and then defend it.
The answers go up together, the room argues, everybody votes for who they think
lied.

That makes the question the whole game, and a question earns its place only if:

1. **The answer is an opinion, not a fact.** "Which year did India win the
   World Cup" has one answer and the liar is caught in a second. "Best cricketer
   ever" has as many answers as there are people in the room.
2. **The room can tell when it is out of character.** These work because people
   know each other. A question nobody has a personal stake in is a dead round.
3. **It is short enough to read out loud once.** If the question needs a second
   reading, the round has already lost its energy.

## How a row works

```text
title       the question, as asked
category    the group below
region      india | global | mixed
metadata    { adult: true } on the opt-in ones only
```

The adult set is off unless the host turns it on, same switch as the Traitors
adult pairs.

## Proposed schema mapping

`gameContent` fits this as it stands:

```text
contentType   "prompt"
title         the question
category      Food | Cricket and sport | Film | Internet | This room |
              Hot takes | Places | Spicy
region        india | global | mixed
metadata      { adult: true } where it applies
```

---

## Food

Region `mixed`. 20 questions.

| Question |
|---|
| Best street food in the country, one dish, no hedging |
| The most overrated dish in India |
| Best biryani city, and you have to commit |
| Chai or coffee, and why the other one is wrong |
| The one food you could eat every day for a year |
| Best midnight snack |
| The dish your family makes that you secretly do not like |
| Pineapple on pizza: defend your position |
| Best Maggi hack you have |
| Best Indian sweet, one only |
| The most overrated restaurant chain |
| Best paratha filling |
| What you order at a dhaba at two in the morning |
| Best regional cuisine in India, pick one state |
| The food you always steal off someone else's plate |
| Momos or rolls |
| The most disappointing thing you have eaten abroad |
| Best thing to eat on a train |
| The drink you want on the hottest day of the year |
| Best thing to eat when you are sad |

## Cricket and sport

Region `india`. 16 questions.

| Question |
|---|
| Best cricketer ever, one name |
| Best Indian captain of all time |
| The most overrated player in the IPL |
| Kohli or Sachin, pick and defend |
| Best IPL team, no fence-sitting |
| The greatest moment in Indian cricket |
| Best fast bowler you have watched play |
| Messi or Ronaldo |
| The sport you would be good at if you trained for a year |
| The most boring sport to watch |
| Best commentator voice in the game |
| The best World Cup final you have seen |
| Who should be opening for India right now |
| The most annoying fan base |
| Best comeback you have watched live |
| The player you would pay to watch bat for one over |

## Film

Region `india`. 16 questions.

| Question |
|---|
| Best Hindi film ever made |
| The most overrated actor working today |
| Best Shah Rukh Khan film |
| The film you have rewatched the most |
| Best villain in Indian cinema |
| The worst film you have paid money for |
| Best South Indian film of the last five years |
| The most quotable line ever written for a Hindi film |
| Best film soundtrack |
| The actor who should take a long break |
| Best Hindi web series |
| The film everybody loves that bores you |
| Best on-screen pair |
| The best debut performance you have seen |
| Best film to watch at three in the morning |
| The remake that should never have been made |

## Internet

Region `mixed`. 16 questions.

| Question |
|---|
| Best Indian meme ever made |
| The meme that needs to be retired |
| Best YouTube channel in India |
| The app you waste the most time on |
| The most annoying trend on Instagram |
| Best roast you have seen online |
| The influencer you would unfollow first |
| The funniest account you follow |
| Best podcast going right now |
| The comment section you cannot stay out of |
| The most overrated gadget you own |
| Best group chat name you have ever had |
| The last thing online that made you laugh out loud |
| Best emoji, and it is not close |
| The password habit you know is a bad idea |
| Your most-used app that you would be embarrassed to show |

## This room

Region `mixed`. 18 questions. These ask about the people actually sitting there,
so the liar has to say something about a friend and hold a straight face.

| Question |
|---|
| Who here would last longest in a zombie apocalypse |
| Who in this room is most likely to get famous |
| Who is the worst driver here |
| Who would you call at three in the morning |
| Who takes the longest to get ready |
| Who lies the most in this room |
| Who is the funniest person here |
| Who wins a fight in this room, no weapons |
| Who spends the most on food delivery |
| Who is most likely to move abroad |
| Who has the worst taste in music |
| Who would forget your birthday |
| Who is the best cook here |
| Who checks their phone the most |
| Who would you trust with your phone unlocked |
| Who here gives the worst advice |
| Who would survive one week without the internet |
| Who is going to be late to their own wedding |

## Hot takes

Region `mixed`. 20 questions.

| Question |
|---|
| The most overrated thing about being an adult |
| Best decade for music |
| Money or free time, pick one |
| The habit you would drop tomorrow if you could |
| The best age to be |
| The most useless thing you were taught in school |
| Best advice anybody has given you |
| The thing everyone loves that you do not get |
| Morning person or night person, and why the other one is wrong |
| Best way to spend a Sunday |
| The purchase you regret most |
| Window seat or aisle |
| The one rule you would make law tomorrow |
| Best gift you have been given |
| The job you would do if money did not matter |
| Cats or dogs, commit |
| The most overrated festival |
| Best thing about your home town |
| The talent you wish you had |
| What you would do with one completely free hour right now |

## Places

Region `mixed`. 14 questions.

| Question |
|---|
| Best city in India to actually live in |
| The most overrated tourist spot in the country |
| Best beach you have been to |
| Mountains or beach |
| The city you could never live in |
| Best road trip in India |
| The country you want to see first |
| Best place in your city for a walk |
| The most beautiful place you have seen in person |
| Best month of the year where you live |
| Where you would go to disappear for a month |
| The worst place you have spent a night |
| Best place in your city to eat at midnight |
| The trip you keep saying you will take and never do |

## Spicy, opt-in

Region `mixed`. 18 questions. **Off by default.** Same host switch as the
Traitors adult pairs. Kept at party-game cheeky rather than explicit, so a
living room full of friends can still play it.

| Question |
|---|
| Best place to make out |
| The worst date you have been on |
| Your type, in three words |
| The most attractive quality in a person |
| Your biggest turn-off |
| The worst pickup line you have used or had used on you |
| The most embarrassing thing in your search history |
| Best flirting move you have |
| The celebrity you get one free pass for |
| Your worst kissing story |
| What you would lie about on a dating app |
| The most awkward place you have been walked in on |
| Your biggest ick |
| The worst decision you have made after a drink |
| The one text you wish you could unsend |
| The friend's ex you would actually go out with |
| How long you have gone without telling anyone something |
| The compliment you fish for |

---

## Totals

| Group | Questions | Region |
|---|---|---|
| Food | 20 | mixed |
| Cricket and sport | 16 | india |
| Film | 16 | india |
| Internet | 16 | mixed |
| This room | 18 | mixed |
| Hot takes | 20 | mixed |
| Places | 14 | mixed |
| Spicy, opt-in | 18 | mixed |
| **Total** | **138** | |

120 play by default and 18 more if the host turns the spicy set on. A five-round
game burns five questions, so this is a long way from repeating.

## What I left out, on purpose

- **Anything with one correct answer.** Trivia kills this game: the liar is
  exposed instantly and there is nothing to argue about.
- **Questions that need a paragraph.** Every one of these can be answered in a
  few words, which is what keeps the reveal readable.
- **Anything genuinely cruel about a person in the room.** "This room" questions
  are teasing, not a pile-on.
