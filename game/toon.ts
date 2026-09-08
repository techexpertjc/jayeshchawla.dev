import * as THREE from "three";

/**
 * The toon gradient ramp.
 *
 * A `MeshToonMaterial` looks up its lighting in a 1D texture instead of a smooth
 * falloff. A tiny nearest-filtered texture with N pixels therefore gives exactly
 * N bands of light — which is the entire cel-shaded look, for a few bytes.
 */
export function createToonRamp(steps = 3): THREE.DataTexture {
  const data = new Uint8Array(steps * 4);

  for (let i = 0; i < steps; i++) {
    // Bias the ramp so the shadow band is not pure black — anime shadows are
    // tinted and lifted, not absent light.
    const t = i / Math.max(1, steps - 1);
    const value = Math.round((0.35 + 0.65 * t) * 255);
    data[i * 4 + 0] = value;
    data[i * 4 + 1] = value;
    data[i * 4 + 2] = value;
    data[i * 4 + 3] = 255;
  }

  const texture = new THREE.DataTexture(data, steps, 1, THREE.RGBAFormat);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

/**
 * One ramp, shared by every toon material in the scene. Built lazily so it is
 * never created during SSR, and only once thereafter.
 */
let sharedRamp: THREE.DataTexture | null = null;
export function getToonRamp(): THREE.DataTexture {
  if (!sharedRamp) sharedRamp = createToonRamp(3);
  return sharedRamp;
}

/**
 * Replaces every material under `root` with a cel-shaded equivalent, keeping
 * the original colour and base texture. glTF models arrive with
 * MeshStandardMaterial, which would be the one physically-lit thing in an
 * otherwise flat-shaded world.
 */
export function toonify(root: THREE.Object3D): void {
  const gradientMap = getToonRamp();

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    const source = mesh.material as THREE.MeshStandardMaterial;

    /*
      Alpha and sidedness are carried over, not just colour and texture.

      Character models cut hair, eyelashes and eyebrows out of flat
      double-sided quads using alpha — a VRoid export arrives with
      `alphaMode: MASK` and `doubleSided: true`. Building a fresh opaque,
      single-sided material would render those quads as solid rectangles and
      cull half of every strand. The rest of the world sets none of these, so
      the props are unaffected.
    */
    mesh.material = new THREE.MeshToonMaterial({
      map: source.map ?? null,
      color: source.color ?? new THREE.Color("#ffffff"),
      gradientMap,
      transparent: source.transparent,
      opacity: source.opacity ?? 1,
      alphaTest: source.alphaTest ?? 0,
      side: source.side ?? THREE.FrontSide,
      alphaMap: source.alphaMap ?? null,
    });

    // Dispose the material we are replacing; nothing else references it.
    source.dispose?.();

    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });
}

/**
 * Scene palette. Mirrors the CSS tokens in `app/globals.css` so the HUD and the
 * world never drift apart — if you change one, change the other.
 */
export const palette = {
  ink: "#14161f",
  inkDeep: "#0f1119",
  paper: "#f6f1e4",
  skyTop: "#2b4c73",
  skyHorizon: "#8fd3f4",
  skyGlow: "#ffc9dd",
  sakura: "#ff9ec4",
  sakuraDeep: "#e56a9b",
  gold: "#f2c14e",
  jade: "#5fbf9f",
  /** Darker green for planting that has to read against a jade lawn. */
  moss: "#357f68",
  ember: "#ef6f5c",
  stone: "#d9ccb0",
  wood: "#c94f4f",
  woodDark: "#9e3b3b",
} as const;
