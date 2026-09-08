"use client";

import { Outlines } from "@react-three/drei";
import { useMemo } from "react";
import type { ThreeElements } from "@react-three/fiber";
import { getToonRamp, palette } from "@/game/toon";
import { quality } from "@/game/quality";

type ToonMeshProps = ThreeElements["mesh"] & {
  color?: string;
  /**
   * Outline width in **pixels**. 0 disables the outline.
   *
   * drei's <Outlines> defaults to `screenspace={false}`, which — despite the
   * name — is the clip-space path where thickness divides by canvas size, so
   * the unit is pixels and the line holds a constant weight at any distance.
   * That constant weight is what reads as ink. `screenspace={true}` is the
   * model-space path, where thickness is world units and lines fatten as you
   * approach. Do not "fix" this by flipping the flag.
   */
  outline?: number;
  outlineColor?: string;
  emissive?: string;
  emissiveIntensity?: number;
};

/**
 * A cel-shaded mesh with an inverted-hull outline.
 *
 * Pass geometry as children, exactly like a normal <mesh>:
 *
 *   <ToonMesh color={palette.wood} position={[0, 2, 0]}>
 *     <boxGeometry args={[0.4, 4, 0.4]} />
 *   </ToonMesh>
 */
export function ToonMesh({
  color = palette.paper,
  outline = 13,
  outlineColor = palette.ink,
  emissive,
  emissiveIntensity = 1,
  children,
  ...props
}: ToonMeshProps) {
  const gradientMap = useMemo(() => getToonRamp(), []);

  return (
    <mesh castShadow receiveShadow {...props}>
      {children}
      <meshToonMaterial
        color={color}
        gradientMap={gradientMap}
        emissive={emissive}
        emissiveIntensity={emissive ? emissiveIntensity : 0}
      />
      {outline > 0 && (
        /* Scaled to the device's buffer width so the ink reads the same weight
           on a phone as on a desktop, and toneMapped={false} so ACES does not
           wash it to a muddy grey. */
        <Outlines
          thickness={outline * quality().outlineScale}
          color={outlineColor}
          toneMapped={false}
        />
      )}
    </mesh>
  );
}
