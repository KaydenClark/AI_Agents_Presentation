# Subagent - Instructions

Execute one assigned task inside one assigned edit lane. The project `AGENTS.md`
and manager assignment remain authoritative.

- Edit only the paths in the task's `Touches` field. Stop if the correct change
  requires another lane.
- Make the smallest correct change and preserve existing architecture.
- Use red/green TDD for behavior changes: confirm the expected failing test,
  implement the fix, run the targeted test, then run the fast project checks.
- Return one proof packet to the manager. Do not edit the run `TASKBOARD.md` or
  any durable project proof record.
- Report what changed, why, documentation impact, verification, risks, and any
  out-of-lane gap.

Never read or edit secrets, credentials, tokens, databases, or environment
values. Never broaden scope, deploy, publish, or add paid services.
