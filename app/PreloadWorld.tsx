"use client";

import { useEffect } from "react";

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}

/**
 * Warms the 3D world while the visitor is reading the title screen.
 *
 * The boot screen is deliberately pure DOM and CSS so it paints instantly, and
 * that is not undermined here: nothing starts until the browser is idle, so
 * first paint and interactivity are untouched. By the time anyone has read the
 * menu and clicked New Game, the chunk, the model and the postcard textures
 * are already parsed and cached, and the transition is a mount rather than a
 * download.
 *
 * Renders nothing.
 */
export function PreloadWorld() {
  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: NetworkInformation })
      .connection;

    /*
      Not on a metered or slow connection. Speculatively pulling ~1.6 MB for a
      page the visitor may never open is a poor trade on someone's mobile data
      — they can wait the extra second if they do click.
    */
    if (connection?.saveData) return;
    if (connection?.effectiveType && /(^|-)2g$/.test(connection.effectiveType)) return;

    let cancelled = false;

    const start = () => {
      if (cancelled) return;
      import("@/game/OverworldRoot")
        .then((module) => {
          if (!cancelled) module.preloadWorld();
        })
        // A failed preload is not worth surfacing; the route loads it properly.
        .catch(() => {});
    };

    const idle = window.requestIdleCallback?.(start, { timeout: 2500 });
    const timer = idle === undefined ? window.setTimeout(start, 1200) : undefined;

    return () => {
      cancelled = true;
      if (idle !== undefined) window.cancelIdleCallback?.(idle);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  return null;
}
