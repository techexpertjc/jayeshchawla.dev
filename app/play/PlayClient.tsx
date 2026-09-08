"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { wantsTouchControls } from "@/game/quality";
import { useScrollProgress } from "@/game/useScrollProgress";
import { Hud } from "@/hud/Hud";
import { useGame } from "@/store/game";

const OverworldRoot = dynamic(
  () => import("@/game/OverworldRoot").then((m) => m.OverworldRoot),
  { ssr: false, loading: () => <LoadingCard /> },
);

/**
 * How much scroll length Story mode gets. Longer = slower, more cinematic.
 * Scale this with the rails path: as regions are added the path grows, and a
 * fixed height would walk the visitor through them faster and faster.
 */
const STORY_SCROLL_VH = 2400;

export function PlayClient() {
  const mode = useGame((s) => s.mode);
  const toggleMode = useGame((s) => s.toggleMode);
  const story = mode === "story";

  // Resolved in an effect — matchMedia does not exist during SSR.
  const [touch, setTouch] = useState(false);
  useEffect(() => setTouch(wantsTouchControls()), []);

  /** True while a conversation, quest card or panel owns the screen. */
  const busy = useGame(
    (s) => s.dialogue !== null || s.questCard !== null || s.panel !== null,
  );

  /*
    Lenis is torn down whenever something owns the screen, not merely paused.

    It intercepts wheel and touch events across the whole document and
    preventDefaults them to drive its own smooth scroll — so while it is alive,
    a scrollable panel never receives the gesture at all. Locking `body`
    overflow does not help, because Lenis is not using native scrolling in the
    first place. Reading the postcards scrolled the story instead of the list.
  */
  useScrollProgress(story && !busy);

  /*
    The page scrolls only when Story mode is actually driving the rails.

    Explore drives the camera with the pointer, so the page must not scroll
    underneath it. And whenever something owns the screen — a conversation, a
    quest card, an open panel — the story is paused, so scrolling must not
    advance it either. Reading the postcards used to walk the visitor down the
    road, because the panel's own scrolling chained straight into the page.
  */
  useEffect(() => {
    const locked = !story || busy;
    document.body.style.overflow = locked ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [story, busy]);

  return (
    <>
      {/* Fixed, so the canvas stays put while the spacer below scrolls past it. */}
      <div className="fixed inset-0 bg-ink-900">
        <OverworldRoot />
      </div>

      {story && <div aria-hidden style={{ height: `${STORY_SCROLL_VH}vh` }} />}

      <div className="pointer-events-none fixed inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-3 md:p-5">
        <div className="rounded-lg bg-ink-900/40 px-3 py-2 backdrop-blur-sm">
          <p className="font-[family-name:var(--font-display)] text-[0.65rem] uppercase tracking-[0.3em] text-sakura-400 md:text-xs">
            {story ? "Story" : "Explore"}
          </p>
          <p className="mt-1 text-xs text-paper-300/80 md:text-sm">
            {story ? (
              "Scroll to walk the path"
            ) : touch ? (
              "Drag the circle to move · drag the world to look"
            ) : (
              <>
                <Key>W</Key> <Key>A</Key> <Key>S</Key> <Key>D</Key> move ·{" "}
                <Key>Shift</Key> run · drag to look
              </>
            )}
          </p>
        </div>

        <div className="pointer-events-auto flex shrink-0 items-center gap-1.5 md:gap-2">
          <button
            type="button"
            onClick={toggleMode}
            className="rounded-full border border-ink-600 bg-ink-900/40 px-3 py-1.5 text-xs text-paper-300 backdrop-blur-sm transition-colors hover:border-sakura-400 hover:text-sakura-400 md:px-4 md:text-sm"
          >
            {/* Full wording where there is room; a verb where there is not. */}
            <span className="hidden sm:inline">
              {story ? "Take the controls" : "Back to the story"}
            </span>
            <span className="sm:hidden">{story ? "Explore" : "Story"}</span>
          </button>
          <Link
            href="/"
            className="rounded-full border border-ink-600 bg-ink-900/40 px-3 py-1.5 text-xs text-paper-300 backdrop-blur-sm transition-colors hover:border-sakura-400 hover:text-sakura-400 md:px-4 md:text-sm"
          >
            Title
          </Link>
        </div>
      </div>

      <Hud />

      {story && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-10 flex justify-center">
          <p className="animate-pulse rounded-full bg-ink-900/40 px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-paper-300/70 backdrop-blur-sm">
            Scroll ↓
          </p>
        </div>
      )}
    </>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-ink-600 bg-ink-800/80 px-1.5 py-0.5 font-mono text-xs text-paper-200">
      {children}
    </kbd>
  );
}

function LoadingCard() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <p className="font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.3em] text-paper-300/60">
        Loading region…
      </p>
    </div>
  );
}
