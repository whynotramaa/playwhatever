# PlayWhatever

PlayWhatever is a fast, guest-friendly party-game platform for groups playing together in the same room. Pick a game, create or join a room, pass the phone around, and let the app handle private information, timers, voting, scoring, and reveals.

The content leans Indian and South Asian—Bollywood, cricket, memes, people, events, and internet culture—with global references mixed in. The interface is deliberately quiet; the game moments do the shouting.

## What is in the app

### Multiplayer rooms

- Browse, search, and filter the published game shelf.
- Hosts sign in, choose a game and settings, and create a room.
- Guests join anonymously with a six-character room code and display name.
- The shared lobby shows seats, host status, availability, and a shareable invitation ticket.
- Room state is realtime through Convex, including reconnect and away states.
- Optional room voice uses peer-to-peer WebRTC audio with Convex carrying signaling data.

### Published games

| Game | Players | Typical length | How it plays |
| --- | ---: | ---: | --- |
| **Traitors** | 3–12 | 15 min | Everyone gets a related name except one traitor. Speak, vote, eliminate, and try to find the odd name. |
| **IPL Guessr** | 1–12 | 12 min | Identify a hidden IPL player in up to eight guesses using team, nationality, role, batting hand, birth year, and debut-season marks. |
| **Dumb Charadess** | 3–12 | 20 min | Players act out a word one at a time while one guesser types guesses against the clock. |
| **Guess the Liar** | 3–12 | 15 min | Everyone answers the same question except one liar. Compare answers and vote for the person faking it. |

There is also **Player of the Day**, a registered-player-only IPL puzzle with one shared answer, eight guesses, an IST day boundary, and Today / All time boards.

### Accounts and scores

- Anonymous sessions get players into a room without an account wall.
- Accounts are required to host rooms, play the daily puzzle, and retain statistics.
- Email/password sign-in is followed by six-digit email verification.
- Google sign-in is optional and enabled only when its credentials are configured.
- When a guest links an account, their guest room data is transferred to that account.
- Account users get overall and per-game stats plus leaderboards; guest scores disappear with the room.

## Visual preview

The game artwork ships in [`public/game-art`](./public/game-art) and is used by the game shelf and detail pages.

<table>
  <tr>
    <td><img src="./public/game-art/traitors.webp" alt="Traitors game artwork" width="420"></td>
    <td><img src="./public/game-art/ipl-guessr-v2.webp" alt="IPL Guessr game artwork" width="420"></td>
  </tr>
  <tr>
    <td align="center"><strong>Traitors</strong></td>
    <td align="center"><strong>IPL Guessr</strong></td>
  </tr>
  <tr>
    <td><img src="./public/game-art/dumb-charadess.webp" alt="Dumb Charadess game artwork" width="420"></td>
    <td><img src="./public/game-art/guess-the-liar.webp" alt="Guess the Liar game artwork" width="420"></td>
  </tr>
  <tr>
    <td align="center"><strong>Dumb Charadess</strong></td>
    <td align="center"><strong>Guess the Liar</strong></td>
  </tr>
</table>

## Tech stack

- **Frontend:** Next.js 16 App Router, React 19, TypeScript
- **Styling:** Tailwind CSS 4 with native CSS design tokens
- **Backend:** Convex 1.45 for database, realtime queries, mutations, actions, and scheduled game state
- **Authentication:** Better Auth with the Convex integration, anonymous sessions, email OTP, and optional Google OAuth
- **Voice:** WebRTC peer-to-peer audio; Convex stores only the signaling and mute state
- **Deployment:** Vercel for the web app and Convex Cloud for the backend
- **Typography:** self-hosted Zarathustra for headings and Poppins / Noto Sans Devanagari for UI text

## Run locally

### Prerequisites

- Node.js 20.9 or newer
- An available Convex deployment
- npm (the repository also includes `bun.lock` if you prefer Bun)

### Install and configure

```bash
git clone <your-repository-url>
cd playwhatever
npm install
cp .env.example .env.local
```

Set at least these values in `.env.local`:

```dotenv
SITE_URL=http://localhost:3000
BETTER_AUTH_SECRET=<a-random-secret>
```

Generate a local secret with:

```bash
openssl rand -base64 32
```

The Convex values (`CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, and `NEXT_PUBLIC_CONVEX_SITE_URL`) are normally created or filled in by `convex dev`. Do not commit `.env.local`.

### Start the app

Run Convex and Next.js in separate terminals:

```bash
# Terminal 1: Convex functions, schema, and generated API
npm run dev:convex

# Terminal 2: Next.js at http://localhost:3000
npm run dev
```

On the first Convex run, follow the CLI prompts to create or select a development deployment. Once it is running, seed the games and content:

```bash
npx convex run seed:run
```

The seed is idempotent: it updates the four game records and only inserts content whose title is not already present.

Without a `RESEND_API_KEY`, verification codes are printed to the Convex logs, which is useful for local development. To send real email, configure `RESEND_API_KEY` and a verified `EMAIL_FROM` value. Google sign-in stays inactive until both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set.

## Environment variables

See [`.env.example`](./.env.example) for the complete annotated template.

| Variable | Required | Purpose |
| --- | --- | --- |
| `CONVEX_DEPLOYMENT` | Local / Convex CLI | Selects the Convex development or production deployment. |
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Convex cloud URL used by the browser. Usually generated by Convex. |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | Yes | Convex site URL used by the auth server helpers. |
| `SITE_URL` | Yes | Canonical web-app URL used by Better Auth. |
| `BETTER_AUTH_SECRET` | Yes | Secret used to sign Better Auth sessions and tokens. Use different values per environment. |
| `TRUSTED_ORIGINS` | Optional | Comma-separated extra origins, useful for Vercel previews. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional | Enables Google OAuth when both are present. |
| `RESEND_API_KEY` / `EMAIL_FROM` | Optional locally | Sends email verification codes through Resend. |
| `CONVEX_DEPLOY_KEY` | Vercel only | Allows the Vercel build to deploy Convex functions. Set it in Vercel, not `.env.local`. |

For Google OAuth, add these callback URLs to the Google web application:

```text
http://localhost:3000/api/auth/callback/google
https://your-domain.com/api/auth/callback/google
```

## Project structure

```text
src/
  app/
    page.tsx                         game shelf and room-code entry
    games/[slug]/                    game details and host setup
    join/[roomCode]/                 guest join flow
    rooms/[roomId]/                  shared lobby and room-level voice
    rooms/[roomId]/play/[sessionId]/ game screens
    daily/                           Player of the Day
    stats/                           account stats and leaderboards
    login/                           sign-in, sign-up, and email OTP
  components/                        shared UI, tickets, cards, boards, voice
  lib/                               auth, themes, game helpers, WebRTC
  styles/                            fonts and global design tokens

convex/
  schema.ts                          database model and indexes
  rooms.ts                           room lifecycle and host permissions
  games.ts / content.ts              game shelf and content access
  traitors.ts / liar.ts              social deduction game logic
  ipl.ts / daily.ts                  multiplayer and daily IPL Guessr logic
  charades.ts                        Dumb Charadess logic
  voice.ts                            WebRTC signaling and room mute state
  stats.ts / profiles.ts             persistence and leaderboards
  seed/                               launch games and content corpus
```

The backend has a shared platform layer—auth, guest sessions, rooms, player membership, realtime state, voice, results, and stats—and small game modules on top. Adding a game should only require its rules, content, state transitions, mutations, and screen; the room and lobby remain shared.

## Useful commands

```bash
npm run dev              # Next.js development server
npm run dev:convex       # Convex development server
npm run build            # production build and TypeScript validation
npm run start            # serve a production build
npx convex run seed:run  # seed games and content
```

To intentionally remove games no longer present in `convex/seed/games.ts`:

```bash
npx convex run seed:pruneRemovedGames
```

Review that operation before running it against a shared or production deployment.

## Deployment

The repository includes [`vercel.json`](./vercel.json). Its build command deploys Convex first and passes the resulting URL into the Next.js build:

```text
npx convex deploy --cmd 'npm run build' --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL
```

For a Vercel deployment:

1. Create or select the production Convex deployment.
2. Add the production `CONVEX_DEPLOY_KEY` to Vercel project environment variables.
3. Add the production `SITE_URL`, `BETTER_AUTH_SECRET`, auth, email, and Convex variables.
4. Add the production domain and any preview domains to `TRUSTED_ORIGINS` where needed.
5. Deploy through Vercel; the configured build command publishes Convex functions before building the frontend.
6. Run the seed against the intended deployment if its content is not already present:

   ```bash
   npx convex run seed:run
   ```

Use separate Better Auth secrets and Convex deployments for development and production.

## Product documentation

- [`DESIGN.md`](./DESIGN.md) — visual constitution, typography, layout, motion, accessibility, and responsive rules
- [`GAMES.md`](./GAMES.md) — game rules, scoring, room flow, voice behavior, and future game ideas
- [`PLAN.md`](./PLAN.md) — product architecture and implementation plan
- [`CORPUS.md`](./CORPUS.md) and the game-specific corpus files — content taxonomy and editorial guidance
- [`AGENTS.md`](./AGENTS.md) — project instructions, including Convex development guidance

## Current scope

This is an active MVP rather than a finished catalogue. The current build focuses on low-friction physical-room play, four seeded multiplayer games, the daily IPL puzzle, account-backed stats, and shared room voice. Matchmaking, spectator mode, custom content creation, and additional games are intentionally outside the current scope.
