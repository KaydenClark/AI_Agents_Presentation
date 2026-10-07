"use client";

import { HumanIcon } from "./UiIcons";

interface EscalationBannerProps {
  message: string;
  onDismiss?: () => void;
}

/**
 * The real exit point of the swarm: when the Boss cannot resolve an
 * escalation, a human is asked to step in.
 */
export default function EscalationBanner({
  message,
  onDismiss,
}: EscalationBannerProps) {
  return (
    <div className="animate-fade-in rounded-lg border-2 border-[#DE2B31]/70 bg-[#DE2B31]/15 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <HumanIcon className="h-7 w-7 shrink-0 text-[#DE2B31]" />
          <div>
            <p className="text-sm font-bold text-[#ff9a9d]">
              Needs human input
            </p>
            <p className="text-sm text-[#ffd0d1]">{message}</p>
          </div>
        </div>
        {onDismiss ? (
          <button
            onClick={onDismiss}
            className="shrink-0 rounded-md border border-[#DE2B31]/60 bg-[#191919] px-3 py-1 text-sm font-semibold text-[#ffb4b6] transition hover:bg-[#DE2B31]/20"
          >
            Resolve
          </button>
        ) : null}
      </div>
    </div>
  );
}
