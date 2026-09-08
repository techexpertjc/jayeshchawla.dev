"use client";

import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";

/**
 * Post stack. Kept in its own file on purpose: it is the most version-sensitive
 * part of the render pipeline, and if @react-three/postprocessing ever fights
 * the installed three version, this is one import to comment out.
 *
 * Bloom is `luminanceThreshold`-gated so it only touches the emissive lanterns
 * and not the whole toon-shaded scene — cel shading plus indiscriminate bloom
 * turns to mush.
 */
export function PostFX() {
  return (
    <EffectComposer enableNormalPass={false}>
      <Bloom
        intensity={0.85}
        luminanceThreshold={0.75}
        luminanceSmoothing={0.2}
        mipmapBlur
      />
      <Vignette offset={0.32} darkness={0.45} />
    </EffectComposer>
  );
}
