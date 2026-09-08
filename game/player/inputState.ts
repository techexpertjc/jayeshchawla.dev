/**
 * Movement intent, shared between every input device and the character
 * controller.
 *
 * Keyboard and touch write to separate slots rather than a single vector: if
 * they shared one, releasing a key would zero a live joystick, and lifting a
 * thumb would zero held keys. `readInput` picks whichever is actually being
 * used.
 *
 * A plain mutable module object, and deliberately free of any three.js import
 * — the on-screen joystick lives in the DOM bundle and must not drag the 3D
 * chunk in with it. Same reasoning as `railsState`.
 */

export interface MoveIntent {
  /** -1..1, left/right. */
  x: number;
  /** -1..1, back/forward. */
  y: number;
  run: boolean;
}

export const inputState: { keyboard: MoveIntent; touch: MoveIntent } = {
  keyboard: { x: 0, y: 0, run: false },
  touch: { x: 0, y: 0, run: false },
};

/**
 * Resolves the two sources into one intent, writing into `out` so the frame
 * loop allocates nothing.
 *
 * Whichever device is pushing harder wins, which means a joystick and a
 * keyboard can both be connected without either cancelling the other.
 */
export function readInput(out: MoveIntent): MoveIntent {
  const { keyboard, touch } = inputState;
  const keyboardMagnitude = Math.hypot(keyboard.x, keyboard.y);
  const touchMagnitude = Math.hypot(touch.x, touch.y);

  const source = touchMagnitude > keyboardMagnitude ? touch : keyboard;
  out.x = source.x;
  out.y = source.y;
  out.run = source.run;
  return out;
}
