"use client";

export type ClutterKind =
  | "trash"
  | "laundry"
  | "books"
  | "dishes"
  | "box"
  | "spill"
  | "pallet";

export interface Clutter {
  id: string;
  kind: ClutterKind;
  xPercent: number;
  yPercent: number;
  /** Whether this item is jammed/flagged and must be escalated. */
  jammed?: boolean;
}

export const CLUTTER_GLYPH: Record<ClutterKind, string> = {
  trash: "🗑️",
  laundry: "🧦",
  books: "📚",
  dishes: "🍽️",
  box: "📦",
  spill: "💧",
  pallet: "🪵",
};

/**
 * Which fixed target a clutter kind belongs in. "trash" items go to the
 * trash can; everything else is "stored" in the drawer/closet.
 */
export function targetFor(kind: ClutterKind): "trash" | "drawer" {
  return kind === "trash" || kind === "spill" ? "trash" : "drawer";
}

interface ClutterItemProps {
  item: Clutter;
  /** Dim the item while it is being picked up / removed. */
  removing?: boolean;
  size?: number;
}

export default function ClutterItem({
  item,
  removing,
  size = 30,
}: ClutterItemProps) {
  return (
    <div
      className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center transition-opacity duration-300 ${
        removing ? "opacity-0" : "opacity-100"
      }`}
      style={{
        left: `${item.xPercent}%`,
        top: `${item.yPercent}%`,
        fontSize: size,
      }}
      title={item.kind}
    >
      <span aria-hidden>{CLUTTER_GLYPH[item.kind]}</span>
      {item.jammed ? (
        <span className="absolute -right-2 -top-2 text-xs" aria-hidden>
          ⚠️
        </span>
      ) : null}
    </div>
  );
}
