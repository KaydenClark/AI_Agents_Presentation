"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Character, { CharacterState } from "./Character";
import ClutterItem, {
  Clutter,
  CLUTTER_GLYPH,
  targetFor,
} from "./ClutterItem";

type Mode = "manual" | "agent";

const DESK = { x: 14, y: 82 };
const TRASH = { x: 88, y: 18 };
const DRAWER = { x: 88, y: 78 };
const TOP_CENTER = { x: 50, y: 0 };

function initialClutter(): Clutter[] {
  return [
    { id: "c1", kind: "trash", xPercent: 35, yPercent: 30 },
    { id: "c2", kind: "laundry", xPercent: 55, yPercent: 64 },
    { id: "c3", kind: "books", xPercent: 45, yPercent: 46 },
    { id: "c4", kind: "dishes", xPercent: 64, yPercent: 34 },
    { id: "c5", kind: "trash", xPercent: 30, yPercent: 60 },
    { id: "c6", kind: "books", xPercent: 70, yPercent: 58 },
    { id: "c7", kind: "laundry", xPercent: 50, yPercent: 22 },
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

function destinationLabel(kind: Clutter["kind"]): string {
  return targetFor(kind) === "trash" ? "trash can" : "drawer";
}

export default function RoomScene() {
  const [items, setItems] = useState<Clutter[]>(initialClutter);
  const [mode, setMode] = useState<Mode>("manual");
  const [command, setCommand] = useState("");
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [manualActions, setManualActions] = useState(0);
  const [announcement, setAnnouncement] = useState("");

  // Agent character
  const [charPos, setCharPos] = useState(DESK);
  const [charState, setCharState] = useState<CharacterState>("sitting");
  const [charCarry, setCharCarry] = useState<string | null>(null);
  const [thought, setThought] = useState<string | undefined>();

  // Manual "hand from the top"
  const [hand, setHand] = useState({
    x: 50,
    y: -15,
    visible: false,
    carrying: null as string | null,
  });
  const [removingId, setRemovingId] = useState<string | null>(null);
  // A short-lived sparkle shown where an item was just deposited.
  const [poof, setPoof] = useState<{ x: number; y: number; key: number } | null>(
    null,
  );

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const busyRef = useRef(false);
  const charPosRef = useRef(charPos);
  charPosRef.current = charPos;

  const startCount = 7;
  const roomClean = items.length === 0;
  const cleared = startCount - items.length;

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const showPoof = useCallback((x: number, y: number) => {
    setPoof({ x, y, key: Date.now() });
  }, []);

  // ---- Manual mode: one input -> one action ----
  const runManualStep = useCallback(async () => {
    if (busyRef.current) return;
    const current = itemsRef.current;
    if (current.length === 0) return;

    busyRef.current = true;
    setBusy(true);

    const item = nearest(current, TOP_CENTER);
    const glyph = CLUTTER_GLYPH[item.kind];
    const target = targetFor(item.kind) === "trash" ? TRASH : DRAWER;

    // Hand drops in from the top of the screen.
    setHand({ x: item.xPercent, y: -15, visible: true, carrying: null });
    await sleep(80);
    setHand({ x: item.xPercent, y: item.yPercent, visible: true, carrying: null });
    await sleep(650);

    // Grab.
    setRemovingId(item.id);
    setHand((h) => ({ ...h, carrying: glyph }));
    await sleep(320);
    removeItem(item.id);
    setRemovingId(null);

    // Carry to the correct target and drop.
    setHand({ x: target.x, y: target.y, visible: true, carrying: glyph });
    await sleep(720);
    setHand((h) => ({ ...h, carrying: null }));
    showPoof(target.x, target.y);
    setAnnouncement(`Moved ${item.kind} to the ${destinationLabel(item.kind)}.`);
    await sleep(320);

    // Retract.
    setHand({ x: target.x, y: -15, visible: false, carrying: null });
    await sleep(520);

    setManualActions((n) => n + 1);
    busyRef.current = false;
    setBusy(false);
    if (itemsRef.current.length === 0) {
      setAnnouncement("Room clean. That took several separate submits.");
    }
  }, [removeItem, showPoof]);

  // ---- Agent mode: one input -> N actions, self-terminating ----
  const runAgentLoop = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setThought(undefined);

    while (itemsRef.current.length > 0) {
      const item = nearest(itemsRef.current, charPosRef.current);
      const glyph = CLUTTER_GLYPH[item.kind];
      const target = targetFor(item.kind) === "trash" ? TRASH : DRAWER;

      // Stand and walk to the item.
      setCharState("walking");
      setCharPos({ x: item.xPercent, y: item.yPercent });
      await sleep(650);

      // Pick up.
      setCharState("working");
      setRemovingId(item.id);
      await sleep(320);
      setCharCarry(glyph);
      removeItem(item.id);
      setRemovingId(null);

      // Walk to the correct target.
      setCharState("walking");
      setCharPos({ x: target.x, y: target.y });
      await sleep(700);

      // Deposit.
      setCharState("working");
      await sleep(300);
      setCharCarry(null);
      showPoof(target.x, target.y);
      setAnnouncement(
        `Agent moved ${item.kind} to the ${destinationLabel(item.kind)}.`,
      );

      // Walk back to the desk and sit.
      setCharState("walking");
      setCharPos(DESK);
      await sleep(700);
      setCharState("sitting");

      // Brief scan/think before deciding what to do next.
      if (itemsRef.current.length > 0) {
        setThought("Scanning… 🔍");
        await sleep(550);
        setThought(undefined);
      }
    }

    // Goal state reached — the loop stops itself.
    setCharState("sitting");
    setCharPos(DESK);
    setThought(undefined);
    setAnnouncement("Room clean. The agent reached the goal and stopped itself.");
    busyRef.current = false;
    setBusy(false);
  }, [removeItem, showPoof]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (busy || roomClean) return;
      setLastCommand(command.trim() || "clean the room");
      if (mode === "manual") {
        runManualStep();
      } else {
        runAgentLoop();
      }
    },
    [busy, roomClean, mode, command, runManualStep, runAgentLoop],
  );

  const reset = useCallback(() => {
    if (busyRef.current) return;
    setItems(initialClutter());
    setManualActions(0);
    setCharPos(DESK);
    setCharState("sitting");
    setCharCarry(null);
    setThought(undefined);
    setHand({ x: 50, y: -15, visible: false, carrying: null });
    setRemovingId(null);
    setPoof(null);
    setAnnouncement("Room reset.");
  }, []);

  // Switching mode mid-demo resets the room so each lesson starts clean.
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const remaining = items.length;
  const placeholder = useMemo(() => "Type a command, e.g. clean the room", []);

  return (
    <div className="flex flex-col gap-4">
      {/* Screen-reader live region */}
      <div aria-live="polite" className="sr-only" role="status">
        {announcement}
      </div>

      {/* Controls */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
      >
        <div
          className="inline-flex overflow-hidden rounded-lg border border-slate-300"
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
          className="min-w-[200px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />

        <button
          type="submit"
          disabled={busy || roomClean}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition enabled:hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Submit
        </button>

        <button
          type="button"
          onClick={reset}
          disabled={busy}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition enabled:hover:bg-slate-50 disabled:opacity-50"
        >
          Reset room
        </button>
      </form>

      {/* Mode explainer */}
      <div className="rounded-lg bg-slate-50 px-4 py-2 text-sm text-slate-600">
        {mode === "manual" ? (
          <>
            <strong className="text-slate-800">Manual:</strong> one Submit = one
            item moved. You must resubmit for every remaining item. Submits so
            far: <strong>{manualActions}</strong>.
          </>
        ) : (
          <>
            <strong className="text-slate-800">Agent:</strong> one Submit gives
            the worker a goal. It loops on its own until the room is empty, then
            stops itself.
          </>
        )}
        {lastCommand ? (
          <span className="ml-1 text-slate-400">
            Last command: &ldquo;{lastCommand}&rdquo;.
          </span>
        ) : null}
      </div>

      {/* Progress bar */}
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

      {/* Destination legend (kept out of the canvas to avoid overlap) */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-medium text-slate-500">
        <span className="text-slate-400">Where things go:</span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" /> 🗑️ 💧 →
          trash can
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-400" /> 📚 🧦 🍽️ →
          drawer
        </span>
      </div>

      {/* Scene */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-slate-300 bg-gradient-to-b from-sky-50 via-amber-50 to-orange-100 shadow-inner">
        {/* Floor strip */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-amber-200/50" />

        {/* Fixed targets */}
        <Target x={TRASH.x} y={TRASH.y} glyph="🗑️" label="Trash can" tone="rose" />
        <Target x={DRAWER.x} y={DRAWER.y} glyph="🗄️" label="Drawer" tone="sky" />
        <Target x={DESK.x} y={DESK.y} glyph="🪑" label="Desk" tone="slate" />

        {/* Clutter */}
        {items.map((item) => (
          <ClutterItem
            key={item.id}
            item={item}
            removing={removingId === item.id}
          />
        ))}

        {/* Deposit sparkle */}
        {poof ? (
          <div
            key={poof.key}
            className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 animate-poof text-2xl"
            style={{ left: `${poof.x}%`, top: `${poof.y}%` }}
            aria-hidden
          >
            ✨
          </div>
        ) : null}

        {/* Agent character (only in agent mode) */}
        {mode === "agent" ? (
          <Character
            glyph="🧹"
            xPercent={charPos.x}
            yPercent={charPos.y}
            state={charState}
            carrying={charCarry}
            thought={thought}
            label="Agent"
          />
        ) : null}

        {/* Manual hand from the top, with an arm reaching down from off-screen */}
        {mode === "manual" && hand.visible ? (
          <>
            {hand.y > 0 ? (
              <div
                className="actor-move absolute z-20 w-[3px] -translate-x-1/2 bg-gradient-to-b from-slate-400/0 to-slate-400/70"
                style={{ left: `${hand.x}%`, top: 0, height: `${hand.y}%` }}
                aria-hidden
              />
            ) : null}
            <div
              className="actor-move absolute z-30 flex -translate-x-1/2 flex-col items-center"
              style={{ left: `${hand.x}%`, top: `${hand.y}%` }}
            >
              <span className="text-4xl drop-shadow" aria-hidden>
                🖐️
              </span>
              {hand.carrying ? (
                <span className="-mt-1 text-2xl" aria-hidden>
                  {hand.carrying}
                </span>
              ) : null}
            </div>
          </>
        ) : null}

        {/* Room clean indicator */}
        {roomClean ? (
          <div className="absolute inset-0 z-40 flex items-center justify-center">
            <div className="animate-fade-in rounded-2xl bg-emerald-500/95 px-8 py-5 text-center text-white shadow-lg">
              <div className="text-3xl">✨ Room clean</div>
              <div className="mt-1 text-sm opacity-90">
                {mode === "agent"
                  ? "The agent reached the goal and stopped on its own."
                  : `Done — it took ${manualActions} separate submits.`}
              </div>
            </div>
          </div>
        ) : null}

        {/* Remaining counter */}
        <div className="absolute left-3 top-3 z-40 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600 shadow">
          {remaining} item{remaining === 1 ? "" : "s"} left
        </div>
      </div>
    </div>
  );
}

const TONE: Record<string, string> = {
  rose: "border-rose-300 bg-rose-50",
  sky: "border-sky-300 bg-sky-50",
  slate: "border-slate-300 bg-white/70",
};

function Target({
  x,
  y,
  glyph,
  label,
  tone,
}: {
  x: number;
  y: number;
  glyph: string;
  label: string;
  tone: "rose" | "sky" | "slate";
}) {
  return (
    <div
      className="absolute z-0 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-xl border-2 border-dashed text-3xl shadow-sm ${TONE[tone]}`}
      >
        <span aria-hidden>{glyph}</span>
      </div>
      <span className="mt-1 text-[11px] font-semibold text-slate-500">
        {label}
      </span>
    </div>
  );
}
