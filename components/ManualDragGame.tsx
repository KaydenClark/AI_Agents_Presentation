"use client";

import { useMemo, useState } from "react";
import { ItemKind, ItemSprite, RoomCanvas } from "./RoomSprites";

type DestinationId = "trash-can" | "sink" | "bookshelf";
type Placement = "floor" | "done";

interface ManualTask {
  id: string;
  item: ItemKind;
  itemLabel: string;
  destinationId: DestinationId;
  destinationLabel: string;
  x: number;
  y: number;
}

const TASKS: ManualTask[] = [
  {
    id: "manual-trash",
    item: "trash",
    itemLabel: "Trash",
    destinationId: "trash-can",
    destinationLabel: "Trash can",
    x: 33,
    y: 42,
  },
  {
    id: "manual-cup",
    item: "cup",
    itemLabel: "Cup",
    destinationId: "sink",
    destinationLabel: "Sink",
    x: 58,
    y: 50,
  },
  {
    id: "manual-book",
    item: "book",
    itemLabel: "Book",
    destinationId: "bookshelf",
    destinationLabel: "Bookshelf",
    x: 46,
    y: 67,
  },
];

const DESTINATIONS: {
  id: DestinationId;
  label: string;
  accepts: ItemKind;
  x: number;
  y: number;
  color: string;
}[] = [
  {
    id: "trash-can",
    label: "Trash can",
    accepts: "trash",
    x: 22,
    y: 24,
    color: "#DE2B31",
  },
  {
    id: "sink",
    label: "Sink",
    accepts: "cup",
    x: 50,
    y: 22,
    color: "#3A7CA5",
  },
  {
    id: "bookshelf",
    label: "Bookshelf",
    accepts: "book",
    x: 78,
    y: 25,
    color: "#E0BD3E",
  },
];

function initialPlacements(): Record<string, Placement> {
  return Object.fromEntries(TASKS.map((task) => [task.id, "floor"])) as Record<
    string,
    Placement
  >;
}

export default function ManualDragGame() {
  const [placements, setPlacements] = useState(initialPlacements);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState(
    "Manual game ready. You are the agent.",
  );

  const remaining = useMemo(
    () => TASKS.filter((task) => placements[task.id] !== "done"),
    [placements],
  );
  const complete = remaining.length === 0;

  function tryPlace(taskId: string, destinationId: DestinationId) {
    const task = TASKS.find((candidate) => candidate.id === taskId);
    const destination = DESTINATIONS.find(
      (candidate) => candidate.id === destinationId,
    );
    if (!task || !destination || placements[task.id] === "done") return;

    if (task.destinationId !== destination.id) {
      setAnnouncement(`${task.itemLabel} does not belong at ${destination.label}.`);
      return;
    }

    setPlacements((prev) => ({ ...prev, [task.id]: "done" }));
    setSelectedId(null);
    setAnnouncement(`${task.itemLabel} placed in ${destination.label}.`);
  }

  function reset() {
    setPlacements(initialPlacements());
    setSelectedId(null);
    setAnnouncement("Manual game reset.");
  }

  return (
    <div className="flex flex-col gap-4">
      <div aria-live="polite" className="sr-only" role="status">
        {announcement}
      </div>

      <div className="rounded-lg border border-[#474747] bg-[#191919] p-3 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-[#1ABCBD]">
            Where they go
          </p>
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-zinc-300">
              {remaining.length} job{remaining.length === 1 ? "" : "s"} left
            </p>
            <button
              type="button"
              onClick={reset}
              className="rounded-md border border-[#474747] px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-[#474747]/40"
            >
              Reset
            </button>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {TASKS.map((task) => (
            <div
              key={task.id}
              className={`flex items-center gap-3 rounded-md border p-2 ${
                placements[task.id] === "done"
                  ? "border-[#4DAA57]/50 bg-[#4DAA57]/15 text-[#95df9d]"
                  : "border-[#474747] bg-[#0A0A0A] text-zinc-200"
              }`}
            >
              <ItemSprite item={task.item} size={26} />
              <div className="text-sm font-semibold">
                {task.itemLabel} {"->"} {task.destinationLabel}
              </div>
            </div>
          ))}
        </div>
      </div>

      <RoomCanvas ariaLabel="Manual drag sandbox">
        <div
          className="absolute left-1/2 top-2 z-30 -translate-x-1/2 rounded bg-black/45 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
          aria-hidden
        >
          Sandbox room
        </div>

        {DESTINATIONS.map((destination) => (
          <button
            key={destination.id}
            type="button"
            aria-label={`${destination.label} destination`}
            onClick={() => {
              if (selectedId) tryPlace(selectedId, destination.id);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              tryPlace(event.dataTransfer.getData("text/plain"), destination.id);
            }}
            className="absolute z-30 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-md border-2 bg-black/45 px-3 py-2 text-xs font-bold text-white shadow-lg transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#1ABCBD]"
            style={{
              left: `${destination.x}%`,
              top: `${destination.y}%`,
              borderColor: destination.color,
            }}
          >
            <ItemSprite item={destination.accepts} size={22} />
            {destination.label}
          </button>
        ))}

        <div
          className="pointer-events-none absolute left-1/2 top-[58%] z-10 h-[38%] w-[30%] -translate-x-1/2 -translate-y-1/2 rounded-md border-4 border-[#8f3d2c] bg-[#b3543f]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(255,255,255,0.07) 0 6px, transparent 6px 13px)",
          }}
          aria-hidden
        />

        {TASKS.map((task) =>
          placements[task.id] === "done" ? null : (
            <button
              key={task.id}
              type="button"
              draggable
              aria-label={`${task.itemLabel} item`}
              onClick={() => setSelectedId(task.id)}
              onDragStart={(event) => {
                event.dataTransfer.setData("text/plain", task.id);
                setSelectedId(task.id);
              }}
              className={`absolute z-40 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md border bg-[#F7F7F7] shadow-lg transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#1ABCBD] ${
                selectedId === task.id
                  ? "border-[#1ABCBD] ring-2 ring-[#1ABCBD]/40"
                  : "border-[#474747]"
              }`}
              style={{ left: `${task.x}%`, top: `${task.y}%` }}
            >
              <ItemSprite item={task.item} size={34} />
            </button>
          ),
        )}

        {complete ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/10">
            <div className="animate-fade-in rounded-lg bg-emerald-600 px-8 py-5 text-center text-white shadow-lg">
              <div className="text-3xl font-bold">Manual room complete</div>
              <div className="mt-1 text-sm opacity-90">
                You moved every item by hand.
              </div>
            </div>
          </div>
        ) : null}
      </RoomCanvas>
    </div>
  );
}
