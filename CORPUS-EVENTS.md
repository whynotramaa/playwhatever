# Guess the Event content corpus

Draft for review. **Nothing here is in the database.** On your approval it
replaces the 20 year-guessing rows currently seeded for `guess-the-event`, and
then the game module gets rewritten around it.

## The game this is written for

One guesser per turn. Everybody else sees the event and gives hints, one at a
time. The guesser types into a text box and has a limited number of tries. The
host sets the timer and the number of tries.

That shape puts three demands on every row:

1. **The answer has to be typeable.** "Will Smith slapping Chris Rock at the
   Oscars" is not something anybody types. The answer is `Will Smith slap`, and
   the row carries the longer alternates it should also accept.
2. **The hint-givers have to recognise it instantly.** They get the answer plus
   a one-line description, so nobody is left holding a name they have never
   heard of.
3. **It has to have been talked about.** Meme value, argument value, or the
   kind of thing a room shouts over. A correct but obscure event is a dead turn.

## How a row works

```text
title        the answer, short enough to type          "Will Smith slap"
description  what it is, shown only to the hint-givers
accept       other spellings the checker takes
category     Cricket | Indian film | Indian internet | India | Global internet |
             Global sport | Global screen | World
region       india | global | mixed
difficulty   easy | medium | hard
```

Matching lowercases, strips punctuation and collapses spaces before comparing,
so `Will Smith Slap!` and `will smith slap` are the same string. Everything
beyond that is in the open questions at the bottom.

## Proposed schema mapping

`gameContent` already fits this without a change:

```text
contentType   "event"
title         the answer
description   the line the hint-givers read
category      as above
region        india | global | mixed
difficulty    easy | medium | hard
metadata      { accept: string[] }
```

---

## Cricket

Region `india`. 11 events.

| Event | What it is | Also accept | Difficulty |
|---|---|---|---|
| Dhoni's six | The six off Kulasekara that won the 2011 World Cup final at the Wankhede. | dhoni winning six, 2011 world cup final, dhoni six wc | easy |
| Six sixes | Yuvraj Singh hits Stuart Broad for six sixes in an over, 2007 T20 World Cup. | yuvraj six sixes, yuvraj singh six sixes | easy |
| 1983 World Cup | Kapil Dev lifts the trophy at Lord's after India beat the West Indies. | kapil dev world cup, 1983 win | medium |
| The last over at the 2007 T20 final | Joginder Sharma bowls it, Misbah scoops, Sreesanth catches. | misbah scoop, joginder sharma last over, 2007 t20 final | medium |
| Dhoni's run-out | Guptill's direct hit ends India's 2019 World Cup semi-final. | dhoni run out, 2019 semifinal run out | medium |
| The Mankad | Ashwin runs Jos Buttler out at the non-striker's end, IPL 2019. | ashwin mankad, ashwin buttler mankad | medium |
| Slapgate | Harbhajan slaps Sreesanth after an IPL match in 2008, and Sreesanth cries on camera. | harbhajan slap, sreesanth crying | medium |
| Kohli at the MCG | The 82 not out against Pakistan in the 2022 T20 World Cup. | kohli 82, kohli mcg innings | medium |
| Rohit's 264 | The highest individual ODI score, against Sri Lanka at Eden Gardens. | rohit 264, rohit sharma 264 | hard |
| The 2023 World Cup final | Australia beat India in Ahmedabad in front of 100,000 people. | ahmedabad final, 2023 wc final | medium |
| Kohli and Gambhir's IPL row | The two of them shouting at each other on the field, IPL 2013. | kohli gambhir fight, gambhir kohli argument | medium |

## Indian film

Region `india`. 11 events.

| Event | What it is | Also accept | Difficulty |
|---|---|---|---|
| KGF Kalashnikov scene | Rocky picks up the Kalashnikov in KGF Chapter 2 and the theatre loses it. | kgf gun scene, rocky kalashnikov, kgf 2 gun | easy |
| Kitne aadmi the | Gabbar's line in Sholay, still quoted fifty years later. | sholay gabbar scene, gabbar kitne aadmi the | easy |
| The DDLJ train scene | Raj holds his hand out and Simran runs for the moving train. | ddlj train, ja simran ja | easy |
| Why Kattappa killed Baahubali | The cliffhanger that ran India for two years. | kattappa baahubali, baahubali cliffhanger | easy |
| Beta tumse na ho payega | Definite's line in Gangs of Wasseypur, now the internet's default insult. | gangs of wasseypur definite, tumse na ho payega | easy |
| Jhukega nahi saala | Pushpa's line, and the shoulder that came with it. | pushpa jhukega nahi, pushpa dialogue | easy |
| Naatu Naatu wins the Oscar | RRR takes Best Original Song in 2023. | rrr oscar, naatu naatu oscar | easy |
| All is well | The 3 Idiots line, chest-tap included. | 3 idiots all is well, aal izz well | easy |
| Jadoo ki jhappi | Munna Bhai hands out hugs instead of medicine. | munna bhai jhappi, jadu ki jhappi | medium |
| Slumdog Millionaire at the Oscars | Eight Oscars in 2009, two of them A. R. Rahman's on the same night. | slumdog oscars, rahman oscar | medium |
| Shah Rukh Khan at the Met Gala | His first one, in 2025, and the internet did not stop. | srk met gala, shahrukh met gala | medium |

## Indian internet

Region `india`. 11 events.

| Event | What it is | Also accept | Difficulty |
|---|---|---|---|
| Rasode mein kaun tha | Yashraj Mukhate turns a Saath Nibhaana Saathiya scolding into a song. | rasode me kaun tha, kokilaben meme | easy |
| Binod | A comment section finds one man's name and refuses to discuss anything else. | binod meme | easy |
| Pawri ho rahi hai | Dananeer Mobeen's nine seconds on a hillside, remixed by the whole subcontinent. | pawri hori hai, ye hamari pawri ho rahi hai | easy |
| Moye moye | A Serbian song becomes India's shorthand for everything going wrong. | moye moye meme, dzanum | medium |
| Just looking like a wow | Jasmeen Kaur selling a suit, and the line that outlived the suit. | jasmeen kaur, looking like a wow | easy |
| Kacha Badam | Bhuban Badyakar's peanut-selling song turns into a national dance trend. | kacha badam song, badam kaka | easy |
| Selfie maine le li aaj | Dhinchak Pooja's song, and the discourse that followed it. | dhinchak pooja selfie, dhinchak pooja | medium |
| Vada Pav Girl | Chandrika Dixit's Delhi stall goes viral, then goes several other places. | chandrika dixit, vadapav girl | medium |
| Ek ek cup chai | The Panchayat scene that became the format for every office meeting. | panchayat chai, 1 1 cup chai | medium |
| Ye badhiya tha guru | Munna Bhaiya's Mirzapur line, used to praise anything at all. | mirzapur munna bhaiya, badhiya tha guru | medium |
| Hum uss zamane se hai | The Taarak Mehta line that turned into a meme template. | taarak mehta meme, uss zamane se hai | hard |

## India, the big moments

Region `india`. 7 events.

| Event | What it is | Also accept | Difficulty |
|---|---|---|---|
| Demonetisation | The televised address in 2016 that took 500 and 1000 rupee notes out of circulation. | notebandi, note ban, demonetization | easy |
| Chandrayaan-3 lands | India puts a lander near the lunar south pole in 2023, and the whole country watches the feed. | chandrayaan 3, moon landing india | easy |
| Mangalyaan reaches Mars | India makes Mars orbit on the first attempt, 2014. | mars orbiter mission, mangalyaan | medium |
| Neeraj Chopra's gold | The javelin throw that took India's first Olympic athletics gold, Tokyo 2021. | neeraj chopra javelin, neeraj gold | easy |
| Abhinav Bindra's gold | India's first individual Olympic gold, ten metre air rifle, Beijing 2008. | abhinav bindra, bindra gold | medium |
| The 2020 lockdown announcement | Four hours' notice and a country of 1.3 billion stops moving. | india lockdown, covid lockdown india | easy |
| 26/11 | The 2008 attacks across Mumbai, watched live for three days. | mumbai attacks, 26 11 attacks | medium |

## Global internet

Region `global`. 17 events.

| Event | What it is | Also accept | Difficulty |
|---|---|---|---|
| Will Smith slap | He walks up on stage and slaps Chris Rock at the 2022 Oscars. | will smith chris rock, oscars slap | easy |
| The dress | Blue and black or white and gold, and the argument that split the internet in 2015. | blue black white gold, the dress meme | easy |
| Ellen's Oscar selfie | The 2014 selfie with half of Hollywood in it that broke Twitter. | oscars selfie, ellen selfie | medium |
| The envelope mix-up | La La Land is announced Best Picture, then it turns out to be Moonlight. | la la land moonlight, oscars envelope | medium |
| Kanye interrupting Taylor Swift | "Imma let you finish", VMAs 2009. | imma let you finish, kanye taylor vma | easy |
| Bernie's mittens | Sanders sits through the 2021 inauguration in a mask and mittens and becomes a meme. | bernie sanders mittens, bernie meme | medium |
| Salt Bae | The chef sprinkling salt down his forearm, 2017. | nusret, salt bae meme | easy |
| The Ocean Spray video | A man skateboards to work drinking cranberry juice to Fleetwood Mac, 2020. | dreams tiktok, cranberry juice skateboard | medium |
| The Ice Bucket Challenge | Everyone on earth pours cold water on themselves for ALS, 2014. | ice bucket, als challenge | easy |
| Gangnam Style hits a billion | The first YouTube video to get there, 2012. | gangnam style, psy gangnam | easy |
| Harambe | The gorilla shot at Cincinnati Zoo in 2016, and the years of jokes after. | harambe gorilla | medium |
| Fyre Festival | The luxury island festival that turned out to be tents and cheese sandwiches. | fyre fest, cheese sandwich festival | medium |
| The GameStop squeeze | Reddit retail traders take on hedge funds, January 2021. | gamestop, wallstreetbets | medium |
| The Ever Given | A container ship wedges itself across the Suez Canal and blocks world trade for six days. | suez canal ship, ever given stuck | easy |
| I am not a cat | A lawyer appears at a video hearing stuck behind a kitten filter, 2021. | zoom cat lawyer, cat filter lawyer | medium |
| Elon carrying a sink | He walks into Twitter HQ holding a sink, 2022. | let that sink in, musk sink | medium |
| Left Shark | The backup dancer who lost the routine at the Super Bowl halftime show, 2015. | katy perry shark, left shark super bowl | hard |

## Global sport

Region `global`. 7 events.

| Event | What it is | Also accept | Difficulty |
|---|---|---|---|
| Messi lifts the World Cup | Qatar 2022, the final against France, the bisht. | messi world cup, argentina 2022 | easy |
| Zidane's headbutt | The 2006 World Cup final ends with a headbutt to Materazzi's chest. | zidane headbutt, zidane materazzi | easy |
| The Hand of God | Maradona punches the ball in against England, 1986. | maradona hand of god | easy |
| Ronaldo moves the bottles | He shifts two Coca-Cola bottles off camera at a Euro 2020 press conference. | ronaldo coca cola, ronaldo bottles | easy |
| Suarez bites Chiellini | The 2014 World Cup bite, on camera, in front of everyone. | suarez bite | medium |
| Bolt's smile | The photo of Usain Bolt grinning mid-sprint at Rio 2016. | usain bolt photo, bolt smiling race | medium |
| Liverpool 4, Barcelona 0 | The Champions League comeback at Anfield in 2019. | anfield comeback, liverpool barcelona 4 0 | medium |

## Global screen

Region `global`. 9 events.

| Event | What it is | Also accept | Difficulty |
|---|---|---|---|
| The Game of Thrones coffee cup | A takeaway cup is left in a shot in season eight and the internet finds it in minutes. | got coffee cup, starbucks cup thrones | medium |
| Red light, green light | The first game in Squid Game, and the doll everybody recognised by week two. | squid game doll, squid game red light | easy |
| The snap | Thanos clicks his fingers and half of everything disappears. | thanos snap, infinity war ending | easy |
| The Titanic door | Jack in the water, Rose on the door, and thirty years of argument about the space on it. | titanic door, jack and rose door | easy |
| The Joker stairs | Arthur dances down a flight of Bronx steps, 2019, and tourists still queue for it. | joker stairs dance, joker steps | medium |
| I am the one who knocks | Walter White's line in Breaking Bad. | breaking bad knocks, walter white knocks | medium |
| Bella Ciao | The song Money Heist turned into a global earworm. | money heist song, la casa de papel bella ciao | medium |
| Running Up That Hill in Stranger Things | A 1985 Kate Bush song goes back to number one because of a 2022 scene. | kate bush stranger things, max song scene | medium |
| We were on a break | Ross's defence in Friends, and the argument that never ended. | friends on a break, ross rachel break | easy |

## World

Region `global`. 9 events.

| Event | What it is | Also accept | Difficulty |
|---|---|---|---|
| 9/11 | Two planes hit the World Trade Center in 2001 and the towers come down. | twin towers, world trade center attack, september 11 | easy |
| The moon landing | Apollo 11 puts two people on the moon in 1969 with the world watching. | apollo 11, neil armstrong moon | easy |
| The Berlin Wall comes down | 1989, and people take hammers to it on live television. | fall of berlin wall, berlin wall | medium |
| COVID declared a pandemic | The WHO makes it official in March 2020 and the world shuts its doors. | covid pandemic declared, who pandemic | easy |
| The Notre-Dame fire | The cathedral roof and spire burn in front of Paris, 2019. | notre dame burning, paris cathedral fire | medium |
| The Queen dies | Elizabeth II, September 2022, after seventy years on the throne. | queen elizabeth death, queen died | easy |
| The bin Laden raid | US special forces reach a compound in Abbottabad, 2011. | osama raid, abbottabad raid | medium |
| Brexit | Britain votes to leave the European Union, 2016. | brexit vote, eu referendum | medium |
| Chernobyl | Reactor four explodes in 1986, and the town of Pripyat is emptied. | chernobyl disaster, pripyat | medium |

---

## Totals

| Group | Events | Region |
|---|---|---|
| Cricket | 11 | india |
| Indian film | 11 | india |
| Indian internet | 11 | india |
| India, the big moments | 7 | india |
| Global internet | 17 | global |
| Global sport | 7 | global |
| Global screen | 9 | global |
| World | 9 | global |
| **Total** | **82** | |

40 events are `india` and 42 are `global`, so the 50/50 ratio holds. A room of
five players burns five events a round, so this supports a long evening before
anything repeats.

## What I left out, on purpose

- **Party politics.** No election results, no bills, no partisan fights. The
  political events kept here are the ones nobody argues about being famous.
- **Deaths as punchlines.** 9/11, 26/11 and Chernobyl are in because they are
  among the most recognised events on earth, and the descriptions play them
  straight. Anything that only works as a joke about a death is out.
- **Anything from the last few months.** A meme needs to have survived a year
  before a room of eight people all recognise it.
- **Banned-word lists.** No taboo rule is written into these rows yet. See the
  questions below.

## Questions

1. **Banned words.** Should a hint-giver be blocked from saying words that are
   in the answer, taboo style? If yes I add a `banned` list to every row and
   the hint-givers' screen shows it. If no, the room polices itself.
2. **Volume.** 82 is one long evening. Say the word and I take it to 150 before
   anything gets built.
3. **Categories as a room setting.** Should the host be able to pick, say,
   cricket and Indian internet only, and leave the world events out?
