"use client";

import { AgentIcon } from "./UiIcons";

export type CharacterState = "idle" | "walking" | "working" | "sitting";

export interface CharacterProps {
  /** Optional short text label used for legacy callers. */
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
  /** Short label for the item the character is currently carrying. */
  carrying?: string | null;
  /** Visual size in pixels. */
  size?: number;
}

/**
 * Shared sprite used in both scenes. Movement is driven purely by
 * xPercent / yPercent so callers can animate position with CSS transitions.
 */
export default function Character({
  glyph,
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
        <div className="mb-1 max-w-[140px] animate-fade-in rounded-lg border border-[#474747] bg-[#191919] px-2 py-1 text-center text-[11px] font-medium leading-tight text-zinc-300 shadow">
          {thought}
        </div>
      ) : null}

      <div className="relative">
        <div
          className={`flex items-center justify-center rounded-full bg-[#191919] text-[#F7F7F7] shadow-md ring-2 ${
            state === "sitting" ? "ring-[#474747]" : "ring-[#3A7CA5]"
          } ${animation}`}
          style={{ width: size, height: size }}
        >
          {glyph ? (
            <span className="text-[11px] font-bold uppercase" aria-hidden>
              {glyph.slice(0, 2)}
            </span>
          ) : (
            <AgentIcon className="h-[55%] w-[55%]" />
          )}
        </div>
        {carrying ? (
          <span
            className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#E0BD3E] px-1 text-[10px] font-bold uppercase text-[#191919] shadow ring-1 ring-[#F7F7F7]/30"
            aria-hidden
          >
            {carrying.slice(0, 2)}
          </span>
        ) : null}
      </div>

      {label ? (
        <div className="mt-1 whitespace-nowrap text-[11px] font-semibold text-zinc-400">
          {label}
        </div>
      ) : null}
    </div>
  );
}
