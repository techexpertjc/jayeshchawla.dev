"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame, type Panel } from "@/store/game";
import { palette } from "@/game/toon";

interface InteractableProps {
  id: string;
  /** Shown in the HUD prompt, e.g. "Examine the Trinity Gate". */
  label: string;
  /** Dialogue script to open. Provide this or `panel`. */
  scriptId?: string;
  /** Panel to open instead of a conversation. */
  panel?: "quests" | "inventory" | "stats" | "postcards";
  /** Position **within the parent group** — world position is derived. */
  position: [number, number, number];
  radius?: number;
  player: RefObject<THREE.Group | null>;
}

/**
 * Proximity trigger.
 *
 * Owns only the "is the player close enough" question; the E key and the
 * prompt live in the HUD, which reads `nearby` from the store. Keeping input
 * on the DOM side means the interaction still works in Story mode, where
 * there is no character controller running at all.
 */
/**
 * Everything currently within range, keyed by id.
 *
 * Interactables can overlap — the end of the road has both the postcard board
 * and the save point in reach — and whichever happened to write to the store
 * last used to win, which meant the prompt flickered between them as you
 * moved. Each one reports itself here instead, and `InteractableResolver`
 * picks the nearest once per frame.
 */
const candidates = new Map<
  string,
  { id: string; label: string; scriptId?: string; panel?: NonNullable<Panel>; distanceSq: number }
>();

/**
 * Picks the nearest candidate and publishes it.
 *
 * Must be rendered *after* the zones, because R3F runs `useFrame` callbacks in
 * mount order and this one has to see everything they reported this frame.
 */
export function InteractableResolver() {
  useFrame(() => {
    let winner: (typeof candidates extends Map<string, infer V> ? V : never) | null = null;
    for (const candidate of candidates.values()) {
      if (!winner || candidate.distanceSq < winner.distanceSq) winner = candidate;
    }

    const { nearby, setNearby } = useGame.getState();
    if ((winner?.id ?? null) === (nearby?.id ?? null)) return;

    setNearby(
      winner
        ? { id: winner.id, label: winner.label, scriptId: winner.scriptId, panel: winner.panel }
        : null,
    );
  });

  return null;
}

export function Interactable({
  id,
  label,
  scriptId,
  panel,
  position,
  radius = 5,
  player,
}: InteractableProps) {
  const marker = useRef<THREE.Mesh>(null);
  const inRange = useRef(false);
  /*
    World position is read off the marker's own matrix rather than taken from
    the `position` prop. Zones are rendered inside groups offset to their
    origin, so the prop is a local offset — comparing it directly against the
    player's world position would test proximity to the wrong place entirely,
    and every zone but the one at the origin would be unreachable.
  */
  const world = useMemo(() => new THREE.Vector3(), []);

  // A zone unmounting while the player stands in it would otherwise leave a
  // stale candidate forever.
  useEffect(() => () => void candidates.delete(id), [id]);

  useFrame((state) => {
    const group = player.current;
    const mesh = marker.current;
    if (!group || !mesh) return;

    mesh.getWorldPosition(world);

    const dx = group.position.x - world.x;
    const dz = group.position.z - world.z;
    const distanceSq = dx * dx + dz * dz;
    const near = distanceSq < radius * radius;

    // Reported to a plain Map, never straight to the store — the resolver
    // publishes the winner. A store write per frame per interactable would
    // re-render the whole HUD tree sixty times a second.
    if (near) candidates.set(id, { id, label, scriptId, panel, distanceSq });
    else candidates.delete(id);
    inRange.current = near;

    const t = state.clock.elapsedTime;
    mesh.position.y = position[1] + Math.sin(t * 2) * 0.18;
    mesh.rotation.y = t * 1.4;
    mesh.scale.setScalar(near ? 1.25 : 0.9);
  });

  return (
    <mesh ref={marker} position={position}>
      <octahedronGeometry args={[0.3, 0]} />
      <meshBasicMaterial color={palette.gold} toneMapped={false} />
    </mesh>
  );
}
