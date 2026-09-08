"use client";

import { ContactShadows, OrbitControls } from "@react-three/drei";
import { Sky } from "@/game/env/Sky";
import { Sakura } from "@/game/systems/Sakura";
import { Torii } from "@/game/props/Torii";
import { ToonMesh } from "@/game/components/Toon";
import { palette } from "@/game/toon";

/**
 * Phase 1 look-dev scene.
 *
 * The gate: does the toon stack — banded ramp, inverted-hull outlines,
 * posterised sky, sakura — read as anime? Judge it here, on throwaway
 * geometry, before any zone gets built.
 */
export function LookDev() {
  return (
    <>
      <Sky />

      {/*
        Fog does three jobs at once: it gives depth, it stops the ground disc's
        edge from reading as a hard seam against the sky, and it is how anime
        backgrounds fade distance. The sky is a ShaderMaterial, which opts out
        of fog by default, so the gradient stays untouched.
      */}
      <fog attach="fog" args={[palette.skyHorizon, 26, 95]} />

      {/*
        One key light doing the shaping, a cool fill so shadows read as tinted
        rather than dark, and a warm rim to lift silhouettes off the sky.
      */}
      <directionalLight
        position={[6, 10, 4]}
        intensity={2.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <ambientLight intensity={0.7} color={palette.skyHorizon} />
      <directionalLight position={[-5, 3, -6]} intensity={0.5} color={palette.sakura} />

      <Torii position={[0, 0, 0]} />

      {/* Stone approach path — repetition tests how outlines behave at distance. */}
      {Array.from({ length: 7 }, (_, i) => (
        <ToonMesh
          key={i}
          color={palette.stone}
          position={[0, 0.04, 2.4 + i * 1.5]}
          rotation={[0, i * 0.14, 0]}
          outline={8}
        >
          <cylinderGeometry args={[0.62, 0.66, 0.08, 9]} />
        </ToonMesh>
      ))}

      {/* Lanterns — the emissive test for bloom. */}
      {[-3.2, 3.2].map((x) => (
        <group key={x} position={[x, 0, 3.5]}>
          <ToonMesh color={palette.stone} position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.16, 0.22, 1, 8]} />
          </ToonMesh>
          <ToonMesh
            color={palette.gold}
            emissive={palette.gold}
            emissiveIntensity={2.2}
            position={[0, 1.25, 0]}
          >
            <boxGeometry args={[0.42, 0.5, 0.42]} />
          </ToonMesh>
          <ToonMesh color={palette.ink} position={[0, 1.58, 0]}>
            <coneGeometry args={[0.42, 0.24, 4]} />
          </ToonMesh>
        </group>
      ))}

      {/* Ground */}
      <ToonMesh
        color={palette.jade}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        outline={0}
        receiveShadow
      >
        <circleGeometry args={[60, 64]} />
      </ToonMesh>

      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.35}
        scale={30}
        blur={2.4}
        far={8}
        color={palette.ink}
      />

      <Sakura />

      {/* Look dev only — Phase 2 replaces this with the rails/follow cameras. */}
      <OrbitControls
        makeDefault
        enablePan={false}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={4}
        maxDistance={30}
        target={[0, 2, 0]}
      />
    </>
  );
}
