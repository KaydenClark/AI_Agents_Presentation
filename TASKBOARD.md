# AI_Agents_Presentation - Hot Taskboard

> Generated from LLM Workbench v2.3.

**Current focus:** Keep the v2.1 beta stable for live walkthroughs and hand off
remaining polish without disturbing unrelated dirty work.
**Owner:** Kayden; execution owner selected per spec
**Last updated:** 2026-07-13

This is an active execution projection, not a requirements store or proof
archive. Use `node tools/spec-workbench.mjs next` to select work and load only
its linked spec. Commands live in `RUNBOOK.md`.

## Active Specs

<!-- hot-specs:start -->
| Spec | Current slice | Owner | Blocker | Latest meaningful event | Next gate |
|---|---|---|---|---|---|
| [S-002](specs/S-002-v2-1-beta-readiness/SPEC.md) | Acceptance / owner gate | Codex | none | TK-003 closed with proof. | Confirm acceptance criteria and completion result. |
<!-- hot-specs:end -->

Completed specs disappear from this projection immediately. Their requirements,
decisions, acceptance, proof, completion, and supersession remain in the stable
spec linked from `BLUEPRINT.md`.

## Owner Decisions

Only decisions blocking an active spec appear here.

| Spec | Decision | Options | Recommendation | Cost / impact | Owner | Next gate |
|---|---|---|---|---|---|---|
| S-002 | Does the walkthrough require live OpenAI decisions? | fallback-safe demo / replace and verify production key | Use fallback unless live AI is a presentation requirement. | Live verification requires secret rotation plus explicit deployment authorization. | Kayden | Confirm requirement before deployment work. |
