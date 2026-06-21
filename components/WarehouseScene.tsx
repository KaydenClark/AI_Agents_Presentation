"use client";

import { useCallback, useRef, useState } from "react";
import ReportPanel, { ReportLine } from "./ReportPanel";
import EscalationBanner from "./EscalationBanner";
import { Marker, ReportPath } from "./ScenePrimitives";
import {
  Furniture,
  FurnitureKind,
  ItemKind,
  ItemSprite,
  RoomWorker,
} from "./RoomSprites";

type Phase =
  | "idle"
  | "deciding"
  | "dispatched"
  | "working"
  | "summarizing"
  | "done";
type AgentState = "idle" | "walking" | "working" | "done";

type Waypoint = { x: number; y: number; label: string };

interface Job {
  id: string;
  sprite: ItemKind;
  /** Color override so books (and clothes) can be sorted by color/type. */
  tint?: string;
  /** Living-room (or in-room) pile this item visually starts from. */
  pile: string;
  /** Multi-step route: pick up at [0], process in the middle, place at [last]. */
  route: Waypoint[];
  jammed?: boolean;
}

interface AgentRuntime {
  id: string;
  name: string;
  lane: number;
  pos: { x: number; y: number };
  home: { x: number; y: number };
  queue: Job[];
  total: number;
  cleared: number;
  state: AgentState;
  carrying: ItemKind | null;
  carryingTint?: string;
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
const STEP = 360;

const WALL = "#8d8a82";
const FLOOR = "#c69b63";
const seamH =
  "repeating-linear-gradient(90deg, rgba(47,45,40,0.5) 0 1.5px, transparent 1.5px 40px)";
const seamV =
  "repeating-linear-gradient(0deg, rgba(47,45,40,0.5) 0 1.5px, transparent 1.5px 40px)";

let lineSeq = 0;
const nextId = () => `l${lineSeq++}`;
let jobSeq = 0;
const jobId = () => `j${jobSeq++}`;

// Outside sorting spots: trash that can vs. cannot be recycled.
const OUT_RECYCLE: Waypoint = { x: 46, y: 94, label: "the recycling outside" };
const OUT_LANDFILL: Waypoint = { x: 54, y: 94, label: "the trash outside" };
const hallway = (y: number): Waypoint => ({ x: 50, y, label: "the hallway" });

// Book colors -> which shelf they get sorted onto in the Office.
const BOOK_COLORS: { tint: string; shelf: string }[] = [
  { tint: "#c0413b", shelf: "the red shelf" },
  { tint: "#2f6db0", shelf: "the blue shelf" },
  { tint: "#3b8f4e", shelf: "the green shelf" },
  { tint: "#d99a2a", shelf: "the yellow shelf" },
];

// Laundry folding baskets, one per clothing type.
const BASKETS: Record<string, { x: number; label: string }> = {
  shirt: { x: 61, label: "the shirts basket" },
  sock: { x: 71, label: "the socks basket" },
  towel: { x: 81, label: "the towels basket" },
};

type FurnDef = {
  kind: FurnitureKind;
  x: number;
  y: number;
  label?: string;
  scale?: number;
};

type RoomDef = {
  id: string;
  name: string;
  rect: { x: number; y: number; w: number; h: number };
  door: "left" | "right";
  tint: string;
  label: { x: number; y: number };
  /** Manager spot + agent home spots — only set for the three worker rooms. */
  manager?: { x: number; y: number };
  agentHomes?: { x: number; y: number }[];
  furniture: FurnDef[];
};

// Four rooms: one big Living room (the mess source) on the left, and the
// three rooms where work actually gets done stacked on the right.
const ROOMS: Record<string, RoomDef> = {
  LIVING: {
    id: "LIVING",
    name: "Living room",
    rect: { x: 4, y: 18, w: 42, h: 72 },
    door: "right",
    tint: "rgba(205,170,135,0.18)",
    label: { x: 7, y: 21 },
    furniture: [
      { kind: "couch", x: 17, y: 82, scale: 0.7 },
      { kind: "couch", x: 35, y: 84, scale: 0.55 },
    ],
  },
  KITCHEN: {
    id: "KITCHEN",
    name: "Kitchen",
    rect: { x: 54, y: 18, w: 42, h: 24 },
    door: "left",
    tint: "rgba(150,180,200,0.16)",
    label: { x: 57, y: 20.5 },
    manager: { x: 58, y: 30 },
    agentHomes: [
      { x: 70, y: 27 },
      { x: 80, y: 27 },
    ],
    furniture: [
      { kind: "sink", x: 87, y: 32, label: "Sink", scale: 0.55 },
      { kind: "cupboard", x: 67, y: 37, label: "Cupboard", scale: 0.55 },
    ],
  },
  LAUNDRY: {
    id: "LAUNDRY",
    name: "Laundry room",
    rect: { x: 54, y: 42, w: 42, h: 24 },
    door: "left",
    tint: "rgba(150,165,225,0.16)",
    label: { x: 57, y: 44.5 },
    manager: { x: 58, y: 54 },
    agentHomes: [
      { x: 69, y: 51 },
      { x: 79, y: 51 },
    ],
    furniture: [
      { kind: "washer", x: 88, y: 52, label: "Washer", scale: 0.55 },
      { kind: "basket", x: 61, y: 61, label: "Shirts", scale: 0.5 },
      { kind: "basket", x: 71, y: 61, label: "Socks", scale: 0.5 },
      { kind: "basket", x: 81, y: 61, label: "Towels", scale: 0.5 },
    ],
  },
  OFFICE: {
    id: "OFFICE",
    name: "Office",
    rect: { x: 54, y: 66, w: 42, h: 24 },
    door: "left",
    tint: "rgba(170,160,205,0.16)",
    label: { x: 57, y: 68.5 },
    manager: { x: 58, y: 78 },
    agentHomes: [
      { x: 70, y: 75 },
      { x: 80, y: 75 },
    ],
    furniture: [
      { kind: "bookshelf", x: 87, y: 80, label: "Shelves (by color)", scale: 0.55 },
    ],
  },
};

// Piles of clutter the agents work down. Living-room piles are the main mess;
// every room also has a trash pile (recyclable + landfill) of its own.
type PileDef = { id: string; x: number; y: number };
const PILES: PileDef[] = [
  { id: "lr-clothes", x: 13, y: 30 },
  { id: "lr-dishes", x: 32, y: 31 },
  { id: "lr-books", x: 13, y: 58 },
  { id: "lr-trash", x: 31, y: 64 },
  { id: "kitchen-trash", x: 66, y: 26 },
  { id: "laundry-trash", x: 62, y: 47 },
  { id: "office-trash", x: 63, y: 72 },
];

function wp(x: number, y: number, label: string): Waypoint {
  return { x, y, label };
}

function job(
  sprite: ItemKind,
  pile: string,
  route: Waypoint[],
  extra: { tint?: string; jammed?: boolean } = {},
): Job {
  return { id: jobId(), sprite, pile, route, ...extra };
}

/* Route builders for the three workflows + the shared trash flow. */

// Dishes: living-room pile -> kitchen sink (wash) -> cupboard (put away).
function dishRoute(): Waypoint[] {
  const P = PILES.find((p) => p.id === "lr-dishes")!;
  return [
    wp(P.x, P.y, "the living-room pile"),
    wp(87, 32, "the sink"),
    wp(67, 37, "the cupboard"),
  ];
}

// Clothes: living-room pile -> washer (wash) -> folding basket (by type).
function clothesRoute(type: string): Waypoint[] {
  const P = PILES.find((p) => p.id === "lr-clothes")!;
  const basket = BASKETS[type] ?? BASKETS.shirt;
  return [
    wp(P.x, P.y, "the living-room pile"),
    wp(88, 52, "the washer"),
    wp(basket.x, 61, basket.label),
  ];
}

// Books: living-room pile -> bookshelf, shelved by color.
function bookRoute(shelf: string): Waypoint[] {
  const P = PILES.find((p) => p.id === "lr-books")!;
  return [wp(P.x, P.y, "the living-room pile"), wp(87, 80, shelf)];
}

// Trash: a pile -> hallway -> the right outside spot (recycle vs. landfill).
function trashRoute(
  from: { x: number; y: number; label: string },
  hallY: number,
  out: Waypoint,
): Waypoint[] {
  return [wp(from.x, from.y, from.label), hallway(hallY), out];
}

/**
 * One messy house, three crews. The Living room is buried in piles; the
 * Kitchen, Laundry, and Office crews each carry their kind of item out of the
 * living room, clean or sort it, and put it away. Trash from every room is
 * sorted and taken outside. The Boss splits the whole job across the crews.
 */
function buildZones(): ZoneRuntime[] {
  jobSeq = 0;

  const lrTrash = { x: 31, y: 64, label: "the living-room floor" };

  // ---- Kitchen crew: dishes + trash ----
  const kitchenJobs: Job[] = [
    job("plate", "lr-dishes", dishRoute()),
    job("fork", "lr-dishes", dishRoute()),
    job("cup", "lr-dishes", dishRoute()),
    job("plate", "lr-dishes", dishRoute()),
    job("can", "lr-trash", trashRoute(lrTrash, 62, OUT_RECYCLE)),
    job(
      "can",
      "kitchen-trash",
      trashRoute({ x: 66, y: 26, label: "the kitchen bin" }, 30, OUT_RECYCLE),
    ),
    job(
      "trash",
      "kitchen-trash",
      trashRoute({ x: 66, y: 26, label: "the kitchen bin" }, 30, OUT_LANDFILL),
    ),
  ];

  // ---- Laundry crew: clothes (sorted into baskets by type) + trash ----
  const laundryJobs: Job[] = [
    job("shirt", "lr-clothes", clothesRoute("shirt")),
    job("sock", "lr-clothes", clothesRoute("sock")),
    job("towel", "lr-clothes", clothesRoute("towel")),
    job("shirt", "lr-clothes", clothesRoute("shirt")),
    job("towel", "lr-clothes", clothesRoute("towel"), { jammed: true }), // tangled load
    job(
      "can",
      "laundry-trash",
      trashRoute({ x: 62, y: 47, label: "the laundry bin" }, 54, OUT_RECYCLE),
    ),
    job(
      "trash",
      "laundry-trash",
      trashRoute({ x: 62, y: 47, label: "the laundry bin" }, 54, OUT_LANDFILL),
    ),
  ];

  // ---- Office crew: books (shelved by color) + trash ----
  const officeJobs: Job[] = [
    ...BOOK_COLORS.map((c) =>
      job("book", "lr-books", bookRoute(c.shelf), { tint: c.tint }),
    ),
    job("trash", "lr-trash", trashRoute(lrTrash, 62, OUT_LANDFILL)),
    job(
      "can",
      "office-trash",
      trashRoute({ x: 63, y: 72, label: "the office bin" }, 78, OUT_RECYCLE),
    ),
    job(
      "trash",
      "office-trash",
      trashRoute({ x: 63, y: 72, label: "the office bin" }, 78, OUT_LANDFILL),
    ),
  ];

  const split = (items: Job[]): [Job[], Job[]] => {
    const half = Math.ceil(items.length / 2);
    return [items.slice(0, half), items.slice(half)];
  };

  const mkAgent = (
    id: string,
    name: string,
    lane: number,
    home: { x: number; y: number },
    queue: Job[],
  ): AgentRuntime => ({
    id,
    name,
    lane,
    pos: { ...home },
    home,
    queue,
    total: queue.length,
    cleared: 0,
    state: "idle",
    carrying: null,
  });

  const twoAgentZone = (id: string, jobs: Job[]): ZoneRuntime => {
    const room = ROOMS[id];
    const homes = room.agentHomes!;
    const [q1, q2] = split(jobs);
    return {
      id,
      name: room.name,
      instruction: null,
      managerActive: false,
      agents: [
        mkAgent(`${id}1`, `${room.name} · Agent 1`, 0, homes[0], q1),
        mkAgent(`${id}2`, `${room.name} · Agent 2`, 1, homes[1], q2),
      ],
      report: [],
      status: "idle",
      itemsCleared: 0,
      escalationsResolved: 0,
      neededHuman: false,
      escalationPaused: false,
    };
  };

  // 3 Managers, each running 2 Agents = 6 Agents (+ the Boss = 10 in all).
  return [
    twoAgentZone("KITCHEN", kitchenJobs),
    twoAgentZone("LAUNDRY", laundryJobs),
    twoAgentZone("OFFICE", officeJobs),
  ];
}

function zoneItemSummary(zone: ZoneRuntime) {
  const counts = new Map<string, number>();
  for (const agent of zone.agents) {
    for (const j of agent.queue) {
      counts.set(j.sprite, (counts.get(j.sprite) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries()).map(([kind, count]) => ({ kind, count }));
}

// Remaining items in each pile, across every crew, so piles visibly shrink.
function remainingByPile(zones: ZoneRuntime[]): Map<string, Job[]> {
  const map = new Map<string, Job[]>();
  for (const zone of zones) {
    for (const agent of zone.agents) {
      for (const j of agent.queue) {
        const arr = map.get(j.pile) ?? [];
        arr.push(j);
        map.set(j.pile, arr);
      }
    }
  }
  return map;
}

export default function WarehouseScene() {
  const [zones, setZones] = useState<ZoneRuntime[]>(buildZones);
  const [phase, setPhase] = useState<Phase>("idle");
  const [command, setCommand] = useState("");
  const [bossNote, setBossNote] = useState<string | null>(null);
  const [decompSource, setDecompSource] = useState<"ai" | "fallback" | null>(null);
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
        agents: z.agents.map((a) => ({ ...a, queue: [...a.queue], pos: { ...a.pos } })),
        report: [...z.report],
      })),
    );
  }, []);

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

  // ---- One agent works its queue, following each job's multi-step route ----
  const runAgent = useCallback(
    async (zoneId: string, agentId: string) => {
      const zone = getZone(zoneId);
      const agent = zone.agents.find((a) => a.id === agentId)!;
      const off = agent.lane === 0 ? -3 : 3;

      while (agent.queue.length > 0) {
        while (getZone(zoneId).escalationPaused) {
          agent.state = "idle";
          commit();
          await sleep(250);
        }

        const j = agent.queue[0];
        const name = j.sprite;

        for (let i = 0; i < j.route.length; i++) {
          const stop = j.route[i];
          agent.state = "walking";
          agent.pos = { x: stop.x + off, y: stop.y };
          commit();
          await sleep(STEP);

          // A tangled load at pickup: escalate to the Manager, who resolves it.
          if (i === 0 && j.jammed) {
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

          agent.state = "working";
          if (i === 0) {
            agent.carrying = j.sprite; // picked it up
            agent.carryingTint = j.tint;
          }
          commit();
          await sleep(STEP * 0.75);
        }

        // Placed at the final stop.
        const dest = j.route[j.route.length - 1].label;
        agent.carrying = null;
        agent.carryingTint = undefined;
        agent.queue.shift();
        agent.cleared += 1;
        zone.itemsCleared += 1;
        addLine(zoneId, {
          text: `${agent.name} took a ${name} to ${dest} → Manager reviewed.`,
          reviewed: true,
        });
        commit();
        await sleep(STEP * 0.4);
      }

      agent.state = "done";
      agent.pos = { ...agent.home };
      commit();
    },
    [commit, addLine, getZone],
  );

  const runZone = useCallback(
    async (zoneId: string) => {
      const zone = getZone(zoneId);
      zone.status = "working";
      zone.managerActive = true;
      commit();

      await Promise.all(zone.agents.map((a) => runAgent(zoneId, a.id)));

      addLine(zoneId, {
        text: `All done. Manager delivered the ${zone.name} report to the Boss.`,
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

    lineSeq = 0;
    zonesRef.current = buildZones();
    commit();
    setFinalReport(null);
    setHumanNeeded(null);
    setDecompSource(null);

    const prompt = command.trim() || "Clean the house";

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
        z.instruction = `Tidy the ${z.name} and report back when done.`;
      }
      setDecompSource("fallback");
    }

    const decideElapsed = Date.now() - decideStart;
    if (decideElapsed < 900) await sleep(900 - decideElapsed);

    setBossNote("Boss dispatched a plan to each room's Manager.");
    setPhase("dispatched");
    commit();
    await sleep(900);

    setPhase("working");
    await Promise.all(zonesRef.current.map((z) => runZone(z.id)));

    setPhase("summarizing");
    setBossNote("Every room reported in. Boss is writing the final report…");

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
        results.map((r) => `${r.name}: ${r.itemsCleared} items handled.`).join("\n"),
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
                  ? "Plan came from a real OpenAI API call."
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

      {humanNeeded ? (
        <EscalationBanner message={humanNeeded.message} onDismiss={resolveHuman} />
      ) : null}

      <HouseMap zones={zones} phase={phase} humanNeeded={humanNeeded} />

      {/* Room / Manager panels */}
      <div className="grid gap-4 lg:grid-cols-3">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className="flex flex-col gap-3 rounded-2xl border border-slate-300 bg-white p-3 shadow-sm"
          >
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
                  title="Force a stuck-item escalation for this room"
                >
                  ⚠ Jam
                </button>
              ) : null}
            </div>

            <div className="min-h-[44px] rounded-xl bg-slate-50 p-2 text-[12px] leading-snug text-slate-600">
              {zone.instruction ? (
                <span className="animate-fade-in">{zone.instruction}</span>
              ) : (
                <span className="italic text-slate-400">
                  Awaiting instruction from the Boss…
                </span>
              )}
            </div>

            <div className="space-y-2">
              {zone.agents.map((agent) => (
                <AgentRow key={agent.id} agent={agent} />
              ))}
            </div>

            <ReportPanel
              title="Manager review log"
              lines={zone.report}
              emptyHint="No activity yet."
              className="h-36"
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

// Tight cluster offsets (px) so each pile reads as a heap, not a single object.
const PILE_OFFSETS: [number, number][] = [
  [-9, -3],
  [1, -6],
  [10, -2],
  [-6, 5],
  [4, 5],
  [-1, 12],
  [-12, 7],
  [12, 7],
];

function Pile({ x, y, jobs }: { x: number; y: number; jobs: Job[] }) {
  if (jobs.length === 0) return null;
  const shown = jobs.slice(0, PILE_OFFSETS.length);
  return (
    <div
      className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%` }}
      aria-hidden
    >
      {shown.map((j, i) => (
        <span
          key={j.id}
          className="absolute"
          style={{ left: PILE_OFFSETS[i][0], top: PILE_OFFSETS[i][1] }}
        >
          <ItemSprite item={j.sprite} size={18} tint={j.tint} />
        </span>
      ))}
      <span className="absolute -left-3 -top-5 rounded-full bg-black/55 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
        ×{jobs.length}
      </span>
    </div>
  );
}

function RoomBox({ def }: { def: RoomDef }) {
  const { x, y, w, h } = def.rect;
  const gapV = 8; // doorway height (% of canvas) for left/right doors
  const wallStyleH = {
    backgroundColor: WALL,
    backgroundImage: seamH,
    boxShadow: "inset 0 0 0 1px rgba(40,38,34,0.35)",
  };
  const wallStyleV = {
    backgroundColor: WALL,
    backgroundImage: seamV,
    boxShadow: "inset 0 0 0 1px rgba(40,38,34,0.35)",
  };
  const segH = (h - gapV) / 2;

  return (
    <>
      {/* tint */}
      <div
        className="absolute z-0"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          width: `${w}%`,
          height: `${h}%`,
          backgroundColor: def.tint,
        }}
        aria-hidden
      />
      {/* top + bottom */}
      <div className="absolute z-[1]" style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: 6, ...wallStyleH }} aria-hidden />
      <div className="absolute z-[1]" style={{ left: `${x}%`, top: `${y + h}%`, width: `${w}%`, height: 6, transform: "translateY(-6px)", ...wallStyleH }} aria-hidden />
      {/* left wall (or split for a left door) */}
      {def.door === "left" ? (
        <>
          <div className="absolute z-[1]" style={{ left: `${x}%`, top: `${y}%`, width: 6, height: `${segH}%`, ...wallStyleV }} aria-hidden />
          <div className="absolute z-[1]" style={{ left: `${x}%`, top: `${y + segH + gapV}%`, width: 6, height: `${segH}%`, ...wallStyleV }} aria-hidden />
        </>
      ) : (
        <div className="absolute z-[1]" style={{ left: `${x}%`, top: `${y}%`, width: 6, height: `${h}%`, ...wallStyleV }} aria-hidden />
      )}
      {/* right wall (or split for a right door) */}
      {def.door === "right" ? (
        <>
          <div className="absolute z-[1]" style={{ left: `${x + w}%`, top: `${y}%`, width: 6, height: `${segH}%`, transform: "translateX(-6px)", ...wallStyleV }} aria-hidden />
          <div className="absolute z-[1]" style={{ left: `${x + w}%`, top: `${y + segH + gapV}%`, width: 6, height: `${segH}%`, transform: "translateX(-6px)", ...wallStyleV }} aria-hidden />
        </>
      ) : (
        <div className="absolute z-[1]" style={{ left: `${x + w}%`, top: `${y}%`, width: 6, height: `${h}%`, transform: "translateX(-6px)", ...wallStyleV }} aria-hidden />
      )}
    </>
  );
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

  const piles = remainingByPile(zones);

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

        {/* Boss office (hub) box across the top, door to the hallway */}
        <div
          className="absolute z-0"
          style={{ left: "4%", top: "4%", width: "92%", height: "11%", backgroundColor: "rgba(150,140,205,0.16)" }}
          aria-hidden
        />
        <div className="absolute z-[1]" style={{ left: "4%", top: "4%", width: "92%", height: 6, backgroundColor: WALL, backgroundImage: seamH }} aria-hidden />
        <div className="absolute z-[1]" style={{ left: "4%", top: "4%", width: 6, height: "11%", backgroundColor: WALL, backgroundImage: seamV }} aria-hidden />
        <div className="absolute z-[1]" style={{ left: "96%", top: "4%", width: 6, height: "11%", transform: "translateX(-6px)", backgroundColor: WALL, backgroundImage: seamV }} aria-hidden />
        {/* hub bottom wall split for the hallway doorway */}
        <div className="absolute z-[1]" style={{ left: "4%", top: "15%", width: "41%", height: 6, transform: "translateY(-6px)", backgroundColor: WALL, backgroundImage: seamH }} aria-hidden />
        <div className="absolute z-[1]" style={{ left: "55%", top: "15%", width: "41%", height: 6, transform: "translateY(-6px)", backgroundColor: WALL, backgroundImage: seamH }} aria-hidden />

        {/* Rooms */}
        {Object.values(ROOMS).map((def) => (
          <RoomBox key={def.id} def={def} />
        ))}

        {/* outer bottom wall split for the door to "outside" */}
        <div className="absolute z-[1]" style={{ left: "4%", top: "90%", width: "42%", height: 6, transform: "translateY(-6px)", backgroundColor: WALL, backgroundImage: seamH }} aria-hidden />
        <div className="absolute z-[1]" style={{ left: "54%", top: "90%", width: "42%", height: 6, transform: "translateY(-6px)", backgroundColor: WALL, backgroundImage: seamH }} aria-hidden />

        {/* ---- Boss hub contents ---- */}
        <div
          className="absolute left-1/2 top-[5%] z-30 -translate-x-1/2 rounded bg-black/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
          aria-hidden
        >
          Boss office
        </div>
        <RoomWorker x={50} y={10} state={reportActive ? "working" : "sitting"} label="Boss" />
        <Marker x={62} y={9} tone="rose" label="Human exit" active={!!humanNeeded} />

        {/* ---- Outside trash spot ---- */}
        <div
          className="absolute top-[91.5%] z-30 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm"
          style={{ left: "7%" }}
          aria-hidden
        >
          Outside
        </div>
        <Furniture x={46} y={94} kind="recycling" label="Recycle" scale={0.45} />
        <Furniture x={54} y={94} kind="trashcan" label="Landfill" scale={0.45} />

        {/* ---- Room names + furniture (all four rooms) ---- */}
        {Object.values(ROOMS).map((def) => (
          <div key={`room-${def.id}`}>
            <div
              className="absolute z-30 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm"
              style={{ left: `${def.label.x}%`, top: `${def.label.y}%` }}
              aria-hidden
            >
              {def.name}
            </div>
            {def.furniture.map((f, i) => (
              <Furniture key={i} x={f.x} y={f.y} kind={f.kind} label={f.label} scale={f.scale ?? 0.6} />
            ))}
          </div>
        ))}

        {/* ---- Clutter piles (living room + every room's trash) ---- */}
        {PILES.map((p) => (
          <Pile key={p.id} x={p.x} y={p.y} jobs={piles.get(p.id) ?? []} />
        ))}

        {/* ---- Managers, agents, and report paths (the three crews) ---- */}
        {zones.map((zone) => {
          const def = ROOMS[zone.id];
          const mgr = def.manager!;
          const managerState = zone.managerActive
            ? zone.status === "delivered"
              ? "done"
              : "working"
            : "idle";

          return (
            <div key={zone.id}>
              <ReportPath x1={mgr.x} y1={mgr.y} x2={50} y2={12} active={reportActive && zone.status !== "idle"} />
              {humanNeeded?.zoneId === zone.id ? (
                <ReportPath x1={mgr.x} y1={mgr.y} x2={62} y2={9} active />
              ) : null}

              {/* manager near the doorway */}
              <RoomWorker x={mgr.x} y={mgr.y} label={`${zone.name} mgr`} state={managerState} />

              {/* agents on their routes */}
              {zone.agents.map((agent) => (
                <RoomWorker
                  key={agent.id}
                  x={agent.pos.x}
                  y={agent.pos.y}
                  label={agent.name.replace(`${zone.name} · `, "")}
                  state={dispatched ? agent.state : "idle"}
                  carrying={agent.carrying}
                  carryingTint={agent.carryingTint}
                />
              ))}

              {zone.neededHuman ? (
                <Marker x={mgr.x} y={mgr.y - 6} tone="rose" label="Needs human" active />
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
    working: "working",
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
          <ItemSprite item={agent.carrying} size={18} tint={agent.carryingTint} />
        </span>
      ) : null}
    </div>
  );
}
