/**
 * Turns a folder of camera/phone photos into web-sized postcards.
 *
 *   node scripts/optimize-photos.mjs <input-folder> [output-folder]
 *
 * A modern phone photo is 3-8 MB and 4000px wide. On the postcard board each
 * one occupies about a hundred pixels of screen, and in the gallery a few
 * hundred — so they are resized to 1200px on the long edge and re-encoded as
 * WebP, which typically lands each one under 150 KB.
 *
 * Output filenames are slugged from the input, so `Kyoto Trip 2023.JPG`
 * becomes `kyoto-trip-2023.webp` and can be pasted straight into
 * content/postcards.ts.
 */

import sharp from "sharp";
import { readdir, mkdir } from "node:fs/promises";
import { statSync } from "node:fs";
import { extname, basename, join } from "node:path";

const input = process.argv[2];
const output = process.argv[3] ?? "public/postcards";

if (!input) {
  console.error("usage: node scripts/optimize-photos.mjs <input-folder> [output-folder]");
  process.exit(1);
}

const PHOTO = /\.(jpe?g|png|heic|webp|tiff?)$/i;
const slug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

await mkdir(output, { recursive: true });

const files = (await readdir(input)).filter((f) => PHOTO.test(extname(f)));

if (!files.length) {
  console.log(`no photos found in ${input}`);
  process.exit(0);
}

const kb = (n) => Math.round(n / 1024) + " KB";
let before = 0;
let after = 0;

for (const file of files) {
  const from = join(input, file);
  const name = slug(basename(file, extname(file))) + ".webp";
  const to = join(output, name);

  await sharp(from)
    .rotate() // honour EXIF orientation, or half your holiday is sideways
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(to);

  const inSize = statSync(from).size;
  const outSize = statSync(to).size;
  before += inSize;
  after += outSize;

  console.log(`${file}  ${kb(inSize)}  ->  ${name}  ${kb(outSize)}`);
}

console.log(`\n${files.length} photos: ${kb(before)} -> ${kb(after)}`);
console.log(`\nNow list them in content/postcards.ts as "/postcards/<name>.webp".`);
