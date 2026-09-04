/**
 * The Make Your Team auction pool, generated from CORPUS-TEAM.md.
 *
 * One row is one lot. `rating` is what the lot is actually worth when the
 * teams are scored at the end, and it is the only number the game hides: a
 * room that could see it would be bidding against a price tag rather than
 * against each other. `tag` is the line printed under the name on the lot
 * card, and it is what makes a name feel like a card rather than a list item.
 */
import type { ContentSeed } from "./types";

/** name, tag, rating */
type Row = [string, string, number];

const CRICKET: Row[] = [
  ["Sachin Tendulkar", "Little Master", 99],
  ["Virat Kohli", "Chase master", 97],
  ["MS Dhoni", "The finisher", 96],
  ["Brian Lara", "Prince of Trinidad", 96],
  ["Rohit Sharma", "Six machine", 95],
  ["Jasprit Bumrah", "Yorker on demand", 95],
  ["Shane Warne", "Ball of the century", 95],
  ["AB de Villiers", "Mr 360", 94],
  ["Wasim Akram", "Sultan of swing", 93],
  ["Ricky Ponting", "Punter", 93],
  ["Chris Gayle", "Universe Boss", 92],
  ["Ben Stokes", "Match winner", 92],
  ["Steve Smith", "Fidget genius", 91],
  ["Rahul Dravid", "The Wall", 90],
  ["Rashid Khan", "Mystery spin", 90],
  ["Ravindra Jadeja", "Sir Jadeja", 89],
  ["Kumar Sangakkara", "Silk gloves", 89],
  ["Suryakumar Yadav", "Sky", 88],
  ["Joe Root", "Sweep merchant", 88],
  ["Yuvraj Singh", "Six sixes in an over", 88],
  ["Kane Williamson", "Ice cool", 87],
  ["Mitchell Starc", "Left arm thunder", 87],
  ["Hardik Pandya", "Seam and swagger", 86],
  ["Babar Azam", "Cover drive", 86],
  ["Shubman Gill", "The prince", 85],
  ["Rishabh Pant", "Reverse scoop", 85],
  ["KL Rahul", "Silk timing", 84],
  ["Bhuvneshwar Kumar", "Swing at will", 78],
];

const FOOTBALL: Row[] = [
  ["Lionel Messi", "The left foot", 99],
  ["Cristiano Ronaldo", "Siuuu", 98],
  ["Zinedine Zidane", "The roulette", 96],
  ["Ronaldo Nazario", "O Fenomeno", 96],
  ["Ronaldinho", "Joga bonito", 95],
  ["Kylian Mbappe", "Pure speed", 94],
  ["Erling Haaland", "Goal machine", 93],
  ["Paolo Maldini", "The perfect defender", 93],
  ["Kevin De Bruyne", "The pass", 92],
  ["Thierry Henry", "Va va voom", 92],
  ["Mohamed Salah", "Egyptian King", 91],
  ["Andres Iniesta", "The illusionist", 91],
  ["Gianluigi Buffon", "Superman", 91],
  ["Luka Modric", "Midfield metronome", 90],
  ["Robert Lewandowski", "Box predator", 90],
  ["Jude Bellingham", "Hey Jude", 90],
  ["Virgil van Dijk", "The wall", 89],
  ["Vinicius Junior", "Left wing terror", 89],
  ["Xavi Hernandez", "Tiki taka", 89],
  ["Neymar Jr", "The trickster", 88],
  ["Manuel Neuer", "Sweeper keeper", 88],
  ["Kaka", "The gentleman", 87],
  ["Sergio Ramos", "Ninety three twenty", 86],
  ["Sadio Mane", "Lion of Teranga", 86],
  ["Bukayo Saka", "Starboy", 84],
  ["Sunil Chhetri", "Captain fantastic", 80],
];

const BOLLYWOOD: Row[] = [
  ["Amitabh Bachchan", "Shahenshah", 98],
  ["Shah Rukh Khan", "Badshah", 97],
  ["Rajinikanth", "Thalaiva", 96],
  ["Aamir Khan", "Mr Perfectionist", 94],
  ["Sridevi", "Chandni", 94],
  ["Madhuri Dixit", "Dhak dhak", 93],
  ["Kamal Haasan", "Ulaganayagan", 93],
  ["Irrfan Khan", "The eyes", 93],
  ["Salman Khan", "Bhai", 92],
  ["Deepika Padukone", "Mastani", 92],
  ["Hrithik Roshan", "The dancer", 90],
  ["Alia Bhatt", "Gully girl", 89],
  ["Kajol", "Simran", 89],
  ["Ranbir Kapoor", "Rockstar", 88],
  ["Nawazuddin Siddiqui", "Faizal Khan", 88],
  ["Allu Arjun", "Pushpa", 88],
  ["Tabu", "The quiet storm", 88],
  ["Ranveer Singh", "Full volume", 87],
  ["Vijay Sethupathi", "Makkal Selvan", 87],
  ["Prabhas", "Baahubali", 87],
  ["Vidya Balan", "The lead", 87],
  ["Fahadh Faasil", "Method man", 86],
  ["Yash", "Rocky bhai", 85],
  ["Anil Kapoor", "Jhakaas", 85],
  ["Akshay Kumar", "Khiladi", 84],
  ["Rani Mukerji", "Tina", 84],
];

const CHARACTERS: Row[] = [
  ["Gabbar Singh", "Kitne aadmi the", 95],
  ["Raj Malhotra", "Palat", 92],
  ["Baahubali", "Jai Mahishmati", 92],
  ["Rancho", "All is well", 91],
  ["Mogambo", "Mogambo khush hua", 90],
  ["Munna Bhai", "Jadoo ki jhappi", 89],
  ["Vijay Dinanath Chauhan", "Poora naam", 89],
  ["Faizal Khan", "Wasseypur", 88],
  ["Geet", "Jab We Met", 88],
  ["Langda Tyagi", "Omkara", 87],
  ["Pushpa Raj", "Jhukega nahi", 87],
  ["Bajirao", "Bajirao Mastani", 86],
  ["Sardar Khan", "Wasseypur", 86],
  ["Rocky Bhai", "The monster", 86],
  ["Kattappa", "The loyal blade", 85],
  ["Veeru", "Sholay", 85],
  ["Jai", "Sholay", 85],
  ["Bhallaladeva", "The throne", 84],
  ["Circuit", "Bhai ka right hand", 84],
  ["Basanti", "Dhanno", 84],
  ["Bunny", "Yeh Jawaani", 84],
  ["Anthony Gonsalves", "Amar Akbar Anthony", 82],
  ["Naina Talwar", "Yeh Jawaani", 80],
  ["Chulbul Pandey", "Robinhood Pandey", 80],
  ["Meera Gaity", "The Dirty Picture", 78],
  ["Kabir Singh", "All rage", 76],
];

const MOVIES: Row[] = [
  ["Sholay", "1975, and still winning", 97],
  ["Dilwale Dulhania Le Jayenge", "Still running in Maratha Mandir", 95],
  ["Mughal-e-Azam", "Pyar kiya to darna kya", 94],
  ["3 Idiots", "All is well", 93],
  ["Lagaan", "Cricket against a tax", 92],
  ["Baahubali 2", "Why did Kattappa", 92],
  ["Dangal", "Mari chhoriyan", 91],
  ["RRR", "Naatu Naatu", 91],
  ["Gangs of Wasseypur", "Two parts, one grudge", 90],
  ["Hera Pheri", "Utha le re baba", 90],
  ["Anand", "Zindagi badi honi chahiye", 90],
  ["Zindagi Na Milegi Dobara", "The road trip", 89],
  ["Dil Chahta Hai", "Goa", 89],
  ["Andaz Apna Apna", "Cult comedy", 88],
  ["Rang De Basanti", "The march", 88],
  ["Jaane Bhi Do Yaaro", "The Mahabharata scene", 87],
  ["Swades", "Yeh taara woh taara", 87],
  ["Kantara", "The daiva", 87],
  ["Drishyam", "The alibi", 86],
  ["Jawan", "The double role", 85],
  ["Queen", "Solo honeymoon", 85],
  ["Tumbbad", "Greed, filmed", 84],
  ["Pushpa", "Thaggede le", 82],
  ["KGF Chapter 2", "Violence, violence", 82],
  ["Pathaan", "The comeback", 82],
  ["Masaan", "Two threads, one river", 82],
];

type Pool = {
  category: string;
  region: ContentSeed["region"];
  contentType: ContentSeed["contentType"];
  rows: Row[];
};

const POOLS: Pool[] = [
  { category: "cricket", region: "mixed", contentType: "person", rows: CRICKET },
  { category: "football", region: "global", contentType: "person", rows: FOOTBALL },
  { category: "bollywood", region: "india", contentType: "person", rows: BOLLYWOOD },
  { category: "characters", region: "india", contentType: "person", rows: CHARACTERS },
  { category: "movies", region: "india", contentType: "phrase", rows: MOVIES },
];

export const SQUADS: ContentSeed[] = POOLS.flatMap((pool) =>
  pool.rows.map(([title, tag, rating]) => ({
    gameSlug: "make-your-team",
    contentType: pool.contentType,
    title,
    description: tag,
    region: pool.region,
    category: pool.category,
    metadata: { tag, rating },
  }))
);
