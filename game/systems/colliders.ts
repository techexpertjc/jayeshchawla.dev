/**
 * World collision.
 *
 * Deliberately crude: circles and axis-aligned boxes, resolved by pushing the
 * player out along the shortest escape. There is no physics engine here and
 * there does not need to be — nothing in this world moves under force, the
 * player just should not be able to stand inside a building.
 *
 * Zones register their solids on mount and unregister on unmount. Registration
 * is a plain module array rather than store state: it is read every frame by
 * the character controller, and it changes only when a zone mounts.
 *
 * No three.js import — kept dependency-free so it can be reasoned about (and
 * unit-tested) on its own.
 */

export type Collider =
  | { kind: "circle"; x: number; z: number; r: number }
  /** Axis-aligned. `hw`/`hd` are half-extents on x and z. */
  | { kind: "box"; x: number; z: number; hw: number; hd: number };

const colliders: Collider[] = [];

/** Registers solids and returns a disposer. Call from a zone's useEffect. */
export function addColliders(list: Collider[]): () => void {
  colliders.push(...list);
  return () => {
    for (const item of list) {
      const index = colliders.indexOf(item);
      if (index >= 0) colliders.splice(index, 1);
    }
  };
}

export function colliderCount(): number {
  return colliders.length;
}

/**
 * Pushes a point of the given radius out of anything it overlaps, writing the
 * corrected position back into `out`.
 *
 * Resolved in a single pass against every collider. With a few dozen solids
 * that is cheaper than any broadphase would be, and unlike an iterative
 * solver it cannot jitter between two overlapping shapes.
 */
export function resolveCollisions(
  x: number,
  z: number,
  radius: number,
  out: { x: number; z: number },
): void {
  let px = x;
  let pz = z;

  for (const c of colliders) {
    if (c.kind === "circle") {
      const dx = px - c.x;
      const dz = pz - c.z;
      const minimum = c.r + radius;
      const distanceSq = dx * dx + dz * dz;
      if (distanceSq >= minimum * minimum || distanceSq === 0) continue;

      const distance = Math.sqrt(distanceSq);
      px = c.x + (dx / distance) * minimum;
      pz = c.z + (dz / distance) * minimum;
      continue;
    }

    // Box: find the overlap on each axis and back out along the smaller one,
    // which keeps the player sliding along a wall rather than being flung
    // around its corner.
    const dx = px - c.x;
    const dz = pz - c.z;
    const overlapX = c.hw + radius - Math.abs(dx);
    const overlapZ = c.hd + radius - Math.abs(dz);
    if (overlapX <= 0 || overlapZ <= 0) continue;

    if (overlapX < overlapZ) px += Math.sign(dx || 1) * overlapX;
    else pz += Math.sign(dz || 1) * overlapZ;
  }

  out.x = px;
  out.z = pz;
}
