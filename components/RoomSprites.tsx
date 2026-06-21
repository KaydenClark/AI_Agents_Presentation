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
  | "couch";

export type ItemKind = "trash" | "cup" | "can" | "book" | "sock" | "toy";

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

/* ------------------------------ Rug ----------------------------------- */

export function Rug({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="pointer-events-none absolute z-[2] -translate-x-1/2 -translate-y-1/2 rounded-md"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: "30%",
        height: "42%",
        backgroundColor: "#b3543f",
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(255,255,255,0.07) 0 6px, transparent 6px 13px)",
        border: "4px solid #8f3d2c",
        boxShadow:
          "0 2px 6px rgba(0,0,0,0.25), inset 0 0 0 3px rgba(255,255,255,0.10)",
      }}
      aria-hidden
    />
  );
}

/* --------------------------- Item sprites ----------------------------- */

export function ItemSprite({
  item,
  size = 30,
}: {
  item: ItemKind;
  size?: number;
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
    case "book":
      return (
        <svg viewBox="0 0 32 32" style={s} aria-hidden>
          <ellipse cx="16" cy="25" rx="11" ry="3" fill="rgba(0,0,0,0.18)" />
          <rect x="7" y="9" width="18" height="14" rx="1.5" fill="#2f6db0" stroke={WOOD} strokeWidth="1.6" />
          <rect x="7" y="9" width="4" height="14" fill="#234f80" />
          <rect x="12" y="12" width="10" height="1.6" fill="rgba(255,255,255,0.6)" />
          <rect x="12" y="15.5" width="8" height="1.4" fill="rgba(255,255,255,0.45)" />
        </svg>
      );
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
  }
}

/* ------------------------- Furniture sprites -------------------------- */

function FurnitureSprite({ kind }: { kind: FurnitureKind }) {
  const s = { width: 60, height: 64, display: "block" } as const;
  switch (kind) {
    case "trashcan":
      return (
        <svg viewBox="0 0 60 64" style={s} aria-hidden>
          <ellipse cx="30" cy="54" rx="20" ry="5" fill="rgba(0,0,0,0.20)" />
          <path d="M16 22 L20 50 L40 50 L44 22 Z" fill="#9aa1a8" stroke={METAL} strokeWidth="2" strokeLinejoin="round" />
          <path d="M22 24 L25 49 M30 24 L30 49 M38 24 L35 49" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" />
          <ellipse cx="30" cy="22" rx="15" ry="6" fill="#b9c0c6" stroke={METAL} strokeWidth="2" />
          <ellipse cx="30" cy="22" rx="10" ry="3.6" fill="#33383d" />
          <path d="M24 19 L27 13 L31 18 L34 12 L37 19" fill="none" stroke="#cfcabf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "sink":
      return (
        <svg viewBox="0 0 60 64" style={s} aria-hidden>
          <ellipse cx="30" cy="54" rx="24" ry="5" fill="rgba(0,0,0,0.18)" />
          <rect x="6" y="20" width="48" height="32" rx="4" fill="#cfd4d8" stroke={METAL} strokeWidth="2" />
          <rect x="6" y="20" width="48" height="6" rx="3" fill="#e4e8ea" />
          <rect x="14" y="28" width="32" height="20" rx="4" fill="#8b9298" stroke={METAL} strokeWidth="1.6" />
          <rect x="18" y="31" width="24" height="14" rx="3" fill="#6f767c" />
          <circle cx="30" cy="38" r="2.4" fill="#3f454a" />
          <rect x="27" y="14" width="6" height="9" rx="2" fill="#b0b6bb" stroke={METAL} strokeWidth="1.4" />
          <path d="M30 14 q0 -4 6 -4" fill="none" stroke="#b0b6bb" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "recycling":
      return (
        <svg viewBox="0 0 60 64" style={s} aria-hidden>
          <ellipse cx="30" cy="54" rx="20" ry="5" fill="rgba(0,0,0,0.20)" />
          <path d="M16 24 L19 50 L41 50 L44 24 Z" fill="#3f9d52" stroke="#1f5d2f" strokeWidth="2" strokeLinejoin="round" />
          <path d="M23 26 L25 49 M30 26 L30 49 M37 26 L35 49" stroke="rgba(0,0,0,0.16)" strokeWidth="1.4" />
          <ellipse cx="30" cy="24" rx="15" ry="6" fill="#4cb061" stroke="#1f5d2f" strokeWidth="2" />
          <path d="M30 31 L34 38 L26 38 Z M24 41 L31 41 L27.5 47 Z M36 41 L29 41 L32.5 47 Z" fill="none" stroke="#eafaef" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      );
    case "bookshelf":
      return (
        <svg viewBox="0 0 60 64" style={s} aria-hidden>
          <ellipse cx="30" cy="56" rx="24" ry="4.5" fill="rgba(0,0,0,0.18)" />
          <rect x="7" y="12" width="46" height="42" rx="3" fill="#6e4a2b" stroke={WOOD} strokeWidth="2" />
          <rect x="11" y="16" width="38" height="15" fill="#855a36" />
          <rect x="11" y="34" width="38" height="15" fill="#855a36" />
          {[
            ["#c0413b", 12, 17],
            ["#2f6db0", 16, 16],
            ["#3b8f4e", 20, 18],
            ["#d99a2a", 24, 15],
            ["#7d4ab0", 28, 17],
            ["#c0413b", 33, 16],
            ["#2f6db0", 37, 18],
            ["#3b8f4e", 41, 15],
          ].map(([c, x, h], i) => (
            <rect key={`a${i}`} x={x as number} y={31 - (h as number)} width="3.4" height={h as number} fill={c as string} stroke="rgba(0,0,0,0.25)" strokeWidth="0.6" />
          ))}
          {[
            ["#d99a2a", 12, 16],
            ["#7d4ab0", 16, 18],
            ["#c0413b", 20, 15],
            ["#3b8f4e", 24, 17],
            ["#2f6db0", 28, 16],
            ["#d99a2a", 33, 18],
            ["#c0413b", 37, 15],
            ["#7d4ab0", 41, 17],
          ].map(([c, x, h], i) => (
            <rect key={`b${i}`} x={x as number} y={49 - (h as number)} width="3.4" height={h as number} fill={c as string} stroke="rgba(0,0,0,0.25)" strokeWidth="0.6" />
          ))}
        </svg>
      );
    case "hamper":
      return (
        <svg viewBox="0 0 60 64" style={s} aria-hidden>
          <ellipse cx="30" cy="55" rx="20" ry="5" fill="rgba(0,0,0,0.18)" />
          <path d="M16 24 L19 50 L41 50 L44 24 Z" fill="#cfa76b" stroke="#7c5a2e" strokeWidth="2" strokeLinejoin="round" />
          <path d="M19 30 L41 30 M19.5 38 L40.5 38 M20 46 L40 46" stroke="#9c7740" strokeWidth="1.6" />
          <path d="M24 24 L26 50 M30 24 L30 50 M36 24 L34 50" stroke="rgba(124,90,46,0.5)" strokeWidth="1.4" />
          <ellipse cx="30" cy="24" rx="15" ry="6" fill="#dcb87f" stroke="#7c5a2e" strokeWidth="2" />
          <path d="M22 23 q4 -8 9 -3 q4 -6 8 1" fill="#eef0f2" stroke="#b9c0c6" strokeWidth="1.2" />
        </svg>
      );
    case "toybox":
      return (
        <svg viewBox="0 0 60 64" style={s} aria-hidden>
          <ellipse cx="30" cy="55" rx="22" ry="5" fill="rgba(0,0,0,0.18)" />
          <path d="M14 16 L46 16 L44 22 L16 22 Z" fill="#8a5f38" stroke="#3f2a16" strokeWidth="2" strokeLinejoin="round" />
          <rect x="14" y="26" width="32" height="24" rx="3" fill="#7a5230" stroke="#3f2a16" strokeWidth="2" />
          <rect x="14" y="26" width="32" height="6" fill="#8a5f38" />
          <circle cx="22" cy="24" r="4" fill="#e0463c" stroke="#3f2a16" strokeWidth="1.2" />
          <rect x="28" y="20" width="7" height="7" rx="1" fill="#3b8f4e" stroke="#3f2a16" strokeWidth="1.2" />
          <path d="M40 25 l2.5 -6 l2.5 6 z" fill="#f4c02f" stroke="#3f2a16" strokeWidth="1.2" />
          <circle cx="18" cy="44" r="2" fill="#caa45f" />
          <circle cx="42" cy="44" r="2" fill="#caa45f" />
        </svg>
      );
    case "washer":
      return (
        <svg viewBox="0 0 60 64" style={s} aria-hidden>
          <ellipse cx="30" cy="56" rx="20" ry="4.5" fill="rgba(0,0,0,0.18)" />
          <rect x="12" y="16" width="36" height="38" rx="4" fill="#dfe3e6" stroke={METAL} strokeWidth="2" />
          <rect x="12" y="16" width="36" height="9" rx="3" fill="#eef1f3" />
          <rect x="16" y="19" width="11" height="3" rx="1.5" fill="#9aa1a8" />
          <circle cx="42" cy="20.5" r="2" fill="#5dcaa5" />
          <circle cx="30" cy="39" r="11" fill="#aeb6bd" stroke={METAL} strokeWidth="2" />
          <circle cx="30" cy="39" r="7" fill="#7f878d" />
          <ellipse cx="27" cy="36" rx="2.6" ry="1.6" fill="rgba(255,255,255,0.55)" />
        </svg>
      );
    case "stove":
      return (
        <svg viewBox="0 0 60 64" style={s} aria-hidden>
          <ellipse cx="30" cy="54" rx="23" ry="4.5" fill="rgba(0,0,0,0.18)" />
          <rect x="8" y="15" width="44" height="39" rx="4" fill="#c9ced2" stroke={METAL} strokeWidth="2" />
          <rect x="8" y="15" width="44" height="9" rx="3" fill="#b3b9be" />
          <circle cx="15" cy="19.5" r="1.6" fill="#e0463c" />
          <circle cx="22" cy="19.5" r="1.6" fill="#e0463c" />
          {[
            [20, 36],
            [40, 36],
            [20, 47],
            [40, 47],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="6" fill="#5f656b" stroke={METAL} strokeWidth="1.4" />
          ))}
        </svg>
      );
    case "bed":
      return (
        <svg viewBox="0 0 60 64" style={s} aria-hidden>
          <ellipse cx="30" cy="58" rx="24" ry="4" fill="rgba(0,0,0,0.18)" />
          <rect x="8" y="10" width="44" height="46" rx="4" fill="#6e4a2b" stroke={WOOD} strokeWidth="2" />
          <rect x="11" y="20" width="38" height="33" rx="3" fill="#8fb7d6" stroke="#4a6f8c" strokeWidth="1.6" />
          <rect x="11" y="13" width="38" height="9" rx="3" fill="#f1f0ec" stroke="#c9c6bd" strokeWidth="1.4" />
          <path d="M11 31 L49 31" stroke="#4a6f8c" strokeWidth="1.2" opacity="0.6" />
        </svg>
      );
    case "toilet":
      return (
        <svg viewBox="0 0 60 64" style={s} aria-hidden>
          <ellipse cx="30" cy="54" rx="15" ry="4" fill="rgba(0,0,0,0.18)" />
          <rect x="20" y="13" width="20" height="12" rx="2" fill="#e8ecee" stroke={METAL} strokeWidth="2" />
          <ellipse cx="30" cy="38" rx="13" ry="15" fill="#f1f4f5" stroke={METAL} strokeWidth="2" />
          <ellipse cx="30" cy="38" rx="8" ry="10" fill="#c7ced2" />
        </svg>
      );
    case "cupboard":
      return (
        <svg viewBox="0 0 60 64" style={s} aria-hidden>
          <ellipse cx="30" cy="56" rx="22" ry="4" fill="rgba(0,0,0,0.18)" />
          <rect x="9" y="12" width="42" height="42" rx="3" fill="#8a5f38" stroke="#3f2a16" strokeWidth="2" />
          <rect x="14" y="16" width="13" height="34" rx="2" fill="#9c6f44" />
          <rect x="33" y="16" width="13" height="34" rx="2" fill="#9c6f44" />
          <line x1="30" y1="14" x2="30" y2="52" stroke="#3f2a16" strokeWidth="1.6" />
          <circle cx="27" cy="34" r="1.6" fill="#3f2a16" />
          <circle cx="33" cy="34" r="1.6" fill="#3f2a16" />
        </svg>
      );
    case "dresser":
      return (
        <svg viewBox="0 0 60 64" style={s} aria-hidden>
          <ellipse cx="30" cy="56" rx="22" ry="4" fill="rgba(0,0,0,0.18)" />
          <rect x="10" y="16" width="40" height="38" rx="3" fill="#7a5230" stroke="#3f2a16" strokeWidth="2" />
          {[19, 30, 41].map((y) => (
            <g key={y}>
              <rect x="13" y={y} width="34" height="9" rx="2" fill="#9c6f44" />
              <circle cx="27" cy={y + 4.5} r="1.5" fill="#3f2a16" />
              <circle cx="33" cy={y + 4.5} r="1.5" fill="#3f2a16" />
            </g>
          ))}
        </svg>
      );
    case "couch":
      return (
        <svg viewBox="0 0 60 64" style={s} aria-hidden>
          <ellipse cx="30" cy="52" rx="24" ry="4" fill="rgba(0,0,0,0.18)" />
          <rect x="8" y="20" width="44" height="26" rx="5" fill="#b3543f" stroke="#7c3a2a" strokeWidth="2" />
          <rect x="8" y="13" width="44" height="13" rx="5" fill="#c4634d" stroke="#7c3a2a" strokeWidth="2" />
          <rect x="8" y="20" width="9" height="22" rx="4" fill="#a84a37" />
          <rect x="43" y="20" width="9" height="22" rx="4" fill="#a84a37" />
          <rect x="19" y="26" width="10" height="14" rx="3" fill="#c4634d" />
          <rect x="31" y="26" width="10" height="14" rx="3" fill="#c4634d" />
        </svg>
      );
  }
}

export function Furniture({
  x,
  y,
  kind,
  label,
  scale = 1,
}: {
  x: number;
  y: number;
  kind: FurnitureKind;
  label?: string;
  scale?: number;
}) {
  return (
    <div
      className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div style={{ transform: `scale(${scale})` }}>
        <FurnitureSprite kind={kind} />
      </div>
      {label ? (
        <span className="-mt-1 whitespace-nowrap rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
          {label}
        </span>
      ) : null}
    </div>
  );
}

export function FloorItem({
  x,
  y,
  item,
  removing,
}: {
  x: number;
  y: number;
  item: ItemKind;
  removing?: boolean;
}) {
  return (
    <div
      className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ${
        removing ? "opacity-0" : "opacity-100"
      }`}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <ItemSprite item={item} size={30} />
    </div>
  );
}

/* ---------------------------- Worker --------------------------------- */

export function RoomWorker({
  x,
  y,
  state,
  carrying,
  thought,
  label,
}: {
  x: number;
  y: number;
  state: "sitting" | "walking" | "working" | "idle" | "done";
  carrying?: ItemKind | null;
  thought?: string;
  label: string;
}) {
  const animation =
    state === "walking"
      ? "animate-bob"
      : state === "working"
        ? "animate-pulse-soft"
        : "";
  return (
    <div
      className="actor-move absolute z-30 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {thought ? (
        <div className="mb-1 max-w-[130px] animate-fade-in rounded-md border border-slate-300 bg-white px-2 py-1 text-center text-[11px] font-semibold leading-tight text-slate-600 shadow">
          {thought}
        </div>
      ) : null}
      <div className={`relative ${animation}`}>
        <svg viewBox="0 0 40 46" width="40" height="46" style={{ display: "block" }} aria-hidden>
          <ellipse cx="20" cy="40" rx="13" ry="4" fill="rgba(0,0,0,0.22)" />
          {/* jacket / body */}
          <path
            d="M8 34 q0 -13 12 -13 q12 0 12 13 q-12 5 -24 0 Z"
            fill="#2f7d6b"
            stroke="#1c2620"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* arms */}
          <circle cx="9" cy="30" r="3.4" fill="#e6b48c" stroke="#1c2620" strokeWidth="1.4" />
          <circle cx="31" cy="30" r="3.4" fill="#e6b48c" stroke="#1c2620" strokeWidth="1.4" />
          {/* head */}
          <circle cx="20" cy="18" r="10" fill="#e6b48c" stroke="#1c2620" strokeWidth="2" />
          {/* hair */}
          <path
            d="M10 18 a10 10 0 0 1 20 0 q-10 -5 -20 0 Z"
            fill="#433423"
            stroke="#1c2620"
            strokeWidth="1.5"
          />
        </svg>
        {carrying ? (
          <span className="absolute -right-3 -top-2 rounded-full bg-white/85 p-0.5 shadow">
            <ItemSprite item={carrying} size={18} />
          </span>
        ) : null}
      </div>
      <span className="mt-0.5 whitespace-nowrap rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
        {label}
      </span>
    </div>
  );
}

/* --------------------------- Manual hand ------------------------------ */

export function HandSprite({ carrying }: { carrying?: ItemKind | null }) {
  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="0 0 34 40" width="34" height="40" style={{ display: "block" }} aria-hidden>
        <path
          d="M11 4 v14 M16 3 v15 M21 4 v14 M26 7 v11
             M11 16 q-5 1 -3 8 l3 9 q2 4 7 4 l4 0 q6 0 8 -7 l1 -10 q0 -4 -4 -4"
          fill="#f0c79e"
          stroke="#5b3f27"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      {carrying ? (
        <span className="-mt-1 rounded-full bg-white/85 p-0.5 shadow">
          <ItemSprite item={carrying} size={18} />
        </span>
      ) : null}
    </div>
  );
}
