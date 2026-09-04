# Traitors content corpus

Draft for review. **Nothing here is in the database.** On your approval it
becomes `convex/seed/traitors.ts` and gets seeded.

## How a pair works

Each row is one pair. The game picks a row, then randomly decides which of the
two names is the traitor. Storing pairs symmetrically rather than as a fixed
`innocentName` and `traitorName` halves the corpus needed and stops players
learning that Virat is always the traitor.

Against the rules in `GAMES.md`, every pair here aims to:

- share at least two meaningful traits, so a clue about one plausibly fits the other;
- avoid a large fame gap between the two names;
- avoid being synonyms, which would make the traitor undetectable rather than hidden.

`Difficulty` is how hard the traitor's job is. **Easy** pairs are close enough
that the traitor can bluff for several rounds. **Hard** pairs have an obvious
distinguishing fact that a sharp question will expose.

## Proposed schema mapping

The current `gameContent` table has no shape for a pair, so this needs one
addition before seeding.

```text
contentType   "pair"        (new value in the union)
category      similarityGroup, e.g. "Cricket"
region        india | global | mixed
difficulty    easy | medium | hard
title         "Virat Kohli / Rohit Sharma"    (readable in the dashboard)
metadata      { a, b, adult }
```

`adult` is a room setting, off by default. Those pairs are excluded unless the
host turns them on.

---

## Cricket, India

Region `india`. 12 pairs.

| A | B | Difficulty |
|---|---|---|
| Virat Kohli | Rohit Sharma | easy |
| MS Dhoni | Gautam Gambhir | easy |
| Sachin Tendulkar | Rahul Dravid | easy |
| Sourav Ganguly | VVS Laxman | medium |
| Jasprit Bumrah | Mohammed Shami | easy |
| Hardik Pandya | Ravindra Jadeja | easy |
| Yuvraj Singh | Suresh Raina | easy |
| KL Rahul | Shikhar Dhawan | easy |
| Rishabh Pant | Sanju Samson | easy |
| Anil Kumble | Harbhajan Singh | medium |
| Zaheer Khan | Ishant Sharma | medium |
| Shubman Gill | Yashasvi Jaiswal | easy |

## Cricket, global

Region `global`. 8 pairs.

| A | B | Difficulty |
|---|---|---|
| Steve Smith | Joe Root | easy |
| Ben Stokes | Kane Williamson | medium |
| Shane Warne | Muttiah Muralitharan | medium |
| Ricky Ponting | Brian Lara | medium |
| AB de Villiers | Chris Gayle | easy |
| Babar Azam | Mohammad Rizwan | easy |
| Wasim Akram | Waqar Younis | hard |
| Jacques Kallis | Shaun Pollock | hard |

## Football

Region `global`, except the last row. 9 pairs.

| A | B | Difficulty |
|---|---|---|
| Lionel Messi | Neymar | easy |
| Kylian Mbappé | Cristiano Ronaldo | easy |
| Zinedine Zidane | Ronaldinho | medium |
| Erling Haaland | Robert Lewandowski | easy |
| Xavi | Andrés Iniesta | hard |
| Sergio Ramos | Gerard Piqué | medium |
| Mohamed Salah | Sadio Mané | easy |
| Pep Guardiola | Jürgen Klopp | easy |
| Sunil Chhetri | Bhaichung Bhutia | medium |

## Bollywood

Region `india`. 12 pairs.

| A | B | Difficulty |
|---|---|---|
| Shah Rukh Khan | Salman Khan | easy |
| Aamir Khan | Akshay Kumar | easy |
| Deepika Padukone | Priyanka Chopra | easy |
| Alia Bhatt | Katrina Kaif | easy |
| Ranbir Kapoor | Ranveer Singh | easy |
| Ajay Devgn | Sunny Deol | medium |
| Kareena Kapoor | Karisma Kapoor | hard |
| Hrithik Roshan | Tiger Shroff | easy |
| Amitabh Bachchan | Dharmendra | medium |
| Madhuri Dixit | Sridevi | medium |
| Nawazuddin Siddiqui | Pankaj Tripathi | easy |
| Rajinikanth | Kamal Haasan | medium |

## Global celebrities

Region `global`. 10 pairs.

| A | B | Difficulty |
|---|---|---|
| Kim Kardashian | Kylie Jenner | easy |
| Brad Pitt | Leonardo DiCaprio | easy |
| Tom Cruise | Tom Hanks | medium |
| Taylor Swift | Ariana Grande | easy |
| Beyoncé | Rihanna | easy |
| Dwayne Johnson | Vin Diesel | easy |
| Chris Evans | Chris Hemsworth | easy |
| Emma Watson | Emma Stone | medium |
| Drake | Kanye West | medium |
| Justin Bieber | Shawn Mendes | easy |

## Business and tech

Region `mixed`. 8 pairs.

| A | B | Difficulty |
|---|---|---|
| Jeff Bezos | Elon Musk | easy |
| Bill Gates | Steve Jobs | easy |
| Mark Zuckerberg | Jack Dorsey | medium |
| Mukesh Ambani | Gautam Adani | easy |
| Ratan Tata | Anand Mahindra | medium |
| Sundar Pichai | Satya Nadella | easy |
| Warren Buffett | Charlie Munger | hard |
| Vijay Shekhar Sharma | Byju Raveendran | hard |

## Politics

Region `mixed`. 6 pairs. Recognisable figures paired by role and era only.
No commentary attached to any of them.

| A | B | Difficulty |
|---|---|---|
| Narendra Modi | Rahul Gandhi | easy |
| Arvind Kejriwal | Yogi Adityanath | easy |
| Jawaharlal Nehru | Sardar Patel | medium |
| Barack Obama | Joe Biden | easy |
| Donald Trump | Boris Johnson | medium |
| Indira Gandhi | Margaret Thatcher | medium |

## Indian cities

Region `india`. 10 pairs.

| A | B | Difficulty |
|---|---|---|
| Delhi | Mumbai | easy |
| Bangalore | Hyderabad | easy |
| Chennai | Kolkata | easy |
| Pune | Ahmedabad | medium |
| Jaipur | Udaipur | medium |
| Goa | Kerala | easy |
| Lucknow | Varanasi | medium |
| Shimla | Manali | easy |
| Chandigarh | Dehradun | hard |
| Kochi | Mysore | hard |

## World cities

Region `global`. 6 pairs.

| A | B | Difficulty |
|---|---|---|
| New York | Los Angeles | easy |
| London | Paris | easy |
| Tokyo | Seoul | easy |
| Dubai | Singapore | easy |
| Sydney | Melbourne | medium |
| Rome | Barcelona | medium |

## Household objects

Region `mixed`. 14 pairs. These play differently from names, because everyone
can describe a pillow and nobody can fake a cricket statistic.

| A | B | Difficulty |
|---|---|---|
| Blanket | Pillow | easy |
| Window | Door | easy |
| Spoon | Fork | easy |
| Chair | Sofa | easy |
| Mirror | Comb | medium |
| Fan | Air conditioner | easy |
| Bucket | Mug | easy |
| Soap | Shampoo | easy |
| Towel | Napkin | medium |
| Charger | Power bank | easy |
| Fridge | Microwave | easy |
| Broom | Mop | easy |
| Bedsheet | Curtain | medium |
| Slippers | Shoes | easy |

## General life

Region `mixed`. 12 pairs.

| A | B | Difficulty |
|---|---|---|
| College | School | easy |
| Girlfriend | Boyfriend | easy |
| Salary | Pocket money | easy |
| Monday | Sunday | easy |
| Exam | Interview | easy |
| Wedding | Engagement | easy |
| Rent | EMI | medium |
| Bus | Train | easy |
| Doctor | Nurse | easy |
| Teacher | Professor | medium |
| Landlord | Neighbour | medium |
| Gym | Yoga | easy |

## Food

Region `mixed`. 12 pairs.

| A | B | Difficulty |
|---|---|---|
| Chai | Coffee | easy |
| Samosa | Kachori | easy |
| Biryani | Pulao | easy |
| Dosa | Uttapam | medium |
| Rajma | Chole | easy |
| Paneer | Tofu | medium |
| Pizza | Burger | easy |
| Momo | Spring roll | easy |
| Lassi | Buttermilk | medium |
| Gulab jamun | Rasgulla | easy |
| Maggi | Pasta | easy |
| Vada pav | Pav bhaji | easy |

## Memes and internet, India

Region `india`. 11 pairs.

| A | B | Difficulty |
|---|---|---|
| Rasode Mein Kaun Tha | Bachpan Ka Pyaar | easy |
| Binod | Moye Moye | medium |
| Pawri Ho Rahi Hai | Just Looking Like a Wow | easy |
| Sharma Ji Ka Beta | Log Kya Kahenge | easy |
| Babu Bhaiya | Raju | medium |
| CarryMinati | Bhuvan Bam | easy |
| Ashish Chanchlani | Harsh Beniwal | medium |
| Dhinchak Pooja | Taher Shah | medium |
| Orkut | Hi5 | hard |
| Nokia 3310 | BlackBerry | easy |
| ShareChat | Moj | hard |

## Memes and internet, global

Region `global`. 11 pairs.

| A | B | Difficulty |
|---|---|---|
| Distracted Boyfriend | Drakeposting | easy |
| This Is Fine | Surprised Pikachu | easy |
| Doge | Grumpy Cat | easy |
| Rickroll | Nyan Cat | medium |
| Instagram Reels | YouTube Shorts | easy |
| Woman Yelling at a Cat | Two Buttons | medium |
| Pepe the Frog | Wojak | medium |
| Harlem Shake | Gangnam Style | easy |
| Ice Bucket Challenge | Mannequin Challenge | easy |
| Planking | Dabbing | easy |
| Skibidi Toilet | Ohio | medium |

## Events

Region `mixed`. 8 pairs.

| A | B | Difficulty |
|---|---|---|
| Cricket World Cup | IPL Final | easy |
| Olympics | Commonwealth Games | easy |
| FIFA World Cup | UEFA Champions League | easy |
| Diwali | Holi | easy |
| New Year | Christmas | easy |
| Independence Day | Republic Day | medium |
| Ganesh Chaturthi | Durga Puja | medium |
| Oscars | Grammys | easy |

## Apps and brands

Region `mixed`. 8 pairs.

| A | B | Difficulty |
|---|---|---|
| WhatsApp | Telegram | easy |
| Instagram | Snapchat | easy |
| Zomato | Swiggy | easy |
| Ola | Uber | easy |
| Netflix | Prime Video | easy |
| Paytm | PhonePe | easy |
| Amazon | Flipkart | easy |
| Nike | Adidas | easy |

## Shows and films, India

Region `india`. 12 pairs.

| A | B | Difficulty |
|---|---|---|
| Sacred Games | Mirzapur | easy |
| Panchayat | Gullak | easy |
| Kota Factory | Aspirants | easy |
| The Family Man | Special Ops | easy |
| Paatal Lok | Delhi Crime | easy |
| Scam 1992 | Rocket Boys | medium |
| Farzi | Jamtara | medium |
| Baahubali | RRR | easy |
| Zindagi Na Milegi Dobara | Dil Chahta Hai | easy |
| Dangal | Chak De India | easy |
| Taarak Mehta Ka Ooltah Chashmah | Bhabhi Ji Ghar Par Hain | easy |
| Ramayan | Mahabharat | medium |

## Shows and films, global

Region `global`. 10 pairs.

| A | B | Difficulty |
|---|---|---|
| Game of Thrones | House of the Dragon | medium |
| Friends | How I Met Your Mother | easy |
| Stranger Things | Dark | medium |
| Money Heist | Squid Game | easy |
| Breaking Bad | Better Call Saul | easy |
| The Office | Parks and Recreation | easy |
| Narcos | Peaky Blinders | medium |
| The Boys | Invincible | easy |
| Interstellar | Inception | easy |
| Fast and Furious | Mission Impossible | easy |

## Adult, opt-in

Region `mixed`. 12 pairs. **Off by default.** These only appear when the host
turns on the adult setting in the room.

Kept at party-game crude rather than explicit, so the round stays playable in a
living room full of friends. Say the word and I will make it filthier or drop
the category entirely.

| A | B | Difficulty |
|---|---|---|
| Ass | Boobs | easy |
| Tinder | Bumble | easy |
| One night stand | Situationship | easy |
| Ex | Crush | easy |
| Nudes | Thirst trap | medium |
| Condom | Birth control pill | easy |
| Vodka shot | Tequila shot | easy |
| Hangover | Blackout | medium |
| Strip club | Bar | easy |
| Playboy | OnlyFans | easy |
| Virgin | Player | medium |
| Makeout | Cuddle | medium |

---

## Totals

| Group | Pairs | Region |
|---|---|---|
| Cricket, India | 12 | india |
| Cricket, global | 8 | global |
| Football | 9 | global |
| Bollywood | 12 | india |
| Global celebrities | 10 | global |
| Business and tech | 8 | mixed |
| Politics | 6 | mixed |
| Indian cities | 10 | india |
| World cities | 6 | global |
| Household objects | 14 | mixed |
| General life | 12 | mixed |
| Food | 12 | mixed |
| Memes and internet, India | 11 | india |
| Memes and internet, global | 11 | global |
| Events | 8 | mixed |
| Apps and brands | 8 | mixed |
| Shows and films, India | 12 | india |
| Shows and films, global | 10 | global |
| Adult, opt-in | 12 | mixed |
| **Total** | **191** | |

57 pairs are tagged `india`, 54 are `global`, and 80 are `mixed` but lean Indian
in their examples. A 12-player game burns roughly 10 pairs, so this supports
about 19 games before anything repeats.

## Open questions

1. **Adult category.** Too tame, about right, or cut it?
2. **Politics.** Included six neutral pairs. Happy to drop the category if you
   would rather keep the product out of it.
3. **Object and life pairs versus name pairs.** They play very differently.
   Should a room mix them, or pick one style per game?
4. Any group you want that is missing. Regional cinema, anime, music, and
   Indian TV are the obvious gaps.
