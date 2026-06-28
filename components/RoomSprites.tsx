"use client";

import type { ReactNode } from "react";

// Top-down, RimWorld-style room art for the single-agent cleaning scene.
// Everything is hand-drawn SVG so the scene reads as a little game the agent
// is playing: beveled walls, a wood floor, and recognizable furniture/clutter.

export type FurnitureKind =
  | "trashcan"
  | "sink"
  | "recycling"
  | "bookshelf"
  | "hamper"
  | "toybox"
  | "washer"
  | "stove"
  | "bed"
  | "toilet"
  | "cupboard"
  | "dresser"
  | "couch"
  | "basket";

export type ItemKind =
  | "trash"
  | "cup"
  | "can"
  | "book"
  | "sock"
  | "toy"
  | "plate"
  | "fork"
  | "shirt"
  | "towel";

const WOOD = "#2f271d";
const METAL = "#3b4045";

/* ----------------------------- Room shell ----------------------------- */

function Walls() {
  const hWall = {
    backgroundColor: "#8d8a82",
    backgroundImage:
      "repeating-linear-gradient(90deg, rgba(47,45,40,0.5) 0 1.5px, transparent 1.5px 40px)",
  };
  const vWall = {
    backgroundColor: "#8d8a82",
    backgroundImage:
      "repeating-linear-gradient(0deg, rgba(47,45,40,0.5) 0 1.5px, transparent 1.5px 40px)",
  };
  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
      {/* top */}
      <div
        className="absolute left-0 right-0 top-0 h-6"
        style={{
          ...hWall,
          boxShadow:
            "inset 0 3px 0 rgba(255,255,255,0.18), inset 0 -3px 0 rgba(0,0,0,0.32)",
        }}
      />
      {/* bottom split, leaving a centered doorway */}
      <div
        className="absolute bottom-0 left-0 h-6"
        style={{
          width: "43%",
          ...hWall,
          boxShadow:
            "inset 0 3px 0 rgba(0,0,0,0.28), inset 0 -3px 0 rgba(255,255,255,0.12)",
        }}
      />
      <div
        className="absolute bottom-0 right-0 h-6"
        style={{
          width: "43%",
          ...hWall,
          boxShadow:
            "inset 0 3px 0 rgba(0,0,0,0.28), inset 0 -3px 0 rgba(255,255,255,0.12)",
        }}
      />
      {/* doorway threshold shadow */}
      <div
        className="absolute bottom-0 left-[43%] h-1.5 w-[14%]"
        style={{ backgroundColor: "rgba(40,24,8,0.30)" }}
      />
      {/* left / right */}
      <div
        className="absolute bottom-0 left-0 top-0 w-6"
        style={{
          ...vWall,
          boxShadow:
            "inset 3px 0 0 rgba(255,255,255,0.16), inset -3px 0 0 rgba(0,0,0,0.32)",
        }}
      />
      <div
        className="absolute bottom-0 right-0 top-0 w-6"
        style={{
          ...vWall,
          boxShadow:
            "inset -3px 0 0 rgba(255,255,255,0.16), inset 3px 0 0 rgba(0,0,0,0.32)",
        }}
      />
      {/* corner blocks */}
      {[
        "left-0 top-0",
        "right-0 top-0",
        "left-0 bottom-0",
        "right-0 bottom-0",
      ].map((pos) => (
        <div
          key={pos}
          className={`absolute h-6 w-6 ${pos}`}
          style={{
            backgroundColor: "#787570",
            boxShadow:
              "inset 0 0 0 1px rgba(40,38,34,0.6), inset 0 2px 0 rgba(255,255,255,0.14)",
          }}
        />
      ))}
    </div>
  );
}

export function RoomCanvas({
  ariaLabel,
  children,
}: {
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <div
      aria-label={ariaLabel}
      className="relative aspect-[16/9] w-full overflow-hidden rounded-lg shadow-xl ring-2 ring-[#241f18]"
      style={{
        backgroundColor: "#c69b63",
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(74,48,22,0.16) 0 2px, transparent 2px 44px), repeating-linear-gradient(90deg, rgba(74,48,22,0.07) 0 1px, transparent 1px 132px)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{ boxShadow: "inset 0 0 70px rgba(40,24,8,0.35)" }}
        aria-hidden
      />
      <Walls />
      {children}
    </div>
  );
}

/* --------------------------- Item sprites ----------------------------- */

export function ItemSprite({
  item,
  size = 30,
  tint,
}: {
  item: ItemKind;
  size?: number;
  /** Cover/fabric color override — used so books can be sorted by color. */
  tint?: string;
}) {
  const s = { width: size, height: size, display: "block" } as const;
  switch (item) {
    case "trash":
      return (
        <svg viewBox="0 0 32 32" style={s} aria-hidden>
          <ellipse cx="16" cy="26" rx="11" ry="3" fill="rgba(0,0,0,0.18)" />
          <path
            d="M7 20 L10 11 L17 8 L24 13 L23 21 L15 25 Z"
            fill="#e7e3da"
            stroke={WOOD}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M11 13 L16 16 M19 11 L20 18 M13 20 L21 17"
            stroke="#b8b2a4"
            strokeWidth="1.3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      );
    case "cup":
      return (
        <svg viewBox="0 0 32 32" style={s} aria-hidden>
          <ellipse cx="15" cy="25" rx="11" ry="3" fill="rgba(0,0,0,0.18)" />
          <path
            d="M24 13 a5 5 0 0 1 0 8"
            fill="none"
            stroke="#cfd3d6"
            strokeWidth="3"
          />
          <circle cx="15" cy="17" r="10" fill="#eef1f3" stroke={METAL} strokeWidth="1.6" />
          <circle cx="15" cy="17" r="6" fill="#6b4a2e" />
          <ellipse cx="13" cy="15" rx="2.4" ry="1.4" fill="rgba(255,255,255,0.5)" />
        </svg>
      );
    case "can":
      return (
        <svg viewBox="0 0 32 32" style={s} aria-hidden>
          <ellipse cx="16" cy="26" rx="10" ry="3" fill="rgba(0,0,0,0.18)" />
          <circle cx="16" cy="16" r="10" fill="#c9cdd1" stroke={METAL} strokeWidth="1.6" />
          <circle cx="16" cy="16" r="7.5" fill="#d23b3b" stroke="#8f2525" strokeWidth="1" />
          <ellipse cx="16" cy="16" rx="4" ry="2.4" fill="#9a9ea2" />
          <circle cx="16" cy="16" r="1.4" fill="#5d6166" />
        </svg>
      );
    case "book": {
      const cover = tint ?? "#2f6db0";
      return (
        <svg viewBox="0 0 32 32" style={s} aria-hidden>
          <ellipse cx="16" cy="25" rx="11" ry="3" fill="rgba(0,0,0,0.18)" />
          <rect x="7" y="9" width="18" height="14" rx="1.5" fill={cover} stroke={WOOD} strokeWidth="1.6" />
          <rect x="7" y="9" width="4" height="14" fill="rgba(0,0,0,0.22)" />
          <rect x="12" y="12" width="10" height="1.6" fill="rgba(255,255,255,0.6)" />
          <rect x="12" y="15.5" width="8" height="1.4" fill="rgba(255,255,255,0.45)" />
        </svg>
      );
    }
    case "sock":
      return (
        <svg viewBox="0 0 32 32" style={s} aria-hidden>
          <ellipse cx="16" cy="26" rx="10" ry="3" fill="rgba(0,0,0,0.18)" />
          <path
            d="M12 6 L19 6 L19 16 L24 21 a4 4 0 0 1 -6 5 L10 18 a3 3 0 0 1 -1 -2 L9 8 a2 2 0 0 1 3 -2 Z"
            fill="#f1f0ec"
            stroke={WOOD}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M9 9 L19 9 M9 12 L19 12" stroke="#d24b6e" strokeWidth="1.6" />
        </svg>
      );
    case "toy":
      return (
        <svg viewBox="0 0 32 32" style={s} aria-hidden>
          <ellipse cx="16" cy="26" rx="10" ry="3" fill="rgba(0,0,0,0.18)" />
          <circle cx="16" cy="15" r="10" fill="#f4c02f" stroke={WOOD} strokeWidth="1.6" />
          <path d="M16 5 a10 10 0 0 1 8.6 5 L7.4 10 A10 10 0 0 1 16 5" fill="#e0463c" />
          <path d="M6.4 18 a10 10 0 0 0 19.2 0 Z" fill="#2f8fd0" opacity="0.85" />
          <circle cx="12" cy="12" r="2" fill="rgba(255,255,255,0.6)" />
        </svg>
      );
    case "plate":
      return (
        <svg viewBox="0 0 32 32" style={s} aria-hidden>
          <ellipse cx="16" cy="25" rx="11" ry="3" fill="rgba(0,0,0,0.18)" />
          <circle cx="16" cy="16" r="11" fill="#eef1f3" stroke={METAL} strokeWidth="1.6" />
          <circle cx="16" cy="16" r="7" fill="#dde3e8" stroke="#c4ccd2" strokeWidth="1" />
          <circle cx="16" cy="16" r="3.2" fill="#cdd5db" />
          <ellipse cx="12.5" cy="12.5" rx="2.2" ry="1.3" fill="rgba(255,255,255,0.6)" />
        </svg>
      );
    case "fork":
      return (
        <svg viewBox="0 0 32 32" style={s} aria-hidden>
          <ellipse cx="16" cy="27" rx="7" ry="2.4" fill="rgba(0,0,0,0.18)" />
          <path
            d="M11 5 v7 M14 5 v7 M18 5 v7 M21 5 v7"
            stroke="#aeb6bd"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M11 12 q0 4 5 4 q5 0 5 -4 Z"
            fill="#cfd4d8"
            stroke={METAL}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <rect x="14.2" y="15" width="3.6" height="12" rx="1.8" fill="#cfd4d8" stroke={METAL} strokeWidth="1.2" />
        </svg>
      );
    case "shirt":
      return (
        <svg viewBox="0 0 32 32" style={s} aria-hidden>
          <ellipse cx="16" cy="27" rx="11" ry="2.6" fill="rgba(0,0,0,0.18)" />
          <path
            d="M12 6 L8 8 L4 14 L8.5 17 L10 15.5 L10 26 L22 26 L22 15.5 L23.5 17 L28 14 L24 8 L20 6
               Q16 10.5 12 6 Z"
            fill={tint ?? "#4a90c2"}
            stroke={WOOD}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M12 6 Q16 10.5 20 6" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
        </svg>
      );
    case "towel":
      return (
        <svg viewBox="0 0 32 32" style={s} aria-hidden>
          <ellipse cx="16" cy="26" rx="11" ry="2.6" fill="rgba(0,0,0,0.18)" />
          <rect x="7" y="8" width="18" height="16" rx="2" fill={tint ?? "#7ec8b1"} stroke={WOOD} strokeWidth="1.5" />
          <rect x="7" y="8" width="18" height="4" rx="2" fill="rgba(0,0,0,0.14)" />
          <path d="M10 16 h12 M10 19 h12" stroke="rgba(255,255,255,0.65)" strokeWidth="1" />
        </svg>
      );
  }
}
