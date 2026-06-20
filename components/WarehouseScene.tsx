"use client";

import { useCallback, useRef, useState } from "react";
import { Clutter, CLUTTER_GLYPH, ClutterKind } from "./ClutterItem";
import ReportPanel, { ReportLine } from "./ReportPanel";
import EscalationBanner from "./EscalationBanner";

type Phase = "idle" | "deciding" | "dispatched" | "working" | "summarizing" | "done";
type AgentState = "idle" | "walking" | "working" | "done";

interface AgentRuntime {
  id: string;
  name: string;
  queue: Clutter[];
  total: number;
  cleared: number;
  state: AgentState;
  carrying: string | null;
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
 * Each zone has a meaningfully different pile so the Boss's decomposition is
 * genuinely different per zone, not copy-pasted.
 */
function buildZones(): ZoneRuntime[] {
  const zoneA: ClutterKind[] = ["box", "box", "box", "box", "box", "box"]; // 6 boxes
  const zoneB: ClutterKind[] = ["spill", "spill", "spill", "spill", "box", "box"]; // 4 spills + 2 boxes
  const zoneC: ClutterKind[] = ["pallet", "pallet", "pallet", "pallet", "pallet"]; // 5 pallets

  const split = (items: Clutter[]): [Clutter[], Clutter[]] => {
    const half = Math.ceil(items.length / 2);
    return [items.slice(0, half), items.slice(half)];
  };

  const aItems = makeItems(zoneA);
  const bItems = makeItems(zoneB, 0); // one jammed spill -> manager resolves
  const cItems = makeItems(zoneC);

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
      name: "Zone A",
      instruction: null,
      managerActive: false,
      agents: [mkAgent("A1", "Agent A1", a1), mkAgent("A2", "Agent A2", a2)],
      report: [],
      status: "idle",
      itemsCleared: 0,
      escalationsResolved: 0,
      neededHuman: false,
      escalationPaused: false,
    },
    {
      id: "B",
      name: "Zone B",
      instruction: null,
      managerActive: false,
      agents: [mkAgent("B1", "Agent B1", b1), mkAgent("B2", "Agent B2", b2)],
      report: [],
      status: "idle",
      itemsCleared: 0,
      escalationsResolved: 0,
      neededHuman: false,
      escalationPaused: false,
    },
    {
      id: "C",
      name: "Zone C",
      instruction: null,
      managerActive: false,
      agents: [mkAgent("C1", "Agent C1", c1), mkAgent("C2", "Agent C2", c2)],
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
        const glyph = CLUTTER_GLYPH[item.kind];

        agent.state = "walking";
        agent.carrying = null;
        commit();
        await sleep(STEP);

        // A naturally jammed item: escalate to the Manager, who resolves it.
        if (item.jammed) {
          addLine(zoneId, {
            text: `${agent.name} hit a jammed ${item.kind} → escalated to Manager.`,
            tone: "escalation",
          });
          commit();
          await sleep(STEP);
          addLine(zoneId, {
            text: `Manager resolved the jam on its own.`,
            tone: "escalation",
            reviewed: true,
          });
          zone.escalationsResolved += 1;
          commit();
          await sleep(STEP);
        }

        // Pick up and clear.
        agent.state = "working";
        agent.carrying = glyph;
        commit();
        await sleep(STEP);

        agent.queue.shift();
        agent.cleared += 1;
        zone.itemsCleared += 1;
        agent.carrying = null;

        // Report the finished item up to the Manager, who reviews it.
        addLine(zoneId, {
          text: `${agent.name} cleared a ${item.kind} → Manager reviewed.`,
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

    const prompt = command.trim() || "Clean the warehouse";

    // ---- The one real AI moment: Boss decomposes the job ----
    setPhase("deciding");
    setBossNote("Boss is deciding…");

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
          placeholder="Clean the warehouse"
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
        <span className="text-base" aria-hidden>
          {agent.carrying}
        </span>
      ) : null}
    </div>
  );
}
