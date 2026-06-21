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

  return `You are the Boss in a live demo about AI agent swarms.

The human instruction is fixed: "${instruction}".

House scenario: ${scenario.title}
Urgency: ${scenario.urgency}

Available Managers:
${managerLines}

Mess groups:
${groupLines}

Assign work to the Managers. Keep each Manager near their specialty unless another choice is clearly better. Balance urgency, workload, and escalation risk. Explain the decision in plain language for a non-technical audience.

Respond with ONLY a JSON object in this exact shape, no markdown:
{"assignments":[{"managerId":"KITCHEN","workGroups":["dishes","recycling"],"priority":1,"workload":7,"rationale":"short reason","escalationNotes":"short note"}]}`;
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no JSON object found");
  return JSON.parse(candidate.slice(start, end + 1));
}

function normalizeAssignments(
  parsed: unknown,
  scenario: ScenarioState,
  managers: ManagerState[],
): BossAssignment[] {
  const fallback = fallbackAssignments(scenario, managers);
  const byManager = new Map(fallback.map((a) => [a.managerId, a]));
  const raw = (parsed as { assignments?: unknown[] }).assignments ?? [];

  for (const item of raw) {
    const a = item as Partial<BossAssignment>;
    if (
      !a ||
      typeof a.managerId !== "string" ||
      !managers.some((m) => m.id === a.managerId)
    ) {
      continue;
    }
    byManager.set(a.managerId, {
      managerId: a.managerId,
      workGroups: Array.isArray(a.workGroups)
        ? a.workGroups.filter((g): g is string => typeof g === "string")
        : byManager.get(a.managerId)?.workGroups ?? [],
      priority: typeof a.priority === "number" ? a.priority : 3,
      workload: typeof a.workload === "number" ? a.workload : 0,
      rationale:
        typeof a.rationale === "string" && a.rationale.trim()
          ? a.rationale.trim()
          : byManager.get(a.managerId)?.rationale ?? "Assigned by fallback.",
      escalationNotes:
        typeof a.escalationNotes === "string" && a.escalationNotes.trim()
          ? a.escalationNotes.trim()
          : byManager.get(a.managerId)?.escalationNotes ??
            "No special escalation risk expected.",
    });
  }

  return managers.map((m) => byManager.get(m.id)!).sort((a, b) => a.priority - b.priority);
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
