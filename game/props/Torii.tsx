"use client";

import type { ThreeElements } from "@react-three/fiber";
import { ToonMesh } from "@/game/components/Toon";
import { palette } from "@/game/toon";

/**
 * A torii gate, built procedurally.
 *
 * Deliberately no glb: look dev should not be blocked on asset sourcing, and a
 * gate is simple enough to describe in primitives. If the toon stack reads
 * correctly on this, it will read correctly on real models.
 */
export function Torii({
  scale = 1,
  color = palette.wood,
  ...props
}: ThreeElements["group"] & { color?: string }) {
  const pillarHeight = 4;
  const halfSpan = 1.5;

  return (
    <group scale={scale} {...props}>
      {/* Pillars — slightly tapered, as real torii are. */}
      {[-halfSpan, halfSpan].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <ToonMesh color={color} position={[0, pillarHeight / 2, 0]}>
            <cylinderGeometry args={[0.16, 0.2, pillarHeight, 12]} />
          </ToonMesh>
          {/* Stone footing */}
          <ToonMesh color={palette.stone} position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.3, 0.34, 0.24, 12]} />
          </ToonMesh>
        </group>
      ))}

      {/* Nuki — the lower straight tie beam. */}
      <ToonMesh color={color} position={[0, pillarHeight - 0.75, 0]}>
        <boxGeometry args={[halfSpan * 2 + 0.9, 0.22, 0.3]} />
      </ToonMesh>

      {/* Shimaki — the flat beam directly under the roof. */}
      <ToonMesh color={palette.woodDark} position={[0, pillarHeight + 0.1, 0]}>
        <boxGeometry args={[halfSpan * 2 + 1.5, 0.18, 0.42]} />
      </ToonMesh>

      {/*
        Kasagi — the top beam. Real ones curve upward; three shallow segments
        read as a curve at this silhouette size and cost nothing.
      */}
      <group position={[0, pillarHeight + 0.36, 0]}>
        <ToonMesh color={color}>
          <boxGeometry args={[halfSpan * 2 + 1.1, 0.28, 0.5]} />
        </ToonMesh>
        {[-1, 1].map((dir) => (
          <ToonMesh
            key={dir}
            color={color}
            position={[dir * (halfSpan + 0.72), 0.09, 0]}
            rotation={[0, 0, dir * -0.12]}
          >
            <boxGeometry args={[0.7, 0.26, 0.5]} />
          </ToonMesh>
        ))}
      </group>

      {/* Gakuzuka — the centre strut between the two beams. */}
      <ToonMesh color={palette.woodDark} position={[0, pillarHeight - 0.32, 0]}>
        <boxGeometry args={[0.26, 0.7, 0.34]} />
      </ToonMesh>
    </group>
  );
}
