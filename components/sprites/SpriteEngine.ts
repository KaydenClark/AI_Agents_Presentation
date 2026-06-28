// Raw <canvas> rendering engine for the top-down game modes. Pure TypeScript, no
// React: it owns a requestAnimationFrame loop and draws PNG sprites from
// game-state objects. Modes mutate this engine imperatively (set items, move
// actors, etc.); the engine interpolates motion per frame so React never
// re-renders during movement (Task 4 decoupling).
//
// Coordinates are percentages (0-100) of the canvas, matching the original DOM
// modes, so existing layout numbers carry over unchanged. Depth is handled by
// sorting every drawable by its on-screen baseline Y before painting, so items
// lower on the screen are drawn last and overlap those above (Task 3).
//
// Room modes use two fixed actors ("worker"/"hand"). Swarm mode
// uses a keyed actor collection (a Boss, 3 Managers, 6 Agents) plus clutter
// piles and report-path lines.

import {
  actorSprite,
  allSpriteSrcs,
  furnitureSprite,
  itemSprite,
  type ActorKind,
} from "./spriteManifest";
import type { FurnitureKind, ItemKind } from "../RoomSprites";

type Vec = { x: number; y: number };

interface Tween extends Vec {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  start: number;
  dur: number;
}

type ActorState = "sitting" | "walking" | "working" | "idle" | "done";

interface ActorModel {
  id: string;
  kind: ActorKind;
  visible: boolean;
  state: ActorState;
  carrying: ItemKind | null;
  carryingTint?: string;
  thought: string | null;
  label: string | null;
  /** Display height in CSS px for the body sprite (before scale). */
  dispH: number;
  scale: number;
  move: Tween;
}

interface ItemModel {
  id: string;
  kind: ItemKind;
  x: number;
  y: number;
  /** 1 = fully shown, drops to 0 while being picked up. */
  alpha: number;
  removing: boolean;
}

interface FurnitureModel {
  kind: FurnitureKind;
  x: number;
  y: number;
  label?: string;
  dispW: number;
  dispH: number;
}

interface PileModel {
  id: string;
  x: number;
  y: number;
  items: { sprite: ItemKind; tint?: string }[];
  count: number;
}

interface PathModel {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  active: boolean;
}

interface RugModel {
  x: number;
  y: number;
  wPct: number;
  hPct: number;
}

interface Poof {
  x: number;
  y: number;
  text: string;
  start: number;
}

interface DropModel {
  id: string;
  kind: ItemKind;
  tint?: string;
  x: number;
  y: number;
  startY: number;
  start: number;
}

const ITEM_DISP = 30; // px, matches the side-panel ItemSprite size
const PILE_ITEM = 18; // px, matches the old warehouse Pile ItemSprite size
const FURNITURE_W = 60; // px, matches FurnitureSprite base box
const FURNITURE_H = 64;
const WORKER_H = 46;
const HAND_H = 40;
const FADE_MS = 300;
const POOF_MS = 650;
const DROP_MS = 620;

// Tight cluster offsets (px) so each pile reads as a heap, not one object.
const PILE_OFFSETS: [number, number][] = [
  [-9, -3],
  [1, -6],
  [10, -2],
  [-6, 5],
  [4, 5],
  [-1, 12],
  [-12, 7],
  [12, 7],
];

const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function staticTween(x: number, y: number): Tween {
  return { x, y, fromX: x, fromY: y, toX: x, toY: y, start: 0, dur: 0 };
}

export class SpriteEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private images = new Map<string, HTMLImageElement>();
  private ready = new Set<string>();
  private raf = 0;
  private running = false;
  private dpr = 1;
  private dprCap = 2;
  private cssW = 0;
  private cssH = 0;
  private frameMinMs = 0;
  private lastFrame = 0;

  private rug: RugModel | null = null;
  private furniture: FurnitureModel[] = [];
  private items: ItemModel[] = [];
  private piles: PileModel[] = [];
  private paths: PathModel[] = [];
  private actors = new Map<string, ActorModel>();
  private poofs: Poof[] = [];
  private drops: DropModel[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    this.ctx = ctx;

    // Seed the room's two fixed actors so RoomScene's worker/hand calls work.
    this.actors.set("worker", this.makeActor("worker", "worker", WORKER_H));
    this.actors.set("hand", this.makeActor("hand", "hand", HAND_H));

    this.preload();
    this.resize();
  }

  private makeActor(id: string, kind: ActorKind, dispH: number): ActorModel {
    return {
      id,
      kind,
      visible: false,
      state: "sitting",
      carrying: null,
      carryingTint: undefined,
      thought: null,
      label: null,
      dispH,
      scale: 1,
      move: staticTween(50, 50),
    };
  }

  /* ----------------------------- image cache ----------------------------- */

  private preload() {
    for (const src of allSpriteSrcs()) this.getImage(src);
  }

  private getImage(src: string): HTMLImageElement | null {
    const cached = this.images.get(src);
    if (cached) return this.ready.has(src) ? cached : null;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => this.ready.add(src);
    img.src = src;
    this.images.set(src, img);
    return null;
  }

  /* ------------------------------- sizing -------------------------------- */

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.dprCap);
    this.cssW = rect.width;
    this.cssH = rect.height;
    this.canvas.width = Math.round(rect.width * this.dpr);
    this.canvas.height = Math.round(rect.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.lastFrame = 0;
    this.update();
    this.draw();
  }

  private px(xPct: number) {
    return (xPct / 100) * this.cssW;
  }
  private py(yPct: number) {
    return (yPct / 100) * this.cssH;
  }

  /* --------------------------- imperative API ---------------------------- */
  // Everything below is called from a scene's choreography. None of it triggers
  // a React render; mutations land on plain fields the loop reads.

  setRug(x: number, y: number, wPct = 30, hPct = 42) {
    this.rug = { x, y, wPct, hPct };
  }

  setLowPower(enabled: boolean) {
    this.frameMinMs = enabled ? 1000 / 30 : 0;
    this.dprCap = enabled ? 1 : 2;
    this.resize();
  }

  setFurniture(
    list: {
      kind: FurnitureKind;
      x: number;
      y: number;
      label?: string;
      scale?: number;
    }[],
  ) {
    this.furniture = list.map((f) => ({
      kind: f.kind,
      x: f.x,
      y: f.y,
      label: f.label,
      dispW: FURNITURE_W * (f.scale ?? 1),
      dispH: FURNITURE_H * (f.scale ?? 1),
    }));
  }

  /** Replace the clutter set. Existing items keep their fade state by id. */
  setItems(list: { id: string; kind: ItemKind; x: number; y: number }[]) {
    const prev = new Map(this.items.map((i) => [i.id, i]));
    this.items = list.map((it) => {
      const old = prev.get(it.id);
      return {
        ...it,
        alpha: old ? old.alpha : 1,
        removing: old ? old.removing : false,
      };
    });
  }

  /** Begin fading an item out (the pick-up beat). */
  setRemoving(id: string | null) {
    for (const it of this.items) {
      if (it.id === id && !it.removing) {
        it.removing = true;
      }
    }
  }

  /** Replace clutter piles (warehouse). */
  setPiles(
    list: {
      id: string;
      x: number;
      y: number;
      items: { sprite: ItemKind; tint?: string }[];
      count: number;
    }[],
  ) {
    this.piles = list.map((p) => ({ ...p, items: [...p.items] }));
  }

  /** Replace report-path lines (warehouse: Agent -> Manager -> Boss). */
  setPaths(list: PathModel[]) {
    this.paths = list.map((p) => ({ ...p }));
  }

  /* ------------------------------ actors --------------------------------- */

  private actor(id: string): ActorModel | undefined {
    return this.actors.get(id);
  }

  /** Replace the whole actor set (warehouse: Boss, Managers, Agents). */
  setActors(
    list: {
      id: string;
      kind?: ActorKind;
      x: number;
      y: number;
      label?: string;
      scale?: number;
      state?: ActorState;
      visible?: boolean;
    }[],
  ) {
    this.actors = new Map();
    for (const a of list) {
      const kind = a.kind ?? "worker";
      const model = this.makeActor(a.id, kind, kind === "hand" ? HAND_H : WORKER_H);
      model.move = staticTween(a.x, a.y);
      if (a.label !== undefined) model.label = a.label;
      if (a.scale !== undefined) model.scale = a.scale;
      if (a.state !== undefined) model.state = a.state;
      model.visible = a.visible ?? true;
      this.actors.set(a.id, model);
    }
  }

  /** Merge a partial update into one actor (per-frame agent movement etc.). */
  updateActor(
    id: string,
    partial: {
      x?: number;
      y?: number;
      state?: ActorState;
      carrying?: ItemKind | null;
      carryingTint?: string;
      thought?: string | null;
      label?: string;
      visible?: boolean;
      scale?: number;
    },
  ) {
    const a = this.actor(id);
    if (!a) return;
    if (partial.x !== undefined && partial.y !== undefined) {
      a.move = staticTween(partial.x, partial.y);
    }
    if (partial.state !== undefined) a.state = partial.state;
    if (partial.carrying !== undefined) {
      a.carrying = partial.carrying;
      a.carryingTint = partial.carryingTint;
    } else if (partial.carryingTint !== undefined) {
      a.carryingTint = partial.carryingTint;
    }
    if (partial.thought !== undefined) a.thought = partial.thought;
    if (partial.label !== undefined) a.label = partial.label;
    if (partial.visible !== undefined) a.visible = partial.visible;
    if (partial.scale !== undefined) a.scale = partial.scale;
  }

  clearActors() {
    this.actors = new Map();
  }

  setActorVisible(id: string, visible: boolean) {
    const a = this.actor(id);
    if (a) a.visible = visible;
  }

  setActorState(id: string, state: ActorState) {
    const a = this.actor(id);
    if (a) a.state = state;
  }

  setActorCarry(id: string, carrying: ItemKind | null, tint?: string) {
    const a = this.actor(id);
    if (a) {
      a.carrying = carrying;
      a.carryingTint = tint;
    }
  }

  setActorThought(id: string, thought: string | null) {
    const a = this.actor(id);
    if (a) a.thought = thought;
  }

  setActorLabel(id: string, label: string | null) {
    const a = this.actor(id);
    if (a) a.label = label;
  }

  /** Place an actor instantly (no tween). */
  placeActor(id: string, x: number, y: number) {
    const a = this.actor(id);
    if (a) a.move = staticTween(x, y);
  }

  /** Tween an actor toward a target over `dur` ms. */
  moveActor(id: string, x: number, y: number, dur: number) {
    const a = this.actor(id);
    if (!a) return;
    const now = this.now();
    a.move = {
      x: a.move.x,
      y: a.move.y,
      fromX: a.move.x,
      fromY: a.move.y,
      toX: x,
      toY: y,
      start: now,
      dur: Math.max(0, dur),
    };
  }

  poof(x: number, y: number, text = "done") {
    this.poofs.push({ x, y, text, start: this.now() });
  }

  dropItem(id: string, kind: ItemKind, x: number, y: number, tint?: string) {
    this.drops.push({
      id,
      kind,
      tint,
      x,
      y,
      startY: Math.max(4, y - 12),
      start: this.now(),
    });
  }

  /* ------------------------------- loop ---------------------------------- */

  start() {
    if (this.running) return;
    this.running = true;
    const frame = () => {
      if (!this.running) return;
      const now = this.now();
      if (this.frameMinMs > 0 && now - this.lastFrame < this.frameMinMs) {
        this.raf = requestAnimationFrame(frame);
        return;
      }
      this.lastFrame = now;
      this.update();
      this.draw();
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private now() {
    return typeof performance !== "undefined" ? performance.now() : 0;
  }

  private update() {
    const now = this.now();

    // Advance actor tweens.
    for (const a of this.actors.values()) {
      const m = a.move;
      if (m.dur <= 0) {
        m.x = m.toX;
        m.y = m.toY;
      } else {
        const t = Math.min(1, (now - m.start) / m.dur);
        const e = easeInOut(t);
        m.x = lerp(m.fromX, m.toX, e);
        m.y = lerp(m.fromY, m.toY, e);
      }
    }

    // Fade out removing items, then drop them once invisible.
    for (const it of this.items) {
      if (it.removing && it.alpha > 0) {
        it.alpha = Math.max(0, it.alpha - 16 / FADE_MS);
      }
    }

    // Expire finished poofs.
    this.poofs = this.poofs.filter((p) => now - p.start < POOF_MS);
    this.drops = this.drops.filter((d) => now - d.start < DROP_MS);
  }

  /* ------------------------------- draw ---------------------------------- */

  private draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.cssW, this.cssH);

    this.drawRug();
    this.drawPaths();

    // Build a single depth-sorted draw list so things lower on screen overlap
    // things above them (top-down depth). Baseline Y is the anchor (feet).
    type Drawable = { baseline: number; z: number; paint: () => void };
    const list: Drawable[] = [];

    for (const f of this.furniture) {
      list.push({ baseline: f.y, z: 0, paint: () => this.drawFurniture(f) });
    }

    for (const it of this.items) {
      if (it.alpha <= 0) continue;
      list.push({ baseline: it.y, z: 1, paint: () => this.drawItem(it) });
    }

    for (const p of this.piles) {
      if (p.count <= 0) continue;
      list.push({ baseline: p.y, z: 1, paint: () => this.drawPile(p) });
    }

    for (const d of this.drops) {
      const t = Math.min(1, (this.now() - d.start) / DROP_MS);
      const e = easeInOut(t);
      const y = lerp(d.startY, d.y, e);
      list.push({
        baseline: y,
        z: 1,
        paint: () => this.drawDroppedItem(d, y, t),
      });
    }

    for (const a of this.actors.values()) {
      if (!a.visible) continue;
      list.push({ baseline: a.move.y, z: 2, paint: () => this.drawActor(a) });
    }

    list.sort((p, q) => p.baseline - q.baseline || p.z - q.z);
    for (const d of list) d.paint();

    for (const p of this.poofs) this.drawPoof(p);
  }

  private drawImage(
    src: string,
    cx: number,
    cy: number,
    dispW: number,
    dispH: number,
    anchor: "center" | "bottom",
    alpha = 1,
  ) {
    const img = this.getImage(src);
    if (!img) return;
    const x = cx - dispW / 2;
    const y = anchor === "bottom" ? cy - dispH : cy - dispH / 2;
    const prev = this.ctx.globalAlpha;
    if (alpha !== 1) this.ctx.globalAlpha = alpha;
    this.ctx.drawImage(img, x, y, dispW, dispH);
    this.ctx.globalAlpha = prev;
  }

  private drawRug() {
    const r = this.rug;
    if (!r) return;
    const ctx = this.ctx;
    const w = this.px(r.wPct);
    const h = this.py(r.hPct);
    const x = this.px(r.x) - w / 2;
    const y = this.py(r.y) - h / 2;
    ctx.save();
    ctx.fillStyle = "#b3543f";
    this.roundRect(x, y, w, h, 6);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#8f3d2c";
    ctx.stroke();
    // diagonal weave
    ctx.save();
    this.roundRect(x, y, w, h, 6);
    ctx.clip();
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 6;
    for (let d = -h; d < w; d += 13) {
      ctx.beginPath();
      ctx.moveTo(x + d, y);
      ctx.lineTo(x + d + h, y + h);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  }

  private drawPaths() {
    if (!this.paths.length) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    for (const p of this.paths) {
      ctx.strokeStyle = p.active
        ? "rgba(16,185,129,0.85)"
        : "rgba(148,163,184,0.35)";
      ctx.beginPath();
      ctx.moveTo(this.px(p.x1), this.py(p.y1));
      ctx.lineTo(this.px(p.x2), this.py(p.y2));
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawFurniture(f: FurnitureModel) {
    const cx = this.px(f.x);
    const cy = this.py(f.y) + f.dispH / 2; // anchor sprite bottom near baseline
    this.drawImage(furnitureSprite(f.kind).src, cx, cy, f.dispW, f.dispH, "bottom");
    if (f.label) {
      this.drawLabel(f.label, cx, cy - 2);
    }
  }

  private drawItem(it: ItemModel) {
    this.drawImage(
      itemSprite(it.kind).src,
      this.px(it.x),
      this.py(it.y),
      ITEM_DISP,
      ITEM_DISP,
      "center",
      it.alpha,
    );
  }

  private drawPile(p: PileModel) {
    const cx = this.px(p.x);
    const cy = this.py(p.y);
    const shown = p.items.slice(0, PILE_OFFSETS.length);
    shown.forEach((it, i) => {
      const [ox, oy] = PILE_OFFSETS[i];
      this.drawImage(
        itemSprite(it.sprite, it.tint).src,
        cx + ox,
        cy + oy,
        PILE_ITEM,
        PILE_ITEM,
        "center",
      );
    });
    // ×count badge, upper-left of the heap
    const ctx = this.ctx;
    const text = `×${p.count}`;
    ctx.save();
    ctx.font = "700 9px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const w = ctx.measureText(text).width + 8;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    this.roundRect(cx - 12 - w / 2, cy - 19, w, 13, 6);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, cx - 12, cy - 12);
    ctx.restore();
  }

  private drawDroppedItem(d: DropModel, y: number, t: number) {
    const src = itemSprite(d.kind, d.tint).src;
    const px = this.px(d.x);
    const py = this.py(y);
    this.ctx.save();
    this.ctx.shadowColor = "rgba(0,0,0,0.35)";
    this.ctx.shadowBlur = 8;
    this.ctx.shadowOffsetY = 6;
    this.drawImage(src, px, py, ITEM_DISP, ITEM_DISP, "center", Math.min(1, 0.35 + t));
    this.ctx.restore();
  }

  private drawActor(a: ActorModel) {
    const sprite = actorSprite(a.kind);
    const aspect = sprite.w / sprite.h;
    const baseH = a.dispH * a.scale;
    const dispH = a.state === "working" ? baseH * 1.05 : baseH;
    const dispW = dispH * aspect;

    const cx = this.px(a.move.x);
    let cy = this.py(a.move.y);
    if (a.state === "walking") {
      cy += Math.sin(this.now() / 90) * 2; // gentle bob
    }

    // The manual hand descends on a faint cord from the top of the room.
    if (a.kind === "hand" && cy > 0) {
      const ctx = this.ctx;
      ctx.save();
      const grad = ctx.createLinearGradient(0, 0, 0, cy);
      grad.addColorStop(0, "rgba(15,23,42,0)");
      grad.addColorStop(1, "rgba(15,23,42,0.4)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, cy);
      ctx.stroke();
      ctx.restore();
    }

    // thought bubble above the head
    if (a.thought) {
      this.drawBubble(a.thought, cx, cy - dispH - 6);
    }

    this.drawImage(sprite.src, cx, cy, dispW, dispH, "center");

    // carried item badge, upper-right of the body
    if (a.carrying) {
      const bx = cx + dispW * 0.32;
      const by = cy - dispH * 0.3;
      this.ctx.save();
      this.ctx.fillStyle = "rgba(255,255,255,0.85)";
      this.ctx.beginPath();
      this.ctx.arc(bx, by, 13, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
      this.drawImage(
        itemSprite(a.carrying, a.carryingTint).src,
        bx,
        by,
        18,
        18,
        "center",
      );
    }

    if (a.label) {
      this.drawLabel(a.label, cx, cy + dispH / 2 + 12);
    }
  }

  private drawPoof(p: Poof) {
    const t = Math.min(1, (this.now() - p.start) / POOF_MS);
    const ctx = this.ctx;
    const cx = this.px(p.x);
    const cy = this.py(p.y) - t * 18;
    ctx.save();
    ctx.globalAlpha = 1 - t;
    ctx.font = "700 13px ui-sans-serif, system-ui, sans-serif";
    const w = ctx.measureText(p.text).width + 16;
    ctx.fillStyle = "#10b981";
    this.roundRect(cx - w / 2, cy - 11, w, 22, 11);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(p.text, cx, cy + 1);
    ctx.restore();
  }

  /* ----------------------------- text helpers ---------------------------- */

  private drawLabel(text: string, cx: number, topY: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = "600 10px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const w = ctx.measureText(text).width + 10;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    this.roundRect(cx - w / 2, topY, w, 15, 3);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, cx, topY + 3);
    ctx.restore();
  }

  private drawBubble(text: string, cx: number, bottomY: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = "600 11px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const w = Math.min(140, ctx.measureText(text).width + 16);
    const h = 22;
    const x = cx - w / 2;
    const y = bottomY - h;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    this.roundRect(x, y, w, h, 6);
    ctx.fill();
    ctx.stroke();
    // little tail
    ctx.beginPath();
    ctx.moveTo(cx - 4, y + h);
    ctx.lineTo(cx + 4, y + h);
    ctx.lineTo(cx, y + h + 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#475569";
    ctx.fillText(text, cx, y + h / 2);
    ctx.restore();
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number) {
    const ctx = this.ctx;
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }
}
