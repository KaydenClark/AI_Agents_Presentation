# AI_Agents_Presentation - Runbook

**Last reviewed:** 2026-06-21
**Runtime owner:** Kayden / agent  
**Environment:** local development and Vercel production target

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

## Environment Configuration

Create local config from the example:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Purpose | Secret? | Example / Notes |
|---|---|---|---|
| `OPENAI_API_KEY` | Enables the live Boss planning call. | yes | Optional for fallback-only dry runs. |
| `OPENAI_MODEL` | Overrides the model used by the Boss planning route. | no | Defaults to `gpt-5.4-mini`. |

Rules:

- Do not commit real `.env` files, tokens, local databases, logs, screenshots with private data, or API keys.
- Keep `OPENAI_API_KEY` server-side only.
- Prefer degraded fallback behavior over fake client-side AI data when OpenAI is unavailable.

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
- `http://localhost:3000/room`
- `http://localhost:3000/warehouse`

Expected result:

- Landing page links to both scenes.
- `/room` supports Manual and Agent modes.
- `/warehouse` runs with either `real AI decision` when a valid key is configured or `fallback decision` when not.

## Test And Build

Fast check:

```bash
npm run lint
```

Full verification:

```bash
npm run lint
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

- `http://localhost:3000/room`
- `http://localhost:3000/warehouse`

Viewport checks:

| View | Size | What to verify |
|---|---:|---|
| Laptop | 1440 x 900 | Controls, labels, scene, and report panels fit without overlap. |
| Projector | 1920 x 1080 | Worker movement, station labels, report flow, and escalation markers are readable from presentation distance. |

Top-down redesign checks:

- `/room` reads as a room: walls, floor tiles, doorway, central rug, worker, scattered clutter, and labelled destinations (trash can, kitchen sink, recycling, bookshelf, laundry hamper, toy box) are visible. No developer-tool / MCP language appears.
- `/room` still demonstrates Manual = one item per submit and Agent = one self-terminating loop.
- `/warehouse` reads as one facility: boss hub, manager rooms, agent work zones, paths, reports, and escalation markers are visible.
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
- A rehearsal warehouse run shows `real AI decision` with a configured key.
- The app still completes using fallbacks if the live call fails.

## Troubleshooting

| Symptom | Likely cause | Check | Fix |
|---|---|---|---|
| Warehouse shows `fallback decision` | Missing key, OpenAI failure, timeout, or malformed response | Check server console for `[boss-plan] falling back:` | Add/fix `OPENAI_API_KEY`, lower latency, or accept fallback for dry run. |
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
