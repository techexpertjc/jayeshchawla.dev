"use client";

import { useEffect, useMemo, useRef } from "react";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { Sky } from "@/game/env/Sky";
import { Sakura } from "@/game/systems/Sakura";
import { ToonMesh } from "@/game/components/Toon";
import { Player } from "@/game/player/Player";
import { CameraRig } from "@/game/camera/CameraRig";
import { Streebo } from "@/game/zones/Streebo";
import { Xmplify } from "@/game/zones/Xmplify";
import { Patricia } from "@/game/zones/Patricia";
import { Predixtions } from "@/game/zones/Predixtions";
import { Isles } from "@/game/zones/Isles";
import { Tavern } from "@/game/zones/Tavern";
import { insideAnyZone } from "@/game/zones/layout";
import { addColliders } from "@/game/systems/colliders";
import { InteractableResolver } from "@/game/systems/Interactable";
import { quality } from "@/game/quality";
import { palette } from "@/game/toon";

/** Comfortably beyond the furthest zone, so the world never feels fenced in. */
const WORLD_RADIUS = 230;

/**
 * The overworld: the ground, the sky and the regions on it.
 *
 * Zones own their own set dressing and interactables and are positioned from
 * `zones/layout.ts`, so adding a region is a matter of writing its component
 * and dropping it in here.
 */
export function Overworld() {
  const player = useRef<THREE.Group>(null);
  const profile = quality();

  /*
    Scattered trees. Seeded, so the world looks the same on every load, and
    filtered against every region's clearance so scenery never grows up through
    a zone — or, at the fortress, out of the water.
  */
  const trees = useMemo(
    () =>
      Array.from({ length: profile.trees }, (_, i) => {
        const a = Math.sin(i * 12.9898) * 43758.5453;
        const b = Math.sin(i * 78.233) * 12345.6789;
        const r1 = a - Math.floor(a);
        const r2 = b - Math.floor(b);

        const angle = r1 * Math.PI * 2;
        const radius = 20 + r2 * 170;
        return {
          x: Math.cos(angle) * radius - 60,
          z: Math.sin(angle) * radius + 12,
          scale: 0.8 + r1 * 0.7,
        };
      }).filter(({ x, z }) => !insideAnyZone(x, z)),
    [profile.trees],
  );

  useEffect(
    () =>
      addColliders(
        trees.map(({ x, z, scale }) => ({
          kind: "circle" as const,
          x,
          z,
          // Trunk, not canopy — you can stand under branches.
          r: 0.4 * scale,
        })),
      ),
    [trees],
  );

  return (
    <>
      <Sky />

      {/*
        Fog reaches far enough that the next region reads as a landmark on the
        horizon rather than popping into existence, while still softening the
        ground disc's edge.
      */}
      <fog attach="fog" args={[palette.skyHorizon, 70, 300]} />

      <directionalLight
        position={[40, 60, 30]}
        intensity={2.4}
        castShadow
        shadow-mapSize={[profile.shadowMapSize, profile.shadowMapSize]}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-camera-far={200}
      />
      <ambientLight intensity={0.7} color={palette.skyHorizon} />
      <directionalLight position={[-6, 4, -8]} intensity={0.5} color={palette.sakura} />

      <Player target={player} />
      <CameraRig target={player} />

      <Streebo player={player} />
      <Xmplify player={player} />
      <Patricia player={player} />
      <Predixtions player={player} />
      <Isles player={player} />
      <Tavern player={player} />

      {/* After the zones on purpose: R3F runs useFrame in mount order, and
          this has to see every candidate they reported this frame. */}
      <InteractableResolver />

      {trees.map(({ x, z, scale }, i) => (
        <group key={i} position={[x, 0, z]} scale={scale}>
          <ToonMesh color={palette.woodDark} position={[0, 1, 0]} outline={6}>
            <cylinderGeometry args={[0.22, 0.3, 2, 7]} />
          </ToonMesh>
          <ToonMesh color={palette.jade} position={[0, 3, 0]} outline={6}>
            <coneGeometry args={[1.6, 3.4, 7]} />
          </ToonMesh>
        </group>
      ))}

      <ToonMesh color={palette.jade} rotation={[-Math.PI / 2, 0, 0]} outline={0} receiveShadow>
        <circleGeometry args={[WORLD_RADIUS, 72]} />
      </ToonMesh>

      {/* Follows the player rather than blanketing the world — a contact shadow
          large enough to cover every zone would be a blurry grey smear. */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.35}
        scale={60}
        blur={2.4}
        far={10}
        color={palette.ink}
      />

      <Sakura count={profile.sakura} area={60} height={26} />
    </>
  );
}
