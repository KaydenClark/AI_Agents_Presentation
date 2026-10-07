# AI_Agents_Presentation - Lexicon

> Generated from LLM Workbench v2.3.

**Last reviewed:** 2026-07-15
**Status:** active

This is the canonical lookup table for terms whose meaning is shared across the
project. Read it when a request, spec, test, or skill uses project language that
could be ambiguous.

## Ownership Rules

- Put project-wide definitions here; keep capability-specific terms in the
  owning spec until they become shared.
- Definitions belong here. Requirements and decisions remain in
  `BLUEPRINT.md` or the owning spec.
- Surface conflicts before changing an established definition.

## Workbench Terms

| Term | Definition | Distinction |
|---|---|---|
| **Design concept** | The shared understanding between the people and agents working on the presentation about what it is. | `BLUEPRINT.md` helps participants reconstruct it but is not itself the design concept. |
| **Spec** | A stable capability record containing intent, requirements, decisions, tickets, acceptance, verification, evidence, and completion. | It is durable capability truth, not a temporary issue or chat summary. |
| **Ticket** | A temporary, one-context vertical slice inside a spec. | It produces independently verifiable progress without becoming a second tracker. |

## Project Terms

| Term | Definition | Distinction / aliases to avoid |
|---|---|---|
| **Mode ladder** | The six-step progression from manual work through chat, tool use, one agent, a team, and a swarm. | Each mode adds one teaching capability; it is not six unrelated minigames. |
| **Swarm House** | The presenter-facing warehouse scenario where a Boss delegates to Managers and Agents, accepts live work, and escalates unresolved work. | It is a teaching model of coordinated agents, not a general colony simulator. |
| **Presenter Mode** | The concise audience-facing layer that exposes the next meaningful teaching beat while detailed operational logs remain secondary. | It is not a debug console or an autoplay video. |
| **Live work** | An item the presenter adds after the swarm has begun, which must be routed and included in the final report. | It is not pre-seeded scenario work. |
| **Collision integrity** | Every visible actor movement segment respects authored walls, doors, and openings throughout the actual runtime animation. | A static route fixture alone does not prove collision integrity. |

