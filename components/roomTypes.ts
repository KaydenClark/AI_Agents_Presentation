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
