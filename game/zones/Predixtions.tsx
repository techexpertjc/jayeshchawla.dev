"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ToonMesh } from "@/game/components/Toon";
import { Interactable } from "@/game/systems/Interactable";
import { addColliders } from "@/game/systems/colliders";
import { originOf } from "@/game/zones/layout";
import { palette } from "@/game/toon";
import { useGame } from "@/store/game";

const [OX, OZ] = originOf("predixtions");

/** Local x of the island the fortress starts on, and the one it ends on. */
const FROM_X = -21;
const TO_X = 21;

/** Fraction of the sequence spent locking the vault before anything lifts. */
const LOCK_SHARE = 0.3;

/** Progress per second — the whole sequence runs for about nine seconds. */
const SEQUENCE_RATE = 1 / 9;

const CRATES = 9;
const TUMBLERS = 6;

/**
 * Local z of the overlook you watch the crossing from.
 *
 * The islands sit 21 units either side of centre. At 34 back they land at
 * ±32 degrees, against a horizontal half-field of about 34 — right on the
 * frame edge. 48 brings them to ±24 and gives the shot some air.
 */
const OVERLOOK_Z = 48;

/**
 * The shot the migration claims.
 *
 * Pulled back far enough to hold both islands at once: the crossing spans 42
 * units, and at a 42-degree vertical field of view that needs roughly 60 to
 * frame comfortably. Standing on the bank you can see one island or the
 * other, never the thing actually happening between them.
 */
const MIGRATION_SHOT = {
  position: [OX, 30, OZ + 70] as [number, number, number],
  focus: [OX, 7, OZ] as [number, number, number],
  lockPlayer: true,
};

/**
 * The establishing shot, held while the visitor stands on the overlook.
 *
 * The follow camera pitches about 17 degrees down, which pushes the horizon
 * high and clips anything tall at distance off the top of the frame — from
 * the bank the fortress simply is not in shot. A viewpoint that does not show
 * you the view is not a viewpoint, so standing here composes the frame. The
 * player is not locked: walk off the terrace and the camera hands back.
 */
const OVERLOOK_SHOT = {
  position: [OX, 21, OZ + 58] as [number, number, number],
  focus: [OX, 6, OZ + 2] as [number, number, number],
  lockPlayer: false,
};

/**
 * The Fortress — Predixtions Inc.
 *
 * Three acts in one structure: the frontend wing it started as, a SOC 2 vault
 * whose bolts drive home, and then the whole fortress detaching and crossing
 * the water to a second island, with the production data flying over behind
 * it. That last part is the GCP-to-Azure migration, and it is the biggest
 * thing on the site because it is the most senior thing on the CV.
 *
 * The sequence runs once the visitor has actually talked to the zone — the
 * spectacle is the payoff for the conversation, not wallpaper behind it.
 */
export function Predixtions({ player }: { player: React.RefObject<THREE.Group | null> }) {
  const fortress = useRef<THREE.Group>(null);
  const crates = useRef<THREE.InstancedMesh>(null);
  const tumblers = useRef<Array<THREE.Mesh | null>>([]);
  const progress = useRef(0);
  const shotClaimed = useRef<"none" | "overlook" | "migration">("none");

  const dummy = useMemo(() => new THREE.Object3D(), []);

  /*
    The keep's collider is mutated in place each frame rather than
    re-registered, because the fortress moves. `addColliders` stores the object
    by reference, so updating `x` here is enough for the solver to see it.
  */
  const keepCollider = useMemo(
    () => ({ kind: "box" as const, x: OX + FROM_X, z: OZ, hw: 6, hd: 5 }),
    [],
  );
  useEffect(() => addColliders([keepCollider]), [keepCollider]);

  useFrame((_, delta) => {
    /*
      Target is derived from the quest log rather than held as its own flag:
      the migration is the reward for finishing the conversation, and
      `discovered` already records that.
    */
    const target = useGame.getState().discovered.includes("predixtions") ? 1 : 0;

    /*
      Advanced at a fixed rate rather than eased toward the target. Damping
      would approach 1 asymptotically and never quite land, so the fortress
      would drift toward the far island forever without arriving — a set piece
      needs a beginning and an end.
    */
    progress.current = THREE.MathUtils.clamp(
      progress.current + Math.sign(target - progress.current) * SEQUENCE_RATE * delta,
      0,
      1,
    );
    const p = progress.current;

    const lock = Math.min(1, p / LOCK_SHARE);
    const flight = Math.max(0, (p - LOCK_SHARE) / (1 - LOCK_SHARE));

    /*
      Claim the camera, and hand it straight back. Guarded by a ref so this
      writes to the store only when the wanted shot actually changes, rather
      than on every frame.
    */
    /*
      Claimed only once the visitor has chosen to examine the fortress — while
      its dialogue is open, while its quest card is up, or while the crossing
      plays. Standing on the overlook is not consent to lose the camera.

      The quest card is included so control does not hand back for the beat
      between the conversation ending and the fortress lifting.
    */
    const { dialogue, questCard } = useGame.getState();
    const engaged = dialogue?.scriptId === "predixtions" || questCard === "predixtions";

    const running = p > 0.001 && p < 0.999;
    const want = running ? "migration" : engaged ? "overlook" : "none";

    if (want !== shotClaimed.current) {
      shotClaimed.current = want;
      useGame
        .getState()
        .setCinematic(
          want === "migration" ? MIGRATION_SHOT : want === "overlook" ? OVERLOOK_SHOT : null,
        );
    }

    /* ---- vault bolts drive home ---- */
    tumblers.current.forEach((bolt, i) => {
      if (!bolt) return;
      const stagger = Math.min(1, Math.max(0, lock * TUMBLERS - i));
      const eased = stagger * stagger * (3 - 2 * stagger);
      const angle = (i / TUMBLERS) * Math.PI * 2;
      const radius = 1.9 - eased * 0.75;
      bolt.position.set(Math.cos(angle) * radius, 4.2 + Math.sin(angle) * radius, 4.3);
      bolt.rotation.z = angle + eased * 0.9;
    });

    /* ---- the fortress crosses ---- */
    if (fortress.current) {
      const eased = flight * flight * (3 - 2 * flight);
      fortress.current.position.x = FROM_X + (TO_X - FROM_X) * eased;
      // Lifts in the middle of the crossing and settles at both ends.
      fortress.current.position.y = Math.sin(eased * Math.PI) * 7;
      fortress.current.rotation.z = Math.sin(eased * Math.PI * 2) * 0.05;
      keepCollider.x = OX + fortress.current.position.x;
    }

    /* ---- data crates stream across behind it ---- */
    if (crates.current) {
      for (let i = 0; i < CRATES; i++) {
        // Each crate is offset along the same arc, so they read as a convoy
        // rather than a single object teleporting.
        const phase = flight > 0.01 && flight < 0.999 ? (flight * 2 + i / CRATES) % 1 : -1;

        if (phase < 0) {
          dummy.scale.setScalar(0);
        } else {
          dummy.scale.setScalar(0.9);
          dummy.position.set(
            FROM_X + (TO_X - FROM_X) * phase,
            2.5 + Math.sin(phase * Math.PI) * 11,
            Math.sin(phase * Math.PI * 3 + i) * 2.5,
          );
          dummy.rotation.set(phase * 4 + i, phase * 3, 0);
        }
        dummy.updateMatrix();
        crates.current.setMatrixAt(i, dummy.matrix);
      }
      crates.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group position={[OX, 0, OZ]}>
      {/* The water the fortress has to cross. A channel between the two
          islands rather than a lake around them — the crossing is the point,
          and there needs to be a bank to watch it from. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[64, 26]} />
        <meshBasicMaterial color={palette.skyHorizon} toneMapped={false} />
      </mesh>

      {/* The rails cross here, so there is something to cross on. Without it
          the story walks the player over open water. */}
      <group position={[3, 0, 0]}>
        <ToonMesh color={palette.stone} position={[0, 0.3, 0]} outline={8}>
          <boxGeometry args={[9, 0.5, 30]} />
        </ToonMesh>
        {[-4.2, 4.2].map((x) =>
          [-11, -5.5, 0, 5.5, 11].map((z) => (
            <ToonMesh key={`${x}:${z}`} color={palette.paper} position={[x, 1, z]} outline={6}>
              <boxGeometry args={[0.3, 1.2, 0.3]} />
            </ToonMesh>
          )),
        )}
      </group>

      {/* Origin and destination islands. */}
      {[FROM_X, TO_X].map((x, i) => (
        <group key={x} position={[x, 0, 0]}>
          <ToonMesh color={palette.jade} position={[0, 0.6, 0]} outline={7}>
            <cylinderGeometry args={[14, 12.5, 1.2, 24]} />
          </ToonMesh>
          {/* A marker post per island — where it left, where it landed. */}
          <ToonMesh
            color={i === 0 ? palette.ember : palette.skyTop}
            emissive={i === 0 ? palette.ember : palette.skyTop}
            emissiveIntensity={1.4}
            position={[i === 0 ? -9 : 9, 2.4, 0]}
            outline={6}
          >
            <boxGeometry args={[0.5, 3, 0.5]} />
          </ToonMesh>
        </group>
      ))}

      {/* Data crates in transit — production DB and bucket storage. */}
      <instancedMesh ref={crates} args={[undefined, undefined, CRATES]} frustumCulled={false}>
        <boxGeometry args={[1.1, 1.1, 1.1]} />
        <meshBasicMaterial color={palette.gold} toneMapped={false} />
      </instancedMesh>

      {/* The fortress itself. */}
      <group ref={fortress} position={[FROM_X, 0, 0]}>
        {/* Keep */}
        <ToonMesh color={palette.stone} position={[0, 4, 0]}>
          <boxGeometry args={[11, 7, 9]} />
        </ToonMesh>

        {/* Corner towers */}
        {[
          [-5, -4],
          [5, -4],
          [-5, 4],
          [5, 4],
        ].map(([x, z]) => (
          <group key={`${x}:${z}`} position={[x, 0, z]}>
            <ToonMesh color={palette.paper} position={[0, 5.4, 0]}>
              <cylinderGeometry args={[1.5, 1.7, 10.8, 10]} />
            </ToonMesh>
            <ToonMesh color={palette.woodDark} position={[0, 11.4, 0]}>
              <coneGeometry args={[2.1, 2.4, 10]} />
            </ToonMesh>
          </group>
        ))}

        {/* Act one — the frontend wing, lit from inside. */}
        <group position={[-8.5, 0, 2]}>
          <ToonMesh color={palette.paper} position={[0, 2.4, 0]}>
            <boxGeometry args={[5, 4.8, 5]} />
          </ToonMesh>
          {[-1.3, 1.3].map((x) =>
            [1.4, 3.4].map((y) => (
              <ToonMesh
                key={`${x}:${y}`}
                color={palette.skyHorizon}
                emissive={palette.skyHorizon}
                emissiveIntensity={1.6}
                position={[x, y, 2.55]}
                outline={4}
              >
                <boxGeometry args={[1.3, 1.1, 0.14]} />
              </ToonMesh>
            )),
          )}
        </group>

        {/* Act two — the SOC 2 vault door, set into the keep's face. */}
        <group position={[0, 0, 0]}>
          <ToonMesh color={palette.ink} position={[0, 4.2, 4.55]} outline={7}>
            <cylinderGeometry args={[2.6, 2.6, 0.4, 20]} />
          </ToonMesh>
          <ToonMesh
            color={palette.gold}
            emissive={palette.gold}
            emissiveIntensity={1.2}
            position={[0, 4.2, 4.75]}
            outline={5}
          >
            <cylinderGeometry args={[0.9, 0.9, 0.3, 16]} />
          </ToonMesh>
          {Array.from({ length: TUMBLERS }, (_, i) => (
            <mesh
              key={i}
              ref={(node) => {
                tumblers.current[i] = node;
              }}
            >
              <boxGeometry args={[1.1, 0.34, 0.34]} />
              <meshBasicMaterial color={palette.gold} toneMapped={false} />
            </mesh>
          ))}
        </group>
      </group>

      {/* The overlook. Set back from the water so both islands are in view at
          once — this is where the crossing is meant to be watched from, so it
          is built as somewhere to stand rather than left as open grass. */}
      <group position={[0, 0, OVERLOOK_Z]}>
        <ToonMesh color={palette.stone} position={[0, 0.3, 0]} outline={8}>
          <cylinderGeometry args={[7, 7.6, 0.6, 20]} />
        </ToonMesh>
        {Array.from({ length: 9 }, (_, i) => {
          // Railing along the water-facing arc only.
          const angle = Math.PI + (i / 8 - 0.5) * 1.9;
          return (
            <ToonMesh
              key={i}
              color={palette.paper}
              position={[Math.cos(angle) * 6.6, 1.1, Math.sin(angle) * 6.6]}
              outline={6}
            >
              <boxGeometry args={[0.3, 1.1, 0.3]} />
            </ToonMesh>
          );
        })}
      </group>

      <Interactable
        id="fortress"
        label="Examine the Fortress"
        scriptId="predixtions"
        position={[0, 3.2, OVERLOOK_Z]}
        radius={11}
        player={player}
      />
    </group>
  );
}
