/**
 * The Xmplify geofence — shared state for the zone's signature interaction.
 *
 * A plain mutable module object, like railsState: it is written every frame by
 * the scene and read by a HUD readout that samples it on its own slower clock.
 * Routing per-frame distance accumulation through React would re-render the
 * tree sixty times a second to move a number.
 *
 * No three.js import — the HUD reads this, and the HUD must stay out of the
 * lazily-loaded 3D chunk.
 */

/** Rupees paid per metre travelled inside the boundary. */
export const RATE_PER_METRE = 12;

export interface GeofenceState {
  /** Boundary vertices as [x, z] pairs, in world units. Dragged at runtime. */
  polygon: Array<[number, number]>;
  /** Is the field agent currently inside the boundary? */
  inside: boolean;
  /** Metres travelled inside the boundary this session. */
  metresInside: number;
  /** Metres travelled outside — tracked to show what is *not* being paid. */
  metresOutside: number;
  /** True while a vertex is being dragged, so the camera stops orbiting. */
  dragging: boolean;
}

export const geofenceState: GeofenceState = {
  polygon: [
    [-13, -9],
    [1, -13],
    [12, -2],
    [7, 11],
    [-9, 12],
  ],
  inside: false,
  metresInside: 0,
  metresOutside: 0,
  dragging: false,
};

export function payout(state: GeofenceState = geofenceState): number {
  return Math.round(state.metresInside * RATE_PER_METRE);
}

/**
 * Standard ray-casting containment test: count how many polygon edges a ray
 * from the point crosses. Odd means inside.
 *
 * This is the check the real feature turned on — whether an agent's position
 * fell inside the mapped area decided whether they were paid for it.
 */
export function pointInPolygon(
  x: number,
  z: number,
  polygon: Array<[number, number]>,
): boolean {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, zi] = polygon[i];
    const [xj, zj] = polygon[j];

    const straddles = zi > z !== zj > z;
    if (!straddles) continue;

    const crossingX = ((xj - xi) * (z - zi)) / (zj - zi) + xi;
    if (x < crossingX) inside = !inside;
  }

  return inside;
}

export function resetGeofence() {
  geofenceState.metresInside = 0;
  geofenceState.metresOutside = 0;
}
