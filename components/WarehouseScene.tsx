"use client";

import { useCallback, useRef, useState } from "react";
import ReportPanel, { ReportLine } from "./ReportPanel";
import EscalationBanner from "./EscalationBanner";
import { Marker, ReportPath } from "./ScenePrimitives";
import {
  AgentIcon,
  BossIcon,
  ManagerIcon,
  ThoughtIcon,
  WarningIcon,
} from "./UiIcons";
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
  /** Multi-step route: walk through transit points, pick up, process, place. */
  route: Waypoint[];
  /** Index of the actual pickup stop. Earlier waypoints are just walking. */
  pickupIndex: number;
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
  assignment: BossAssignment | null;
  managerActive: boolean;
  agents: AgentRuntime[];
  report: ReportLine[];
  status: "idle" | "working" | "delivered";
  itemsCleared: number;
  escalationsResolved: number;
  neededHuman: boolean;
  escalationPaused: boolean;
}

interface ScenarioItemGroup {
  id: string;
  label: string;
  managerId: "KITCHEN" | "LAUNDRY" | "OFFICE";
  room: string;
  pile: string;
  sprite: ItemKind;
  quantity: number;
  workUnits: number;
  traits: string[];
  tint?: string;
}

interface ScenarioPile {
  id: string;
  x: number;
  y: number;
  label: string;
}

interface Scenario {
  id: string;
  title: string;
  urgency: string;
  piles: ScenarioPile[];
  groups: ScenarioItemGroup[];
}

interface ManagerPlan {
  id: "KITCHEN" | "LAUNDRY" | "OFFICE";
  name: string;
  specialty: string;
  agentCount: number;
}

interface BossAssignment {
  managerId: string;
  workGroups: string[];
  priority: number;
  workload: number;
  rationale: string;
  escalationNotes: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const WALK_FRAME_MS = 130;
const WALK_STRIDE = 14;
const PICKUP_PAUSE = 360;
const CHORE_PAUSE = 430;
const REPORT_PAUSE = 300;

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
const LIVING_DOOR = wp(46, 54, "the living-room doorway");
const LIVING_PICKUP_INDEX = 4;
const roomDoor = (managerId: ScenarioItemGroup["managerId"]): Waypoint => {
  const room = ROOMS[managerId];
  return wp(54, room.manager?.y ?? 54, `the ${room.name.toLowerCase()} doorway`);
};

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

const MANAGERS: ManagerPlan[] = [
  {
    id: "KITCHEN",
    name: "Kitchen Manager",
    specialty: "dishes, food mess, recycling, and landfill sorting",
    agentCount: 2,
  },
  {
    id: "LAUNDRY",
    name: "Laundry Manager",
    specialty: "clothes, wet towels, fabric sorting, and laundry-room trash",
    agentCount: 2,
  },
  {
    id: "OFFICE",
    name: "Office Manager",
    specialty: "books, papers, toys, visible clutter, and office trash",
    agentCount: 2,
  },
];

// Pile anchor points. Scenarios add small bounded jitter to these so the map
// changes immediately while routes remain deterministic for the selected run.
const BASE_PILES: Omit<ScenarioPile, "label">[] = [
  { id: "lr-clothes", x: 13, y: 30 },
  { id: "lr-dishes", x: 32, y: 31 },
  { id: "lr-books", x: 13, y: 58 },
  { id: "lr-trash", x: 31, y: 64 },
  { id: "kitchen-trash", x: 66, y: 26 },
  { id: "laundry-trash", x: 62, y: 47 },
  { id: "office-trash", x: 63, y: 72 },
];

const SCENARIO_PATTERNS = [
  {
    id: "after-party",
    title: "After-party reset",
    urgency: "Visible mess and food smells first.",
    dishes: 6,
    clothes: 3,
    books: 2,
    trash: 7,
    risk: "fragile",
  },
  {
    id: "laundry-explosion",
    title: "Laundry explosion",
    urgency: "Wet laundry can smell, so fabric work moves early.",
    dishes: 2,
    clothes: 8,
    books: 2,
    trash: 4,
    risk: "wet",
  },
  {
    id: "guest-ready-panic",
    title: "Guest-ready panic",
    urgency: "Clear what guests see first, then finish sorting.",
    dishes: 4,
    clothes: 5,
    books: 5,
    trash: 5,
    risk: "unknown",
  },
  {
    id: "kid-chaos",
    title: "Kid chaos",
    urgency: "Toys, books, cups, and floor trash are mixed everywhere.",
    dishes: 4,
    clothes: 4,
    books: 6,
    trash: 6,
    risk: "jam-risk",
  },
  {
    id: "kitchen-disaster",
    title: "Kitchen disaster",
    urgency: "Food mess, dishes, and recycling need the first pass.",
    dishes: 8,
    clothes: 2,
    books: 2,
    trash: 7,
    risk: "sticky",
  },
  {
    id: "mixed-reset",
    title: "Whole-house mixed reset",
    urgency: "Balance all three managers because the mess is spread out.",
    dishes: 4,
    clothes: 5,
    books: 4,
    trash: 5,
    risk: "none",
  },
] as const;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function vary(base: number, spread: number, min = 1, max = 9, randomize = true) {
  if (!randomize) return clamp(base, min, max);
  return clamp(base + Math.floor(Math.random() * (spread * 2 + 1)) - spread, min, max);
}

function pileLabel(id: string) {
  const labels: Record<string, string> = {
    "lr-clothes": "the living-room clothes pile",
    "lr-dishes": "the living-room dishes pile",
    "lr-books": "the living-room book pile",
    "lr-trash": "the living-room trash pile",
    "kitchen-trash": "the kitchen bin",
    "laundry-trash": "the laundry bin",
    "office-trash": "the office bin",
  };
  return labels[id] ?? "the clutter pile";
}

function generateScenario(randomize = true): Scenario {
  const pattern = randomize
    ? SCENARIO_PATTERNS[Math.floor(Math.random() * SCENARIO_PATTERNS.length)]
    : SCENARIO_PATTERNS[0];
  const piles = BASE_PILES.map((p) => ({
    ...p,
    x: randomize ? clamp(p.x + Math.floor(Math.random() * 7) - 3, 9, 90) : p.x,
    y: randomize ? clamp(p.y + Math.floor(Math.random() * 7) - 3, 22, 86) : p.y,
    label: pileLabel(p.id),
  }));

  const dishes = vary(pattern.dishes, 1, 2, 9, randomize);
  const clothes = vary(pattern.clothes, 1, 2, 9, randomize);
  const books = vary(pattern.books, 1, 2, 8, randomize);
  const trash = vary(pattern.trash, 2, 3, 10, randomize);
  const laundryRisk = pattern.risk === "wet" || pattern.risk === "jam-risk";

  const riskTraits =
    pattern.risk === "none" ? [] : pattern.risk === "sticky" ? ["sticky"] : [pattern.risk];

  return {
    id: randomize
      ? `${pattern.id}-${Date.now().toString(36)}-${Math.floor(
          Math.random() * 1000,
        )}`
      : `${pattern.id}-initial`,
    title: pattern.title,
    urgency: pattern.urgency,
    piles,
    groups: ([
      {
        id: "dishes",
        label: "dishes",
        managerId: "KITCHEN",
        room: "Living room",
        pile: "lr-dishes",
        sprite: "plate",
        quantity: dishes,
        workUnits: dishes * 2,
        traits: ["food", ...riskTraits.filter((t) => t === "fragile" || t === "sticky")],
      },
      {
        id: "clothes",
        label: "clothes and towels",
        managerId: "LAUNDRY",
        room: "Living room",
        pile: "lr-clothes",
        sprite: "shirt",
        quantity: clothes,
        workUnits: clothes * 2 + (laundryRisk ? 2 : 0),
        traits: laundryRisk ? ["wet", "jam-risk"] : ["fabric"],
      },
      {
        id: "books",
        label: "books and papers",
        managerId: "OFFICE",
        room: "Living room",
        pile: "lr-books",
        sprite: "book",
        quantity: books,
        workUnits: books,
        traits: pattern.risk === "unknown" ? ["unknown"] : ["sort-by-color"],
      },
      {
        id: "living-trash",
        label: "living-room trash",
        managerId: trash > 6 ? "KITCHEN" : "OFFICE",
        room: "Living room",
        pile: "lr-trash",
        sprite: "trash",
        quantity: Math.ceil(trash / 2),
        workUnits: Math.ceil(trash / 2),
        traits: ["landfill"],
      },
      {
        id: "recycling",
        label: "cans and recycling",
        managerId: "KITCHEN",
        room: "Living room",
        pile: "lr-trash",
        sprite: "can",
        quantity: Math.floor(trash / 2),
        workUnits: Math.floor(trash / 2),
        traits: ["recyclable"],
      },
      {
        id: "kitchen-bin",
        label: "kitchen bin",
        managerId: "KITCHEN",
        room: "Kitchen",
        pile: "kitchen-trash",
        sprite: "trash",
        quantity: vary(2, 1, 1, 4, randomize),
        workUnits: 2,
        traits: ["mixed-trash"],
      },
      {
        id: "laundry-bin",
        label: "laundry bin",
        managerId: "LAUNDRY",
        room: "Laundry room",
        pile: "laundry-trash",
        sprite: "can",
        quantity: vary(2, 1, 1, 4, randomize),
        workUnits: 2,
        traits: ["recyclable"],
      },
      {
        id: "office-bin",
        label: "office bin",
        managerId: "OFFICE",
        room: "Office",
        pile: "office-trash",
        sprite: "trash",
        quantity: vary(2, 1, 1, 4, randomize),
        workUnits: 2,
        traits: ["paper-trash"],
      },
    ] as ScenarioItemGroup[]).filter((g) => g.quantity > 0),
  };
}

function wp(x: number, y: number, label: string): Waypoint {
  return { x, y, label };
}

function job(
  sprite: ItemKind,
  pile: string,
  route: Waypoint[],
  extra: { tint?: string; jammed?: boolean; pickupIndex?: number } = {},
): Job {
  return {
    id: jobId(),
    sprite,
    pile,
    route,
    pickupIndex: extra.pickupIndex ?? 0,
    ...extra,
  };
}

/* Route builders for the three workflows + the shared trash flow. */

// Dishes: living-room pile -> kitchen sink (wash) -> cupboard (put away).
function findPile(scenario: Scenario, id: string): ScenarioPile {
  return scenario.piles.find((p) => p.id === id) ?? {
    id,
    x: 31,
    y: 64,
    label: "the clutter pile",
  };
}

function livingPickupRoute(
  managerId: ScenarioItemGroup["managerId"],
  pile: ScenarioPile,
): { route: Waypoint[]; pickupIndex: number } {
  const door = roomDoor(managerId);
  return {
    route: [
      door,
      hallway(door.y),
      hallway(LIVING_DOOR.y),
      LIVING_DOOR,
      wp(pile.x, pile.y, pile.label),
    ],
    pickupIndex: LIVING_PICKUP_INDEX,
  };
}

function returnFromLiving(
  managerId: ScenarioItemGroup["managerId"],
  destinations: Waypoint[],
): Waypoint[] {
  const door = roomDoor(managerId);
  return [
    LIVING_DOOR,
    hallway(LIVING_DOOR.y),
    hallway(door.y),
    door,
    ...destinations,
  ];
}

function dishRoute(scenario: Scenario): Waypoint[] {
  const P = findPile(scenario, "lr-dishes");
  const pickup = livingPickupRoute("KITCHEN", P);
  return [
    ...pickup.route,
    ...returnFromLiving("KITCHEN", [
      wp(87, 32, "the sink"),
      wp(67, 37, "the cupboard"),
    ]),
  ];
}

// Clothes: living-room pile -> washer (wash) -> folding basket (by type).
function clothesRoute(scenario: Scenario, type: string): Waypoint[] {
  const P = findPile(scenario, "lr-clothes");
  const basket = BASKETS[type] ?? BASKETS.shirt;
  const pickup = livingPickupRoute("LAUNDRY", P);
  return [
    ...pickup.route,
    ...returnFromLiving("LAUNDRY", [
      wp(88, 52, "the washer"),
      wp(basket.x, 61, basket.label),
    ]),
  ];
}

// Books: living-room pile -> bookshelf, shelved by color.
function bookRoute(scenario: Scenario, shelf: string): Waypoint[] {
  const P = findPile(scenario, "lr-books");
  const pickup = livingPickupRoute("OFFICE", P);
  return [
    ...pickup.route,
    ...returnFromLiving("OFFICE", [wp(87, 80, shelf)]),
  ];
}

function sortedTrashRoute(
  managerId: ScenarioItemGroup["managerId"],
  pile: ScenarioPile,
  out: Waypoint,
): { route: Waypoint[]; pickupIndex: number } {
  if (pile.id.startsWith("lr-")) {
    const pickup = livingPickupRoute(managerId, pile);
    return {
      route: [
        ...pickup.route,
        LIVING_DOOR,
        hallway(LIVING_DOOR.y),
        hallway(88),
        out,
      ],
      pickupIndex: pickup.pickupIndex,
    };
  }

  const door = roomDoor(managerId);
  return {
    route: [
      wp(pile.x, pile.y, pile.label),
      door,
      hallway(door.y),
      hallway(88),
      out,
    ],
    pickupIndex: 0,
  };
}

/**
 * One messy house, three crews. The Living room is buried in piles; the
 * Kitchen, Laundry, and Office crews each carry their kind of item out of the
 * living room, clean or sort it, and put it away. Trash from every room is
 * sorted and taken outside. The Boss splits the whole job across the crews.
 */
function jobsForGroup(scenario: Scenario, group: ScenarioItemGroup): Job[] {
  const pile = findPile(scenario, group.pile);
  const jobs: Job[] = [];

  for (let i = 0; i < group.quantity; i++) {
    const jammed = i === 0 && group.traits.includes("jam-risk");

    if (group.id === "dishes") {
      const sprite: ItemKind = (["plate", "fork", "cup"] as ItemKind[])[i % 3];
      jobs.push(
        job(sprite, group.pile, dishRoute(scenario), {
          jammed,
          pickupIndex: LIVING_PICKUP_INDEX,
        }),
      );
      continue;
    }

    if (group.id === "clothes") {
      const sprite: ItemKind = (["shirt", "sock", "towel"] as ItemKind[])[i % 3];
      jobs.push(
        job(sprite, group.pile, clothesRoute(scenario, sprite), {
          jammed,
          pickupIndex: LIVING_PICKUP_INDEX,
        }),
      );
      continue;
    }

    if (group.id === "books") {
      const color = BOOK_COLORS[i % BOOK_COLORS.length];
      jobs.push(
        job("book", group.pile, bookRoute(scenario, color.shelf), {
          tint: color.tint,
          jammed,
          pickupIndex: LIVING_PICKUP_INDEX,
        }),
      );
      continue;
    }

    const isRecycling =
      group.traits.includes("recyclable") ||
      group.id === "recycling" ||
      group.sprite === "can";
    const route = sortedTrashRoute(
      group.managerId,
      pile,
      isRecycling ? OUT_RECYCLE : OUT_LANDFILL,
    );
    jobs.push(
      job(
        isRecycling ? "can" : "trash",
        group.pile,
        route.route,
        { jammed, pickupIndex: route.pickupIndex },
      ),
    );
  }

  return jobs;
}

function buildZones(scenario: Scenario): ZoneRuntime[] {
  jobSeq = 0;
  const jobsByManager = new Map<string, Job[]>();
  for (const manager of MANAGERS) jobsByManager.set(manager.id, []);
  for (const group of scenario.groups) {
    jobsByManager.get(group.managerId)?.push(...jobsForGroup(scenario, group));
  }

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
      assignment: null,
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
    twoAgentZone("KITCHEN", jobsByManager.get("KITCHEN") ?? []),
    twoAgentZone("LAUNDRY", jobsByManager.get("LAUNDRY") ?? []),
    twoAgentZone("OFFICE", jobsByManager.get("OFFICE") ?? []),
  ];
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

function createWarehouseRun(randomize = true) {
  const scenario = generateScenario(randomize);
  return { scenario, zones: buildZones(scenario) };
}

function localAssignments(scenario: Scenario): BossAssignment[] {
  return MANAGERS.map((manager, index) => {
    const groups = scenario.groups.filter((g) => g.managerId === manager.id);
    const workload = groups.reduce((sum, g) => sum + g.workUnits, 0);
    const labels = groups.map((g) => g.label);
    const risks = groups
      .flatMap((g) => g.traits)
      .filter((t) => ["wet", "fragile", "unknown", "jam-risk", "sticky"].includes(t));

    return {
      managerId: manager.id,
      workGroups: labels,
      priority: index + 1,
      workload,
      rationale: `${manager.name} gets ${labels.join(
        ", ",
      )} because that work matches the room specialty and keeps two agents focused.`,
      escalationNotes: risks.length
        ? `Watch for ${Array.from(new Set(risks)).join(", ")}.`
        : "No special escalation risk expected.",
    };
  });
}

function instructionFromAssignment(assignment: BossAssignment): string {
  return `Priority ${assignment.priority}: handle ${assignment.workGroups.join(
    ", ",
  )}. ${assignment.rationale}`;
}

function localFinalReport(zones: ZoneRuntime[], scenario: Scenario): string {
  const lines = zones.map((z) => {
    const human = z.neededHuman ? " Human help was needed." : "";
    const escalations =
      z.escalationsResolved > 0
        ? ` ${z.escalationsResolved} manager escalation${
            z.escalationsResolved === 1 ? "" : "s"
          } resolved.`
        : "";
    return `${z.name}: ${z.itemsCleared}/${z.agents.reduce(
      (sum, a) => sum + a.total,
      0,
    )} items cleared.${escalations}${human}`;
  });
  const anyHuman = zones.some((z) => z.neededHuman);
  lines.push(
    anyHuman
      ? `Boss report: ${scenario.title} finished with human input on the stuck work.`
      : `Boss report: ${scenario.title} finished without human input.`,
  );
  return lines.join("\n");
}

function sceneDistance(a: { x: number; y: number }, b: Waypoint) {
  const dx = (b.x - a.x) * 1.6;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function isTransitStop(stop: Waypoint) {
  return stop.label.includes("hallway") || stop.label.includes("doorway");
}

export default function WarehouseScene() {
  const initialRun = useRef(createWarehouseRun(false));
  const [scenario, setScenario] = useState<Scenario>(initialRun.current.scenario);
  const [zones, setZones] = useState<ZoneRuntime[]>(initialRun.current.zones);
  const [phase, setPhase] = useState<Phase>("idle");
  const [bossNote, setBossNote] = useState<string | null>(null);
  const [decompSource, setDecompSource] = useState<"ai" | "fallback" | null>(null);
  const [finalReport, setFinalReport] = useState<string | null>(null);
  const [humanNeeded, setHumanNeeded] = useState<{
    zoneId: string;
    message: string;
  } | null>(null);
  const [showJam, setShowJam] = useState(false);
  const [thinkingStep, setThinkingStep] = useState<string | null>(null);

  const scenarioRef = useRef(scenario);
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

  const walkTo = useCallback(
    async (agent: AgentRuntime, target: Waypoint) => {
      const start = { ...agent.pos };
      const frames = Math.max(1, Math.ceil(sceneDistance(start, target) / WALK_STRIDE));

      agent.state = "walking";
      for (let frame = 1; frame <= frames; frame++) {
        const eased = easeInOut(frame / frames);
        agent.pos = {
          x: start.x + (target.x - start.x) * eased,
          y: start.y + (target.y - start.y) * eased,
        };
        commit();
        await sleep(WALK_FRAME_MS);
      }

      agent.pos = { x: target.x, y: target.y };
      commit();
    },
    [commit],
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
          await walkTo(agent, { ...stop, x: stop.x + off });

          // A tangled load at pickup: escalate to the Manager, who resolves it.
          if (i === j.pickupIndex && j.jammed) {
            addLine(zoneId, {
              text: `${agent.name} hit a tangled ${name} → escalated to Manager.`,
              tone: "escalation",
            });
            commit();
            await sleep(CHORE_PAUSE);
            addLine(zoneId, {
              text: `Manager sorted out the tangle on its own.`,
              tone: "escalation",
              reviewed: true,
            });
            zone.escalationsResolved += 1;
            commit();
            await sleep(CHORE_PAUSE);
          }

          const isPickup = i === j.pickupIndex;
          const isDropoff = i === j.route.length - 1;
          const shouldPause =
            isPickup || isDropoff || (i > j.pickupIndex && !isTransitStop(stop));

          if (shouldPause) {
            agent.state = "working";
            commit();
            await sleep(isPickup ? PICKUP_PAUSE : CHORE_PAUSE);
          }

          if (isPickup) {
            agent.carrying = j.sprite;
            agent.carryingTint = j.tint;
            commit();
            await sleep(REPORT_PAUSE * 0.35);
          }
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
        await sleep(REPORT_PAUSE);
      }

      await walkTo(agent, { ...agent.home, label: "home station" });
      agent.state = "done";
      commit();
    },
    [commit, addLine, getZone, walkTo],
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
      await sleep(REPORT_PAUSE);
    },
    [commit, runAgent, addLine, getZone],
  );

  const run = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    lineSeq = 0;
    const nextRun = createWarehouseRun();
    scenarioRef.current = nextRun.scenario;
    zonesRef.current = nextRun.zones;
    setScenario(nextRun.scenario);
    commit();
    setFinalReport(null);
    setHumanNeeded(null);
    setDecompSource(null);
    setThinkingStep("Scanning the mess...");

    setPhase("deciding");
    setBossNote("Boss is deciding how to split the work...");
    const decideStart = Date.now();
    const thoughts = [
      "Scanning the mess...",
      "Grouping dishes, laundry, books, and trash...",
      "Balancing work across 3 Managers...",
      "Checking escalation risks...",
    ];
    let thoughtIndex = 0;
    const thinkingTimer = window.setInterval(() => {
      thoughtIndex = (thoughtIndex + 1) % thoughts.length;
      setThinkingStep(thoughts[thoughtIndex]);
    }, 950);

    try {
      const res = await fetch("/api/boss-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction: "Clean the house",
          scenario: nextRun.scenario,
          managers: MANAGERS,
        }),
      });
      const data = (await res.json()) as {
        assignments: BossAssignment[];
        source: "ai" | "fallback";
      };
      setDecompSource(data.source);
      const assignments = data.assignments?.length
        ? data.assignments
        : localAssignments(nextRun.scenario);
      for (const assignment of assignments) {
        const zone = zonesRef.current.find((z) => z.id === assignment.managerId);
        if (zone) {
          zone.assignment = assignment;
          zone.instruction = instructionFromAssignment(assignment);
        }
      }
    } catch (err) {
      console.error("[warehouse] boss plan request failed:", err);
      for (const assignment of localAssignments(nextRun.scenario)) {
        const zone = zonesRef.current.find((z) => z.id === assignment.managerId);
        if (zone) {
          zone.assignment = assignment;
          zone.instruction = instructionFromAssignment(assignment);
        }
      }
      setDecompSource("fallback");
    } finally {
      window.clearInterval(thinkingTimer);
      setThinkingStep(null);
    }

    const decideElapsed = Date.now() - decideStart;
    if (decideElapsed < 1800) await sleep(1800 - decideElapsed);

    setBossNote("Boss dispatched a plan to each room's Manager.");
    setPhase("dispatched");
    commit();
    await sleep(900);

    setPhase("working");
    await Promise.all(zonesRef.current.map((z) => runZone(z.id)));

    setPhase("summarizing");
    setBossNote("Every room reported in. Boss is assembling the final report…");
    await sleep(700);
    setFinalReport(localFinalReport(zonesRef.current, scenarioRef.current));

    setBossNote("Done.");
    setPhase("done");
    runningRef.current = false;
  }, [commit, runZone]);

  const reset = useCallback(() => {
    if (runningRef.current) return;
    lineSeq = 0;
    const nextRun = createWarehouseRun();
    scenarioRef.current = nextRun.scenario;
    zonesRef.current = nextRun.zones;
    setScenario(nextRun.scenario);
    commit();
    setPhase("idle");
    setBossNote(null);
    setFinalReport(null);
    setHumanNeeded(null);
    setDecompSource(null);
    setThinkingStep(null);
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
        className="flex flex-wrap items-center gap-3 rounded-lg border border-[#474747] bg-[#191919] p-3 shadow-sm"
      >
        <div className="min-w-[220px] flex-1 rounded-lg border border-[#474747] bg-[#0A0A0A] px-3 py-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">
            Fixed human instruction
          </p>
          <p className="text-sm font-semibold text-[#F7F7F7]">Clean the house</p>
        </div>
        <div className="rounded-lg border border-[#3A7CA5]/40 bg-[#3A7CA5]/15 px-3 py-2 text-sm">
          <span className="font-semibold text-[#b6e2f6]">{scenario.title}</span>
          <span className="ml-2 text-xs text-[#8cc7e6]">{scenario.urgency}</span>
        </div>
        <button
          type="submit"
          disabled={busy}
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
        <label className="ml-auto flex items-center gap-2 text-xs text-zinc-500">
          <input
            className="accent-[#3A7CA5]"
            type="checkbox"
            checked={showJam}
            onChange={(e) => setShowJam(e.target.checked)}
          />
          Presenter tools
        </label>
      </form>

      {/* Boss panel */}
      <div className="rounded-lg border border-[#474747] bg-[#191919] p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <BossIcon className="h-8 w-8 shrink-0 text-[#3A7CA5]" />
          <div>
            <p className="text-sm font-bold text-[#F7F7F7]">Boss</p>
            <p className="text-sm text-zinc-300">
              {bossNote ?? "Waiting for an instruction from the human."}
              {phase === "deciding" ? (
                <span className="ml-1 inline-block animate-pulse-soft text-[#1ABCBD]">...</span>
              ) : null}
            </p>
          </div>
          {decompSource ? (
            <span
              className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                decompSource === "ai"
                  ? "bg-[#4DAA57]/15 text-[#95df9d]"
                  : "bg-[#E0BD3E]/15 text-[#f1d977]"
              }`}
              title={
                decompSource === "ai"
                  ? "Plan came from a real OpenAI API call."
                  : "Live API unavailable — using the built-in fallback decision."
              }
            >
              {decompSource === "ai" ? "real AI decision" : "fallback decision"}
            </span>
          ) : null}
        </div>

        {thinkingStep ? (
          <div className="mt-3 flex animate-fade-in items-center gap-2 rounded-lg border border-[#3A7CA5]/50 bg-[#0A0A0A] p-3 text-sm font-semibold text-[#b6e2f6] shadow-sm">
            <ThoughtIcon className="h-4 w-4 shrink-0 text-[#1ABCBD]" />
            {thinkingStep}
          </div>
        ) : null}

        {zones.some((zone) => zone.assignment) ? (
          <details className="mt-3 rounded-lg border border-[#474747] bg-[#0A0A0A] p-3">
            <summary className="cursor-pointer text-sm font-bold text-zinc-200">
              Boss decision: why each Manager got this work
            </summary>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {zones.map((zone) =>
                zone.assignment ? (
                  <div
                    key={zone.id}
                    className="rounded-lg border border-[#474747] bg-[#191919] p-2 text-xs text-zinc-300"
                  >
                    <p className="font-bold text-[#F7F7F7]">
                      Priority {zone.assignment.priority}: {zone.name}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold">Work:</span>{" "}
                      {zone.assignment.workGroups.join(", ")}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold">Load:</span>{" "}
                      {zone.assignment.workload} units
                    </p>
                    <p className="mt-1">{zone.assignment.rationale}</p>
                    <p className="mt-1 text-[#f1d977]">
                      {zone.assignment.escalationNotes}
                    </p>
                  </div>
                ) : null,
              )}
            </div>
          </details>
        ) : null}

        {finalReport ? (
          <div className="mt-3 animate-fade-in rounded-lg border border-[#4DAA57]/50 bg-[#4DAA57]/15 p-3">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#95df9d]">
              Final report to the human
            </p>
            <pre className="whitespace-pre-wrap font-sans text-sm text-[#d5f4d8]">
              {finalReport}
            </pre>
          </div>
        ) : null}
      </div>

      {humanNeeded ? (
        <EscalationBanner message={humanNeeded.message} onDismiss={resolveHuman} />
      ) : null}

      <HouseMap
        zones={zones}
        scenario={scenario}
        phase={phase}
        humanNeeded={humanNeeded}
        bossThought={thinkingStep}
      />

      {/* Room / Manager panels */}
      <div className="grid gap-4 lg:grid-cols-3">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className="flex flex-col gap-3 rounded-lg border border-[#474747] bg-[#191919] p-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ManagerIcon className="h-6 w-6 shrink-0 text-[#E0BD3E]" />
                <div>
                  <p className="text-sm font-bold text-[#F7F7F7]">
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
                  className="inline-flex items-center gap-1 rounded-md border border-[#DE2B31]/60 bg-[#DE2B31]/15 px-2 py-1 text-[11px] font-semibold text-[#ffb4b6] transition enabled:hover:bg-[#DE2B31]/25 disabled:opacity-40"
                  title="Force a stuck-item escalation for this room"
                >
                  <WarningIcon className="h-3.5 w-3.5" />
                  Jam
                </button>
              ) : null}
            </div>

            <div className="min-h-[44px] rounded-lg border border-[#474747]/70 bg-[#0A0A0A] p-2 text-[12px] leading-snug text-zinc-300">
              {zone.instruction ? (
                <span className="animate-fade-in">{zone.instruction}</span>
              ) : (
                <span className="italic text-zinc-500">
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
    idle: { text: "Idle", cls: "bg-[#474747]/35 text-zinc-400" },
    working: { text: "Working", cls: "bg-[#3A7CA5]/20 text-[#8cc7e6]" },
    delivered: { text: "Reported", cls: "bg-[#4DAA57]/20 text-[#95df9d]" },
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
  scenario,
  phase,
  humanNeeded,
  bossThought,
}: {
  zones: ZoneRuntime[];
  scenario: Scenario;
  phase: Phase;
  humanNeeded: { zoneId: string; message: string } | null;
  bossThought: string | null;
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
        <RoomWorker
          x={50}
          y={10}
          state={phase === "deciding" ? "working" : reportActive ? "working" : "sitting"}
          label="Boss"
          thought={bossThought ?? undefined}
        />
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
        {scenario.piles.map((p) => (
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
    <div className="flex items-center gap-2 rounded-lg border border-[#474747] bg-[#0A0A0A] px-2 py-1.5">
      <AgentIcon
        className={`h-5 w-5 shrink-0 text-[#4DAA57] ${
          agent.state === "walking"
            ? "animate-bob"
            : agent.state === "working"
              ? "animate-pulse-soft"
              : ""
        }`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-300">
          <span>{agent.name}</span>
          <span className="text-zinc-500">
            {agent.cleared}/{agent.total} · {stateLabel[agent.state]}
          </span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#474747]">
          <div
            className="h-full rounded-full bg-[#3A7CA5] transition-all duration-300"
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
