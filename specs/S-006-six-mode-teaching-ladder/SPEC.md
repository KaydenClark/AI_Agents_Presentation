# S-006 - Six-Mode Teaching Ladder

> Generated from LLM Workbench v2.3. Stable path
> `specs/S-006-six-mode-teaching-ladder/SPEC.md`; never move between status
> folders.

**Spec ID:** S-006
**Status:** complete
**Priority:** 1
**Owner:** Kayden (product)
**Updated:** 2026-07-17
**Catalog description:** Preserve the complete manual-to-swarm teaching ladder as one playable, progressively more autonomous experience.
**Blockers:** none
**Latest event:** Spec completed and removed from the hot board.
**Next gate:** none

## Outcome

A non-technical audience can play or watch six routes in order and understand
the difference between manual work, chat output, tool use, one autonomous
agent, a delegated team, and a coordinated swarm.

## Why It Matters

The product teaches through contrast. Each mode must add exactly one capability
without erasing the previous lesson, or the audience sees six minigames instead
of one coherent autonomy ladder.

## Current Verified State

- The landing page links `/manual`, `/chat`, `/tool-use`, `/agent`, `/team`,
  and `/swarm`; `/room` and `/warehouse` redirect to the current routes.
- Live route components implement the six distinct lessons and
  `tests/e2e.mjs` contains browser contracts for every rung.
- S-002 recorded a green full fallback E2E and multi-viewport beta proof before
  the later S-005 presenter checkpoint. The current S-005 checkpoint affects
  the Swarm closeout rehearsal, not the settled ladder meanings captured here.
- The sprite pipeline, accessible DOM controls, and canvas rendering support
  the playable presentation without adding persistence, auth, or multiplayer.

## Desired Behavior

- The landing page presents the routes as one ordered progression.
- Manual requires direct placement; Chat produces text without state mutation;
  Tool Use performs one external action per submit.
- Single Agent receives one goal, loops until clean, and self-terminates.
- Small Team has one Manager split a goal across two Agents and report.
- Swarm House has a Boss, three Managers, and six Agents plan, execute, adapt,
  escalate, and report.
- Legacy links remain safe redirects and no mode silently changes the teaching
  contract of another mode.

## Decisions And Contracts

- The six routes are one mode ladder, not independent games.
- Each rung adds one visible capability and retains the shared top-down
  cleanup vocabulary.
- The first five modes make no model calls. Swarm planning follows S-007.
- Runtime stays Next.js App Router, React, TypeScript, Tailwind, and the
  imperative canvas sprite engine.
- PNG sprites remain generated from `components/RoomSprites.tsx`; branded
  character or game clones remain out of scope.

## Non-Goals

- New modes, a deeper colony game, mobile-first redesign, persistence, auth,
  multiplayer, or shared participant state.
- Presenter pacing, readability polish, and jam rehearsal, which belong to
  S-005.
- Model planning and fallback internals, which belong to S-007.

## Dependencies And Blockers

- Depends on the current route components, shared sprite engine, and stable
  browser selectors.
- No open blocker. Later mode redesign must create a superseding spec rather
  than rewriting this completed capability record.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Present all six ordered modes from the landing page and preserve legacy redirects | done | none | `app/page.tsx`, route pages, redirect pages, and landing/redirect browser checks exist in the current source. |
| TK-002 | Require the player to complete every Manual placement with visible wrong-drop recovery | done | none | `ManualDragGame.tsx` plus Manual placement, recovery, completion, and Reset browser checks. |
| TK-003 | Produce useful Chat output without mutating room state | done | TK-002 | `ChatWindowScene.tsx` plus the unchanged-item-count browser contract. |
| TK-004 | Perform exactly one Tool Use action per submit and expose the autonomy contrast | done | TK-003 | `RoomScene.tsx` plus one-action, submit-count, completion, Reset, and Agent nudge browser checks. |
| TK-005 | Run one Single Agent goal to self-termination without manual stepping | done | TK-004 | `RoomScene.tsx` plus one-submit completion, busy lock, self-termination, and mid-run Reset browser checks. |
| TK-006 | Split one Small Team goal across two Agents and deliver a team report | done | TK-005 | `SmallTeamScene.tsx` plus Manager, two-Agent, parallel completion, room-layout, and report browser checks. |
| TK-007 | Run the hierarchical Swarm lesson with Boss, Managers, Agents, adaptation, escalation, and report | done | TK-006 | `WarehouseScene.tsx` plus current Swarm facility, planning, live-work, escalation, and final-report browser contracts. |
| TK-008 | Protect the complete ladder with accessible controls, stable selectors, build, and browser proof | done | TK-007 | S-002 records green lint, unit, build, fallback E2E, and 18 viewport checks; the current suite contains 63 check statements. |

### Ticket Close Contracts

| Ticket | Done criteria | Required proof |
|---|---|---|
| S-006/TK-001 | Landing shows six ordered links and both legacy routes reach the intended current modes. | Landing and redirect browser assertions. |
| S-006/TK-002 | All three Manual items require correct direct placement; a wrong destination explains recovery; Reset restores the task. | Manual browser completion, recovery, and Reset assertions. |
| S-006/TK-003 | One Chat submit returns useful output while the room item count remains unchanged. | Before/after item count and visible-answer browser assertions. |
| S-006/TK-004 | Each Tool Use submit clears exactly one item, submit count matches work count, completion disables Submit, and Reset restores work. | Per-submit count regression and completion/Reset browser assertions. |
| S-006/TK-005 | One Agent submit clears the room, ignores a second busy submit, disables Reset mid-run, and self-terminates. | Agent loop, busy-lock, mid-run Reset, and completion assertions. |
| S-006/TK-006 | One Manager assigns both Agents, both contribute, every task finishes, and the team report lands. | Team role, parallel completion, layout, pathing, and report assertions. |
| S-006/TK-007 | Boss, three Managers, and six Agents visibly plan, execute, absorb live work, escalate, and report from one instruction. | Swarm hierarchy, live-work, escalation, provenance, and report assertions. |
| S-006/TK-008 | All route contracts remain accessible and green through lint, unit, build, fallback browser, console, and target viewport checks. | Named full-suite outputs and 1366x768, 1440x900, and 1920x1080 results. |

## Acceptance Criteria

- [x] The landing page exposes all six modes in autonomy order.
- [x] Each route demonstrates its distinct lesson without contradicting the
      previous rung.
- [x] One Submit means one action in Tool Use and one complete goal in Single
      Agent.
- [x] Team and Swarm visibly add delegation and coordination.
- [x] Legacy `/room` and `/warehouse` links redirect safely.
- [x] The ladder remains usable without a database, login, or shared session.
- [x] Stable accessible names and browser seams exist for all six routes.

## Testing Seams

- `tests/e2e.mjs` is the user-facing contract for landing, redirects, and all
  six modes.
- `tests/pathing.test.mts`, `tests/warehouseRules.test.mts`, and
  `tests/spriteAssets.test.mts` protect shared movement, planning, and assets.
- `npm run lint`, `npm run test:unit`, and `npm run build` protect the current
  source baseline.

## Verification Procedure

```bash
npm run lint
npm run test:unit
npm run build
node tools/spec-workbench.mjs doctor
npm run dev
# second terminal
E2E_BASE=http://localhost:3000 npm run test:e2e
```

## Documentation Impact

- `BLUEPRINT.md` owns the compact route map and ladder invariant.
- `README.md` owns the public lesson descriptions.
- `PRESENTATION.md` owns the presenter script; S-005 owns changes to its flow.
- This spec now owns the durable six-mode capability and imported proof.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-17 | spec | Captured the already-shipped six-mode ladder as one durable capability record instead of leaving it implicit in source and the retired beta handoff. | Reviewed all route components, manifests, 63 browser check statements, completed S-002 proof, and current public `/`, `/manual`, and `/swarm` HTTP 200 responses. | Added S-006 and mapped every ladder item in the Blueprint coverage matrix. | S-005 owns the active presenter closeout; no missing ladder capability. |

## Completion Result

The implemented six-mode teaching ladder now has durable requirements,
contracts, acceptance, ticket history, and proof ownership. No product behavior
changed during this capture.

## Remaining Limitations Or Follow-Up Specs

- S-005 owns presenter pacing, visual hierarchy, jam rehearsal, and usability.
- S-007 owns resilient planning, fallback, provenance, and privacy.
- S-008 owns publication and deployed-candidate proof.

## Supersession

- Supersedes: the ladder capability detail formerly implicit in S-002 beta
  handoff and `archive/ROADMAP_V2_1.md`
- Superseded by: none
