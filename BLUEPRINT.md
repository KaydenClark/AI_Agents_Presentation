# AI_Agents_Presentation - Blueprint

> Generated from LLM Workbench v2.3.

**Last reviewed:** 2026-07-13
**Status:** active - v2.1 product release, v2.3 workbench
**Harness version:** v2.3
**Source root:** `/Users/kayden/GPT_OS/Projects/AI_Agents_Presentation`

## Product Map

AI_Agents_Presentation is a Next.js game for presenters and coworkers learning
the difference between doing work manually, receiving chat output, giving chat
tools, and delegating to agents. Six top-down modes make the progression
playable, while deterministic fallbacks keep a live walkthrough reliable.

Core promise:

> A player gives one plain instruction and watches real AI plan work and drive
> workers to completion, with honest fallback behavior instead of visible API
> failure.

## Goals And Pillars

- **Teach through action:** each route adds one clear capability from manual work
  to a full swarm.
- **Live-demo reliability:** every run remains completable and legible with or
  without a working OpenAI call.
- **AI plans, engine executes:** AI owns bounded allocation decisions;
  deterministic client logic owns animation and completion.
- **Readable operations map:** original top-down visuals, accessible DOM
  controls, and projector-safe labels make state understandable at a glance.

## Cross-Cutting Architecture And Invariants

| Layer / concern | Choice | Invariant / source |
|---|---|---|
| Runtime | Next.js 14 App Router on Node.js | `package.json`, `app/` |
| Frontend | React 18, TypeScript, Tailwind CSS | `app/`, `components/` |
| Rendering | HTML5 canvas sprite engine plus DOM controls | `components/sprites/SpriteEngine.ts`; no per-frame React renders |
| Assets | PNG sprites generated from SVG source | `components/RoomSprites.tsx` -> `npm run sprites` |
| Server APIs | Next.js route handlers using server-side OpenAI | `app/api/boss-plan`, `app/api/manager-plan` |
| Data/storage | Browser-local session state; no database | each tab is isolated |
| Testing | Node tests, Next lint/build, Playwright E2E | `tests/`, `package.json`, `RUNBOOK.md` |
| Deployment | Vercel, approval-gated | public deployment is never implicit |

Rules that span multiple capabilities:

- The ladder stays `/manual`, `/chat`, `/tool-use`, `/agent`, `/team`,
  and `/swarm`; legacy `/room` and `/warehouse` redirect to current modes.
- Manual means player action; chat does not mutate room state; tool use performs
  one action per submit; agent self-terminates; team delegates across two
  Agents; swarm plans, delegates, rebalances, reports, escalates, and accepts
  live new work.
- Boss allocation and each Manager queue split may use one real AI call, bounded
  to about four calls per swarm run. Every call has a deterministic fallback,
  and the final report comes from completed local work.
- `OPENAI_API_KEY` remains server-side. API boundaries validate input and
  malformed/failed model output cannot break the audience-facing run.
- Privacy and safety boundary: each browser tab stays isolated, no participant
  data is persisted, and secrets never enter client code, screenshots, logs, or
  committed output.
- Player-added swarm items remain repeatable without scenario reset or palette
  reselection. Presenter Mode, human escalation, and Low Power frame/DPR caps
  remain available.
- Stable accessible labels and selectors protect E2E reliability. Visual work
  follows `VISUAL_DESIGN.md` and must not copy branded characters or assets.
- Source and tests remain implementation truth. Capability detail belongs in its
  stable spec, not in this compact cross-project map.

## Product Surfaces

| Route | Lesson | Primary implementation |
|---|---|---|
| `/manual` | The player is the agent and drags every item. | `components/ManualDragGame.tsx` |
| `/chat` | Output is useful but does not change state. | `components/ChatWindowScene.tsx` |
| `/tool-use` | Tools enable one external action per submit. | `components/RoomScene.tsx` |
| `/agent` | One goal drives a self-terminating loop. | `components/RoomScene.tsx` |
| `/team` | One Manager splits work across two Agents. | `components/SmallTeamScene.tsx` |
| `/swarm` | Boss, Managers, and Agents execute and adapt. | `components/WarehouseScene.tsx` |

## Non-Goals

- Database, auth, multiplayer, shared browser state, or a passcode gate.
- More real AI calls or paid services beyond the approved bounded plan.
- Mobile-first optimization; laptop and projector are the primary targets.
- A clone of RimWorld, Focus Friend, or another branded visual system.
- Automatic deployment, version bumping, or Git publication.

## Spec Catalog

The generated catalog links every durable capability record, including completed
history. Human-authored product prose stays outside the markers.

<!-- spec-catalog:start -->
| Spec | Description | Status |
|---|---|---|
| [S-001 - Workbench v2.3 Adoption](specs/S-001-workbench-v2-3-adoption/SPEC.md) | Migrate the project from the roadmap-based harness to the v2.3 spec-centered control plane without losing history. | complete |
| [S-002 - v2.1 Beta Readiness](specs/S-002-v2-1-beta-readiness/SPEC.md) | Keep the six-mode beta reliable and hand off remaining presentation, live-AI, and dependency work safely. | active |
| [S-003 - Workbench v2.3 Re-adoption](specs/S-003-workbench-v2-3-re-adoption/SPEC.md) | Re-run v2.3 adoption from a fresh verified upstream source and close the audit gaps without changing the app. | complete |
<!-- spec-catalog:end -->

## Cross-Cutting Health

The project is healthy when:

- `npm run lint`, `npm run test:unit`, and `npm run build` pass;
- `npm run test:e2e` passes against a clean running local server;
- all six modes complete their teaching behavior and the swarm escalation/live
  item paths remain usable;
- a missing or failed OpenAI key produces an honest fallback, not a broken run;
- secrets and private data stay out of committed and generated output;
- `node tools/spec-workbench.mjs doctor` reports no lifecycle, link, or
  projection drift.

Detailed pre-v2.3 product and decision history is preserved in
`archive/BLUEPRINT_V2_1.md`. Historical task/proof rows are preserved in
`archive/ROADMAP_V2_1.md`.
