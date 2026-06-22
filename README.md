# AI Agent Swarm Game

A top-down **game** that teaches the difference between a chat window and an
**AI agent**: you give one instruction, then watch the AI take the controls and
run the workers (pawns) itself. Five scenes, one app. Drive it live, or let a
coworker open the URL and play on their own laptop — each browser tab is its own
isolated session (no database, no login, no shared state).

**Current release:** v2.1.0 (five-scene ladder, canvas sprite engine,
authoritative Boss planning, Manager queue planning, and live swarm item
spawning).

## What v2.1 includes

- Five polished mini games: Manual Task, Chat Window, Single Agent, Small Team,
  and Swarm House.
- Raw `<canvas>` sprite engine for room, team, and swarm movement, with React
  used only for discrete state and panels.
- Generated PNG sprite assets committed under `public/assets/sprites/`.
- Server-side OpenAI Boss and Manager planning routes, each fallback-backed.
- One-at-a-time live item spawning in the swarm scene.
- Full local verification coverage: lint, unit tests, build, E2E, and visual QA
  at laptop/projector sizes.

- **Scene 1 — Manual Task (`/manual`):** You do the work yourself. One Submit
  moves one item, then the loop stops and waits for you.
- **Scene 2 — Chat Window (`/chat`):** You type a prompt and get a useful text
  answer, but the room state does not change.
- **Scene 3 — Single Agent (`/agent`):** One goal drives a pawn through every
  next action until the room is clean, then it stops itself.
- **Scene 4 — Small Team (`/team`):** One Manager splits a goal across two
  Agents and returns a team report.
- **Scene 5 — Swarm House (`/swarm`):** A local mess scenario renders instantly,
  then a Boss uses real AI to **allocate** the fixed "Clean the house" goal
  across Managers. Each Manager uses a real/fallback plan to split work across
  two Agents. While the swarm is running, the player can click a palette item,
  click the Living room, and drop one new object into the live queue without
  resetting the run.

## Rendering

The playable scenes draw their sprite layer on a raw HTML5 `<canvas>` engine
(`components/sprites/SpriteEngine.ts`): a `requestAnimationFrame` loop paints
rasterized PNG sprites, Y-sorted for top-down depth, with movement decoupled
from React (no per-frame re-renders). The PNGs are generated offline from the
SVG definitions by `scripts/rasterize-sprites.mjs` (`npm run sprites`, uses
`sharp`) into `public/assets/sprites/`. CSS room shells and DOM panels/overlays
(forms, logs, legends, aria-live regions) sit over the canvas, so accessibility
and the teaching chrome are preserved.

Teaching behavior is explicit: Manual = one submit → one action, Chat = output
only, Agent = one submit → a self-terminating loop, Team = delegated parallel
work, Swarm = hierarchy plus live adaptation.

## Tech stack

- Next.js (App Router, TypeScript)
- Tailwind CSS + a raw `<canvas>` sprite engine
- Serverless API route(s) that keep the OpenAI key server-side only
- Deploy target: Vercel

## The real AI

The model is **"AI plans, engine executes":** the AI makes the decisions and
deterministic client-side animation carries them out, so cost and latency stay
predictable for a live audience.

| Route                  | When it runs                          | What it does                                        |
| ---------------------- | ------------------------------------- | --------------------------------------------------- |
| `/api/boss-plan`       | On Submit in Scene 5 (the centerpiece) | Asks the model to **authoritatively assign every mess group to a Manager** — this drives which crew does the work and balances load so nobody is idle — plus priority, rationale, and escalation notes. |
| `/api/manager-plan`    | After the Boss allocation in Scene 5    | Each Manager splits work across its own two Agents, with fallback and visible rebalance behavior. |

The final report is generated locally from the actual completed work. If an AI
call fails, times out, or returns malformed JSON, the route falls back to
deterministic assignments so the live game never visibly breaks. The failure is
logged to the server console only. A small badge on the Boss panel shows whether
the decision came from the live model (`real AI decision`) or the fallback
(`fallback decision`).

The API key is read from `process.env.OPENAI_API_KEY` **inside the API route
only** — it is never exposed to client-side code.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in OPENAI_API_KEY
npm run dev
```

Open <http://localhost:3000>.

`.env.local` variables:

- `OPENAI_API_KEY` — your OpenAI API key (required for the live AI plan;
  without it, the app runs entirely on the built-in fallbacks, which is fine for
  a dry run).
- `OPENAI_MODEL` — model used for the Boss planning call. Defaults to
  `gpt-5.4-mini` for live-demo speed and cost control.

All five scenes are fully functional locally via `npm run dev`.

## Testing

Unit tests cover the shared swarm planning rules. A real-browser end-to-end
smoke test drives all five scenes and checks the core behaviors (Manual = one
task per submit, Chat output leaves state unchanged, Agent self-terminates,
Small Team splits work across two Agents, Manager plans, live item spawning,
final report accounting, and the jam → human-escalation exit point).
It uses Playwright.

```bash
npm run test:unit
npm run dev                       # terminal 1 — serves on :3000
npx playwright install chromium   # one-time, downloads the browser
npm run test:e2e                  # terminal 2
```

Point it at a different origin with `E2E_BASE`, e.g.
`E2E_BASE=http://localhost:3100 npm run test:e2e`. A clean `npm run lint` and
`npm run build` should also pass with no warnings.

## Deploy to Vercel

Deployment is intentionally a separate approval step. v2.1 is ready to run
locally and to push to GitHub, but do not deploy to Vercel until explicitly
requested.

1. Install the CLI and log in (one time):

   ```bash
   npm install -g vercel
   vercel login
   ```

2. From the project root, link and deploy a preview:

   ```bash
   vercel
   ```

3. Set the environment variables (these are **not** committed to the repo —
   `.env.example` only documents the names):

   ```bash
   vercel env add OPENAI_API_KEY production
   vercel env add OPENAI_MODEL production
   ```

   (Repeat for the `preview` environment if you want previews to use the live
   model too. You can also set these in the Vercel dashboard under
   **Project → Settings → Environment Variables**.)

4. Ship to production:

   ```bash
   vercel --prod
   ```

The result is a public URL reachable from any browser in the US or Mexico — no
VPN, no login required by default.

## Run-of-show (presenting the five-scene ladder)

**Before you start:** open the local or production URL, confirm the Boss panel
shows `real AI decision` after a test run when a key is configured, then Reset.

**Scene 1 — Manual Task (~1 min)**

1. Go to `/manual`. Type `tidy the room`, hit Submit.
2. Point out that one item moved and the system stopped. Submit a few more
   times so the repetition is obvious.

**Scene 2 — Chat Window (~1 min)**

1. Go to `/chat`. Submit the same prompt.
2. Read the plan, then point to the unchanged item counter: output is not action.

**Scene 3 — Single Agent (~2 min)**

1. Go to `/agent`. Submit `tidy the room` once.
2. Let the pawn choose the next item, move it, return home, and repeat until
   "Room clean!" appears. This is the self-finishing loop.

**Scene 4 — Small Team (~2 min)**

1. Go to `/team`. Submit once.
2. The Manager splits the room across Agent A and Agent B. Let both finish and
   read the team report.

**Scene 5 — Swarm House (~4 min)**

1. Go to `/swarm`. Note the facility map: Boss office, manager rooms, work
   cells, report paths, and escalation markers.
2. Click Submit. Pause on **"Boss is deciding…"** and the thought bubbles —
   *"The house is already messy; this is the one moment that's real AI. The Boss
   is assigning the work across Managers."*
3. Open the Boss decision dropdown. The per-manager assignments and rationale
   appear. Managers light up, Agents start clearing, and the review log fills —
   *"The Manager is auditing every item."*
4. Pick **Plate** from the item palette, then click inside the Living room. One
   plate drops onto the floor, the Kitchen Manager adds it to a live Agent
   queue, and the swarm keeps moving without a reset.
5. Point out a Manager resolving or rebalancing work: *"A Manager can handle most problems
   without bothering anyone up the chain."*
6. **(Optional)** Tick **Presenter tools** and click a zone's **Jam** button
   while it's working. Walk the escalation: Agent → Manager → Boss → the red
   **Needs human input** banner. *"This is the real exit point — when the whole
   chain is stuck, a person steps in."* Click **Resolve** to continue.
7. When all zones report in, the Boss assembles the **final report** locally
   from what actually happened, including player-added work. Read it aloud to
   close.

**Reset** between runs with the Reset button. If the venue Wi-Fi is flaky, the
fallback keeps everything working — you'll just see the `fallback decision`
badge.

## Constraints / non-goals

- No database, no multiplayer sync — each tab is independent.
- AI calls follow "AI plans, engine executes": ~1 Boss call + 3 Manager calls
  per swarm run. Every call has a deterministic fallback.
- Fixed hierarchy: 1 Boss, 3 Managers, 6 Agents.
- Primary target is laptop + projector. Mobile is usable but not the focus.
- Low Power mode caps the canvas loop and device-pixel-ratio pressure for older
  or overloaded laptops.
- An optional shared `ACCESS_CODE` passcode gate is intentionally **out of
  scope**.

## Project structure

```
app/
  page.tsx                     Landing page (five-scene ladder)
  manual/page.tsx              Scene 1
  chat/page.tsx                Scene 2
  agent/page.tsx               Scene 3
  team/page.tsx                Scene 4
  swarm/page.tsx               Scene 5
  room/page.tsx                Legacy redirect to /agent
  warehouse/page.tsx           Legacy redirect to /swarm
  api/boss-plan/route.ts       Real OpenAI call — authoritative Boss allocation (+ fallback)
  api/manager-plan/route.ts    Real OpenAI call — Manager queue split (+ fallback)
components/
  RoomScene.tsx                Manual and single-agent logic + choreography
  ChatWindowScene.tsx          Prompt/output-only scene
  SmallTeamScene.tsx           One Manager + two Agents scene
  WarehouseScene.tsx           Swarm orchestration (drives the canvas engine)
  RoomSprites.tsx              SVG sprite definitions — source of truth for the rasterizer
  sprites/
    SpriteEngine.ts            Raw <canvas> + rAF engine (Y-sorted, React-decoupled)
    SpriteRenderer.tsx         Mounts the canvas, hands the engine to the scene
    spriteManifest.ts          Typed view over the generated PNG manifest
  ReportPanel.tsx              Manager / Boss audit log
  EscalationBanner.tsx         "Needs human input" exit point
lib/
  warehouseRules.ts            Palette routing, Manager fallback planning, rebalance helpers
scripts/
  rasterize-sprites.mjs        SVG -> PNG pipeline (npm run sprites, uses sharp)
public/assets/sprites/         Generated PNG sprites + sprites.manifest.json (committed)
.env.example                   Variable names only — no real values
```

Regenerate the sprite PNGs after changing the SVG definitions in
`components/RoomSprites.tsx`:

```bash
npm run sprites
```
