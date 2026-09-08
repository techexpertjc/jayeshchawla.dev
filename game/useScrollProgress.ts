"use client";

import { useEffect } from "react";
import Lenis from "lenis";
// From railsState, never from rails.ts — that module imports three, and this
// hook runs outside the lazily-loaded 3D chunk.
import { railsState } from "@/game/camera/railsState";
import { wantsTouchControls } from "@/game/quality";

/**
 * How much of a finger's travel becomes story, on touch devices.
 *
 * Below 1 on purpose. A phone's viewport is shorter than a laptop's, so the
 * same `vh` story length is fewer pixels of scroll to begin with, and a thumb
 * covers them far faster than a wheel does.
 */
const TOUCH_SENSITIVITY = 0.7;

/**
 * How far a flick coasts after the finger leaves. Lenis raises the gesture's
 * velocity to this power, and a flick's velocity is well above 1, so small
 * changes here matter a lot: the 1.7 default threw a flick roughly three times
 * further than this does. Low enough that the story keeps moving after a
 * swipe, high enough that it does not stop dead under the thumb.
 */
const TOUCH_INERTIA = 1.35;

/**
 * Drives `railsState.t` from page scroll, smoothed by Lenis.
 *
 * Lives on the DOM side rather than inside <Canvas>: scrolling is a document
 * concern, and the render loop should only ever read the resulting number.
 *
 * Progress is read from `window.scrollY` inside Lenis's own rAF tick rather
 * than from its `scroll` event. Lenis already writes the smoothed position to
 * the document before that tick returns, so scrollY is the interpolated value
 * — and unlike the event, it also reflects programmatic scrolls, anchor jumps
 * and anything else that moves the page.
 *
 * Pass `enabled: false` in Explore mode: the page stops scrolling there, and a
 * live Lenis instance would keep fighting the pointer.
 */
export function useScrollProgress(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    /*
      Take touch scrolling away from the browser on phones.

      Lenis leaves touch native by default, so the wheel smoothing never
      applied there: the story was driven by the platform's own momentum fling,
      which can throw a page several thousand pixels from one flick and carried
      the visitor most of the way down the road on a flick of the thumb.
      `syncTouch` routes touch through the same damped path as the wheel, which
      is also what makes the two constants above mean anything — without it,
      `touchMultiplier` is simply ignored.

      Left off on pointers that are not coarse, so a laptop trackpad keeps the
      wheel path it already has.
    */
    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
      syncTouch: wantsTouchControls(),
      touchMultiplier: TOUCH_SENSITIVITY,
      touchInertiaExponent: TOUCH_INERTIA,
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);

      const limit = document.documentElement.scrollHeight - window.innerHeight;
      railsState.t = limit > 0 ? Math.min(1, Math.max(0, window.scrollY / limit)) : 0;

      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __rails?: unknown }).__rails = railsState;
    }

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [enabled]);
}
