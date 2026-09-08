import * as THREE from "three";

/**
 * Procedural locomotion.
 *
 * A VRoid export ships no animation clips, so the walk cycle is authored here
 * as bone rotations driven by a phase clock rather than baked keyframes.
 *
 * There is no state machine. Everything is driven by one continuous parameter
 * — `speed01`, the character's speed as a fraction of its run speed — and
 * every amplitude and cadence scales off it. That means idle→walk→run blends
 * for free and never pops, which is the thing crossfading discrete clips
 * usually gets wrong.
 *
 * Bone names follow VRoid's convention, so this works for any avatar exported
 * from VRoid Studio without modification.
 */

const BONES = {
  hips: "J_Bip_C_Hips",
  spine: "J_Bip_C_Spine",
  chest: "J_Bip_C_Chest",
  neck: "J_Bip_C_Neck",
  head: "J_Bip_C_Head",
  armL: "J_Bip_L_UpperArm",
  armR: "J_Bip_R_UpperArm",
  forearmL: "J_Bip_L_LowerArm",
  forearmR: "J_Bip_R_LowerArm",
  legL: "J_Bip_L_UpperLeg",
  legR: "J_Bip_R_UpperLeg",
  shinL: "J_Bip_L_LowerLeg",
  shinR: "J_Bip_R_LowerLeg",
  footL: "J_Bip_L_Foot",
  footR: "J_Bip_R_Foot",
} as const;

export type BoneKey = keyof typeof BONES;
export type Rig = Partial<Record<BoneKey, THREE.Object3D>>;

/** Rest rotations captured at load, which every pose is expressed relative to. */
export type BasePose = Map<THREE.Object3D, THREE.Euler>;

export function collectRig(root: THREE.Object3D): Rig {
  const rig: Rig = {};
  for (const [key, name] of Object.entries(BONES)) {
    const bone = root.getObjectByName(name);
    if (bone) rig[key as BoneKey] = bone;
  }
  return rig;
}

/**
 * Snapshots the rest rotations, including any `restPose` already applied.
 * Poses are added to these rather than replacing them, so the character's
 * authored stance is preserved underneath the motion.
 */
export function captureBase(rig: Rig): BasePose {
  const base: BasePose = new Map();
  for (const bone of Object.values(rig)) {
    if (bone) base.set(bone, bone.rotation.clone());
  }
  return base;
}

/** Hip height at rest, so the bob can be applied as an offset. */
export function captureHipHeight(rig: Rig): number {
  return rig.hips?.position.y ?? 0;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

interface PoseOptions {
  /** Speed as a fraction of run speed, 0..1. Drives everything. */
  speed01: number;
  /** Accumulated gait phase, in radians. */
  phase: number;
  /** Seconds, for the slow idle breathing clock. */
  elapsed: number;
  hipHeight: number;
}

function rotate(
  bone: THREE.Object3D | undefined,
  base: BasePose,
  x: number,
  y: number,
  z: number,
) {
  if (!bone) return;
  const rest = base.get(bone);
  if (!rest) return;
  bone.rotation.set(rest.x + x, rest.y + y, rest.z + z);
}

export function poseCharacter(rig: Rig, base: BasePose, o: PoseOptions): void {
  const { speed01, phase, elapsed, hipHeight } = o;
  const moving = Math.min(1, speed01 / 0.35); // full swing well before top speed

  /* ---- legs: opposite phase, knee bends on the back swing ---- */
  const swing = lerp(0, 0.85, moving);
  const legL = Math.sin(phase);
  const legR = Math.sin(phase + Math.PI);

  rotate(rig.legL, base, legL * swing, 0, 0);
  rotate(rig.legR, base, legR * swing, 0, 0);

  // Knees only bend one way. Taking the negative half of the swing and
  // clamping gives a bend that peaks as the foot lifts behind.
  const kneeL = Math.max(0, -legL) * lerp(0, 1.35, moving);
  const kneeR = Math.max(0, -legR) * lerp(0, 1.35, moving);
  rotate(rig.shinL, base, kneeL, 0, 0);
  rotate(rig.shinR, base, kneeR, 0, 0);

  // Ankles counter the shin so the foot stays roughly level with the ground.
  rotate(rig.footL, base, -kneeL * 0.45, 0, 0);
  rotate(rig.footR, base, -kneeR * 0.45, 0, 0);

  /* ---- arms: counter-swing against the opposite leg ---- */
  const armSwing = lerp(0.04, 0.65, moving);
  rotate(rig.armL, base, legR * armSwing, 0, 0);
  rotate(rig.armR, base, legL * armSwing, 0, 0);
  // Elbows tuck slightly as the arm comes forward.
  rotate(rig.forearmL, base, Math.max(0, legR) * lerp(0.05, 0.5, moving), 0, 0);
  rotate(rig.forearmR, base, Math.max(0, legL) * lerp(0.05, 0.5, moving), 0, 0);

  /* ---- torso: bob at twice cadence, plus a breathing idle ---- */
  const breathe = Math.sin(elapsed * 1.6) * 0.02 * (1 - moving);
  if (rig.hips) {
    rig.hips.position.y = hipHeight + Math.abs(Math.sin(phase)) * lerp(0, 0.055, moving);
  }
  // Hips roll into the stance leg; spine counter-rotates so the shoulders
  // stay level, which is what stops a procedural walk looking like a wobble.
  rotate(rig.hips, base, 0, legL * 0.06 * moving, Math.sin(phase) * 0.05 * moving);
  rotate(rig.spine, base, breathe, -legL * 0.09 * moving, 0);
  rotate(rig.chest, base, breathe * 0.5, -legL * 0.06 * moving, 0);

  /* ---- head: settles against the bob, and drifts while idle ---- */
  rotate(
    rig.neck,
    base,
    -Math.abs(Math.sin(phase)) * 0.05 * moving,
    Math.sin(elapsed * 0.5) * 0.06 * (1 - moving),
    0,
  );
  rotate(rig.head, base, breathe * -0.5, Math.sin(elapsed * 0.37) * 0.05 * (1 - moving), 0);
}

/** Radians of gait phase per second at a given speed fraction. */
export function cadenceFor(speed01: number): number {
  // Idle keeps a slow clock so weight-shift never fully freezes.
  return lerp(0.9, 11, Math.min(1, speed01));
}
