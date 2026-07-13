# S-001 - Workbench v2.3 Adoption

> Generated from LLM Workbench v2.3. This file stays at
> `specs/S-001-workbench-v2-3-adoption/SPEC.md`.

**Spec ID:** S-001
**Status:** complete
**Priority:** 0
**Owner:** Codex
**Updated:** 2026-07-13
**Catalog description:** Migrate the project from the roadmap-based harness to the v2.3 spec-centered control plane without losing history.
**Blockers:** none
**Latest event:** Spec completed and removed from the hot board.
**Next gate:** none

## Outcome

The project uses the LLM Workbench v2.3 progressive-disclosure control plane:
always-loaded operating rules, a compact project map, a generated hot board,
stable capability specs, executable runbook commands, and durable proof.

## Why It Matters

The previous roadmap and large Blueprint mixed current work, requirements,
historical proof, and product detail. v2.3 keeps selection context small while
preserving project-specific rules and history at stable paths.

## Current Verified State

- Source: `KaydenClark/LLM_Workbench` `integration` at commit
  `4140258d3f6f4800a04ff8d9d278ce1bc9b67fd5`, verified 2026-07-13.
- Target branch: `codex/presentation-friction-polish` at `a07c60b`, with no
  upstream, two commits behind `origin/main`, and pre-existing dirty code,
  tests, Blueprint, Roadmap, and Runbook edits.
- Pre-edit baseline passed `npm run lint`, 9 unit tests, and
  `npm run build`.
- Existing harness inventory:
  - port/fold: `AGENTS.md`, `BLUEPRINT.md`, `ROADMAP.md`, `RUNBOOK.md`;
  - keep: `README.md`, `VISUAL_DESIGN.md`, `.claude/launch.json`;
  - retire to cold history: the large v2.1 Blueprint and Roadmap.
- No `.claude/settings.json` was added: the user did not request Claude Code
  permission enforcement, and the existing launch file remains project-local.

## Desired Behavior

- Root `AGENTS.md`, `BLUEPRINT.md`, `TASKBOARD.md`, and `RUNBOOK.md`
  carry the v2.3 stamp and contain project-specific, placeholder-free content.
- Detailed work lives in stable `specs/S-###-slug/SPEC.md` files.
- `tools/spec-workbench.mjs` can select, show, claim, close, complete, render,
  and diagnose work without dependencies.
- Completed specs disappear from `TASKBOARD.md` but remain in the Blueprint
  catalog.
- Historical v2.1 product and verification detail remains readable under
  `archive/`.
- Existing dirty presentation-polish work is preserved byte-for-byte outside
  the intentionally migrated control docs.

## Decisions And Contracts

- Adapt upstream templates; never overwrite filled project-specific rules.
- Keep `README.md` and `VISUAL_DESIGN.md` as project-local truth.
- Retire `ROADMAP.md` as an active control surface; its live goal becomes
  S-002 and its history remains archived.
- Do not rebase, commit, push, deploy, or resolve the branch divergence during
  this adoption.
- Static harness conformance is useful proof, but it is not evidence that agent
  outcomes improved.

## Non-Goals

- Product behavior, UI, dependencies, deployment, or environment changes.
- Reconciliation of the two commits currently ahead on `origin/main`.
- Git publication of either the existing polish work or this adoption.

## Dependencies And Blockers

- none

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Reconcile the existing harness into v2.3 controls and preserve history | done | none | upstream helper self-test and checksum; local render/doctor/next; lint; 9 unit tests; build; full E2E; diff check all passed |

## Acceptance Criteria

- [x] Four v2.3 root controls exist with no template placeholders.
- [x] Existing harness docs are classified and live content is preserved or archived.
- [x] Edit/read scope names real project paths and the optional Claude setting decision is recorded.
- [x] Spec render, doctor, next, and upstream helper self-tests pass.
- [x] Project lint, unit tests, build, and E2E match the green baseline.
- [x] Unrelated dirty code/test work remains outside the adoption diff.
- [x] Final migration proof is recorded here and in the retired Roadmap log.

## Testing Seams

- The upstream spec-helper self-test exercises parsing, selection, claim, close,
  complete, render, and doctor behavior in isolated fixtures.
- This repository's doctor/render/next commands prove the filled control docs
  satisfy the local lifecycle contract.
- The existing project suite detects unintended app behavior changes.

## Verification Procedure

```bash
node /tmp/llm-workbench-v23/tools/test-spec-workbench.mjs
node tools/spec-workbench.mjs render
node tools/spec-workbench.mjs doctor
node tools/spec-workbench.mjs next --json
npm run lint
npm run test:unit
npm run build
npm run dev
# second terminal
npm run test:e2e
```

## Documentation Impact

- Replace root operating controls with v2.3-filled versions.
- Preserve old Blueprint/Roadmap detail under `archive/`.
- Keep public `README.md` and visual guidance unchanged.
- Record current work and migration evidence in stable specs.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-13 | TK-001 | Adoption started after inventory and migration map. | Live upstream commit, local Git state, and pre-edit lint/unit/build verified. | Existing docs classified; no content deleted. | Post-edit lifecycle and full project verification pending. |
| 2026-07-13 | TK-001 | Ticket closed | upstream helper self-test and checksum; local render/doctor/next; lint; 9 unit tests; build; full E2E; diff check all passed | v2.3 controls/specs added; v2.1 Blueprint and Roadmap preserved under archive | controlled downstream agent-outcome comparison remains unproven; S-002 owns beta handoff |
| 2026-07-13 | spec | Spec completed | Acceptance gates satisfied | Documentation impact recorded above | none |

## Completion Result

Adoption completed on 2026-07-13. The project now uses the v2.3
spec-centered control plane, the prior Blueprint/Roadmap remain available as
cold history, and application behavior matched the green pre-edit baseline.
Git publication and current beta follow-up remain under S-002.

## Remaining Limitations Or Follow-Up Specs

- S-002 owns beta-readiness and Git-publication follow-up.
- No controlled agent-outcome trial exists for this downstream adoption.

## Supersession

- Supersedes: roadmap-based v2.1 project harness
- Superseded by: none
