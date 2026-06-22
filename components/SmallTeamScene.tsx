"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FurnitureKind, ItemKind, RoomCanvas } from "./RoomSprites";
import SpriteRenderer from "./sprites/SpriteRenderer";
import { SpriteEngine } from "./sprites/SpriteEngine";

type Phase = "idle" | "planning" | "working" | "done";
type AgentId = "A" | "B";

interface TeamTask {
  id: string;
  agent: AgentId;
  kind: ItemKind;
  label: string;
  x: number;
  y: number;
  dest: { x: number; y: number; label: string };
}

const HOME: Record<AgentId, { x: number; y: number }> = {
  A: { x: 69, y: 58 },
  B: { x: 82, y: 58 },
};

const TASKS: TeamTask[] = [
  { id: "team-cup", agent: "A", kind: "cup", label: "cup", x: 22, y: 39, dest: { x: 66, y: 35, label: "Kitchen sink" } },
  { id: "team-book", agent: "A", kind: "book", label: "book", x: 34, y: 65, dest: { x: 88, y: 42, label: "Bookshelf" } },
  { id: "team-trash", agent: "A", kind: "trash", label: "trash", x: 30, y: 31, dest: { x: 76, y: 32, label: "Trash can" } },
  { id: "team-sock", agent: "B", kind: "sock", label: "sock", x: 16, y: 60, dest: { x: 66, y: 78, label: "Laundry hamper" } },
  { id: "team-can", agent: "B", kind: "can", label: "can", x: 34, y: 48, dest: { x: 86, y: 76, label: "Recycling" } },
  { id: "team-toy", agent: "B", kind: "toy", label: "toy", x: 23, y: 72, dest: { x: 76, y: 78, label: "Toy box" } },
];

const FURNITURE: {
  kind: FurnitureKind;
  x: number;
  y: number;
  label: string;
}[] = [
  { kind: "trashcan", x: 76, y: 32, label: "Trash can" },
  { kind: "sink", x: 66, y: 35, label: "Kitchen sink" },
  { kind: "bookshelf", x: 88, y: 42, label: "Bookshelf" },
  { kind: "hamper", x: 66, y: 78, label: "Laundry hamper" },
  { kind: "recycling", x: 86, y: 76, label: "Recycling" },
  { kind: "toybox", x: 76, y: 78, label: "Toy box" },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function itemsForEngine(tasks: TeamTask[]) {
  return tasks.map((task) => ({
    id: task.id,
    kind: task.kind,
    x: task.x,
    y: task.y,
  }));
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
    engine.setRug(50, 55, 26, 30);
    engine.setFurniture(FURNITURE);
    engine.setItems(itemsForEngine(TASKS));
    engine.setPaths([]);
    engine.setActors([
      { id: "manager", x: 50, y: 20, label: "Manager", state: "idle", scale: 0.95 },
      { id: "agent-a", x: HOME.A.x, y: HOME.A.y, label: "Agent A", state: "idle", scale: 0.9 },
      { id: "agent-b", x: HOME.B.x, y: HOME.B.y, label: "Agent B", state: "idle", scale: 0.9 },
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

  const workTask = useCallback(async (agent: AgentId, task: TeamTask) => {
    const engine = engineRef.current;
    if (!engine) return;
    const actorId = agent === "A" ? "agent-a" : "agent-b";

    setAgentStatus((prev) => ({ ...prev, [agent]: `carrying ${task.label}` }));
    engine.setActorState(actorId, "walking");
    engine.moveActor(actorId, task.x, task.y, 620);
    await sleep(700);

    engine.setActorState(actorId, "working");
    engine.setRemoving(task.id);
    await sleep(260);
    engine.setActorCarry(actorId, task.kind);
    setRemaining((prev) => prev.filter((item) => item.id !== task.id));
    await sleep(180);

    engine.setActorState(actorId, "walking");
    engine.moveActor(actorId, task.dest.x, task.dest.y, 680);
    await sleep(760);
    engine.setActorState(actorId, "working");
    await sleep(260);
    engine.setActorCarry(actorId, null);
    engine.poof(task.dest.x, task.dest.y);
    setReports((prev) => [
      ...prev,
      `Agent ${agent} put the ${task.label} in ${task.dest.label}.`,
    ]);
    await sleep(260);
  }, []);

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
        engine.moveActor(actorId, HOME[agent].x, HOME[agent].y, 600);
      }
      await sleep(660);
      engine?.setActorState(actorId, "done");
      setAgentStatus((prev) => ({ ...prev, [agent]: "complete" }));
    },
    [workTask],
  );

  const run = useCallback(async () => {
    if (runningRef.current) return;
    const engine = engineRef.current;
    runningRef.current = true;
    setPhase("planning");
    setReports(["Manager is splitting the room into two queues."]);
    engine?.setActorState("manager", "working");
    engine?.setActorThought("manager", "Split by nearest stations");
    engine?.setPaths([
      { x1: HOME.A.x, y1: HOME.A.y, x2: 50, y2: 20, active: true },
      { x1: HOME.B.x, y1: HOME.B.y, x2: 50, y2: 20, active: true },
    ]);
    await sleep(900);

    engine?.setActorThought("manager", null);
    setReports((prev) => [
      ...prev,
      "Manager assigned dishes/books/trash to Agent A and laundry/recycling/toys to Agent B.",
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
          <p className="text-sm font-semibold text-[#F7F7F7]">Clean this room</p>
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
        <RoomCanvas ariaLabel="Top-down small team warehouse">
          <div
            className="absolute left-[8%] top-[24%] z-10 h-[60%] w-[34%] rounded-md border-4 border-[#8d8a82] bg-[#8f6541]/30"
            aria-hidden
          />
          <div
            className="absolute left-[46%] top-[18%] z-10 h-[68%] w-[8%] rounded-md border-2 border-[#8d8a82] bg-black/15"
            aria-hidden
          />
          <div
            className="absolute left-[58%] top-[24%] z-10 h-[60%] w-[34%] rounded-md border-4 border-[#8d8a82] bg-[#6e7f91]/25"
            aria-hidden
          />
          <div
            className="absolute left-[25%] top-[26%] z-30 -translate-x-1/2 rounded bg-black/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
            aria-hidden
          >
            Messy room
          </div>
          <div
            className="absolute left-1/2 top-[14%] z-30 -translate-x-1/2 rounded bg-black/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
            aria-hidden
          >
            Manager hallway
          </div>
          <div
            className="absolute left-[75%] top-[26%] z-30 -translate-x-1/2 rounded bg-black/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
            aria-hidden
          >
            Agent work room
          </div>
          <SpriteRenderer
            onReady={handleReady}
            ariaLabel="Top-down small team warehouse"
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
