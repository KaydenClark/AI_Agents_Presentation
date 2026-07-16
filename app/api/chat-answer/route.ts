import OpenAI from "openai";
import type {
  Response as OpenAIResponse,
  ResponseInputContent,
} from "openai/resources/responses/responses";
import { NextResponse } from "next/server";
import {
  describeChatRoom,
  fallbackChatAnswer,
} from "@/lib/chatRoom";

export const runtime = "nodejs";

const MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const TIMEOUT_MS = 12_000;
const MAX_PROMPT_LENGTH = 500;
const MAX_IMAGE_LENGTH = 1_500_000;

interface ChatAnswerRequest {
  prompt?: unknown;
  roomImage?: unknown;
}

function cleanPrompt(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, MAX_PROMPT_LENGTH);
}

function cleanRoomImage(value: unknown) {
  if (typeof value !== "string") return null;
  if (value.length > MAX_IMAGE_LENGTH) return null;
  if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(value)) return null;
  return value;
}

function buildPrompt(userPrompt: string) {
  return `You are the chat-window mode in a small top-down game about AI agents.

The user is asking about the room. You can inspect the room data and image, but you cannot take actions, call tools, or mutate the room.

Rules:
- Answer the user's question directly and concisely.
- Use the room data as the source of truth if the image is ambiguous.
- If the user asks to clean, tidy, organize, or pick up the room, say what needs to be picked up and include one sentence that starts exactly: "First item I would pick up:"
- Never claim that you moved an item or changed the item count.
- Keep the answer to 2-4 short sentences.

User prompt: "${userPrompt}"

${describeChatRoom()}`;
}

export async function POST(req: Request) {
  let body: ChatAnswerRequest;
  try {
    body = (await req.json()) as ChatAnswerRequest;
  } catch {
    return NextResponse.json(
      { answer: fallbackChatAnswer("tidy the room"), source: "fallback" },
      { status: 400 },
    );
  }

  const prompt = cleanPrompt(body.prompt) || "tidy the room";
  const roomImage = cleanRoomImage(body.roomImage);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      answer: fallbackChatAnswer(prompt),
      source: "fallback",
      imageUsed: false,
    });
  }

  const content: ResponseInputContent[] = [
    { type: "input_text", text: buildPrompt(prompt) },
  ];

  if (roomImage) {
    content.push({ type: "input_image", image_url: roomImage, detail: "low" });
  }

  try {
    const client = new OpenAI({ apiKey });
    const response: OpenAIResponse = await Promise.race([
      client.responses.create({
        model: MODEL,
        input: [{ role: "user", content }],
        max_output_tokens: 500,
      }) as Promise<OpenAIResponse>,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS),
      ),
    ]);

    const answer = response.output_text.trim();
    if (!answer) throw new Error("empty chat answer");

    return NextResponse.json({
      answer,
      source: "ai",
      imageUsed: Boolean(roomImage),
    });
  } catch (err) {
    console.error("[chat-answer] falling back:", err);
    return NextResponse.json({
      answer: fallbackChatAnswer(prompt),
      source: "fallback",
      imageUsed: false,
    });
  }
}
