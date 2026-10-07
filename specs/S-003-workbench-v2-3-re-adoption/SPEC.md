# S-003 - Workbench v2.3 Re-adoption

> Generated from LLM Workbench v2.3. This file stays at
> `specs/S-003-workbench-v2-3-re-adoption/SPEC.md`.

**Spec ID:** S-003
**Status:** complete
**Priority:** 0
**Owner:** Codex
**Updated:** 2026-07-13
**Catalog description:** Re-run v2.3 adoption from a fresh verified upstream source and close the audit gaps without changing the app.
**Blockers:** none
**Latest event:** Spec completed and removed from the hot board.
**Next gate:** none

## Outcome

AI_Agents_Presentation has a reproducible, project-specific Workbench v2.3
control plane derived from a fresh verified upstream checkout, with the audit's
static contract gaps closed and the existing presentation-polish work unchanged.

## Why It Matters

The first local adoption rendered and selected work correctly, but its upstream
proof could not be reproduced from the canonical checkout and several portable
control surfaces were absent. Re-adoption makes the local harness trustworthy
without reopening product behavior.

## Current Verified State

- Fresh source: `KaydenClark/LLM_Workbench` remote `integration` at
  `4140258d3f6f4800a04ff8d9d278ce1bc9b67fd5`, cloned and verified on
  2026-07-13 under `/tmp/llm-workbench-v23-readoption`.
- Target: `codex/presentation-friction-polish` at `a07c60b`, no upstream, two
  commits behind `origin/main`, with pre-existing dirty presentation-polish and
  first-adoption work.
- Pre-edit application baseline: lint passed; 9 unit tests passed; production
  build passed; full E2E passed against `http://localhost:3113`.
- Pre-edit harness baseline: lifecycle doctor/next/render passed; static
  evaluator scored 86.8/113; guardrail audit scored 40.4/100.
- Pre-edit missing or weak surfaces: `CLAUDE.md`, `HARNESS_FEEDBACK.md`, team coordination
  packets, explicit safety/privacy wording, meaningful coverage policy,
  final-response proof language, and reproducible upstream verification.

Pre-edit protected-file digests:

| File | SHA-256 |
|---|---|
| `components/ManualDragGame.tsx` | `fcae3a2094bebd9ce1608975f0c6ccf5de94f6f9447e4090d5894dab3d697cc0` |
| `components/RoomScene.tsx` | `a7fce367fdce112b72ced8c4ddafdaed6a76144310d2c2cd3ab72ad65da8ef47` |
| `components/SmallTeamScene.tsx` | `65df697b84889d9bde8abe49ed7d4bdbed298ebfd3ca1c478cd313d0663eca95` |
| `components/WarehouseScene.tsx` | `320d3174c8087b8da20f39ba16970282ec03edf42a18d205f08f99c2930435f6` |
| `tests/e2e.mjs` | `6f9a7444eb1846819921d890971358e40373c57720b50ccb20778324fb82c256` |
| `tests/pathing.test.mts` | `d9447d52dcd1388bafd67e2fa24d67dd89637ea6a774ab96b6155892ab755514` |

## Desired Behavior

- Reconcile, rather than replace, the filled project controls.
- Add the thin Claude bridge and append-only harness feedback channel.
- Add optional on-demand team coordination packets without increasing startup
  context.
- Bring the project-specific controls up to the current static v2.3 contract.
- Vendor the lifecycle helper byte-for-byte from the verified source commit.
- Keep the current app and test changes byte-for-byte unchanged.
- Record before/after static results while keeping static and outcome evidence
  explicitly separate.

## Decisions And Contracts

- The dirty checkout is a documented constrained-Git adoption case; no branch,
  rebase, commit, push, PR, or deployment operation is part of this ticket.
- Existing product truth in `README.md`, `BLUEPRINT.md`, `RUNBOOK.md`, and
  `VISUAL_DESIGN.md` remains authoritative where it is more specific than the
  generic templates.
- `CLAUDE.md` imports `AGENTS.md`; `.claude/settings.json` remains omitted
  because mechanical Claude permissions were not requested.
- Team templates are on-demand coordination packets, not a second project task
  tracker and not part of normal startup context.
- A higher static score proves contract coverage only; no controlled agent
  outcome trial is claimed.

## Non-Goals

- Product behavior, UI, dependencies, environment values, deployment, or live
  OpenAI verification.
- Reconciling the presentation-polish branch with `origin/main`.
- Fabricating outcome evidence or adding an evaluation suite solely to raise a
  score.

## Dependencies And Blockers

- none

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Reconcile the local controls with the fresh v2.3 adoption contract | done | none | pinned upstream 4140258 fetched and asserted; three upstream self-tests; helper SHA-256 parity; render/doctor/next; static 113/113; guardrail 65/100; protected app digests unchanged; diff check; lint; 9 unit tests; build; full E2E; two-axis review resolved |

## Acceptance Criteria

- [x] Fresh upstream commit, template self-tests, and vendored-helper checksum are reproducible.
- [x] Filled root controls, Claude bridge, feedback channel, and stable specs contain no template placeholders; reusable team packets remain explicitly templated.
- [x] Lifecycle render, doctor, next, static evaluator, and guardrail audit run successfully.
- [x] Static score reaches the applicable project contract without weakening evaluator criteria.
- [x] App-file checksums match the pre-edit snapshot.
- [x] Lint, unit tests, build, and E2E match the green baseline.
- [x] Documentation and evidence distinguish static contract coverage from unproven agent outcomes.

## Testing Seams

- Upstream helper self-tests cover spec lifecycle behavior.
- Static evaluator failures are the red seam for missing contract language and
  on-demand team coordination files.
- Checksums guard the unrelated dirty app/test files.
- The project suite detects accidental behavior changes.

## Verification Procedure

```bash
# First run RUNBOOK.md -> Reproducible Workbench Checks for pinned upstream proof.
node tools/spec-workbench.mjs render
node tools/spec-workbench.mjs doctor
node tools/spec-workbench.mjs next --json
npm run lint
npm run test:unit
npm run build
npm run dev -- -p 3113
# second terminal
E2E_BASE=http://localhost:3113 npm run test:e2e
```

## Documentation Impact

- Reconcile `AGENTS.md`, `BLUEPRINT.md`, `RUNBOOK.md`, and `README.md`.
- Add `CLAUDE.md`, `HARNESS_FEEDBACK.md`, and `team templates/`.
- Render `BLUEPRINT.md` and `TASKBOARD.md` from this spec.
- Preserve S-001 as completed historical evidence; this spec supersedes its
  local adoption result.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-13 | TK-001 | Fresh-source re-adoption baseline captured | remote integration `4140258`; upstream helper self-tests pass; local doctor/next/render pass; static 86.8/113; guardrail 40.4/100; lint; 9 unit tests; build; E2E | Migration map and repair plan recorded in S-003 | Controls still need reconciliation and post-edit proof |
| 2026-07-13 | TK-001 | Ticket closed | pinned upstream 4140258 fetched and asserted; three upstream self-tests; helper SHA-256 parity; render/doctor/next; static 113/113; guardrail 65/100; protected app digests unchanged; diff check; lint; 9 unit tests; build; full E2E; two-axis review resolved | AGENTS, BLUEPRINT, README, RUNBOOK, CLAUDE, HARNESS_FEEDBACK, benchmarks, team templates, generated catalog/Taskboard, and S-003 updated | none for re-adoption; outcome trials and Git publication remain separate |
| 2026-07-13 | spec | Spec completed | Acceptance gates satisfied | Documentation impact recorded above | none |

## Completion Result

Re-adoption completed on 2026-07-13 from pinned upstream commit `4140258`.
Static contract coverage improved from 86.8/113 to 113/113 and the guardrail
audit improved from 40.4/100 to 65/100. The lifecycle helper matches upstream,
all project regression gates remain green, the protected presentation-polish
files are byte-for-byte unchanged, and both review axes resolved their findings.
No commit, push, rebase, PR, tag, or deployment was performed.

## Remaining Limitations Or Follow-Up Specs

- Git publication and reconciliation with `origin/main` remain owned by S-002.
- Controlled downstream agent-outcome comparison remains unproven.

## Supersession

- Supersedes: S-001 local adoption result
- Superseded by: none
