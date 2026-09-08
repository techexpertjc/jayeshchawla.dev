"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TouchControls } from "@/hud/TouchControls";
import { wantsTouchControls } from "@/game/quality";
import { DialogueBox } from "@/hud/DialogueBox";
import { QuestCard } from "@/hud/QuestCard";
import { Panels } from "@/hud/Panels";
import { GeofenceReadout } from "@/hud/GeofenceReadout";
import { useGame, type Panel } from "@/store/game";

const EASE_ANIME = [0.34, 1.56, 0.64, 1] as const;

const MENU: Array<{ panel: NonNullable<Panel>; label: string; key: string }> = [
  { panel: "quests", label: "Quests", key: "q" },
  { panel: "inventory", label: "Inventory", key: "i" },
  { panel: "stats", label: "Character", key: "c" },
];

export function Hud() {
  const nearby = useGame((s) => s.nearby);
  const dialogue = useGame((s) => s.dialogue);
  const questCard = useGame((s) => s.questCard);
  const panel = useGame((s) => s.panel);
  const togglePanel = useGame((s) => s.togglePanel);
  const engageNearby = useGame((s) => s.engageNearby);

  const busy = !!dialogue || !!questCard;

  /*
    Resolved in an effect, not during render: `matchMedia` does not exist on
    the server, and branching on it inline would produce a hydration mismatch.
  */
  const [touch, setTouch] = useState(false);
  useEffect(() => setTouch(wantsTouchControls()), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // While a conversation or card owns the screen, those components handle
      // their own keys — the menu must not steal them.
      if (busy) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();

      if (key === "e" && nearby) {
        e.preventDefault();
        return engageNearby();
      }

      const item = MENU.find((m) => m.key === key);
      if (item) {
        e.preventDefault();
        togglePanel(item.panel);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, nearby, engageNearby, togglePanel]);

  return (
    <>
      {/* Interaction prompt. On touch the on-screen button carries this, so the
          keyboard hint would be a lie. */}
      <AnimatePresence>
        {nearby && !busy && !touch && (
          <motion.div
            key={nearby.id}
            className="pointer-events-none fixed inset-x-0 bottom-24 z-20 flex justify-center"
            initial={{ opacity: 0, y: 14, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.32, ease: EASE_ANIME }}
          >
            <div className="flex items-center gap-2.5 rounded-full border border-ink-600 bg-ink-800/90 px-4 py-2 shadow-lg backdrop-blur-sm">
              <kbd className="rounded border border-sakura-600/60 bg-ink-900 px-2 py-0.5 font-mono text-xs text-sakura-400">
                E
              </kbd>
              <span className="text-sm text-paper-200">{nearby.label}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu bar. Sits above the joystick zone on touch, and shrinks so three
          buttons still fit across a narrow phone. */}
      <div className="pointer-events-auto fixed bottom-3 left-3 z-30 flex gap-1.5 md:bottom-5 md:left-5 md:gap-2">
        {MENU.map((item) => {
          const active = panel === item.panel;
          return (
            <button
              key={item.panel}
              type="button"
              onClick={() => togglePanel(item.panel)}
              className={`group relative rounded-full border px-3 py-1.5 text-xs backdrop-blur-sm transition-colors md:px-4 md:text-sm ${
                active
                  ? "border-sakura-400 bg-ink-800/90 text-sakura-400"
                  : "border-ink-600 bg-ink-900/50 text-paper-300 hover:border-sakura-400 hover:text-sakura-400"
              }`}
            >
              {item.label}
              {!touch && (
                <span className="ml-2 text-[0.65rem] uppercase text-ink-400 group-hover:text-sakura-600">
                  {item.key}
                </span>
              )}
              {active && (
                <motion.span
                  layoutId="menu-underline"
                  className="absolute inset-x-3 -bottom-px h-px bg-sakura-400"
                  transition={{ duration: 0.3, ease: EASE_ANIME }}
                />
              )}
            </button>
          );
        })}
      </div>

      {touch && <TouchControls />}
      <GeofenceReadout />
      <Panels />
      <DialogueBox />
      <QuestCard />
    </>
  );
}
