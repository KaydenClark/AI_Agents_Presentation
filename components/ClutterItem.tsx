"use client";

import type { ReactNode } from "react";
import { BoxIcon, PalletIcon, SpillIcon, WarningIcon } from "./UiIcons";
import { ItemSprite, type ItemKind } from "./RoomSprites";

export type ClutterKind =
  | "trash"
  | "laundry"
  | "books"
  | "dishes"
  | "toys"
  | "bottles"
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

const CLUTTER_SPRITE: Partial<Record<ClutterKind, ItemKind>> = {
  trash: "trash",
  laundry: "sock",
  books: "book",
  dishes: "plate",
  toys: "toy",
  bottles: "can",
};

interface ClutterItemProps {
  item: Clutter;
  /** Dim the item while it is being picked up / removed. */
  removing?: boolean;
  size?: number;
}

function clutterAsset(kind: ClutterKind, size: number): ReactNode {
  const sprite = CLUTTER_SPRITE[kind];
  if (sprite) return <ItemSprite item={sprite} size={size} />;

  const className = "h-full w-full text-[#3A7CA5]";
  if (kind === "spill") return <SpillIcon className={className} />;
  if (kind === "pallet") return <PalletIcon className={className} />;
  return <BoxIcon className={className} />;
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
        width: size,
        height: size,
      }}
      title={item.kind}
    >
      <span className="block h-full w-full" aria-hidden>
        {clutterAsset(item.kind, size)}
      </span>
      {item.jammed ? (
        <span
          className="absolute -right-2 -top-2 rounded-full bg-[#191919] p-0.5 text-[#E0BD3E] ring-1 ring-[#E0BD3E]"
          aria-hidden
        >
          <WarningIcon className="h-3.5 w-3.5" />
        </span>
      ) : null}
    </div>
  );
}
