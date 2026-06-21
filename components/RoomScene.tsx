"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Clutter, ClutterKind } from "./ClutterItem";
import {
  FloorItem,
  Furniture,
  FurnitureKind,
  HandSprite,
  ItemKind,
  RoomCanvas,
  RoomWorker,
  Rug,
} from "./RoomSprites";

type Mode = "manual" | "agent";
type SpotKind = "trash" | "dishes" | "bottles" | "books" | "laundry" | "toys";

type Tone =
  | "rose"
  | "sky"
  | "teal"
  | "amber"
  | "violet"
  | "emerald";

const HOME = { x: 50, y: 52 };
const TOP_CENTER = { x: 50, y: 0 };

// Where each kind of mess belongs, drawn as furniture around the room edge.
// `furn` picks the furniture sprite, `item` the clutter sprite, `word` the
// label used in the legend / announcements.
const SPOTS: Record<
  SpotKind,
  {
    x: number;
    y: number;
    label: string;
    word: string;
    furn: FurnitureKind;
    item: ItemKind;
    tone: Tone;
  }
> = {
  trash: { x: 50, y: 16, label: "Trash can", word: "trash", furn: "trashcan", item: "trash", tone: "rose" },
  dishes: { x: 16, y: 24, label: "Kitchen sink", word: "cup", furn: "sink", item: "cup", tone: "sky" },
  bottles: { x: 84, y: 24, label: "Recycling", word: "can", furn: "recycling", item: "can", tone: "teal" },
  books: { x: 85, y: 64, label: "Bookshelf", word: "book", furn: "bookshelf", item: "book", tone: "amber" },
  laundry: { x: 15, y: 66, label: "Laundry hamper", word: "sock", furn: "hamper", item: "sock", tone: "violet" },
  toys: { x: 50, y: 85, label: "Toy box", word: "toy", furn: "toybox", item: "toy", tone: "emerald" },
};

function spotFor(kind: ClutterKind) {
  return SPOTS[kind as SpotKind] ?? SPOTS.trash;
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

export default function RoomScene() {
  const [items, setItems] = useState<Clutter[]>(initialClutter);
  const [mode, setMode] = useState<Mode>("manual");
  const [command, setCommand] = useState("");
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [manualActions, setManualActions] = useState(0);
  const [announcement, setAnnouncement] = useState("");

  const [workerPos, setWorkerPos] = useState(HOME);
  const [workerState, setWorkerState] = useState<
    "sitting" | "walking" | "working"
  >("sitting");
  const [workerCarry, setWorkerCarry] = useState<ItemKind | null>(null);
  const [thought, setThought] = useState<string | undefined>();

  const [pointer, setPointer] = useState({
    x: 50,
    y: -15,
    visible: false,
    carrying: null as ItemKind | null,
  });
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [poof, setPoof] = useState<{ x: number; y: number; key: number } | null>(
    null,
  );

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const busyRef = useRef(false);
  const workerPosRef = useRef(workerPos);
  workerPosRef.current = workerPos;

  const startCount = 7;
  const allClean = items.length === 0;
  const cleared = startCount - items.length;

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const showPoof = useCallback((x: number, y: number) => {
    setPoof({ x, y, key: Date.now() });
  }, []);

  const runManualStep = useCallback(async () => {
    if (busyRef.current) return;
    const current = itemsRef.current;
    if (current.length === 0) return;

    busyRef.current = true;
    setBusy(true);

    const item = nearest(current, TOP_CENTER);
    const spot = spotFor(item.kind);

    setPointer({ x: item.xPercent, y: -15, visible: true, carrying: null });
    await sleep(80);
    setPointer({
      x: item.xPercent,
      y: item.yPercent,
      visible: true,
      carrying: null,
    });
    await sleep(650);

    setRemovingId(item.id);
    setPointer((h) => ({ ...h, carrying: spot.item }));
    await sleep(320);
    removeItem(item.id);
    setRemovingId(null);

    setPointer({
      x: spot.x,
      y: spot.y,
      visible: true,
      carrying: spot.item,
    });
    await sleep(720);
    setPointer((h) => ({ ...h, carrying: null }));
    showPoof(spot.x, spot.y);
    setAnnouncement(`Put the ${spot.word} in the ${spot.label}.`);
    await sleep(320);

    setPointer({ x: spot.x, y: -15, visible: false, carrying: null });
    await sleep(520);

    setManualActions((n) => n + 1);
    busyRef.current = false;
    setBusy(false);
    if (itemsRef.current.length === 0) {
      setAnnouncement("Room clean. That took several separate submits.");
    }
  }, [removeItem, showPoof]);

  const runAgentLoop = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setThought(undefined);

    while (itemsRef.current.length > 0) {
      const item = nearest(itemsRef.current, workerPosRef.current);
      const spot = spotFor(item.kind);

      setWorkerState("walking");
      setWorkerPos({ x: item.xPercent, y: item.yPercent });
      await sleep(650);

      setWorkerState("working");
      setRemovingId(item.id);
      await sleep(320);
      setWorkerCarry(spot.item);
      removeItem(item.id);
      setRemovingId(null);

      setWorkerState("walking");
      setWorkerPos({ x: spot.x, y: spot.y });
      await sleep(700);

      setWorkerState("working");
      await sleep(300);
      setWorkerCarry(null);
      showPoof(spot.x, spot.y);
      setAnnouncement(`Agent put the ${spot.word} in the ${spot.label}.`);

      setWorkerState("walking");
      setWorkerPos(HOME);
      await sleep(700);
      setWorkerState("sitting");

      if (itemsRef.current.length > 0) {
        setThought("What's next?");
        await sleep(550);
        setThought(undefined);
      }
    }

    setWorkerState("sitting");
    setWorkerPos(HOME);
    setThought(undefined);
    setAnnouncement(
      "Room clean. The agent reached the goal and stopped itself.",
    );
    busyRef.current = false;
    setBusy(false);
  }, [removeItem, showPoof]);

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
    setItems(initialClutter());
    setManualActions(0);
    setWorkerPos(HOME);
    setWorkerState("sitting");
    setWorkerCarry(null);
    setThought(undefined);
    setPointer({ x: 50, y: -15, visible: false, carrying: null });
    setRemovingId(null);
    setPoof(null);
    setAnnouncement("Room reset.");
  }, []);

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const remaining = items.length;
  const placeholder = useMemo(() => "Type a goal, e.g. tidy the room", []);

  return (
    <div className="flex flex-col gap-4">
      <div aria-live="polite" className="sr-only" role="status">
        {announcement}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
      >
        <div
          className="inline-flex overflow-hidden rounded-md border border-slate-300"
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
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-slate-600 enabled:hover:bg-slate-50 disabled:opacity-50"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder={placeholder}
          aria-label="Command"
          className="min-w-[220px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />

        <button
          type="submit"
          disabled={busy || allClean}
          className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition enabled:hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Submit
        </button>

        <button
          type="button"
          onClick={reset}
          disabled={busy}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition enabled:hover:bg-slate-50 disabled:opacity-50"
        >
          Reset room
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-slate-50 px-4 py-2 text-sm text-slate-600">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
            mode === "manual"
              ? "bg-amber-100 text-amber-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {mode === "manual" ? "1 input -> 1 action" : "1 input -> N actions"}
        </span>
        {mode === "manual" ? (
          <span>
            <strong className="text-slate-800">Manual:</strong> one Submit =
            one item put away. You must resubmit for every remaining item.
            Submits so far: <strong>{manualActions}</strong>.
          </span>
        ) : (
          <span>
            <strong className="text-slate-800">Agent:</strong> one Submit gives
            the worker a goal. It tidies every item, returns home, then stops
            itself.
          </span>
        )}
        {lastCommand ? (
          <span className="text-slate-400">
            Last command: &ldquo;{lastCommand}&rdquo;.
          </span>
        ) : null}
      </div>

      {mode === "manual" && manualActions >= 3 && remaining > 0 ? (
        <div className="animate-fade-in rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Getting repetitive? That is the point. Switch to{" "}
          <strong>Agent</strong> mode and give the same goal once.
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${(cleared / startCount) * 100}%` }}
          />
        </div>
        <span className="w-16 text-right text-xs font-semibold text-slate-500">
          {cleared}/{startCount} done
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-medium text-slate-500">
        <span className="text-slate-400">Where things go:</span>
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
            {spot.word} {"->"} {spot.label}
          </span>
        ))}
      </div>

      <RoomCanvas ariaLabel="Top-down cleaning room">
        <div
          className="absolute left-1/2 top-2 z-30 -translate-x-1/2 rounded bg-black/45 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
          aria-hidden
        >
          Living room
        </div>

        <Rug x={HOME.x} y={HOME.y} />

        {Object.values(SPOTS).map((spot) => (
          <Furniture
            key={spot.label}
            x={spot.x}
            y={spot.y}
            kind={spot.furn}
            label={spot.label}
          />
        ))}

        {items.map((item) => {
          const spot = spotFor(item.kind);
          return (
            <FloorItem
              key={item.id}
              x={item.xPercent}
              y={item.yPercent}
              item={spot.item}
              removing={removingId === item.id}
            />
          );
        })}

        {poof ? (
          <div
            key={poof.key}
            className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-1/2 animate-poof rounded-full bg-emerald-500 px-2 py-1 text-xs font-bold text-white"
            style={{ left: `${poof.x}%`, top: `${poof.y}%` }}
            aria-hidden
          >
            done
          </div>
        ) : null}

        {mode === "agent" ? (
          <RoomWorker
            x={workerPos.x}
            y={workerPos.y}
            state={workerState}
            carrying={workerCarry}
            thought={thought}
            label="Agent worker"
          />
        ) : null}

        {mode === "manual" && pointer.visible ? (
          <>
            {pointer.y > 0 ? (
              <div
                className="actor-move absolute z-20 w-[3px] -translate-x-1/2 bg-gradient-to-b from-slate-900/0 to-slate-900/40"
                style={{
                  left: `${pointer.x}%`,
                  top: 0,
                  height: `${pointer.y}%`,
                }}
                aria-hidden
              />
            ) : null}
            <div
              className="actor-move absolute z-30 -translate-x-1/2 -translate-y-2"
              style={{ left: `${pointer.x}%`, top: `${pointer.y}%` }}
            >
              <HandSprite carrying={pointer.carrying} />
            </div>
          </>
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
