export type ManagerId = "KITCHEN" | "LAUNDRY" | "OFFICE";

export type WorkCategory =
  | "dish"
  | "laundry"
  | "book"
  | "recycling"
  | "trash"
  | "toy";

export type PaletteItemId =
  | "plate"
  | "fork"
  | "cup"
  | "shirt"
  | "sock"
  | "towel"
  | "book"
  | "can"
  | "trash"
  | "toy";

export interface PaletteItemRule {
  id: PaletteItemId;
  label: string;
  item: PaletteItemId;
  managerId: ManagerId;
  category: WorkCategory;
  traits: string[];
}

export interface ManagerPlanJob {
  id: string;
  workUnits?: number;
  jammed?: boolean;
}

export interface ManagerPlanAgent {
  id: string;
  name?: string;
  queueLength?: number;
  state?: "idle" | "walking" | "working" | "done";
}

export interface ManagerQueuePlan {
  agentId: string;
  jobIds: string[];
}

export interface ManagerPlanResult {
  agentQueues: ManagerQueuePlan[];
  rationale: string;
  source: "ai" | "fallback";
}

export const PALETTE_ITEMS: PaletteItemRule[] = [
  {
    id: "plate",
    label: "Plate",
    item: "plate",
    managerId: "KITCHEN",
    category: "dish",
    traits: ["food", "fragile"],
  },
  {
    id: "fork",
    label: "Fork",
    item: "fork",
    managerId: "KITCHEN",
    category: "dish",
    traits: ["food"],
  },
  {
    id: "cup",
    label: "Cup",
    item: "cup",
    managerId: "KITCHEN",
    category: "dish",
    traits: ["food"],
  },
  {
    id: "shirt",
    label: "Shirt",
    item: "shirt",
    managerId: "LAUNDRY",
    category: "laundry",
    traits: ["fabric"],
  },
  {
    id: "sock",
    label: "Sock",
    item: "sock",
    managerId: "LAUNDRY",
    category: "laundry",
    traits: ["fabric"],
  },
  {
    id: "towel",
    label: "Towel",
    item: "towel",
    managerId: "LAUNDRY",
    category: "laundry",
    traits: ["wet", "fabric"],
  },
  {
    id: "book",
    label: "Book",
    item: "book",
    managerId: "OFFICE",
    category: "book",
    traits: ["sort-by-color"],
  },
  {
    id: "can",
    label: "Can",
    item: "can",
    managerId: "KITCHEN",
    category: "recycling",
    traits: ["recyclable"],
  },
  {
    id: "trash",
    label: "Trash",
    item: "trash",
    managerId: "OFFICE",
    category: "trash",
    traits: ["landfill"],
  },
  {
    id: "toy",
    label: "Toy",
    item: "toy",
    managerId: "OFFICE",
    category: "toy",
    traits: ["visible-clutter"],
  },
];

export function paletteItemById(id: string): PaletteItemRule | undefined {
  return PALETTE_ITEMS.find((item) => item.id === id);
}

export function managerForPaletteItem(id: string): ManagerId {
  return paletteItemById(id)?.managerId ?? "OFFICE";
}

export function fallbackManagerPlan(input: {
  managerId: ManagerId;
  jobs: ManagerPlanJob[];
  agents: ManagerPlanAgent[];
}): ManagerPlanResult {
  const agents = input.agents.slice(0, 2);
  if (agents.length === 0) {
    return {
      agentQueues: [],
      rationale: "No agents are available for this Manager.",
      source: "fallback",
    };
  }

  const loads = new Map(agents.map((agent) => [agent.id, 0]));
  const queues = new Map(agents.map((agent) => [agent.id, [] as string[]]));

  for (const job of input.jobs) {
    const target = agents
      .map((agent) => ({
        id: agent.id,
        load: loads.get(agent.id) ?? 0,
        queued: queues.get(agent.id)?.length ?? 0,
      }))
      .sort((a, b) => a.load - b.load || a.queued - b.queued || a.id.localeCompare(b.id))[0];
    queues.get(target.id)?.push(job.id);
    loads.set(target.id, target.load + (job.workUnits ?? 1) + (job.jammed ? 1 : 0));
  }

  return {
    agentQueues: agents.map((agent) => ({
      agentId: agent.id,
      jobIds: queues.get(agent.id) ?? [],
    })),
    rationale: `${input.managerId} Manager split ${input.jobs.length} item${
      input.jobs.length === 1 ? "" : "s"
    } across the two agents by current load.`,
    source: "fallback",
  };
}

export function chooseLiveAgent(
  agents: ManagerPlanAgent[],
): ManagerPlanAgent | undefined {
  return agents
    .slice()
    .sort((a, b) => {
      const aIdle = a.state === "idle" || a.state === "done";
      const bIdle = b.state === "idle" || b.state === "done";
      if (aIdle !== bIdle) return aIdle ? -1 : 1;
      return (a.queueLength ?? 0) - (b.queueLength ?? 0) || a.id.localeCompare(b.id);
    })[0];
}

export function rebalanceQueues(input: {
  agents: { id: string; queueLength: number; state?: ManagerPlanAgent["state"] }[];
}): { fromAgentId: string; toAgentId: string; count: number } | null {
  const idle = input.agents.find(
    (agent) =>
      agent.queueLength === 0 && (agent.state === "idle" || agent.state === "done"),
  );
  if (!idle) return null;

  const donor = input.agents
    .filter((agent) => agent.id !== idle.id && agent.queueLength > 1)
    .sort((a, b) => b.queueLength - a.queueLength)[0];

  return donor
    ? { fromAgentId: donor.id, toAgentId: idle.id, count: 1 }
    : null;
}
