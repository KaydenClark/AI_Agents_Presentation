# AI_Agents_Presentation - Harness Feedback

> Generated from LLM Workbench v2.3. See `RUNBOOK.md` -> Upgrading The Harness.

This append-only log carries concrete friction in the Workbench control system
back upstream. Product bugs and tasks belong in stable specs and `TASKBOARD.md`.
Do not rewrite or delete prior rows.

| Date | Doc / section | What happened | Impact | Proposed change | Status |
|---|---|---|---|---|---|
| 2026-07-13 | evaluator CLI entry detection | Running a freshly cloned evaluator through `/tmp` on macOS exited 0 without output because the script compared `/tmp/...` with the resolved `/private/tmp/...` module URL. | medium - a silent pass can hide a missing audit report | Compare canonical real paths for direct-entry detection; until then invoke the realpath-resolved script. | new |
| 2026-07-13 | Adoption Phase 0 | The first adoption ran correctly in a dirty constrained-Git checkout, but its completed spec did not retain a reproducible fresh-clone command. | medium - later audit could not independently verify provenance from the canonical checkout | Require the owning spec and Runbook to record remote ref, fresh clone, commit, self-tests, and vendored-helper checksum. | new |
