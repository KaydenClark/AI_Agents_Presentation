# AI_Agents_Presentation - Blueprint

**Last reviewed:** 2026-06-22
**Status:** active — v2.1 six-mode ladder release
**Current release:** v2.1.0 (six-mode ladder + canvas + Boss/Manager authority + live item spawning)
**Source root:** `/Users/kayden/GPT_OS/Projects/AI_Agents_Presentation`

This is the stable reference for what the project is. Keep it factual, source-backed, and short.

## What This Project Is

AI_Agents_Presentation is a Next.js **game** that teaches the difference between doing work yourself, typing into a chat window, giving that chat window tools, and delegating to agents. You give one instruction, then watch when an agent, team, or swarm actually takes the controls. It uses six top-down game modes: manual game, chat window, tool use, single agent, small team, and swarm house.

The canvas scenes render their sprite layer on an **HTML5 `<canvas>` engine** (`components/sprites/SpriteEngine.ts`) that draws rasterized PNG sprites in a `requestAnimationFrame` loop, with movement decoupled from React (no per-frame re-renders). The PNGs are produced from the original SVG definitions by an offline pipeline (`scripts/rasterize-sprites.mjs` → `public/assets/sprites/`). CSS room shells and all DOM panels/overlays (forms, logs, legends, aria-live regions) sit over the canvas, preserving accessibility. The front end stays a relatable household-cleaning story with plain business-friendly language instead of implementation jargon.

Core promise:

> A player gives one plain instruction and watches a real AI plan the work and drive the workers to finish it on their own — with predictable fallbacks so a live audience never sees a failure.

Primary users:

- Player / presenter driving it live.
- Coworkers following along (or playing) on their own laptops.

## Non-Goals

This project is not trying to:

- store shared session state or use a database;
- provide multiplayer sync between browser tabs;
- require login by default;
- support an `ACCESS_CODE` passcode gate in v2.1.

Note on AI calls: the old v1.2 rule was "at most one real AI call per swarm run" (Boss planning only). v2.1 deliberately relaxes this — the agreed model is **"AI plans, engine executes"**: the Boss makes a real call to allocate work, and each Manager makes a real/fallback call to split work across its two agents (≈1 Boss + 3 Manager calls per run). Every call keeps a deterministic fallback. No other paid services, database, auth, or multiplayer.

## Current Product Shape

When the project is working, a user can:

- open the landing page and choose `/manual`, `/chat`, `/tool-use`, `/agent`, `/team`, or `/swarm`;
- use `/manual` as a drag-and-drop game where the player is the agent and places each item where it belongs;
- use `/chat` to get a helpful text answer while the room state stays unchanged;
- use `/tool-use` to see the chat window gain external tools while still producing one tool action per Submit;
- use `/agent` to give one goal to a self-terminating agent loop, rendered on the canvas engine;
- use `/team` to watch one Manager split work across two Agents who move items from one messy left room into one right-side work room;
- use `/swarm` to watch a local mess scenario render, a Boss **really allocate** the work across Managers (the allocation drives which crew does what, and guarantees every Manager contributes), Managers split queues across Agents, Agents work through queues, jams surfaced, and a local final report returned;
- while `/swarm` is running, pick a supported palette item once, click anywhere in the house repeatedly, and drop new live work without resetting the run;
- run without an OpenAI key by using deterministic server-side fallback planning.

The most important quality bar is:

- reliability for a live presentation/play session.

## v2.1 Release Scope

v2.1 is the first release where the teaching arc is fully split into separate
playable mini games instead of being compressed into two levels.

Included:

- `/manual`, `/chat`, `/tool-use`, `/agent`, `/team`, and `/swarm` as first-class routes.
- Legacy redirects from `/room` to `/agent` and `/warehouse` to `/swarm`.
- `ManualDragGame` for the player-as-agent drag mode.
- `ChatWindowScene` showing prompt/output without state mutation.
- `RoomScene` reusable in tool-use or fixed agent mode.
- `SmallTeamScene` showing one Manager splitting work across two Agents in a two-room house.
- `WarehouseScene` as the full Boss/Manager/Agent swarm with live item drops.
- `tests/e2e.mjs` updated to drive all six game modes and the swarm escalation path.
- `README.md`, `ROADMAP.md`, `RUNBOOK.md`, and `AGENTS.md` updated to make the
  six-mode ladder the current source of truth.

Not included:

- New production deployments still require explicit user approval. The current beta is live on Vercel from `codex/v2.1-five-scene-ladder`.
- New persistence, auth, database, multiplayer, or extra paid services.

## Visual North Star

The target look is **top-down colony-sim / "RimWorld-level" clarity, with original styling**. It is not a clone: do not copy RimWorld, Focus Friend, or any branded character designs or assets. Scenes are viewed top-down (orthographic), with tiled floors, walls, and furniture seen from above, rendered as reusable sprite/tile primitives.

The visual language should feel like a readable operations map, not a decorative landing page:

- fixed 16:9 scene surfaces for laptop and projector use;
- thick, readable outer walls with at least one doorway or hallway connection;
- warm neutral floor tiles with subtle grid lines;
- compact geometric props instead of emoji-first objects;
- high-contrast labels placed outside props when possible, never overlapping motion paths;
- visible worker movement between named stations, with enough pause time for a live audience to follow the loop.

## Game Mode Ladder

The six routes form one teaching ladder:

| Route | Lesson | Runtime |
|---|---|---|
| `/manual` | Doing the work yourself means dragging items to the right destinations. | `ManualDragGame` |
| `/chat` | Chat output is useful but does not change external state. | `ChatWindowScene` |
| `/tool-use` | Tool access lets chat affect the room, but still one action at a time. | `RoomScene` locked to manual mode with tool-use labels |
| `/agent` | A single agent keeps acting until the goal is done, then stops. | `RoomScene` locked to agent mode |
| `/team` | A Manager can split one goal across two Agents. | `SmallTeamScene` |
| `/swarm` | A Boss/Manager/Agent hierarchy can plan, execute, rebalance, report, and absorb live new work. | `WarehouseScene` |

Legacy `/room` and `/warehouse` redirect to `/agent` and `/swarm`.

## Room Metaphor

The tool-use and single-agent modes (`/tool-use` and `/agent`) are small top-down rooms that an agent tidies:

- a worker stands on a central rug (home base) and returns there between items;
- clutter is scattered across the floor (socks, cups, cans, books, toys, trash);
- furniture around the room edge is where each kind of mess belongs: trash can, kitchen sink, recycling, bookshelf, laundry hamper, toy box;
- the worker picks up each item, carries it to the right spot, and comes back.

Room layout contract:

- central rug as the worker's home base;
- destination props around the perimeter, each labelled with its name and the item it accepts;
- a doorway or open wall segment so the room reads as a real top-down space;
- household clutter scattered on the floor, each item bound for one destination;
- `/tool-use` puts one item away per submit; `/agent` clears the whole room from one submit and stops.

Tool-use metaphor rule: `/tool-use` can label destinations as plain tools because the mode is specifically about chat gaining tool access. Use plain tool names in audience-facing labels. `/agent` stays a household-cleaning story so autonomy remains visually obvious.

| Element | Cleaning metaphor |
|---|---|
| Floor items | Household clutter: socks, cups, cans, books, toys, trash |
| Destinations | Trash can, kitchen sink, recycling, bookshelf, laundry hamper, toy box |
| Worker action | Pick up item -> carry to its spot -> return to the rug |
| Completion | "Room clean!" / "N items left" |

## Warehouse Metaphor

The swarm scene (`/swarm`) is a top-down house being tidied by a team, laid out around a vertical central hallway:

- a Boss office at the top assigns a locally generated mess scenario across the three worker rooms;
- four rooms: one large **Living room** on the left is the mess source — several endless piles of clothes, dishes, books, and trash (no pile is a single object); stacked on the right are the three rooms where work actually gets done — **Kitchen**, **Laundry room**, and **Office** — each a walled box with a doorway to the hallway;
- the org chart is a strict **1 Boss · 3 Managers · 6 Agents** (10 total). Each of the three worker rooms has one Manager running two Agents in parallel; Managers split the queue so agents don't double-handle an item;
- chores are multi-step and cross rooms: the Kitchen crew carries dishes (plates, forks, cups) from the living room, washes them at the sink, and puts them in the cupboard; the Laundry crew carries clothes (shirts, socks, towels) to the washer then folds them into the matching basket by type (a tangled load escalates to the Manager, who resolves it); the Office crew shelves books sorted by color; trash that can vs. cannot be recycled appears in every room and is sorted and carried out to the "outside" recycle/landfill bins at the bottom;
- report paths carry the flow up (Agent -> Manager -> Boss -> Human), with a human-exit marker that lights up on escalation;
- a supported item palette sits above the room. The player can arm one item, click anywhere in the house repeatedly, see each item fall to the floor, and watch the responsible Manager add it to a live Agent queue.

The Boss -> rooms -> agents hierarchy and the human-escalation exit are unchanged. The Boss's OpenAI planning call is now **authoritative** (it decides which crew handles each group; see Core Logic). Agent movement follows per-item waypoint routes, drawn on the canvas engine. The route/scene is branded "Swarm House". Older DOM-era scene templates have been removed; the maintained implementation is the canvas-backed six-mode ladder.

Warehouse layout contract:

- one boss hub, three manager rooms, and three visible agent work zones;
- clear paths between zones and the boss hub for dispatch and report flow;
- each zone should show distinct work types so the Boss assignment visibly matters;
- agent progress, manager review, report delivery, and escalation should be readable on the map before reading the side panels;
- escalation markers should trace Agent -> Manager -> Boss -> Human without requiring a new AI call.

## Architecture

| Layer | Choice | Source / Notes |
|---|---|---|
| Runtime | Node.js via Next.js 14 App Router | `package.json`, `app/` |
| Frontend | React 18 + TypeScript + Tailwind CSS | `app/page.tsx`, six game-mode routes under `app/`, `components/` |
| Rendering | HTML5 `<canvas>` sprite engine + rAF loop | `components/sprites/SpriteEngine.ts`, `SpriteRenderer.tsx`, `spriteManifest.ts` |
| Sprite assets | Rasterized PNGs from SVG, generated offline | `scripts/rasterize-sprites.mjs` (`sharp`) → `public/assets/sprites/*` + `sprites.manifest.json` |
| Backend | Next.js serverless route handlers | `app/api/boss-plan/route.ts`, `app/api/manager-plan/route.ts` |
| Database/storage | None | README says each browser tab is isolated and no database is used. |
| Auth | None by default | Optional shared `ACCESS_CODE` is out of scope for v2.1. |
| AI provider | OpenAI SDK, server-side only | `openai`; API key read from `process.env.OPENAI_API_KEY` in API routes. |
| Testing | Unit tests + Playwright smoke test + Next lint/build | `tests/warehouseRules.test.mts`, `tests/e2e.mjs`, `package.json` scripts |
| Deployment/runtime | Vercel target | README deployment section |

Architecture guardrails:

- The live demo must continue with fallbacks if OpenAI fails, times out, or returns malformed output.
- `OPENAI_API_KEY` must remain server-side and must never be exposed to client code.
- Model = **"AI plans, engine executes."** AI makes the allocation decisions (Boss + Managers); deterministic client-side animation carries them out. Keep AI calls bounded (~1 Boss + 3 Managers per run) and every one fallback-backed. The final report is local.
- Movement is decoupled from React: scenes mutate the `SpriteEngine` imperatively; per-frame position never triggers a React render. React state is for discrete events + side panels only.
- Low Power mode caps the canvas frame loop to about 30 fps and lowers DPR pressure for older or overloaded laptops.

Rendering / asset guardrails:

- The sprite layer (furniture, clutter piles, actors, report paths, drop effects) renders on the `SpriteEngine` canvas; the CSS room shells and DOM panels/overlays sit over it (this is where accessibility lives).
- PNG sprites are generated, not hand-edited: change the SVG definitions in `components/RoomSprites.tsx` (the source of truth the rasterizer mirrors) and re-run `npm run sprites`. Canvas PNGs cannot be runtime-tinted — only books have pre-baked color variants (see the rasterizer + `spriteManifest.itemSprite`).
- Keep accessible labels and stable test selectors; any audience-facing wording change must be paired with a `tests/e2e.mjs` update in the same change.
- No new paid services, database, auth, or multiplayer; server-side-key rule stays.
- Do not copy RimWorld, Focus Friend, or branded character designs or assets.

## Directory Map

```text
AI_Agents_Presentation/
├── app/                 <- Next.js routes, six game-mode pages, global CSS, and server API routes
├── components/          <- Scenes, sprite source (RoomSprites.tsx), report/escalation UI
│   └── sprites/         <- Canvas engine: SpriteEngine.ts, SpriteRenderer.tsx, spriteManifest.ts
├── lib/                 <- Shared warehouse rules for palette routing, fallback Manager plans, rebalance helpers
├── scripts/             <- rasterize-sprites.mjs (SVG -> PNG pipeline, `npm run sprites`)
├── public/assets/sprites/ <- generated PNG sprites + sprites.manifest.json (committed)
├── tests/               <- Playwright browser smoke test
├── .env.example         <- documented variable names only
├── package.json         <- scripts and dependencies
├── AGENTS.md            <- agent behavior and edit/read scope
├── BLUEPRINT.md         <- stable project definition
├── ROADMAP.md           <- active work plan and proof log
└── RUNBOOK.md           <- setup, operation, verification, recovery
```

## Main Contracts

### Routes / Screens

| Route or screen | Purpose | Status | Source |
|---|---|---|---|
| `/` | Landing page linking to all six game modes | working | `app/page.tsx`, `tests/e2e.mjs` |
| `/manual` | Player-as-agent drag placement game | working | `app/manual/page.tsx`, `components/ManualDragGame.tsx`, `tests/e2e.mjs` |
| `/chat` | Prompt/output-only scene; room state does not change | working, on canvas engine | `app/chat/page.tsx`, `components/ChatWindowScene.tsx`, `components/sprites/*`, `tests/e2e.mjs` |
| `/tool-use` | One-submit, one-tool-action room | working, on canvas engine | `app/tool-use/page.tsx`, `components/RoomScene.tsx`, `components/sprites/*`, `tests/e2e.mjs` |
| `/agent` | Single-agent self-terminating loop, canvas-rendered | working, on canvas engine | `app/agent/page.tsx`, `components/RoomScene.tsx`, `components/sprites/*`, `tests/e2e.mjs` |
| `/team` | One Manager + two Agents split work between one mess room and one work room | working, on canvas engine | `app/team/page.tsx`, `components/SmallTeamScene.tsx`, `components/sprites/*`, `tests/e2e.mjs` |
| `/swarm` | Boss/Managers/Agents swarm, canvas-rendered; Boss/Manager allocation plus live item spawning | working, on canvas engine | `app/swarm/page.tsx`, `components/WarehouseScene.tsx`, `components/sprites/*`, `tests/e2e.mjs` |
| `/room` | Legacy redirect | working | `app/room/page.tsx` |
| `/warehouse` | Legacy redirect | working | `app/warehouse/page.tsx` |

### API Endpoints

| Method | Path | Auth | Purpose | Status | Source |
|---|---|---|---|---|---|
| `POST` | `/api/boss-plan` | no user auth; optional server-side OpenAI key | **Authoritatively** assign every mess group to a Manager (drives `buildZones`), guaranteeing every Manager gets work; also returns priority, rationale, and escalation notes. Tolerant JSON parse + deterministic fallback. | working, verified in browser | `app/api/boss-plan/route.ts` |
| `POST` | `/api/manager-plan` | no user auth; optional server-side OpenAI key | Per-Manager: split work across that Manager's two agents; fallback-backed with visible Manager AI/fallback badges and local self-correction when one agent goes idle. | working, verified in browser | `app/api/manager-plan/route.ts` |

### Commands

| Command | Purpose | Required for done? |
|---|---|---|
| `npm install` | Install dependencies from `package-lock.json`. | setup |
| `npm run dev` | Serve locally on port 3000. | local operation |
| `npm run lint` | Run Next lint. | yes for code changes when available |
| `npm run test:unit` | Run Node unit tests for shared warehouse rules. | yes for warehouse logic changes |
| `npm run build` | Build production app. | yes for release changes |
| `npm run test:e2e` | Run Playwright smoke test against `E2E_BASE` or `http://localhost:3000`. | yes for behavior changes |

## Core Logic And Invariants

The core demo logic lives in `components/RoomScene.tsx`, `components/WarehouseScene.tsx`, and the Boss planning API route handler.

Rules:

- `/manual` lets the player drag each item to its correct destination.
- `/chat` can produce a useful answer but must not mutate the room state.
- `/tool-use` puts away exactly one clutter item per submit.
- `/agent` clears the full room from one submit and self-terminates when complete.
- `/team` splits one fixed goal into two Agent queues and reports both complete.
- The visible nouns are household clutter and cleaning destinations, but the manual and agent loop counts must not change.
- Warehouse scenario generation creates bounded local mess JSON before the API call.
- Boss planning's allocation is authoritative: `buildZones(scenario, assignments)` routes each group's jobs to the Manager the Boss assigned it to (default specialty manager only as fallback). Normalization guarantees full coverage (every group assigned once) and that **every Manager gets at least one group** — nobody sits idle.
- Manager planning is authoritative within each room: `/api/manager-plan` returns job ids per Agent; malformed, missing, or failed responses fall back to deterministic balancing.
- Player-added items are repeatable palette spawns. They are accepted while the swarm run is active, may be dropped anywhere inside the house, and are appended to the responsible Manager's live queue without resetting the scenario or clearing the selected palette item.
- Routes are workflow-fixed (dishes still go to the kitchen sink); reassigning a group only changes which crew executes it, which reads as the Boss sending help across rooms.
- Warehouse completion returns a local final report after all zones report complete, including player-added work.
- Jams must have a visible human-escalation exit point.
- API route failures must fall back server-side rather than breaking the audience-facing demo.

Do not duplicate this logic in:

- README-only scripts or ad hoc demo code;
- client code that bypasses the Boss planning API route contract;
- tests that reimplement different business rules than the components.

## Trust, Privacy, And Safety Boundaries

Sensitive data:

- `OPENAI_API_KEY`;
- real `.env.local` values;
- any future presenter-only passcode or venue-specific private URL.

Rules:

- Keep secrets in `.env.local`, Vercel environment variables, or other local/server-side secret stores.
- Do not commit real `.env` files, tokens, API responses containing secrets, traces, or screenshots with private data.
- Do not send hidden personal data to OpenAI; the current route should only send the fixed house-cleaning instruction, generated scenario state, and manager roster.
- Adding authentication, persistent data, or extra real AI calls requires explicit user approval.

## Known Risks

| Risk | Impact | Mitigation / owner |
|---|---|---|
| OpenAI latency or outage during a live presentation | The Boss decision could stall. | Render the local scenario immediately, show thinking states, keep 12-second timeout and deterministic fallback planning. |
| E2E timing drift from animation changes | Browser smoke test can become flaky. | Preserve stable accessible names and update waits only with evidence. |
| Model output format drift | Boss planning could return malformed JSON. | Keep tolerant JSON extraction and full-manager fallback assignments. |
| Next lint command deprecation/drift | Verification command may need update on newer Next versions. | Verify scripts before claiming lint coverage. |
| Current Next.js/PostCSS advisories | `npm audit --omit=dev` reports production vulnerability groups; npm's suggested fix is a breaking Next 16 upgrade. | Triage dependency upgrade separately and rerun lint/build/E2E after any package change. |

## Design Decisions

| Decision | Rationale | Date / Source |
|---|---|---|
| Use no database and keep each browser tab isolated. | Simplifies live presentation and avoids shared-state failures. | README, reviewed 2026-06-19 |
| Use server-side fallback for every AI route. | The audience should never see an API failure during the demo. | API route, reviewed 2026-06-21 |
| Default model is `gpt-5.4-mini`. | Fast live-demo default with lower cost, configurable through `OPENAI_MODEL`. | API routes, `.env.example`, reviewed 2026-06-20 |
| Adopt a top-down SVG redesign with a household-cleaning metaphor. | Matches the intended "RimWorld-level clarity" mental model while preserving behavior. | ROADMAP redesign phase, updated 2026-06-21 |
| Reframe the product from "presentation/demo" to a **game** where the AI drives the agents. | The teaching lands harder when players watch a real AI take the controls, not a scripted demo. | User direction, 2026-06-21 |
| Migrate sprite rendering from DOM/SVG to an HTML5 `<canvas>` engine fed by rasterized PNGs. | DOM nodes don't scale to many dynamic items; canvas + rAF + React-decoupled movement does. | Phase 1, 2026-06-21 |
| Adopt **"AI plans, engine executes"** and make the Boss authoritative over allocation. | The AI genuinely decides who does what (and balances load) while deterministic animation keeps runs legible and cheap. Supersedes the old one-call rule. | Phase 2, 2026-06-21 |
| Split the teaching arc into six game modes for v2.1. | The ladder now separates manual drag work, chat output, tool use, single-agent action, small-team delegation, and swarm behavior. | v2.1, updated 2026-06-22 |

## Health Criteria

The project is healthy when:

- `npm run lint` passes;
- `npm run test:unit` passes;
- `npm run build` passes;
- `npm run test:e2e` passes against a running local server;
- `/manual`, `/chat`, `/agent`, `/team`, and `/swarm` are all playable from the landing page;
- `/manual` demonstrates one input -> one action;
- `/chat` produces output without changing room state;
- `/agent` demonstrates one input -> a self-terminating loop;
- `/team` produces a two-Agent team report;
- `/swarm` produces zone reports, handles jams, live item drops, and returns a final report;
- the app still works without `OPENAI_API_KEY` through fallback Boss planning;
- secrets and local data are not exposed in committed or built output.

Verification commands live in `RUNBOOK.md`. Proof of past runs lives in the `ROADMAP.md` Verification Log.
