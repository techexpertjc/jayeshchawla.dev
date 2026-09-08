"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines } from "@react-three/drei";
import * as THREE from "three";
import { ToonMesh } from "@/game/components/Toon";
import { Interactable } from "@/game/systems/Interactable";
import { addColliders } from "@/game/systems/colliders";
import { originOf } from "@/game/zones/layout";
import { getToonRamp, palette } from "@/game/toon";
import { useGame } from "@/store/game";

const [OX, OZ] = originOf("patricia");

const PANELS = 16;
/** Panels sit just clear of the 3.4-radius core — further out and the building
 *  reads as debris orbiting a tower rather than as a shell on one. */
const RING_RADIUS = 4.1;
const SEQUENCE_RATE = 1 / 7;

/** Local z of the viewing position. */
const VIEW_Z = 26;

const VIEW_SHOT = {
  position: [OX, 15, OZ + 34] as [number, number, number],
  focus: [OX, 9, OZ] as [number, number, number],
  lockPlayer: false,
};

const REBUILD_SHOT = {
  position: [OX + 6, 13, OZ + 26] as [number, number, number],
  focus: [OX, 10, OZ] as [number, number, number],
  lockPlayer: true,
};

/** The two design languages the product was built in, ground up, twice. */
const FIRST_PASS = new THREE.Color(palette.stone);
const SECOND_PASS = new THREE.Color(palette.sakura);

/**
 * The Observatory — Patricia AI.
 *
 * Two and a half years, and the product built from nothing twice. So the
 * building takes itself apart and reassembles in a different design language:
 * the panels scatter, the Figma frames that were hovering beside them converge
 * onto their final positions, and the whole thing settles in a new palette.
 *
 * The ghost frames are the point of the metaphor — the design existed, precise
 * and dimensioned, before the building did.
 */
export function Patricia({ player }: { player: React.RefObject<THREE.Group | null> }) {
  const panels = useRef<Array<THREE.Mesh | null>>([]);
  const ghosts = useRef<Array<THREE.LineSegments | null>>([]);
  const portal = useRef<THREE.Mesh>(null);
  const progress = useRef(0);
  const shotClaimed = useRef<"none" | "view" | "rebuild">("none");

  // One material shared by every panel, so the palette swap is a single colour
  // lerp per frame rather than sixteen.
  const shell = useMemo(
    () =>
      new THREE.MeshToonMaterial({
        color: FIRST_PASS.clone(),
        gradientMap: getToonRamp(),
      }),
    [],
  );

  /** Where each panel ends up, and how far it flings out on the way. */
  const layout = useMemo(
    () =>
      Array.from({ length: PANELS }, (_, i) => {
        const level = Math.floor(i / 8);
        const around = ((i % 8) / 8) * Math.PI * 2 + level * 0.4;
        return {
          angle: around,
          y: 3.4 + level * 3.6,
          // Deterministic scatter direction, seeded off the index.
          fling: 3 + ((i * 37) % 5),
        };
      }),
    [],
  );

  /*
    Only the core is solid. The panels orbit at 3.4 units up and higher, well
    over the player's head, so blocking them would stop you walking under a
    building you can plainly walk under.
  */
  useEffect(
    () =>
      addColliders([
        { kind: "circle", x: OX, z: OZ, r: 3.8 },
        /*
          The plinth too. It is a raised platform and there is no ground-height
          system, so without a collider the player walks into the side of it and
          sinks — visibly half-buried in the base of the tower.
        */
        { kind: "circle", x: OX, z: OZ, r: 11 },
      ]),
    [],
  );

  const ghostGeometry = useMemo(() => {
    const box = new THREE.BoxGeometry(2.5, 3.2, 0.5);
    return new THREE.EdgesGeometry(box);
  }, []);

  useFrame((state, delta) => {
    const target = useGame.getState().discovered.includes("patricia") ? 1 : 0;
    progress.current = THREE.MathUtils.clamp(
      progress.current + Math.sign(target - progress.current) * SEQUENCE_RATE * delta,
      0,
      1,
    );
    const p = progress.current;

    // Out and back: panels fly apart at the midpoint and reassemble, so the
    // rebuild reads as a rebuild rather than a slow fade between two states.
    const scatter = Math.sin(p * Math.PI);

    shell.color.copy(FIRST_PASS).lerp(SECOND_PASS, p);

    layout.forEach((slot, i) => {
      const panel = panels.current[i];
      const ghost = ghosts.current[i];
      // Second pass rotates the whole ring, so the silhouette changes too.
      const angle = slot.angle + p * 0.42;
      const radius = RING_RADIUS + scatter * slot.fling;

      if (panel) {
        panel.position.set(
          Math.cos(angle) * radius,
          slot.y + scatter * (i % 3) * 1.4,
          Math.sin(angle) * radius,
        );
        panel.rotation.set(scatter * 0.6, -angle, scatter * 0.5);
      }

      if (ghost) {
        // Ghosts sit at the finished positions the whole time and fade as the
        // real panels arrive on them.
        ghost.position.set(
          Math.cos(slot.angle + 0.42) * RING_RADIUS,
          slot.y,
          Math.sin(slot.angle + 0.42) * RING_RADIUS,
        );
        ghost.rotation.y = -(slot.angle + 0.42);
        const material = ghost.material as THREE.LineBasicMaterial;
        material.opacity = 0.16 + scatter * 0.6;
      }
    });

    if (portal.current) {
      portal.current.rotation.z = state.clock.elapsedTime * 0.6;
      portal.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.05);
    }

    /*
      The camera is claimed only once the visitor has chosen to examine the
      zone — while its dialogue is open, while its quest card is up, or while
      the rebuild plays. Claiming it on proximity meant merely walking past
      wrenched control away from someone who had not asked for anything.

      The quest card is included so the camera does not hand back for the beat
      between the conversation ending and the rebuild starting.
    */
    const { dialogue, questCard } = useGame.getState();
    const engaged = dialogue?.scriptId === "patricia" || questCard === "patricia-ai";

    const running = p > 0.001 && p < 0.999;
    const want = running ? "rebuild" : engaged ? "view" : "none";

    if (want !== shotClaimed.current) {
      shotClaimed.current = want;
      useGame
        .getState()
        .setCinematic(want === "rebuild" ? REBUILD_SHOT : want === "view" ? VIEW_SHOT : null);
    }
  });

  return (
    <group position={[OX, 0, OZ]}>
      {/* Plinth */}
      <ToonMesh color={palette.stone} position={[0, 0.6, 0]} outline={8}>
        <cylinderGeometry args={[10, 11, 1.2, 28]} />
      </ToonMesh>

      {/* Core */}
      <ToonMesh color={palette.ink} position={[0, 6, 0]} outline={8}>
        <cylinderGeometry args={[3, 3.4, 11, 20]} />
      </ToonMesh>

      {/* Figma frames — dimensioned, precise, and there before the building. */}
      {layout.map((_, i) => (
        <lineSegments
          key={`ghost-${i}`}
          ref={(node) => {
            ghosts.current[i] = node;
          }}
          geometry={ghostGeometry}
        >
          <lineBasicMaterial color={palette.sakura} transparent opacity={0.2} toneMapped={false} />
        </lineSegments>
      ))}

      {/* The built panels */}
      {layout.map((_, i) => (
        <mesh
          key={`panel-${i}`}
          ref={(node) => {
            panels.current[i] = node;
          }}
          material={shell}
          castShadow
        >
          <boxGeometry args={[2.5, 3.2, 0.5]} />
          <Outlines thickness={7} color={palette.ink} toneMapped={false} />
        </mesh>
      ))}

      {/* Dome and the portal that hands you off to the 3D navigation. */}
      <ToonMesh color={palette.paper} position={[0, 12, 0]} outline={8}>
        <sphereGeometry args={[4, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </ToonMesh>
      {/* Clear of the dome's crown — at 13.6 it was buried inside it. */}
      <mesh ref={portal} position={[0, 17, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.8, 0.42, 10, 28]} />
        <meshBasicMaterial color={palette.sakura} toneMapped={false} />
      </mesh>

      <Interactable
        id="observatory"
        label="Examine the Observatory"
        scriptId="patricia"
        position={[0, 3.4, VIEW_Z - 8]}
        radius={11}
        player={player}
      />
    </group>
  );
}
