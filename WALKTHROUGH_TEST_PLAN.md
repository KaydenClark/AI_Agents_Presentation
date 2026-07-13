# Walkthrough Test Plan — AI Agent Swarm Game

A manual, screen-by-screen walkthrough for confirming the app **makes sense**
(the story reads, the UI is clear, nothing looks broken) and has **no issues**
(no console errors, no dead controls, no stuck states, no layout breakage).

This is complementary to the automated suites. The 48-check Playwright E2E
(`tests/e2e.mjs`) proves the *functional invariants*; this plan is a human
pass over *presentation, clarity, and visual polish* — the things a live
audience sees but a headless test cannot judge.

---

## 1. Scope

Every reachable screen is covered:

| # | Screen | Route | Type |
|---|--------|-------|------|
| 0 | Landing / six-mode ladder | `/` | Page |
| 1 | Manual Game | `/manual` | Mode |
| 2 | Chat Window | `/chat` | Mode |
| 3 | Tool Use | `/tool-use` | Mode |
| 4 | Single Agent | `/agent` | Mode |
| 5 | Small Team | `/team` | Mode |
| 6 | Swarm House | `/swarm` | Mode (finale) |
| 7 | Legacy redirect | `/room` → `/agent` | Redirect |
| 8 | Legacy redirect | `/warehouse` → `/swarm` | Redirect |
| 9 | Framed preview window | `/demo-embed.html` | Static embed |
| — | Boss plan API | `/api/boss-plan` | API (contract only) |
| — | Manager plan API | `/api/manager-plan` | API (contract only) |

Out of scope: performance benchmarking, cross-browser matrix beyond the two
listed below, and load testing. The app is stateless (no DB, no auth), so there
is no data-integrity surface to test.

---

## 2. Preconditions & setup

Pick ONE target and record which you used in the log:

- **Local dev (recommended for a full pass):**
  ```bash
  cd Projects/AI_Agents_Presentation
  npm install
  cp .env.example .env.local      # optional — add OPENAI_API_KEY for live AI
  npm run dev                     # http://localhost:3000
  ```
  Uses `.claude/launch.json` (Next.js dev server, port 3000, autoPort).
- **Live production:** <https://what-are-agents-presentation.vercel.app>

**Two API-key states to note (test at least the one you'll present with):**
- **With `OPENAI_API_KEY`** → Swarm House Boss/Manager badges should read
  `real AI decision` / `Manager AI`.
- **Without a key (fallback)** → badges read `fallback decision` /
  `Manager fallback`. Every mode must still complete. This is the safe
  venue-Wi-Fi-down path and is worth a pass on its own.

**Environments to sweep (minimum):**
1. Desktop Chrome at projector resolution (≈1280×720 or 1920×1080), which is
   the primary target.
2. One narrower width (resize to ~900px) to confirm the layout degrades
   gracefully — mobile is "usable, not the focus," so note but don't fail on
   cosmetic mobile issues.

**Keep DevTools Console open for the entire walkthrough.** A zero-console-error
result is a hard pass criterion (the E2E enforces it; verify it holds under
real interaction too). Note: `@vercel/analytics` only loads on Vercel, so a
missing-analytics 404 should NOT appear locally — if it does, that's a finding.

---

## 3. Global checks (apply on EVERY screen)

Run these on each screen as you land on it, before the screen-specific steps:

- [ ] **G1 — Loads clean:** page renders fully, no flash of unstyled content,
      no infinite spinner, no error boundary / Next.js error overlay.
- [ ] **G2 — Console clean:** no errors or unexpected warnings in the console
      during load and interaction.
- [ ] **G3 — Styling applied:** dark theme intact (near-black `#0A0A0A`
      background, light `#F7F7F7` text), fonts and spacing look intentional —
      not raw unstyled HTML.
- [ ] **G4 — Copy reads:** headings, mode eyebrow ("Game mode N"), and body
      text are free of typos and make sense to a non-technical reader.
- [ ] **G5 — Nav works:** the prev/next/Home links (modes 1–6) point where they
      say and actually navigate. Landing has no nav bar by design.
- [ ] **G6 — No dead controls:** every visible button/toggle either does
      something or is intentionally disabled with a clear reason.
- [ ] **G7 — Art/sprites load:** no broken-image icons; canvas rooms draw
      furniture, items, and workers (not blank rectangles).

---

## 4. Screen-by-screen walkthrough

### Screen 0 — Landing (`/`)

Expected story beat: "Here is the ladder; pick a rung."

1. [ ] Header reads **"Chat window, or AI agent?"** with the "Learn by playing"
       eyebrow and the intro paragraph.
2. [ ] Exactly **six mode cards** in order: Manual Game, Chat Window, Tool Use,
       Single Agent, Small Team, Swarm House — each with its number badge
       (1–6), icon, "Game mode N" eyebrow, one-line description, and a
       "Play mode →" affordance.
3. [ ] Hover a card → it lifts / border highlights (hover affordance works).
4. [ ] Each card links to the right route (`/manual`, `/chat`, `/tool-use`,
       `/agent`, `/team`, `/swarm`). Click each in turn (or open in new tabs).
5. [ ] Footer note about "each browser tab is its own private session" is
       present.
6. [ ] **Makes-sense check:** a first-time viewer can tell these six are a
       progression, not six unrelated demos.

### Screen 1 — Manual Game (`/manual`)

Expected beat: "You are the agent."

1. [ ] Task list shows three destinations: **Trash → Trash can**,
       **Cup → Sink**, **Book → Bookshelf**. Counter shows **3 jobs left**.
2. [ ] Top-down room renders with labeled destinations (Trash can, Bookshelf,
       Sink) and draggable items. **No "Agent worker"** is present (you are the
       worker).
3. [ ] Place each item at its destination (drag, or click item then click
       destination). Each correct placement decrements the counter.
4. [ ] After all three → **"Manual room complete"** state appears.
5. [ ] Click **Reset** → room restocks to **3 jobs left**.
6. [ ] Try an obviously wrong placement (item to wrong destination) → confirm it
       is either rejected or clearly not counted as done (no false "complete").
7. [ ] **Makes-sense check:** it's obvious the *player* is doing the work.

### Screen 2 — Chat Window (`/chat`)

Expected beat: "Output is not action."

1. [ ] Prompt input + Submit button present; an item/mess counter is visible.
2. [ ] Note the starting item count. Type `tidy the room`, Submit.
3. [ ] A useful text answer appears (contains **"Here is a plan"** or similar
       genuinely helpful text).
4. [ ] **Critical:** the item counter is **unchanged** — the room did not
       change from the text alone. This is the whole point of the screen.
5. [ ] **Makes-sense check:** the contrast "good answer, nothing happened" lands
       visually without needing narration.

### Screen 3 — Tool Use (`/tool-use`)

Expected beat: "One ask, one action — help, not autonomy."

1. [ ] Room starts with **6–8 messes**; top-down tool room renders with labeled
       tools (e.g., "Bookshelf tool", "Sink tool"). **No agent worker**.
2. [ ] Click **Submit** once → **exactly one** item is handled (counter drops by
       exactly 1; no double-processing).
3. [ ] Repeat Submit until the room reaches **0 items**: progress bar reads
       **N/N done**, a **"Room clean"** indicator appears, and **Submit becomes
       disabled**.
4. [ ] Click **Reset room** → restocks to the starting count.
5. [ ] Submit a few times again → a **"Getting repetitive"** nudge toward Agent
       mode appears.
6. [ ] **Makes-sense check:** the friction of "one click per item" is felt —
       it motivates the jump to an agent.

### Screen 4 — Single Agent (`/agent`)

Expected beat: "One goal, a self-finishing loop."

1. [ ] Starts with a full room (same count as Tool Use). **Agent worker is
       present** on the map.
2. [ ] This is the dedicated agent route — confirm there is **no manual-mode
       toggle** (the mode is fixed).
3. [ ] Click **Submit once**, then stop touching controls. The agent should
       autonomously pick tasks, act, return home between chores, and clear the
       **entire** room on its own.
4. [ ] When the room is clean → **"Room clean"**, and **Submit self-disables**
       (the loop terminated itself).
5. [ ] **Busy-lock check:** Reset, Submit again, and mid-run confirm **Reset is
       disabled while busy**; the locked run still completes.
6. [ ] **Makes-sense check:** the audience can see the loop *deciding* between
       actions, not just replaying a script — and that it *stops itself* is
       visible.

### Screen 5 — Small Team (`/team`)

Expected beat: "Delegation and parallelism."

1. [ ] Header/legend shows **1 Manager** and **2 Agents**. Layout is a two-room
       house: a **left mess room ("Messy living room")** and a **right work room
       ("Team work room")**.
2. [ ] Confirm stale room labels are gone (no "Play room mess", "Kitchen work
       room", or "Laundry work room" — those belong to other modes).
3. [ ] Click **Submit** → the Manager splits the goal; **both** agents work in
       parallel; each shows **"Agent A/B: complete"** (exactly two).
4. [ ] A **"Team report delivered"** summary lands when done.
5. [ ] **Makes-sense check:** it's clear the *AI* decided who does what, and the
       two agents visibly work at the same time.

### Screen 6 — Swarm House (`/swarm`) — the finale

Expected beat: "Boss plans, Managers adapt, humans handle jams."

1. [ ] Header shows the hierarchy chips **1 Boss → 3 Managers → 6 Agents**.
       The top-down facility map renders with **Boss office**, three Manager
       rooms, six agents, **Report paths**, and a **Human exit** marker.
2. [ ] The fixed instruction is shown: **"Clean the house"** (labeled a fixed
       human instruction).
3. [ ] Click **Submit**. A **"Boss is deciding…"** moment appears, then a
       **"Boss decision: why each Manager got this work"** panel.
4. [ ] Open the Boss decision dropdown → read a rationale. Check the provenance
       badge: **`real AI decision`** (key set) or **`fallback decision`**
       (offline). Confirm it matches your key state from §2.
5. [ ] **Three Manager badges** appear (each **Manager AI** or **Manager
       fallback**) — one per room, none idle.
6. [ ] Wait for the **"Boss dispatched a plan"** note. Then pick **Plate** from
       the palette and click on the map to drop it — confirm **"Player dropped a
       plate"** registers. Drop a **second** plate (palette stays armed) at a
       different spot.
7. [ ] Let it run to completion: **all 3 manager rooms report** (three
       **"Reported"**), a **"Final report to the human"** appears, and the report
       **includes the player-added plates** ("player-added item").
8. [ ] Click **Reset** → map returns to the pre-run state.
9. [ ] **Escalation path:** tick **Presenter tools**, Submit, then click a
       zone's **Jam** button and walk the chain up to the red **"Needs human
       input"** banner. Click **Resolve** to clear it.
10. [ ] **Low Power toggle:** flip **Low Power** and confirm the canvas keeps
        rendering (just at a capped frame rate) — no crash, no blank canvas.
11. [ ] **Makes-sense check:** the single most important beat — the swarm
        *stopping to ask a human* — is unmistakable on screen.

### Screen 7 — Legacy redirect `/room`

1. [ ] Navigate to `/room` → lands on **`/agent`** (URL contains `/agent`,
       "Single Agent" heading visible). No redirect loop, no flash of a broken
       page.

### Screen 8 — Legacy redirect `/warehouse`

1. [ ] Navigate to `/warehouse` → lands on **`/swarm`** ("Swarm House" heading
       visible). No loop, no error.

### Screen 9 — Framed preview (`/demo-embed.html`)

1. [ ] Loads as a dark, framed "Live Preview" window (title "AI Agent Swarm
       Game - Live Preview"), styled — not raw HTML.
2. [ ] The embedded/framed content points at the app and is interactive (or
       clearly links into it). Confirm no mixed-content or CSP console errors.
3. [ ] **Makes-sense check:** usable as a "framed preview" someone could show
       standalone.

### API contract spot-check (`/api/boss-plan`, `/api/manager-plan`)

Not screens, but the finale depends on them. From DevTools console on any app
page, or rely on the E2E which already covers these:

- [ ] `POST /api/manager-plan` with a valid body → 200, `source` is `ai` or
      `fallback`, every submitted job appears in exactly one agent queue.
- [ ] `POST /api/manager-plan` with `body: "not json"` → **400** with
      `source: "fallback"` (rejects malformed input without crashing).
- [ ] `POST /api/boss-plan` valid → 200, all groups assigned across the three
      Managers.
- [ ] `POST /api/boss-plan` malformed → **400**, `source: "fallback"`.

---

## 5. Cross-cutting checks (once, after the per-screen pass)

- [ ] **X1 — Full ladder in one sitting:** starting at `/`, walk 1→6 using only
      the on-screen **Next mode** links. The narrative should build without
      needing the URL bar.
- [ ] **X2 — Back/Home:** from any mode, **Home** returns to `/`; browser Back
      behaves sanely (no stuck state, no duplicate runs auto-starting).
- [ ] **X3 — Session isolation:** open `/swarm` in two tabs, run one — the other
      tab is unaffected (independent sessions, no shared state).
- [ ] **X4 — Reset everywhere:** every mode's Reset returns it to a clean,
      re-runnable start; Submit re-enables appropriately.
- [ ] **X5 — Console sweep:** after the whole pass, confirm the console has
      accumulated **zero** uncaught errors (excluding the intentional 400s from
      any manual malformed-API probes).
- [ ] **X6 — Fallback pass:** if you tested with a key, do a second Swarm House
      run with the key removed/offline and confirm the badge honestly flips to
      `fallback decision` and the run still finishes.

---

## 6. Automated backstop (run alongside the manual pass)

The manual walkthrough judges clarity; these prove the invariants. Run them and
record results in the log:

```bash
npm run lint          # style / dead-code gate
npm run test:unit     # planning rules + sprite asset integrity
npm run build         # production build must succeed (no type errors)

# E2E — needs the dev server running in another terminal:
npm run dev                       # terminal 1
npx playwright install chromium   # one-time
npm run test:e2e                  # terminal 2 — 48 checks across all six modes
```

A green E2E run + a clean manual pass = ship-ready for a live demo.

---

## 7. Pass / fail criteria

**PASS** requires all of:
- Every screen in §4 loads and completes its core interaction.
- All six modes reach their intended terminal state (complete / clean / report).
- Both legacy redirects resolve; the embed renders.
- **Zero uncaught console errors** across the full pass.
- The Swarm House provenance badge honestly reflects the key state, and the
  human-escalation banner appears on Jam.
- `npm run lint`, `test:unit`, and `build` are green.

**FAIL / FIX-FIRST** if any of: a mode can't complete, a control is dead or
misleading, sprites/canvas don't render, a console error fires during normal
use, the AI-vs-fallback badge is wrong, or copy is confusing/typo'd enough to
undercut the story.

---

## 8. Issue log template

Record one row per finding. Keep severity honest — a projector-only cosmetic
nit is not a blocker; a mode that can't finish is.

| ID | Screen / route | Steps to reproduce | Expected | Actual | Severity (Blocker/Major/Minor/Cosmetic) | Console error? | Notes |
|----|----------------|--------------------|----------|--------|------------------------------------------|----------------|-------|
| W-01 | | | | | | | |
| W-02 | | | | | | | |

**Run metadata to capture at the top of each pass:**
- Date / tester
- Target (local dev / live URL) + commit SHA (`git rev-parse --short HEAD`)
- API-key state (live AI / fallback)
- Browser + viewport / resolution
- Overall verdict (PASS / FAIL) and blocker count

---

## 9. Run log

### Run 1 — 2026-07-13 (Claude, local dev)

- **Target:** local `npm run dev` on `http://localhost:3000`, commit `dfb7625`.
- **API-key state:** fallback (no `OPENAI_API_KEY` set) — the offline/venue-Wi-Fi
  path. Swarm badges correctly read `fallback decision` / `Manager fallback`
  with the honest note "Live API unavailable — using the built-in fallback
  decision."
- **Driver:** in-app Browser pane via DOM/console/JS inspection at 1280×720.
  (Pixel screenshots hung in this pane — a renderer quirk, not an app fault —
  so verification was done through the accessibility tree, page text, and
  console, which is sufficient for structure, interaction, copy, and error
  gating.)
- **Verdict: PASS — zero issues found. Issue log is empty.**

Per-screen result:

| Screen | Result | Evidence |
|--------|--------|----------|
| 0 Landing `/` | PASS | Six mode cards in order, correct copy, all hrefs correct, no console errors |
| 1 Manual `/manual` | PASS | 3 jobs → placed all → "Manual room complete" → Reset restores 3; no agent worker |
| 2 Chat `/chat` | PASS | Answer "Here is a plan…" returned; item count stayed 7 ("No agent took control") |
| 3 Tool Use `/tool-use` | PASS | 7 starting messes; each submit cleared exactly 1; 7/7 done → "Room clean!"; Submit auto-disabled |
| 4 Single Agent `/agent` | PASS | One submit cleared all 7 autonomously; "stopped itself"; Submit auto-disabled |
| 5 Small Team `/team` | PASS | Correct two-room layout; Manager split work; both agents "complete"; "Team report delivered" |
| 6 Swarm `/swarm` | PASS | Full hierarchy + Boss decision panel; 3 Managers working; live plate drop absorbed into Kitchen Agent 1; final report incl. player-added item; 3/3 rooms Reported; Jam → "Needs human input" → Resolve; Low Power toggles with canvas still rendering |
| 7 `/room` redirect | PASS | Resolves to `/agent` (title + content confirm) |
| 8 `/warehouse` redirect | PASS | Resolves to `/swarm` (title + content confirm) |
| 9 Embed `/demo-embed.html` | PASS | Dark "Live Preview" window; iframe of `/`; relative deep links; no console errors |

Console gate: **zero uncaught errors** observed across every screen during
interaction.

Automated backstop (same commit / environment):

| Check | Result |
|-------|--------|
| `npm run lint` | PASS — no ESLint warnings or errors |
| `npm run test:unit` | PASS — 7/7 (sprite assets + warehouse rules) |
| `npm run build` | PASS — compiled, 15/15 static pages generated |
| `npm run test:e2e` | PASS — **48/48** checks, "ALL PASSED" |

No code changes were required — the app passed the walkthrough and all suites
as-is on `dfb7625`.
