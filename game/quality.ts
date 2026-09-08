/**
 * Device profile, resolved once on the client.
 *
 * A phone is not a small desktop: it has a fraction of the fill rate, and the
 * things that cost the most here (post-processing, shadow maps, resolution,
 * particle count) are exactly the things that can be turned down without
 * changing what the world *is*.
 *
 * No three.js import — read by both the DOM HUD and the 3D chunk.
 */

export interface Quality {
  mobile: boolean;
  /** Upper bound on device pixel ratio. */
  dpr: number;
  post: boolean;
  shadows: boolean;
  shadowMapSize: number;
  sakura: number;
  trees: number;
  /**
   * Multiplier for inverted-hull outline thickness.
   *
   * `<Outlines>` measures thickness in drawing-buffer pixels, so a fixed value
   * is a *constant number of pixels* rather than a constant fraction of the
   * screen. A 13px line on a 1920-wide desktop buffer is a hairline; the same
   * 13px on a 375-wide phone buffer is a stripe. Scaling by buffer width keeps
   * the ink weight visually identical across devices.
   */
  outlineScale: number;
}

/** The buffer width the outline thicknesses were originally tuned against. */
const REFERENCE_WIDTH = 1920;

const DESKTOP: Quality = {
  mobile: false,
  dpr: 1.5,
  post: true,
  shadows: true,
  shadowMapSize: 2048,
  sakura: 160,
  trees: 140,
  outlineScale: 1,
};

const MOBILE: Quality = {
  mobile: true,
  // 1.0 rather than the device's 2-3x. On a 3x phone the difference is a
  // ninefold change in pixels shaded, which is the single biggest lever there
  // is and costs almost nothing visually on a toon-shaded scene.
  dpr: 1,
  post: false,
  shadows: false,
  shadowMapSize: 512,
  sakura: 50,
  trees: 60,
  // Replaced below with a value derived from the real buffer width.
  outlineScale: 0.2,
};

let resolved: Quality | null = null;

export function quality(): Quality {
  if (resolved) return resolved;
  if (typeof window === "undefined") return DESKTOP;

  /*
    Coarse pointer OR a narrow viewport. Pointer alone misses small laptops
    with touchscreens the other way, and width alone misses tablets — either
    signal is enough to justify turning things down.
  */
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = Math.min(window.innerWidth, window.innerHeight) < 820;

  const base = coarse || narrow ? MOBILE : DESKTOP;

  // Derived from the actual buffer this device will render at, clamped so a
  // very small or very large screen still gets a usable line weight.
  const bufferWidth = window.innerWidth * base.dpr;
  const outlineScale = Math.max(0.18, Math.min(1.2, bufferWidth / REFERENCE_WIDTH));

  resolved = { ...base, outlineScale };
  return resolved;
}

/** True when the device wants on-screen controls rather than a keyboard. */
export function wantsTouchControls(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}
