"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Clutter, ClutterKind } from "./ClutterItem";
import { FurnitureKind, ItemKind, RoomCanvas } from "./RoomSprites";
import SpriteRenderer from "./sprites/SpriteRenderer";
import { SpriteEngine } from "./sprites/SpriteEngine";

type Mode = "manual" | "agent";
type Presentation = "cleaning" | "tool-use";
type SpotKind = "trash" | "dishes" | "bottles" | "books" | "laundry" | "toys";

type Tone = "rose" | "sky" | "teal" | "amber" | "violet" | "emerald";

interface RoomSceneProps {
  fixedMode?: Mode;
  presentation?: Presentation;
}

const HOME = { x: 50, y: 52 };
const TOP_CENTER = { x: 50, y: 0 };
const HAND_PARK = { x: 50, y: -15 };

// Where each kind of mess belongs, drawn as furniture around the room edge.
// `furn` picks the furniture sprite, `item` the clutter sprite, `word` the
// label used in the legend / announcements.
const SPOTS: Record<
  SpotKind,
  {
    x: number;
    y: number;
    label: string;
    toolLabel: string;
    word: string;
    furn: FurnitureKind;
    item: ItemKind;
    tone: Tone;
  }
> = {
  trash: { x: 50, y: 16, label: "Trash can", toolLabel: "Trash MCP", word: "trash", furn: "trashcan", item: "trash", tone: "rose" },
  dishes: { x: 16, y: 24, label: "Kitchen sink", toolLabel: "Sink plugin", word: "cup", furn: "sink", item: "cup", tone: "sky" },
  bottles: { x: 84, y: 24, label: "Recycling", toolLabel: "Recycle MCP", word: "can", furn: "recycling", item: "can", tone: "teal" },
  books: { x: 85, y: 64, label: "Bookshelf", toolLabel: "Bookshelf skill", word: "book", furn: "bookshelf", item: "book", tone: "amber" },
  laundry: { x: 15, y: 66, label: "Laundry hamper", toolLabel: "Laundry MCP", word: "sock", furn: "hamper", item: "sock", tone: "violet" },
  toys: { x: 50, y: 85, label: "Toy box", toolLabel: "Toy tool", word: "toy", furn: "toybox", item: "toy", tone: "emerald" },
};

function spotFor(kind: ClutterKind) {
  return SPOTS[kind as SpotKind] ?? SPOTS.trash;
}

function displayLabel(
  spot: (typeof SPOTS)[SpotKind],
  presentation: Presentation,
) {
  return presentation === "tool-use" ? spot.toolLabel : spot.label;
}

function initialClutter(): Clutter[] {
  return [
    { id: "c1", kind: "laundry", xPercent: 38, yPercent: 38 },
    { id: "c2", kind: "dishes", xPercent: 62, yPercent: 42 },
    { id: "c3", kind: "books", xPercent: 45, yPercent: 64 },
    { id: "c4", kind: "toys", xPercent: 61, yPercent: 66 },
    { id: "c5", kind: "trash", xPercent: 40, yPercent: 30 },
    { id: "c6", kind: "bottles", xPercent: 66, yPercent: 32 },
    { id: "c7", kind: "laundry", xPercent: 33, yPercent: 54 },
  ];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function nearest(items: Clutter[], to: { x: number; y: number }): Clutter {
  return items.reduce((best, cur) => {
    const d = (a: Clutter) =>
      (a.xPercent - to.x) ** 2 + (a.yPercent - to.y) ** 2;
    return d(cur) < d(best) ? cur : best;
  }, items[0]);
}

// Translate the React-owned game state into the flat {id,type,x,y} objects the
// engine draws. The engine never sees React; this is the one bridge.
function itemsForEngine(list: Clutter[]) {
  return list.map((it) => ({
    id: it.id,
    kind: spotFor(it.kind).item,
    x: it.xPercent,
    y: it.yPercent,
  }));
}

export default function RoomScene({
  fixedMode,
  presentation = "cleaning",
}: RoomSceneProps = {}) {
  const [items, setItems] = useState<Clutter[]>(initialClutter);
  const [mode, setMode] = useState<Mode>(fixedMode ?? "manual");
  const [command, setCommand] = useState("");
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [manualActions, setManualActions] = useState(0);
  const [announcement, setAnnouncement] = useState("");

  // Engine handle + plain refs. None of these drive renders: worker/hand
  // movement lives entirely inside the engine's rAF loop (Task 4).
  const engineRef = useRef<SpriteEngine | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const busyRef = useRef(false);
  const workerPosRef = useRef(HOME);

  const startCount = 7;
  const allClean = items.length === 0;
  const cleared = startCount - items.length;
  const modeLocked = fixedMode !== undefined;

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // One-time engine setup: static scene + initial actor placement.
  const handleReady = useCallback((engine: SpriteEngine) => {
    engineRef.current = engine;
    engine.setRug(HOME.x, HOME.y);
    engine.setFurniture(
      Object.values(SPOTS).map((s) => ({
        kind: s.furn,
        x: s.x,
        y: s.y,
        label: displayLabel(s, presentation),
      })),
    );
    engine.setItems(itemsForEngine(itemsRef.current));
    engine.placeActor("worker", HOME.x, HOME.y);
    engine.setActorLabel("worker", "Agent worker");
    engine.setActorVisible("worker", modeRef.current === "agent");
    engine.placeActor("hand", HAND_PARK.x, HAND_PARK.y);
    engine.setActorVisible("hand", false);
  }, [presentation]);

  // Keep the engine's clutter in sync with React state (discrete updates only:
  // an item is added/removed, never per frame).
  useEffect(() => {
    engineRef.current?.setItems(itemsForEngine(items));
  }, [items]);

  const runManualStep = useCallback(async () => {
    const engine = engineRef.current;
    if (busyRef.current || !engine) return;
    const current = itemsRef.current;
    if (current.length === 0) return;

    busyRef.current = true;
    setBusy(true);

    const item = nearest(current, TOP_CENTER);
    const spot = spotFor(item.kind);

    engine.setActorCarry("hand", null);
    engine.placeActor("hand", item.xPercent, HAND_PARK.y);
    engine.setActorVisible("hand", true);
    await sleep(80);
    engine.moveActor("hand", item.xPercent, item.yPercent, 560);
    await sleep(650);

    engine.setRemoving(item.id);
    engine.setActorCarry("hand", spot.item);
    await sleep(320);
    removeItem(item.id);

    engine.moveActor("hand", spot.x, spot.y, 640);
    await sleep(720);
    engine.setActorCarry("hand", null);
    engine.poof(spot.x, spot.y);
    setAnnouncement(
      `Put the ${spot.word} in the ${displayLabel(spot, presentation)}.`,
    );
    await sleep(320);

    engine.moveActor("hand", spot.x, HAND_PARK.y, 460);
    await sleep(520);
    engine.setActorVisible("hand", false);

    setManualActions((n) => n + 1);
    busyRef.current = false;
    setBusy(false);
    if (itemsRef.current.length === 0) {
      setAnnouncement("Room clean. That took several separate submits.");
    }
  }, [presentation, removeItem]);

  const runAgentLoop = useCallback(async () => {
    const engine = engineRef.current;
    if (busyRef.current || !engine) return;
    busyRef.current = true;
    setBusy(true);
    engine.setActorThought("worker", null);

    while (itemsRef.current.length > 0) {
      const item = nearest(itemsRef.current, workerPosRef.current);
      const spot = spotFor(item.kind);

      engine.setActorState("worker", "walking");
      engine.moveActor("worker", item.xPercent, item.yPercent, 600);
      workerPosRef.current = { x: item.xPercent, y: item.yPercent };
      await sleep(650);

      engine.setActorState("worker", "working");
      engine.setRemoving(item.id);
      await sleep(320);
      engine.setActorCarry("worker", spot.item);
      removeItem(item.id);

      engine.setActorState("worker", "walking");
      engine.moveActor("worker", spot.x, spot.y, 650);
      workerPosRef.current = { x: spot.x, y: spot.y };
      await sleep(700);

      engine.setActorState("worker", "working");
      await sleep(300);
      engine.setActorCarry("worker", null);
      engine.poof(spot.x, spot.y);
      setAnnouncement(
        `Agent put the ${spot.word} in the ${displayLabel(
          spot,
          presentation,
        )}.`,
      );

      engine.setActorState("worker", "walking");
      engine.moveActor("worker", HOME.x, HOME.y, 650);
      workerPosRef.current = HOME;
      await sleep(700);
      engine.setActorState("worker", "sitting");

      if (itemsRef.current.length > 0) {
        engine.setActorThought("worker", "What's next?");
        await sleep(550);
        engine.setActorThought("worker", null);
      }
    }

    engine.setActorState("worker", "sitting");
    engine.placeActor("worker", HOME.x, HOME.y);
    engine.setActorThought("worker", null);
    setAnnouncement(
      "Room clean. The agent reached the goal and stopped itself.",
    );
    busyRef.current = false;
    setBusy(false);
  }, [presentation, removeItem]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (busy || allClean) return;
      setLastCommand(command.trim() || "tidy the room");
      if (mode === "manual") {
        runManualStep();
      } else {
        runAgentLoop();
      }
    },
    [busy, allClean, mode, command, runManualStep, runAgentLoop],
  );

  const reset = useCallback(() => {
    if (busyRef.current) return;
    const fresh = initialClutter();
    setItems(fresh);
    setManualActions(0);
    setAnnouncement("Room reset.");
    workerPosRef.current = HOME;

    const engine = engineRef.current;
    if (engine) {
      engine.setItems(itemsForEngine(fresh));
      engine.placeActor("worker", HOME.x, HOME.y);
      engine.setActorState("worker", "sitting");
      engine.setActorCarry("worker", null);
      engine.setActorThought("worker", null);
      engine.setActorVisible("worker", modeRef.current === "agent");
      engine.placeActor("hand", HAND_PARK.x, HAND_PARK.y);
      engine.setActorCarry("hand", null);
      engine.setActorVisible("hand", false);
    }
  }, []);

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (fixedMode && mode !== fixedMode) setMode(fixedMode);
  }, [fixedMode, mode]);

  const remaining = items.length;
  const placeholder = useMemo(() => "Type a goal, e.g. tidy the room", []);

  return (
    <div className="flex flex-col gap-4">
      <div aria-live="polite" className="sr-only" role="status">
        {announcement}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap items-center gap-3 rounded-lg border border-[#474747] bg-[#191919] p-3 shadow-sm"
      >
        {modeLocked ? (
          <div className="rounded-md border border-[#474747] bg-[#0A0A0A] px-4 py-2 text-sm font-semibold text-[#F7F7F7]">
            {mode === "manual"
              ? presentation === "tool-use"
                ? "Tool use"
                : "Manual task"
              : "Single agent"}
          </div>
        ) : (
          <div
            className="inline-flex overflow-hidden rounded-md border border-[#474747]"
            role="group"
            aria-label="Mode"
          >
            {(["manual", "agent"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                disabled={busy}
                aria-pressed={mode === m}
                className={`px-4 py-2 text-sm font-semibold capitalize transition disabled:cursor-not-allowed ${
                  mode === m
                    ? "bg-[#3A7CA5] text-[#F7F7F7]"
                    : "bg-[#0A0A0A] text-zinc-300 enabled:hover:bg-[#474747]/40 disabled:opacity-50"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        )}

        <input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder={placeholder}
          aria-label="Command"
          className="min-w-[220px] flex-1 rounded-md border border-[#474747] bg-[#0A0A0A] px-3 py-2 text-sm text-[#F7F7F7] outline-none placeholder:text-zinc-500 focus:border-[#1ABCBD] focus:ring-2 focus:ring-[#1ABCBD]/20"
        />

        <button
          type="submit"
          disabled={busy || allClean}
          className="rounded-md bg-[#3A7CA5] px-5 py-2 text-sm font-semibold text-white transition enabled:hover:bg-[#1ABCBD] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Submit
        </button>

        <button
          type="button"
          onClick={reset}
          disabled={busy}
          className="rounded-md border border-[#474747] px-4 py-2 text-sm font-semibold text-zinc-300 transition enabled:hover:bg-[#474747]/40 disabled:opacity-50"
        >
          Reset room
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-[#474747] bg-[#191919] px-4 py-2 text-sm text-zinc-300">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
            mode === "manual"
              ? "bg-[#E0BD3E]/15 text-[#f1d977]"
              : "bg-[#4DAA57]/15 text-[#95df9d]"
          }`}
        >
          {mode === "manual" ? "1 input -> 1 action" : "1 input -> N actions"}
        </span>
        {mode === "manual" ? (
          <span>
            <strong className="text-[#F7F7F7]">
              {presentation === "tool-use" ? "Tool Use:" : "Manual:"}
            </strong>{" "}
            one Submit = one{" "}
            {presentation === "tool-use" ? "tool action" : "item put away"}.
            You must resubmit for every remaining item. Submits so far:{" "}
            <strong>{manualActions}</strong>.
          </span>
        ) : (
          <span>
            <strong className="text-[#F7F7F7]">Agent:</strong> one Submit gives
            the worker a goal. It tidies every item, returns home, then stops
            itself.
          </span>
        )}
        {lastCommand ? (
          <span className="text-zinc-500">
            Last command: &ldquo;{lastCommand}&rdquo;.
          </span>
        ) : null}
      </div>

      {mode === "manual" && manualActions >= 3 && remaining > 0 ? (
        <div className="animate-fade-in rounded-lg border border-[#4DAA57]/50 bg-[#4DAA57]/15 px-4 py-2 text-sm text-[#d5f4d8]">
          Getting repetitive? That is the point.{" "}
          {modeLocked ? (
            <>
              Play the{" "}
              <Link href="/agent" className="font-semibold underline">
                Single Agent
              </Link>{" "}
              game mode and give the same goal once.
            </>
          ) : (
            <>
              Switch to <strong>Agent</strong> mode and give the same goal once.
            </>
          )}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#474747]">
          <div
            className="h-full rounded-full bg-[#4DAA57] transition-all duration-300"
            style={{ width: `${(cleared / startCount) * 100}%` }}
          />
        </div>
        <span className="w-16 text-right text-xs font-semibold text-zinc-400">
          {cleared}/{startCount} done
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-medium text-zinc-400">
        <span className="text-zinc-500">Where things go:</span>
        {Object.values(SPOTS).map((spot) => (
          <span key={spot.label} className="flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                spot.tone === "sky"
                  ? "bg-sky-400"
                  : spot.tone === "violet"
                    ? "bg-violet-400"
                    : spot.tone === "teal"
                      ? "bg-teal-400"
                      : spot.tone === "amber"
                        ? "bg-amber-400"
                        : spot.tone === "emerald"
                          ? "bg-emerald-400"
                          : spot.tone === "rose"
                            ? "bg-rose-400"
                            : "bg-slate-400"
              }`}
            />
            {spot.word} {"->"} {displayLabel(spot, presentation)}
          </span>
        ))}
      </div>

      <RoomCanvas
        ariaLabel={
          presentation === "tool-use"
            ? "Top-down tool-use room"
            : "Top-down cleaning room"
        }
      >
        <div
          className="absolute left-1/2 top-2 z-30 -translate-x-1/2 rounded bg-black/45 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
          aria-hidden
        >
          {presentation === "tool-use" ? "Sandbox room" : "Living room"}
        </div>

        {presentation === "tool-use" ? (
          <div
            className="pointer-events-none absolute left-1/2 top-[52%] z-30 -translate-x-1/2 rounded bg-black/45 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
            aria-hidden
          >
            Harness carpet
          </div>
        ) : null}

        <SpriteRenderer
          onReady={handleReady}
          ariaLabel={
            presentation === "tool-use"
              ? "Top-down tool-use room"
              : "Top-down cleaning room"
          }
        />

        {/* The worker is painted on the canvas, which is opaque to screen
            readers; surface its presence as text so assistive tech (and the
            e2e suite) can tell manual mode from agent mode. */}
        {mode === "agent" ? (
          <span className="sr-only">Agent worker is in the room.</span>
        ) : null}

        {allClean ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/10">
            <div className="animate-fade-in rounded-lg bg-emerald-600 px-8 py-5 text-center text-white shadow-lg">
              <div className="text-3xl font-bold">Room clean!</div>
              <div className="mt-1 text-sm opacity-90">
                {mode === "agent"
                  ? "The agent reached the goal and stopped on its own."
                  : `Done - it took ${manualActions} separate submits.`}
              </div>
            </div>
          </div>
        ) : null}

        <div className="absolute left-3 top-3 z-40 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600 shadow">
          {remaining} item{remaining === 1 ? "" : "s"} left
        </div>
      </RoomCanvas>
    </div>
  );
}
