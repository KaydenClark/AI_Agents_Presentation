# AI_Agents_Presentation - Agent Instructions

This file controls how agents behave in this project. It should answer four questions quickly:

1. What can the agent read?
2. What can the agent edit?
3. What is the agent's job?
4. Where is the proof that the job is done?

## Authority Order

When instructions conflict, use this order:

1. Current user request.
2. This `AGENTS.md`.
3. Source code and tests (trust them over docs when they conflict).
4. `BLUEPRINT.md`.
5. `ROADMAP.md`.
6. `RUNBOOK.md`.
7. `README.md` and older handoff notes.

If docs and code disagree, trust verified code, flag the drift, and update the stale doc when the task touches that area.

## Read Scope

The agent may read:

- this project root;
- `app/`, `components/`, `tests/`, configs, dependency manifests, lockfiles, and docs;
- generated output only when debugging build/runtime behavior;
- external paths only when the user request or project docs explicitly reference them.

The agent must not read secrets or private local data unless the task requires it and the file is inside the approved project scope.

## Edit Scope

The agent may edit:

- `app/`
- `components/`
- `tests/`
- root project configs, including `next.config.js`, `tailwind.config.ts`, `postcss.config.js`, `.eslintrc.json`, and `tsconfig.json`;
- root project docs, including `README.md`, `AGENTS.md`, `BLUEPRINT.md`, `ROADMAP.md`, and `RUNBOOK.md`;
- dependency manifests and lockfiles only when a dependency change is necessary and explained.

The agent must not edit:

- `.git/`;
- `node_modules/`, `.next/`, coverage output, Playwright browser caches, screenshots, videos, traces, or other generated build/test output unless explicitly cleaning a generated artifact from this project;
- `.env.local`, real environment files, API keys, credentials, OAuth tokens, local databases, logs with secrets, or unrelated projects;
- architecture, product direction, or persistence model unless the user asks for that or the current approach is blocking correctness.

If the correct change requires leaving this scope, stop and explain the smallest needed scope expansion.

## Agent Job

Maintain and improve the AI Agent Swarm game without changing its purpose: a top-down game that teaches the difference between a chat window and an AI agent — players give one instruction and watch the AI drive the agents. The agreed architecture is "AI plans, engine executes."

Default responsibilities:

- restate the current goal in one sentence;
- read the relevant docs and code before editing;
- make the smallest correct change;
- preserve the existing Next.js App Router, TypeScript, Tailwind, and fallback-first demo architecture;
- validate inputs at API boundaries;
- keep the OpenAI API key server-side only;
- preserve predictable live-demo behavior, including no visible audience-facing API failures;
- append to the `ROADMAP.md` Verification Log when state changes (mandatory);
- update `BLUEPRINT.md` and `RUNBOOK.md` when the task directly touches their content (best-effort);
- write exploratory or scratch work only in the final response or comments; never commit it;
- leave the project easier for the next agent to verify.

## Verification And Proof

For behavior changes, use red/green/refactor:

1. Define the expected behavior.
2. Add or update a failing test when the stack supports it.
3. Run the test and confirm it fails for the expected reason.
4. Implement the smallest change.
5. Run the targeted test.
6. Run the full verification suite from `RUNBOOK.md` -> Test And Build.

If tests are impractical, run a concrete manual check instead and name the specific reason in your response.

Every completed task leaves proof in two places:

- Final response: what changed, why, risks, how verified.
- `ROADMAP.md` Verification Log: mandatory - append one row when state changed.

Updating `BLUEPRINT.md` and `RUNBOOK.md` is best-effort: do it when the task directly touches their content.

Use command results, browser checks, API probes, screenshots, or documented manual checks. Do not use stale counts or unsupported claims.

Never claim work is complete unless verification ran. If it could not run, say exactly why and record the gap in `ROADMAP.md`.

## v2.1 Release Context

The current release target is **v2.1**: a six-mode ladder that teaches:

1. `/manual` - human plays the agent by dragging items to their destinations.
2. `/chat` - prompt produces output but does not change room state.
3. `/tool-use` - chat uses external tools, one action per submit.
4. `/agent` - one agent completes the whole room from one goal.
5. `/team` - one Manager splits work across two Agents.
6. `/swarm` - Boss, Managers, and Agents plan, execute, report, and absorb live
   new work.

When touching the release shape, keep `package.json`, `package-lock.json`,
`README.md`, `BLUEPRINT.md`, `ROADMAP.md`, and `RUNBOOK.md` synchronized. Do not
deploy to Vercel unless the user explicitly asks for deployment.

## Game Rebuild Guardrails

The active phase is v2.1: canvas sprite engine (done), six-mode ladder (done), Boss authority (done), Manager API + self-correction (done), and live swarm item spawning (done). See `BLUEPRINT.md` and `ROADMAP.md`. While it runs:

- Preserve teaching behavior: manual drag game = player is the agent, tool use = one action per submit, agent = one self-terminating loop, Boss -> Managers -> Agents, and the human-escalation exit must all still work. Runs must stay completable and legible.
- The sprite layer renders on `components/sprites/SpriteEngine.ts`. Keep movement decoupled from React (mutate the engine imperatively; never trigger a React render per animation frame). React state is for discrete events + side panels.
- PNG sprites are generated, not hand-edited. Change the SVG in `components/RoomSprites.tsx` and re-run `npm run sprites`; canvas PNGs can't be runtime-tinted (only books have pre-baked color variants).
- AI calls are allowed under "AI plans, engine executes": the Boss makes a real allocation call (authoritative), and each Manager may make one real queue-split call. Keep calls bounded (~1 Boss + 3 Managers per run) and every one fallback-backed; do not add AI calls beyond that plan without approval. Keep the OpenAI key server-side.
- Preserve warehouse item spawning as a repeatable player action: select a supported palette item, click anywhere in the house while the swarm is active, append that item to the responsible Manager queue, keep the item selected for repeated drops, and do not reset the scenario.
- Preserve Low Power mode for constrained laptops; canvas changes should keep the frame cap/DPR behavior working.
- Keep accessible labels and stable selectors so `tests/e2e.mjs` stays reliable. If you change audience-facing wording a selector depends on, update the test in the same change.
- Do not introduce new paid services, a database, auth, or multiplayer.
- Keep fixed, responsive game-mode bounds so labels, paths, and controls do not overlap at laptop/projector sizes.
- Do not copy RimWorld, Focus Friend, or branded character designs or assets.

## Design Verification

- Behavior-affecting changes: run `npm run lint`, `npm run build`, and `npm run test:e2e` (see `RUNBOOK.md` -> Test And Build).
- Pure layout/visual changes: use manual browser checks or screenshots.
- Verify `/manual`, `/chat`, `/tool-use`, `/agent`, `/team`, and `/swarm` at projector and laptop sizes before claiming a visual task done; use `RUNBOOK.md` -> Visual QA as the checklist.

## Day-One Checklist

Load only what the task requires:

- Quick fix or single-file change: Read `ROADMAP.md` (Current State + Current Goal).
- Feature, refactor, or unknown-scope bug: Read `BLUEPRINT.md` and `ROADMAP.md`.
- Onboarding, setup, or architecture work: Read all three (`BLUEPRINT.md`, `ROADMAP.md`, `RUNBOOK.md`).
- Any task that involves running verification: Also open `RUNBOOK.md` -> Test And Build for commands.
- Any task that creates or changes UI/visuals: Read `VISUAL_DESIGN.md` first and follow it unless the current user request overrides it.

Then for every task:

1. Inspect the files relevant to the task.
2. Check version-control status.
3. Run the baseline verification when practical.
4. Implement with tests or a named manual check.
5. Append to `ROADMAP.md` Verification Log if state changed.

## Output Format

For all task completions, report:

1. What changed.
2. Why it changed.
3. Risks or side effects.
4. How it was verified.

Keep the response concise. Flag uncertainty instead of hiding it.

## What Not To Do

- Do not invent APIs, files, functions, behavior, or test results.
- Do not rewrite working systems just to make them cleaner.
- Do not broaden scope without a concrete reason.
- Do not add paid services unless the user explicitly approves them.
- Do not expose `OPENAI_API_KEY` or any real environment values to client code, logs, docs, or commits.
- Do not add a database, multiplayer sync, login, or shared state unless the user explicitly asks.
- Do not add real AI calls beyond the approved "AI plans, engine executes" plan (~1 Boss + 3 Managers per run) without approval; keep each call fallback-backed.
- Do not leave unexplained TODOs or placeholder logic.
- Do not treat prior session notes or ROADMAP history as current truth without verifying source state.
- Do not rewrite existing rows in `ROADMAP.md`; only append new rows.
- Do not skip the TDD test-skip reason; name it explicitly in the response rather than claiming "not practical" without explanation.
