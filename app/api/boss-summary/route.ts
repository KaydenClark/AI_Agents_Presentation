import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const TIMEOUT_MS = 12_000;

interface ZoneResult {
  name: string;
  itemsCleared: number;
  escalationsResolved: number;
  neededHuman: boolean;
}

interface SummaryRequest {
  zones: ZoneResult[];
}

function fallbackSummary(zones: ZoneResult[]): string {
  const lines = zones.map((z) => {
    let line = `${z.name}: ${z.itemsCleared} items cleared`;
    if (z.escalationsResolved > 0) {
      line += `, ${z.escalationsResolved} escalation${
        z.escalationsResolved === 1 ? "" : "s"
      } resolved by manager`;
    }
    if (z.neededHuman) line += " (human input required)";
    return line + ".";
  });
  const anyHuman = zones.some((z) => z.neededHuman);
  lines.push(
    anyHuman
      ? "Some items required human input."
      : "No items required human input.",
  );
  return lines.join("\n");
}

function buildPrompt(zones: ZoneResult[]): string {
  const lines = zones
    .map(
      (z) =>
        `- ${z.name}: ${z.itemsCleared} items cleared, ${z.escalationsResolved} escalations resolved by the manager${
          z.neededHuman ? ", required human input" : ""
        }`,
    )
    .join("\n");

  return `You are the Boss of a warehouse operations crew reporting results back to the human who gave the original instruction. Here is what each zone reported:
${lines}

Write a short, plain-language final report (3-5 lines). One line per zone summarizing what was cleared and any escalations, then a closing line stating whether any items required human input. No markdown, no preamble — just the report text.`;
}

export async function POST(req: Request) {
  let body: SummaryRequest;
  try {
    body = (await req.json()) as SummaryRequest;
  } catch {
    return NextResponse.json(
      { summary: "", source: "fallback" },
      { status: 400 },
    );
  }

  const zones = body.zones ?? [];
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      summary: fallbackSummary(zones),
      source: "fallback",
    });
  }

  try {
    const client = new OpenAI({ apiKey });

    const response = await Promise.race([
      client.responses.create({
        model: MODEL,
        input: buildPrompt(zones),
        max_output_tokens: 512,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS),
      ),
    ]);

    const text = response.output_text.trim();
    if (!text) {
      throw new Error("no text content");
    }

    return NextResponse.json({ summary: text, source: "ai" });
  } catch (err) {
    console.error("[boss-summary] falling back:", err);
    return NextResponse.json({
      summary: fallbackSummary(zones),
      source: "fallback",
    });
  }
}
