"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { RATE_PER_METRE, geofenceState, payout } from "@/game/systems/geofence";
import { useGame } from "@/store/game";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Ten samples a second is smooth to read and 1/6th the renders of a frame loop. */
const SAMPLE_MS = 100;

const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/**
 * Live payout for the geofence garden.
 *
 * Polls `geofenceState` on its own slow clock rather than subscribing to a
 * store the scene writes every frame — the numbers only need to be legible,
 * not frame-accurate, and this keeps React out of the render loop entirely.
 */
export function GeofenceReadout() {
  const nearby = useGame((s) => s.nearby);
  const dialogue = useGame((s) => s.dialogue);
  const questCard = useGame((s) => s.questCard);

  const [snapshot, setSnapshot] = useState({ inside: false, metres: 0, lost: 0, paid: 0 });

  // Shown whenever the visitor is standing in the garden.
  const visible = nearby?.id === "geofence-garden" && !dialogue && !questCard;

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => {
      setSnapshot({
        inside: geofenceState.inside,
        metres: Math.round(geofenceState.metresInside),
        lost: Math.round(geofenceState.metresOutside),
        paid: payout(),
      });
    }, SAMPLE_MS);
    return () => clearInterval(id);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="geofence"
          className="pointer-events-none fixed right-5 top-20 z-20 w-60"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          transition={{ duration: 0.35, ease: EASE_OUT }}
        >
          <div className="rounded-lg border border-ink-600 bg-ink-900/70 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <p className="font-[family-name:var(--font-display)] text-[0.65rem] uppercase tracking-[0.25em] text-ink-400">
                Field Agent
              </p>
              <span
                className={`rounded-full px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.15em] transition-colors ${
                  snapshot.inside
                    ? "bg-gold-400/20 text-gold-400"
                    : "bg-ember-400/20 text-ember-400"
                }`}
              >
                {snapshot.inside ? "Inside" : "Outside"}
              </span>
            </div>

            <p className="mt-3 font-[family-name:var(--font-display)] text-2xl tabular-nums text-gold-400">
              {rupees.format(snapshot.paid)}
            </p>

            <dl className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <dt className="text-ink-400">Billable distance</dt>
                <dd className="tabular-nums text-gold-400">{snapshot.metres} m</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-400">Outside boundary</dt>
                <dd className="tabular-nums text-ember-400">{snapshot.lost} m</dd>
              </div>
              <div className="flex justify-between border-t border-ink-600 pt-1">
                <dt className="text-ink-400">Rate</dt>
                <dd className="tabular-nums text-paper-300">₹{RATE_PER_METRE}/m</dd>
              </div>
            </dl>

            <p className="mt-3 text-[0.7rem] leading-relaxed text-ink-400">
              Drag a gold corner to redraw the boundary.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
