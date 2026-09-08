"use client";

import { World } from "@/game/World";
import { LookDev } from "@/game/scenes/LookDev";

/**
 * The 3D entry point for /lookdev.
 *
 * Everything three.js is imported statically here, and this whole module is
 * what gets code-split by the route's single `next/dynamic` call. Do not
 * dynamic-import scene components individually: a `next/dynamic` lazy
 * component rendered *inside* <Canvas> suspends against R3F's reconciler and
 * never resolves, which halts the render loop with no error — a blank canvas
 * and a silent console.
 *
 * One dynamic boundary, at the DOM level. Always.
 */
export function LookDevRoot() {
  return (
    <World>
      <LookDev />
    </World>
  );
}
