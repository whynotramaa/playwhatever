// Screenshots for the rules pages, taken from the live site so they show what
// visitors actually get. Run it after a deploy that changes those screens:
//   node scripts/shoot.mjs
// In-game screens need three signed-in players, so they are not in here.
import { chromium } from "playwright";

const SITE = process.env.SHOOT_URL ?? "https://playwhatever.ramaa.tech";
const SHOTS = [
  ["/", "home.png"],
  ["/daily", "daily.png"],
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

for (const [path, file] of SHOTS) {
  await page.goto(SITE + path, { waitUntil: "networkidle" });
  // The shelf and the board both arrive over the socket, and the round intro
  // fades. Give the screen a beat to settle before shooting it.
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `public/blog/${file}` });
  console.log(`${path} -> public/blog/${file}`);
}

await browser.close();
