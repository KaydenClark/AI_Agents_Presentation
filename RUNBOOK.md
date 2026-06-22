# AI_Agents_Presentation - Runbook

**Last reviewed:** 2026-06-22
**Runtime owner:** Kayden / agent  
**Environment:** local development, GitHub release branch/tag, and Vercel production target

This file explains how to operate the project. It should be boring, exact, and executable.

## Prerequisites

Required tools:

- Node.js compatible with Next.js 14.
- npm.
- Chromium browser for Playwright E2E tests.
- Vercel CLI only when deploying.

Required accounts/services:

- OpenAI API key for the live Boss planning call.
- Vercel account for deployment.

Required local files:

- `.env.local` - optional local environment file created from `.env.example`; keep it uncommitted.

Current release:

- v2.1.0 is the six-mode ladder release.
- Local play and GitHub publication are in scope for v2.1.
- Vercel deployment is intentionally separate and should only happen after a
  fresh explicit request.

## Environment Configuration

Create local config from the example:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Purpose | Secret? | Example / Notes |
|---|---|---|---|
| `OPENAI_API_KEY` | Enables live Boss and Manager planning calls. | yes | Optional for fallback-only dry runs. |
| `OPENAI_MODEL` | Overrides the model used by the Boss and Manager planning routes. | no | Defaults to `gpt-5.4-mini`. |

Rules:

- Do not commit real `.env` files, tokens, local databases, logs, screenshots with private data, or API keys.
- Keep `OPENAI_API_KEY` server-side only.
- Prefer degraded fallback behavior over fake client-side AI data when OpenAI is unavailable.

Current local check:

- As of 2026-06-22, `.env.local` matches `.env.example` by variable shape: it contains only `OPENAI_API_KEY` and `OPENAI_MODEL`.
- The local model value matches the example default: `OPENAI_MODEL=gpt-5.4-mini`.
- The API key value was intentionally not printed or copied into documentation.

## Install

```bash
npm install
```

Expected result:

- Dependencies install from `package-lock.json` without changing app behavior unexpectedly.

## Run Locally

```bash
npm run dev
```

Open:

- `http://localhost:3000`
- `http://localhost:3000/manual`
- `http://localhost:3000/chat`
- `http://localhost:3000/tool-use`
- `http://localhost:3000/agent`
- `http://localhost:3000/team`
- `http://localhost:3000/swarm`

Expected result:

- Landing page links to all six game modes.
- `/manual` lets the player drag each item to its destination.
- `/chat` returns text output without changing the room state.
- `/tool-use` clears one item per Submit using the tool-use metaphor.
- `/agent` clears the full room from one Submit and stops.
- `/team` splits work across two Agents in a two-room house and returns a team report.
- `/swarm` runs with either `real AI decision` / `Manager AI` when a valid key is configured or fallback badges when not.
- In `/swarm`, click Submit before using the item palette. Then pick one item and click anywhere in the house repeatedly to drop new live work.

CSS/runtime sync rule:

- Do not run `npm run build` while the dev server is still serving a browser tab.
- If a browser shows unstyled HTML, stop the dev server, remove `.next`, restart `npm run dev`, then hard-refresh the browser.
- `npm run test:e2e` now checks that the landing page CSS bundle is actually applied, not just that the HTML rendered.

## Sprite Assets

The canvas scenes render PNG sprites on the canvas engine. The PNGs are generated from
the SVG definitions in `components/RoomSprites.tsx` and committed under
`public/assets/sprites/`. You do not need to regenerate them for normal dev.

Regenerate them only after changing those SVG definitions:

```bash
npm run sprites
```

Expected result:

- `scripts/rasterize-sprites.mjs` (uses the `sharp` devDependency) writes the
  item/furniture/actor PNGs and `sprites.manifest.json` into
  `public/assets/sprites/`, then prints the sprite count.
- Note: canvas PNGs are not runtime-tintable; only books have pre-baked color
  variants. New tinted clutter needs new variants added to the rasterizer.

## Test And Build

Fast check:

```bash
npm run lint
npm run test:unit
```

Full verification:

```bash
npm run lint
npm run test:unit
npm run build
npm run dev
```

In a second terminal, once the dev server is ready:

```bash
npx playwright install chromium
npm run test:e2e
```

If the server is on a different origin:

```bash
E2E_BASE=http://localhost:3100 npm run test:e2e
```

Expected result:

- Lint passes.
- Unit tests pass.
- Production build completes.
- Playwright smoke test reports all checks passed.

## Visual QA

Use this for pure layout changes and for the top-down redesign. It supplements
`Test And Build`; it does not replace lint/build/E2E for behavior changes.

Run locally:

```bash
npm run dev
```

Check these URLs:

- `http://localhost:3000/manual`
- `http://localhost:3000/chat`
- `http://localhost:3000/tool-use`
- `http://localhost:3000/agent`
- `http://localhost:3000/team`
- `http://localhost:3000/swarm`

Viewport checks:

| View | Size | What to verify |
|---|---:|---|
| Constrained laptop | 1366 x 768 | Palette, controls, Low Power mode, map, and Manager panels remain usable with vertical scrolling and no horizontal overflow. |
| Laptop | 1440 x 900 | Controls, labels, scene, and report panels fit without overlap. |
| Projector | 1920 x 1080 | Worker movement, station labels, report flow, and escalation markers are readable from presentation distance. |

Top-down redesign checks:

- `/manual` reads as a room and demonstrates Manual Game = player drags items to destinations.
- `/chat` reads as a prompt/output scene and leaves the item counter unchanged after Submit.
- `/tool-use` reads as a tool room and demonstrates one tool action per Submit.
- `/agent` reads as a room and demonstrates one self-terminating loop.
- `/team` shows a two-room house with one messy room on the left, one work room on the right, split queues, room-to-room movement, and a final team report.
- `/swarm` reads as one facility: boss hub, manager rooms, agent work zones, paths, reports, and escalation markers are visible.
- `/swarm` shows the item palette; after Submit, selecting a palette item and clicking anywhere in the house drops repeated items, routes them to the responsible Manager, and includes them in the final report.
- The Low Power checkbox caps the canvas loop for older laptops and should not blank the sprite layer.
- Labels do not overlap props, workers, controls, report panels, or each other.
- Motion is clear enough to follow without reading the code or console.
- Any screenshots or recordings used as proof must avoid secrets, private URLs, and real `.env` values.

## Deployment Or Startup

Use this only after the user approves deployment.

Install and authenticate the Vercel CLI:

```bash
npm install -g vercel
vercel login
```

Link and deploy preview:

```bash
vercel
```

Set production environment variables:

```bash
vercel env add OPENAI_API_KEY production
vercel env add OPENAI_MODEL production
```

Ship production:

```bash
vercel --prod
```

Expected healthy state:

- Public URL loads without login by default.
- A rehearsal swarm run shows `real AI decision` with a configured key.
- The app still completes using fallbacks if the live call fails.
- The current beta production alias is
  `https://what-are-agents-presentation.vercel.app`.

## Troubleshooting

| Symptom | Likely cause | Check | Fix |
|---|---|---|---|
| Warehouse shows `fallback decision` or `Manager fallback` | Missing key, OpenAI failure, timeout, or malformed response | Check server console for `[boss-plan] falling back:` or `[manager-plan] falling back:` | Add/fix `OPENAI_API_KEY`, lower latency, or accept fallback for dry run. |
| Dropped item does not spawn | The swarm has not started, the Boss is still deciding, or the click was outside the house | Check the item-palette hint text | Click Submit first, wait for Manager panels, then drop inside the house. |
| Low Power scene looks blank | Canvas was resized/toggled before the sprite layer repainted | Wait briefly, then rerun Visual QA; current engine repaints on resize/toggle | If it persists, inspect `SpriteEngine.setLowPower` and image preload state. |
| `npm run test:e2e` cannot connect | Dev server is not running or base URL differs | `curl http://localhost:3000` or check terminal running `npm run dev` | Start server or set `E2E_BASE`. |
| Playwright complains browser is missing | Chromium has not been installed locally | `npx playwright install chromium` | Install Chromium and rerun the E2E test. |
| Lint command fails before linting | Next lint/version drift | `npm run lint` output | Update lint script or config with evidence. |
| Visual labels overlap after redesign | Scene primitives or viewport constraints are too loose | Run `Visual QA` at laptop and projector sizes | Add fixed scene dimensions, move labels outside motion paths, or shorten labels. |

## Recovery And Rollback

If a change fails:

1. Stop the dev server if it is running.
2. Inspect the smallest changed file set with version control.
3. Revert only the agent-owned change or apply a narrow forward fix.
4. Run the targeted verification from `Test And Build`.
5. Append the result or remaining gap to `ROADMAP.md`.

Do not delete data, reset repositories, rewrite history, rotate secrets, or deploy over production unless the user explicitly approves that action.

## Operational Proof

If a command in this runbook changed durable project state, append a row to the `ROADMAP.md` Verification Log. For routine local runs that do not change state, a final response note is enough.

## v2.1 GitHub Publish Checklist

Use this when preparing or auditing the v2.1 GitHub state:

1. Confirm `.env.local` and real secrets are not staged.
2. Remove local generated noise such as `.DS_Store`, `.next`, screenshots, traces,
   or videos from the worktree.
3. Run `npm run lint`, `npm run test:unit`, `npm run build`, and a warm
   `npm run test:e2e` against a local dev server.
4. Confirm the landing page links to `/manual`, `/chat`, `/agent`, `/team`, and
   `/swarm`.
5. Confirm `package.json`, `package-lock.json`, `README.md`, `BLUEPRINT.md`,
   `ROADMAP.md`, `RUNBOOK.md`, and `AGENTS.md` all describe v2.1 as current.
6. Commit with a v2.1 release message, push the branch, and push the `v2.1` tag.
