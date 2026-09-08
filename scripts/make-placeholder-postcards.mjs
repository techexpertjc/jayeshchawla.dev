/**
 * Generates obvious placeholder postcards so the board renders before any real
 * photographs exist. Delete this script once yours are in.
 *
 *   node scripts/make-placeholder-postcards.mjs
 */

import sharp from "sharp";
import { mkdirSync, readdirSync, statSync } from "node:fs";

const OUT = "public/postcards";
mkdirSync(OUT, { recursive: true });

const cards = [
  { bg: "#5fbf9f", n: 1 },
  { bg: "#8fd3f4", n: 2 },
  { bg: "#ff9ec4", n: 3 },
];

const ink = "#14161f";

for (const { bg, n } of cards) {
  const svg = `<svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="800" fill="${bg}"/>
    <rect x="40" y="40" width="1120" height="720" fill="none" stroke="${ink}"
          stroke-width="8" stroke-dasharray="24 18"/>
    <text x="600" y="380" font-family="sans-serif" font-size="88" font-weight="bold"
          fill="${ink}" text-anchor="middle">ADD PHOTO</text>
    <text x="600" y="470" font-family="sans-serif" font-size="44"
          fill="${ink}" text-anchor="middle" opacity="0.75">placeholder ${n}</text>
  </svg>`;

  await sharp(Buffer.from(svg)).webp({ quality: 80 }).toFile(`${OUT}/placeholder-${n}.webp`);
}

for (const file of readdirSync(OUT)) {
  console.log(file, Math.round(statSync(`${OUT}/${file}`).size / 1024) + " KB");
}
