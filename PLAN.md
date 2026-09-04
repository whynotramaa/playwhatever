# Product Build Plan

## Product

An Indian/South Asian multiplayer party-game platform for fast, low-friction play.

Players discover a game, create or join a room, invite friends, and start playing. Hosts have accounts. Guests can join anonymously. Players may later link an account to retain statistics and appear on leaderboards.

Initial content is approximately 50% Indian/South Asian and 50% international: memes, people, events, phrases, internet moments, Bollywood, cricket, and global pop culture.

## Technical decision

```text
Frontend:       Next.js + React + TypeScript
Styling:        Tailwind CSS + native CSS
Backend:        Convex
Database:       Convex database
Authentication: Better Auth with Convex integration
Guest access:   Better Auth anonymous sessions
Deployment:     Vercel + Convex Cloud
Storage:        Convex file storage initially
Audio later:    WebRTC, with Convex for signaling state
```

Do not add Supabase, raw Postgres infrastructure, Redis, a custom WebSocket server, a CMS, or native mobile apps during the MVP.

## Product architecture

The application has two layers:

```text
PLATFORM LAYER — stable and shared
├── authentication
├── anonymous guests
├── profiles
├── game discovery
├── room creation and joining
├── player membership
├── realtime room state
├── host permissions
├── game lifecycle
├── sharing and invitation tickets
├── voice/audio calling later
├── results and statistics
├── content loading
└── error/reconnect states

GAME MODULE LAYER — changes per game
├── rules
├── game settings
├── round state
├── player actions
├── validation
├── scoring
├── private/public information
├── game-specific content
└── game-specific screens
```

The platform owns how a game starts, how players join, how state is synchronized, how invitations work, and how results are recorded. A game module owns only what makes that game different.

The core rule is:

> Adding a game should not require rewriting authentication, rooms, invitations, realtime connection handling, voice, player lists, or statistics.

## Repository structure

Start with a simple feature-based structure. Do not create a framework inside the framework.

```text
src/
  app/
    page.tsx
    games/[slug]/page.tsx
    games/[slug]/create/page.tsx
    join/[roomCode]/page.tsx
    rooms/[roomId]/page.tsx
    rooms/[roomId]/play/page.tsx
    rooms/[roomId]/results/page.tsx
    api/auth/[...all]/route.ts

  components/
    Button.tsx
    Card.tsx
    Modal.tsx
    Sheet.tsx
    SearchBar.tsx
    Avatar.tsx
    PlayerList.tsx
    RoomCode.tsx
    InvitationTicket.tsx
    ShareActions.tsx

  features/
    auth/
    discovery/
    rooms/
    sharing/
    voice/
    stats/
    games/

  lib/
    auth-client.ts
    auth-server.ts
    convex.ts
    room-links.ts
    share.ts

  styles/
    globals.css

convex/
  schema.ts
  auth.config.ts
  http.ts
  games.ts
  rooms.ts
  players.ts
  sessions.ts
  rounds.ts
  stats.ts
  betterAuth/

  games/
    registry.ts
    shared.ts
    traders/
    guess-the-word/
    guess-the-event/

DESIGN.md
PLAN.md
```

If a file only has one caller and one implementation, keep it local. Extract it only after a second real use appears.

## Game module contract

Each game should be a small module with the same platform-facing responsibilities.

```text
Game module
├── identity
├── settings definition
├── player requirements
├── initial state
├── valid actions
├── action validation
├── state transition
├── scoring
├── round completion
├── public state projection
├── private state projection
├── content selection
└── UI components
```

The platform should be able to ask a game module:

```text
What is this game?
What settings does it support?
Can this player perform this action?
What changes after this action?
What can each player see?
Is the round complete?
How are points calculated?
What happens next?
```

Do not force every game into identical rules. Share the lifecycle and contracts, not the internal game mechanics.

## Shared game lifecycle

Every game uses this outer lifecycle:

```text
room created
  ↓
players join
  ↓
host starts game
  ↓
round initialized
  ↓
players take actions
  ↓
actions validated
  ↓
round resolved
  ↓
scores recorded
  ↓
next round or final results
  ↓
game finished
```

Shared room/session statuses:

```text
waiting
starting
in_progress
round_complete
finished
closed
```

Shared round statuses:

```text
pending
active
locked
revealing
complete
```

The game module decides what `active`, `locked`, and `complete` mean internally. The platform controls navigation and lifecycle boundaries.

## Data model

### Better Auth data

Better Auth owns:

```text
user
session
account
verification
```

The anonymous plugin supports guest sessions without collecting personal information. Guests can later link a real authentication method.

### Application data

```text
profiles
games
gameContent
rooms
roomPlayers
gameSessions
rounds
submissions
playerStats
```

### Profiles

```text
userId
displayName
avatarUrl
isAnonymous
createdAt
updatedAt
```

### Games

```text
slug
name
shortDescription
longDescription
playerMin
playerMax
estimatedMinutes
categories
accentColor
thumbnailUrl
isPublished
sortOrder
```

### Game content

```text
gameId
contentType
title
description
region
category
difficulty
imageUrl
metadata
isPublished
```

Possible `contentType` values:

```text
person
event
meme
phrase
image
prompt
```

Possible `region` values:

```text
india
south_asia
global
mixed
```

### Rooms

```text
roomCode
gameId
hostUserId
status
maxPlayers
settings
createdAt
startedAt
finishedAt
```

### Room players

```text
roomId
userId
displayName
isHost
status
score
joinedAt
lastSeenAt
removedAt
```

### Game sessions

```text
roomId
gameId
currentRound
totalRounds
state
createdAt
updatedAt
```

`state` should contain only non-sensitive shared session data. Private information belongs in player-specific records or private projections.

### Rounds

```text
sessionId
roundNumber
contentId
status
state
startedAt
endedAt
```

### Submissions

```text
roundId
playerId
action
result
score
createdAt
```

Do not store more raw player data than the game needs.

## Phase 1: Project foundation

1. Create the Next.js TypeScript application.
2. Enable the App Router.
3. Add Tailwind CSS.
4. Add Convex.
5. Add Better Auth and the Convex adapter.
6. Add the base environment variables.
7. Add `DESIGN.md` and `PLAN.md`.
8. Configure dark mode as the default.
9. Configure light mode support.
10. Add global spacing, color, radius, typography, shadow, and motion tokens.
11. Create the base layout and page container.
12. Add a basic header, button, card, input, modal, and sheet.

Completion condition: the application opens locally with the visual foundation and no product-specific game logic yet.

## Phase 2: Authentication foundation

1. Configure Better Auth inside Convex.
2. Generate the Better Auth schema.
3. Add the Next.js auth route handler.
4. Add the client auth instance.
5. Add the Convex auth provider.
6. Enable anonymous authentication.
7. Enable Google login.
8. Add host sign-up/sign-in screens.
9. Add sign-out.
10. Add account linking from anonymous session to authenticated account.
11. Add a profile record on first authenticated use.
12. Add server-side helpers for current user and current session.

Completion condition: a host can create an account, a guest can receive an anonymous session, and a guest can later link an account.

## Phase 3: Game registry and discovery

1. Create the game registry.
2. Add the six initial game records.
3. Add the game list query.
4. Add the game detail query.
5. Add the home screen.
6. Add the search bar.
7. Add search by name, description, category, and keyword.
8. Add categories:

```text
Popular
Indian
Global
Bollywood
Cricket
Memes
People
Events
Quick games
```

9. Add the game card.
10. Add the game detail view.
11. Add empty search results.
12. Add unpublished-game handling.

Completion condition: a user can find a game and reach its create-room screen.

## Phase 4: Content foundation

1. Create the `gameContent` schema.
2. Add content categories and region fields.
3. Add seed data for all initial games.
4. Keep the content ratio near 50% Indian/South Asian and 50% global.
5. Add content selection queries.
6. Add published/unpublished controls.
7. Add fallback content when a category has insufficient items.
8. Use the Convex dashboard for initial editing.
9. Keep content outside React components.
10. Store image references, not large image payloads, in normal records.

Completion condition: a game module can request suitable content without knowing how the content is stored.

## Phase 5: Room creation

1. Create the create-room route.
2. Load the selected game.
3. Display only the settings that game supports.
4. Add player-limit selection.
5. Add round-count selection.
6. Add category and region selection where relevant.
7. Add optional difficulty where relevant.
8. Validate all settings on the server.
9. Generate a short, readable room code.
10. Create the room through a Convex mutation.
11. Create the game session.
12. Add the host as the first room player.
13. Redirect the host to the lobby.

Room-code rules:

- case-insensitive;
- no ambiguous characters;
- unique among active rooms;
- short enough to read aloud;
- never generated only on the client.

Completion condition: an authenticated host can create a room and reach a lobby.

## Phase 6: Guest joining

1. Create the join route.
2. Resolve the room code.
3. Display the game and room status.
4. Ask only for a display name.
5. Create or resume an anonymous Better Auth session.
6. Validate room capacity.
7. Validate room status.
8. Prevent removed players from immediately rejoining.
9. Add the player to `roomPlayers`.
10. Redirect the player to the lobby.

Guest flow must not ask for:

- email;
- password;
- phone number;
- profile image;
- account creation.

Completion condition: a guest can open a link, choose a display name, and join a room without registration.

## Phase 7: Lobby and shared room system

1. Build the shared lobby shell.
2. Add the game title and description.
3. Add room code and copy action.
4. Add invitation share action.
5. Add player count and maximum capacity.
6. Add player list.
7. Add host marker.
8. Add connected/disconnected state.
9. Add host-only controls.
10. Add leave-room action.
11. Add remove-player action.
12. Add start-game action.
13. Add close-room action.
14. Subscribe to the room through Convex reactive queries.
15. Reconnect players using their existing session and player record.
16. Mark stale players as disconnected using `lastSeenAt`.

The lobby must be shared by all games. A new game must not create a new lobby implementation.

Completion condition: players see joins, leaves, removals, and the host’s start action without refreshing.

## Phase 8: Invitation tickets and sharing

1. Build the reusable `InvitationTicket` component.
2. Add game name and game mark.
3. Add invitation title.
4. Add short supporting copy.
5. Add room code.
6. Add host name.
7. Add player limit.
8. Add ticket number or room identifier.
9. Add perforated edges.
10. Add subtle grain and material shadows.
11. Add dark and light variants.
12. Build the share modal.
13. Use the native Web Share API when available.
14. Fall back to copying the room URL.
15. Keep copy confirmation in place without layout movement.
16. Make the room code selectable.

The ticket component should be usable later for:

```text
game descriptions
room invites
round reveals
achievements
final results
social share images
```

Completion condition: the host can share a visually designed invitation and copy the room link.

## Phase 9: Shared game engine

1. Define the common game-session lifecycle.
2. Define common room and round statuses.
3. Define public and private state projections.
4. Define the common mutation boundaries.
5. Add host authorization checks.
6. Add player membership checks.
7. Add round-state checks.
8. Prevent duplicate submissions.
9. Prevent invalid state transitions.
10. Add current-round queries.
11. Add player-specific state queries.
12. Add shared round header and progress UI.
13. Add shared waiting state.
14. Add shared reveal state.
15. Add shared score update state.
16. Add shared results shell.

Common mutations:

```text
startGame()
startRound()
submitAction()
lockRound()
resolveRound()
scoreRound()
advanceRound()
finishGame()
```

Game modules may use game-specific mutations, but they should call through the same permission and state-validation rules.

Completion condition: a game module can plug into the shared room-to-results lifecycle.

## Phase 10: First complete game — Traders

1. Write the rules in plain language.
2. Define player count requirements.
3. Define room settings.
4. Define private player state.
5. Define public room state.
6. Define valid trade actions.
7. Define invalid trade actions.
8. Define turn or simultaneous-action behavior.
9. Define round completion.
10. Define scoring.
11. Define ties.
12. Define final winner state.
13. Add Traders content.
14. Add the Traders module.
15. Add game-specific UI.
16. Connect it to the shared lobby.
17. Connect it to the shared room state.
18. Connect it to the shared results screen.
19. Ensure private player data is never returned in another player’s query.

Traders should prove that the architecture handles:

- private state;
- shared state;
- player actions;
- validation;
- multiple rounds;
- scoring;
- final results.

Completion condition: a host and multiple guests can complete a full Traders game.

## Phase 11: Additional game modules

Add games one at a time:

```text
Guess the Word
Guess the Event
Who Said It?
Meme Match
Personality or Pair Guessing
```

For each game:

1. Document the rules.
2. Define its supported settings.
3. Define its content types.
4. Define public state.
5. Define private state.
6. Define player actions.
7. Define validation.
8. Define scoring.
9. Define round completion.
10. Add the module folder.
11. Register the game.
12. Add content records.
13. Add game-specific screens only where necessary.
14. Reuse the platform lobby.
15. Reuse the platform room controls.
16. Reuse the platform share ticket.
17. Reuse the platform player list.
18. Reuse the platform results shell.

The addition of a game should primarily involve:

```text
one module
content records
game-specific mutations if required
game-specific UI
registry entry
```

It should not involve changes to authentication, room creation, guest joining, sharing, or voice infrastructure.

## Phase 12: Results and statistics

1. Build the shared final-results screen.
2. Display rankings.
3. Display scores.
4. Display winner and notable outcomes.
5. Add replay action.
6. Add return-to-games action.
7. Save completed-game records.
8. Save stats only for authenticated users.
9. Keep anonymous scores temporary unless the guest links an account.
10. Transfer eligible guest activity when an account is linked.

Initial stats:

```text
gamesPlayed
gamesWon
roundsWon
totalScore
highestScore
favoriteGame
favoriteCategory
lastPlayedAt
```

Initial leaderboard scopes:

```text
global
per game
```

Skip seasons, friends, achievements, badges, and ranking algorithms until usage justifies them.

## Phase 13: Shared voice/audio capability

Shipped. Always-on for the life of the room, mounted by the room layout so a
game starting does not tear down the call. Mesh WebRTC on public STUN, Convex
for signalling, mute state on `roomPlayers`. Still open from the list below:
speaking state is measured locally rather than stored, and there is no TURN
server, so a pair behind symmetric NATs will fail to connect.

Voice is a platform capability, not a game module capability.

1. Decide whether audio is always-on or turn-based.
2. Add a shared voice provider at the room level.
3. Use WebRTC for audio transport.
4. Use Convex for signaling metadata.
5. Store participant mute state.
6. Store speaking state only if necessary.
7. Add microphone permission handling.
8. Add mute/unmute controls.
9. Add reconnect handling.
10. Add permission-denied handling.
11. Add host audio controls if required.
12. Keep all voice UI outside individual game modules.

Game modules should only be able to request room voice availability. They should not own peer connections, microphone permissions, or audio controls.

If peer-to-peer audio becomes unreliable at the required player count, introduce a media server later. Do not add one before that need exists.

## Phase 14: Error and recovery behavior

Implement shared handling for:

```text
room not found
room full
room closed
game unpublished
invalid room code
duplicate display name
host disconnected
player removed
session expired
connection lost
game already started
invalid action
```

Recovery rules:

1. Preserve the guest session.
2. Preserve the player ID where possible.
3. Reconnect to the existing room.
4. Reload the authoritative Convex state.
5. Return the player to the correct screen.
6. Prevent duplicate submissions.
7. Never let a temporary connection loss erase completed progress.

## Phase 15: Content operations

Start with Convex dashboard editing and seed data.

Content workflow:

```text
seed content
→ review content
→ publish content
→ assign category and region
→ make available to game
```

Add a dedicated admin interface only when dashboard editing becomes a real bottleneck.

Future moderation fields may include:

```text
reviewStatus
reportedCount
approvedBy
approvedAt
```

Do not build moderation infrastructure before user-generated content exists.

## Phase 16: Visual system application

Apply `DESIGN.md` after the main interaction paths work.

Polish in this order:

1. home and search;
2. game cards;
3. create-room flow;
4. join-room flow;
5. lobby;
6. invitation ticket;
7. game screen;
8. result screen;
9. authentication;
10. errors and reconnect states.

Prioritize:

- spacing;
- button proportions;
- card hierarchy;
- typography;
- color restraint;
- ticket perforation and material detail;
- subtle shadows;
- hover and pressed states;
- mobile safe areas;
- focus states;
- reduced motion.

Do not add expressive decoration to compensate for unclear interaction design.

## Phase 17: Deployment

1. Create development Convex deployment.
2. Create production Convex deployment.
3. Configure local environment variables.
4. Configure preview environment variables.
5. Configure production environment variables.
6. Configure Better Auth trusted origins.
7. Configure Google OAuth redirect URLs.
8. Deploy Next.js to Vercel.
9. Connect the production domain.
10. Deploy Convex functions.
11. Seed production game records.
12. Publish only the games that are ready.
13. Keep `isPublished` as the release switch.

Environment model:

```text
local       local Next.js + development Convex
preview     Vercel preview + preview Convex deployment
production  Vercel production + production Convex deployment
```

Do not create a separate staging system until the team or release process needs one.

## MVP definition

The MVP is complete when it includes:

```text
Next.js application
Convex backend and database
Better Auth
Anonymous guest sessions
Host accounts
Google login
Game discovery and search
Six games listed
One fully playable game
Room creation
Shareable room links
Guest joining
Realtime lobby updates
Invitation ticket
Shared game lifecycle
Results screen
Basic persistent stats
Dark and light themes
Responsive UI
Production deployment
```

## Explicitly deferred

```text
native mobile apps
dedicated CMS
user-generated content
advanced moderation
friends system
private messaging
seasons
achievements
subscriptions
advertising
advanced analytics
Redis
custom WebSocket server
media server
```

## Architecture rules

1. Platform capabilities remain platform-owned.
2. Game modules own game rules only.
3. No game may implement its own room, lobby, auth, share, player list, or voice system.
4. Convex mutations validate every state-changing action.
5. The client never decides authoritative scores or protected state transitions.
6. Public and private game state are separate projections.
7. Content is data, not component code.
8. Anonymous play remains the shortest path into the product.
9. Add abstractions only after a second real game needs them.
10. Keep the first implementation boring enough to replace.

## Adding a future game

The intended workflow is:

```text
1. Write the rules.
2. Define the game state.
3. Define public/private state.
4. Define actions and scoring.
5. Create the game module.
6. Register the game.
7. Add content.
8. Connect to the shared lifecycle.
9. Add only the required game UI.
10. Publish it.
```

If adding a new game requires editing authentication, room joining, sharing, voice, or the global lobby, the boundary is wrong and should be fixed before continuing.

## Simplification notes

```text
ponytail: Convex database holds room state initially; introduce a separate state store only when measured room traffic requires it.
ponytail: Convex dashboard is the first content tool; build a CMS only when manual editing is a bottleneck.
ponytail: One shared lifecycle is enough; avoid a generalized game-engine framework until multiple games prove the need.
ponytail: WebRTC is deferred; do not build signaling or media infrastructure before voice is an active requirement.
```

