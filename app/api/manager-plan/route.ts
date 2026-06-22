import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  fallbackManagerPlan,
  type ManagerId,
  type ManagerPlanAgent,
  type ManagerPlanJob,
  type ManagerPlanResult,
} from "@/lib/warehouseRules";

export const runtime = "nodejs";

const MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const TIMEOUT_MS = 8_000;
const MANAGER_IDS = new Set(["KITCHEN", "LAUNDRY", "OFFICE"]);

interface ManagerPlanRequest {
  managerId: ManagerId;
  managerName: string;
  instruction: string;
  jobs: ManagerPlanJob[];
  agents: ManagerPlanAgent[];
}

function buildPrompt(body: ManagerPlanRequest) {
  const jobs = body.jobs
    .map(
      (job) =>
        `- ${job.id}: workUnits=${job.workUnits ?? 1}; jammed=${job.jammed ? "yes" : "no"}`,
    )
    .join("\n");
  const agents = body.agents
    .map(
      (agent) =>
        `- ${agent.id}: ${agent.name ?? agent.id}; current queue length ${
          agent.queueLength ?? 0
        }; state ${agent.state ?? "idle"}`,
    )
    .join("\n");

  return `You are ${body.managerName} in a top-down AI-agent swarm game.
The Boss instruction is: "${body.instruction}".

Assign every job id to exactly one of your two agents. Prefer balanced queues and put jam-risk work where it will not leave the other agent idle.

Agents:
${agents}

Jobs:
${jobs || "- none"}

Respond with ONLY JSON in this exact shape:
{"agentQueues":[{"agentId":"agent-id","jobIds":["job-id"]}],"rationale":"short plain-English reason"}`;
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no JSON object found");
  return JSON.parse(candidate.slice(start, end + 1));
}

function normalizePlan(
  parsed: unknown,
  body: ManagerPlanRequest,
): ManagerPlanResult {
  const fallback = fallbackManagerPlan(body);
  const agentIds = new Set(body.agents.map((agent) => agent.id));
  const validJobIds = new Set(body.jobs.map((job) => job.id));
  const seen = new Set<string>();
  const queues = new Map(body.agents.map((agent) => [agent.id, [] as string[]]));

  const raw = (parsed as { agentQueues?: unknown[] }).agentQueues ?? [];
  for (const item of raw) {
    const queue = item as { agentId?: unknown; jobIds?: unknown };
    if (typeof queue.agentId !== "string" || !agentIds.has(queue.agentId)) {
      continue;
    }
    if (!Array.isArray(queue.jobIds)) continue;
    for (const jobId of queue.jobIds) {
      if (typeof jobId !== "string" || !validJobIds.has(jobId) || seen.has(jobId)) {
        continue;
      }
      queues.get(queue.agentId)?.push(jobId);
      seen.add(jobId);
    }
  }

  const missing = body.jobs.filter((job) => !seen.has(job.id));
  if (missing.length > 0) {
    const repair = fallbackManagerPlan({
      ...body,
      jobs: missing,
    });
    for (const repairQueue of repair.agentQueues) {
      queues.get(repairQueue.agentId)?.push(...repairQueue.jobIds);
    }
  }

  return {
    agentQueues: body.agents.map((agent) => ({
      agentId: agent.id,
      jobIds: queues.get(agent.id) ?? [],
    })),
    rationale:
      typeof (parsed as { rationale?: unknown }).rationale === "string" &&
      (parsed as { rationale?: string }).rationale?.trim()
        ? (parsed as { rationale: string }).rationale.trim()
        : fallback.rationale,
    source: "ai",
  };
}

export async function POST(req: Request) {
  let body: ManagerPlanRequest;
  try {
    body = (await req.json()) as ManagerPlanRequest;
  } catch {
    return NextResponse.json(
      { agentQueues: [], rationale: "Invalid request.", source: "fallback" },
      { status: 400 },
    );
  }

  if (
    !MANAGER_IDS.has(body.managerId) ||
    !Array.isArray(body.jobs) ||
    !Array.isArray(body.agents) ||
    body.agents.length === 0
  ) {
    return NextResponse.json(
      { ...fallbackManagerPlan(body), source: "fallback" },
      { status: 400 },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(fallbackManagerPlan(body));
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await Promise.race([
      client.responses.create({
        model: MODEL,
        input: buildPrompt(body),
        max_output_tokens: 700,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS),
      ),
    ]);

    const parsed = extractJson(response.output_text);
    return NextResponse.json(normalizePlan(parsed, body));
  } catch (err) {
    console.error("[manager-plan] falling back:", err);
    return NextResponse.json(fallbackManagerPlan(body));
  }
}
