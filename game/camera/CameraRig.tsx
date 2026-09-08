"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { railsState, sampleRails } from "@/game/camera/rails";
import { useGame } from "@/store/game";

interface CameraRigProps {
  target: RefObject<THREE.Group | null>;
  distance?: number;
  minDistance?: number;
  maxDistance?: number;
  lookHeight?: number;
  /** Higher follows more tightly. Frame-rate independent. */
  damping?: number;
}

/**
 * The only thing that touches the camera.
 *
 * Both modes resolve to the same two vectors — a desired position and a focus
 * point — and a single damped lerp chases them. That is what makes switching
 * modes blend for free: nothing cuts, the destination simply changes and the
 * damping carries the camera across. Two separate camera components would
 * fight over the same object and need an explicit crossfade.
 */
export function CameraRig({
  target,
  distance = 9,
  minDistance = 4,
  maxDistance = 20,
  lookHeight = 1.4,
  damping = 6,
}: CameraRigProps) {
  const camera = useThree((s) => s.camera);
  const domElement = useThree((s) => s.gl.domElement);

  const yaw = useRef(0);
  const pitch = useRef(0.3);
  const dist = useRef(distance);

  const desired = useMemo(() => new THREE.Vector3(), []);
  const focus = useMemo(() => new THREE.Vector3(), []);

  /*
    Listeners are bound once and gate on the mode imperatively, rather than
    rebinding when the mode changes. Components inside <Canvas> live in R3F's
    own React root, and a zustand subscription there does not reliably
    re-render them — so scene code reads state with getState() in the handler
    or the frame loop instead. That is also the right shape for the render
    loop: subscribing would re-render scene nodes on every store write.
  */
  useEffect(() => {
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const down = (e: PointerEvent) => {
      const { mode, worldDrag } = useGame.getState();
      // In Story mode a drag belongs to the page, so it can scroll; and if the
      // world already claimed this gesture, it is not the camera's to take.
      if (mode !== "explore" || worldDrag) return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      // Capture is best-effort; see the note in TouchControls.
      try {
        domElement.setPointerCapture(e.pointerId);
      } catch {
        // Drag still tracks via the move handler.
      }
    };

    const move = (e: PointerEvent) => {
      if (!dragging) return;
      yaw.current -= (e.clientX - lastX) * 0.005;
      pitch.current = THREE.MathUtils.clamp(
        pitch.current + (e.clientY - lastY) * 0.004,
        0.06,
        1.25,
      );
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const up = (e: PointerEvent) => {
      dragging = false;
      if (domElement.hasPointerCapture(e.pointerId)) domElement.releasePointerCapture(e.pointerId);
    };

    const wheel = (e: WheelEvent) => {
      if (useGame.getState().mode !== "explore") return;
      e.preventDefault();
      dist.current = THREE.MathUtils.clamp(dist.current + e.deltaY * 0.01, minDistance, maxDistance);
    };

    domElement.addEventListener("pointerdown", down);
    domElement.addEventListener("pointermove", move);
    domElement.addEventListener("pointerup", up);
    domElement.addEventListener("pointercancel", up);
    domElement.addEventListener("wheel", wheel, { passive: false });

    return () => {
      domElement.removeEventListener("pointerdown", down);
      domElement.removeEventListener("pointermove", move);
      domElement.removeEventListener("pointerup", up);
      domElement.removeEventListener("pointercancel", up);
      domElement.removeEventListener("wheel", wheel);
    };
  }, [domElement, minDistance, maxDistance]);

  useFrame((_, delta) => {
    const { mode, cinematic } = useGame.getState();

    /*
      A claimed shot outranks everything. It resolves to the same desired /
      focus pair as the other modes, so the damping below flies the camera to
      it and back rather than cutting — a set piece that snaps into place
      looks like a bug.
    */
    if (cinematic) {
      desired.set(...cinematic.position);
      focus.set(...cinematic.focus);
    } else if (mode === "story") {
      const { point, tangent } = sampleRails(railsState.t);

      // Sit back along the path and above it, aiming a little ahead of the
      // player so the destination leads the eye rather than the subject.
      desired.set(
        point.x - tangent.x * 7.5,
        point.y + 3.4,
        point.z - tangent.z * 7.5,
      );
      focus.set(
        point.x + tangent.x * 2.5,
        point.y + lookHeight,
        point.z + tangent.z * 2.5,
      );

      // Keep the explore rig's yaw in sync with the path heading, so toggling
      // out of Story mode does not snap the camera to a stale angle.
      yaw.current = Math.atan2(-tangent.x, -tangent.z);
    } else {
      const group = target.current;
      if (!group) return;

      focus.copy(group.position);
      focus.y += lookHeight;

      const horizontal = Math.cos(pitch.current) * dist.current;
      desired.set(
        focus.x + Math.sin(yaw.current) * horizontal,
        focus.y + Math.sin(pitch.current) * dist.current,
        focus.z + Math.cos(yaw.current) * horizontal,
      );
    }

    /*
      Exponential damping, not a fixed lerp factor: lerp(a, b, 0.1) covers more
      ground per second at 120fps than at 30, so the camera would feel
      different on different machines.
    */
    camera.position.lerp(desired, 1 - Math.exp(-damping * delta));
    camera.lookAt(focus);
  });

  return null;
}
