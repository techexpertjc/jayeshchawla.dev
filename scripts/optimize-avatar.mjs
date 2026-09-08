/**
 * Turns a VRoid Studio .vrm export into a web-sized .glb.
 *
 *   node scripts/optimize-avatar.mjs <input.vrm> [output.glb]
 *
 * A default VRoid export is roughly 11 MB, and about half of that is facial
 * blendshapes this site never uses — the dialogue portraits are emoji, not
 * rendered close-ups. The rest is oversized PNG textures, including a
 * multi-megabyte thumbnail that only exists for VRoid Hub's gallery.
 *
 * What this does, in order of how much it saves:
 *
 *   1. Strips every morph target (facial expressions and visemes).
 *   2. Resizes textures to 1024 and re-encodes them as WebP.
 *   3. Prunes anything left unreferenced — which includes the thumbnail,
 *      since nothing in core glTF points at it.
 *   4. Dedups identical accessors and textures.
 *
 * The VRM extension itself is deliberately not preserved. We do not need it:
 * VRoid names its bones consistently (`J_Bip_C_Hips`, `J_Bip_L_UpperArm`…),
 * so animation retargeting can map them by name without pulling in a VRM
 * runtime. Dropping it keeps the browser bundle smaller.
 */

import { NodeIO } from "@gltf-transform/core";
import { dedup, prune, textureCompress } from "@gltf-transform/functions";
import sharp from "sharp";
import { statSync } from "node:fs";

const input = process.argv[2];
const output = process.argv[3] ?? "public/models/avatar.glb";

if (!input) {
  console.error("usage: node scripts/optimize-avatar.mjs <input.vrm> [output.glb]");
  process.exit(1);
}

const mb = (bytes) => (bytes / 1048576).toFixed(2) + " MB";

const io = new NodeIO();
const document = await io.read(input);
const root = document.getRoot();

/* ---- 1. strip morph targets ---- */
let removed = 0;
for (const mesh of root.listMeshes()) {
  for (const primitive of mesh.listPrimitives()) {
    for (const target of primitive.listTargets()) {
      primitive.removeTarget(target);
      target.dispose();
      removed++;
    }
  }
  mesh.setWeights([]);
}
console.log(`stripped ${removed} morph targets`);

/* ---- report the skeleton, which retargeting depends on ---- */
const skins = root.listSkins();
console.log(
  `skins: ${skins.length}, joints: ${skins.map((s) => s.listJoints().length).join(", ")}`,
);

const sample = skins[0]
  ?.listJoints()
  .slice(0, 6)
  .map((j) => j.getName());
if (sample) console.log("bone names look like:", sample.join(", "));

/* ---- 2-4. textures, prune, dedup ---- */
await document.transform(
  textureCompress({ encoder: sharp, targetFormat: "webp", resize: [1024, 1024] }),
  prune(),
  dedup(),
);

await io.write(output, document);

console.log(`\n${input}  ${mb(statSync(input).size)}`);
console.log(`${output}  ${mb(statSync(output).size)}`);
