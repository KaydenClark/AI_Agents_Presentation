"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FurnitureKind, ItemKind, RoomCanvas } from "./RoomSprites";
import SpriteRenderer from "./sprites/SpriteRenderer";
import { SpriteEngine } from "./sprites/SpriteEngine";

type Phase = "idle" | "planning" | "working" | "done";
type AgentId = "A" | "B";
type Waypoint = { x: number; y: number };

interface TeamTask {
  id: string;
  agent: AgentId;
  kind: ItemKind;
  label: string;
  x: number;
  y: number;
  pickupDoorY: number;
  dest: { x: number; y: number; doorY: number; label: string };
}

const HOME: Record<AgentId, { x: number; y: number }> = {
  A: { x: 75, y: 38 },
  B: { x: 75, y: 68 },
};

const TASKS: TeamTask[] = [
  { id: "team-cup", agent: "A", kind: "cup", label: "cup", x: 22, y: 35, pickupDoorY: 55, dest: { x: 75, y: 35, doorY: 55, label: "Sink" } },
  { id: "team-plate", agent: "A", kind: "plate", label: "plate", x: 39, y: 47, pickupDoorY: 55, dest: { x: 86, y: 35, doorY: 55, label: "Cupboard" } },
  { id: "team-trash", agent: "A", kind: "trash", label: "trash", x: 24, y: 70, pickupDoorY: 55, dest: { x: 87, y: 75, doorY: 55, label: "Trash can" } },
  { id: "team-sock", agent: "B", kind: "sock", label: "sock", x: 34, y: 63, pickupDoorY: 55, dest: { x: 75, y: 62, doorY: 55, label: "Washer" } },
  { id: "team-shirt", agent: "B", kind: "shirt", label: "shirt", x: 48, y: 38, pickupDoorY: 55, dest: { x: 84, y: 70, doorY: 55, label: "Laundry basket" } },
  { id: "team-book", agent: "B", kind: "book", label: "book", x: 40, y: 74, pickupDoorY: 55, dest: { x: 87, y: 52, doorY: 55, label: "Bookshelf" } },
];

const FURNITURE: {
  kind: FurnitureKind;
  x: number;
  y: number;
  label: string;
}[] = [
  { kind: "sink", x: 75, y: 35, label: "" },
  { kind: "cupboard", x: 86, y: 35, label: "" },
  { kind: "bookshelf", x: 87, y: 52, label: "" },
  { kind: "washer", x: 75, y: 62, label: "" },
  { kind: "hamper", x: 84, y: 70, label: "" },
  { kind: "trashcan", x: 87, y: 75, label: "" },
];

const HALL_X = 67;
const LEFT_DOOR_X = 64;
const RIGHT_DOOR_X = 70;
const WALL = "#8d8a82";
const seamH =
  "repeating-linear-gradient(90deg, rgba(47,45,40,0.48) 0 1.5px, transparent 1.5px 40px)";
const seamV =
  "repeating-linear-gradient(0deg, rgba(47,45,40,0.48) 0 1.5px, transparent 1.5px 40px)";

function pickupRoute(task: TeamTask): Waypoint[] {
  return [
    { x: HALL_X, y: task.dest.doorY },
    { x: HALL_X, y: task.pickupDoorY },
    { x: LEFT_DOOR_X, y: task.pickupDoorY },
    { x: task.x, y: task.y },
  ];
}

function deliveryRoute(task: TeamTask): Waypoint[] {
  return [
    { x: LEFT_DOOR_X, y: task.pickupDoorY },
    { x: HALL_X, y: task.pickupDoorY },
    { x: HALL_X, y: task.dest.doorY },
    { x: RIGHT_DOOR_X, y: task.dest.doorY },
    { x: task.dest.x, y: task.dest.y },
  ];
}

function returnRoute(agent: AgentId): Waypoint[] {
  return [
    { x: HALL_X, y: HOME[agent].y },
    { x: RIGHT_DOOR_X, y: HOME[agent].y },
    HOME[agent],
  ];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function itemsForEngine(tasks: TeamTask[]) {
  return tasks.map((task) => ({
    id: task.id,
    kind: task.kind,
    x: task.x,
    y: task.y,
  }));
}

function TeamRoomWalls({
  x,
  y,
  w,
  h,
  door,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  door: "left" | "right";
}) {
  const gapV = 13;
  const segH = (h - gapV) / 2;
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

  return (
    <>
      <div
        className="absolute z-[2]"
        style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: 6, ...wallStyleH }}
        aria-hidden
      />
      <div
        className="absolute z-[2]"
        style={{ left: `${x}%`, top: `${y + h}%`, width: `${w}%`, height: 6, transform: "translateY(-6px)", ...wallStyleH }}
        aria-hidden
      />
      {door === "left" ? (
        <>
          <div
            className="absolute z-[2]"
            style={{ left: `${x}%`, top: `${y}%`, width: 6, height: `${segH}%`, ...wallStyleV }}
            aria-hidden
          />
          <div
            className="absolute z-[2]"
            style={{ left: `${x}%`, top: `${y + segH + gapV}%`, width: 6, height: `${segH}%`, ...wallStyleV }}
            aria-hidden
          />
        </>
      ) : (
        <div
          className="absolute z-[2]"
          style={{ left: `${x}%`, top: `${y}%`, width: 6, height: `${h}%`, ...wallStyleV }}
          aria-hidden
        />
      )}
      {door === "right" ? (
        <>
          <div
            className="absolute z-[2]"
            style={{ left: `${x + w}%`, top: `${y}%`, width: 6, height: `${segH}%`, transform: "translateX(-6px)", ...wallStyleV }}
            aria-hidden
          />
          <div
            className="absolute z-[2]"
            style={{ left: `${x + w}%`, top: `${y + segH + gapV}%`, width: 6, height: `${segH}%`, transform: "translateX(-6px)", ...wallStyleV }}
            aria-hidden
          />
        </>
      ) : (
        <div
          className="absolute z-[2]"
          style={{ left: `${x + w}%`, top: `${y}%`, width: 6, height: `${h}%`, transform: "translateX(-6px)", ...wallStyleV }}
          aria-hidden
        />
      )}
    </>
  );
}

export default function SmallTeamScene() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [remaining, setRemaining] = useState<TeamTask[]>(TASKS);
  const [reports, setReports] = useState<string[]>([
    "Manager is waiting for one instruction.",
  ]);
  const [agentStatus, setAgentStatus] = useState<Record<AgentId, string>>({
    A: "ready",
    B: "ready",
  });
  const engineRef = useRef<SpriteEngine | null>(null);
  const runningRef = useRef(false);

  const resetEngine = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.setFurniture(FURNITURE);
    engine.setItems(itemsForEngine(TASKS));
    engine.setPaths([]);
    engine.setActors([
      { id: "manager", x: 88, y: 18, state: "idle", scale: 0.95 },
      { id: "agent-a", x: HOME.A.x, y: HOME.A.y, state: "idle", scale: 0.9 },
      { id: "agent-b", x: HOME.B.x, y: HOME.B.y, state: "idle", scale: 0.9 },
    ]);
  }, []);

  const handleReady = useCallback(
    (engine: SpriteEngine) => {
      engineRef.current = engine;
      resetEngine();
    },
    [resetEngine],
  );

  useEffect(() => {
    engineRef.current?.setItems(itemsForEngine(remaining));
  }, [remaining]);

  const reset = useCallback(() => {
    if (runningRef.current) return;
    setPhase("idle");
    setRemaining(TASKS);
    setReports(["Manager is waiting for one instruction."]);
    setAgentStatus({ A: "ready", B: "ready" });
    resetEngine();
  }, [resetEngine]);

  const walkRoute = useCallback(
    async (actorId: string, route: Waypoint[], stepMs = 430) => {
      const engine = engineRef.current;
      if (!engine) return;
      for (const stop of route) {
        engine.moveActor(actorId, stop.x, stop.y, stepMs);
        await sleep(stepMs + 80);
      }
    },
    [],
  );

  const workTask = useCallback(async (agent: AgentId, task: TeamTask) => {
    const engine = engineRef.current;
    if (!engine) return;
    const actorId = agent === "A" ? "agent-a" : "agent-b";

    setAgentStatus((prev) => ({ ...prev, [agent]: `carrying ${task.label}` }));
    engine.setActorState(actorId, "walking");
    await walkRoute(actorId, pickupRoute(task));

    engine.setActorState(actorId, "working");
    engine.setRemoving(task.id);
    await sleep(260);
    engine.setActorCarry(actorId, task.kind);
    setRemaining((prev) => prev.filter((item) => item.id !== task.id));
    await sleep(180);

    engine.setActorState(actorId, "walking");
    await walkRoute(actorId, deliveryRoute(task));
    engine.setActorState(actorId, "working");
    await sleep(260);
    engine.setActorCarry(actorId, null);
    engine.poof(task.dest.x, task.dest.y);
    setReports((prev) => [
      ...prev,
      `Agent ${agent} put the ${task.label} in ${task.dest.label}.`,
    ]);
    await sleep(260);
  }, [walkRoute]);

  const runAgent = useCallback(
    async (agent: AgentId) => {
      const actorId = agent === "A" ? "agent-a" : "agent-b";
      const engine = engineRef.current;
      const tasks = TASKS.filter((task) => task.agent === agent);

      for (const task of tasks) {
        await workTask(agent, task);
      }

      if (engine) {
        engine.setActorState(actorId, "walking");
        await walkRoute(actorId, returnRoute(agent), 380);
      }
      engine?.setActorState(actorId, "done");
      setAgentStatus((prev) => ({ ...prev, [agent]: "complete" }));
    },
    [walkRoute, workTask],
  );

  const run = useCallback(async () => {
    if (runningRef.current) return;
    const engine = engineRef.current;
    runningRef.current = true;
    setPhase("planning");
    setReports(["Manager is splitting the two-room house into two queues."]);
    engine?.setActorState("manager", "working");
    engine?.setActorThought("manager", "Split by station");
    engine?.setPaths([
      { x1: 88, y1: 18, x2: 67, y2: 55, active: true },
      { x1: 64, y1: 55, x2: 70, y2: 55, active: true },
    ]);
    await sleep(900);

    engine?.setActorThought("manager", null);
    setReports((prev) => [
      ...prev,
      "Manager assigned dishes and trash to Agent A, then laundry and shelves to Agent B.",
    ]);
    setPhase("working");
    await Promise.all([runAgent("A"), runAgent("B")]);

    engine?.setActorState("manager", "done");
    setPhase("done");
    setReports((prev) => [...prev, "Team report delivered."]);
    runningRef.current = false;
  }, [runAgent]);

  const busy = phase === "planning" || phase === "working";

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!busy) run();
        }}
        className="flex flex-wrap items-center gap-3 rounded-lg border border-[#474747] bg-[#191919] p-3 shadow-sm"
      >
        <div className="min-w-[220px] flex-1 rounded-lg border border-[#474747] bg-[#0A0A0A] px-3 py-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">
            Fixed human instruction
          </p>
          <p className="text-sm font-semibold text-[#F7F7F7]">
            Clean this small house
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full border border-[#E0BD3E]/40 bg-[#E0BD3E]/15 px-3 py-1 text-[#f1d977]">
            1 Manager
          </span>
          <span className="rounded-full border border-[#4DAA57]/40 bg-[#4DAA57]/15 px-3 py-1 text-[#95df9d]">
            2 Agents
          </span>
        </div>
        <button
          type="submit"
          disabled={busy || phase === "done"}
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
          Reset
        </button>
      </form>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <RoomCanvas ariaLabel="Top-down small team two-room house">
          <TeamRoomWalls x={8} y={23} w={56} h={62} door="right" />
          <TeamRoomWalls x={70} y={23} w={22} h={62} door="left" />
          <div
            className="absolute left-[26%] top-[25%] z-[4] -translate-x-1/2 rounded bg-black/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
            aria-hidden
          >
            Messy living room
          </div>
          <div
            className="absolute left-[81%] top-[25%] z-[4] -translate-x-1/2 rounded bg-black/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
            aria-hidden
          >
            Team work room
          </div>
          <SpriteRenderer
            onReady={handleReady}
            ariaLabel="Top-down small team two-room house"
          />
          <div className="absolute left-3 top-3 z-40 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600 shadow">
            {remaining.length} item{remaining.length === 1 ? "" : "s"} left
          </div>
          {phase === "done" ? (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/10">
              <div className="animate-fade-in rounded-lg bg-emerald-600 px-8 py-5 text-center text-white shadow-lg">
                <div className="text-3xl font-bold">Team report delivered</div>
                <div className="mt-1 text-sm opacity-90">
                  The Manager split one goal across two workers.
                </div>
              </div>
            </div>
          ) : null}
        </RoomCanvas>

        <aside className="rounded-lg border border-[#474747] bg-[#191919] p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#1ABCBD]">
            Manager board
          </p>
          <div className="mt-3 grid gap-2 text-sm">
            <div className="rounded-lg border border-[#474747] bg-[#0A0A0A] p-3">
              Agent A: {agentStatus.A}
            </div>
            <div className="rounded-lg border border-[#474747] bg-[#0A0A0A] p-3">
              Agent B: {agentStatus.B}
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm text-zinc-300">
            {reports.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
