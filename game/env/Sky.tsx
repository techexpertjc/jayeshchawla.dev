"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { palette } from "@/game/toon";

const vertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

/**
 * Three-stop vertical gradient with a warm glow near the horizon, plus a
 * deliberate posterise step so the sky bands like the rest of the scene
 * instead of being the one smoothly-shaded thing in frame.
 */
const fragmentShader = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uGlow;
  uniform float uBands;
  varying vec3 vWorldPosition;

  void main() {
    float h = normalize(vWorldPosition).y;

    // Remap -1..1 to 0..1, weighted so most of the gradient sits above the horizon.
    float t = clamp(h * 0.5 + 0.5, 0.0, 1.0);
    t = pow(t, 0.8);

    /*
      Posterise, then blend most of the way back toward the smooth value.
      Fully quantised, the few bands that fall inside a near-horizontal view
      read as one hard seam — a rendering glitch rather than a choice. Holding
      it at three quarters keeps a visible step without the seam.
    */
    float banded = floor(t * uBands) / uBands + (0.5 / uBands);
    t = mix(t, banded, 0.75);

    vec3 color = mix(uHorizon, uTop, smoothstep(0.5, 0.95, t));
    color = mix(color, uGlow, smoothstep(0.55, 0.34, t) * 0.5);

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

export function Sky({ bands = 26 }: { bands?: number }) {
  const material = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color(palette.skyTop) },
      uHorizon: { value: new THREE.Color(palette.skyHorizon) },
      uGlow: { value: new THREE.Color(palette.skyGlow) },
      uBands: { value: bands },
    }),
    [bands],
  );

  useFrame(() => {
    if (material.current) material.current.uniforms.uBands.value = bands;
  });

  return (
    <mesh scale={[-1, 1, 1]} renderOrder={-1000}>
      <sphereGeometry args={[400, 32, 16]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        depthWrite={false}
        side={THREE.BackSide}
        toneMapped={false}
      />
    </mesh>
  );
}
