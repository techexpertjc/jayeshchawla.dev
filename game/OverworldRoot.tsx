"use client";

import { useGLTF, useTexture } from "@react-three/drei";
import { World } from "@/game/World";
import { Overworld } from "@/game/scenes/Overworld";
import { character } from "@/game/player/character";
import { postcards } from "@/content/postcards";

/**
 * The 3D entry point for /play.
 *
 * Everything three.js is imported statically here; this whole module is the
 * single chunk the route code-splits. See the note in LookDevRoot.tsx for why
 * scene components must never be `next/dynamic`-imported individually.
 */
export function OverworldRoot() {
  return (
    <World>
      <Overworld />
    </World>
  );
}

/**
 * Warms drei's asset caches.
 *
 * Called from the boot screen once it is idle, so that clicking New Game does
 * not begin with a 1.5 MB model download and a texture decode. Deliberately
 * exported from this module rather than done with `<link rel="prefetch">`:
 * these go through the same loaders the scene uses, so the results land in
 * drei's cache already parsed, not merely in the HTTP cache where they would
 * still need decoding and uploading.
 */
export function preloadWorld(): void {
  useGLTF.preload(character.url);
  for (const card of postcards) useTexture.preload(card.src);
}
