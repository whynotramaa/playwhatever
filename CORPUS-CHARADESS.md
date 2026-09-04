# Dumb Charadess content corpus

Draft for review. **Nothing here is in the database.** On your approval it
becomes `convex/seed/charades.ts` and gets seeded.

## The game this is written for

One player guesses. Everybody else is shown the same word and takes a turn
acting it out, thirty seconds each by default, pass allowed. The guesser sees
nothing: no word, no category, no hint. They have a text box and a fixed number
of tries. Right answer, plus a point. Out of tries or out of turns, minus one.

That puts a hard constraint on every row here: **it has to be actable by an
ordinary person in thirty seconds, and typeable by a guesser who has never seen
it written down.** A row earns its place only if:

1. **A room of friends would all recognise it.** Not "have heard of it" —
   recognise it fast enough to type it under a clock.
2. **It has something to mime.** An abstract noun with no physical handle is a
   dead turn. "Hammer" works. "Nostalgia" does not.
3. **It spells one way.** Anything with four romanisations is a row where the
   guesser says it out loud, is right, types it, and is marked wrong. Where a
   second spelling is genuinely common it is listed as an alias.

## How a row works

```text
title        the answer, in its most common written form
category     the group below
region       india | global | mixed
difficulty   easy | medium | hard — how hard to ACT, not how obscure
metadata     { aliases: [...] } where a second spelling is genuinely common
```

## Proposed schema mapping

`gameContent` fits as it stands, no migration:

```text
contentType   "phrase" for films, words, objects, brands
              "person"  for celebrities and creators
              "event"   for events
title         the answer
category      Movies | Celebrities | Events | Creators | Brands | Objects | Words
region        india | global | mixed
difficulty    easy | medium | hard
metadata      { aliases: string[] }
```

## Matching

A guess is normalised before comparison: lowercased, punctuation and spaces
stripped, so `3 Idiots`, `3idiots` and `3 idiots!` are one answer. `aliases`
covers the cases normalising cannot reach: `Sholay` / `Sholey`, `Kurkure` /
`Kurkurey`, `DDLJ` for the full title.

## The weighting

The brief was movies and celebrities first, then events, then words and
objects. Counts below match that.

| Category | Rows | Why this many |
|---|---:|---|
| Movies | 72 | The category everyone can act and everyone has seen |
| Celebrities | 42 | Faces with a walk, a catchphrase or a gesture |
| Events | 30 | Shared memory, strong single image |
| Creators | 22 | Internet-famous, skews younger in the room |
| Brands | 18 | Snack-shelf recognition, instant |
| Objects | 20 | Easy rounds, and a breather between hard ones |
| Words | 16 | Verbs and states, hardest to act, kept small |
| **Total** | **220** | |

---

## Movies

Hindi cinema, the cult ones, and the global films an Indian room actually
watched. Long titles get an alias so nobody loses a point to a typo.

### Cult classics and comedies

| Title | Region | Difficulty | Aliases |
|---|---|---|---|
| Sholay | india | easy | Sholey |
| Hera Pheri | india | easy | |
| Andaz Apna Apna | india | medium | |
| Jaane Bhi Do Yaaro | india | hard | |
| Chupke Chupke | india | medium | |
| Golmaal | india | easy | |
| Munna Bhai MBBS | india | easy | Munnabhai MBBS |
| Lage Raho Munna Bhai | india | medium | |
| 3 Idiots | india | easy | Three Idiots |
| Phir Hera Pheri | india | medium | |
| Welcome | india | easy | |
| Dhamaal | india | easy | |
| Padosan | india | hard | |
| Chalti Ka Naam Gaadi | india | hard | |
| Angoor | india | hard | |
| Bhool Bhulaiyaa | india | medium | Bhool Bhulaiya |

### Romance and family

| Title | Region | Difficulty | Aliases |
|---|---|---|---|
| Dilwale Dulhania Le Jayenge | india | medium | DDLJ |
| Kuch Kuch Hota Hai | india | easy | |
| Kabhi Khushi Kabhie Gham | india | medium | K3G |
| Hum Aapke Hain Koun | india | medium | HAHK |
| Maine Pyar Kiya | india | medium | |
| Jab We Met | india | easy | |
| Yeh Jawaani Hai Deewani | india | medium | YJHD |
| Dil Chahta Hai | india | medium | DCH |
| Zindagi Na Milegi Dobara | india | medium | ZNMD |
| Veer Zaara | india | medium | |
| Devdas | india | easy | |
| Barfi | india | medium | Barfi! |

### Action, thriller, drama

| Title | Region | Difficulty | Aliases |
|---|---|---|---|
| Baahubali | india | easy | Bahubali |
| RRR | india | easy | |
| KGF | india | easy | |
| Pushpa | india | easy | |
| Dangal | india | easy | |
| Sultan | india | easy | |
| Bhaag Milkha Bhaag | india | medium | |
| Gangs of Wasseypur | india | medium | GOW |
| Drishyam | india | medium | |
| Andhadhun | india | hard | |
| Kahaani | india | medium | Kahani |
| A Wednesday | india | hard | |
| Special 26 | india | medium | |
| Rang De Basanti | india | medium | RDB |
| Swades | india | medium | |
| Lagaan | india | easy | |
| Kantara | india | medium | |
| Jawan | india | easy | |
| Pathaan | india | easy | |
| Animal | india | easy | |
| Stree | india | easy | |
| Tumbbad | india | hard | |
| Article 15 | india | hard | |
| Talaash | india | hard | |

### Global

| Title | Region | Difficulty | Aliases |
|---|---|---|---|
| Titanic | global | easy | |
| Avatar | global | easy | |
| Jurassic Park | global | easy | |
| The Lion King | global | easy | Lion King |
| Harry Potter | global | easy | |
| Spider Man | global | easy | Spiderman |
| Iron Man | global | easy | Ironman |
| The Avengers | global | easy | Avengers |
| Inception | global | hard | |
| Interstellar | global | medium | |
| The Dark Knight | global | medium | Dark Knight |
| Joker | global | easy | |
| Squid Game | global | easy | |
| Money Heist | global | medium | La Casa de Papel |
| Frozen | global | easy | |
| Finding Nemo | global | easy | |
| Home Alone | global | easy | |
| Fast and Furious | global | easy | Fast & Furious |
| Mission Impossible | global | easy | |
| Kung Fu Panda | global | easy | |

## Celebrities

Rows here need a walk, a gesture, a catchphrase or a very famous face. A name
that can only be spelled out letter by letter is not a charades row.

### Film

| Name | Region | Difficulty |
|---|---|---|
| Amitabh Bachchan | india | easy |
| Shah Rukh Khan | india | easy |
| Salman Khan | india | easy |
| Aamir Khan | india | easy |
| Akshay Kumar | india | easy |
| Ajay Devgn | india | medium |
| Hrithik Roshan | india | medium |
| Ranveer Singh | india | easy |
| Ranbir Kapoor | india | medium |
| Deepika Padukone | india | medium |
| Alia Bhatt | india | easy |
| Kareena Kapoor | india | medium |
| Madhuri Dixit | india | medium |
| Rekha | india | medium |
| Rajinikanth | india | easy |
| Kamal Haasan | india | medium |
| Allu Arjun | india | easy |
| Prabhas | india | medium |
| Yash | india | medium |
| Nawazuddin Siddiqui | india | hard |
| Pankaj Tripathi | india | medium |
| Boman Irani | india | medium |
| Johnny Lever | india | easy |
| Paresh Rawal | india | medium |

### Cricket and sport

| Name | Region | Difficulty |
|---|---|---|
| Sachin Tendulkar | india | easy |
| Virat Kohli | india | easy |
| MS Dhoni | india | easy |
| Rohit Sharma | india | easy |
| Kapil Dev | india | medium |
| Yuvraj Singh | india | medium |
| Ravindra Jadeja | india | medium |
| Hardik Pandya | india | medium |
| PV Sindhu | india | medium |
| Neeraj Chopra | india | easy |
| Cristiano Ronaldo | global | easy |
| Lionel Messi | global | easy |

### Public life and global

| Name | Region | Difficulty |
|---|---|---|
| Narendra Modi | india | easy |
| Rahul Gandhi | india | easy |
| APJ Abdul Kalam | india | medium |
| Ratan Tata | india | medium |
| Mukesh Ambani | india | medium |
| Elon Musk | global | easy |

## Events

One strong image each. If a room cannot picture it in one frame, it is not
here.

| Event | Region | Difficulty |
|---|---|---|
| World Cup 2011 win | india | easy |
| 1983 World Cup win | india | medium |
| Dhoni's last ball six | india | easy |
| Chandrayaan 3 landing | india | easy |
| Mangalyaan | india | medium |
| Demonetisation | india | easy |
| COVID lockdown | mixed | easy |
| Modi winning the election | india | medium |
| Ram Mandir opening | india | medium |
| Kumbh Mela | india | easy |
| Article 370 | india | hard |
| Farmers protest | india | medium |
| Kerala floods | india | medium |
| Mumbai local floods | india | medium |
| Ambani wedding | india | easy |
| Anna Hazare protest | india | hard |
| IPL auction | india | medium |
| Kabaddi league | india | medium |
| Twin towers falling | global | easy |
| Twin towers Noida demolition | india | medium |
| Will Smith slap | global | easy |
| Titanic sinking | global | easy |
| Moon landing | global | easy |
| Berlin Wall falling | global | medium |
| Olympics opening ceremony | global | medium |
| Oscars | global | easy |
| Eclipse | mixed | easy |
| New Year countdown | mixed | easy |
| Cricket World Cup final | mixed | easy |
| Power cut in the whole colony | india | easy |

## Creators

Internet-famous. Skews younger, which is the point: it gives the room a
category the parents will lose.

| Name | Region | Difficulty |
|---|---|---|
| Bhuvan Bam | india | easy |
| CarryMinati | india | easy |
| Prajakta Koli | india | medium |
| Ashish Chanchlani | india | easy |
| Technical Guruji | india | medium |
| Samay Raina | india | easy |
| Tanmay Bhat | india | medium |
| Zakir Khan | india | easy |
| Kapil Sharma | india | easy |
| Kanan Gill | india | medium |
| Biswa Kalyan Rath | india | hard |
| Abhishek Upmanyu | india | medium |
| Munawar Faruqui | india | medium |
| Puneet Superstar | india | easy |
| Abhijeet Dipke | india | medium |
| Dhruv Rathee | india | medium |
| Ranveer Allahbadia | india | medium |
| Mortal | india | medium |
| Scout | india | medium |
| Total Gaming | india | medium |
| MrBeast | global | easy |
| PewDiePie | global | medium |

## Brands

The snack shelf and the things everyone owns. Easy, fast, and a good breather.

| Brand | Region | Difficulty | Aliases |
|---|---|---|---|
| Maggi | india | easy | Maggie |
| Kurkure | india | easy | Kurkurey |
| Parle G | india | easy | ParleG |
| Amul | india | easy | |
| Frooti | india | easy | |
| Thums Up | india | easy | ThumsUp |
| Rasna | india | medium | |
| Bournvita | india | easy | |
| Lays | global | easy | Lay's |
| Oreo | global | easy | |
| Coca Cola | global | easy | Coke |
| Nescafe | global | easy | |
| Nike | global | easy | |
| Adidas | global | easy | |
| Apple | global | easy | |
| WhatsApp | global | easy | |
| Instagram | global | easy | |
| Netflix | global | easy | |

## Objects

The easy rounds. Every one of these can be acted without a single word.

| Object | Region | Difficulty |
|---|---|---|
| Hammer | mixed | easy |
| Pressure cooker | india | easy |
| Ceiling fan | india | easy |
| Auto rickshaw | india | easy |
| Cricket bat | india | easy |
| Umbrella | mixed | easy |
| Toothbrush | mixed | easy |
| Sewing machine | mixed | medium |
| Washing machine | mixed | easy |
| Pimple | mixed | medium |
| Mosquito coil | india | easy |
| Bucket bath | india | medium |
| Selfie stick | mixed | easy |
| Earphones | mixed | easy |
| Water bottle | mixed | easy |
| Ladder | mixed | easy |
| Suitcase | mixed | easy |
| Scissors | mixed | easy |
| Traffic signal | mixed | easy |
| Vending machine | global | medium |

## Words

Verbs and states. The hardest to act, so the smallest section. Nothing abstract
enough to leave a clue-giver standing still.

| Word | Region | Difficulty |
|---|---|---|
| Sneeze | mixed | easy |
| Yawn | mixed | easy |
| Hiccup | mixed | medium |
| Snoring | mixed | easy |
| Tickle | mixed | easy |
| Swimming | mixed | easy |
| Juggling | mixed | easy |
| Tiptoe | mixed | medium |
| Shivering | mixed | easy |
| Sunburn | mixed | hard |
| Traffic jam | india | easy |
| Queue | mixed | medium |
| Haggling | india | medium |
| Overacting | india | medium |
| Bargaining at a shop | india | medium |
| Missing the train | mixed | medium |

---

## What I deliberately left out

- **Politics with a side.** Modi and Rahul Gandhi are in because both are
  instantly actable and neither row takes a position. Anything that only lands
  if the room agrees with it is not a party game row.
- **Anything requiring spelling out.** Long transliterated names lose points to
  typos, not to bad acting, which makes the round feel unfair.
- **Adult rows.** Every other game in the app has an `adult: true` opt-in set.
  Say the word and I will add one for this too; it is a separate pass and the
  switch already exists.
- **Images.** `gameContent` has an `imageUrl` column and charades could use it
  one day. Not for launch.
