"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ToonMesh } from "@/game/components/Toon";
import { Interactable } from "@/game/systems/Interactable";
import { addColliders } from "@/game/systems/colliders";
import { originOf } from "@/game/zones/layout";
import { palette } from "@/game/toon";

const [OX, OZ] = originOf("isles");

/**
 * The Freelance Isles — Timee and Hiike.
 *
 * Two side quests on one shore. The lighthouse sweeps a signal between two
 * boats, which is a WebRTC handshake with the abstraction taken off. The
 * workshop next to it is deliberately unlabelled: the client asked for the
 * stack to stay private, so the tools on its wall have no names on them.
 */
export function Isles({ player }: { player: React.RefObject<THREE.Group | null> }) {
  const beam = useRef<THREE.Mesh>(null);
  const boats = useRef<Array<THREE.Group | null>>([]);

  // The tower and the workshop. The stone platform under the lighthouse is
  // walkable, so it gets no collider.
  useEffect(
    () =>
      addColliders([
        { kind: "circle", x: OX - 13, z: OZ + 4, r: 2.4 },
        { kind: "box", x: OX + 14, z: OZ + 6, hw: 4.2, hd: 3.2 },
      ]),
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // The beam sweeps between the two boats rather than spinning idly — it is
    // carrying something to somewhere.
    if (beam.current) {
      beam.current.rotation.y = Math.sin(t * 0.5) * 0.85 - 0.4;
      const material = beam.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.28 + Math.sin(t * 2.4) * 0.1;
    }

    boats.current.forEach((boat, i) => {
      if (!boat) return;
      boat.position.y = Math.sin(t * 1.1 + i * 2) * 0.22;
      boat.rotation.z = Math.sin(t * 0.9 + i) * 0.07;
    });
  });

  return (
    <group position={[OX, 0, OZ]}>
      {/* Water. Set back far enough that the story rails, which run along the
          near shore, stay on land — the visitor should walk the beach, not
          the sea. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -26]}>
        <planeGeometry args={[70, 26]} />
        <meshBasicMaterial color={palette.skyHorizon} toneMapped={false} />
      </mesh>

      {/* ---- Timee: the signal lighthouse ---- */}
      <group position={[-13, 0, 4]}>
        <ToonMesh color={palette.stone} position={[0, 0.5, 0]} outline={8}>
          <cylinderGeometry args={[6, 6.6, 1, 20]} />
        </ToonMesh>
        <ToonMesh color={palette.paper} position={[0, 5.5, 0]} outline={8}>
          <cylinderGeometry args={[1.5, 2.2, 9, 14]} />
        </ToonMesh>
        {[3, 6, 8.5].map((y) => (
          <ToonMesh key={y} color={palette.ember} position={[0, y, 0]} outline={6}>
            <cylinderGeometry args={[1.95, 1.95, 0.6, 14]} />
          </ToonMesh>
        ))}
        <ToonMesh
          color={palette.gold}
          emissive={palette.gold}
          emissiveIntensity={2.4}
          position={[0, 10.6, 0]}
          outline={6}
        >
          <cylinderGeometry args={[1.3, 1.3, 1.6, 12]} />
        </ToonMesh>
        <ToonMesh color={palette.ink} position={[0, 11.8, 0]} outline={6}>
          <coneGeometry args={[1.8, 1.4, 12]} />
        </ToonMesh>

        {/* The signal itself. */}
        <mesh ref={beam} position={[0, 10.6, 0]}>
          <coneGeometry args={[2.6, 26, 4, 1, true]} />
          <meshBasicMaterial
            color={palette.gold}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        <Interactable
          id="lighthouse"
          label="Examine the Signal Lighthouse"
          scriptId="timee"
          position={[0, 3, 9]}
          radius={9}
          player={player}
        />
      </group>

      {/* The two ends of the connection. */}
      {[
        [-4, -18],
        [10, -22],
      ].map(([x, z], i) => (
        <group
          key={`${x}:${z}`}
          position={[x, 0, z]}
          ref={(node) => {
            boats.current[i] = node;
          }}
        >
          <ToonMesh color={palette.woodDark} position={[0, 0.4, 0]} outline={7}>
            <boxGeometry args={[3.4, 0.7, 1.6]} />
          </ToonMesh>
          <ToonMesh color={palette.paper} position={[0, 1.9, 0]} outline={6}>
            <boxGeometry args={[0.16, 2.4, 0.16]} />
          </ToonMesh>
          <ToonMesh color={palette.sakura} position={[0.5, 2.2, 0]} outline={5}>
            <boxGeometry args={[1, 1.2, 0.06]} />
          </ToonMesh>
        </group>
      ))}

      {/* ---- Hiike: the unlabelled workshop ---- */}
      <group position={[14, 0, 6]}>
        <ToonMesh color={palette.paper} position={[0, 2.4, 0]} outline={8}>
          <boxGeometry args={[8, 4.8, 6]} />
        </ToonMesh>
        <ToonMesh color={palette.woodDark} position={[0, 5.6, 0]} outline={8}>
          <coneGeometry args={[6, 2.6, 4]} />
        </ToonMesh>
        {/* Tools on the wall, silhouettes only — no names on any of them. */}
        {[-2.2, -0.7, 0.8, 2.3].map((x, i) => (
          <ToonMesh
            key={x}
            color={palette.ink}
            position={[x, 2.8 + (i % 2) * 0.6, 3.1]}
            outline={5}
          >
            <boxGeometry args={[0.7, 1.4 + (i % 3) * 0.3, 0.12]} />
          </ToonMesh>
        ))}
        {/* Bench set for both halves of the job. */}
        <ToonMesh color={palette.woodDark} position={[0, 0.7, 4.4]} outline={7}>
          <boxGeometry args={[6, 0.3, 1.6]} />
        </ToonMesh>

        <Interactable
          id="workshop"
          label="Examine the Workshop"
          scriptId="hiike"
          position={[0, 4, 7]}
          radius={9}
          player={player}
        />
      </group>
    </group>
  );
}
