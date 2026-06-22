"use client";

import { useCallback, useState } from "react";
import { FurnitureKind, ItemKind, RoomCanvas } from "./RoomSprites";
import SpriteRenderer from "./sprites/SpriteRenderer";
import { SpriteEngine } from "./sprites/SpriteEngine";

const ITEMS: { id: string; kind: ItemKind; x: number; y: number }[] = [
  { id: "chat-c1", kind: "sock", x: 38, y: 38 },
  { id: "chat-c2", kind: "cup", x: 62, y: 42 },
  { id: "chat-c3", kind: "book", x: 45, y: 64 },
  { id: "chat-c4", kind: "toy", x: 61, y: 66 },
  { id: "chat-c5", kind: "trash", x: 40, y: 30 },
  { id: "chat-c6", kind: "can", x: 66, y: 32 },
  { id: "chat-c7", kind: "sock", x: 33, y: 54 },
];

const FURNITURE: {
  kind: FurnitureKind;
  x: number;
  y: number;
  label: string;
}[] = [
  { kind: "trashcan", x: 50, y: 16, label: "Trash can" },
  { kind: "sink", x: 16, y: 24, label: "Kitchen sink" },
  { kind: "recycling", x: 84, y: 24, label: "Recycling" },
  { kind: "bookshelf", x: 85, y: 64, label: "Bookshelf" },
  { kind: "hamper", x: 15, y: 66, label: "Laundry hamper" },
  { kind: "toybox", x: 50, y: 85, label: "Toy box" },
];

export default function ChatWindowScene() {
  const [prompt, setPrompt] = useState("tidy the room");
  const [answered, setAnswered] = useState(false);

  const handleReady = useCallback((engine: SpriteEngine) => {
    engine.setRug(50, 52);
    engine.setFurniture(FURNITURE);
    engine.setItems(ITEMS);
    engine.setActorVisible("worker", false);
    engine.setActorVisible("hand", false);
  }, []);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
      <div className="flex flex-col gap-3">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setAnswered(true);
          }}
          className="flex flex-wrap items-center gap-3 rounded-lg border border-[#474747] bg-[#191919] p-3 shadow-sm"
        >
          <label className="min-w-[220px] flex-1">
            <span className="sr-only">Prompt</span>
            <input
              value={prompt}
              onChange={(event) => {
                setPrompt(event.target.value);
                setAnswered(false);
              }}
              aria-label="Prompt"
              className="w-full rounded-md border border-[#474747] bg-[#0A0A0A] px-3 py-2 text-sm text-[#F7F7F7] outline-none placeholder:text-zinc-500 focus:border-[#1ABCBD] focus:ring-2 focus:ring-[#1ABCBD]/20"
            />
          </label>
          <button
            type="submit"
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
          <p className="mt-1">&ldquo;{prompt || "tidy the room"}&rdquo;</p>
        </div>
        <div className="mt-3 rounded-lg border border-[#3A7CA5]/45 bg-[#3A7CA5]/10 p-3 text-sm text-zinc-200">
          <p className="font-semibold text-[#8cc7e6]">Chat window</p>
          {answered ? (
            <div className="mt-2 space-y-2">
              <p>
                Here is a plan: pick up trash, sort recycling, put dishes in the
                sink, shelve books, move laundry to the hamper, and finish with
                toys.
              </p>
              <p className="font-semibold text-[#f1d977]">
                Output delivered. No pawn took control.
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
