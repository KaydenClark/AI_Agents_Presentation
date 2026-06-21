# AI_Agents_Presentation - Blueprint

**Last reviewed:** 2026-06-21  
**Status:** active  
**Source root:** `/Users/kayden/GPT_OS/Projects/AI_Agents_Presentation`

This is the stable reference for what the project is. Keep it factual, source-backed, and short.

## What This Project Is

AI_Agents_Presentation is a Next.js presentation app for teaching non-technical coworkers what an AI agent and an agent swarm are. It uses two top-down scenes: a single room a worker tidies for one agent loop, and a warehouse facility map for a boss/manager/agent hierarchy.

The current presentation layer uses shared top-down scene primitives for tiled floors, walls, stations, clutter items, workers, report paths, and escalation markers. The single-agent scene uses a room-cleaning metaphor (a worker carries each mess to where it belongs). The top-down redesign preserves all behavioral and cost contracts in this blueprint. The front end deliberately avoids developer-tool framing (no MCP / computer-use / terminal language); it stays a relatable household-cleaning story.

Core promise:

> A presenter can explain "AI agent" and "agent swarm" live in a browser using simple visual workflows, predictable fallbacks, and only two optional server-side AI calls.

Primary users:

- Presenter teaching the concept live.
- Coworkers following along on their own laptops.

## Non-Goals

This project is not trying to:

- store shared session state or use a database;
- provide multiplayer sync between browser tabs;
- require login by default;
- make more than two real AI calls per full warehouse run;
- support an `ACCESS_CODE` passcode gate in v1.

## Current Product Shape

When the project is working, a user can:

- open the landing page and choose Single Room or Swarm Warehouse;
- use `/room` to compare manual repeated submits against one self-terminating agent loop;
- use `/warehouse` to watch a Boss decompose one instruction into zone plans, Managers assign Agents, review progress, surface jams, and return a final report;
- run without an OpenAI key by using deterministic server-side fallbacks.

The most important quality bar is:

- reliability for a live presentation.

## Visual North Star

The target look is **top-down colony-sim / "RimWorld-level" clarity, with original styling**. It is not a clone: do not copy RimWorld, Focus Friend, or any branded character designs or assets. Both scenes are viewed top-down (orthographic), with tiled floors, walls, and furniture seen from above, rendered as reusable sprite/tile primitives.

The visual language should feel like a readable operations map, not a decorative landing page:

- fixed 16:9 scene surfaces for laptop and projector use;
- thick, readable outer walls with at least one doorway or hallway connection;
- warm neutral floor tiles with subtle grid lines;
- compact geometric props instead of emoji-first objects;
- high-contrast labels placed outside props when possible, never overlapping motion paths;
- visible worker movement between named stations, with enough pause time for a live audience to follow the loop.

## Room Metaphor

The single-agent scene (`/room`) is a small top-down room that a worker tidies:

- a worker stands on a central rug (home base) and returns there between items;
- clutter is scattered across the floor (socks, cups, cans, books, toys, trash);
- furniture around the room edge is where each kind of mess belongs: trash can, kitchen sink, recycling, bookshelf, laundry hamper, toy box;
- the worker picks up each item, carries it to the right spot, and comes back.

Room layout contract:

- central rug as the worker's home base;
- destination props around the perimeter, each labelled with its name and the item it accepts;
- a doorway or open wall segment so the room reads as a real top-down space;
- household clutter scattered on the floor, each item bound for one destination;
- Manual mode puts one item away per submit; Agent mode clears the whole room from one submit and stops.

Front-end metaphor rule: this scene stays a household-cleaning story. Do not reintroduce developer-tool framing (MCP, computer use, browser, terminal, files-as-tools); that direction was tried and rejected.

| Element | Cleaning metaphor |
|---|---|
| Floor items | Household clutter: socks, cups, cans, books, toys, trash |
| Destinations | Trash can, kitchen sink, recycling, bookshelf, laundry hamper, toy box |
| Worker action | Pick up item -> carry to its spot -> return to the rug |
| Completion | "Room clean!" / "N items left" |

## Warehouse Metaphor

The swarm scene (`/warehouse`) is a top-down house being tidied by a team, laid out around a vertical central hallway:

- a Boss office at the top splits the job across the three worker rooms;
- four rooms: one large **Living room** on the left is the mess source — several endless piles of clothes, dishes, books, and trash (no pile is a single object); stacked on the right are the three rooms where work actually gets done — **Kitchen**, **Laundry room**, and **Office** — each a walled box with a doorway to the hallway;
- the org chart is a strict **1 Boss · 3 Managers · 6 Agents** (10 total). Each of the three worker rooms has one Manager running two Agents in parallel; agents within a room split the queue so they don't double-handle an item;
- chores are multi-step and cross rooms: the Kitchen crew carries dishes (plates, forks, cups) from the living room, washes them at the sink, and puts them in the cupboard; the Laundry crew carries clothes (shirts, socks, towels) to the washer then folds them into the matching basket by type (a tangled load escalates to the Manager, who resolves it); the Office crew shelves books sorted by color; trash that can vs. cannot be recycled appears in every room and is sorted and carried out to the "outside" recycle/landfill bins at the bottom;
- report paths carry the flow up (Agent -> Manager -> Boss -> Human), with a human-exit marker that lights up on escalation.

The Boss -> rooms -> agents hierarchy, the two-call OpenAI boundary, and the human-escalation exit are unchanged. Agent movement follows per-item waypoint routes. The route/scene is still branded "Swarm Warehouse". A previous small-swarm 3-room version is preserved at `components/templates/ManagerFewAgentsHouse.template.tsx`.

Warehouse layout contract:

- one boss hub, three manager rooms, and three visible agent work zones;
- clear paths between zones and the boss hub for dispatch and report flow;
- each zone should show distinct work types so the Boss decomposition visibly matters;
- agent progress, manager review, report delivery, and escalation should be readable on the map before reading the side panels;
- escalation markers should trace Agent -> Manager -> Boss -> Human without requiring a new AI call.

## Architecture

| Layer | Choice | Source / Notes |
|---|---|---|
| Runtime | Node.js via Next.js 14 App Router | `package.json`, `app/` |
| Frontend | React 18 + TypeScript + Tailwind CSS | `app/page.tsx`, `app/room/page.tsx`, `app/warehouse/page.tsx`, `components/` |
| Backend | Next.js serverless route handlers | `app/api/boss-decompose/route.ts`, `app/api/boss-summary/route.ts` |
| Database/storage | None | README says each browser tab is isolated and no database is used. |
| Auth | None by default | Optional shared `ACCESS_CODE` is out of scope for v1. |
| AI provider | OpenAI SDK, server-side only | `openai`; API key read from `process.env.OPENAI_API_KEY` in API routes. |
| Testing | Playwright smoke test + Next lint/build | `tests/e2e.mjs`, `package.json` scripts |
| Deployment/runtime | Vercel target | README deployment section |

Architecture constraints:

- The live demo must continue with fallbacks if OpenAI fails, times out, or returns malformed output.
- `OPENAI_API_KEY` must remain server-side and must never be exposed to client code.
- A full warehouse run should make at most two real AI calls: boss decomposition and boss summary.
- Client-side agent and manager behavior is intentionally scripted for predictable cost and latency.

Visual redesign constraints:

- Render with reusable SVG / `<div>` sprite and tile primitives inside the existing Next.js / React / Tailwind app; do not introduce a game engine unless CSS/React becomes a hard blocker.
- The redesign is visual-layer first: do not rewrite the room/warehouse state machines unless required.
- Keep accessible labels and stable test selectors; any audience-facing wording change must be paired with a `tests/e2e.mjs` update in the same change.
- No new paid services, database, auth, multiplayer, or extra AI calls; the two-calls-per-warehouse-run and server-side-key rules stay unchanged.
- Do not copy RimWorld, Focus Friend, or branded character designs or assets.
- Prefer one shared scene-primitive layer for tiles, walls, station labels, workers, tickets, report paths, and escalation markers; only split components when reuse is real.

## Directory Map

```text
AI_Agents_Presentation/
├── app/               <- Next.js routes, pages, global CSS, and server API routes
├── components/        <- Shared scene primitives, character, clutter, report, and escalation components
├── tests/             <- Playwright browser smoke test
├── .env.example       <- documented variable names only
├── package.json       <- scripts and dependencies
├── AGENTS.md          <- agent behavior and edit/read scope
├── BLUEPRINT.md       <- stable project definition
├── ROADMAP.md         <- active work plan and proof log
└── RUNBOOK.md         <- setup, operation, verification, recovery
```

## Main Contracts

### Routes / Screens

| Route or screen | Purpose | Status | Source |
|---|---|---|---|
| `/` | Landing page linking to both scenes | working | `app/page.tsx`, `tests/e2e.mjs` |
| `/room` | Single-agent vs manual loop: a worker carries clutter to its destination | working, redesigned | `app/room/page.tsx`, `components/RoomScene.tsx`, `components/RoomSprites.tsx`, `tests/e2e.mjs` |
| `/warehouse` | Boss/Managers/Agents swarm scene with a top-down facility map | working, redesigned | `app/warehouse/page.tsx`, `components/WarehouseScene.tsx`, `components/ScenePrimitives.tsx`, `tests/e2e.mjs` |

### API Endpoints

| Method | Path | Auth | Purpose | Status | Source |
|---|---|---|---|---|---|
| `POST` | `/api/boss-decompose` | no user auth; optional server-side OpenAI key | Convert a warehouse prompt and zone state into one instruction per zone, with fallback. | working by source inspection | `app/api/boss-decompose/route.ts` |
| `POST` | `/api/boss-summary` | no user auth; optional server-side OpenAI key | Produce the final boss report from zone results, with fallback. | working by source inspection | `app/api/boss-summary/route.ts` |

### Commands

| Command | Purpose | Required for done? |
|---|---|---|
| `npm install` | Install dependencies from `package-lock.json`. | setup |
| `npm run dev` | Serve locally on port 3000. | local operation |
| `npm run lint` | Run Next lint. | yes for code changes when available |
| `npm run build` | Build production app. | yes for release changes |
| `npm run test:e2e` | Run Playwright smoke test against `E2E_BASE` or `http://localhost:3000`. | yes for behavior changes |

## Core Logic And Invariants

The core demo logic lives in `components/RoomScene.tsx`, `components/WarehouseScene.tsx`, and the two API route handlers.

Rules:

- Manual mode puts away exactly one clutter item per submit.
- Agent mode clears the full room from one submit and self-terminates when complete.
- The visible nouns are household clutter and cleaning destinations, but the manual and agent loop counts must not change.
- Warehouse decomposition creates one instruction per zone.
- Warehouse completion returns a final report after all zones report complete.
- Jams must have a visible human-escalation exit point.
- API route failures must fall back server-side rather than breaking the audience-facing demo.

Do not duplicate this logic in:

- README-only scripts or ad hoc demo code;
- client code that bypasses the two API route contracts;
- tests that reimplement different business rules than the components.

## Trust, Privacy, And Safety Boundaries

Sensitive data:

- `OPENAI_API_KEY`;
- real `.env.local` values;
- any future presenter-only passcode or venue-specific private URL.

Rules:

- Keep secrets in `.env.local`, Vercel environment variables, or other local/server-side secret stores.
- Do not commit real `.env` files, tokens, API responses containing secrets, traces, or screenshots with private data.
- Do not send hidden personal data to OpenAI; the current routes should only send the explicit warehouse prompt and zone/result state.
- Adding authentication, persistent data, or extra real AI calls requires explicit user approval.

## Known Risks

| Risk | Impact | Mitigation / owner |
|---|---|---|
| OpenAI latency or outage during a live presentation | The centerpiece AI moment could stall. | Keep 12-second timeout and deterministic fallbacks in API routes. |
| E2E timing drift from animation changes | Browser smoke test can become flaky. | Preserve stable accessible names and update waits only with evidence. |
| Model output format drift | Boss decomposition could return malformed JSON. | Keep tolerant JSON extraction and full-zone backfill. |
| Next lint command deprecation/drift | Verification command may need update on newer Next versions. | Verify scripts before claiming lint coverage. |
| Current Next.js/PostCSS advisories | `npm audit --omit=dev` reports production vulnerability groups; npm's suggested fix is a breaking Next 16 upgrade. | Triage dependency upgrade separately and rerun lint/build/E2E after any package change. |

## Design Decisions

| Decision | Rationale | Date / Source |
|---|---|---|
| Use no database and keep each browser tab isolated. | Simplifies live presentation and avoids shared-state failures. | README, reviewed 2026-06-19 |
| Make only two real AI calls per warehouse run. | Keeps cost and latency predictable. | README, API routes, reviewed 2026-06-19 |
| Use server-side fallbacks for both AI routes. | The audience should never see an API failure during the demo. | API routes, reviewed 2026-06-19 |
| Default model is `gpt-5.4-mini`. | Fast live-demo default with lower cost, configurable through `OPENAI_MODEL`. | API routes, `.env.example`, reviewed 2026-06-20 |
| Adopt a top-down SVG redesign with an agent-using-tools metaphor. | Matches the intended "RimWorld-level clarity" mental model and shows an agent using real tools, while preserving behavior and the two-call boundary. | ROADMAP redesign phase, 2026-06-20 |

## Health Criteria

The project is healthy when:

- `npm run lint` passes;
- `npm run build` passes;
- `npm run test:e2e` passes against a running local server;
- `/room` demonstrates manual vs agent behavior correctly;
- `/warehouse` produces zone reports, handles jams, and returns a final report;
- the app still works without `OPENAI_API_KEY` through fallbacks;
- secrets and local data are not exposed in committed or built output.

Verification commands live in `RUNBOOK.md`. Proof of past runs lives in the `ROADMAP.md` Verification Log.
