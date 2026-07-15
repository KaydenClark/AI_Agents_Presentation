# S-005 - Presentation Show Readiness

> Generated from LLM Workbench v2.3. Stable path
> `specs/S-005-presentation-show-readiness/SPEC.md`; never move between status
> folders.

**Spec ID:** S-005
**Status:** active
**Priority:** 0
**Owner:** Kayden (product); scheduled Sol/Terra agents (execution)
**Updated:** 2026-07-15
**Catalog description:** Make the six-mode presentation and Swarm House presenter-ready by fixing runtime collision breaks, smoothing the rehearsal flow, and turning game mechanics into clear teaching interactions.
**Blockers:** none
**Latest event:** Sol scoping confirmed that the current pathing test passes, but it checks synthesized Team routes and only two representative Swarm routes rather than every consecutive runtime movement leg.
**Next gate:** TK-001 adds a failing runtime-leg regression, applies the smallest collision-safe routing fix, and proves repeated Team/Swarm fallback runs stay inside authored openings.

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

- The project has deterministic pathing fixtures for Team and Swarm routes, but
  the owner still observes intermittent wall crossing in the visible runtime.
  The current test passes while synthesizing each Team pickup from an agent home
  and sampling only two Swarm routes; it does not enumerate the consecutive
  movement legs emitted by a complete runtime run.
- The browser suite completes all six modes and exercises live work and
  escalation, but its pass criteria do not prove every animated runtime segment
  stayed inside authored collision boundaries.
- Swarm House exposes Boss planning, Manager queue splits, live work, presenter
  cues, escalation, and a final report, but the combined surface still needs a
  focused rehearsal/usability pass.
- The project already supports fallback-first operation, Presenter Mode, stable
  accessible selectors, and laptop/projector visual QA.

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

- TK-001 depends only on the existing Node/npm test harness, local Chromium, and
  fallback mode; it does not require credentials, deployment, paid services, or
  an owner decision.
- Blockers: none. If the symptom cannot be reproduced at either the runtime-leg
  seam or in repeated fallback runs, record the attempted routes and stop rather
  than weakening the collision assertion or broadening into visual redesign.

## Vertical Implementation Slices

Tickets are temporary tracer bullets within this stable capability record.

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | In 30–45 minutes, reproduce one runtime wall-crossing leg and route every Team/Swarm runtime movement request through collision-safe authored openings | ready | none | pending |
| TK-002 | Make swarm rehearsal start, phase progress, live-work timing, reset, and completion controls unambiguous | blocked | TK-001 | pending |
| TK-003 | Make Boss → Manager → Agent delegation, work state, escalation, and final reporting readable at presenter distance | blocked | TK-002 | pending |
| TK-004 | Remove or reshape game interactions that do not strengthen the six-mode teaching story; complete the laptop/projector usability pass | blocked | TK-003 | pending |

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

## Acceptance Criteria

- [ ] Repeated Team and Swarm runs contain no visible movement segment that
      crosses a solid wall outside an authored opening.
- [ ] A first-time presenter can start, follow, add live work, trigger/resolve
      escalation, reset, and complete the Swarm House using visible controls.
- [ ] Presenter Mode communicates the current phase and next teaching beat while
      operational detail remains available without dominating the surface.
- [ ] The full fallback rehearsal completes at laptop and projector sizes with
      no overflow, hidden critical control, console error, or ambiguous finish.
- [ ] Every retained interaction has an explicit teaching role in the mode
      ladder; decorative or confusing mechanics are removed or subordinated.

## Testing Seams

- Primary seam: the real-browser Team and Swarm rehearsal, instrumented so every
  runtime actor movement segment can be checked against authored walls and doors.
- Supporting seam: deterministic pathing and warehouse-rule tests protect route
  construction, assignment, rebalancing, and completion contracts.
- Visual/manual seam: the existing six-mode Visual QA matrix at laptop and
  projector sizes, with a sub-minute rehearsal artifact for milestone review.

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

## Completion Result

Pending.

## Remaining Limitations Or Follow-Up Specs

- Live-AI production proof remains separately authorization-gated; fallback is
  sufficient for this spec's functional rehearsal work.

## Supersession

- Supersedes: none
- Superseded by: none
