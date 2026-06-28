"use client";

export type MarkerTone =
  | "slate"
  | "teal"
  | "amber"
  | "rose"
  | "sky"
  | "violet"
  | "emerald";

const markerTone: Record<MarkerTone, string> = {
  slate: "bg-slate-600",
  teal: "bg-teal-600",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
  emerald: "bg-emerald-500",
};

export function Marker({
  x,
  y,
  tone = "slate",
  label,
  active = false,
}: {
  x: number;
  y: number;
  tone?: MarkerTone;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div
        className={`h-4 w-4 rounded-full border-2 border-white shadow ${
          active ? markerTone[tone] : "bg-slate-300"
        }`}
      />
      <span className="whitespace-nowrap rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 shadow-sm">
        {label}
      </span>
    </div>
  );
}
