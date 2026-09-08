/**
 * The player character — the single swap point.
 *
 * Everything downstream (controller, animation state machine, camera framing)
 * reads from here. Replacing the placeholder with Jayesh's VRoid avatar means
 * editing this file and nothing else: drop the new .glb in public/models,
 * point `url` at it, retune `scale`, and map `clips` onto whatever the export
 * named its animations.
 *
 * Placeholder: Fox.glb from the Khronos glTF Sample Assets — CC0-1.0, by
 * PixelMannen (model) and tomkranis (rig/animation). See ATTRIBUTIONS.md.
 */
export const character = {
  url: "/models/avatar.glb",

  /**
   * VRoid exports in metres, so the model arrives at roughly life size and
   * needs no scaling. (The old Fox.glb placeholder was authored at ~100 units
   * and wanted 0.02.)
   */
  scale: 1,

  /** Lifts the model if its origin sits below its feet. */
  yOffset: 0,

  /**
   * Radians to add so the model faces its heading. glTF exports disagree about
   * which way is forward; if the character moonwalks, put Math.PI here.
   */
  facingOffset: 0,

  /**
   * Maps the state machine's states onto clip names in the glb.
   *
   * A VRoid export contains **no animation clips at all** — it is a model in
   * a rest pose. These names are the ones a Mixamo export uses, ready for
   * when the animations are retargeted; until then `transitionTo` finds no
   * matching action and no-ops, so the character simply stands still rather
   * than erroring.
   */
  clips: {
    idle: "Idle",
    walk: "Walking",
    run: "Running",
  },

  /** Metres per second. */
  walkSpeed: 2.6,
  runSpeed: 6.2,

  /** How fast the model swings round to face its heading, in radians/sec. */
  turnSpeed: 9,

  /** Seconds to blend between animation states. */
  crossfade: 0.22,

  /**
   * Interim rest pose, applied once on load.
   *
   * VRoid exports an A-pose — arms out at roughly 45 degrees — which reads as
   * an unfinished asset rather than a person. These rotations bring the arms
   * down to the sides. Values are Euler angles in radians, keyed by bone name.
   *
   * Delete this once real animation clips exist: an animation track on a bone
   * overwrites its rotation every frame, so this would simply stop applying.
   */
  restPose: {
    /*
      Negative Z lowers the left arm, positive lowers the right — getting that
      backwards salutes the sky.

      VRoid's A-pose is steeper than it looks: about 1.15 rad of rotation is
      needed to bring the arms to the sides, not the 0.65 that merely takes
      them from "jumping jack" to "slightly less alarming".

      The small X and elbow bend matter more than the number suggests. Arms
      hanging perfectly straight and flat against the body read as a shop
      mannequin; a few degrees forward with a softened elbow reads as a person
      standing still.
    */
    J_Bip_L_UpperArm: [0.08, 0, -1.15],
    J_Bip_R_UpperArm: [0.08, 0, 1.15],
    J_Bip_L_LowerArm: [0.12, 0, -0.16],
    J_Bip_R_LowerArm: [0.12, 0, 0.16],
  } as Record<string, [number, number, number]>,
} as const;

export type CharacterState = keyof typeof character.clips;
