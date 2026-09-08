"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
// From `three` itself, not three-stdlib — the latter is only a transitive
// dependency of drei, and depending on it directly would be depending on
// drei's implementation detail.
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";
import { character, type CharacterState } from "@/game/player/character";
import { useInput } from "@/game/player/useInput";
import { readInput, type MoveIntent } from "@/game/player/inputState";
import {
  cadenceFor,
  captureBase,
  captureHipHeight,
  collectRig,
  poseCharacter,
} from "@/game/player/procedural";
import { railsState, sampleRails } from "@/game/camera/rails";
import { spawnFor, zoneOrigins } from "@/game/zones/layout";
import type { ZoneId } from "@/content/save-file";
import { resolveCollisions } from "@/game/systems/colliders";
import { toonify } from "@/game/toon";
import { useGame } from "@/store/game";

const UP = new THREE.Vector3(0, 1, 0);

/**
 * Keeps the character inside the playable area until real collision exists.
 * Must comfortably contain every zone origin in `zones/layout.ts` — the
 * furthest sits ~140 units out, and a clamp tighter than that would make
 * later regions unreachable on foot.
 */
const BOUNDS_RADIUS = 215;

/** Roughly the fox's footprint. Collision is resolved as a circle this wide. */
const PLAYER_RADIUS = 0.8;

export function Player({ target }: { target: RefObject<THREE.Group | null> }) {
  const { scene, animations } = useGLTF(character.url);
  const camera = useThree((s) => s.camera);
  useInput();
  /*
    Game state is read imperatively inside the frame loop, never subscribed to.
    Components under <Canvas> render in R3F's own React root, where a zustand
    subscription does not reliably re-render them — and subscribing would be
    wrong here anyway, since it would re-render scene nodes on every store
    write. See the same note in CameraRig.
  */
  const lastRailsT = useRef(0);

  /*
    SkeletonUtils.clone rather than the raw scene: useGLTF caches by URL, so
    the same object would be shared by every mount. A plain .clone() would also
    break here — it does not rebind skinned meshes to the cloned skeleton.
  */
  const model = useMemo(() => {
    const cloned = SkeletonUtils.clone(scene);
    toonify(cloned);

    // Interim rest pose — see the note on `character.restPose`.
    for (const [bone, [x, y, z]] of Object.entries(character.restPose)) {
      cloned.getObjectByName(bone)?.rotation.set(x, y, z);
    }

    return cloned;
  }, [scene]);

  const { actions } = useAnimations(animations, model);
  const state = useRef<CharacterState>("idle");

  /*
    A VRoid export contains no clips, so locomotion is generated. If a model
    ever does ship animations they take precedence — the procedural pass would
    only fight them for control of the same bones.
  */
  const hasClips = animations.length > 0;
  const rig = useMemo(() => collectRig(model), [model]);
  const basePose = useMemo(() => captureBase(rig), [rig]);
  const hipHeight = useMemo(() => captureHipHeight(rig), [rig]);
  const phase = useRef(0);
  /** Smoothed speed as a fraction of run speed. The whole gait derives from it. */
  const gait = useRef(0);

  // Scratch vectors, allocated once. Allocating inside useFrame is how you
  // hand the garbage collector a stutter every few seconds.
  const forward = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const move = useMemo(() => new THREE.Vector3(), []);
  const railsTarget = useMemo(() => new THREE.Vector3(), []);
  const resolved = useMemo(() => ({ x: 0, z: 0 }), []);
  const intent = useMemo<MoveIntent>(() => ({ x: 0, y: 0, run: false }), []);

  useEffect(() => {
    const idle = actions[character.clips.idle];
    idle?.reset().play();
    state.current = "idle";
  }, [actions]);

  /*
    `?at=<zone>` spawns straight into a region in Explore mode — walking from
    the gate to the far side of the world to check a change gets old fast.
    Also switches out of Story, since the rails would otherwise drag the
    player back onto the path immediately.
  */
  useEffect(() => {
    const at = new URLSearchParams(window.location.search).get("at");
    if (!at || !(at in zoneOrigins)) return;

    const [x, z] = spawnFor(at as ZoneId);
    target.current?.position.set(x, character.yOffset, z);
    useGame.getState().setMode("explore");
  }, [target]);

  const transitionTo = (next: CharacterState) => {
    if (state.current === next) return;
    const from = actions[character.clips[state.current]];
    const to = actions[character.clips[next]];
    state.current = next;
    if (!to) return;
    to.reset().play();
    if (from) from.crossFadeTo(to, character.crossfade, false);
    else to.fadeIn(character.crossfade);
  };

  /**
   * Eases the gait toward its target and poses the skeleton for this frame.
   *
   * The easing is what makes starting and stopping read as acceleration
   * rather than a switch flipping — amplitudes and cadence both scale off
   * this one number, so the legs wind up and down instead of snapping
   * between a walk cycle and a static pose.
   */
  const applyGait = (targetGait: number, elapsed: number, delta: number) => {
    if (hasClips) return;

    gait.current += (targetGait - gait.current) * (1 - Math.exp(-9 * delta));
    phase.current += cadenceFor(gait.current) * delta;

    poseCharacter(rig, basePose, {
      speed01: gait.current,
      phase: phase.current,
      elapsed,
      hipHeight,
    });
  };

  /** Turns toward `desired` by the shortest arc. */
  const turnToward = (group: THREE.Group, desired: number, delta: number) => {
    const diff = ((desired - group.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI;
    group.rotation.y += diff * Math.min(1, character.turnSpeed * delta);
  };

  useFrame((rootState, delta) => {
    const group = target.current;
    if (!group) return;

    /** Where the gait wants to be this frame, 0 = still, 1 = full run. */
    let targetGait = 0;

    const { mode, dialogue, questCard, panel, cinematic, setMoving } = useGame.getState();
    /** Anything owning the screen also owns the keyboard — stop walking. */
    const frozen =
      dialogue !== null ||
      questCard !== null ||
      panel !== null ||
      cinematic?.lockPlayer === true;

    /*
      Story mode: the player is carried by the rails rather than driven by
      input, so scrolling reads as walking the path. Because both modes write
      the same group, switching to Explore simply hands control over wherever
      the player currently stands — no teleport, no reset.
    */
    if (mode === "story") {
      const { point, tangent } = sampleRails(railsState.t);

      /*
        Lerped rather than set. At this damping it tracks the scroll tightly
        enough to feel direct, but it also means switching out of Explore
        walks the player back onto the path over a few frames instead of
        teleporting them.
      */
      railsTarget.set(point.x, character.yOffset, point.z);
      group.position.lerp(railsTarget, 1 - Math.exp(-16 * delta));
      turnToward(group, Math.atan2(tangent.x, tangent.z) + character.facingOffset, delta);

      const scrolling = Math.abs(railsState.t - lastRailsT.current) > 0.00004;
      lastRailsT.current = railsState.t;
      transitionTo(scrolling ? "walk" : "idle");
      setMoving(scrolling);
      // Scrolling is walking, so the gait runs at walking pace.
      targetGait = scrolling ? character.walkSpeed / character.runSpeed : 0;
      return applyGait(targetGait, rootState.clock.elapsedTime, delta);
    }

    const { x, y, run } = frozen
      ? { x: 0, y: 0, run: false }
      : readInput(intent);
    const magnitude = Math.min(1, Math.hypot(x, y));

    if (magnitude < 0.01) {
      transitionTo("idle");
      setMoving(false);
      return applyGait(0, rootState.clock.elapsedTime, delta);
    }

    // Move relative to where the camera is looking, not to world axes —
    // otherwise "forward" stops meaning forward the moment the camera turns.
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.crossVectors(forward, UP).normalize();

    move.set(0, 0, 0).addScaledVector(forward, y).addScaledVector(right, x).normalize();

    const speed = run ? character.runSpeed : character.walkSpeed;
    group.position.addScaledVector(move, speed * magnitude * delta);
    group.position.y = character.yOffset;

    // Push back out of anything solid before the frame is committed.
    resolveCollisions(group.position.x, group.position.z, PLAYER_RADIUS, resolved);
    group.position.x = resolved.x;
    group.position.z = resolved.z;

    // Soft circular boundary. Replaced by real colliders once zones exist.
    const distance = Math.hypot(group.position.x, group.position.z);
    if (distance > BOUNDS_RADIUS) {
      group.position.x *= BOUNDS_RADIUS / distance;
      group.position.z *= BOUNDS_RADIUS / distance;
    }

    turnToward(group, Math.atan2(move.x, move.z) + character.facingOffset, delta);

    transitionTo(run ? "run" : "walk");
    setMoving(true);
    targetGait = (speed * magnitude) / character.runSpeed;
    applyGait(targetGait, rootState.clock.elapsedTime, delta);
  });

  return (
    <group ref={target} position={[0, character.yOffset, 6]}>
      <primitive object={model} scale={character.scale} />
    </group>
  );
}

useGLTF.preload(character.url);
