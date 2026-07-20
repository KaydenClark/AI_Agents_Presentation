# S-001 - V2.3 Adoption And Screen Walkthrough

> Generated from LLM Workbench v2.3. Stable path; never move this file by status.

**Spec ID:** S-001
**Status:** complete
**Priority:** 1
**Owner:** Kayden / agent
**Updated:** 2026-07-13
**Catalog description:** Adopt the V2.3 control harness and keep a repeatable walkthrough for every presentation screen.
**Blockers:** none
**Latest event:** Spec completed and removed from the hot board.
**Next gate:** none

## Outcome

The project uses the V2.3 spec-centered control layer, and every public screen
has a repeatable local walkthrough that checks clarity, layout, accessibility
anchors, navigation, and browser errors.

## Current Verified State

The clean remote checkout was a v2.1 project with a monolithic `ROADMAP.md` and
no Taskboard, specs directory, or spec workbench tool. Lint, seven unit tests,
and a production build passed before migration.

## Decisions And Contracts

- `archive/ROADMAP-v2.1.md` preserves the retired tracker and its proof history.
- Product direction remains in `BLUEPRINT.md`; active work is a generated
  projection in `TASKBOARD.md`; detailed truth and proof remain in this spec.
- The walkthrough uses fallback-first local execution and does not read or write
  secrets. A live-AI rehearsal needs separate explicit approval.

## Non-Goals

- Changing demo gameplay, deployment, dependencies, or the OpenAI call budget.
- Treating a browser-layout check as proof that live OpenAI is configured.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Migrate the V2.3 control surface and archive the v2.1 roadmap | done | none | Baseline lint, unit tests, and build passed; control docs, spec, taskboard, archive, and tool added. |
| TK-002 | Add and run the complete local screen walkthrough | done | none | `npm run test:walkthrough` passed across nine routes and three viewports; `npm run test:e2e` exited successfully. |

## Acceptance Criteria

- [x] Root docs, Taskboard, and stable spec have no template placeholders.
- [x] The retired roadmap is archived rather than deleted.
- [x] `doctor` and `render` report no lifecycle or projection drift.
- [x] The full app suite and all-screen walkthrough pass against a local server.
- [x] Findings and remaining gaps are recorded here, not on the hot board.

## Testing Seams

- `tests/walkthrough.mjs` verifies every route at laptop/projector dimensions;
  `tests/e2e.mjs` proves the interactive six-mode behavior.

## Verification Procedure

```bash
npm run lint
npm run test:unit
npm run build
node tools/spec-workbench.mjs render
node tools/spec-workbench.mjs doctor
npm run dev -- -p 3011
E2E_BASE=http://localhost:3011 npm run test:e2e
E2E_BASE=http://localhost:3011 npm run test:walkthrough
```

## Documentation Impact

- `AGENTS.md`, `BLUEPRINT.md`, `RUNBOOK.md`, and `TASKBOARD.md` now own their V2.3 truths.
- `README.md` retains public use; `VISUAL_DESIGN.md` and `PRESENTATION.md` remain project references.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-13 | TK-001 | Ticket closed | `npm run lint`, `npm run test:unit` (7 pass), and `npm run build` passed before migration. | Control docs adopted; legacy roadmap archived. | Run post-migration doctor and walkthrough. |
| 2026-07-13 | TK-002 | Ticket closed | `npm run test:walkthrough` passed 9 routes x 3 viewports with no browser errors or horizontal overflow; `npm run test:e2e` completed successfully; post-migration lint, 7 unit tests, build, render, and doctor passed. | Added walkthrough test and updated public/runbook verification guidance. | Live-AI rehearsal remains intentionally unverified without explicit approval. |
| 2026-07-13 | spec | Spec completed | Acceptance gates satisfied. | V2.3 migration and walkthrough proof recorded here. | none |

## Completion Result

Complete. The project now uses the V2.3 spec-centered control layer and has a
repeatable fallback-first screen walkthrough. The legacy v2.1 tracker is safely
preserved in `archive/ROADMAP-v2.1.md`.
