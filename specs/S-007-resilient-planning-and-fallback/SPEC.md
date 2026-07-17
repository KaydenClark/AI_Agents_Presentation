# S-007 - Resilient Planning And Honest Fallback

> Generated from LLM Workbench v2.3. Stable path
> `specs/S-007-resilient-planning-and-fallback/SPEC.md`; never move between
> status folders.

**Spec ID:** S-007
**Status:** complete
**Priority:** 1
**Owner:** Kayden (product)
**Updated:** 2026-07-17
**Catalog description:** Keep bounded AI planning, deterministic execution, honest fallback, provenance, and browser-local privacy as one reliable demo capability.
**Blockers:** none
**Latest event:** Spec completed and removed from the hot board.
**Next gate:** none

## Outcome

Swarm House can use real AI for bounded allocation decisions without allowing
network, model, malformed-output, or credential failures to break the
audience-facing run. The UI states whether AI or fallback planned the work, and
the deterministic engine remains the execution authority.

## Why It Matters

Live presentation reliability and honest provenance are the central proof
behind the teaching story. A demo that hides failure, leaks a key, or lets
unvalidated model output drive animation would teach the wrong architecture.

## Current Verified State

- `/api/boss-plan` validates requests, bounds one optional server-side model
  call to 12 seconds, extracts JSON defensively, repairs allocation coverage,
  and falls back deterministically.
- `/api/manager-plan` validates Manager, job, and Agent inputs; bounds each of
  three optional Manager calls to 8 seconds; repairs missing or duplicate job
  assignments; and falls back to shared local rules.
- `WarehouseScene.tsx` uses planning results to seed deterministic local queues,
  executes movement and work locally, and assembles the final report from
  completed local state.
- `OPENAI_API_KEY` is read only in server routes. Browser tabs hold isolated
  in-memory state; no participant content database or shared session exists.
- S-002 recorded a complete fallback-only API and six-mode E2E pass. The
  current E2E suite still asserts malformed-request rejection, fallback/AI
  provenance, complete job coverage, and final-report accounting.

## Desired Behavior

- Real AI planning remains optional, bounded, normalized, and server-side.
- Missing credentials, timeouts, exceptions, malformed JSON, invalid IDs,
  duplicates, or omitted work produce a valid fallback-backed plan.
- Every group and job is assigned exactly once and every Manager contributes.
- The audience sees `real AI decision` or `fallback decision`; the system never
  implies a model was used when fallback made the decision.
- The deterministic engine executes all work and creates reports from actual
  completed state, including live work and human escalation.
- Browser sessions remain isolated and no secret or participant content is
  persisted by the app.

## Decisions And Contracts

- “AI plans, engine executes” is the fixed architecture boundary.
- One Boss call plus one call for each of three Managers is the normal maximum
  per Swarm run. More model calls require owner approval and a superseding spec.
- Both AI and fallback responses use the same normalized client contract.
- The first five teaching modes make zero model calls.
- `OPENAI_MODEL` is configurable server-side; its current default is an
  operational detail, not a public client contract.
- Vercel page analytics may measure page usage, but user prompt/content state
  is not persisted or sent as product analytics.

## Non-Goals

- Model-driven per-frame movement, autonomous retries without bounds, storing
  participant content, adding auth, or adding a database.
- Live-AI production verification without explicit credential and deployment
  authorization.
- Presenter layout and jam rehearsal, which belong to S-005.

## Dependencies And Blockers

- Depends on the Next.js server route boundary, OpenAI SDK, shared
  `warehouseRules`, and the Warehouse local state machine.
- No open blocker for the implemented fallback-first contract.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Validate, normalize, and fallback one authoritative Boss allocation call | done | none | `app/api/boss-plan/route.ts` plus malformed JSON and complete three-Manager assignment browser probes. |
| TK-002 | Validate, normalize, repair, and fallback each Manager queue split | done | TK-001 | `app/api/manager-plan/route.ts`, `lib/warehouseRules.ts`, unit rules, and complete-job browser probes. |
| TK-003 | Label AI versus fallback provenance while preserving the bounded four-call budget | done | TK-001, TK-002 | Server responses carry `source`; Manager and Boss badges plus S-002 fallback-only proof exercise the audience-visible provenance path. |
| TK-004 | Execute normalized plans locally and build the final report from completed work | done | TK-003 | `WarehouseScene.tsx` deterministic queues, movement, live-work routing, rebalancing, escalation, and `localFinalReport` plus browser report assertions. |
| TK-005 | Preserve server-only secrets and isolated in-memory browser sessions | done | TK-004 | Server-only environment access, no product database/auth/session store, browser-local React state, `.env` guardrails, and committed secret-scan rules. |

### Ticket Close Contracts

| Ticket | Done criteria | Required proof |
|---|---|---|
| S-007/TK-001 | Valid Boss input assigns every group exactly once across all Managers; invalid JSON, missing key, timeout, exception, and malformed output return a valid fallback-shaped result. | Boss route unit/source seam plus valid and malformed browser API probes with `source`. |
| S-007/TK-002 | Each Manager plan covers every submitted job exactly once across two valid Agents; missing/duplicate/invalid assignments are repaired or replaced by deterministic fallback. | Warehouse-rule unit cases and Manager API coverage/malformed probes. |
| S-007/TK-003 | One Swarm run stays within the Boss-plus-three-Manager call budget and visibly labels every planning result as AI or fallback. | Instrumented request count or route contract inspection plus audience-visible provenance checks. |
| S-007/TK-004 | Only normalized local queues drive actors; live work, rebalancing, escalation, and final report reflect completed local state. | Unit rules and browser assertions for live additions, human help, manager completion, and report text. |
| S-007/TK-005 | Secrets are read only by server routes; no participant work database/shared session exists; committed and generated publication inputs contain no secret values. | Server/client import and environment scan, manifest/source check, and scoped secret/file-set scan. |

## Acceptance Criteria

- [x] Boss and Manager inputs are validated before model use.
- [x] Model output is parsed defensively and repaired to complete, unique
      assignments.
- [x] Every model boundary has a deterministic same-contract fallback.
- [x] Normal Swarm operation is bounded to about one Boss and three Manager
      calls.
- [x] Provenance is visible to the audience.
- [x] The local engine, not model output, owns movement, completion, and report
      truth.
- [x] The API key remains server-side and participant work is not persisted.
- [x] Fallback-only operation can complete the teaching experience.

## Testing Seams

- Browser API probes cover valid and malformed Boss/Manager requests, coverage,
  provenance, and final report accounting.
- `tests/warehouseRules.test.mts` covers fallback planning, live assignment,
  and rebalancing.
- Build and lint protect server/client environment boundaries.
- S-005 owns the end-to-end presenter checkpoint currently being repaired.

## Verification Procedure

```bash
npm run lint
npm run test:unit
npm run build
node tools/spec-workbench.mjs doctor
npm run dev
# second terminal, leave OPENAI_API_KEY blank for deterministic proof
E2E_BASE=http://localhost:3000 npm run test:e2e
```

## Documentation Impact

- `BLUEPRINT.md` owns the cross-cutting architecture summary.
- `README.md` explains the public architecture and fallback behavior.
- `RUNBOOK.md` owns environment, privacy, and fallback operations.
- This spec now owns the durable resilience and provenance contract.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-17 | spec | Captured the shipped resilient-planning architecture as one durable capability record. | Reviewed both API routes, Warehouse orchestration, shared rules, manifest, unit seams, browser API checks, completed S-002 fallback proof, and server-only environment access. | Added S-007 and mapped every resilience/privacy item in the Blueprint coverage matrix. | Live-AI production proof remains optional and authorization-gated; fallback is the supported rehearsal path. |

## Completion Result

The implemented planning, normalization, deterministic fallback, provenance,
execution, and privacy boundary now has stable spec ownership and imported
proof. No runtime behavior changed during this capture.

## Remaining Limitations Or Follow-Up Specs

- S-005 owns presenter rehearsal and readability.
- S-008 owns preview, deployed-candidate, and production publication proof.
- S-004 owns any approved framework security upgrade.

## Supersession

- Supersedes: fallback and live-AI capability detail formerly held only as
  release evidence in S-002
- Superseded by: none
