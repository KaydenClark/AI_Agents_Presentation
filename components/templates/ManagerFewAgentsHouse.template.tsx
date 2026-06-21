"use client";

import { useCallback, useRef, useState } from "react";
import { Clutter, ClutterKind } from "../ClutterItem";
import ReportPanel, { ReportLine } from "../ReportPanel";
import EscalationBanner from "../EscalationBanner";
import { Marker, ReportPath } from "../ScenePrimitives";
import {
  Furniture,
  FurnitureKind,
  ItemKind,
  ItemSprite,
  RoomWorker,
} from "../RoomSprites";

type Phase = "idle" | "deciding" | "dispatched" | "working" | "summarizing" | "done";
type AgentState = "idle" | "walking" | "working" | "done";

interface AgentRuntime {
  id: string;
  name: string;
  queue: Clutter[];
  total: number;
  cleared: number;
  state: AgentState;
  carrying: ItemKind | null;
}

// Friendly singular names + matching sprites for the household clutter kinds.
const FRIENDLY: Record<ClutterKind, string> = {
  dishes: "cup",
  bottles: "can",
  laundry: "sock",
  books: "book",
  toys: "toy",
  trash: "trash",
  box: "box",
  spill: "spill",
  pallet: "pallet",
};
const ITEM_SPRITE: Partial<Record<ClutterKind, ItemKind>> = {
  dishes: "cup",
  bottles: "can",
  laundry: "sock",
  books: "book",
  toys: "toy",
  trash: "trash",
};
function spriteFor(kind: ClutterKind): ItemKind {
  return ITEM_SPRITE[kind] ?? "trash";
}

interface ZoneRuntime {
  id: string;
  name: string;
  instruction: string | null;
  managerActive: boolean;
  agents: AgentRuntime[];
  report: ReportLine[];
  status: "idle" | "working" | "delivered";
  itemsCleared: number;
  escalationsResolved: number;
  neededHuman: boolean;
  escalationPaused: boolean;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const STEP = 480;

let lineSeq = 0;
const nextId = () => `l${lineSeq++}`;

function makeItems(kinds: ClutterKind[], jamIndex = -1): Clutter[] {
  return kinds.map((kind, i) => ({
    id: `${kind}-${i}-${Math.random().toString(36).slice(2, 6)}`,
    kind,
    xPercent: 0,
    yPercent: 0,
    jammed: i === jamIndex,
  }));
}

/**
 * One big mixed pile, split by the Boss into rooms of a house. Each room gets a
 * meaningfully different load so the Boss's decomposition is genuinely
 * different per room, not copy-pasted.
 */
function buildZones(): ZoneRuntime[] {
  const kitchen: ClutterKind[] = [
    "dishes",
    "dishes",
    "dishes",
    "dishes",
    "bottles",
    "bottles",
  ]; // 4 cups + 2 cans -> sink + recycling
  const laundry: ClutterKind[] = [
    "laundry",
    "laundry",
    "laundry",
    "laundry",
    "laundry",
    "laundry",
  ]; // 6 socks -> hamper
  const living: ClutterKind[] = ["books", "books", "books", "toys", "toys"]; // 3 books + 2 toys -> shelf + toy box

  const split = (items: Clutter[]): [Clutter[], Clutter[]] => {
    const half = Math.ceil(items.length / 2);
    return [items.slice(0, half), items.slice(half)];
  };

  const aItems = makeItems(kitchen);
  const bItems = makeItems(laundry, 0); // one tangled sock -> manager resolves
  const cItems = makeItems(living);

  const [a1, a2] = split(aItems);
  const [b1, b2] = split(bItems);
  const [c1, c2] = split(cItems);

  const mkAgent = (id: string, name: string, queue: Clutter[]): AgentRuntime => ({
    id,
    name,
    queue,
    total: queue.length,
    cleared: 0,
    state: "idle",
    carrying: null,
  });

  return [
    {
      id: "A",
      name: "Kitchen",
      instruction: null,
      managerActive: false,
      agents: [mkAgent("A1", "Kitchen 1", a1), mkAgent("A2", "Kitchen 2", a2)],
      report: [],
      status: "idle",
      itemsCleared: 0,
      escalationsResolved: 0,
      neededHuman: false,
      escalationPaused: false,
    },
    {
      id: "B",
      name: "Laundry room",
      instruction: null,
      managerActive: false,
      agents: [mkAgent("B1", "Laundry 1", b1), mkAgent("B2", "Laundry 2", b2)],
      report: [],
      status: "idle",
      itemsCleared: 0,
      escalationsResolved: 0,
      neededHuman: false,
      escalationPaused: false,
    },
    {
      id: "C",
      name: "Living room",
      instruction: null,
      managerActive: false,
      agents: [mkAgent("C1", "Living 1", c1), mkAgent("C2", "Living 2", c2)],
      report: [],
      status: "idle",
      itemsCleared: 0,
      escalationsResolved: 0,
      neededHuman: false,
      escalationPaused: false,
    },
  ];
}

function zoneItemSummary(zone: ZoneRuntime) {
  const counts = new Map<string, number>();
  for (const agent of zone.agents) {
    for (const item of agent.queue) {
      counts.set(item.kind, (counts.get(item.kind) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries()).map(([kind, count]) => ({ kind, count }));
}

export default function WarehouseScene() {
  const [zones, setZones] = useState<ZoneRuntime[]>(buildZones);
  const [phase, setPhase] = useState<Phase>("idle");
  const [command, setCommand] = useState("");
  const [bossNote, setBossNote] = useState<string | null>(null);
  const [decompSource, setDecompSource] = useState<"ai" | "fallback" | null>(
    null,
  );
  const [finalReport, setFinalReport] = useState<string | null>(null);
  const [humanNeeded, setHumanNeeded] = useState<{
    zoneId: string;
    message: string;
  } | null>(null);
  const [showJam, setShowJam] = useState(false);

  const zonesRef = useRef(zones);
  const runningRef = useRef(false);

  const commit = useCallback(() => {
    setZones(
      zonesRef.current.map((z) => ({
        ...z,
        agents: z.agents.map((a) => ({ ...a, queue: [...a.queue] })),
        report: [...z.report],
      })),
    );
  }, []);

  // Stable helpers — they only read/write the mutable ref, so empty deps.
  const getZone = useCallback(
    (id: string) => zonesRef.current.find((z) => z.id === id)!,
    [],
  );

  const addLine = useCallback(
    (zoneId: string, line: Omit<ReportLine, "id">) => {
      getZone(zoneId).report.push({ id: nextId(), ...line });
    },
    [getZone],
  );

  // ---- One agent's act-loop within its zone ----
  const runAgent = useCallback(
    async (zoneId: string, agentId: string) => {
      const zone = getZone(zoneId);
      const agent = zone.agents.find((a) => a.id === agentId)!;

      while (agent.queue.length > 0) {
        // Presenter forced a full escalation: pause until a human resolves.
        while (getZone(zoneId).escalationPaused) {
          agent.state = "idle";
          commit();
          await sleep(250);
        }

        const item = agent.queue[0];
        const name = FRIENDLY[item.kind];

        agent.state = "walking";
        agent.carrying = null;
        commit();
        await sleep(STEP);

        // A naturally stuck item: escalate to the Manager, who resolves it.
        if (item.jammed) {
          addLine(zoneId, {
            text: `${agent.name} hit a tangled ${name} → escalated to Manager.`,
            tone: "escalation",
          });
          commit();
          await sleep(STEP);
          addLine(zoneId, {
            text: `Manager sorted out the tangle on its own.`,
            tone: "escalation",
            reviewed: true,
          });
          zone.escalationsResolved += 1;
          commit();
          await sleep(STEP);
        }

        // Carry it to where it belongs and put it away.
        agent.state = "working";
        agent.carrying = spriteFor(item.kind);
        commit();
        await sleep(STEP);

        agent.queue.shift();
        agent.cleared += 1;
        zone.itemsCleared += 1;
        agent.carrying = null;

        // Report the finished item up to the Manager, who reviews it.
        addLine(zoneId, {
          text: `${agent.name} put a ${name} away → Manager reviewed.`,
          reviewed: true,
        });
        commit();
        await sleep(STEP * 0.6);
      }

      agent.state = "done";
      commit();
    },
    [commit, addLine, getZone],
  );

  // ---- One zone: run both agents, then the Manager delivers the report ----
  const runZone = useCallback(
    async (zoneId: string) => {
      const zone = getZone(zoneId);
      zone.status = "working";
      zone.managerActive = true;
      commit();

      await Promise.all(zone.agents.map((a) => runAgent(zoneId, a.id)));

      // Both agents done — Manager walks the hallway to the Boss.
      addLine(zoneId, {
        text: `Both agents done. Manager delivered the ${zone.name} report to the Boss.`,
        tone: "success",
        reviewed: true,
      });
      zone.status = "delivered";
      commit();
      await sleep(STEP);
    },
    [commit, runAgent, addLine, getZone],
  );

  const run = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    // Fresh state for this run.
    lineSeq = 0;
    zonesRef.current = buildZones();
    commit();
    setFinalReport(null);
    setHumanNeeded(null);
    setDecompSource(null);

    const prompt = command.trim() || "Clean the house";

    // ---- The one real AI moment: Boss decomposes the job ----
    setPhase("deciding");
    setBossNote("Boss is deciding…");
    const decideStart = Date.now();

    const zonesState = zonesRef.current.map((z) => ({
      id: z.id,
      name: z.name,
      items: zoneItemSummary(z),
    }));

    try {
      const res = await fetch("/api/boss-decompose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, zones: zonesState }),
      });
      const data = (await res.json()) as {
        decomposition: { zoneId: string; instruction: string }[];
        source: "ai" | "fallback";
      };
      setDecompSource(data.source);
      for (const d of data.decomposition) {
        const zone = zonesRef.current.find((z) => z.id === d.zoneId);
        if (zone) zone.instruction = d.instruction;
      }
    } catch (err) {
      console.error("[warehouse] decompose request failed:", err);
      for (const z of zonesRef.current) {
        z.instruction = `Clear ${z.name} and report back when done.`;
      }
      setDecompSource("fallback");
    }

    // Keep the "deciding" beat on screen long enough for a live audience to
    // register it, even when the fast fallback returns instantly.
    const decideElapsed = Date.now() - decideStart;
    if (decideElapsed < 900) await sleep(900 - decideElapsed);

    setBossNote("Boss dispatched a plan to each Manager.");
    setPhase("dispatched");
    commit();
    await sleep(900);

    // ---- Managers assign agents; zones run in parallel ----
    setPhase("working");
    await Promise.all(zonesRef.current.map((z) => runZone(z.id)));

    // ---- All zones reported — Boss synthesizes the final report ----
    setPhase("summarizing");
    setBossNote("All zones reported in. Boss is writing the final report…");

    const results = zonesRef.current.map((z) => ({
      name: z.name,
      itemsCleared: z.itemsCleared,
      escalationsResolved: z.escalationsResolved,
      neededHuman: z.neededHuman,
    }));

    try {
      const res = await fetch("/api/boss-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zones: results }),
      });
      const data = (await res.json()) as { summary: string };
      setFinalReport(data.summary);
    } catch (err) {
      console.error("[warehouse] summary request failed:", err);
      setFinalReport(
        results
          .map((r) => `${r.name}: ${r.itemsCleared} items cleared.`)
          .join("\n"),
      );
    }

    setBossNote("Done.");
    setPhase("done");
    runningRef.current = false;
  }, [command, commit, runZone]);

  const reset = useCallback(() => {
    if (runningRef.current) return;
    lineSeq = 0;
    zonesRef.current = buildZones();
    commit();
    setPhase("idle");
    setBossNote(null);
    setFinalReport(null);
    setHumanNeeded(null);
    setDecompSource(null);
  }, [commit]);

  // ---- Hidden presenter override: force a stuck item to the human ----
  const triggerJam = useCallback(
    (zoneId: string) => {
      const zone = getZone(zoneId);
      if (zone.status !== "working" || zone.escalationPaused) return;
      zone.escalationPaused = true;
      zone.neededHuman = true;
      addLine(zoneId, {
        text: `Agent hit a stuck item → escalated to Manager.`,
        tone: "escalation",
      });
      addLine(zoneId, {
        text: `Manager couldn't resolve it → escalated to Boss.`,
        tone: "escalation",
      });
      addLine(zoneId, {
        text: `Boss couldn't resolve it → asking a human.`,
        tone: "escalation",
      });
      commit();
      setHumanNeeded({
        zoneId,
        message: `${zone.name}: a stuck item reached the Boss and needs a person to step in.`,
      });
    },
    [commit, addLine, getZone],
  );

  const resolveHuman = useCallback(() => {
    if (!humanNeeded) return;
    const zone = getZone(humanNeeded.zoneId);
    zone.escalationPaused = false;
    addLine(humanNeeded.zoneId, {
      text: `Human resolved the escalation. Work resumes.`,
      tone: "success",
      reviewed: true,
    });
    commit();
    setHumanNeeded(null);
  }, [humanNeeded, commit, addLine, getZone]);

  const busy =
    phase === "deciding" ||
    phase === "dispatched" ||
    phase === "working" ||
    phase === "summarizing";

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) run();
        }}
        className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
      >
        <input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Clean the house"
          className="min-w-[200px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <button
          type="submit"
          disabled={busy}
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
          Reset
        </button>
        <label className="ml-auto flex items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={showJam}
            onChange={(e) => setShowJam(e.target.checked)}
          />
          Presenter tools
        </label>
      </form>

      {/* Boss panel */}
      <div className="rounded-2xl border border-slate-300 bg-gradient-to-b from-indigo-50 to-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden>
            🧑‍💼
          </span>
          <div>
            <p className="text-sm font-bold text-slate-800">Boss</p>
            <p className="text-sm text-slate-600">
              {bossNote ?? "Waiting for an instruction from the human."}
              {phase === "deciding" ? (
                <span className="ml-1 inline-block animate-pulse-soft">●●●</span>
              ) : null}
            </p>
          </div>
          {decompSource ? (
            <span
              className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                decompSource === "ai"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
              title={
                decompSource === "ai"
                  ? "Plan came from a real Anthropic API call."
                  : "Live API unavailable — using the built-in fallback plan."
              }
            >
              {decompSource === "ai" ? "real AI plan" : "fallback plan"}
            </span>
          ) : null}
        </div>

        {finalReport ? (
          <div className="mt-3 animate-fade-in rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-emerald-600">
              Final report to the human
            </p>
            <pre className="whitespace-pre-wrap font-sans text-sm text-emerald-900">
              {finalReport}
            </pre>
          </div>
        ) : null}
      </div>

      {/* Human escalation exit point */}
      {humanNeeded ? (
        <EscalationBanner
          message={humanNeeded.message}
          onDismiss={resolveHuman}
        />
      ) : null}

      <HouseMap zones={zones} phase={phase} humanNeeded={humanNeeded} />

      {/* Zones */}
      <div className="grid gap-4 lg:grid-cols-3">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className="flex flex-col gap-3 rounded-2xl border border-slate-300 bg-white p-3 shadow-sm"
          >
            {/* Zone / Manager header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden>
                  🧑‍🔧
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {zone.name} · Manager
                  </p>
                  <StatusBadge zone={zone} />
                </div>
              </div>
              {showJam ? (
                <button
                  type="button"
                  onClick={() => triggerJam(zone.id)}
                  disabled={zone.status !== "working" || zone.escalationPaused}
                  className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-600 transition enabled:hover:bg-rose-100 disabled:opacity-40"
                  title="Force a stuck-item escalation for this zone"
                >
                  ⚠ Jam
                </button>
              ) : null}
            </div>

            {/* Manager instruction (from the Boss) */}
            <div className="min-h-[58px] rounded-xl bg-slate-50 p-2 text-[12px] leading-snug text-slate-600">
              {zone.instruction ? (
                <span className="animate-fade-in">{zone.instruction}</span>
              ) : (
                <span className="italic text-slate-400">
                  Awaiting instruction from the Boss…
                </span>
              )}
            </div>

            {/* Agents */}
            <div className="space-y-2">
              {zone.agents.map((agent) => (
                <AgentRow key={agent.id} agent={agent} />
              ))}
            </div>

            {/* Zone report log */}
            <ReportPanel
              title="Manager review log"
              lines={zone.report}
              emptyHint="No activity yet."
              className="h-44"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ zone }: { zone: ZoneRuntime }) {
  const map: Record<ZoneRuntime["status"], { text: string; cls: string }> = {
    idle: { text: "Idle", cls: "bg-slate-100 text-slate-500" },
    working: { text: "Working", cls: "bg-indigo-100 text-indigo-700" },
    delivered: { text: "Reported ✓", cls: "bg-emerald-100 text-emerald-700" },
  };
  const s = map[zone.status];
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.cls}`}
    >
      {s.text}
    </span>
  );
}

const HUB_BOTTOM = 30; // y where the rooms begin, below the boss hub
const DOORS = [18, 50, 82]; // doorway x for each room into the hub
const PARTITIONS = [34, 66]; // interior wall x positions
const WALL = "#8d8a82";
const FLOOR = "#c69b63";

type RoomLayout = {
  center: number;
  nameX: number;
  tint: string;
  shelfItem: ItemKind;
  furniture: { kind: FurnitureKind; x: number; y: number }[];
  tray: { x: number; y: number };
  shelf: { x: number; y: number };
  agentX: [number, number];
};

const ROOM_LAYOUT: Record<string, RoomLayout> = {
  A: {
    center: 18,
    nameX: 9,
    tint: "rgba(150,180,200,0.16)",
    shelfItem: "cup",
    furniture: [
      { kind: "sink", x: 11, y: 86 },
      { kind: "recycling", x: 27, y: 86 },
    ],
    tray: { x: 18, y: 42 },
    shelf: { x: 18, y: 64 },
    agentX: [12, 25],
  },
  B: {
    center: 50,
    nameX: 41,
    tint: "rgba(150,165,225,0.16)",
    shelfItem: "sock",
    furniture: [{ kind: "hamper", x: 50, y: 86 }],
    tray: { x: 50, y: 42 },
    shelf: { x: 50, y: 64 },
    agentX: [44, 56],
  },
  C: {
    center: 82,
    nameX: 73,
    tint: "rgba(205,170,135,0.18)",
    shelfItem: "book",
    furniture: [
      { kind: "bookshelf", x: 75, y: 86 },
      { kind: "toybox", x: 89, y: 86 },
    ],
    tray: { x: 82, y: 42 },
    shelf: { x: 82, y: 64 },
    agentX: [76, 88],
  },
};

// Small heap-cluster offsets so piles/shelves read as a little stack.
const CLUSTER: [number, number][] = [
  [-8, -2],
  [0, 0],
  [8, -1],
  [-5, 7],
  [4, 7],
  [-1, 14],
];

function agentPos(
  layout: RoomLayout,
  index: number,
  state: AgentState,
): { x: number; y: number } {
  const x = layout.agentX[index];
  if (state === "walking") return { x, y: layout.tray.y + 4 }; // up at the pile
  if (state === "working") return { x, y: 77 }; // down at the furniture
  return { x, y: layout.shelf.y }; // idle / done: resting in the room
}

function HouseMap({
  zones,
  phase,
  humanNeeded,
}: {
  zones: ZoneRuntime[];
  phase: Phase;
  humanNeeded: { zoneId: string; message: string } | null;
}) {
  const hasStarted = phase !== "idle";
  const dispatched =
    phase === "dispatched" ||
    phase === "working" ||
    phase === "summarizing" ||
    phase === "done";
  const reportActive =
    phase === "working" || phase === "summarizing" || phase === "done";
  const hubPile = phase === "idle" || phase === "deciding";

  const seamH =
    "repeating-linear-gradient(90deg, rgba(47,45,40,0.5) 0 1.5px, transparent 1.5px 40px)";
  const seamV =
    "repeating-linear-gradient(0deg, rgba(47,45,40,0.5) 0 1.5px, transparent 1.5px 40px)";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-500">
        <span>Top-down house view</span>
        <span>Report paths: Agent -&gt; Manager -&gt; Boss -&gt; Human</span>
      </div>
      <div
        aria-label="Top-down swarm facility"
        className="relative aspect-[16/9] w-full overflow-hidden rounded-lg shadow-xl ring-2 ring-[#241f18]"
        style={{
          backgroundColor: FLOOR,
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(74,48,22,0.16) 0 2px, transparent 2px 44px), repeating-linear-gradient(90deg, rgba(74,48,22,0.07) 0 1px, transparent 1px 132px)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{ boxShadow: "inset 0 0 70px rgba(40,24,8,0.35)" }}
          aria-hidden
        />

        {/* per-room floor tints */}
        {zones.map((zone) => {
          const i = ["A", "B", "C"].indexOf(zone.id);
          const x0 = i === 0 ? 3 : PARTITIONS[i - 1];
          const x1 = i === 2 ? 97 : PARTITIONS[i];
          return (
            <div
              key={`tint-${zone.id}`}
              className="pointer-events-none absolute z-0"
              style={{
                left: `${x0}%`,
                width: `${x1 - x0}%`,
                top: `${HUB_BOTTOM}%`,
                bottom: 0,
                backgroundColor: ROOM_LAYOUT[zone.id].tint,
              }}
              aria-hidden
            />
          );
        })}

        {/* interior walls (below outer walls) */}
        <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
          {/* hub divider */}
          <div
            className="absolute left-0 right-0"
            style={{
              top: `${HUB_BOTTOM}%`,
              height: 11,
              transform: "translateY(-6px)",
              backgroundColor: WALL,
              backgroundImage: seamH,
              boxShadow:
                "inset 0 3px 0 rgba(255,255,255,0.16), inset 0 -3px 0 rgba(0,0,0,0.30)",
            }}
          />
          {/* doorways punched into the divider */}
          {DOORS.map((x) => (
            <div
              key={`door-${x}`}
              className="absolute"
              style={{
                left: `${x - 4.5}%`,
                width: "9%",
                top: `${HUB_BOTTOM}%`,
                height: 16,
                transform: "translateY(-8px)",
                backgroundColor: FLOOR,
              }}
            />
          ))}
          {/* vertical partitions between rooms */}
          {PARTITIONS.map((x) => (
            <div
              key={`part-${x}`}
              className="absolute"
              style={{
                left: `${x}%`,
                width: 11,
                top: `${HUB_BOTTOM}%`,
                bottom: 0,
                transform: "translateX(-6px)",
                backgroundColor: WALL,
                backgroundImage: seamV,
                boxShadow:
                  "inset 3px 0 0 rgba(255,255,255,0.14), inset -3px 0 0 rgba(0,0,0,0.30)",
              }}
            />
          ))}
        </div>

        {/* outer walls (above interior so joints stay clean) */}
        <div className="pointer-events-none absolute inset-0 z-[2]" aria-hidden>
          <div
            className="absolute left-0 right-0 top-0 h-5"
            style={{
              backgroundColor: WALL,
              backgroundImage: seamH,
              boxShadow:
                "inset 0 3px 0 rgba(255,255,255,0.18), inset 0 -3px 0 rgba(0,0,0,0.32)",
            }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-5"
            style={{
              backgroundColor: WALL,
              backgroundImage: seamH,
              boxShadow:
                "inset 0 3px 0 rgba(0,0,0,0.28), inset 0 -3px 0 rgba(255,255,255,0.12)",
            }}
          />
          <div
            className="absolute bottom-0 left-0 top-0 w-5"
            style={{
              backgroundColor: WALL,
              backgroundImage: seamV,
              boxShadow:
                "inset 3px 0 0 rgba(255,255,255,0.16), inset -3px 0 0 rgba(0,0,0,0.32)",
            }}
          />
          <div
            className="absolute bottom-0 right-0 top-0 w-5"
            style={{
              backgroundColor: WALL,
              backgroundImage: seamV,
              boxShadow:
                "inset -3px 0 0 rgba(255,255,255,0.16), inset 3px 0 0 rgba(0,0,0,0.32)",
            }}
          />
        </div>

        {/* ---- Boss hub ---- */}
        <div
          className="absolute left-1/2 top-[4%] z-30 -translate-x-1/2 rounded bg-black/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
          aria-hidden
        >
          Boss office
        </div>
        <RoomWorker
          x={50}
          y={15}
          state={reportActive ? "working" : "sitting"}
          label="Boss"
        />
        <Marker x={64} y={13} tone="rose" label="Human exit" active={!!humanNeeded} />

        {/* The unsorted pile the Boss is about to split up. */}
        {hubPile ? (
          <div
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
            style={{ left: "36%", top: "16%" }}
            aria-hidden
          >
            {(["sock", "cup", "book", "can", "toy", "sock", "cup"] as ItemKind[]).map(
              (it, i) => (
                <span
                  key={i}
                  className="absolute"
                  style={{ left: CLUSTER[i % CLUSTER.length][0] * 1.4, top: CLUSTER[i % CLUSTER.length][1] * 1.4 }}
                >
                  <ItemSprite item={it} size={22} />
                </span>
              ),
            )}
          </div>
        ) : null}

        {/* ---- Rooms ---- */}
        {zones.map((zone) => {
          const layout = ROOM_LAYOUT[zone.id];
          const managerState = zone.managerActive
            ? zone.status === "delivered"
              ? "done"
              : "working"
            : "idle";
          const remaining = zone.agents.flatMap((a) => a.queue);

          return (
            <div key={zone.id}>
              {/* report path room -> boss */}
              <ReportPath
                x1={layout.center}
                y1={HUB_BOTTOM}
                x2={50}
                y2={20}
                active={reportActive && zone.status !== "idle"}
              />
              {humanNeeded?.zoneId === zone.id ? (
                <ReportPath x1={layout.center} y1={HUB_BOTTOM} x2={64} y2={13} active />
              ) : null}

              {/* room name */}
              <div
                className="absolute z-30 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm"
                style={{ left: `${layout.nameX}%`, top: `${HUB_BOTTOM + 3}%` }}
                aria-hidden
              >
                {zone.name}
              </div>

              {/* destination furniture / shelves */}
              {layout.furniture.map((f, i) => (
                <Furniture key={i} x={f.x} y={f.y} kind={f.kind} scale={0.78} />
              ))}

              {/* incoming pile for this room (drains as agents work) */}
              {dispatched && remaining.length > 0 ? (
                <div
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${layout.tray.x}%`, top: `${layout.tray.y}%` }}
                  aria-hidden
                >
                  {remaining.slice(0, 6).map((it, i) => (
                    <span
                      key={it.id}
                      className="absolute"
                      style={{ left: CLUSTER[i][0], top: CLUSTER[i][1] }}
                    >
                      <ItemSprite item={spriteFor(it.kind)} size={20} />
                    </span>
                  ))}
                </div>
              ) : null}

              {/* put-away items stacking near the furniture */}
              {zone.itemsCleared > 0 ? (
                <div
                  className="absolute z-[15] -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${layout.shelf.x}%`, top: `${layout.shelf.y + 10}%` }}
                  aria-hidden
                >
                  {Array.from({ length: Math.min(zone.itemsCleared, 6) }).map(
                    (_, i) => (
                      <span
                        key={i}
                        className="absolute"
                        style={{ left: CLUSTER[i][0], top: CLUSTER[i][1] }}
                      >
                        <ItemSprite item={layout.shelfItem} size={16} />
                      </span>
                    ),
                  )}
                </div>
              ) : null}

              {/* manager near the doorway */}
              <RoomWorker
                x={layout.center + 9}
                y={HUB_BOTTOM + 6}
                label={`${zone.name} mgr`}
                state={managerState}
              />

              {/* the two agents shuttling pile -> furniture */}
              {zone.agents.map((agent, index) => {
                const pos = agentPos(layout, index, agent.state);
                return (
                  <RoomWorker
                    key={agent.id}
                    x={pos.x}
                    y={pos.y}
                    label={agent.name}
                    state={agent.state}
                    carrying={agent.carrying}
                  />
                );
              })}

              {/* escalation marker — only while a human is actually needed */}
              {zone.neededHuman ? (
                <Marker
                  x={layout.center}
                  y={50}
                  tone="rose"
                  label="Needs human"
                  active
                />
              ) : null}
            </div>
          );
        })}

        <div className="absolute left-3 top-3 z-40 rounded bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600 shadow">
          {hasStarted ? "Swarm tidying the house" : "Waiting for a house instruction"}
        </div>
      </div>
    </div>
  );
}

function AgentRow({ agent }: { agent: AgentRuntime }) {
  const pct = agent.total === 0 ? 100 : (agent.cleared / agent.total) * 100;
  const stateLabel: Record<AgentState, string> = {
    idle: "idle",
    walking: "moving",
    working: "clearing",
    done: "done",
  };
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
      <span
        className={`text-xl ${
          agent.state === "walking"
            ? "animate-bob"
            : agent.state === "working"
              ? "animate-pulse-soft"
              : ""
        }`}
        aria-hidden
      >
        🤖
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
          <span>{agent.name}</span>
          <span className="text-slate-400">
            {agent.cleared}/{agent.total} · {stateLabel[agent.state]}
          </span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {agent.carrying ? (
        <span aria-hidden>
          <ItemSprite item={agent.carrying} size={18} />
        </span>
      ) : null}
    </div>
  );
}
