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

Maintain and improve the AI Agent Swarm Demo without changing its purpose: a live presentation tool that teaches non-technical coworkers what an AI agent and an agent swarm are.

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

## Visual Redesign Guardrails

The active phase is a top-down colony-sim visual redesign (see `BLUEPRINT.md` -> Visual North Star and `ROADMAP.md`). While it runs:

- Preserve teaching behavior before improving visuals: manual = one task per submit, agent = one self-terminating loop, Boss -> zones -> agents, and the human-escalation exit must all still work.
- Do not rewrite the room/warehouse state machines unless the change strictly requires it; the redesign is visual-layer first.
- Keep accessible labels and stable selectors so `tests/e2e.mjs` stays reliable. If you change audience-facing wording that a selector depends on, update the test in the same change.
- Do not introduce new paid services, a database, auth, multiplayer, or extra AI calls; keep the two-calls-per-warehouse-run and server-side-key rules intact.
- Make small visual-layer changes first; reuse shared sprite/tile primitives rather than duplicating scene markup.
- Prefer geometric top-down props and workers over emoji-first visuals; labels should clarify stations without becoming the main artwork.
- Keep fixed, responsive scene bounds so labels, workers, paths, and controls do not shift or overlap at laptop/projector sizes.
- Do not copy RimWorld, Focus Friend, or branded character designs or assets.

## Design Verification

- Behavior-affecting changes: run `npm run lint`, `npm run build`, and `npm run test:e2e` (see `RUNBOOK.md` -> Test And Build).
- Pure layout/visual changes: use manual browser checks or screenshots.
- Verify both `/room` and `/warehouse` at projector and laptop sizes before claiming a visual task done; use `RUNBOOK.md` -> Visual QA as the checklist.

## Day-One Checklist

Load only what the task requires:

- Quick fix or single-file change: Read `ROADMAP.md` (Current State + Current Goal).
- Feature, refactor, or unknown-scope bug: Read `BLUEPRINT.md` and `ROADMAP.md`.
- Onboarding, setup, or architecture work: Read all three (`BLUEPRINT.md`, `ROADMAP.md`, `RUNBOOK.md`).
- Any task that involves running verification: Also open `RUNBOOK.md` -> Test And Build for commands.

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
- Do not increase the number of real AI calls in a full warehouse run without approval.
- Do not leave unexplained TODOs or placeholder logic.
- Do not treat prior session notes or ROADMAP history as current truth without verifying source state.
- Do not rewrite existing rows in `ROADMAP.md`; only append new rows.
- Do not skip the TDD test-skip reason; name it explicitly in the response rather than claiming "not practical" without explanation.
