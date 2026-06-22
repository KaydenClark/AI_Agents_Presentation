import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const TIMEOUT_MS = 12_000;

interface ScenarioGroup {
  id: string;
  label: string;
  managerId: string;
  room: string;
  quantity: number;
  workUnits: number;
  traits: string[];
}

interface ScenarioState {
  id: string;
  title: string;
  urgency: string;
  groups: ScenarioGroup[];
}

interface ManagerState {
  id: string;
  name: string;
  specialty: string;
  agentCount: number;
}

interface BossPlanRequest {
  instruction: string;
  scenario: ScenarioState;
  managers: ManagerState[];
}

interface BossAssignment {
  managerId: string;
  /** Authoritative: which mess-group ids this manager is responsible for. */
  groupIds: string[];
  /** Human-readable labels for those groups (for the decision panel). */
  workGroups: string[];
  priority: number;
  workload: number;
  rationale: string;
  escalationNotes: string;
}

function fallbackAssignments(
  scenario: ScenarioState,
  managers: ManagerState[],
): BossAssignment[] {
  return managers.map((manager, index) => {
    const groups = scenario.groups.filter((g) => g.managerId === manager.id);
    const labels = groups.map((g) => g.label);
    const workload = groups.reduce((sum, g) => sum + g.workUnits, 0);
    const risky = groups
      .flatMap((g) => g.traits)
      .filter((trait) => ["wet", "fragile", "unknown", "jam-risk"].includes(trait));

    return {
      managerId: manager.id,
      groupIds: groups.map((g) => g.id),
      workGroups: labels,
      priority: index + 1,
      workload,
      rationale: `${manager.name} gets the ${labels.join(
        ", ",
      )} work because it matches the ${manager.specialty.toLowerCase()} specialty and keeps the two agents focused.`,
      escalationNotes: risky.length
        ? `Watch for ${Array.from(new Set(risky)).join(", ")} items.`
        : "No special escalation risk expected.",
    };
  });
}

function buildPrompt(
  instruction: string,
  scenario: ScenarioState,
  managers: ManagerState[],
): string {
  const managerLines = managers
    .map(
      (m) =>
        `- ${m.id}: ${m.name}, specialty ${m.specialty}, ${m.agentCount} agents`,
    )
    .join("\n");
  const groupLines = scenario.groups
    .map(
      (g) =>
        `- ${g.id}: ${g.quantity} ${g.label} in ${g.room}; default manager ${g.managerId}; ${g.workUnits} work units; traits: ${
          g.traits.length ? g.traits.join(", ") : "none"
        }`,
    )
    .join("\n");

  return `You are the Boss in a game about AI agent swarms. Your plan actually drives the workers, so assign carefully.

The human instruction is fixed: "${instruction}".

House scenario: ${scenario.title}
Urgency: ${scenario.urgency}

Available Managers:
${managerLines}

Mess groups (assign by id):
${groupLines}

Assign EVERY mess group to exactly one Manager, by its group id. Rules:
- Every Manager must get at least one group — nobody sits idle.
- Every group must be assigned exactly once. Do not drop or duplicate a group.
- Prefer each Manager's specialty, but move flexible work (trash, recycling, room bins) between Managers to balance the total work units so nobody is overloaded.
- Order the Managers by priority (most urgent first).
- Explain each choice in plain language for a non-technical audience.

Respond with ONLY a JSON object in this exact shape, no markdown:
{"assignments":[{"managerId":"KITCHEN","groups":["dishes","recycling","kitchen-bin"],"priority":1,"rationale":"short reason","escalationNotes":"short note"}]}`;
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no JSON object found");
  return JSON.parse(candidate.slice(start, end + 1));
}

interface RawAssignment {
  managerId?: unknown;
  groups?: unknown;
  groupIds?: unknown;
  workGroups?: unknown;
  priority?: unknown;
  rationale?: unknown;
  escalationNotes?: unknown;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];
}

function normalizeAssignments(
  parsed: unknown,
  scenario: ScenarioState,
  managers: ManagerState[],
): BossAssignment[] {
  const groupById = new Map(scenario.groups.map((g) => [g.id, g]));
  const validIds = new Set(scenario.groups.map((g) => g.id));
  const managerIds = new Set(managers.map((m) => m.id));

  // 1) Read the model's group-id assignment (first claim wins per group).
  const ownerOf = new Map<string, string>();
  const rawByManager = new Map<string, RawAssignment>();
  const raw = (parsed as { assignments?: unknown[] }).assignments ?? [];
  for (const item of raw) {
    const a = item as RawAssignment;
    if (typeof a?.managerId !== "string" || !managerIds.has(a.managerId)) continue;
    rawByManager.set(a.managerId, a);
    const ids = [
      ...asStringArray(a.groups),
      ...asStringArray(a.groupIds),
      ...asStringArray(a.workGroups),
    ];
    for (const gid of ids) {
      if (validIds.has(gid) && !ownerOf.has(gid)) ownerOf.set(gid, a.managerId);
    }
  }

  // 2) Any unclaimed group falls back to its default (specialty) manager.
  for (const g of scenario.groups) {
    if (!ownerOf.has(g.id)) ownerOf.set(g.id, g.managerId);
  }

  const groupsOf = (managerId: string) =>
    [...ownerOf.entries()]
      .filter(([, m]) => m === managerId)
      .map(([gid]) => gid);

  // 3) Everyone contributes: no Manager may end up with zero work. Steal the
  //    lightest group from the busiest Manager that can spare one.
  for (const m of managers) {
    if (groupsOf(m.id).length > 0) continue;
    const donor = managers
      .map((d) => ({ id: d.id, groups: groupsOf(d.id) }))
      .filter((d) => d.groups.length > 1)
      .sort((x, y) => y.groups.length - x.groups.length)[0];
    if (!donor) continue;
    const lightest = donor.groups
      .map((gid) => ({ gid, wu: groupById.get(gid)?.workUnits ?? 0 }))
      .sort((a, b) => a.wu - b.wu)[0];
    ownerOf.set(lightest.gid, m.id);
  }

  // 4) Build each Manager's assignment with labels/workload from real groups.
  return managers
    .map((m, index) => {
      const gids = groupsOf(m.id);
      const groups = gids
        .map((gid) => groupById.get(gid))
        .filter((g): g is ScenarioGroup => Boolean(g));
      const labels = groups.map((g) => g.label);
      const workload = groups.reduce((sum, g) => sum + g.workUnits, 0);
      const risky = groups
        .flatMap((g) => g.traits)
        .filter((t) => ["wet", "fragile", "unknown", "jam-risk", "sticky"].includes(t));
      const aiRaw = rawByManager.get(m.id);
      return {
        managerId: m.id,
        groupIds: gids,
        workGroups: labels,
        priority: typeof aiRaw?.priority === "number" ? aiRaw.priority : index + 1,
        workload,
        rationale:
          typeof aiRaw?.rationale === "string" && aiRaw.rationale.trim()
            ? aiRaw.rationale.trim()
            : `${m.name} handles ${labels.join(", ") || "support work"}.`,
        escalationNotes:
          typeof aiRaw?.escalationNotes === "string" && aiRaw.escalationNotes.trim()
            ? aiRaw.escalationNotes.trim()
            : risky.length
              ? `Watch for ${Array.from(new Set(risky)).join(", ")}.`
              : "No special escalation risk expected.",
      };
    })
    .sort((a, b) => a.priority - b.priority);
}

export async function POST(req: Request) {
  let body: BossPlanRequest;
  try {
    body = (await req.json()) as BossPlanRequest;
  } catch {
    return NextResponse.json(
      { assignments: [], source: "fallback" },
      { status: 400 },
    );
  }

  const instruction = body.instruction || "Clean the house";
  const scenario = body.scenario;
  const managers = body.managers ?? [];

  if (!scenario || managers.length === 0) {
    return NextResponse.json(
      { assignments: [], source: "fallback" },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      assignments: fallbackAssignments(scenario, managers),
      source: "fallback",
    });
  }

  try {
    const client = new OpenAI({ apiKey });
    const response = await Promise.race([
      client.responses.create({
        model: MODEL,
        input: buildPrompt(instruction, scenario, managers),
        max_output_tokens: 1200,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS),
      ),
    ]);

    const text = response.output_text;
    if (!text.trim()) throw new Error("no text content");

    const parsed = extractJson(text);
    const assignments = normalizeAssignments(parsed, scenario, managers);
    if (assignments.length === 0) throw new Error("empty assignments");

    return NextResponse.json({ assignments, source: "ai" });
  } catch (err) {
    console.error("[boss-plan] falling back:", err);
    return NextResponse.json({
      assignments: fallbackAssignments(scenario, managers),
      source: "fallback",
    });
  }
}
