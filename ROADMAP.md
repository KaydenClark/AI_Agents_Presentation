# AI_Agents_Presentation - Roadmap

**Current phase:** visual redesign verification / live-demo polish  
**Owner:** Kayden / agent

This is the active work plan. Keep it forward-looking and proof-oriented. Do not use it as a dumping ground for old session history.

## Current State

The repo is a cloned Next.js 14 App Router app for an AI agent presentation demo. The README documents local development, Vercel deployment, two server-side OpenAI calls, deterministic fallbacks, and a Playwright smoke test. The project has the standard GPT_OS four-file harness installed, dependencies installed, env copied into `.env.local`, and a passing local lint/build/E2E baseline with the OpenAI route path verified.

The active top-down visual redesign is now implemented locally. `/room` is a top-down room-cleaning scene: a worker on a central rug carries scattered household clutter (socks, cups, cans, books, toys, trash) to labelled destinations (trash can, kitchen sink, recycling, bookshelf, laundry hamper, toy box). The earlier developer-tool framing (MCP / computer use / terminal) was tried and rejected; the front end is back to a plain cleaning metaphor with no MCP language. `/warehouse` adds a top-down facility map with a boss office, manager rooms, work cells, report paths, and escalation markers while preserving the existing detailed zone logs.

Important drift or uncertainty:

- `npm audit --omit=dev` reports production advisories in the current Next.js/PostCSS tree; npm's available fix is `npm audit fix --force`, which would upgrade to Next 16 and is a breaking dependency migration. This is now deferred (see Blocked Or Deferred) unless it blocks the redesign.
- At 1440 x 900, the lower part of the fixed 16:9 scenes may require vertical scrolling because the presenter copy and controls sit above the map. Visual QA found no horizontal overflow, framework overlay, or label collision in the checked viewports, but a tighter presenter layout could improve first-viewport fit.

## Current Goal

Stabilize the shipped top-down scene presentation layer for live use without changing teaching behavior or the two-call OpenAI boundary.

Done when:

- manual vs agent behavior remains preserved (manual = one item per submit; agent = one self-terminating loop);
- the two-call OpenAI boundary and deterministic fallbacks remain preserved;
- live presenter copy stays aligned with the room-cleaning language (no developer-tool / MCP framing on the front end);
- lint, build, E2E, and visual viewport checks pass before handoff or deployment.

## Next Tasks

Do these in order. Make small visual-layer changes first; do not rewrite the state machines unless required.

1. **Presenter first-viewport tightening** - Optional polish: reduce above-map vertical height or add a presenter mode so the full 16:9 map fits more comfortably at 1440 x 900 without scrolling. Proof: visual QA screenshots.
2. **Live presenter preflight** - Run both redesigned scenes immediately before use and reset both before presenting. Proof: `RUNBOOK.md` -> Visual QA.
3. **Dependency advisory triage** - Revisit after the visual redesign has settled. Proof: `npm audit --omit=dev`, selected upgrade path, then lint/build/E2E.

## Blocked Or Deferred

Do not start these until their prerequisite is met.

| Item | Blocked on | Why it matters |
|---|---|---|
| Dependency advisory triage | User approval for dependency migration scope | `npm audit --omit=dev` reports production advisories; npm's fix is a breaking Next 16 upgrade, so handle it as a separate dependency task. |
| Deployment env sync | Decision to deploy | If deploying, set `OPENAI_API_KEY` and `OPENAI_MODEL` in Vercel; verify with a redacted env listing and production route probe. |
| Verify deployed live OpenAI plan/summary path | Valid `OPENAI_API_KEY` in Vercel env | Confirms the two real AI calls work outside fallback mode after deployment. |
| Deploy to Vercel | User approval and Vercel login/project link | Deployment can create public URLs and environment changes. |
| Add passcode gate | Explicit user request | README marks optional `ACCESS_CODE` gate out of scope for v1. |

## Backlog

- Add a short presenter preflight checklist if this is going to be used live soon.
- Capture a known-good fallback-only smoke result after local verification.
- Revisit mobile layout only if the presentation audience needs phone-first use.
- Add screenshots or short GIFs to the README after the visual redesign lands.

## Release Checks

Verification commands live in `RUNBOOK.md` -> Test And Build. Do not duplicate them here.

Project-specific release and checkpoint checks:

- Confirm `.env.local` is not committed and no real OpenAI key appears in source.
- Confirm a fallback-only run completes when `OPENAI_API_KEY` is absent.
- For live presentations, confirm the Boss panel shows `real AI plan` after a rehearsal run with a valid key.
- Reset both scenes before presenting.

## Verification Log

Append a row when a task changes durable project state. Use actual results, not stale claims.

| Date | Task | Proof | Result | Remaining gap |
|---|---|---|---|---|
| 2026-06-19 | Clone repo and install GPT_OS project harness | `git clone https://github.com/KaydenClark/AI_Agents_Presentation.git Projects/AI_Agents_Presentation`; source inspection of `README.md`, `package.json`, API routes, and `tests/e2e.mjs` | pass | Dependency install and baseline verification still pending at time of harness creation. |
| 2026-06-19 | Establish local baseline | `npm install`; `npm run lint`; `npm run build`; `npx playwright install chromium`; `npm run test:e2e`; `npm audit --omit=dev` | functional checks pass; audit reports 1 high and 1 moderate production vulnerability group | Original live Anthropic path unverified; dependency advisories need triage before public deployment. |
| 2026-06-20 | Migrate live AI provider to OpenAI | `npm run lint`; `npm run build`; route probes for `/api/boss-decompose` and `/api/boss-summary`; `npm run test:e2e`; `npm audit --omit=dev` | pass for lint, build, both live OpenAI route probes, and E2E; audit still reports 1 high and 1 moderate production vulnerability group | Deployed Vercel env not updated or verified; dependency advisories still need triage. |
| 2026-06-20 | Document top-down visual redesign (agent-using-tools metaphor) | Edited `ROADMAP.md`, `BLUEPRINT.md`, `AGENTS.md`; no code/dependency/env files changed | redesign direction, done-when criteria, metaphor mapping, and design guardrails documented across the three docs | Implementation pending: visual style system, single-room redesign, warehouse redesign, and test updates not yet built. |
| 2026-06-20 | Align docs with polished mockup direction | Edited `BLUEPRINT.md`, `ROADMAP.md`, `README.md`, `RUNBOOK.md`, `AGENTS.md`; `rg` source-text review | visual spec, implementation order, README transition note, agent guardrails, and visual QA checklist now match the top-down task/tool-room direction more closely | Code still uses old room-cleaning scene language; implementation and E2E updates remain pending. |
| 2026-06-21 | Ship top-down task/tool-room and swarm facility map redesign | Red check: updated `tests/e2e.mjs` failed on missing `tasks left`; green checks: `npm run lint`; `npm run build`; warm `E2E_BASE=http://localhost:3001 npm run test:e2e`; Playwright visual QA for `/room` and `/warehouse` at 1440 x 900 and 1920 x 1080 | pass | At 1440 x 900, fixed 16:9 scenes can require vertical scrolling below the control stack; dependency advisories remain separate. |
| 2026-06-21 | Revert `/room` metaphor from developer-tools back to room-cleaning; purge MCP/computer-use language from the front end; keep top-down style | `npm run lint`; `npm run build`; `E2E_BASE=http://localhost:3007 npm run test:e2e` (23/23 pass); Playwright screenshot of `/room` in agent mode; `grep` confirms no MCP/tool kinds remain in `components/`, `app/`, `tests/` | pass | Warehouse left as-is (already cleaning-themed); presenter first-viewport scrolling note still open. |
| 2026-06-21 | Add RimWorld-style sprite art for `/room` (new `components/RoomSprites.tsx`: beveled stone walls, wood floor, doorway, drawn furniture + clutter sprites, colonist worker, rug) | `npm run lint`; `npm run build`; `E2E_BASE=http://localhost:52743 npm run test:e2e` (23/23 pass); Playwright screenshots of `/room` in manual and agent mode | pass | Warehouse still uses the older `ScenePrimitives` look; worker label can slightly overlap a furniture label when standing on it. Note: do not run `npm run build` while the dev server is live — it corrupts `.next` (`Cannot find module`); stop the server or use a separate build. |
| 2026-06-21 | Reskin `/warehouse` into a top-down house (new `HouseMap` in `WarehouseScene.tsx`): Boss hub + unsorted pile, three walled rooms (Kitchen / Laundry / Living) each with a Manager + 2 agents shuttling household items to furniture, report paths, human-exit marker. Reuses `RoomSprites`. | `npm run lint`; `npx tsc --noEmit`; `E2E_BASE=http://localhost:52743 npm run test:e2e` (23/23 pass); Playwright screenshots of `/warehouse` idle and mid-run | pass | Used `tsc --noEmit` instead of `build` to avoid clobbering the live dev server's `.next`; full prod build not re-run this pass. Hierarchy/2-call boundary/escalation unchanged. |
| 2026-06-21 | Expand `/warehouse` to a full 6-room house: vertical hallway, Boss office on top, Living/Laundry/Bedroom (left) + Kitchen/Office/Bathroom (right), "outside" recycle/landfill bins; multi-step + cross-room routes (wash->put away, laundry->bedroom, books sorted by color, trash->outside); ~10 agents via a generalized waypoint agent loop. Added 7 furniture sprites (washer/stove/bed/toilet/cupboard/dresser/couch). Saved prior 3-room scene as `components/templates/ManagerFewAgentsHouse.template.tsx`. | `npm run lint`; `npx tsc --noEmit`; `E2E_BASE=http://localhost:3000 npm run test:e2e` (23/23 pass, now "all 6 rooms report complete"); Playwright screenshots of idle + mid-run | pass | Full prod `build` not re-run (dev server live — avoids `.next` corruption). Minor: a couple of furniture pieces sit partly behind a manager sprite; agents converging on the outside bins can overlap labels momentarily. |
| 2026-06-21 | Create `interactive-room-cleanup` branch with three main pages: new `/chat` slide, `/room` interactive cleanup progression (drag -> prompted hand -> single-room agent), and existing `/warehouse` AI factory entry; no API key required for the new room flow | `npm run lint`; `npm run build`; `npm run test:e2e`; `npx playwright install chromium` | lint and build pass; E2E blocked because Playwright browser executable was absent and Chromium download returned 403 `Domain forbidden` | Re-run `npx playwright install chromium` and `npm run test:e2e` in an environment allowed to download Playwright browsers. |
