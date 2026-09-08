"use client";

import { useEffect, useRef, useState } from "react";
import { inputState } from "@/game/player/inputState";
import { useGame } from "@/store/game";

/** Radius of the stick's travel, in CSS pixels. */
const RADIUS = 52;
/** Past this fraction of full deflection the character breaks into a run. */
const RUN_THRESHOLD = 0.82;

/**
 * On-screen movement stick for touch devices.
 *
 * Writes into `inputState.touch`, the same channel the keyboard uses, so the
 * character controller needs to know nothing about how the intent arrived.
 *
 * Deliberately not a fixed puck: the stick centres wherever the thumb lands
 * inside its zone. Fixed sticks demand the player look at their hand.
 *
 * There is no separate run button. Pushing the stick to its edge runs, which
 * is how every console game has worked for twenty-five years and costs no
 * screen space on a device that has none to spare.
 */
export function TouchControls() {
  const mode = useGame((s) => s.mode);
  const dialogue = useGame((s) => s.dialogue);
  const questCard = useGame((s) => s.questCard);
  const panel = useGame((s) => s.panel);
  const nearby = useGame((s) => s.nearby);
  const engageNearby = useGame((s) => s.engageNearby);

  const zone = useRef<HTMLDivElement>(null);
  const pointerId = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const [knob, setKnob] = useState<{ x: number; y: number } | null>(null);

  const busy = !!dialogue || !!questCard || !!panel;

  /*
    Two independent affordances, gated separately.

    The stick belongs to Explore mode. The interact button does NOT — Story
    mode is the default on a phone, and interactables sit right on the rails,
    so tying the button to Explore left touch users with no way to interact
    with anything at all. Desktop hid the bug because `E` is bound globally.
  */
  const active = mode === "explore" && !busy;
  const canInteract = !!nearby && !busy;

  // Release the stick whenever the controls go away, or the character keeps
  // walking in whatever direction it was last pushed.
  useEffect(() => {
    if (active) return;
    inputState.touch.x = 0;
    inputState.touch.y = 0;
    inputState.touch.run = false;
    setKnob(null);
  }, [active]);

  useEffect(() => {
    const element = zone.current;
    if (!element || !active) return;

    const write = (dx: number, dy: number) => {
      const distance = Math.hypot(dx, dy);
      const clamped = Math.min(distance, RADIUS);
      const nx = distance > 0 ? (dx / distance) * clamped : 0;
      const ny = distance > 0 ? (dy / distance) * clamped : 0;

      setKnob({ x: nx, y: ny });

      const deflection = clamped / RADIUS;
      inputState.touch.x = nx / RADIUS;
      // Screen y grows downward; forward is negative dy.
      inputState.touch.y = -ny / RADIUS;
      inputState.touch.run = deflection > RUN_THRESHOLD;
    };

    const down = (e: PointerEvent) => {
      if (pointerId.current !== null) return;
      pointerId.current = e.pointerId;
      origin.current = { x: e.clientX, y: e.clientY };
      /*
        Capture is an optimisation, not a requirement — it keeps the stick
        tracking when the thumb slides outside the zone. Some browsers throw
        if the pointer is already gone, and losing the stick to an exception
        would strand the character mid-walk.
      */
      try {
        element.setPointerCapture(e.pointerId);
      } catch {
        // Tracked without capture; pointerup still lands on the element.
      }
      write(0, 0);
    };

    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointerId.current) return;
      e.preventDefault();
      write(e.clientX - origin.current.x, e.clientY - origin.current.y);
    };

    const up = (e: PointerEvent) => {
      if (e.pointerId !== pointerId.current) return;
      pointerId.current = null;
      inputState.touch.x = 0;
      inputState.touch.y = 0;
      inputState.touch.run = false;
      setKnob(null);
    };

    element.addEventListener("pointerdown", down);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", up);
    element.addEventListener("pointercancel", up);

    return () => {
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", up);
      element.removeEventListener("pointercancel", up);
    };
  }, [active]);

  return (
    <>
      {/*
        The stick's catchment area. Bottom-left, sized for a thumb, and clear
        of the menu bar above it. `touch-action: none` so dragging here never
        scrolls or zooms the page.
      */}
      <div
        ref={zone}
        aria-hidden
        className={`fixed bottom-16 left-0 z-20 h-48 w-1/2 max-w-[240px] touch-none select-none ${
          active ? "" : "pointer-events-none opacity-0"
        }`}
      >
        {/*
          A resting target when nothing is pressed. The stick still centres
          wherever the thumb lands — this exists purely so the control is
          discoverable, because an invisible one is indistinguishable from
          none at all.
        */}
        {!knob && (
          <div
            className="pointer-events-none absolute bottom-8 left-9 size-[104px] rounded-full border border-paper-100/25 bg-ink-900/15"
            aria-hidden
          >
            <div className="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sakura-400/40 bg-sakura-400/15" />
          </div>
        )}

        {knob && (
          <div
            className="pointer-events-none absolute"
            style={{
              left: origin.current.x - (zone.current?.getBoundingClientRect().left ?? 0),
              top: origin.current.y - (zone.current?.getBoundingClientRect().top ?? 0),
            }}
          >
            <div
              className="absolute rounded-full border border-paper-100/30 bg-ink-900/20"
              style={{
                width: RADIUS * 2,
                height: RADIUS * 2,
                left: -RADIUS,
                top: -RADIUS,
              }}
            />
            <div
              className="absolute rounded-full border border-sakura-400/70 bg-sakura-400/30 backdrop-blur-sm"
              style={{ width: 52, height: 52, left: knob.x - 26, top: knob.y - 26 }}
            />
          </div>
        )}
      </div>

      {/*
        Interact button. Available in BOTH modes — it is the touch equivalent
        of the E key, and E is not mode-specific. Labelled with what it acts
        on, so it carries the same information the desktop prompt does rather
        than making the visitor guess.
      */}
      {canInteract && (
        <button
          type="button"
          onClick={engageNearby}
          /* Right-aligned, never full width: the stick owns the bottom-left
             in Explore mode and a full-width pill would sit on top of it. */
          className="fixed bottom-20 right-4 z-30 flex max-w-[62%] items-center gap-2 rounded-full border-2 border-sakura-400/70 bg-ink-900/80 px-4 py-3 text-left backdrop-blur-sm active:scale-[0.98]"
        >
          <span aria-hidden className="text-sakura-400">◉</span>
          <span className="font-[family-name:var(--font-display)] text-sm leading-tight text-sakura-300">
            {nearby.label}
          </span>
        </button>
      )}
    </>
  );
}
