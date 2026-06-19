"use client";

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
    <div className="animate-fade-in rounded-xl border-2 border-rose-300 bg-rose-50 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden>
            🙋
          </span>
          <div>
            <p className="text-sm font-bold text-rose-700">
              Needs human input
            </p>
            <p className="text-sm text-rose-600">{message}</p>
          </div>
        </div>
        {onDismiss ? (
          <button
            onClick={onDismiss}
            className="shrink-0 rounded-lg border border-rose-300 bg-white px-3 py-1 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
          >
            Resolve
          </button>
        ) : null}
      </div>
    </div>
  );
}
