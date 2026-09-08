"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { postcards } from "@/content/postcards";
import { ToonMesh } from "@/game/components/Toon";
import { Interactable } from "@/game/systems/Interactable";
import { addColliders } from "@/game/systems/colliders";
import { originOf } from "@/game/zones/layout";
import { palette } from "@/game/toon";

const [OX, OZ] = originOf("tavern");

/** The photo inside a postcard's paper border. Shared with the UV crop below, so the two cannot drift apart. */
const FRAME_W = 1.38;
const FRAME_H = 0.92;

/**
 * Traveller's Rest — the save point.
 *
 * Where the road ends and you get in touch. The crystal outside is the save
 * icon every player already knows how to read, which is a cheaper way of
 * saying "contact me" than a form would be.
 */
export function Tavern({ player }: { player: React.RefObject<THREE.Group | null> }) {
  const crystal = useRef<THREE.Mesh>(null);
  const lanterns = useRef<Array<THREE.Mesh | null>>([]);

  const photos = useTexture(postcards.map((card) => card.src));
  useMemo(() => {
    for (const texture of photos) {
      /*
        Photographs are sRGB. Without this they render washed out and pale,
        because three assumes linear data unless told otherwise.
      */
      texture.colorSpace = THREE.SRGBColorSpace;

      /*
        Crop to fill the frame rather than stretch to it — `object-fit: cover`
        done in UV space. The frame is 3:2 and a phone camera is 16:9, so
        without this every photograph on the board is squeezed narrow and
        everything standing in one is drawn too tall. Cropping loses a little
        off the edges; stretching loses the picture.
      */
      const image = texture.image as { width?: number; height?: number } | undefined;
      if (!image?.width || !image?.height) continue;

      const frame = FRAME_W / FRAME_H;
      const photo = image.width / image.height;

      if (photo > frame) texture.repeat.set(frame / photo, 1);
      else texture.repeat.set(1, photo / frame);

      texture.offset.set((1 - texture.repeat.x) / 2, (1 - texture.repeat.y) / 2);
    }
  }, [photos]);

  /*
    The inn only — the courtyard is a floor, not an obstacle.

    Colliders are world-space and know nothing about the group transform, so
    the quarter turn is applied by hand: the inn's local (0, -4) lands at
    (+4, 0) in world terms, and its half-extents swap.
  */
  useEffect(
    () => addColliders([{ kind: "box", x: OX + 4, z: OZ, hw: 4.2, hd: 6.8 }]),
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (crystal.current) {
      crystal.current.rotation.y = t * 0.8;
      // Floats above the postcard wall rather than in front of it — at 2.4 it
      // sat squarely over the third photograph.
      crystal.current.position.y = 3.2 + Math.sin(t * 1.5) * 0.22;
    }

    lanterns.current.forEach((lantern, i) => {
      if (!lantern) return;
      // Slight, unsynchronised flicker — lanterns pulsing in lockstep read as
      // a shader, not as firelight.
      lantern.scale.setScalar(1 + Math.sin(t * 3 + i * 1.7) * 0.05);
    });
  });

  /*
    The whole inn is turned to face the road rather than the road being bent
    to meet the inn.

    The story arrives from the west, and the tavern is authored facing +Z. A
    quarter turn puts its front, its crystal and its postcard wall square to
    the approach, which is both a straighter path and a better arrival than
    curving around to the north ever was.

    Everything below is authored in the zone's own space; only this rotation
    and the collider (which is world-space, so its extents swap) know about it.
  */
  return (
    <group position={[OX, 0, OZ]} rotation={[0, -Math.PI / 2, 0]}>
      {/* Courtyard */}
      <ToonMesh color={palette.stone} position={[0, 0.25, 2]} outline={8}>
        <cylinderGeometry args={[11, 11.6, 0.5, 24]} />
      </ToonMesh>

      {/* The inn */}
      <ToonMesh color={palette.paper} position={[0, 3, -4]} outline={8}>
        <boxGeometry args={[13, 6, 8]} />
      </ToonMesh>
      <ToonMesh color={palette.wood} position={[0, 7.2, -4]} outline={8}>
        <coneGeometry args={[9.5, 3.4, 4]} />
      </ToonMesh>

      {/* Windows, lit from inside. */}
      {[-4, 0, 4].map((x) => (
        <ToonMesh
          key={x}
          color={palette.gold}
          emissive={palette.gold}
          emissiveIntensity={1.8}
          position={[x, 3.2, 0.05]}
          outline={5}
        >
          <boxGeometry args={[2.2, 2, 0.14]} />
        </ToonMesh>
      ))}

      {/* Door */}
      <ToonMesh color={palette.woodDark} position={[0, 1.6, 0.05]} outline={6}>
        <boxGeometry args={[2, 3.2, 0.18]} />
      </ToonMesh>

      {/* Hanging lanterns either side. */}
      {[-6.5, 6.5].map((x, i) => (
        <mesh
          key={x}
          ref={(node) => {
            lanterns.current[i] = node;
          }}
          position={[x, 4.4, 0.4]}
        >
          <sphereGeometry args={[0.55, 12, 12]} />
          <meshBasicMaterial color={palette.gold} toneMapped={false} />
        </mesh>
      ))}

      {/*
        Postcard board — the travelling, pinned up.

        Set just *behind* the save point rather than beside it, so the arrival
        shot has the crystal floating in front of the wall and both are centred.
        Beside would work on a desktop and fail on a phone: in portrait the
        horizontal field of view is roughly 20 degrees, and Story mode gives no
        way to look around, so anything off to one side is simply not there.
      */}
      <group position={[-2, 0, 4.5]} rotation={[0, 0.12, 0]}>
        <ToonMesh color={palette.woodDark} position={[0, 1.5, 0]} outline={7}>
          <boxGeometry args={[5.2, 3, 0.24]} />
        </ToonMesh>

        {postcards.map((card, i) => {
          // Laid out in a row, each tilted slightly the opposite way — pinned
          // by hand, not hung by a gallery.
          const spread = 1.5;
          const x = (i - (postcards.length - 1) / 2) * spread;
          const tilt = (i % 2 ? 1 : -1) * 0.06;

          return (
            <group key={card.src} position={[x, 1.6, 0.14]} rotation={[0, 0, tilt]}>
              {/* Paper border behind the photo. */}
              <ToonMesh color={palette.paper} outline={4}>
                <boxGeometry args={[1.55, 1.12, 0.05]} />
              </ToonMesh>
              <mesh position={[0, 0.04, 0.04]}>
                <planeGeometry args={[FRAME_W, FRAME_H]} />
                {/*
                  Unlit on purpose. A photograph run through the toon ramp
                  gets banded and colour-shifted, which is fine for a prop and
                  wrong for a picture — these should read as photographs
                  pinned to the world, not as objects in it.
                */}
                <meshBasicMaterial map={photos[i]} toneMapped={false} />
              </mesh>
            </group>
          );
        })}

        <Interactable
          id="postcards"
          label="Look at the postcards"
          panel="postcards"
          position={[0, 3.6, 0]}
          /* Tighter than the inn's, so arriving offers "get in touch" and the
             postcards need a deliberate step toward the wall. */
          radius={5}
          player={player}
        />
      </group>

      {/*
        Save point, set well out toward the road.

        The journey passes it and *then* reaches the postcard wall, so the last
        thing on the road is the personal note rather than the call to action.
        That means the two need real distance between them — sat close
        together, arriving lands you between the pair and the prompt picks
        whichever it happens to be nearest.
      */}
      <mesh ref={crystal} position={[0, 3.2, 12]}>
        <octahedronGeometry args={[0.9, 0]} />
        <meshBasicMaterial color={palette.sakura} toneMapped={false} />
      </mesh>

      <Interactable
        id="tavern"
        label="Rest and get in touch"
        scriptId="tavern"
        position={[0, 4.4, 12]}
        radius={9}
        player={player}
      />
    </group>
  );
}
