# S-008 - Publication And Release Proof

> Generated from LLM Workbench v2.3. Stable path
> `specs/S-008-publication-and-release-proof/SPEC.md`; never move between
> status folders.

**Spec ID:** S-008
**Status:** planned
**Priority:** 3
**Owner:** Kayden (release); Engineer unassigned
**Updated:** 2026-07-17
**Catalog description:** Publish only an approved show-ready commit and preserve reproducible preview, route, visual, privacy, version, and production proof.
**Blockers:** S-005 completion and explicit owner authorization for production deployment
**Latest event:** Canon harvest created the missing publication-proof capability and dependency-aware release slices.
**Next gate:** Complete S-005, then activate TK-001 to assemble the candidate proof bundle.

## Outcome

Kayden can identify the exact commit behind a show-ready preview or production
URL, verify all six teaching routes and fallback behavior, inspect a
sub-minute rehearsal artifact, and recover the published state from Git without
relying on an untraceable dashboard claim.

## Why It Matters

HTTP 200 and a successful platform check do not prove that the intended
presentation commit is live, readable, private, and rehearsable. Publication
proof is the final user-facing capability boundary, not an implicit side effect
of pushing a branch.

## Current Verified State

- `https://what-are-agents-presentation.vercel.app/`, `/manual`, and `/swarm`
  returned HTTP 200 on 2026-07-17.
- PR #9 targets `main` from `codex/presentation-friction-polish`; its current
  Vercel checks are successful and the remote branch matches local
  `b8d9c48` before this planning checkpoint.
- The repository documents v2.1.0 and a public Vercel URL, but no current stable
  capability spec owns deployed commit attestation, candidate artifact
  retention, or the final production proof packet.
- S-005/TK-002 is an in-progress presenter checkpoint with a known browser-test
  gap. Production deployment is therefore not yet eligible and remains
  explicitly owner-gated.

## Desired Behavior

- A candidate manifest binds branch, exact commit, version, preview URL,
  required environment-variable names, and the six-route/fallback test result.
- A clean preview passes lint, unit, build, doctor, warm E2E, console, and
  laptop/projector visual checks.
- A sub-minute artifact demonstrates the complete teaching story and records
  whether AI or fallback made planning decisions.
- A scoped scan proves that secrets, participant content, private screenshots,
  traces, and local generated output are absent from the publication diff.
- Only Kayden authorizes production deployment. After approval, the exact
  production URL and commit are verified and recorded with rollback guidance.

## Decisions And Contracts

- Git commit identity and repository evidence are canonical; platform status
  alone is insufficient.
- Preview validation and proof assembly are agent-safe once S-005 is complete.
- Production deployment, version/tag changes, and promotion to `main` remain
  explicit owner gates.
- Publication does not require live AI. Fallback is a supported, honestly
  labeled production path.
- Proof records URLs and commit IDs, never secret values or private runtime
  output.

## Non-Goals

- Automatic production deploys, credential changes, integration-to-main
  promotion, dependency upgrades, or adding a second release tracker.
- Redesigning the presentation during release proof.
- Treating a Vercel success badge or HTTP 200 alone as acceptance.

## Dependencies And Blockers

- S-005 must complete its presenter, readability, and jam rehearsal acceptance.
- S-007 supplies the fallback/provenance contract.
- S-004 may proceed separately; its major upgrade is not silently bundled into
  this release.
- Kayden must authorize production deployment and any version/tag change.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Freeze the show-ready candidate and assemble a commit/version/environment-name/privacy manifest with a one-command fallback rehearsal artifact | deferred | S-005 | pending |
| TK-002 | Verify the candidate preview across all six routes, API fallback, console, laptop/projector layouts, and rollback instructions | deferred | TK-001 | pending |
| TK-003 | After explicit approval, publish the exact candidate and record production URL-to-commit, route health, artifact, and recovery proof | blocked | TK-002, owner authorization for production deployment and version/tag choice | pending |

### Ticket Close Contracts

| Ticket | Done criteria | Required proof |
|---|---|---|
| S-008/TK-001 | Record the exact candidate branch, commit, version, preview URL, environment variable names without values, fallback rehearsal command, rollback point, and scoped publication file set; no secret/private/generated runtime artifact is included. | Git/upstream/diff outputs, version and preview metadata, scoped secret/file-set scan, and one repeatable fallback rehearsal command recorded in this spec. |
| S-008/TK-002 | On the exact candidate preview, all six routes and legacy redirects load; fallback APIs and provenance work; no console/page errors or critical laptop/projector overflow occurs; the preview URL acts as the sub-minute demo artifact. | Warm E2E, direct route health, 1366x768/1440x900/1920x1080 visual results, Vercel preview status, and recovery rehearsal. |
| S-008/TK-003 | Only after recorded owner approval, publish the unchanged candidate, tie production URL to exact commit/version, recheck all routes and fallback, and record rollback without exposing credentials. | Owner gate entry, deployment result, URL-to-commit attestation, post-publish route/fallback checks, artifact URL, and rollback command/result. |

## Acceptance Criteria

- [ ] Candidate branch, commit, version, preview URL, and environment variable
      names are recorded without values.
- [ ] Lint, unit, build, doctor, warm fallback E2E, console, and visual checks
      pass on the exact candidate.
- [ ] A sub-minute rehearsal artifact covers the teaching ladder, provenance,
      live work, human escalation, and final report.
- [ ] Publication diff and generated artifact checks find no secrets, private
      participant content, local traces, or untracked runtime output.
- [ ] Production deployment and any version/tag change have explicit owner
      approval.
- [ ] The final production URL is tied to the exact approved commit and all six
      routes plus fallback behavior are rechecked after publication.
- [ ] README, Runbook, Blueprint, and release evidence match the deployed state.

## Testing Seams

- Git ancestry, upstream, diff, secret/file-set, and version checks.
- Vercel preview checks plus direct route health for all six routes.
- Warm fallback E2E and laptop/projector visual matrix from `RUNBOOK.md`.
- Sub-minute browser artifact and explicit post-publish URL-to-commit proof.

## Verification Procedure

```bash
git status --short --branch
git rev-parse HEAD
git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}'
git diff --check
npm run lint
npm run test:unit
npm run build
node tools/spec-workbench.mjs doctor
npm run dev
# second terminal
E2E_BASE=http://localhost:3000 npm run test:e2e
```

Production commands remain intentionally absent until Kayden approves the exact
candidate and deployment action.

## Documentation Impact

- Update `README.md` for the verified version, canonical URL, and public
  rehearsal behavior.
- Update `RUNBOOK.md` only when publish, rollback, or verification commands
  change.
- Record candidate and production evidence here; do not use Taskboard as a
  release archive.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-17 | planning | Created the missing publication-proof capability from live Git, PR, route, and deployment evidence. | Local/remote checkpoint matched at `b8d9c48`; PR #9 Vercel checks were successful; public `/`, `/manual`, and `/swarm` returned HTTP 200. No deployed runtime SHA was inferred. | Added S-008 and the coverage matrix; existing publication controls remain in README and Runbook. | Complete S-005, assemble exact candidate proof, then obtain owner authorization before production deployment. |

## Completion Result

Pending.

## Remaining Limitations Or Follow-Up Specs

- Dependency remediation remains isolated in S-004.
- Live-AI production proof is optional; if requested, it requires credential
  and deployment authorization and must not expose environment values.

## Supersession

- Supersedes: publication follow-up formerly implicit in S-002 beta handoff and
  README publish prose
- Superseded by: none
