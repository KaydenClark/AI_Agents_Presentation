"use client";

import { CheckIcon, DotIcon } from "./UiIcons";

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
      className={`flex flex-col rounded-lg border border-[#474747] bg-[#191919]/95 p-3 shadow-sm ${className}`}
    >
      <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-400">
        {title}
      </h4>
      <div className="flex-1 space-y-1 overflow-y-auto text-[12px] leading-snug">
        {lines.length === 0 ? (
          <p className="italic text-zinc-500">{emptyHint}</p>
        ) : (
          lines.map((line) => (
            <div
              key={line.id}
              className={`flex animate-fade-in items-start gap-1.5 rounded px-1.5 py-1 ${
                line.tone === "escalation"
                  ? "bg-[#E0BD3E]/15 text-[#f1d977]"
                  : line.tone === "success"
                    ? "bg-[#4DAA57]/15 text-[#95df9d]"
                    : "text-zinc-300"
              }`}
            >
              {line.reviewed ? (
                <CheckIcon className="mt-[1px] h-3.5 w-3.5 shrink-0 text-[#4DAA57]" />
              ) : (
                <DotIcon className="mt-[3px] h-2.5 w-2.5 shrink-0 text-zinc-500" />
              )}
              <span>{line.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
