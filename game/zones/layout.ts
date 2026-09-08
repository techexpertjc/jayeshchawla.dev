import type { ZoneId } from "@/content/save-file";

export interface ZonePlacement {
  /** World [x, z] of the region's centre. */
  origin: [number, number];
  /**
   * Radius kept clear of world set dressing. Scattered trees skip this circle,
   * so a region never has scenery growing through its middle — or, in the
   * fortress's case, trees standing in the water.
   */
  clearance: number;
  /**
   * Where `?at=<zone>` drops the player, relative to the origin.
   *
   * Must land **inside the zone's interaction radius** — the point of the
   * shortcut is to test the zone, and arriving just outside its prompt makes
   * you walk the last ten metres every single time.
   */
  spawn?: [number, number];
}

/**
 * Where each region sits in the world.
 *
 * The story rails are authored to pass through these in career order, so
 * moving a region here moves the camera path with it. Keep them roughly
 * 45–60 units apart: close enough that the next landmark is visible on the
 * horizon, far enough that regions do not read as one cluttered scene.
 */
export const zones: Record<ZoneId, ZonePlacement> = {
  streebo: { origin: [0, -4], clearance: 24, spawn: [0, 5] },
  xmplify: { origin: [-46, -34], clearance: 32, spawn: [0, 10] },
  // Tall zones need a longer spawn offset, or the building clips off the top
  // of the frame — the follow camera pitches down and the horizon rides high.
  patricia: { origin: [-96, -22], clearance: 38, spawn: [0, 26] },
  // Spawns on the bank, not in the channel.
  /*
    Moved out from [-130, 22]: the fortress channel is 64 units wide, and at
    that origin its east end reached into Patricia's plinth — open water
    appearing at the foot of the Observatory. A zone's footprint, not just its
    centre, has to clear its neighbours.
  */
  predixtions: { origin: [-146, 42], clearance: 66, spawn: [0, 52] },
  // Two interactables 27 apart here, so the spawn favours the lighthouse
  // rather than landing halfway between and reaching neither.
  isles: { origin: [-84, 62], clearance: 42, spawn: [-13, 20] },
  // Faces west. Spawns where the road ends — in front of the postcard wall.
  tavern: { origin: [-24, 60], clearance: 32, spawn: [-7, -2] },
};

/** Kept as a plain map for the places that only need positions. */
export const zoneOrigins = Object.fromEntries(
  Object.entries(zones).map(([id, z]) => [id, z.origin]),
) as Record<ZoneId, [number, number]>;

export function originOf(zone: ZoneId): [number, number] {
  return zones[zone].origin;
}

/** World [x, z] where `?at=<zone>` should place the player. */
export function spawnFor(zone: ZoneId): [number, number] {
  const { origin, spawn = [0, 14] } = zones[zone];
  return [origin[0] + spawn[0], origin[1] + spawn[1]];
}

/** True when [x, z] falls inside any region's protected circle. */
export function insideAnyZone(x: number, z: number): boolean {
  return Object.values(zones).some(({ origin, clearance }) => {
    const dx = x - origin[0];
    const dz = z - origin[1];
    return dx * dx + dz * dz < clearance * clearance;
  });
}
