# AI Agent Swarm Demo

An internal presentation tool for teaching non-technical coworkers what an
**AI agent** and an **agent swarm** are, using a simple room-cleaning metaphor.
Two scenes, one app. A presenter drives it live, but it also works if a
coworker opens the URL on their own laptop — each browser tab is its own
isolated session (no database, no login, no shared state).

- **Scene 1 — Single Room (`/room`):** Contrasts doing every step yourself
  (Manual: 1 input → 1 action) with handing one goal to an agent that loops on
  its own until the job is done and then stops itself (Agent: 1 input → N
  actions, self-terminating).
- **Scene 2 — Swarm Warehouse (`/warehouse`):** A Boss decomposes one
  instruction into a per-zone plan, Managers assign Agents, work is reviewed
  and reported back up the chain, and genuinely stuck items surface to a human.

## Tech stack

- Next.js (App Router, TypeScript)
- Tailwind CSS
- Two serverless API routes that keep the Anthropic key server-side only
- Deploy target: Vercel

## The two real AI calls

Everything the agents and managers do is **scripted on the client** to keep
cost and latency predictable for a live audience. Exactly two routes make real
Anthropic API calls, both server-side:

| Route                  | When it runs                          | What it does                                        |
| ---------------------- | ------------------------------------- | --------------------------------------------------- |
| `/api/boss-decompose`  | On Submit in Scene 2 (the centerpiece) | Asks the model for a JSON plan: one plain-language instruction per zone, based on what's actually in each zone. |
| `/api/boss-summary`    | After all zones report complete        | Asks the model for a short natural-language final report. |

**Resilience:** if either call fails, times out, or returns malformed JSON, the
route automatically falls back to a hardcoded decomposition/summary so the live
demo never visibly breaks. The failure is logged to the server console only —
the audience never sees an error. A small badge on the Boss panel shows whether
the plan came from the live model (`real AI plan`) or the fallback
(`fallback plan`).

The API key is read from `process.env.ANTHROPIC_API_KEY` **inside the two API
routes only** — it is never exposed to client-side code.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in ANTHROPIC_API_KEY
npm run dev
```

Open <http://localhost:3000>.

`.env.local` variables:

- `ANTHROPIC_API_KEY` — your Anthropic API key (required for the live AI plan;
  without it, the app runs entirely on the built-in fallbacks, which is fine for
  a dry run).
- `AGENT_DEMO_MODEL` — model used for the two Boss calls. Defaults to
  `claude-haiku-4-5-20251001` for live-demo speed. You can swap in
  `claude-sonnet-4-6` for richer Boss reasoning if a few extra seconds of
  latency is acceptable during rehearsal.

Both scenes are fully functional locally via `npm run dev`.

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
   vercel env add ANTHROPIC_API_KEY production
   vercel env add AGENT_DEMO_MODEL production
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
`real AI plan` after a test run, then Reset.

**Scene 1 — Single Room (~3 min)**

1. Start in **Manual** mode. Type `clean the room`, hit Submit. One item moves.
2. Make the point out loud: *"One instruction, one action. To finish the room I
   have to keep submitting."* Submit a few more times — the counter climbs.
3. Switch to **Agent** mode (the room resets). Type `clean the room`, Submit
   **once**.
4. Let it run. The worker walks, clears an item, returns to the desk, scans,
   and repeats — on its own — until "Room clean" appears.
5. Land the lesson: *"Same one instruction. But this time it kept going by
   itself and stopped when the goal was reached. That self-finishing loop is
   what makes something an agent."*

**Scene 2 — Swarm Warehouse (~4 min)**

1. Go to `/warehouse`. Note the three zones each have a different mess.
2. Type `clean the warehouse`, Submit. Pause on **"Boss is deciding…"** —
   *"This is the one moment that's real AI. The Boss is actually reasoning about
   what's in each zone."*
3. The per-zone instructions appear (notice they differ per zone). Managers
   light up, Agents start clearing, and the review log fills with checkmarks —
   *"The Manager is auditing every item."*
4. Point out Zone B resolving its own jam: *"A Manager can handle most problems
   without bothering anyone up the chain."*
5. **(Optional)** Tick **Presenter tools** and click a zone's **⚠ Jam** button
   while it's working. Walk the escalation: Agent → Manager → Boss → the red
   **Needs human input** banner. *"This is the real exit point — when the whole
   chain is stuck, a person steps in."* Click **Resolve** to continue.
6. When all zones report in, the Boss writes the **final report** (the second
   real AI call). Read it aloud to close.

**Reset** between runs with the Reset button. If the venue Wi-Fi is flaky, the
fallbacks keep everything working — you'll just see the `fallback plan` badge.

## Constraints / non-goals (v1)

- No database, no multiplayer sync — each tab is independent.
- No more than 2 real API calls per full warehouse run.
- Fixed hierarchy: 1 Boss, 3 Managers, 6 Agents. No mid-run second
  decomposition call.
- Primary target is laptop + projector. Mobile is usable but not the focus.
- An optional shared `ACCESS_CODE` passcode gate is intentionally **out of
  scope for v1**.

## Project structure

```
app/
  page.tsx                     Landing page (Single Room / Swarm Warehouse)
  room/page.tsx                Scene 1
  warehouse/page.tsx           Scene 2
  api/boss-decompose/route.ts  Real Anthropic call — per-zone plan (+ fallback)
  api/boss-summary/route.ts    Real Anthropic call — final report (+ fallback)
components/
  RoomScene.tsx                Scene 1 logic + animation
  WarehouseScene.tsx           Scene 2 orchestration
  Character.tsx                Shared sprite (idle / walking / working / sitting)
  ClutterItem.tsx              Clutter items + target mapping
  ReportPanel.tsx              Manager / Boss audit log
  EscalationBanner.tsx         "Needs human input" exit point
.env.example                   Variable names only — no real values
```
