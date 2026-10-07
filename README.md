# AI Agent Swarm Demo

An internal presentation tool for teaching non-technical coworkers what an
**AI agent** and an **agent swarm** are. Two scenes, one app. A presenter drives
it live, but it also works if a coworker opens the URL on their own laptop -
each browser tab is its own isolated session (no database, no login, no shared
state).

**Current release:** v1.2.0, the top-down room/warehouse release.

- **Scene 1 — Single Room (`/room`):** Contrasts doing every step yourself
  (Manual: 1 input → 1 action) with handing one goal to an agent that loops on
  its own until the job is done and then stops itself (Agent: 1 input → N
  actions, self-terminating).
- **Scene 2 — Swarm Warehouse (`/warehouse`):** A local mess scenario renders
  instantly, then a Boss assigns the fixed "Clean the house" goal to Managers,
  explains the decision, reviews work up the chain, and surfaces genuinely stuck
  items to a human.

## Active visual redesign

The project keeps the room-cleaning metaphor but draws it top-down, as a
readable operations map:

- **Single Room:** a worker on a central rug carries scattered household
  clutter (socks, cups, cans, books, toys, trash) to where each belongs —
  trash can, kitchen sink, recycling, bookshelf, laundry hamper, and toy box.
- **Swarm Warehouse:** a top-down facility map shows a boss office, manager
  rooms, generated mess piles, agent work zones, report paths, and escalation
  markers.

The redesign is visual-layer first. It must preserve the existing teaching
behavior: Manual mode is still one submit -> one action, Agent mode is still one
submit -> a self-terminating loop, and the warehouse uses one server-side OpenAI
Boss planning call with deterministic fallback.

## Tech stack

- Next.js (App Router, TypeScript)
- Tailwind CSS
- One serverless API route that keeps the OpenAI key server-side only
- Deploy target: Vercel

## The real AI call

Everything the agents and managers do is **scripted on the client** to keep
cost and latency predictable for a live audience. The warehouse now renders a
local scenario first, then makes one optional server-side OpenAI call:

| Route                  | When it runs                          | What it does                                        |
| ---------------------- | ------------------------------------- | --------------------------------------------------- |
| `/api/boss-plan`       | On Submit in Scene 2 (the centerpiece) | Asks the model to assign generated work groups to Managers, prioritize the work, estimate workload, and explain the Boss decision. |

The final report is generated locally from the actual completed work. If the
Boss planning call fails, times out, or returns malformed JSON, the route falls
back to deterministic assignments so the live demo never visibly breaks. The
failure is logged to the server console only. A small badge on the Boss panel
shows whether the decision came from the live model (`real AI decision`) or the
fallback (`fallback decision`).

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

Both scenes are fully functional locally via `npm run dev`.

## Testing

A real-browser end-to-end smoke test drives both scenes and checks the core
behaviors (Manual = one task per submit, Agent self-terminates, mode lock while
busy, the warehouse produces a final report, and the jam → human-escalation exit
point). It uses Playwright.

```bash
npm run dev                       # terminal 1 — serves on :3000
npx playwright install chromium   # one-time, downloads the browser
npm run test:e2e                  # terminal 2
```

Point it at a different origin with `E2E_BASE`, e.g.
`E2E_BASE=http://localhost:3100 npm run test:e2e`. A clean `npm run lint` and
`npm run build` should also pass with no warnings.

## Deploy to Vercel

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

## Run-of-show (presenting both scenes back to back)

**Before you start:** open the production URL, confirm the Boss panel shows
`real AI decision` after a test run, then Reset.

**Scene 1 — Single Room (~3 min)**

1. Start in **Manual** mode. Type `tidy the room`, hit Submit. One item gets
   carried to where it belongs.
2. Make the point out loud: *"One instruction, one action. To finish cleaning I
   have to keep submitting."* Submit a few more times - the counter climbs.
3. Switch to **Agent** mode (the room resets). Type `tidy the room`, Submit
   **once**.
4. Let it run. The worker walks, puts an item away, returns to the rug, looks
   for the next one, and repeats - on its own - until "Room clean!" appears.
5. Land the lesson: *"Same one instruction. But this time it kept going by
   itself and stopped when the goal was reached. That self-finishing loop is
   what makes something an agent."*

**Scene 2 — Swarm Warehouse (~4 min)**

1. Go to `/warehouse`. Note the facility map: Boss office, manager rooms, work
   cells, report paths, and escalation markers.
2. Click Submit. Pause on **"Boss is deciding…"** and the thought bubbles —
   *"The house is already messy; this is the one moment that's real AI. The Boss
   is assigning the work across Managers."*
3. Open the Boss decision dropdown. The per-manager assignments and rationale
   appear. Managers light up, Agents start clearing, and the review log fills —
   *"The Manager is auditing every item."*
4. Point out Zone B resolving its own jam: *"A Manager can handle most problems
   without bothering anyone up the chain."*
5. **(Optional)** Tick **Presenter tools** and click a zone's **Jam** button
   while it's working. Walk the escalation: Agent → Manager → Boss → the red
   **Needs human input** banner. *"This is the real exit point — when the whole
   chain is stuck, a person steps in."* Click **Resolve** to continue.
6. When all zones report in, the Boss assembles the **final report** locally
   from what actually happened. Read it aloud to close.

**Reset** between runs with the Reset button. If the venue Wi-Fi is flaky, the
fallback keeps everything working — you'll just see the `fallback decision`
badge.

## Constraints / non-goals (v1.2)

- No database, no multiplayer sync — each tab is independent.
- No more than 1 real API call per full warehouse run.
- Fixed hierarchy: 1 Boss, 3 Managers, 6 Agents. No mid-run second planning
  call.
- Primary target is laptop + projector. Mobile is usable but not the focus.
- An optional shared `ACCESS_CODE` passcode gate is intentionally **out of
  scope for v1.2**.

## Project structure

```
app/
  page.tsx                     Landing page (Single Room / Swarm Warehouse)
  room/page.tsx                Scene 1
  warehouse/page.tsx           Scene 2
  api/boss-plan/route.ts       Real OpenAI call — Boss assignment decision (+ fallback)
components/
  RoomScene.tsx                Scene 1 logic + animation
  WarehouseScene.tsx           Scene 2 orchestration
  ScenePrimitives.tsx          Shared top-down walls, stations, workers, paths
  Character.tsx                Shared sprite (idle / walking / working / sitting)
  ClutterItem.tsx              Clutter items + target mapping
  ReportPanel.tsx              Manager / Boss audit log
  EscalationBanner.tsx         "Needs human input" exit point
.env.example                   Variable names only — no real values
```
