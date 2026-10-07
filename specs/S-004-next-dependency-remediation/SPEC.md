# S-004 - Next Dependency Remediation

> Generated from LLM Workbench v2.3. This file stays at
> `specs/S-004-next-dependency-remediation/SPEC.md`.

**Spec ID:** S-004
**Status:** planned
**Priority:** 2
**Owner:** Kayden / agent
**Updated:** 2026-07-13
**Catalog description:** Upgrade the Next.js dependency line in isolation after confirming the supported security target and full regression scope.
**Blockers:** owner approval for a major framework upgrade
**Latest event:** Read-only production audit isolated two advisories to the Next.js dependency line.
**Next gate:** Approve the isolated upgrade target and implementation scope.

## Outcome

The project moves to a supported Next.js dependency line that resolves the
recorded production advisories without mixing framework migration risk into
presentation polish.

## Why It Matters

The current production dependency audit reports one high-severity direct
Next.js advisory and one moderate transitive PostCSS advisory. The available
automated remediation crosses a major Next.js version, so it requires an
isolated change with deliberate compatibility proof.

## Current Verified State

- `npm audit --omit=dev --json` on 2026-07-13 reports 2 production
  vulnerabilities: 1 high and 1 moderate.
- The direct finding is `next`; the transitive finding is `postcss`.
- npm reports the available remediation through Next.js `16.2.10` and marks it
  as a SemVer-major change.
- No dependency manifests or lockfiles were changed during S-002.

## Desired Behavior

- Select the supported target from official Next.js security/release guidance
  at execution time.
- Preserve the six-mode ladder, App Router routes, server-only OpenAI key,
  fallback behavior, canvas engine, and Vercel deployment shape.
- Resolve the audit findings without suppressing or ignoring advisories.
- Reverify all API, browser, build, and visual contracts after the upgrade.

## Decisions And Contracts

- This spec is separate from presentation-friction and live-AI work.
- Dependency manifest and lockfile changes require approved upgrade scope.
- Do not use an automated force fix without reviewing the major-version
  migration and release notes.
- Deployment remains separately approval-gated.

## Non-Goals

- Product redesign, new AI calls, auth, persistence, or unrelated package
  modernization.
- Production deployment as part of dependency implementation.
- Silencing audit output without removing or accepting the documented risk.

## Dependencies And Blockers

- Kayden must approve the major-version upgrade scope.
- The target version and migration requirements must be refreshed from official
  sources immediately before implementation.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Confirm the supported Next.js security target and migration delta | blocked | owner approval for major framework upgrade | pending |
| TK-002 | Upgrade Next.js/PostCSS with regression tests and compatibility fixes | deferred | TK-001 | pending |
| TK-003 | Run full browser, visual, audit, and documentation proof | deferred | TK-002 | pending |

## Acceptance Criteria

- [ ] Official security and migration guidance supports the selected target.
- [ ] A pre-upgrade audit baseline is captured without exposing private data.
- [ ] Dependency and lockfile changes are limited to the approved upgrade.
- [ ] Lint, unit tests, type/build, doctor, and warm E2E pass.
- [ ] All six modes pass the laptop/projector visual matrix.
- [ ] `npm audit --omit=dev` reports no unresolved finding covered by this spec,
      or an explicit owner-approved residual risk is documented.
- [ ] README, Runbook, Blueprint, and this spec match the verified runtime.

## Testing Seams

- Next.js build/type checks catch App Router and config incompatibilities.
- E2E covers redirects, API validation, all six teaching modes, fallback
  planning, live drops, escalation, and browser console errors.
- Visual QA covers 1366x768, 1440x900, and 1920x1080.

## Verification Procedure

```bash
npm audit --omit=dev
npm run lint
npm run test:unit
npm run build
node tools/spec-workbench.mjs doctor
npm run dev
# second terminal
npm run test:e2e
```

## Documentation Impact

- Update dependency/runtime versions in `BLUEPRINT.md`, `README.md`, and
  `RUNBOOK.md` only after the selected upgrade is verified.
- Record exact audit and compatibility proof in this spec.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-13 | spec | Created an isolated dependency-remediation capability record from S-002 triage. | `npm audit --omit=dev --json`: 1 high direct Next.js finding, 1 moderate transitive PostCSS finding; available fix reported as Next.js 16.2.10 SemVer-major. | S-002 records the isolation decision; Blueprint catalog pending render. | Owner approval, current official guidance review, implementation, and full proof. |

## Completion Result

Pending.

## Remaining Limitations Or Follow-Up Specs

- Deployment remains a separate owner-gated action after this spec completes.

## Supersession

- Supersedes: dependency-remediation follow-up formerly held in S-002 TK-003
- Superseded by: none
