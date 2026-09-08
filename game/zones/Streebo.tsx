"use client";

import { useEffect } from "react";
import type * as THREE from "three";
import { ToonMesh } from "@/game/components/Toon";
import { Torii } from "@/game/props/Torii";
import { Interactable } from "@/game/systems/Interactable";
import { addColliders } from "@/game/systems/colliders";
import { originOf } from "@/game/zones/layout";
import { palette } from "@/game/toon";

const [OX, OZ] = originOf("streebo");
const STEPPING_STONES = 11;

/**
 * The Trinity Gate — Streebo Soft Solutions.
 *
 * Three torii converging into one: web, iOS and Android delivered from a
 * single hybrid codebase.
 */
export function Streebo({ player }: { player: React.RefObject<THREE.Group | null> }) {
  /*
    Pillars only — the gap between them is a gate, and walking through a gate
    is the entire point of a gate.
  */
  useEffect(
    () =>
      addColliders([
        { kind: "circle", x: OX - 1.5, z: OZ, r: 0.45 },
        { kind: "circle", x: OX + 1.5, z: OZ, r: 0.45 },
        { kind: "circle", x: OX - 8.4, z: OZ + 5, r: 0.35 },
        { kind: "circle", x: OX - 6.6, z: OZ + 5, r: 0.35 },
        { kind: "circle", x: OX + 6.6, z: OZ + 5, r: 0.35 },
        { kind: "circle", x: OX + 8.4, z: OZ + 5, r: 0.35 },
        // Bell frame uprights
        { kind: "circle", x: OX + 4.45, z: OZ - 1, r: 0.2 },
        { kind: "circle", x: OX + 6.55, z: OZ - 1, r: 0.2 },
      ]),
    [],
  );

  return (
    <group position={[OX, 0, OZ]}>
      <Torii />

      {/* The two lesser gates, set back and turned inward — the platforms that
          were folded into the main one. */}
      {[-1, 1].map((side) => (
        <Torii
          key={side}
          position={[side * 7.5, 0, 5]}
          rotation={[0, side * -0.5, 0]}
          scale={0.62}
          color={palette.woodDark}
        />
      ))}

      {/*
        Approach path. The lateral wander is tapered by (1 - t) so it dies to
        zero exactly at the gate — an approach that arrives off-centre reads as
        a mistake, however pleasant the meander looks on the way in.
      */}
      {Array.from({ length: STEPPING_STONES }, (_, i) => {
        const t = i / (STEPPING_STONES - 1);
        const wander = Math.sin(i * 0.5) * 0.9 * (1 - t);
        return (
          <ToonMesh
            key={i}
            color={palette.stone}
            position={[wander, 0.04, 16 - i * 1.6]}
            rotation={[0, i * 0.2, 0]}
            outline={8}
          >
            <cylinderGeometry args={[0.66, 0.7, 0.08, 9]} />
          </ToonMesh>
        );
      })}

      {/* Lanterns flanking the approach. */}
      {[
        [-3.4, 6],
        [3.4, 6],
        [-3.4, 13],
        [3.4, 13],
      ].map(([x, z]) => (
        <group key={`${x}:${z}`} position={[x, 0, z]}>
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

      {/* The L3 bell — rung when the first two tiers could not fix it. */}
      <group position={[5.5, 0, -1]}>
        <ToonMesh color={palette.woodDark} position={[0, 1.6, 0]} outline={7}>
          <boxGeometry args={[2.4, 0.26, 0.26]} />
        </ToonMesh>
        {[-1.05, 1.05].map((x) => (
          <ToonMesh key={x} color={palette.woodDark} position={[x, 0.8, 0]} outline={7}>
            <cylinderGeometry args={[0.12, 0.14, 1.6, 8]} />
          </ToonMesh>
        ))}
        <ToonMesh color={palette.gold} position={[0, 1.05, 0]} outline={7}>
          <cylinderGeometry args={[0.34, 0.44, 0.8, 10]} />
        </ToonMesh>
      </group>

      <Interactable
        id="trinity-gate"
        label="Examine the Trinity Gate"
        scriptId="streebo"
        position={[0, 5.4, 0]}
        radius={7}
        player={player}
      />
    </group>
  );
}
