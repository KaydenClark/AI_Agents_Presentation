"use client";

import type { ReactNode } from "react";

export type SceneTone =
  | "slate"
  | "teal"
  | "amber"
  | "rose"
  | "sky"
  | "violet"
  | "emerald";

const stationTone: Record<SceneTone, string> = {
  slate: "border-slate-400 bg-slate-100 text-slate-700",
  teal: "border-teal-500 bg-teal-50 text-teal-800",
  amber: "border-amber-500 bg-amber-50 text-amber-800",
  rose: "border-rose-500 bg-rose-50 text-rose-800",
  sky: "border-sky-500 bg-sky-50 text-sky-800",
  violet: "border-violet-500 bg-violet-50 text-violet-800",
  emerald: "border-emerald-500 bg-emerald-50 text-emerald-800",
};

const markerTone: Record<SceneTone, string> = {
  slate: "bg-slate-600",
  teal: "bg-teal-600",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
  emerald: "bg-emerald-500",
};

export function SceneCanvas({
  ariaLabel,
  children,
  className = "",
}: {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      aria-label={ariaLabel}
      className={`relative aspect-[16/9] w-full overflow-hidden rounded-lg border-4 border-slate-700 bg-stone-100 shadow-inner ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(rgba(120,113,108,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(120,113,108,.18) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />
      <div className="pointer-events-none absolute inset-2 rounded border-2 border-slate-500/70" />
      <div
        className="pointer-events-none absolute bottom-0 left-[43%] z-10 h-5 w-[14%] rounded-t bg-stone-100"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-1 left-[45%] z-10 h-1 w-[10%] rounded bg-slate-600/70"
        aria-hidden
      />
      {children}
    </div>
  );
}

export function SceneLabel({
  x,
  y,
  children,
}: {
  x: number;
  y: number;
  children: ReactNode;
}) {
  return (
    <div
      className="absolute z-30 -translate-x-1/2 rounded bg-white/90 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600 shadow-sm"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {children}
    </div>
  );
}

export function Station({
  x,
  y,
  label,
  detail,
  tone = "slate",
  wide = false,
}: {
  x: number;
  y: number;
  label: string;
  detail?: string;
  tone?: SceneTone;
  wide?: boolean;
}) {
  return (
    <div
      className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-md border-2 p-2 text-center shadow-sm ${stationTone[tone]} ${
        wide ? "w-32" : "w-24"
      }`}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className="mx-auto mb-1 h-5 w-10 rounded border border-current/30 bg-white/55" />
      <div className="text-[11px] font-bold leading-tight">{label}</div>
      {detail ? (
        <div className="mt-0.5 text-[10px] font-medium leading-tight opacity-75">
          {detail}
        </div>
      ) : null}
    </div>
  );
}

export function Desk({
  x,
  y,
  label,
}: {
  x: number;
  y: number;
  label: string;
}) {
  return (
    <div
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className="h-16 w-28 rounded-md border-2 border-slate-700 bg-slate-200 shadow-md">
        <div className="mx-auto mt-2 h-6 w-12 rounded border border-slate-500 bg-white" />
      </div>
      <div className="mt-1 text-center text-[11px] font-bold text-slate-600">
        {label}
      </div>
    </div>
  );
}

export function Worker({
  x,
  y,
  label,
  state,
  carrying,
  thought,
}: {
  x: number;
  y: number;
  label: string;
  state: "idle" | "walking" | "working" | "sitting" | "done";
  carrying?: string | null;
  thought?: string;
}) {
  const animation =
    state === "walking"
      ? "animate-bob"
      : state === "working"
        ? "animate-pulse-soft"
        : "";

  return (
    <div
      className="actor-move absolute z-30 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {thought ? (
        <div className="mb-1 max-w-[130px] animate-fade-in rounded-md border border-slate-300 bg-white px-2 py-1 text-center text-[11px] font-semibold leading-tight text-slate-600 shadow">
          {thought}
        </div>
      ) : null}
      <div className={`relative ${animation}`}>
        <div className="relative h-10 w-9">
          <div className="absolute bottom-0 left-1/2 h-6 w-9 -translate-x-1/2 rounded-t-full border-2 border-teal-700 bg-teal-600 shadow-md" />
          <div className="absolute left-1/2 top-0 h-5 w-5 -translate-x-1/2 rounded-full border border-amber-300 bg-amber-200 shadow-sm" />
          <div className="absolute left-1/2 top-0 h-2.5 w-5 -translate-x-1/2 rounded-t-full bg-stone-700" />
        </div>
        {carrying ? (
          <span className="absolute -right-4 -top-3 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 shadow">
            {carrying}
          </span>
        ) : null}
      </div>
      <div className="mt-1 whitespace-nowrap rounded bg-white/90 px-1.5 py-0.5 text-[11px] font-bold text-slate-600 shadow-sm">
        {label}
      </div>
    </div>
  );
}

export function TaskTicket({
  x,
  y,
  label,
  tone = "amber",
  removing,
}: {
  x: number;
  y: number;
  label: string;
  tone?: SceneTone;
  removing?: boolean;
}) {
  return (
    <div
      className={`absolute z-20 flex h-8 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded border-2 bg-white text-[10px] font-bold shadow-sm transition-opacity duration-300 ${
        stationTone[tone]
      } ${removing ? "opacity-0" : "opacity-100"}`}
      style={{ left: `${x}%`, top: `${y}%` }}
      title={label}
    >
      {label}
    </div>
  );
}

export function ReportPath({
  x1,
  y1,
  x2,
  y2,
  active,
  label,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  active?: boolean;
  label?: string;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <div
      className="absolute z-0 h-1 origin-left rounded-full"
      style={{
        left: `${x1}%`,
        top: `${y1}%`,
        width: `${length}%`,
        transform: `rotate(${angle}deg)`,
      }}
    >
      <div
        className={`h-full rounded-full ${
          active ? "bg-emerald-500" : "bg-slate-400/45"
        }`}
      />
      {label ? (
        <span className="absolute left-1/2 top-2 -translate-x-1/2 whitespace-nowrap rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 shadow-sm">
          {label}
        </span>
      ) : null}
    </div>
  );
}

export function Marker({
  x,
  y,
  tone = "slate",
  label,
  active = false,
}: {
  x: number;
  y: number;
  tone?: SceneTone;
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
