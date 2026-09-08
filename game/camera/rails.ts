import * as THREE from "three";

export { railsState } from "@/game/camera/railsState";

/**
 * The story rails.
 *
 * One ground-level path, not two. The camera and the player both derive from
 * it: the player stands on the curve, the camera sits back along the tangent
 * and above it. Authoring a separate camera spline and player spline is how
 * you end up with a camera that quietly drifts off the subject.
 *
 * Points run from the far approach, through the gate, and away to the side.
 */
export const walkPath = new THREE.CatmullRomCurve3(
  [
    // Approach to the Trinity Gate
    new THREE.Vector3(0, 0, 24),
    new THREE.Vector3(0.6, 0, 16),
    new THREE.Vector3(-0.4, 0, 9),
    new THREE.Vector3(0, 0, 2),
    // Through the gate
    new THREE.Vector3(0, 0, -4),
    new THREE.Vector3(-4, 0, -11),
    // Out toward the Geofence Garden
    new THREE.Vector3(-15, 0, -19),
    new THREE.Vector3(-30, 0, -26),
    new THREE.Vector3(-41, 0, -32),
    // Through the garden
    new THREE.Vector3(-46, 0, -34),
    new THREE.Vector3(-57, 0, -39),
    /*
      The rest of the path is authored to satisfy two constraints at once, and
      they pull against each other:

        1. never cross a solid, or water anywhere but the bridge
        2. pass within interaction range of every prompt

      Solving (1) alone is what broke (2) the first time — the path was moved
      clear of the Observatory and stopped reaching it, so scrolling walked
      straight past the zone with nothing to press. Every waypoint below that
      names a zone IS that zone's interaction point.

      `check-rails.mjs` in the session scratchpad verifies both. Re-run it after
      touching this array or moving a zone.
    */

    // Patricia — approached from the south, clear of the plinth
    new THREE.Vector3(-72, 0, -30),
    new THREE.Vector3(-86, 0, -14),
    new THREE.Vector3(-96, 0, -4),

    // Down to the Fortress, entering the channel already aligned with the bridge
    new THREE.Vector3(-110, 0, 4),
    new THREE.Vector3(-128, 0, 18),
    new THREE.Vector3(-140, 0, 26),
    new THREE.Vector3(-143, 0, 38),
    new THREE.Vector3(-143, 0, 50),

    // Up the far bank to the overlook
    new THREE.Vector3(-145, 0, 64),
    new THREE.Vector3(-146, 0, 78),
    new THREE.Vector3(-146, 0, 90),

    // Across to the isles, south of both buildings
    new THREE.Vector3(-128, 0, 93),
    new THREE.Vector3(-110, 0, 84),
    new THREE.Vector3(-97, 0, 75),
    new THREE.Vector3(-84, 0, 77),
    new THREE.Vector3(-70, 0, 75),

    /*
      Home to Traveller's Rest, and the road stops there.

      It used to run past the inn and trail off into empty grass, which ended
      the story on nothing. Rather than curving the path around to approach
      from the north, the tavern itself is turned a quarter to face west — so
      the road simply runs straight into it and stops, with the save crystal
      and the postcard wall dead ahead.
    */
    new THREE.Vector3(-56, 0, 70),
    new THREE.Vector3(-48, 0, 64),
    new THREE.Vector3(-42, 0, 61),
    // Past the save point…
    new THREE.Vector3(-37, 0, 58.5),
    /*
      …and straight at the postcard wall, which is the whole point of the last
      segment running due east. The camera looks along the tangent, and on a
      portrait phone the horizontal field of view is about 20 degrees — an
      approach angled even slightly off leaves the wall out of frame on the
      device most people will see this on.
    */
    new THREE.Vector3(-31, 0, 58),
  ],
  false,
  "catmullrom",
  0.5,
);

const scratchPoint = new THREE.Vector3();
const scratchTangent = new THREE.Vector3();

export interface RailsSample {
  point: THREE.Vector3;
  tangent: THREE.Vector3;
}

/** Samples the path. The returned vectors are reused — copy them if you keep them. */
export function sampleRails(t: number): RailsSample {
  const clamped = THREE.MathUtils.clamp(t, 0, 1);
  walkPath.getPointAt(clamped, scratchPoint);
  walkPath.getTangentAt(clamped, scratchTangent);
  scratchTangent.y = 0;
  scratchTangent.normalize();
  return { point: scratchPoint, tangent: scratchTangent };
}
