"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { palette } from "@/game/toon";

/**
 * A petal outline: two opposite points joined by opposing curves.
 *
 * This is the same silhouette the boot screen draws in CSS with
 * `border-radius: 100% 0 100% 0`, and the reason the world's petals used to
 * look wrong — they were plain quads, so they read as falling confetti rather
 * than blossom. Eight curve segments is plenty at the size these appear.
 */
const petalGeometry = new THREE.ShapeGeometry(
  (() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.5, -0.3);
    shape.quadraticCurveTo(0.5, -0.3, 0.5, 0.3);
    shape.quadraticCurveTo(-0.5, 0.3, -0.5, -0.3);
    return shape;
  })(),
  8,
);

interface Petal {
  x: number;
  z: number;
  y: number;
  speed: number;
  drift: number;
  spin: number;
  phase: number;
  scale: number;
}

/**
 * Falling sakura, on a single InstancedMesh.
 *
 * Deliberately CPU-driven for now: at this count the matrix writes are cheap
 * and it stays trivially readable. Phase 5 moves it to a vertex shader if the
 * mobile profile asks for it.
 */
export function Sakura({
  count = 140,
  area = 40,
  height = 22,
}: {
  count?: number;
  area?: number;
  height?: number;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const petals = useMemo<Petal[]>(() => {
    // Seeded, not random — a reload should look the same, and SSR must agree.
    const out: Petal[] = [];
    for (let i = 0; i < count; i++) {
      const a = Math.sin(i * 12.9898) * 43758.5453;
      const b = Math.sin(i * 78.233) * 12345.6789;
      const c = Math.sin(i * 39.425) * 24634.6345;
      const r1 = a - Math.floor(a);
      const r2 = b - Math.floor(b);
      const r3 = c - Math.floor(c);

      out.push({
        x: (r1 - 0.5) * area,
        z: (r2 - 0.5) * area,
        y: r3 * height,
        speed: 0.6 + r1 * 0.9,
        drift: 0.3 + r2 * 0.8,
        spin: 0.4 + r3 * 1.6,
        phase: r1 * Math.PI * 2,
        scale: 0.14 + r2 * 0.12,
      });
    }
    return out;
  }, [count, area, height]);

  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < petals.length; i++) {
      const p = petals[i];

      // Fall, wrapping back to the top. Modulo keeps it stateless — no drift
      // accumulation, and pausing the tab cannot desync it.
      const fallen = (p.y - t * p.speed) % height;
      const y = fallen < 0 ? fallen + height : fallen;

      // Petals do not fall straight; they swing as they tumble.
      const sway = Math.sin(t * p.drift + p.phase) * 0.9;

      dummy.position.set(p.x + sway, y, p.z + Math.cos(t * p.drift * 0.7 + p.phase) * 0.6);
      dummy.rotation.set(t * p.spin + p.phase, t * p.spin * 0.6, Math.PI * 0.25);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }

    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <primitive object={petalGeometry} attach="geometry" />
      <meshBasicMaterial
        color={palette.sakura}
        side={THREE.DoubleSide}
        transparent
        opacity={0.9}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
