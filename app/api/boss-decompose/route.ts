import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MODEL = process.env.AGENT_DEMO_MODEL || "claude-haiku-4-5-20251001";
// Keep the live demo snappy: bail to the fallback if the model is slow.
const TIMEOUT_MS = 12_000;

interface ZoneState {
  id: string;
  name: string;
  items: { kind: string; count: number }[];
}

interface DecomposeRequest {
  prompt: string;
  zones: ZoneState[];
}

interface ZoneInstruction {
  zoneId: string;
  instruction: string;
}

function pluralize(kind: string, count: number): string {
  if (count === 1) return kind;
  // "box" -> "boxes"; "dishes" is already plural; default add "s".
  if (kind.endsWith("s") || kind.endsWith("sh") || kind.endsWith("ch")) {
    return kind.endsWith("s") ? kind : `${kind}es`;
  }
  if (kind.endsWith("x")) return `${kind}es`;
  return `${kind}s`;
}

function describeZone(zone: ZoneState): string {
  const parts = zone.items
    .filter((i) => i.count > 0)
    .map((i) => `${i.count} ${pluralize(i.kind, i.count)}`);
  return parts.length ? parts.join(", ") : "nothing notable";
}

/**
 * Deterministic, hardcoded plan. Used whenever the real API call fails,
 * times out, or returns malformed JSON — so the live demo never breaks.
 */
function fallbackDecomposition(zones: ZoneState[]): ZoneInstruction[] {
  return zones.map((zone) => ({
    zoneId: zone.id,
    instruction: `Clear ${zone.name}: handle ${describeZone(
      zone,
    )}. Trash and spills go to disposal; boxes and pallets get stored. Report back when done.`,
  }));
}

function buildPrompt(prompt: string, zones: ZoneState[]): string {
  const zoneLines = zones
    .map((z) => `- ${z.name} (id "${z.id}"): ${describeZone(z)}`)
    .join("\n");

  return `You are the Boss of a warehouse cleaning crew. A human gave you this instruction:

"${prompt}"

There are ${zones.length} zones, each run by its own Manager. Current contents:
${zoneLines}

Break the human's instruction into ONE short, plain-language instruction per zone, tailored to what is actually in that zone. Each instruction should be one or two sentences a non-technical person can read aloud.

Respond with ONLY a JSON object in exactly this shape, no prose, no markdown fences:
{"decomposition":[{"zoneId":"<id>","instruction":"<text>"}]}`;
}

function extractJson(text: string): unknown {
  // Tolerate accidental markdown fences or stray prose around the JSON.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no JSON object found");
  return JSON.parse(candidate.slice(start, end + 1));
}

export async function POST(req: Request) {
  let body: DecomposeRequest;
  try {
    body = (await req.json()) as DecomposeRequest;
  } catch {
    return NextResponse.json(
      { decomposition: [], source: "fallback" },
      { status: 400 },
    );
  }

  const zones = body.zones ?? [];
  const prompt = body.prompt ?? "Clean the warehouse";

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      decomposition: fallbackDecomposition(zones),
      source: "fallback",
    });
  }

  try {
    const client = new Anthropic({ apiKey });

    const message = await Promise.race([
      client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        messages: [{ role: "user", content: buildPrompt(prompt, zones) }],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS),
      ),
    ]);

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("no text content");
    }

    const parsed = extractJson(textBlock.text) as {
      decomposition?: ZoneInstruction[];
    };

    const decomposition = (parsed.decomposition ?? []).filter(
      (d) => d && typeof d.zoneId === "string" && typeof d.instruction === "string",
    );

    // Make sure every zone got an instruction; backfill any gaps.
    const byZone = new Map(decomposition.map((d) => [d.zoneId, d]));
    const complete = zones.map(
      (z) =>
        byZone.get(z.id) ?? {
          zoneId: z.id,
          instruction: `Clear ${z.name}: ${describeZone(z)}.`,
        },
    );

    if (complete.length === 0) throw new Error("empty decomposition");

    return NextResponse.json({ decomposition: complete, source: "ai" });
  } catch (err) {
    // Log for the operator, but never surface an error to the audience.
    console.error("[boss-decompose] falling back:", err);
    return NextResponse.json({
      decomposition: fallbackDecomposition(zones),
      source: "fallback",
    });
  }
}
