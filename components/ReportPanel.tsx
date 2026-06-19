"use client";

export interface ReportLine {
  id: string;
  text: string;
  /** Marks a line the manager/boss has reviewed and signed off. */
  reviewed?: boolean;
  tone?: "default" | "escalation" | "success";
}

interface ReportPanelProps {
  title: string;
  lines: ReportLine[];
  emptyHint?: string;
  className?: string;
}

/**
 * A scrolling audit log. Used per-zone (manager review) and for the
 * final Boss synthesis.
 */
export default function ReportPanel({
  title,
  lines,
  emptyHint = "Waiting…",
  className = "",
}: ReportPanelProps) {
  return (
    <div
      className={`flex flex-col rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm ${className}`}
    >
      <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        {title}
      </h4>
      <div className="flex-1 space-y-1 overflow-y-auto text-[12px] leading-snug">
        {lines.length === 0 ? (
          <p className="italic text-slate-400">{emptyHint}</p>
        ) : (
          lines.map((line) => (
            <div
              key={line.id}
              className={`flex animate-fade-in items-start gap-1.5 rounded px-1.5 py-1 ${
                line.tone === "escalation"
                  ? "bg-amber-50 text-amber-800"
                  : line.tone === "success"
                    ? "bg-emerald-50 text-emerald-800"
                    : "text-slate-700"
              }`}
            >
              <span className="mt-[1px] w-3 shrink-0" aria-hidden>
                {line.reviewed ? "✅" : "•"}
              </span>
              <span>{line.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
