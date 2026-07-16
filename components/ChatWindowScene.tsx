"use client";

import { useCallback, useRef, useState, type FormEvent } from "react";
import {
  CHAT_ROOM_FURNITURE,
  CHAT_ROOM_ITEMS,
  fallbackChatAnswer,
} from "@/lib/chatRoom";
import { FurnitureKind, ItemKind, RoomCanvas } from "./RoomSprites";
import SpriteRenderer from "./sprites/SpriteRenderer";
import { SpriteEngine } from "./sprites/SpriteEngine";

const ITEMS: { id: string; kind: ItemKind; x: number; y: number }[] =
  CHAT_ROOM_ITEMS.map((item) => ({
    id: item.id,
    kind: item.kind as ItemKind,
    x: item.x,
    y: item.y,
  }));

const FURNITURE: {
  kind: FurnitureKind;
  x: number;
  y: number;
  label: string;
}[] = CHAT_ROOM_FURNITURE.map((piece) => ({
  kind: piece.kind as FurnitureKind,
  x: piece.x,
  y: piece.y,
  label: piece.label,
}));

type ChatStatus = "idle" | "loading" | "answered";

function drawRoomBackdrop(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = "#c69b63";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(74, 48, 22, 0.16)";
  ctx.lineWidth = 2;
  for (let y = 0; y < height; y += 44) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(74, 48, 22, 0.07)";
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 132) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  const wall = Math.round(width * 0.035);
  ctx.fillStyle = "#8d8a82";
  ctx.fillRect(0, 0, width, wall);
  ctx.fillRect(0, 0, wall, height);
  ctx.fillRect(width - wall, 0, wall, height);
  ctx.fillRect(0, height - wall, width * 0.43, wall);
  ctx.fillRect(width * 0.57, height - wall, width * 0.43, wall);
}

export default function ChatWindowScene() {
  const [prompt, setPrompt] = useState("tidy the room");
  const [lastPrompt, setLastPrompt] = useState(prompt);
  const [answer, setAnswer] = useState<string | null>(null);
  const [source, setSource] = useState<"ai" | "fallback" | null>(null);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleReady = useCallback((engine: SpriteEngine) => {
    engine.setRug(50, 52);
    engine.setFurniture(FURNITURE);
    engine.setItems(ITEMS);
    engine.setActorVisible("worker", false);
    engine.setActorVisible("hand", false);
  }, []);

  const captureRoomImage = useCallback(() => {
    const sourceCanvas = canvasRef.current;
    if (!sourceCanvas || !sourceCanvas.width || !sourceCanvas.height) return null;

    const imageCanvas = document.createElement("canvas");
    imageCanvas.width = 960;
    imageCanvas.height = 540;
    const ctx = imageCanvas.getContext("2d");
    if (!ctx) return null;

    drawRoomBackdrop(ctx, imageCanvas.width, imageCanvas.height);
    ctx.drawImage(sourceCanvas, 0, 0, imageCanvas.width, imageCanvas.height);

    try {
      return imageCanvas.toDataURL("image/png");
    } catch {
      return null;
    }
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const submittedPrompt = prompt.trim() || "tidy the room";
      setLastPrompt(submittedPrompt);
      setAnswer(null);
      setSource(null);
      setStatus("loading");

      try {
        const response = await fetch("/api/chat-answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: submittedPrompt,
            roomImage: captureRoomImage(),
          }),
        });
        if (!response.ok) throw new Error(`chat answer failed: ${response.status}`);
        const data = (await response.json()) as {
          answer?: unknown;
          source?: unknown;
        };
        if (typeof data.answer !== "string" || !data.answer.trim()) {
          throw new Error("chat answer missing");
        }
        setAnswer(data.answer.trim());
        setSource(data.source === "ai" ? "ai" : "fallback");
      } catch {
        setAnswer(fallbackChatAnswer(submittedPrompt));
        setSource("fallback");
      } finally {
        setStatus("answered");
      }
    },
    [captureRoomImage, prompt],
  );

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
  }, []);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
      <div className="flex flex-col gap-3">
        <form
          onSubmit={handleSubmit}
          className="flex flex-wrap items-center gap-3 rounded-lg border border-[#474747] bg-[#191919] p-3 shadow-sm"
        >
          <label className="min-w-[220px] flex-1">
            <span className="sr-only">Prompt</span>
            <input
              value={prompt}
              onChange={(event) => {
                setPrompt(event.target.value);
                if (status !== "loading") {
                  setAnswer(null);
                  setSource(null);
                  setStatus("idle");
                }
              }}
              disabled={status === "loading"}
              aria-label="Prompt"
              className="w-full rounded-md border border-[#474747] bg-[#0A0A0A] px-3 py-2 text-sm text-[#F7F7F7] outline-none placeholder:text-zinc-500 focus:border-[#1ABCBD] focus:ring-2 focus:ring-[#1ABCBD]/20"
            />
          </label>
          <button
            type="submit"
            disabled={status === "loading" || !prompt.trim()}
            className="rounded-md bg-[#3A7CA5] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#1ABCBD]"
          >
            Submit
          </button>
        </form>

        <RoomCanvas ariaLabel="Top-down chat room">
          <div
            className="absolute left-1/2 top-2 z-30 -translate-x-1/2 rounded bg-black/45 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
            aria-hidden
          >
            Room state
          </div>
          <SpriteRenderer
            onReady={handleReady}
            onCanvasReady={handleCanvasReady}
            ariaLabel="Top-down chat room"
          />
          <div className="absolute left-3 top-3 z-40 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600 shadow">
            {ITEMS.length} items left
          </div>
          <div className="absolute inset-x-0 bottom-4 z-40 mx-auto w-fit rounded-full border border-[#E0BD3E]/50 bg-black/55 px-4 py-1.5 text-xs font-semibold text-[#f1d977]">
            The answer did not move any item.
          </div>
        </RoomCanvas>
      </div>

      <aside className="rounded-lg border border-[#474747] bg-[#191919] p-4 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-[#1ABCBD]">
          Chat output
        </p>
        <div className="mt-3 rounded-lg border border-[#474747] bg-[#0A0A0A] p-3 text-sm text-zinc-300">
          <p className="font-semibold text-[#F7F7F7]">You</p>
          <p className="mt-1">&ldquo;{lastPrompt || "tidy the room"}&rdquo;</p>
        </div>
        <div
          className="mt-3 rounded-lg border border-[#3A7CA5]/45 bg-[#3A7CA5]/10 p-3 text-sm text-zinc-200"
          aria-live="polite"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-[#8cc7e6]">Chat window</p>
            {source ? (
              <span className="rounded-full border border-[#474747] bg-[#0A0A0A] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                {source === "ai" ? "Live LLM" : "Fallback"}
              </span>
            ) : null}
          </div>
          {status === "loading" ? (
            <p className="mt-2 text-zinc-400">Thinking through the room...</p>
          ) : answer ? (
            <div className="mt-2 space-y-2">
              {answer.split(/\n+/).map((line) => (
                <p key={line}>{line}</p>
              ))}
              <p className="font-semibold text-[#f1d977]">
                Output delivered. No agent took control.
              </p>
            </div>
          ) : (
            <p className="mt-2 text-zinc-500">
              Submit the prompt to get a text answer.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
