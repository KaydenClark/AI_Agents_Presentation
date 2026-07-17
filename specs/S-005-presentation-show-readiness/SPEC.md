# S-005 - Presentation Show Readiness

> Generated from LLM Workbench v2.3. Stable path
> `specs/S-005-presentation-show-readiness/SPEC.md`; never move between status
> folders.

**Spec ID:** S-005
**Status:** active
**Priority:** 0
**Owner:** Captain Sol / Engineer TK-002
**Updated:** 2026-07-17
**Catalog description:** Make the six-mode presentation and Swarm House presenter-ready by fixing runtime collision breaks, smoothing the rehearsal flow, and turning game mechanics into clear teaching interactions.
**Blockers:** none
**Latest event:** TK-002 claimed by Captain Sol / Engineer TK-002.
**Next gate:** Close TK-002 with verification and documentation proof.

## Problem Statement

The presentation has a strong six-mode concept, but it is not yet dependable or
polished enough to show as a finished product. Agents sometimes appear to walk
through walls, the Swarm House can feel like a rough warehouse game rather than
a clear explanation of coordinated AI, and several game interactions need to
become easier for a presenter and audience to understand and use.

## Outcome

A presenter can run the complete ladder, especially Team and Swarm House,
without visible world-rule breaks or rehearsal friction. Every game interaction
supports a teaching point, the audience can follow delegation and progress at a
glance, and the final result feels like a usable presentation product rather
than an unfinished prototype.

## Why It Matters

The demo teaches by making abstract agent concepts visible. A worker crossing a
wall undermines trust in the system, while a noisy or game-first swarm obscures
the Boss → Manager → Agent lesson. Presentability is functional correctness for
this product.

## Current Verified State

- TK-001 now routes complete Team runtime movement through collision-safe
  openings and has targeted, full-suite, and three-run fallback browser proof.
- The browser suite covers all six modes, live work, and escalation. Historical
  proof completed that path; the current TK-002 checkpoint is intentionally
  still red at the stale post-report Reset step described below.
- Swarm House exposes Boss planning, Manager queue splits, live work, presenter
  cues, escalation, and a final report. In a 2026-07-15 local fallback audit,
  the run advanced from the live-work cue to the final report before the
  presenter completed the palette click; the palette and Reset were then
  unavailable until completion.
- The project already supports fallback-first operation, Presenter Mode, stable
  accessible selectors, and laptop/projector visual QA.
- `tests/e2e.mjs` now contains 63 browser contract checks. The current TK-002
  checkpoint reaches the new finish flow, but its old post-report Reset step
  still times out; the public run-of-show was corrected to reset at the safe
  checkpoint or reload after an immutable final report.

## Desired Behavior

- Actors never visibly cross a solid wall; every runtime route uses authored
  doors and openings in Team and Swarm House.
- A presenter can start, follow, interrupt, reset, and finish a swarm rehearsal
  without guessing which control or phase comes next.
- Boss allocation, Manager delegation, Agent work, live work, escalation, and
  final reporting remain readable at laptop and projector sizes.
- Game mechanics remain only where they strengthen the manual → chat → tools →
  agent → team → swarm explanation.
- Fallback mode remains an honest, complete presentation path.
- A fresh jam rehearsal can pause at the human exit, resolve the jam, return to
  the safe live-work checkpoint, and finish with the escalation represented in
  the local final report.

## User Stories

1. As a presenter, I want every worker to obey walls and doors so the audience trusts what it sees.
2. As a presenter, I want one obvious way to start and reset a swarm rehearsal so setup does not interrupt the talk.
3. As a presenter, I want the current teaching phase to be obvious so I know what to explain next.
4. As an audience member, I want to distinguish Boss, Manager, and Agent responsibilities at a glance so delegation is understandable.
5. As an audience member, I want to see work move from request to assignment to completion so the swarm is more than animated decoration.
6. As a presenter, I want live work to be easy to add at the right moment so adaptation can be demonstrated reliably.
7. As an audience member, I want important status and decisions to dominate over debug detail so I can follow the story from a distance.
8. As a presenter, I want deterministic fallback to tell the same story as live AI so venue connectivity cannot ruin the lesson.
9. As a keyboard user, I want every rehearsal control to remain reachable and understandable without precise pointer use.
10. As a presenter, I want a clear final report so the audience sees that coordinated work actually completed.
11. As a maintainer, I want collision and rehearsal failures caught at user-facing seams so passing tests mean the visible demo is trustworthy.
12. As the owner, I want each game feature to earn its place as a teaching interaction rather than making the presentation feel like an unfinished game.

## Decisions And Contracts

- Preserve the six-mode ladder and the existing “AI plans, engine executes”
  architecture.
- Treat collision integrity as a runtime invariant over every visible movement
  segment, not only a static route-fixture assertion.
- Use Presenter Mode as the primary audience layer; detailed manager logs stay
  available through disclosure rather than competing with the story.
- Keep live AI calls bounded and preserve the deterministic fallback path.
- Prefer tightening existing controls and mechanics over adding new game systems.
- Evaluate polish by rehearsal clarity, completion, accessibility, and visible
  correctness—not by adding decorative features.

## Non-Goals

- Rebuilding the canvas engine or changing frameworks.
- Turning Swarm House into a deeper colony-management game.
- Adding multiplayer, persistence, auth, more model calls, or new paid services.
- Deploying or publishing from an automated ticket without explicit approval.

## Dependencies And Blockers

- TK-002 depends only on the existing React state machine, local Chromium,
  fallback mode, and the current browser rehearsal seam. It does not require
  credentials, deployment, paid services, new AI calls, or an owner decision.
- TK-005 depends on TK-002 through TK-004 so its jam rehearsal proves the final
  accepted presenter hierarchy rather than an intermediate layout.
- Blockers: none. The presenter checkpoint must begin only after active work has
  drained so Reset cannot interrupt in-flight agent work.

## Vertical Implementation Slices

Tickets are temporary tracer bullets within this stable capability record.

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | In 30–45 minutes, reproduce one runtime wall-crossing leg and route every Team/Swarm runtime movement request through collision-safe authored openings | done | none | Red: runtime-leg regression failed before __smallTeamRuntimePathingForTest existed. Green: targeted pathing 3/3; full lint, unit 10/10, and production build passed. Fallback E2E rehearsal passed 3/3 on localhost:3100 with OPENAI_API_KEY blank; Manager and Boss API checks reported source=fallback in each run. |
| TK-002 | In 30–45 minutes, add a Presenter Mode live-work checkpoint that keeps live work and Reset available until the presenter explicitly finishes the rehearsal | in-progress | none | pending |
| TK-003 | Make Boss → Manager → Agent delegation, work state, escalation, and final reporting readable at presenter distance | blocked | TK-002 | pending |
| TK-004 | Remove or reshape game interactions that do not strengthen the six-mode teaching story; complete the laptop/projector usability pass | blocked | TK-003 | pending |
| TK-005 | Rehearse the complete fallback jam path from a fresh run through human escalation, resolution, live-work checkpoint, explicit finish, and final report at laptop and projector sizes | blocked | TK-002, TK-003, TK-004 | pending |

### TK-001 Ready Contract (30–45 minutes)

Scope only `tests/pathing.test.mts`, `components/SmallTeamScene.tsx`, and
`components/WarehouseScene.tsx`. Do not change layout, controls, AI calls, or
scene art.

Done criteria:

1. Red: extend the pathing seam to use consecutive positions from an actual
   Team run and a cross-room/outside Swarm leg, and confirm the test fails on a
   wall-crossing movement request for the expected reason.
2. Green: make the scene-local runtime movement path expand any unsafe direct
   leg through the authored door/hallway/opening geometry before animation.
   Preserve direct movement when the segment is already safe.
3. The regression asserts every emitted segment avoids solid wall geometry;
   existing assignment, carry, escalation, lane-offset, and completion behavior
   remains unchanged.
4. Run three fallback Team rehearsals and three fallback Swarm rehearsals in the
   browser. No actor visibly crosses a solid wall, and both modes still finish.

Targeted verification:

```bash
npx tsx --test tests/pathing.test.mts
```

Full verification, using the `RUNBOOK.md` Test And Build order and a separate
terminal for E2E:

```bash
npm run lint
npm run test:unit
npm run build
node tools/spec-workbench.mjs doctor
npm run dev
E2E_BASE=http://localhost:3000 npm run test:e2e
```

Documentation expectation: append red/green and rehearsal proof to this spec.
Update `RUNBOOK.md` only if a verification command changes; otherwise record
`Docs checked; no update needed - internal path routing changed without changing
the public rehearsal flow or visual language.`

### TK-002 Ready Contract (30–45 minutes)

Scope only `components/WarehouseScene.tsx`, `tests/e2e.mjs`, this spec, and the
public/rehearsal docs named below. Do not change scene art, Manager panels, AI
calls, escalation behavior, or non-Presenter automatic completion.

Done criteria:

1. Red: extend the fallback browser rehearsal to require a visible live-work
   checkpoint after the initial queues drain. At that checkpoint the item
   palette, Reset, and one explicit finish action are available; the current
   auto-summary behavior must fail this assertion for the expected reason.
2. Green: in Presenter Mode only, hold at a safe no-active-work checkpoint
   instead of immediately summarizing. The presenter can add repeatable live
   work or activate one clearly labelled finish action to create the final
   report. After added work drains, return to the same checkpoint.
3. Reset is enabled only at the safe checkpoint and returns the rehearsal to the
   idle start state. Submit remains unavailable while a run or checkpoint is in
   progress, and non-Presenter Mode keeps the current automatic finish behavior.
4. The Presenter cue names the current checkpoint and next action. The new
   control has a stable accessible name, remains keyboard reachable, and the
   existing live-work, escalation, fallback, and final-report assertions pass.

Targeted verification, using the current real-browser seam in fallback mode:

```bash
npm run dev
E2E_BASE=http://localhost:3000 npm run test:e2e
```

Full verification, using the `RUNBOOK.md` Test And Build order and a separate
terminal for E2E:

```bash
npm run lint
npm run test:unit
npm run build
node tools/spec-workbench.mjs doctor
npm run dev
E2E_BASE=http://localhost:3000 npm run test:e2e
```

Documentation expectation: update `RUNBOOK.md` rehearsal steps and the
`README.md` `/swarm` description if the accepted finish action changes the
presenter sequence. Update `VISUAL_DESIGN.md` only if the accepted control
hierarchy or styling contract changes. Append red/green, fallback rehearsal,
and docs proof to this spec, then render the Taskboard.

### Remaining Ticket Close Contracts

| Ticket | Done criteria | Required proof |
|---|---|---|
| S-005/TK-003 | At 1366x768 and 1920x1080, Presenter Mode keeps the current phase, next action, Boss → Manager → Agent responsibility, work state, human exit, and final report visible without operational logs competing with them. Stable accessible names/selectors remain intact. | Before/after viewport artifact or DOM-bounds capture, targeted browser assertions for the hierarchy, full lint/unit/build, and warm fallback E2E. |
| S-005/TK-004 | Inventory every retained interaction against one ladder lesson; remove or subordinate any interaction without a teaching role; complete all-six-mode laptop/projector visual and keyboard checks without changing the bounded AI architecture. | Checked interaction-to-lesson matrix in this spec, six-mode visual results, keyboard pass, zero console/page errors, and a sub-minute rehearsal artifact or preview URL. |
| S-005/TK-005 | From a fresh fallback page, enable Jam controls, trigger one zone, prove Agent → Manager → Boss → human escalation, resolve it, return to the safe checkpoint, add repeatable live work, finish explicitly, and verify the final report accounts for added work and human help at both target sizes. | Green fresh-run browser regression, laptop/projector rehearsal result, provenance badge, final-report text, zero console/page errors, and full Runbook verification. |

## Acceptance Criteria

- [x] Repeated Team and Swarm runs contain no visible movement segment that
      crosses a solid wall outside an authored opening.
- [ ] A first-time presenter can start, follow, add live work, trigger/resolve
      escalation, reset, and complete the Swarm House using visible controls.
- [ ] Presenter Mode communicates the current phase and next teaching beat while
      operational detail remains available without dominating the surface.
- [ ] The full fallback rehearsal completes at laptop and projector sizes with
      no overflow, hidden critical control, console error, or ambiguous finish.
- [ ] A fresh fallback jam rehearsal reaches the human exit, resolves the jam,
      returns to the safe checkpoint, and records the escalation in the final
      report without relying on stale state from a prior completed run.
- [ ] Every retained interaction has an explicit teaching role in the mode
      ladder; decorative or confusing mechanics are removed or subordinated.

## Testing Seams

- Primary seam: the real-browser Team and Swarm rehearsal, instrumented so every
  runtime actor movement segment can be checked against authored walls and doors.
- Supporting seam: deterministic pathing and warehouse-rule tests protect route
  construction, assignment, rebalancing, and completion contracts.
- Visual/manual seam: the existing six-mode Visual QA matrix at laptop and
  projector sizes, with a sub-minute rehearsal artifact for milestone review.
- Jam seam: a fresh-page browser run enables Jam controls, triggers one zone,
  proves the human banner and Resolve action, then completes through the same
  checkpoint and report path as a non-jammed run.

## Verification Procedure

```bash
npm run test:unit
npm run lint
npm run build
E2E_BASE=http://localhost:3000 npm run test:e2e
node tools/spec-workbench.mjs doctor
```

## Documentation Impact

- Update `VISUAL_DESIGN.md` only when the accepted presentation hierarchy or
  interaction language changes.
- Update `RUNBOOK.md` when rehearsal or verification steps change.
- Keep public setup and mode descriptions in `README.md` aligned with the final
  usable flow.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-15 | spec | Captured owner-reported collision, swarm polish, and game-usability gaps as one stable show-readiness capability | Existing pathing unit seam and browser rehearsal seam identified; no product behavior claimed fixed | Added S-005 and refreshed current v2.3 Lexicon/control references | TK-001 runtime reproduction and fix |
| 2026-07-15 | TK-001 | Sol scoped one 30–45 minute collision-integrity slice after tracing the live Team and Swarm movement seams | `npx tsx --test tests/pathing.test.mts` passes 2/2, proving the existing fixture does not reproduce the owner-observed runtime symptom; source review found synthesized Team starts and two sampled Swarm routes | Refined S-005 and refreshed the generated Taskboard projection | Execute red/green runtime-leg regression and six fallback rehearsals |
| 2026-07-15 | TK-001 | Terra added scene-local Team runtime-leg expansion and a complete sequential Team-run regression | Red: targeted test failed because the runtime seam export was absent. Green: pathing 3/3, lint, unit 10/10, and production build passed. One E2E rehearsal passed; two repeated rehearsals exceeded normal duration and were stopped, so the required three fallback rehearsals are not yet proven. | Docs checked; no update needed - internal path routing changed without changing the public rehearsal flow or visual language. Rendered Taskboard. | Complete three deterministic fallback browser rehearsals before closing TK-001. |
| 2026-07-15 | TK-001 | Ticket closed | Red: runtime-leg regression failed before __smallTeamRuntimePathingForTest existed. Green: targeted pathing 3/3; full lint, unit 10/10, and production build passed. Fallback E2E rehearsal passed 3/3 on localhost:3100 with OPENAI_API_KEY blank; Manager and Boss API checks reported source=fallback in each run. | Docs checked; no update needed - the internal Team routing fix does not change public setup, rehearsal steps, or visual language. | TK-002 remains blocked pending owner prioritization after this ticket. |
| 2026-07-15 | TK-002 | Sol scoped one presenter-pacing slice after a current local fallback audit reproduced the live-work timing gap | Idle, working, and complete states were captured in the in-app browser. The run reached the final report before the palette click completed, after which the palette was disabled; source inspection confirmed Reset is disabled throughout working and summarizing. | Refined S-005 and refreshed the generated Taskboard projection; implementation docs are named in the ready contract. | Add the safe Presenter Mode live-work checkpoint and prove drop, reset, finish, and fallback completion. |
| 2026-07-17 | TK-002 | Captain Sol added the Presenter-only safe checkpoint, repeatable checkpoint drops, checkpoint Reset, and explicit Finish rehearsal action; non-Presenter automatic completion remains intact. | Red: the new browser checkpoint assertion failed because the finish action was absent. Green attempt: `npm run lint` passed; fallback E2E reached the new flow but stopped at the old post-final Reset step because Reset is correctly disabled outside the checkpoint (`tests/e2e.mjs:454`, Playwright timeout). | Docs checked; no public/rehearsal docs updated until the browser contract is green. Rendered Taskboard. | Move the browser Reset proof to the checkpoint (or start its jam run from a fresh page), then rerun fallback E2E and full verification before closing TK-002. |
| 2026-07-17 | planning | Portfolio canon harvest preserved the TK-002 checkpoint and added an explicit dependency-aware jam rehearsal closeout slice. | Live branch, 63 browser checks, current Warehouse state machine, public route health, and the known post-report Reset timeout were reviewed; no implementation was performed. | Corrected the run-of-show reset/finish sequence and linked the Blueprint coverage matrix. | Resume TK-002, then complete readability, interaction audit, and fresh jam rehearsal in order. |

## Completion Result

Pending.

## Remaining Limitations Or Follow-Up Specs

- Live-AI production proof remains separately authorization-gated; fallback is
  sufficient for this spec's functional rehearsal work.

## Supersession

- Supersedes: none
- Superseded by: none
