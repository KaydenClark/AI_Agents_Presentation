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

export default function RoomScene() {
  const [items, setItems] = useState<Clutter[]>(initialClutter);
  const [mode, setMode] = useState<Mode>("manual");
  const [command, setCommand] = useState("");
  const [busy, setBusy] = useState(false);
  const [manualActions, setManualActions] = useState(0);

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

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const busyRef = useRef(false);

  const roomClean = items.length === 0;

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
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
    await sleep(60);
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
    await sleep(320);

    // Retract.
    setHand({ x: target.x, y: -15, visible: false, carrying: null });
    await sleep(520);

    setManualActions((n) => n + 1);
    busyRef.current = false;
    setBusy(false);
  }, [removeItem]);

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
    busyRef.current = false;
    setBusy(false);
  }, [removeItem]);

  // Keep a ref of the character position for the agent loop's nearest() calc.
  const charPosRef = useRef(charPos);
  charPosRef.current = charPos;

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (busy || roomClean) return;
      if (mode === "manual") {
        runManualStep();
      } else {
        runAgentLoop();
      }
    },
    [busy, roomClean, mode, runManualStep, runAgentLoop],
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
  }, []);

  // Switching mode mid-demo resets the room so each lesson starts clean.
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const remaining = items.length;

  const placeholder = useMemo(
    () => "Type a command, e.g. clean the room",
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
      >
        <div className="inline-flex overflow-hidden rounded-lg border border-slate-300">
          {(["manual", "agent"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-4 py-2 text-sm font-semibold capitalize transition ${
                mode === m
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
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
      </div>

      {/* Scene */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-slate-300 bg-gradient-to-b from-amber-50 to-orange-50 shadow-inner">
        {/* Fixed targets */}
        <Target x={TRASH.x} y={TRASH.y} glyph="🗑️" label="Trash can" />
        <Target x={DRAWER.x} y={DRAWER.y} glyph="🗄️" label="Drawer" />
        <Target x={DESK.x} y={DESK.y} glyph="🪑" label="Desk" />

        {/* Clutter */}
        {items.map((item) => (
          <ClutterItem
            key={item.id}
            item={item}
            removing={removingId === item.id}
          />
        ))}

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

        {/* Manual hand from the top */}
        {mode === "manual" && hand.visible ? (
          <div
            className="actor-move absolute z-30 flex -translate-x-1/2 flex-col items-center"
            style={{ left: `${hand.x}%`, top: `${hand.y}%` }}
          >
            <span className="text-4xl" aria-hidden>
              🖐️
            </span>
            {hand.carrying ? (
              <span className="text-2xl" aria-hidden>
                {hand.carrying}
              </span>
            ) : null}
          </div>
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

function Target({
  x,
  y,
  glyph,
  label,
}: {
  x: number;
  y: number;
  glyph: string;
  label: string;
}) {
  return (
    <div
      className="absolute z-0 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white/70 text-3xl">
        <span aria-hidden>{glyph}</span>
      </div>
      <span className="mt-1 text-[11px] font-semibold text-slate-500">
        {label}
      </span>
    </div>
  );
}
