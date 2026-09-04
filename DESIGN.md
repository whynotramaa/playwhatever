# Design Constitution

Version 1.0 · Party-game platform

This is the source of truth for the product UI. It combines the supplied visual references with observed patterns from the live Superlist marketing site. It borrows principles, not brand assets, logos, copy, illustrations, or exact page layouts.

The product is an Indian/South Asian party-game platform with quick guest play, host-created rooms, invitations, game cards, tickets, memes, people, events, and later audio. The interface must stay quiet enough for the content to be loud.

> Quiet interface. Expressive game moments.

## 1. Non-negotiable principles

1. Every screen has one obvious next action.
2. Reduce UI before adding decoration.
3. Use whitespace as a component, not leftover space.
4. Let game content provide personality; do not make the shell noisy.
5. Use tactile details—paper, perforation, grain, hand marks—only where they communicate identity or state.
6. Make guest play immediate. Account creation belongs to hosts and persistent-stat users, never in front of the first game.
7. A visual flourish must survive a screenshot, a small mobile screen, and a slow connection.
8. Do not imitate Superlist literally. Recreate the emotional qualities: human, editorial, spacious, tactile, warm, and slightly mischievous.

## 2. Visual personality

The visual voice is:

- premium but not corporate;
- playful but not childish;
- editorial but not precious;
- soft and physical rather than glossy and synthetic;
- Indian in its content, language, and cultural references—not through generic decorative stereotypes;
- confident enough to leave parts of the screen empty.

Avoid:

- dashboard density;
- neon cyberpunk gradients;
- a rainbow of unrelated accents;
- excessive glassmorphism;
- shadows on every element;
- cards nested inside cards without a clear reason;
- generic “AI startup” rounded rectangles;
- decorative scribbles that do not point to or explain anything.

## 3. Color foundations

Use semantic tokens. Components must consume tokens, not hard-coded colors.

### Dark mode

Dark mode is the default game-room mood. It is deep navy-black, not absolute black.

```css
--color-bg: #181824;
--color-bg-deep: #101016;
--color-surface: #232334;
--color-surface-raised: #2c2c40;
--color-surface-soft: #34344a;
--color-border: rgba(255, 255, 255, 0.10);
--color-border-strong: rgba(255, 255, 255, 0.18);
--color-text: #f7f7ff;
--color-text-secondary: #c5c4d1;
--color-text-muted: #8c8b99;
--color-text-disabled: #5d5c68;
```

### Light mode

Light mode is warm white with faint atmospheric color. Never use a stark white canvas for every surface.

```css
--color-bg: #fafaf8;
--color-bg-soft: #f1f0f4;
--color-surface: #ffffff;
--color-surface-soft: #f0eff5;
--color-border: rgba(20, 20, 30, 0.10);
--color-border-strong: rgba(20, 20, 30, 0.18);
--color-text: #171727;
--color-text-secondary: #686778;
--color-text-muted: #9c9baa;
--color-text-disabled: #c0bfca;
```

### Action colors

The product’s action color is warm coral-red, supported by a bright ticket yellow. They are not interchangeable.

```css
--color-coral: #ff6652;
--color-coral-hover: #ff7866;
--color-coral-pressed: #ed5543;
--color-coral-soft: #ffdfd9;
--color-yellow: #f4e900;
--color-yellow-soft: #fff36a;
--color-yellow-shadow: #c9be00;
--color-yellow-ink: #363300;
--color-success: #70d6a0;
--color-danger: #ff6d73;
--color-info: #a8baff;
```

Use coral for the primary product action and active emphasis. Use yellow for tickets, game identity, reveals, scores, and collectible/shareable moments. Keep both scarce enough to remain meaningful.

### Accent tints

Use one tint per game or surface, with a maximum of two accents visible at once:

```css
--tint-lavender: #ded4ff;
--tint-sky: #d4edff;
--tint-mint: #d9f3e4;
--tint-peach: #ffe0d4;
```

Indian identity should come primarily from the content taxonomy—Bollywood, cricket, Indian internet, regional references, public figures, local events, language—not from constantly displaying flags or saffron/green decoration.

## 4. Typography

The product uses two faces. Zarathustra sets every heading. Poppins sets everything
else.

### Zarathustra, headings only

Zarathustra is a display face by Lorène Ceccon, licensed under SIL OFL 1.1. Ship
it from `public/fonts/zarathustra-v01.otf` (18 KB) and keep
`public/fonts/ZARATHUSTRA-LICENSE.md` next to it, as the OFL requires.

Use it for the display size, the hero, page titles, section titles, card titles,
ticket titles, and the logo. Do not use it for body copy, labels, buttons, form
text, metadata, room codes, scores, or legal copy.

The face has one weight and no italic. Set `font-weight: 400` and
`font-synthesis: none` on every heading rule, or the browser fakes a bold and
wrecks the letterforms. Build hierarchy from size, tracking, and color instead.

Two coverage gaps decide how headings get written:

- Zarathustra maps 157 codepoints: Latin letters, digits, accented Latin, and
  light punctuation. It has no `&`, `%`, `#`, `$`, `@`, `+`, `=`, `<`, `>`, `~`,
  `^`, `_`, `{`, `}`, or double quote. A missing character falls back to Poppins in
  the middle of the word, and the seam shows. Write headings without those
  characters.
- Zarathustra has no Devanagari and no other Indian script. A Devanagari heading
  falls back to Noto Sans Devanagari and loses the voice. Set `.heading-intl` on
  any heading that carries non-Latin text, which switches it to Poppins at weight
  600 on purpose.

### Poppins, everything else

Poppins carries body copy, small body, labels, buttons, inputs, metadata, room
codes, and scores. Load weights 400 to 800. Use 400 for paragraphs, 600 for
controls and labels, and 700 for the rare emphasis inside running text.

Poppins is a display-leaning grotesque, so it tires the eye over long copy. Keep
paragraphs to three lines or fewer and hold text columns to the readable width
in section 5. Poppins has no Devanagari either, so every stack ends in Noto Sans
Devanagari. Test any screen with mixed Latin and Devanagari before calling it
done.

Use a hand-drawn face only for short expressive annotations, never for
navigation, instructions, legal copy, scores, or room codes.

```css
--font-display: "Zarathustra", "Poppins", "Noto Sans Devanagari", sans-serif;
--font-ui: "Poppins", "Noto Sans Devanagari", system-ui, sans-serif;
--font-hand: "Comic Sans MS", "Bradley Hand", cursive;
```

The hand fallback is native and temporary. Replace it when a real licensed hand
font is selected.

### Type scale

Headings run at weight 400 because that is the only weight Zarathustra has.

```text
Display:       56px / 0.98, weight 400, tracking -0.035em
Hero mobile:   40px / 1.02, weight 400, tracking -0.030em
Page title:    32px / 1.05, weight 400, tracking -0.025em
Section title: 22px / 1.10, weight 400, tracking -0.015em
Card title:    18px / 1.20, weight 400, tracking -0.010em
Body:          16px / 1.45, weight 400
Small body:    14px / 1.35, weight 400–500
Label:         12px / 1.2,  weight 600, tracking 0.06em
Code:          16–20px / 1, weight 650, tracking 0.08em
```

Use sentence case. All-caps is reserved for tiny category labels, never
paragraphs or primary buttons.

Headings should be short, direct, and slightly conversational. Highlight one
word in coral, yellow, or a hand-drawn underline only when it carries meaning.

## 5. Spacing and geometry

Use a 4px base grid:

```text
4   icon optical adjustment / micro-gap
8   icon-label gap / compact metadata
12  control internal gap
16  default component gap
20  mobile page inset
24  card and section padding
32  major section padding
40  desktop page inset
48  hero spacing
64  major screen breathing room
96  large editorial gap
```

### Container widths

```text
Focused flow:       420–520px
Game browser:       960–1160px
Wide marketing:     1200–1280px maximum
Readable text:      560–680px
Mobile inset:       20px (24px when the screen is wide enough)
Desktop inset:      40px minimum
```

Do not stretch a focused form to fill desktop width. Do not force a three-column layout on mobile.

### Radii

```css
--radius-small: 8px;       /* tags, small icon buttons */
--radius-control: 14px;    /* inputs and regular buttons */
--radius-card: 18px;       /* game cards and media cards */
--radius-panel: 24px;      /* sheets, dialogs, major panels */
--radius-pill: 999px;      /* only status and compact toggles */
```

Rounded UI should feel soft, not inflated. Do not use pill radius on every control.

## 6. Page composition

The shell uses three layers:

1. **Atmosphere:** solid color, gradient, soft texture, or large low-contrast artwork.
2. **Content:** the readable page structure and interactive controls.
3. **Moment:** a ticket, illustration, meme, reveal, player state, or game artifact that carries personality.

Keep atmosphere behind content and moments visually isolated. A decorative background must not reduce text contrast.

The first viewport should answer three questions without scrolling:

- What is this?
- What can I play or do now?
- What is the next click?

## 7. Navigation

Navigation is compact and calm.

Desktop:

- height: `72–88px`;
- horizontal inset: `40px`;
- logo at the left;
- only the essential destination links;
- one primary action at the right;
- menu controls may use a soft capsule with `12px` horizontal padding and `999px` radius.

Mobile:

- height: `64px` plus safe-area padding;
- logo and one menu/action control;
- no crowded link row;
- use a bottom sheet or simple panel for the menu.

Navigation should not compete with the game search or room action.

## 8. Search and game discovery

The home screen is intentionally simple: one strong search field, then game results.

### Search bar

```text
Height:             52px desktop / 48px mobile
Radius:             14px
Left inset:         16px
Icon size:          18px
Icon-to-text gap:   10px
Text size:          16px
Focus ring:         2px coral, 2px outside offset
```

The field should use a filled surface one step above the background, with a 1px border. Placeholder text uses muted color; entered text uses primary color.

Search results should update without a page transition. Provide keyboard navigation and an empty state that suggests real examples such as `Bollywood`, `cricket`, `Will Smith`, or `guess the event`.

### Game card

The card is an invitation to play, not a feature comparison table.

```text
Minimum height:       152px
Padding:              20px
Radius:               18px
Title-to-description: 8px
Description-to-meta:  16px
Metadata gap:         8px
Card gap:             12–16px
```

Structure:

```text
small category / game mark
game title
one-sentence description
player count · duration · content region
primary action or arrow
```

Use one tinted visual block, small image, ticket edge, or hand mark per card. The card should remain understandable if the image fails to load.

Hover on pointer devices:

- background shifts one surface level;
- border becomes slightly more visible;
- card moves `translateY(-2px)` at most;
- action arrow shifts `2–4px`;
- transition `160–220ms` ease-out.

No rotation on ordinary cards. Reserve rotation for shareable artifacts.

## 9. Buttons

### Primary

```text
Height:        48px desktop / 46px mobile
Horizontal:    20–24px
Radius:        14px
Text:          15–16px, weight 600
Icon:          18px
Icon gap:      8px
```

Coral is the default primary action on dark or light surfaces. On a yellow ticket, use yellow-ink text and no coral unless the action must be unmistakable.

### Secondary

Same height and radius as primary. Use a raised surface, soft neutral fill, or transparent fill with a 1px border. Do not make secondary buttons look disabled.

### Tertiary

Plain text or icon-only control. Use only for low-priority actions such as `Copy link`, `Skip`, or `Back`.

### States

```css
button {
  transition: transform 160ms ease-out, background-color 160ms ease-out,
    border-color 160ms ease-out, color 160ms ease-out;
}

button:hover { /* pointer devices only */ }
button:active { transform: scale(0.97); }
button:focus-visible { outline: 2px solid var(--color-coral); outline-offset: 3px; }
```

Loading preserves button width. Replace the label with a compact spinner or progress mark; never let the layout jump.

Disabled controls reduce contrast and remove press feedback, but retain enough shape and text to explain what is unavailable.

## 10. Cards, panels, and lists

Use cards for grouping, not for every paragraph.

Panel recipe:

```text
Background:          one surface level above its parent
Border:              1px solid var(--color-border)
Radius:              18–24px
Padding:             20–24px mobile, 24–32px desktop
Shadow:              optional, low-opacity only
```

List rows:

- minimum height `48px`;
- horizontal padding `12–16px`;
- separators are 1px and low contrast;
- selected row gets a surface tint or a 3px accent edge;
- do not use a new raised card for each row.

## 11. Handwritten marks and scribbles

Hand-drawn elements are annotations, not the base design language.

Good uses:

- underline one important word;
- circle or point to a featured game;
- add a tiny “new”, “your turn”, or “chaos” note;
- draw a route around an illustration;
- mark a score or reveal moment;
- decorate a ticket edge.

Rules:

- use 1–3 marks per viewport maximum;
- line width `2–4px` at desktop, `1.5–3px` mobile;
- round caps and round joins;
- imperfect but intentional geometry;
- opacity `0.55–0.9` depending on contrast;
- use coral, yellow, lavender, or muted gray;
- never place a scribble behind small body text;
- never use it for form validation, navigation, or essential instructions;
- avoid repeating the exact same mark in a grid.

The mark should appear to have been drawn once. Avoid overly perfect SVG paths, uniform dashed borders, or random noise that looks algorithmic.

## 12. Lines and dividers

Lines are quiet structure.

```text
Standard divider:  1px solid rgba(..., 0.10)
Strong divider:    1px solid rgba(..., 0.18)
Ticket divider:    1px dashed, low contrast
Hand line:         2–4px, round cap, accent color
```

Use dividers to separate related content, not to box every item. Leave `16–24px` of breathing room around a divider. A divider should not touch a card edge unless it is deliberately a ticket or data-table treatment.

## 13. Tickets and physical artifacts

Tickets are the product’s signature share and game-description object.

### Standard ticket geometry

```text
Aspect ratio:       1.35–1.65 wide-to-tall for invites
Outer padding:      24px mobile / 32px desktop
Inner border inset: 12–16px
Inner border:       1px solid low-contrast ink
Corner radius:      8–12px before perforation
Shadow:             0 12px 28px rgba(0,0,0,0.16)
```

### Perforations

- semicircular holes are `10–14px` on ordinary UI tickets;
- large share cards may use `14–18px` holes;
- holes repeat every `20–28px`;
- top and bottom rhythms align;
- side notches are centered vertically;
- the cutout edge must be visible against the surrounding surface;
- use a mask, radial gradient, or small SVG—whichever is already available in the project.

Do not use a ticket shape on every card. It is a recognizable product artifact and loses meaning if omnipresent.

### Ticket content hierarchy

```text
game/brand mark
invitation or reveal title
short conversational line
structured metadata
room code or ticket number
```

Metadata rows may use dotted leaders, but the leader must remain subtle and stop before the value. Keep values aligned on one vertical edge.

### Material detail

Use very low-opacity grain, inner highlights, a soft edge shadow, and occasional embossed numbers. The ticket should feel printed and tactile, not distressed or dirty.

Do not use heavy paper textures behind readable text. Avoid fake torn edges unless the game itself requires them.

## 14. Room creation and lobby

The host flow should fit in one focused panel:

1. select game;
2. choose player limit and optional rules;
3. create room;
4. show ticket and share actions;
5. wait for players;
6. start.

The lobby should make these facts immediate:

- room name or game;
- current player count and limit;
- room code/link;
- who is host;
- start state;
- how to invite another person.

Guest players enter only a display name. Sign-in is optional and should be offered after play or at a natural stats moment.

## 15. Share modal and bottom sheet

Backdrop:

```text
Dark mode: rgba(0, 0, 0, 0.60–0.72)
Light mode: rgba(20, 20, 30, 0.28–0.44)
```

Panel:

```text
Width:         min(520px, calc(100vw - 32px))
Padding:       24px mobile / 32px desktop
Radius:        24–28px
Title:         22–26px, centered when the artifact is centered
Close target:  44px minimum
Actions:       12px gap, full-width on mobile
```

The ticket is centered with `24–40px` vertical breathing room. The primary share action comes first; copy link is secondary. After copying, show a short confirmation without moving the buttons.

Modals enter with opacity plus `scale(0.96)` or a small `translateY(8px)`. Never animate from `scale(0)`. Exit faster than entry.

## 16. Images, memes, and people

Images are content and should be handled like editorial objects:

- use a consistent crop per card type;
- preserve faces and important text with `object-position`;
- add a quiet border or radius rather than a loud frame;
- use a low-contrast tint only when text needs separation;
- never make a failed image collapse the card layout;
- avoid image grids that feel like a social feed unless the game specifically requires one.

For recognizable public figures and events, prioritize clear labeling and respectful context. The interface should not imply endorsement or fabricate quotes.

## 17. Motion

Motion has three purposes: feedback, spatial continuity, and game delight.

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
```

Durations:

```text
Press feedback: 100–160ms
Hover/state:    140–200ms
Popover:        150–230ms
Modal/sheet:    220–300ms
Game reveal:    300–600ms when it adds anticipation
```

Prefer transform and opacity. Use CSS transitions for interruptible UI. Use a small `30–70ms` stagger for lists, but never delay the ability to interact.

Respect `prefers-reduced-motion`: remove movement and preserve only useful fades, color, and state changes.

## 18. Accessibility and localization

- touch targets: minimum `44px`;
- keyboard focus: 2px accent outline plus 3px offset;
- never communicate state through color alone;
- labels must remain visible or programmatically associated;
- room codes must be selectable and copyable;
- support long translated strings without clipping;
- test Latin, Devanagari, and mixed-script content;
- allow right-to-left expansion later without hard-coding visual assumptions;
- do not put essential text inside an image;
- preserve contrast on yellow and pastel surfaces;
- support reduced motion and zoom.

## 19. Responsive rules

### Mobile, below 640px

- page inset `20px`;
- one-column content;
- full-width primary actions when they are the main path;
- bottom sheets for action-heavy modals;
- cards may reduce to `16px` padding;
- tickets stay readable before they stay decorative;
- fixed bottom actions must include safe-area padding.

### Tablet, 640–1024px

- page inset `24–32px`;
- two-column cards only when each remains at least `280px` wide;
- preserve the focused flow width;
- keep the primary action visible without excessive scrolling.

### Desktop, above 1024px

- page inset `40px` or more;
- use editorial whitespace;
- maximum content width `1200–1280px`;
- focused forms remain narrow;
- hover effects may add small movement, never required information.

## 20. Content voice

Copy is short, direct, and conversational.

Prefer:

- `Create a room`
- `Share the invite`
- `Waiting for your crew`
- `Start the chaos`
- `Your turn`

Avoid:

- corporate feature language;
- unexplained gaming jargon;
- long onboarding paragraphs;
- fake urgency;
- forced slang or culturally generic “desi” language.

The product can be witty, but the action must always remain unambiguous.

## 21. Implementation guardrails

- Reuse existing project primitives before adding dependencies.
- Prefer CSS for shapes, borders, masks, and small visual effects.
- Prefer native controls for inputs, buttons, and date/time where applicable.
- Keep decorative assets optional and lazy-loadable.
- Do not create a generalized design system before three real screens share a pattern.
- Do not add audio UI until audio exists.
- Do not add account/profile UI to guest flows.
- Keep ticket geometry in one component once the second ticket use case appears.
- Avoid `transition: all`; name the properties.
- Avoid layout animation for simple hover feedback.
- Self-host Zarathustra and ship its OFL license alongside the font file.
- Load Poppins at 400, 500, 600, 700, and 800 only. It has no variable cut,
  so every extra weight is another request.

## 22. Definition of done for any screen

Before calling a screen complete, verify:

1. The first action is obvious in three seconds.
2. The screen still works with images disabled.
3. The accent color is concentrated, not sprayed everywhere.
4. Empty space is intentional and balanced.
5. Every clickable element has a visible hover, pressed, focus, disabled, and loading treatment where relevant.
6. Shadows explain hierarchy rather than decorate it.
7. Handwritten marks point to meaning and do not become wallpaper.
8. Text survives longer Indian names, codes, and translations.
9. Mobile has no clipped controls or unreachable actions.
10. The screen feels related to the constitution without looking like a copy of Superlist.

## 23. Self-evaluation of this constitution

This constitution passes the current reference check:

- **Superlist dark reference:** captured through deep navy-black surfaces, low-density layouts, soft capsules, restrained borders, coral actions, and large confident typography.
- **Superlist light/mobile reference:** captured through warm white space, dark ink text, soft atmospheric color, centered messaging, and wide comfortable action buttons.
- **Handwritten reference:** captured as sparse, purposeful annotations with concrete line widths and usage limits.
- **Party-game context:** adapted through tickets, yellow game moments, room codes, share artifacts, guest-first flows, Indian content taxonomy, and reveal states.
- **Typography:** decided as Zarathustra for headings and Poppins for everything
  else, with the single weight, the missing glyphs, and the missing Devanagari
  recorded as rules rather than left to discover.
- **Physical reference language:** captured through perforations, paper grain, inner borders, embossing, and subtle material shadows.

The main risk is overusing the expressive layer. If a screen contains more visual decoration than game information, remove the decoration first. If a future screenshot introduces a recurring pattern not covered here, update this file before adding a one-off exception.

