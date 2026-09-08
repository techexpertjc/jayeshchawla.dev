/**
 * Per-frame channel between the DOM scroll listener and the render loop.
 *
 * Deliberately in its own module with **no three.js import**. The scroll hook
 * runs on the DOM side, outside the lazily-loaded 3D chunk; if it reached into
 * `rails.ts` for this object it would drag all of three.js into the route's
 * initial bundle and double the First Load JS. Keep this file dependency-free.
 *
 * Deliberately a plain mutable object rather than store state, too: it is
 * written on every scroll event and read on every frame, and routing that
 * through React would re-render the tree at scroll frequency.
 */
export const railsState = {
  /** 0..1 along the story path. */
  t: 0,
};
