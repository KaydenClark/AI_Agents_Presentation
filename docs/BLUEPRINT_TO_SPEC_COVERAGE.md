# Blueprint-to-Spec Coverage Matrix

**Project:** AI_Agents_Presentation
**Harvest date:** 2026-07-17
**Canonical branch reviewed:** `codex/presentation-friction-polish`
**Baseline checkpoint reviewed:** `b8d9c48`
**Purpose:** prove that every meaningful current product capability has one
stable spec owner.

This is a coverage audit, not a task tracker. The “Harvest classification”
column records the evidence-backed state before this conversion. “Final owner”
records the durable owner after the conversion. Tickets, blockers, acceptance,
and proof remain only in the linked stable specs.

## Classification Rules

- **covered by a current stable spec** - a cohesive stable spec already owned
  the capability.
- **implemented but missing a durable capability spec** - live source or
  runtime implemented it, but the spec catalog held only implicit or release
  evidence.
- **settled but not implemented and missing a spec** - canon settled the
  requirement but implementation/proof was absent.
- **contradicted by live source** - maintained prose described behavior that
  current source no longer followed.
- **superseded** - retained history is not current capability ownership.
- **unresolved owner decision** - the requirement is owned, but the named
  decision remains an explicit gate.

## Coverage Matrix

| ID | Canonical capability or invariant | Live evidence reviewed | Harvest classification | Final owner and disposition |
|---|---|---|---|---|
| TL-01 | One ordered manual → chat → tool → agent → team → swarm teaching ladder | `app/page.tsx`, six route pages, README | implemented but missing a durable capability spec | [S-006](../specs/S-006-six-mode-teaching-ladder/SPEC.md), complete |
| TL-02 | Landing exposes all six lessons as one progression | landing source and browser checks | implemented but missing a durable capability spec | S-006/TK-001, complete |
| TL-03 | Manual requires direct item placement and teaches recovery from wrong drops | `ManualDragGame.tsx`, Manual browser checks | implemented but missing a durable capability spec | S-006/TK-002, complete |
| TL-04 | Chat produces useful output without changing room state | `ChatWindowScene.tsx`, unchanged-count check | implemented but missing a durable capability spec | S-006/TK-003, complete |
| TL-05 | Tool Use performs exactly one external action per submit | `RoomScene.tsx`, submit-count checks | implemented but missing a durable capability spec | S-006/TK-004, complete |
| TL-06 | Single Agent receives one goal, loops, and self-terminates | `RoomScene.tsx`, agent loop/lock checks | implemented but missing a durable capability spec | S-006/TK-005, complete |
| TL-07 | Small Team Manager splits work across two Agents | `SmallTeamScene.tsx`, team report/path checks | implemented but missing a durable capability spec | S-006/TK-006, complete |
| TL-08 | Swarm House visibly adds Boss, Managers, Agents, adaptation, escalation, and reporting | `WarehouseScene.tsx`, Swarm browser checks | implemented but missing a durable capability spec | S-006/TK-007, complete |
| TL-09 | Legacy `/room` and `/warehouse` links redirect to current modes | route source and browser redirect checks | implemented but missing a durable capability spec | S-006/TK-001, complete |
| TL-10 | Product remains browser-local with no auth, database, multiplayer, or shared session | Blueprint non-goals, source/manifests | implemented but missing a durable capability spec | S-006 and S-007 privacy boundary, complete |
| TL-11 | Original generated sprite assets and imperative canvas rendering support the playable ladder | sprite source, pipeline, engine, asset tests | implemented but missing a durable capability spec | S-006 contracts and TK-008 proof, complete |
| RS-01 | AI plans while deterministic code executes | both API routes, `WarehouseScene.tsx` | implemented but missing a durable capability spec | [S-007](../specs/S-007-resilient-planning-and-fallback/SPEC.md), complete |
| RS-02 | One bounded authoritative Boss allocation call validates and normalizes complete coverage | Boss route and API browser probe | implemented but missing a durable capability spec | S-007/TK-001, complete |
| RS-03 | Three bounded Manager queue calls validate, repair, and cover every job | Manager route, warehouse rules, browser probe | implemented but missing a durable capability spec | S-007/TK-002, complete |
| RS-04 | Missing key, timeout, exception, or malformed output uses same-contract deterministic fallback | routes, rules, S-002 fallback proof | implemented but missing a durable capability spec | S-007/TK-001 through TK-003, complete |
| RS-05 | Audience sees honest AI/fallback provenance | API `source`, Boss/Manager badges, E2E | implemented but missing a durable capability spec | S-007/TK-003, complete |
| RS-06 | Final report derives from completed local work, live additions, and human help | `localFinalReport`, report browser checks | implemented but missing a durable capability spec | S-007/TK-004, complete |
| RS-07 | API key stays server-side and participant work is not persisted | route env access, layout, in-memory state | implemented but missing a durable capability spec | S-007/TK-005, complete |
| RS-08 | Full teaching path remains supportable in fallback-only mode | S-002 proof, current API/E2E seams | implemented but missing a durable capability spec | S-007 acceptance, complete |
| SH-01 | Runtime movement respects authored walls, doors, and openings | pathing source/tests, S-005/TK-001 proof | covered by a current stable spec | [S-005](../specs/S-005-presentation-show-readiness/SPEC.md)/TK-001, done |
| SH-02 | Presenter Mode communicates current phase and next teaching beat | presenter cue source and S-005 | covered by a current stable spec | S-005/TK-002 and TK-003 |
| SH-03 | Safe live-work checkpoint keeps palette and Reset until explicit finish | current checkpoint source/test/spec | covered by a current stable spec | S-005/TK-002, in progress |
| SH-04 | Live work remains repeatable without reset or palette reselection | Warehouse state and browser checks | covered by a current stable spec | S-005/TK-002 |
| SH-05 | Jam controls demonstrate Agent → Manager → Boss → human escalation and resolution | Warehouse source and jam browser seam | covered by a current stable spec | S-005/TK-005, explicit final rehearsal |
| SH-06 | Boss, Manager, Agent, work, escalation, and report states read at presenter distance | S-005 user stories and visual seams | covered by a current stable spec | S-005/TK-003 |
| SH-07 | Every game interaction earns a teaching role | S-005 decision and acceptance | covered by a current stable spec | S-005/TK-004 |
| SH-08 | Keyboard controls, accessible names, stable selectors, laptop/projector layouts, and Low Power remain usable | AGENTS, E2E selectors, Visual QA, source | covered by a current stable spec | S-005/TK-003 through TK-005 |
| SH-09 | Complete fallback jam rehearsal starts fresh and reaches resolved report | current test starts jam after immutable final report | covered by a current stable spec | S-005 materially updated with TK-005; blocked on TK-002 through TK-004 |
| SH-10 | Run-of-show uses the safe checkpoint, explicit finish, and correct Reset/reload behavior | `PRESENTATION.md` versus checkpoint source | contradicted by live source | Canon corrected in `PRESENTATION.md`; S-005 owns completion proof |
| SH-11 | Browser contract count matches the maintained suite | README said 48 while source contains 63 checks | contradicted by live source | README corrected to 63; S-006/TK-008 owns ladder proof |
| PB-01 | Public Vercel experience and canonical URL exist | public `/`, `/manual`, `/swarm` returned HTTP 200 | implemented but missing a durable capability spec | [S-008](../specs/S-008-publication-and-release-proof/SPEC.md), planned |
| PB-02 | Published URL is tied to exact commit, branch, and version | Git/PR checks did not prove production runtime SHA | settled but not implemented and missing a spec | S-008/TK-001 and TK-003 |
| PB-03 | Exact candidate has six-route, fallback, console, visual, and rollback proof | Runbook seams exist; no current candidate packet | settled but not implemented and missing a spec | S-008/TK-001 and TK-002 |
| PB-04 | Sub-minute rehearsal artifact proves ladder, live work, escalation, provenance, and report | milestone rule exists; no current candidate artifact | settled but not implemented and missing a spec | S-008/TK-001 and TK-002 |
| PB-05 | Publication diff excludes secrets, participant content, traces, and local output | guardrails exist; no current candidate scan packet | settled but not implemented and missing a spec | S-008/TK-001 |
| PB-06 | Production deployment and version/tag choice require Kayden approval | root/project rules and Blueprint deployment gate | unresolved owner decision | S-008/TK-003; gate remains explicit |
| DP-01 | Next.js/PostCSS security target and regression scope are isolated from product polish | audit evidence and S-004 | covered by a current stable spec | [S-004](../specs/S-004-next-dependency-remediation/SPEC.md), owner-blocked |
| CP-01 | Workbench v2.3 lifecycle, stable specs, generated Taskboard, and proof archive are adopted | controls, helper, S-001/S-003 | covered by a current stable spec | S-001 and S-003, complete |
| CP-02 | Retired Roadmap/Blueprint history is evidence, not a second live queue | archive files, S-001/S-003 | superseded | S-001/S-003 preserve history; current controls remain canonical |
| CP-03 | Completed S-002 remains release evidence rather than umbrella ownership of current capabilities | S-002 completion and narrow catalog description | superseded | S-005 through S-008 now own current capabilities; S-002 stays immutable history |

## Final Coverage Result

- Meaningful canon items: **40**
- Final items with stable spec ownership: **40**
- Uncovered settled items: **0**
- Unjustified exceptions: **0**
- New stable specs: **3** (`S-006`, `S-007`, `S-008`)
- Materially updated stable specs: **1** (`S-005`)
- New dependency-aware tickets: **17** (16 in new specs plus `S-005/TK-005`)
- New needs-scope tickets: **0**

## Owner Choices

1. `S-004/TK-001`: approve the supported major Next.js upgrade target and
   migration scope before dependency files change.
2. `S-008/TK-003`: after candidate proof is complete, authorize or reject the
   exact production deployment and version/tag choice.

Neither owner choice blocks the existing `S-005/TK-002` implementation
checkpoint. That checkpoint remains the smallest safe Engineer continuation.
