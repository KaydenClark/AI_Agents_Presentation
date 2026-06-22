// Asset conversion pipeline: rasterize the RoomSprites SVG definitions into
// transparent PNGs for the canvas renderer.
//
//   node scripts/rasterize-sprites.mjs
//
// Source of truth is still components/RoomSprites.tsx (the SVG paths below are
// ported verbatim, with the WOOD/METAL/default-tint constants inlined). Re-run
// this whenever those vector definitions change. Output lands in
// public/assets/sprites/ and is described by sprites.manifest.json so the
// runtime never has to guess intrinsic sizes.
//
// Standard scales: clutter items 64x64, furniture 128x128 (aspect-preserved,
// padded), actors at 2x their viewBox.

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "assets", "sprites");

const WOOD = "#2f271d";
const METAL = "#3b4045";

// Book cover colors the Office sorts onto shelves. Kept in sync with
// BOOK_COLORS in WarehouseScene.tsx; each becomes its own PNG so the canvas
// can show sorted-by-color books without runtime recoloring.
const BOOK_TINTS = ["#c0413b", "#2f6db0", "#3b8f4e", "#d99a2a"];

const bookSvg = (cover) => `
    <ellipse cx="16" cy="25" rx="11" ry="3" fill="rgba(0,0,0,0.18)"/>
    <rect x="7" y="9" width="18" height="14" rx="1.5" fill="${cover}" stroke="${WOOD}" stroke-width="1.6"/>
    <rect x="7" y="9" width="4" height="14" fill="rgba(0,0,0,0.22)"/>
    <rect x="12" y="12" width="10" height="1.6" fill="rgba(255,255,255,0.6)"/>
    <rect x="12" y="15.5" width="8" height="1.4" fill="rgba(255,255,255,0.45)"/>`;

/* --------------------------- item sprites (32x32) -------------------------- */

const ITEMS = {
  trash: `
    <ellipse cx="16" cy="26" rx="11" ry="3" fill="rgba(0,0,0,0.18)"/>
    <path d="M7 20 L10 11 L17 8 L24 13 L23 21 L15 25 Z" fill="#e7e3da" stroke="${WOOD}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M11 13 L16 16 M19 11 L20 18 M13 20 L21 17" stroke="#b8b2a4" stroke-width="1.3" fill="none" stroke-linecap="round"/>`,
  cup: `
    <ellipse cx="15" cy="25" rx="11" ry="3" fill="rgba(0,0,0,0.18)"/>
    <path d="M24 13 a5 5 0 0 1 0 8" fill="none" stroke="#cfd3d6" stroke-width="3"/>
    <circle cx="15" cy="17" r="10" fill="#eef1f3" stroke="${METAL}" stroke-width="1.6"/>
    <circle cx="15" cy="17" r="6" fill="#6b4a2e"/>
    <ellipse cx="13" cy="15" rx="2.4" ry="1.4" fill="rgba(255,255,255,0.5)"/>`,
  can: `
    <ellipse cx="16" cy="26" rx="10" ry="3" fill="rgba(0,0,0,0.18)"/>
    <circle cx="16" cy="16" r="10" fill="#c9cdd1" stroke="${METAL}" stroke-width="1.6"/>
    <circle cx="16" cy="16" r="7.5" fill="#d23b3b" stroke="#8f2525" stroke-width="1"/>
    <ellipse cx="16" cy="16" rx="4" ry="2.4" fill="#9a9ea2"/>
    <circle cx="16" cy="16" r="1.4" fill="#5d6166"/>`,
  book: bookSvg("#2f6db0"),
  sock: `
    <ellipse cx="16" cy="26" rx="10" ry="3" fill="rgba(0,0,0,0.18)"/>
    <path d="M12 6 L19 6 L19 16 L24 21 a4 4 0 0 1 -6 5 L10 18 a3 3 0 0 1 -1 -2 L9 8 a2 2 0 0 1 3 -2 Z" fill="#f1f0ec" stroke="${WOOD}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M9 9 L19 9 M9 12 L19 12" stroke="#d24b6e" stroke-width="1.6"/>`,
  toy: `
    <ellipse cx="16" cy="26" rx="10" ry="3" fill="rgba(0,0,0,0.18)"/>
    <circle cx="16" cy="15" r="10" fill="#f4c02f" stroke="${WOOD}" stroke-width="1.6"/>
    <path d="M16 5 a10 10 0 0 1 8.6 5 L7.4 10 A10 10 0 0 1 16 5" fill="#e0463c"/>
    <path d="M6.4 18 a10 10 0 0 0 19.2 0 Z" fill="#2f8fd0" opacity="0.85"/>
    <circle cx="12" cy="12" r="2" fill="rgba(255,255,255,0.6)"/>`,
  plate: `
    <ellipse cx="16" cy="25" rx="11" ry="3" fill="rgba(0,0,0,0.18)"/>
    <circle cx="16" cy="16" r="11" fill="#eef1f3" stroke="${METAL}" stroke-width="1.6"/>
    <circle cx="16" cy="16" r="7" fill="#dde3e8" stroke="#c4ccd2" stroke-width="1"/>
    <circle cx="16" cy="16" r="3.2" fill="#cdd5db"/>
    <ellipse cx="12.5" cy="12.5" rx="2.2" ry="1.3" fill="rgba(255,255,255,0.6)"/>`,
  fork: `
    <ellipse cx="16" cy="27" rx="7" ry="2.4" fill="rgba(0,0,0,0.18)"/>
    <path d="M11 5 v7 M14 5 v7 M18 5 v7 M21 5 v7" stroke="#aeb6bd" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M11 12 q0 4 5 4 q5 0 5 -4 Z" fill="#cfd4d8" stroke="${METAL}" stroke-width="1.2" stroke-linejoin="round"/>
    <rect x="14.2" y="15" width="3.6" height="12" rx="1.8" fill="#cfd4d8" stroke="${METAL}" stroke-width="1.2"/>`,
  shirt: `
    <ellipse cx="16" cy="27" rx="11" ry="2.6" fill="rgba(0,0,0,0.18)"/>
    <path d="M12 6 L8 8 L4 14 L8.5 17 L10 15.5 L10 26 L22 26 L22 15.5 L23.5 17 L28 14 L24 8 L20 6 Q16 10.5 12 6 Z" fill="#4a90c2" stroke="${WOOD}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M12 6 Q16 10.5 20 6" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.2"/>`,
  towel: `
    <ellipse cx="16" cy="26" rx="11" ry="2.6" fill="rgba(0,0,0,0.18)"/>
    <rect x="7" y="8" width="18" height="16" rx="2" fill="#7ec8b1" stroke="${WOOD}" stroke-width="1.5"/>
    <rect x="7" y="8" width="18" height="4" rx="2" fill="rgba(0,0,0,0.14)"/>
    <path d="M10 16 h12 M10 19 h12" stroke="rgba(255,255,255,0.65)" stroke-width="1"/>`,
};

/* ------------------------- furniture sprites (60x64) ----------------------- */

// Bookshelf books are generated in a loop in the source; mirror that here.
const shelfBooks = (rows) =>
  rows
    .map(([baseline, books]) =>
      books
        .map(
          ([c, x, h]) =>
            `<rect x="${x}" y="${baseline - h}" width="3.4" height="${h}" fill="${c}" stroke="rgba(0,0,0,0.25)" stroke-width="0.6"/>`,
        )
        .join(""),
    )
    .join("");

const FURNITURE = {
  trashcan: `
    <ellipse cx="30" cy="54" rx="20" ry="5" fill="rgba(0,0,0,0.20)"/>
    <path d="M16 22 L20 50 L40 50 L44 22 Z" fill="#9aa1a8" stroke="${METAL}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M22 24 L25 49 M30 24 L30 49 M38 24 L35 49" stroke="rgba(0,0,0,0.18)" stroke-width="1.5"/>
    <ellipse cx="30" cy="22" rx="15" ry="6" fill="#b9c0c6" stroke="${METAL}" stroke-width="2"/>
    <ellipse cx="30" cy="22" rx="10" ry="3.6" fill="#33383d"/>
    <path d="M24 19 L27 13 L31 18 L34 12 L37 19" fill="none" stroke="#cfcabf" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  sink: `
    <ellipse cx="30" cy="54" rx="24" ry="5" fill="rgba(0,0,0,0.18)"/>
    <rect x="6" y="20" width="48" height="32" rx="4" fill="#cfd4d8" stroke="${METAL}" stroke-width="2"/>
    <rect x="6" y="20" width="48" height="6" rx="3" fill="#e4e8ea"/>
    <rect x="14" y="28" width="32" height="20" rx="4" fill="#8b9298" stroke="${METAL}" stroke-width="1.6"/>
    <rect x="18" y="31" width="24" height="14" rx="3" fill="#6f767c"/>
    <circle cx="30" cy="38" r="2.4" fill="#3f454a"/>
    <rect x="27" y="14" width="6" height="9" rx="2" fill="#b0b6bb" stroke="${METAL}" stroke-width="1.4"/>
    <path d="M30 14 q0 -4 6 -4" fill="none" stroke="#b0b6bb" stroke-width="3" stroke-linecap="round"/>`,
  recycling: `
    <ellipse cx="30" cy="54" rx="20" ry="5" fill="rgba(0,0,0,0.20)"/>
    <path d="M16 24 L19 50 L41 50 L44 24 Z" fill="#3f9d52" stroke="#1f5d2f" stroke-width="2" stroke-linejoin="round"/>
    <path d="M23 26 L25 49 M30 26 L30 49 M37 26 L35 49" stroke="rgba(0,0,0,0.16)" stroke-width="1.4"/>
    <ellipse cx="30" cy="24" rx="15" ry="6" fill="#4cb061" stroke="#1f5d2f" stroke-width="2"/>
    <path d="M30 31 L34 38 L26 38 Z M24 41 L31 41 L27.5 47 Z M36 41 L29 41 L32.5 47 Z" fill="none" stroke="#eafaef" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`,
  bookshelf: `
    <ellipse cx="30" cy="56" rx="24" ry="4.5" fill="rgba(0,0,0,0.18)"/>
    <rect x="7" y="12" width="46" height="42" rx="3" fill="#6e4a2b" stroke="${WOOD}" stroke-width="2"/>
    <rect x="11" y="16" width="38" height="15" fill="#855a36"/>
    <rect x="11" y="34" width="38" height="15" fill="#855a36"/>
    ${shelfBooks([
      [
        31,
        [
          ["#c0413b", 12, 17],
          ["#2f6db0", 16, 16],
          ["#3b8f4e", 20, 18],
          ["#d99a2a", 24, 15],
          ["#7d4ab0", 28, 17],
          ["#c0413b", 33, 16],
          ["#2f6db0", 37, 18],
          ["#3b8f4e", 41, 15],
        ],
      ],
      [
        49,
        [
          ["#d99a2a", 12, 16],
          ["#7d4ab0", 16, 18],
          ["#c0413b", 20, 15],
          ["#3b8f4e", 24, 17],
          ["#2f6db0", 28, 16],
          ["#d99a2a", 33, 18],
          ["#c0413b", 37, 15],
          ["#7d4ab0", 41, 17],
        ],
      ],
    ])}`,
  hamper: `
    <ellipse cx="30" cy="55" rx="20" ry="5" fill="rgba(0,0,0,0.18)"/>
    <path d="M16 24 L19 50 L41 50 L44 24 Z" fill="#cfa76b" stroke="#7c5a2e" stroke-width="2" stroke-linejoin="round"/>
    <path d="M19 30 L41 30 M19.5 38 L40.5 38 M20 46 L40 46" stroke="#9c7740" stroke-width="1.6"/>
    <path d="M24 24 L26 50 M30 24 L30 50 M36 24 L34 50" stroke="rgba(124,90,46,0.5)" stroke-width="1.4"/>
    <ellipse cx="30" cy="24" rx="15" ry="6" fill="#dcb87f" stroke="#7c5a2e" stroke-width="2"/>
    <path d="M22 23 q4 -8 9 -3 q4 -6 8 1" fill="#eef0f2" stroke="#b9c0c6" stroke-width="1.2"/>`,
  toybox: `
    <ellipse cx="30" cy="55" rx="22" ry="5" fill="rgba(0,0,0,0.18)"/>
    <path d="M14 16 L46 16 L44 22 L16 22 Z" fill="#8a5f38" stroke="#3f2a16" stroke-width="2" stroke-linejoin="round"/>
    <rect x="14" y="26" width="32" height="24" rx="3" fill="#7a5230" stroke="#3f2a16" stroke-width="2"/>
    <rect x="14" y="26" width="32" height="6" fill="#8a5f38"/>
    <circle cx="22" cy="24" r="4" fill="#e0463c" stroke="#3f2a16" stroke-width="1.2"/>
    <rect x="28" y="20" width="7" height="7" rx="1" fill="#3b8f4e" stroke="#3f2a16" stroke-width="1.2"/>
    <path d="M40 25 l2.5 -6 l2.5 6 z" fill="#f4c02f" stroke="#3f2a16" stroke-width="1.2"/>
    <circle cx="18" cy="44" r="2" fill="#caa45f"/>
    <circle cx="42" cy="44" r="2" fill="#caa45f"/>`,
  washer: `
    <ellipse cx="30" cy="56" rx="20" ry="4.5" fill="rgba(0,0,0,0.18)"/>
    <rect x="12" y="16" width="36" height="38" rx="4" fill="#dfe3e6" stroke="${METAL}" stroke-width="2"/>
    <rect x="12" y="16" width="36" height="9" rx="3" fill="#eef1f3"/>
    <rect x="16" y="19" width="11" height="3" rx="1.5" fill="#9aa1a8"/>
    <circle cx="42" cy="20.5" r="2" fill="#5dcaa5"/>
    <circle cx="30" cy="39" r="11" fill="#aeb6bd" stroke="${METAL}" stroke-width="2"/>
    <circle cx="30" cy="39" r="7" fill="#7f878d"/>
    <ellipse cx="27" cy="36" rx="2.6" ry="1.6" fill="rgba(255,255,255,0.55)"/>`,
  stove: `
    <ellipse cx="30" cy="54" rx="23" ry="4.5" fill="rgba(0,0,0,0.18)"/>
    <rect x="8" y="15" width="44" height="39" rx="4" fill="#c9ced2" stroke="${METAL}" stroke-width="2"/>
    <rect x="8" y="15" width="44" height="9" rx="3" fill="#b3b9be"/>
    <circle cx="15" cy="19.5" r="1.6" fill="#e0463c"/>
    <circle cx="22" cy="19.5" r="1.6" fill="#e0463c"/>
    ${[
      [20, 36],
      [40, 36],
      [20, 47],
      [40, 47],
    ]
      .map(
        ([cx, cy]) =>
          `<circle cx="${cx}" cy="${cy}" r="6" fill="#5f656b" stroke="${METAL}" stroke-width="1.4"/>`,
      )
      .join("")}`,
  bed: `
    <ellipse cx="30" cy="58" rx="24" ry="4" fill="rgba(0,0,0,0.18)"/>
    <rect x="8" y="10" width="44" height="46" rx="4" fill="#6e4a2b" stroke="${WOOD}" stroke-width="2"/>
    <rect x="11" y="20" width="38" height="33" rx="3" fill="#8fb7d6" stroke="#4a6f8c" stroke-width="1.6"/>
    <rect x="11" y="13" width="38" height="9" rx="3" fill="#f1f0ec" stroke="#c9c6bd" stroke-width="1.4"/>
    <path d="M11 31 L49 31" stroke="#4a6f8c" stroke-width="1.2" opacity="0.6"/>`,
  toilet: `
    <ellipse cx="30" cy="54" rx="15" ry="4" fill="rgba(0,0,0,0.18)"/>
    <rect x="20" y="13" width="20" height="12" rx="2" fill="#e8ecee" stroke="${METAL}" stroke-width="2"/>
    <ellipse cx="30" cy="38" rx="13" ry="15" fill="#f1f4f5" stroke="${METAL}" stroke-width="2"/>
    <ellipse cx="30" cy="38" rx="8" ry="10" fill="#c7ced2"/>`,
  cupboard: `
    <ellipse cx="30" cy="56" rx="22" ry="4" fill="rgba(0,0,0,0.18)"/>
    <rect x="9" y="12" width="42" height="42" rx="3" fill="#8a5f38" stroke="#3f2a16" stroke-width="2"/>
    <rect x="14" y="16" width="13" height="34" rx="2" fill="#9c6f44"/>
    <rect x="33" y="16" width="13" height="34" rx="2" fill="#9c6f44"/>
    <line x1="30" y1="14" x2="30" y2="52" stroke="#3f2a16" stroke-width="1.6"/>
    <circle cx="27" cy="34" r="1.6" fill="#3f2a16"/>
    <circle cx="33" cy="34" r="1.6" fill="#3f2a16"/>`,
  dresser: `
    <ellipse cx="30" cy="56" rx="22" ry="4" fill="rgba(0,0,0,0.18)"/>
    <rect x="10" y="16" width="40" height="38" rx="3" fill="#7a5230" stroke="#3f2a16" stroke-width="2"/>
    ${[19, 30, 41]
      .map(
        (y) =>
          `<rect x="13" y="${y}" width="34" height="9" rx="2" fill="#9c6f44"/>` +
          `<circle cx="27" cy="${y + 4.5}" r="1.5" fill="#3f2a16"/>` +
          `<circle cx="33" cy="${y + 4.5}" r="1.5" fill="#3f2a16"/>`,
      )
      .join("")}`,
  couch: `
    <ellipse cx="30" cy="52" rx="24" ry="4" fill="rgba(0,0,0,0.18)"/>
    <rect x="8" y="20" width="44" height="26" rx="5" fill="#b3543f" stroke="#7c3a2a" stroke-width="2"/>
    <rect x="8" y="13" width="44" height="13" rx="5" fill="#c4634d" stroke="#7c3a2a" stroke-width="2"/>
    <rect x="8" y="20" width="9" height="22" rx="4" fill="#a84a37"/>
    <rect x="43" y="20" width="9" height="22" rx="4" fill="#a84a37"/>
    <rect x="19" y="26" width="10" height="14" rx="3" fill="#c4634d"/>
    <rect x="31" y="26" width="10" height="14" rx="3" fill="#c4634d"/>`,
  basket: `
    <ellipse cx="30" cy="52" rx="19" ry="4.5" fill="rgba(0,0,0,0.18)"/>
    <path d="M15 28 L19 50 L41 50 L45 28 Z" fill="#d8b277" stroke="#7c5a2e" stroke-width="2" stroke-linejoin="round"/>
    <path d="M18 34 L42 34 M18.5 41 L41.5 41 M19 47 L41 47" stroke="#9c7740" stroke-width="1.5"/>
    <path d="M23 28 L25 50 M30 28 L30 50 M37 28 L35 50" stroke="rgba(124,90,46,0.45)" stroke-width="1.3"/>
    <ellipse cx="30" cy="28" rx="15" ry="5" fill="#e7cb9a" stroke="#7c5a2e" stroke-width="2"/>
    <ellipse cx="30" cy="28" rx="10" ry="3" fill="#b98f52"/>`,
};

/* ----------------------------- actor sprites ------------------------------ */

const ACTORS = {
  worker: {
    viewBox: "0 0 40 46",
    body: `
      <ellipse cx="20" cy="40" rx="13" ry="4" fill="rgba(0,0,0,0.22)"/>
      <path d="M8 34 q0 -13 12 -13 q12 0 12 13 q-12 5 -24 0 Z" fill="#2f7d6b" stroke="#1c2620" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="9" cy="30" r="3.4" fill="#e6b48c" stroke="#1c2620" stroke-width="1.4"/>
      <circle cx="31" cy="30" r="3.4" fill="#e6b48c" stroke="#1c2620" stroke-width="1.4"/>
      <circle cx="20" cy="18" r="10" fill="#e6b48c" stroke="#1c2620" stroke-width="2"/>
      <path d="M10 18 a10 10 0 0 1 20 0 q-10 -5 -20 0 Z" fill="#433423" stroke="#1c2620" stroke-width="1.5"/>`,
    width: 80,
    height: 92,
  },
  hand: {
    viewBox: "0 0 34 40",
    body: `
      <path d="M11 4 v14 M16 3 v15 M21 4 v14 M26 7 v11 M11 16 q-5 1 -3 8 l3 9 q2 4 7 4 l4 0 q6 0 8 -7 l1 -10 q0 -4 -4 -4" fill="#f0c79e" stroke="#5b3f27" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`,
    width: 68,
    height: 80,
  },
};

/* --------------------------------- runner --------------------------------- */

const wrap = (viewBox, inner, width, height) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">${inner}</svg>`;

async function render(svg, file, { width, height, fit = "fill" }) {
  let img = sharp(Buffer.from(svg), { density: 384 });
  img = img.resize(width, height, {
    fit,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });
  await img.png().toFile(join(OUT_DIR, file));
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const manifest = { items: {}, itemVariants: { book: {} }, furniture: {}, actors: {} };

  // Clutter: 32x32 viewBox -> 64x64 PNG.
  for (const [key, inner] of Object.entries(ITEMS)) {
    const file = `item-${key}.png`;
    await render(wrap("0 0 32 32", inner, 64, 64), file, {
      width: 64,
      height: 64,
    });
    manifest.items[key] = { src: `/assets/sprites/${file}`, w: 64, h: 64 };
  }

  // Book color variants -> sorted-by-color shelves in the Office.
  for (const tint of BOOK_TINTS) {
    const slug = tint.replace("#", "");
    const file = `item-book-${slug}.png`;
    await render(wrap("0 0 32 32", bookSvg(tint), 64, 64), file, {
      width: 64,
      height: 64,
    });
    manifest.itemVariants.book[tint] = {
      src: `/assets/sprites/${file}`,
      w: 64,
      h: 64,
    };
  }

  // Furniture: 60x64 viewBox -> rendered at true 2x (120x128), padded to
  // 128x128 so every furniture sprite shares one box. Anchor is center-bottom.
  for (const [key, inner] of Object.entries(FURNITURE)) {
    const file = `furniture-${key}.png`;
    await render(wrap("0 0 60 64", inner, 120, 128), file, {
      width: 128,
      height: 128,
      fit: "contain",
    });
    manifest.furniture[key] = { src: `/assets/sprites/${file}`, w: 128, h: 128 };
  }

  // Actors at 2x their viewBox.
  for (const [key, { viewBox, body, width, height }] of Object.entries(ACTORS)) {
    const file = `actor-${key}.png`;
    await render(wrap(viewBox, body, width, height), file, { width, height });
    manifest.actors[key] = { src: `/assets/sprites/${file}`, w: width, h: height };
  }

  await writeFile(
    join(OUT_DIR, "sprites.manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );

  const count =
    Object.keys(manifest.items).length +
    Object.keys(manifest.itemVariants.book).length +
    Object.keys(manifest.furniture).length +
    Object.keys(manifest.actors).length;
  console.log(`Rasterized ${count} sprites to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
