import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { __smallTeamPathingForTest } from "../components/SmallTeamScene.tsx";
import { __warehousePathingForTest } from "../components/WarehouseScene.tsx";

type Point = { x: number; y: number };
type Wall =
  | {
      type: "vertical";
      name: string;
      x: number;
      y1: number;
      y2: number;
      gap?: { y1: number; y2: number };
    }
  | {
      type: "horizontal";
      name: string;
      y: number;
      x1: number;
      x2: number;
      gap?: { x1: number; x2: number };
    };

const EPS = 0.0001;

function between(value: number, a: number, b: number) {
  return value >= Math.min(a, b) - EPS && value <= Math.max(a, b) + EPS;
}

function crossing(
  a: Point,
  b: Point,
  wall: Wall,
): { x: number; y: number; wall: string } | null {
  if (wall.type === "vertical") {
    if (Math.abs(a.x - b.x) < EPS) return null;
    if (!between(wall.x, a.x, b.x)) return null;
    const t = (wall.x - a.x) / (b.x - a.x);
    if (t < -EPS || t > 1 + EPS) return null;
    const y = a.y + (b.y - a.y) * t;
    if (!between(y, wall.y1, wall.y2)) return null;
    if (wall.gap && between(y, wall.gap.y1, wall.gap.y2)) return null;
    return { x: wall.x, y, wall: wall.name };
  }

  if (Math.abs(a.y - b.y) < EPS) return null;
  if (!between(wall.y, a.y, b.y)) return null;
  const t = (wall.y - a.y) / (b.y - a.y);
  if (t < -EPS || t > 1 + EPS) return null;
  const x = a.x + (b.x - a.x) * t;
  if (!between(x, wall.x1, wall.x2)) return null;
  if (wall.gap && between(x, wall.gap.x1, wall.gap.x2)) return null;
  return { x, y: wall.y, wall: wall.name };
}

function assertRoutesAvoidWalls(
  routes: { name: string; points: Point[] }[],
  walls: Wall[],
) {
  const failures: string[] = [];

  for (const route of routes) {
    for (let i = 1; i < route.points.length; i++) {
      const from = route.points[i - 1];
      const to = route.points[i];
      for (const wall of walls) {
        const hit = crossing(from, to, wall);
        if (hit) {
          failures.push(
            `${route.name}: (${from.x},${from.y}) -> (${to.x},${to.y}) crosses ${hit.wall} at (${hit.x.toFixed(2)},${hit.y.toFixed(2)})`,
          );
        }
      }
    }
  }

  assert.deepEqual(failures, []);
}

describe("agent pathing", () => {
  it("routes the small-team agents through the shared doorway", () => {
    const fixture = __smallTeamPathingForTest();

    assertRoutesAvoidWalls(fixture.routes, fixture.walls);
  });

  it("routes swarm agents through room doors and the outside opening", () => {
    const fixture = __warehousePathingForTest();

    assertRoutesAvoidWalls(fixture.routes, fixture.walls);
  });
});
