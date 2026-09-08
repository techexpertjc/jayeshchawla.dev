"use client";

import { useEffect } from "react";
import { inputState } from "@/game/player/inputState";

const AXES = { up: 0, down: 0, left: 0, right: 0 };

const KEY_MAP: Record<string, keyof typeof AXES> = {
  KeyW: "up",
  ArrowUp: "up",
  KeyS: "down",
  ArrowDown: "down",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
};

/**
 * Keyboard movement input.
 *
 * Writes into the shared `inputState.keyboard` rather than returning state:
 * this is read every frame inside useFrame, and re-rendering React sixty times
 * a second to move a character would be the single worst thing we could do to
 * the frame budget.
 */
export function useInput() {
  useEffect(() => {
    const held = { ...AXES };

    const apply = () => {
      inputState.keyboard.x = held.right - held.left;
      inputState.keyboard.y = held.up - held.down;
    };

    const onKey = (event: KeyboardEvent, pressed: 0 | 1) => {
      if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
        inputState.keyboard.run = pressed === 1;
        return;
      }
      const axis = KEY_MAP[event.code];
      if (!axis) return;
      // Stop WASD and arrows from scrolling the page underneath the canvas.
      event.preventDefault();
      held[axis] = pressed;
      apply();
    };

    const down = (e: KeyboardEvent) => onKey(e, 1);
    const up = (e: KeyboardEvent) => onKey(e, 0);

    // Releasing a key while the tab is hidden never fires keyup; without this
    // the character walks forever after an alt-tab.
    const clear = () => {
      held.up = held.down = held.left = held.right = 0;
      inputState.keyboard.run = false;
      apply();
    };

    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __input?: unknown }).__input = inputState;
    }

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
      clear();
    };
  }, []);
}
