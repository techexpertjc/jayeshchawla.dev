"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { PerformanceMonitor, Preload } from "@react-three/drei";
import * as THREE from "three";
import { PostFX } from "@/game/PostFX";
import { quality } from "@/game/quality";
import { palette } from "@/game/toon";

/**
 * The Canvas host.
 *
 * Owns the quality ladder so no scene has to think about it: when the frame
 * rate sags, resolution drops first, then post-processing goes. A portfolio
 * that stutters is worse than one that is slightly softer.
 */
export function World({ children }: { children: React.ReactNode }) {
  // Starting point comes from the device profile; PerformanceMonitor can still
  // step it down further if even that is too much.
  const profile = quality();
  const [dpr, setDpr] = useState(profile.dpr);
  const [postEnabled, setPostEnabled] = useState(profile.post);

  return (
    <Canvas
      dpr={dpr}
      shadows={profile.shadows}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [7, 4.5, 11], fov: 42, near: 0.1, far: 500 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.setClearColor(palette.inkDeep);
      }}
    >
      <PerformanceMonitor
        onDecline={() => {
          // Step down once, in order of what costs most for what it adds.
          setDpr((current) => (current > 1 ? 1 : current));
          setPostEnabled(false);
        }}
        // Never climb above what the device profile allows — a phone that
        // manages 60fps at DPR 1 should stay there, not be pushed to 1.5.
        onIncline={() => setDpr(profile.dpr)}
      />

      <DevBridge />

      <Suspense fallback={null}>
        {children}
        {postEnabled && <PostFX />}
        {/*
          Compiles every shader and uploads every texture before the first
          frame is shown. Without it the opening seconds stutter as each
          material is compiled the moment it first becomes visible — which is
          exactly when the camera is moving and it is most obvious.
        */}
        <Preload all />
      </Suspense>
    </Canvas>
  );
}

/**
 * Exposes the R3F root state as `window.__r3f` in development so the scene
 * graph, renderer and camera can be inspected from the console. Stripped from
 * production builds by the NODE_ENV check.
 */
function DevBridge() {
  const state = useThree();

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (window as unknown as { __r3f?: unknown }).__r3f = state;
  }, [state]);

  return null;
}
