# S-002 - v2.1 Beta Readiness

> Generated from LLM Workbench v2.3. This file stays at
> `specs/S-002-v2-1-beta-readiness/SPEC.md`.

**Spec ID:** S-002
**Status:** active
**Priority:** 1
**Owner:** Codex
**Updated:** 2026-07-13
**Catalog description:** Keep the six-mode beta reliable and hand off remaining presentation, live-AI, and dependency work safely.
**Blockers:** none
**Latest event:** TK-003 closed with proof.
**Next gate:** Confirm acceptance criteria and completion result.

## Outcome

The v2.1 six-mode beta remains reliable for a live walkthrough, current
presentation-friction polish is handed off safely, and live-AI/dependency work is
handled only with the required owner decisions.

## Why It Matters

The product is built for a live audience. A small polish or environment mistake
can undermine the teaching arc even when the core app still builds.

## Current Verified State

- `origin/main` is incorporated without rewriting history; the branch retains
  the v2.3 control plane plus the recruiter-facing presentation work.
- Targeted pathing tests, lint, 9 unit tests, the production build, doctor, and
  the warm fallback-only E2E suite pass as of 2026-07-13.
- Browser QA covers all six routes at 1366x768, 1440x900, and 1920x1080 with
  meaningful content, no horizontal overflow, no framework overlays, and no
  console warnings/errors.
- Fallback-only operation is the accepted walkthrough path for this handoff;
  production live-AI health and deployment are not required.
- Read-only production audit reports one high direct Next.js finding and one
  moderate transitive PostCSS finding; remediation is isolated in S-004.

## Desired Behavior

- Preserve and review the current presentation-polish diff before deciding how
  to reconcile it with the newer `origin/main`.
- Keep every mode completable and readable at laptop/projector sizes.
- If live AI is required, replace the production secret through an approved
  secret-management path and verify `/api/boss-plan` plus `/swarm` without
  exposing the key.
- Keep dependency remediation isolated and fully reverified.
- Keep fallback-only operation an honest supported presentation path.

## Decisions And Contracts

- Deployment, secret changes, commits, pushes, rebases, and PRs require explicit
  authorization.
- Kayden authorized the S-002 completion plan, including checkpoint, mainline
  reconciliation, verification, branch publication, and PR handoff.
- Do not mix dependency remediation into presentation polish.
- Do not claim public live-AI health from old Roadmap evidence.
- Treat fallback-only operation as the accepted presentation path unless a
  later deployment/live-AI spec changes that decision.
- Preserve stable selectors and all six teaching contracts.

## Non-Goals

- Database, auth, multiplayer, new AI calls, or product redesign.
- Automatic production deployment.
- Treating fallback mode as a failure when live AI is not a walkthrough
  requirement.

## Dependencies And Blockers

- Live-AI verification is not required for this handoff; deployment and secret
  changes remain out of scope.
- Dependency remediation is isolated in planned spec S-004 and remains blocked
  on separate major-upgrade approval.
- Publication is authorized after final proof and documentation checks.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Reconcile and hand off the current presentation-friction polish | done | none | origin/main merged at a771ed2; targeted pathing 2/2, lint, unit 9/9, build, doctor, fallback E2E, and 18 viewport checks passed. |
| TK-002 | Verify production live-AI behavior if the walkthrough requires it | done | none; fallback-only path accepted | Fallback-only local APIs returned fallback provenance and the complete six-mode E2E run passed; the authorized plan accepts fallback without production live-AI verification. |
| TK-003 | Triage production dependency advisories in an isolated upgrade | done | none; implementation isolated to S-004 | Read-only production audit found 1 high direct Next.js and 1 moderate transitive PostCSS advisory; remediation is isolated in planned spec S-004 with no manifest changes. |

## Completion Plan

Only `S-002` is currently hot. Complete it in this order so presentation work,
live-AI operations, and dependency scope do not become one risky change.

| Order | Ticket / gate | Actions | Exit proof |
|---:|---|---|---|
| 1 | TK-001 preservation gate | Claim TK-001 before further behavior edits. With explicit Git authorization, checkpoint the five modified components/E2E files plus `tests/pathing.test.mts`; do not stash, rebase, or merge the dirty tree first. | A clean, recoverable branch tip containing the reviewed local polish and no generated/private files. |
| 2 | TK-001 mainline reconciliation | Merge `origin/main` into the current branch without rewriting history. Preserve the recruiter-facing `PRESENTATION.md` and conditional Vercel Analytics change, retain the v2.3 control plane, and resolve the Roadmap-to-spec migration deliberately. Combine both E2E changes: upstream browser/console/drop-retry hardening plus the local manual guidance, action-count, Presenter Mode, palette-gating, and live-drop assertions. | `origin/main` is an ancestor; the combined diff contains both product lines; no unresolved or stale control-doc content remains. |
| 3 | TK-001 behavior proof | Run the pathing test first, then lint, all unit tests, build, doctor, and a warm E2E run. Start a fallback-only local server without reading or printing secrets and complete `/swarm`, including repeated live work and human escalation. Run the six-mode Visual QA matrix at 1366x768, 1440x900, and 1920x1080. | All automated checks pass; every mode is completable/readable; fallback swarm, live drop, escalation, and final report are observed. |
| 4 | TK-001 docs and handoff | Reconcile `PRESENTATION.md`, `README.md`, `VISUAL_DESIGN.md`, `RUNBOOK.md`, and this spec with the verified UI labels and behavior. Use `Docs checked; no update needed` for owners whose truth did not change. With publication authorization, push the branch and open a PR to `main`; otherwise provide the clean local branch handoff. | TK-001 is closed with verification, docs status, ancestry, and the exact unpublished/published handoff state. |
| 5 | TK-002 owner decision | Default to the supported fallback walkthrough unless Kayden says real model decisions are required. If fallback is accepted, record live AI as explicitly not required. If live AI is required, create a superseding deployment/live-AI spec and wait for secret-rotation and deployment authorization before verifying `/api/boss-plan` and `/swarm`. | Owner choice is recorded; either fallback is the accepted presentation path or live-AI proof exists without exposing the key. |
| 6 | TK-003 isolated decision | Run read-only advisory triage against the reconciled lockfile. Do not apply an automated major-version fix in this branch. Record either an accepted deferral with risk or create a separate dependency-upgrade spec with its own red/green verification plan. | Dependency scope is documented and isolated; TK-003 can close without mixing an upgrade into presentation polish. |
| 7 | S-002 completion | Check every acceptance item, write the completion result, close all three tickets with evidence, run `render`, then rerun `doctor`. | S-002 is complete and disappears from the generated hot Taskboard. |

Current reconciliation facts for execution:

- `codex/presentation-friction-polish` contains recoverable checkpoint
  `d2e3941` and merge commit `a771ed2`; `origin/main` is now an ancestor.
- The E2E merge retains upstream browser/console/drop-retry hardening and the
  local manual guidance, action-count, Presenter Mode, palette-gating, and
  live-drop assertions.
- Publication is authorized; deployment, secret rotation, and dependency
  upgrades remain outside this spec.

## Acceptance Criteria

- [x] Current polish changes are reviewed against the newer mainline before publication.
- [x] Lint, unit tests, build, E2E, and six-mode visual QA pass for the chosen handoff.
- [x] Fallback-only mode completes a full local swarm run.
- [x] Public live-AI health is either verified with approval or explicitly not required.
- [x] Dependency advisories remain isolated with a documented upgrade decision.
- [x] Documentation and presentation artifacts match the shipped behavior.

## Testing Seams

- Unit tests cover pathing, sprite inventory, and shared warehouse rules.
- Playwright covers all six teaching modes, live item drops, escalation, and
  browser console errors.
- Visual QA covers 1366x768, 1440x900, and 1920x1080.

## Verification Procedure

```bash
npm run lint
npm run test:unit
npm run build
npm run dev
# second terminal
npm run test:e2e
```

Use the Visual QA matrix in `RUNBOOK.md` before a presentation or visual
handoff.

## Documentation Impact

- Update this spec, `BLUEPRINT.md`, `RUNBOOK.md`, `README.md`,
  `VISUAL_DESIGN.md`, or presenter materials only when their owned truth
  changes.
- Otherwise record `Docs checked; no update needed` with the reason.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-13 | spec | Migrated live Roadmap goal and deferred items into a stable capability record. | Local branch/upstream/dirty state plus lint/unit/build baseline verified. | Historical Roadmap retained under `archive/`. | Current polish publication, public runtime, visual QA, and dependency decisions remain open. |
| 2026-07-13 | TK-001 | Ticket closed | origin/main merged at a771ed2; targeted pathing 2/2, lint, unit 9/9, build, doctor, fallback E2E, and 18 viewport checks passed. | README and PRESENTATION reconciled; Blueprint catalog rendered; VISUAL_DESIGN and RUNBOOK checked with no update needed because their visual contract and commands remain accurate. | Record the accepted fallback decision and isolated dependency triage. |
| 2026-07-13 | TK-002 | Ticket closed | Fallback-only local APIs returned fallback provenance and the complete six-mode E2E run passed; the authorized plan accepts fallback without production live-AI verification. | S-002, README, and PRESENTATION now describe honestly labeled AI or fallback operation; deployment docs remain unchanged because no deployment occurred. | Close isolated dependency triage and publish the branch handoff. |
| 2026-07-13 | TK-003 | Ticket closed | Read-only production audit found 1 high direct Next.js and 1 moderate transitive PostCSS advisory; remediation is isolated in planned spec S-004 with no manifest changes. | S-002 and S-004 record the decision; Blueprint catalog will be rendered; package files remain unchanged. | Publish the branch and PR, then complete S-002. |

## Completion Result

Pending.

## Remaining Limitations Or Follow-Up Specs

- S-004 owns any Next.js/PostCSS dependency remediation.
- Create a superseding deployment/live-AI spec if production scope expands.

## Supersession

- Supersedes: active goal and future work formerly held in `ROADMAP.md`
- Superseded by: none
