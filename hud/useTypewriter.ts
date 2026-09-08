"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reveals `text` a character at a time.
 *
 * Driven by requestAnimationFrame against elapsed time rather than a
 * per-character setTimeout: timers drift, and a chain of them makes the
 * reveal rate depend on how busy the main thread is — which, next to a WebGL
 * canvas, it always is.
 *
 * Honours prefers-reduced-motion by showing the line immediately.
 */
export function useTypewriter(text: string, charsPerSecond = 58) {
  const [shownCount, setShownCount] = useState(0);
  const latest = useRef(0);

  useEffect(() => {
    setShownCount(0);
    latest.current = 0;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || !text) {
      setShownCount(text.length);
      latest.current = text.length;
      return;
    }

    let frame = 0;
    let start = 0;

    const step = (now: number) => {
      if (!start) start = now;
      const next = Math.min(text.length, Math.floor(((now - start) / 1000) * charsPerSecond));

      // Only re-render when a new character actually appears.
      if (next !== latest.current) {
        latest.current = next;
        setShownCount(next);
      }
      if (next < text.length) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [text, charsPerSecond]);

  const done = shownCount >= text.length;

  /** Jump to the full line — for readers who type faster than we print. */
  const skip = () => {
    latest.current = text.length;
    setShownCount(text.length);
  };

  return { shown: text.slice(0, shownCount), done, skip };
}
