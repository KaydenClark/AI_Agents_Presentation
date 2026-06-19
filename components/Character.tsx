"use client";

export type CharacterState = "idle" | "walking" | "working" | "sitting";

export interface CharacterProps {
  /** Emoji or short glyph used as the sprite face. */
  glyph?: string;
  /** Left position as a percentage of the parent (0-100). */
  xPercent: number;
  /** Top position as a percentage of the parent (0-100). */
  yPercent: number;
  state: CharacterState;
  /** Optional label rendered under the sprite. */
  label?: string;
  /** Optional thought-bubble text shown while scanning/thinking. */
  thought?: string;
  /** Item the character is currently carrying (emoji). */
  carrying?: string | null;
  /** Visual size in pixels. */
  size?: number;
}

/**
 * Shared sprite used in both scenes. Movement is driven purely by
 * xPercent / yPercent so callers can animate position with CSS transitions.
 */
export default function Character({
  glyph = "🧍",
  xPercent,
  yPercent,
  state,
  label,
  thought,
  carrying,
  size = 44,
}: CharacterProps) {
  const animation =
    state === "walking"
      ? "animate-bob"
      : state === "working"
        ? "animate-pulse-soft"
        : "";

  return (
    <div
      className="actor-move absolute z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
    >
      {thought ? (
        <div className="mb-1 max-w-[140px] animate-fade-in rounded-xl border border-slate-200 bg-white px-2 py-1 text-center text-[11px] font-medium leading-tight text-slate-600 shadow">
          {thought}
        </div>
      ) : null}

      <div className="relative">
        <div
          className={`flex items-center justify-center rounded-full bg-white shadow-md ring-2 ${
            state === "sitting" ? "ring-slate-300" : "ring-indigo-300"
          } ${animation}`}
          style={{ width: size, height: size, fontSize: size * 0.55 }}
        >
          <span aria-hidden>{glyph}</span>
        </div>
        {carrying ? (
          <span
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-sm shadow ring-1 ring-amber-300"
            aria-hidden
          >
            {carrying}
          </span>
        ) : null}
      </div>

      {label ? (
        <div className="mt-1 whitespace-nowrap text-[11px] font-semibold text-slate-500">
          {label}
        </div>
      ) : null}
    </div>
  );
}
