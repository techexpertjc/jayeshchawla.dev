"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ToonMesh } from "@/game/components/Toon";
import { Interactable } from "@/game/systems/Interactable";
import { geofenceState, pointInPolygon } from "@/game/systems/geofence";
import { addColliders } from "@/game/systems/colliders";
import { originOf } from "@/game/zones/layout";
import { palette } from "@/game/toon";
import { useGame } from "@/store/game";

const [OX, OZ] = originOf("xmplify");

/** Ground plane the vertex handles are dragged across. */
const GROUND = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

/** Breadcrumbs dropped along the agent's route. */
const TRAIL_LENGTH = 220;
const TRAIL_INTERVAL = 0.09;

const VERTEX_COUNT = geofenceState.polygon.length;

/** Where the story rails enter and leave, in local polar angle. */
const GATEWAY_ANGLES = [0.38, -2.71];

function shortestAngle(a: number): number {
  return ((a + Math.PI) % (Math.PI * 2)) - Math.PI;
}

/**
 * The Geofence Garden — Xmplify Technolabs.
 *
 * The signature interaction of the whole site: a boundary you can reshape by
 * dragging its corners while a field agent walks a fixed route through it.
 * Distance travelled inside the boundary earns money; distance outside earns
 * nothing. That is not an illustration of the feature Jayesh shipped, it is
 * the feature, running.
 */
export function Xmplify({ player }: { player: React.RefObject<THREE.Group | null> }) {
  const camera = useThree((s) => s.camera);
  const domElement = useThree((s) => s.gl.domElement);

  const fill = useRef<THREE.Mesh>(null);
  const edges = useRef<THREE.InstancedMesh>(null);
  const handles = useRef<Array<THREE.Mesh | null>>([]);
  const agent = useRef<THREE.Group>(null);
  const trail = useRef<THREE.InstancedMesh>(null);

  const dragIndex = useRef<number | null>(null);
  const lastAgent = useRef(new THREE.Vector2());
  const trailCursor = useRef(0);
  const trailClock = useRef(0);
  const shapeVersion = useRef("");

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointer = useMemo(() => new THREE.Vector2(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colour = useMemo(() => new THREE.Color(), []);

  const beginDrag = (index: number) => (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    dragIndex.current = index;
    geofenceState.dragging = true;
    // Tells CameraRig to stop orbiting, so dragging a corner does not also
    // swing the camera.
    useGame.getState().setWorldDrag(true);
  };

  useFrame((state, delta) => {
    /* ---- drag a corner onto the ground plane ---- */
    if (dragIndex.current !== null) {
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.ray.intersectPlane(GROUND, hit)) {
        geofenceState.polygon[dragIndex.current] = [hit.x - OX, hit.z - OZ];
      }
    }

    /* ---- rebuild boundary and fill when the shape changes ---- */
    const version = geofenceState.polygon
      .map(([x, z]) => `${x.toFixed(2)},${z.toFixed(2)}`)
      .join("|");

    // All three refs must exist before the version is banked, or a frame where
    // one is still null would mark the shape "built" and it would never be
    // rebuilt — an invisible fill for the rest of the session.
    if (version !== shapeVersion.current && fill.current && edges.current) {
      shapeVersion.current = version;

      /*
        The fill is a flat ShapeGeometry laid down with rotation.x = -PI/2,
        which maps local (x, y) to world (x, -y). Feeding the shape z directly
        would mirror the fill against the boundary, so it is negated here.
      */
      if (fill.current) {
        const shape = new THREE.Shape(
          geofenceState.polygon.map(([x, z]) => new THREE.Vector2(x, -z)),
        );
        fill.current.geometry.dispose();
        fill.current.geometry = new THREE.ShapeGeometry(shape);
      }

      /*
        Edges are beams rather than lines. `lineBasicMaterial` ignores
        linewidth on every major platform, so a line boundary renders as a
        one-pixel thread that all but disappears at distance — no good for the
        thing the whole zone is about.
      */
      if (edges.current) {
        geofenceState.polygon.forEach(([x, z], i) => {
          const [nx, nz] = geofenceState.polygon[(i + 1) % VERTEX_COUNT];
          const length = Math.hypot(nx - x, nz - z);

          dummy.position.set((x + nx) / 2, 0.07, (z + nz) / 2);
          dummy.rotation.set(0, Math.atan2(nx - x, nz - z), 0);
          dummy.scale.set(1, 1, length);
          dummy.updateMatrix();
          edges.current!.setMatrixAt(i, dummy.matrix);
        });
        edges.current.instanceMatrix.needsUpdate = true;
      }

      geofenceState.polygon.forEach(([x, z], i) => {
        handles.current[i]?.position.set(x, 0.9, z);
      });
    }

    /* ---- walk the field agent ---- */
    const t = state.clock.elapsedTime * 0.28;
    // A wandering loop, deliberately wider than the default boundary so the
    // route crosses in and out of it.
    const ax = Math.cos(t) * 15 + Math.cos(t * 2.3) * 3.5;
    const az = Math.sin(t) * 13 + Math.sin(t * 1.7) * 4;

    const inside = pointInPolygon(ax, az, geofenceState.polygon);
    const stepped = Math.hypot(ax - lastAgent.current.x, az - lastAgent.current.y);

    // Guard the first frame, when `last` is still at the origin and the
    // apparent step would be the whole distance from world zero.
    if (lastAgent.current.lengthSq() > 0 && stepped < 5) {
      if (inside) geofenceState.metresInside += stepped;
      else geofenceState.metresOutside += stepped;
    }

    lastAgent.current.set(ax, az);
    geofenceState.inside = inside;

    if (agent.current) {
      agent.current.position.set(ax, 0, az);
      agent.current.rotation.y = Math.atan2(
        -Math.sin(t) * 15 - Math.sin(t * 2.3) * 8,
        Math.cos(t) * 13 + Math.cos(t * 1.7) * 6.8,
      );
    }

    /* ---- drop breadcrumbs, coloured by whether they earned anything ---- */
    trailClock.current += delta;
    if (trail.current && trailClock.current >= TRAIL_INTERVAL) {
      trailClock.current = 0;
      const i = trailCursor.current;

      dummy.position.set(ax, 0.09, az);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.setScalar(inside ? 0.34 : 0.22);
      dummy.updateMatrix();

      trail.current.setMatrixAt(i, dummy.matrix);
      // Gold earned, ember unpaid — both read against the lawn, which jade
      // does not.
      trail.current.setColorAt(i, colour.set(inside ? palette.gold : palette.ember));
      trail.current.instanceMatrix.needsUpdate = true;
      if (trail.current.instanceColor) trail.current.instanceColor.needsUpdate = true;

      trailCursor.current = (i + 1) % TRAIL_LENGTH;
    }
  });

  /*
    An InstancedMesh starts with every instance at the identity matrix, so all
    220 breadcrumbs would sit stacked on the group origin at full scale until
    the agent happens to overwrite them — a white disc parked in the middle of
    the garden. Collapse them to zero scale up front and let the walk reveal
    them.
  */
  /* Hedges and the HRMS building are solid. The boundary is not — crossing it
     is the whole mechanic. */
  useEffect(
    () =>
      addColliders([
        { kind: "box", x: OX + 22, z: OZ - 22, hw: 4.8, hd: 3.8 },
        // Matches the rendered hedges, gaps included.
        ...Array.from({ length: 22 }, (_, i) => (i / 22) * Math.PI * 2)
          .filter((angle) => !GATEWAY_ANGLES.some((a) => Math.abs(shortestAngle(angle - a)) < 0.5))
          .map((angle) => ({
            kind: "circle" as const,
            x: OX + Math.cos(angle) * 26,
            z: OZ + Math.sin(angle) * 24,
            r: 2.1,
          })),
      ]),
    [],
  );

  useEffect(() => {
    if (!trail.current) return;
    const hidden = new THREE.Object3D();
    hidden.scale.setScalar(0);
    hidden.updateMatrix();

    for (let i = 0; i < TRAIL_LENGTH; i++) trail.current.setMatrixAt(i, hidden.matrix);
    trail.current.instanceMatrix.needsUpdate = true;
  }, []);

  /* Pointer position is tracked on the canvas so the drag raycast has
     somewhere to aim, and released globally so letting go off-canvas still
     ends the drag. */
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const rect = domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
    };

    const up = () => {
      if (dragIndex.current === null) return;
      dragIndex.current = null;
      geofenceState.dragging = false;
      useGame.getState().setWorldDrag(false);
      domElement.style.cursor = "";
    };

    domElement.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      domElement.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [domElement, pointer]);

  return (
    <group position={[OX, 0, OZ]}>
      {/* Boundary fill */}
      <mesh ref={fill} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <shapeGeometry />
        {/* Gold, not jade: the lawn is jade, and a jade boundary on a jade
            lawn is invisible. Gold also happens to be the right colour for
            the line that decides what gets paid. */}
        <meshBasicMaterial
          color={palette.gold}
          transparent
          opacity={0.22}
          side={THREE.DoubleSide}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {/*
        The boundary is painted on the ground, not built on it.

        It was waist-high beams, which looked solid and therefore looked broken
        when anything walked through — and worse, contradicted the mechanic: the
        field agent has to cross this line constantly for the zone to mean
        anything. A geofence is a line on a map. Paint is the honest rendering.
      */}
      <instancedMesh
        ref={edges}
        args={[undefined, undefined, VERTEX_COUNT]}
        frustumCulled={false}
      >
        <boxGeometry args={[0.55, 0.04, 1]} />
        <meshBasicMaterial color={palette.gold} toneMapped={false} />
      </instancedMesh>

      {/* Draggable corners */}
      {geofenceState.polygon.map((_, i) => (
        <mesh
          key={i}
          ref={(node) => {
            handles.current[i] = node;
          }}
          position={[0, 0.9, 0]}
          onPointerDown={beginDrag(i)}
          onPointerOver={() => (domElement.style.cursor = "grab")}
          onPointerOut={() => {
            if (dragIndex.current === null) domElement.style.cursor = "";
          }}
        >
          <sphereGeometry args={[0.6, 14, 14]} />
          <meshBasicMaterial color={palette.gold} toneMapped={false} />
        </mesh>
      ))}

      {/* Agent's breadcrumb trail */}
      <instancedMesh ref={trail} args={[undefined, undefined, TRAIL_LENGTH]} frustumCulled={false}>
        <circleGeometry args={[0.5, 8]} />
        <meshBasicMaterial toneMapped={false} transparent opacity={0.7} />
      </instancedMesh>

      {/* The field agent */}
      <group ref={agent}>
        <ToonMesh color={palette.sakuraDeep} position={[0, 0.55, 0]} outline={7}>
          <capsuleGeometry args={[0.32, 0.7, 4, 10]} />
        </ToonMesh>
        <ToonMesh color={palette.paper} position={[0, 1.35, 0]} outline={7}>
          <sphereGeometry args={[0.32, 12, 12]} />
        </ToonMesh>
        {/* Satchel — the thing whose contents get paid for. */}
        <ToonMesh color={palette.ember} position={[0.34, 0.75, -0.1]} outline={5}>
          <boxGeometry args={[0.3, 0.34, 0.22]} />
        </ToonMesh>
      </group>

      {/* HRMS building — the system all of this reported into. */}
      <group position={[22, 0, -22]}>
        <ToonMesh color={palette.stone} position={[0, 4, 0]}>
          <boxGeometry args={[9, 8, 7]} />
        </ToonMesh>
        {[0, 1, 2].map((row) =>
          [-2.6, 0, 2.6].map((x) => (
            <ToonMesh
              key={`${row}:${x}`}
              color={palette.skyHorizon}
              emissive={palette.skyHorizon}
              emissiveIntensity={0.8}
              position={[x, 2.2 + row * 2.2, 3.55]}
              outline={4}
            >
              <boxGeometry args={[1.5, 1.2, 0.14]} />
            </ToonMesh>
          )),
        )}
      </group>

      {/* Hedges framing the garden. Darker than the lawn on purpose — jade on
          jade renders as a floating outline and nothing else. Two gaps are
          left where the story path enters and leaves, so the walk in goes
          through an opening instead of through a hedge. */}
      {Array.from({ length: 22 }, (_, i) => {
        const angle = (i / 22) * Math.PI * 2;
        if (GATEWAY_ANGLES.some((a) => Math.abs(shortestAngle(angle - a)) < 0.5)) return null;
        return (
          <ToonMesh
            key={angle}
            color={palette.moss}
            position={[Math.cos(angle) * 26, 0.8, Math.sin(angle) * 24]}
            rotation={[0, -angle, 0]}
            outline={6}
          >
            <boxGeometry args={[4.4, 1.6, 1.2]} />
          </ToonMesh>
        );
      })}

      <Interactable
        id="geofence-garden"
        label="Examine the Geofence Garden"
        scriptId="xmplify"
        position={[0, 3.4, 0]}
        radius={12}
        player={player}
      />
    </group>
  );
}
