# Presenting the AI Agent Swarm Game

A complete script for presenting this demo to a leadership or non-technical
audience: the story, a ~12-minute run-of-show with talking points, answers to
the questions executives actually ask, and a pre-demo checklist.

## The story in one paragraph

Everyone has used a chatbot; almost nobody has watched an AI *agent* work.
This demo climbs that ladder one rung at a time — you do the task yourself,
then chat about it, then hand the chat a tool, then hand an agent a goal, then
a team, then a whole hierarchy — so by the end the audience doesn't need the
definition explained. They've *seen* the difference: a chat window answers,
an agent finishes the job.

## Why this matters to the business (the framing slide)

Each game mode maps to a real level of AI adoption:

| Mode | In the demo | In the business |
|------|-------------|-----------------|
| Manual | You drag items yourself | Fully manual work — today's baseline |
| Chat Window | Good advice, room unchanged | Employees pasting answers out of a chatbot |
| Tool Use | One click, one action | AI-assisted tools: drafting, lookups, one-shot automations |
| Single Agent | One goal, self-finishing loop | Delegating a complete task: "handle this ticket end to end" |
| Small Team | Manager splits the goal | Orchestrating parallel AI workers on one deliverable |
| Swarm House | Boss plans, Managers adapt, humans handle jams | Autonomous operations with human-in-the-loop escalation |

Three durable takeaways to land:

1. **Output is not action.** The gap between mode 2 and mode 4 is where most
   of the value — and most of the risk — lives.
2. **Autonomy is a dial, not a switch.** You choose the rung per process.
3. **Well-designed autonomy escalates.** The most important feature of the
   swarm is the moment it *stops* and asks for a human.

## Run-of-show (~12 minutes)

**Setup (before anyone walks in):** open the live URL, run one Swarm House
test, confirm the Boss panel badge, then Reset. See the checklist at the end.

### Mode 1 — Manual Game (~1 min) · `/manual`

1. Drag the trash to the trash can, the cup to the sink, the book to the shelf.
2. Say: *"Right now, I'm the agent. Remember what this work feels like —
   everything else tonight is about handing it off."*

### Mode 2 — Chat Window (~1 min) · `/chat`

1. Submit the prompt, read the genuinely useful answer.
2. Point at the unchanged item counter: *"Great advice. Nothing happened.
   That's every chatbot your teams use today — output is not action."*

### Mode 3 — Tool Use (~1 min) · `/tool-use`

1. Submit `tidy the room`. One item gets handled.
2. Say: *"Now the chat has tools. But one ask still equals one action. It has
   help — it doesn't have a goal."*

### Mode 4 — Single Agent (~2 min) · `/agent`

1. Submit once. Then put your hands visibly away from the keyboard.
2. Narrate the loop as it runs: *"It picks the next task, does it, checks the
   room, repeats — and when the room is clean, it stops itself. One
   instruction from me, a finished job from it. That's an agent."*

### Mode 5 — Small Team (~2 min) · `/team`

1. Submit once. The Manager splits the goal across Agent A and Agent B.
2. Say: *"Same idea, but now the AI is also deciding who does what. Parallel
   work from one instruction."* Read the team report when it lands.

### Mode 6 — Swarm House (~4 min) · `/swarm` — the finale

1. Point out the map: Boss office, three Manager rooms, six Agents, and the
   **Human exit** marker.
2. Click **Submit**. Pause on *"Boss is deciding…"* — *"This exact moment is a
   real AI model making a real decision: it's allocating all of this work
   across three Managers."*
3. Open the **Boss decision** dropdown and read one rationale aloud. Watch the
   badge: `real AI decision` (or `fallback decision` if offline — see Q&A).
4. **Live curveball:** pick **Plate** from the palette and click around the
   house a few times. *"Work never stops arriving. Watch the Kitchen Manager
   absorb each one into a live agent's queue — no restart, no re-planning
   ceremony."*
5. **(Optional but powerful)** Tick **Presenter tools**, hit a zone's **Jam**
   button, and walk the escalation: Agent → Manager → Boss → red **Needs human
   input** banner. *"This is the feature I most want you to remember. A good
   autonomous system knows when to stop and ask a person."* Click **Resolve**.
6. When every zone reports in, read the **final report** — it's assembled from
   the work that actually happened, including the plates you added.

**Close:** *"A chat window answers. An agent finishes. And a well-built swarm
knows when to hand the problem back to a human. The question for us isn't
'chatbot or not' — it's which rung of this ladder each of our processes
belongs on."*

## Executive Q&A — likely questions, honest answers

**"How much does a run cost?"**
About four small model calls per swarm run (1 Boss + 3 Managers), each capped
by a timeout (8–12s) and a small token budget, on a mini-tier model. The
other five modes make zero model calls. Cost per full presentation is well
under a cent.

**"What happens if the AI or the Wi-Fi fails mid-demo?"**
The show continues. Every model call has a deterministic fallback planner that
honors the same contract, and the badge switches to `fallback decision` — the
system is honest about which brain made the call. This is a pattern worth
copying: graceful degradation plus provenance labeling.

**"Is our data safe in something like this?"**
This demo stores nothing — no database, no login, no analytics on user
content; each browser tab is an isolated session. The model API key lives
server-side only and is never exposed to the browser.

**"Can the AI go rogue?"**
Its authority is bounded by design. The AI decides *allocation* — which crew
does what, in what order — but a deterministic engine executes, the server
repairs any invalid plan (every task assigned exactly once, nobody idle), and
jams escalate to a human instead of retrying forever. Autonomy with rails.

**"Why is the AI only making 4 decisions? Why not have it drive everything?"**
Deliberate: "AI plans, engine executes." Planning is where the model adds
judgment; execution is where determinism adds reliability and predictable
latency. That division is exactly how you'd want production agent systems
shaped.

**"What would it take to apply this to a real workflow?"**
The shape transfers directly: bounded model calls at decision points, schema
validation and normalization on every response, deterministic fallbacks,
provenance badges, and a designed human escalation path. Swap "mess groups"
for tickets, invoices, or leads.

## Pre-demo checklist

- [ ] Open the production URL (or `npm run dev` locally) and load all six modes once.
- [ ] Run one full Swarm House pass; confirm the badge reads `real AI decision`
      if a key is configured. **Reset** afterward.
- [ ] If venue Wi-Fi is untrusted, decide upfront to present on fallbacks —
      every mode completes without a network; the badge just says so.
- [ ] Check the projector resolution; the layout is tuned for laptop/projector
      sizes. Tick **Low Power** on older machines.
- [ ] Have a second tab pre-loaded on `/swarm` as a hot spare.
- [ ] Share the URL at the end — each attendee's tab is a private session, so
      the audience can play immediately on their own laptops.

## Timing variants

- **5-minute version:** Manual (30s) → Chat (30s) → Single Agent (1.5 min) →
  Swarm House (2.5 min, skip the Jam). The ladder still reads.
- **Recruiter/interview walkthrough:** lead with the Swarm House, then open
  the code: `app/api/boss-plan/route.ts` (bounded AI + normalization),
  `components/sprites/SpriteEngine.ts` (React-decoupled canvas), and
  `tests/e2e.mjs` (48 browser checks). The README's architecture diagram is
  the map.
