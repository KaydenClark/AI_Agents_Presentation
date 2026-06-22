// Typed view over the rasterizer's output (public/assets/sprites/). Generated
// by scripts/rasterize-sprites.mjs — re-run that after changing the SVG source
// in RoomSprites.tsx. The runtime loads PNGs by these URLs; intrinsic sizes
// come from the manifest so the engine never has to measure.

import manifest from "@/public/assets/sprites/sprites.manifest.json";
import type { FurnitureKind, ItemKind } from "../RoomSprites";

export type ActorKind = "worker" | "hand";

export interface SpriteEntry {
  src: string;
  /** Intrinsic PNG width/height in px. */
  w: number;
  h: number;
}

const items = manifest.items as Record<ItemKind, SpriteEntry>;
const itemVariants = manifest.itemVariants as {
  book: Record<string, SpriteEntry>;
};
const furniture = manifest.furniture as Record<FurnitureKind, SpriteEntry>;
const actors = manifest.actors as Record<ActorKind, SpriteEntry>;

/**
 * Resolve a clutter sprite, honoring the `tint` used to sort books by color.
 * Only books have color variants; any other (kind, tint) falls back to the
 * base sprite.
 */
export function itemSprite(kind: ItemKind, tint?: string): SpriteEntry {
  if (kind === "book" && tint && itemVariants.book[tint]) {
    return itemVariants.book[tint];
  }
  return items[kind];
}

export function furnitureSprite(kind: FurnitureKind): SpriteEntry {
  return furniture[kind];
}

export function actorSprite(kind: ActorKind): SpriteEntry {
  return actors[kind];
}

/** Every sprite URL, for preloading. */
export function allSpriteSrcs(): string[] {
  return [
    ...Object.values(items),
    ...Object.values(itemVariants.book),
    ...Object.values(furniture),
    ...Object.values(actors),
  ].map((e) => e.src);
}
