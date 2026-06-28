import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const spriteDir = join(process.cwd(), "public", "assets", "sprites");
const manifestPath = join(spriteDir, "sprites.manifest.json");

const itemKinds = [
  "trash",
  "cup",
  "can",
  "book",
  "sock",
  "toy",
  "plate",
  "fork",
  "shirt",
  "towel",
];

const furnitureKinds = [
  "trashcan",
  "sink",
  "recycling",
  "bookshelf",
  "hamper",
  "toybox",
  "washer",
  "stove",
  "bed",
  "toilet",
  "cupboard",
  "dresser",
  "couch",
  "basket",
];

const bookTints = ["c0413b", "2f6db0", "3b8f4e", "d99a2a"];

describe("sprite assets", () => {
  it("has committed canvas assets for every runtime sprite kind", () => {
    assert.equal(existsSync(manifestPath), true, "missing sprites.manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

    for (const item of itemKinds) {
      const entry = manifest.items?.[item];
      assert.ok(entry?.src, `missing item manifest entry for ${item}`);
      assert.equal(existsSync(join(process.cwd(), "public", entry.src)), true, `missing ${entry.src}`);
    }

    for (const furniture of furnitureKinds) {
      const entry = manifest.furniture?.[furniture];
      assert.ok(entry?.src, `missing furniture manifest entry for ${furniture}`);
      assert.equal(existsSync(join(process.cwd(), "public", entry.src)), true, `missing ${entry.src}`);
    }

    for (const actor of ["worker", "hand"]) {
      const entry = manifest.actors?.[actor];
      assert.ok(entry?.src, `missing actor manifest entry for ${actor}`);
      assert.equal(existsSync(join(process.cwd(), "public", entry.src)), true, `missing ${entry.src}`);
    }
  });

  it("keeps pre-baked book color variants for sorted canvas books", () => {
    for (const tint of bookTints) {
      assert.equal(
        existsSync(join(spriteDir, `item-book-${tint}.png`)),
        true,
        `missing book tint ${tint}`,
      );
    }
  });
});
