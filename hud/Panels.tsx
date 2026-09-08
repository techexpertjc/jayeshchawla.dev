"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import {
  displayHost,
  formatRange,
  gear,
  quests,
  showsDates,
  stats,
  yearsWielded,
  type Gear,
} from "@/content/save-file";
import { postcards } from "@/content/postcards";
import { useGame, type Panel } from "@/store/game";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const PANEL_TITLES: Record<NonNullable<Panel>, string> = {
  quests: "Quest Log",
  inventory: "Inventory",
  stats: "Character Sheet",
  postcards: "Postcards",
};

export function Panels() {
  const panel = useGame((s) => s.panel);
  const setPanel = useGame((s) => s.setPanel);

  useEffect(() => {
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPanel(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel, setPanel]);

  return (
    <AnimatePresence>
      {panel && <PanelShell key="panel" panel={panel} onClose={() => setPanel(null)} />}
    </AnimatePresence>
  );
}

/*
  `panel` is a prop, not a store read. AnimatePresence keeps this mounted
  through the slide-out, by which point the store's `panel` is already null —
  reading it here would blank the contents mid-animation and leave the dialog
  without an accessible name. See the same note in DialogueBox.
*/
function PanelShell({
  panel,
  onClose,
}: {
  panel: NonNullable<Panel>;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="pointer-events-auto fixed inset-0 z-30 flex justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" />

      <motion.aside
        role="dialog"
        aria-label={PANEL_TITLES[panel]}
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full w-full max-w-md flex-col border-l border-ink-600 bg-ink-800 shadow-2xl"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.42, ease: EASE_OUT }}
      >
        <header className="flex items-center justify-between border-b border-ink-600 px-6 py-4">
          <h2 className="font-[family-name:var(--font-display)] text-xs uppercase tracking-[0.3em] text-sakura-400">
            {PANEL_TITLES[panel]}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="rounded-full border border-ink-600 px-3 py-1 text-xs text-ink-400 transition-colors hover:border-sakura-400 hover:text-sakura-400"
          >
            Esc
          </button>
        </header>

        {/*
          `data-lenis-prevent` tells Lenis to leave gestures starting in here
          alone, and `overscroll-contain` stops a flick that reaches the end of
          the list from continuing into the page behind it. Belt and braces:
          Lenis is also torn down while a panel is open.
        */}
        <div
          data-lenis-prevent
          className="flex-1 overflow-y-auto overscroll-contain px-6 py-5"
        >
          {panel === "quests" && <QuestLog />}
          {panel === "inventory" && <Inventory />}
          {panel === "stats" && <StatSheet />}
          {panel === "postcards" && <Postcards />}
        </div>
      </motion.aside>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */

function QuestLog() {
  const discovered = useGame((s) => s.discovered);

  return (
    <motion.ul
      className="space-y-3"
      initial="hidden"
      animate="shown"
      variants={{ shown: { transition: { staggerChildren: 0.05 } } }}
    >
      {quests.map((quest) => {
        const found = discovered.includes(quest.slug);
        return (
          <motion.li
            key={quest.id}
            variants={{ hidden: { opacity: 0, y: 10 }, shown: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            className={`rounded-lg border p-4 ${
              found ? "border-ink-600 bg-ink-700/40" : "border-dashed border-ink-600/60"
            }`}
          >
            {found ? (
              <>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-[family-name:var(--font-display)] text-paper-100">
                    {quest.worldTitle}
                  </h3>
                  <span className="shrink-0 text-[0.65rem] uppercase tracking-[0.2em] text-jade-400">
                    {quest.kind === "main" ? "Main" : "Side"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-400">
                  {quest.role} · {quest.org}
                  {showsDates(quest) && (
                    <span className="ml-2 tabular-nums">
                      {formatRange(quest.start, quest.end)}
                    </span>
                  )}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-paper-300/85">{quest.summary}</p>
                {quest.orgUrl && (
                  <a
                    href={quest.orgUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs text-ink-400 underline decoration-ink-600 underline-offset-4 transition-colors hover:text-sakura-400 hover:decoration-sakura-600"
                  >
                    {displayHost(quest.orgUrl)} ↗
                  </a>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between">
                <span className="font-[family-name:var(--font-display)] text-ink-400">
                  ??? — undiscovered
                </span>
                <span className="text-xs text-ink-400">Find it in the world</span>
              </div>
            )}
          </motion.li>
        );
      })}
    </motion.ul>
  );
}

/* ------------------------------------------------------------------ */

const RARITY_COLOR: Record<Gear["rarity"], string> = {
  common: "text-ink-400 border-ink-600",
  rare: "text-sky-400 border-sky-600/50",
  epic: "text-sakura-400 border-sakura-600/50",
  legendary: "text-gold-400 border-gold-600/60",
};

const KIND_LABEL: Record<Gear["kind"], string> = {
  weapon: "Equipped",
  armor: "Worn",
  relic: "Relic",
};

function Inventory() {
  // The longest-held item defines a full bar, so the bars compare to each
  // other rather than to an arbitrary ceiling.
  const longest = Math.max(...gear.map((item) => yearsWielded(item)));

  return (
    <motion.ul
      className="space-y-2.5"
      initial="hidden"
      animate="shown"
      variants={{ shown: { transition: { staggerChildren: 0.045 } } }}
    >
      {gear.map((item) => {
        const years = yearsWielded(item);
        return (
          <motion.li
            key={item.id}
            variants={{ hidden: { opacity: 0, x: 16 }, shown: { opacity: 1, x: 0 } }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            className={`rounded-lg border bg-ink-700/30 p-3.5 ${RARITY_COLOR[item.rarity]}`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-[family-name:var(--font-display)]">{item.name}</h3>
              <span className="shrink-0 text-[0.65rem] uppercase tracking-[0.18em] opacity-70">
                {KIND_LABEL[item.kind]}
              </span>
            </div>

            <p className="mt-1 text-sm leading-relaxed text-paper-300/80">{item.blurb}</p>

            <div className="mt-2.5 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-900/70">
                <motion.div
                  className="h-full rounded-full bg-current"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: years / longest }}
                  style={{ originX: 0 }}
                  transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.15 }}
                />
              </div>
              <span className="shrink-0 text-xs tabular-nums opacity-80">
                {years} yr{years > 1 ? "s" : ""}
              </span>
            </div>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}

/* ------------------------------------------------------------------ */

/**
 * The travel wall.
 *
 * The board in the world shows these too, but a postcard on a wall is a
 * hundred pixels of screen — you can tell there are photographs there, not
 * what they are of. This is where they are actually looked at.
 */
function Postcards() {
  return (
    <motion.ul
      className="space-y-4"
      initial="hidden"
      animate="shown"
      variants={{ shown: { transition: { staggerChildren: 0.07 } } }}
    >
      {postcards.map((card) => (
        <motion.li
          key={card.src}
          variants={{ hidden: { opacity: 0, y: 14 }, shown: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
          className="overflow-hidden rounded-lg border border-ink-600 bg-ink-700/30"
        >
          {/* Plain <img>: these are photographs in a scrolling panel, not
              layout-critical hero images, and next/image would add a build
              step for no benefit here. */}
          <img
            src={card.src}
            alt={card.place}
            loading="lazy"
            className="aspect-[3/2] w-full object-cover"
          />
          <div className="px-4 py-3">
            <p className="font-[family-name:var(--font-display)] text-paper-100">{card.place}</p>
            {card.note && (
              <p className="mt-1 text-sm leading-relaxed text-ink-400">{card.note}</p>
            )}
          </div>
        </motion.li>
      ))}
    </motion.ul>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Radar chart. Every axis count, angle and label is derived from `stats`, so
 * adding or removing a discipline in save-file.ts redraws this correctly with
 * no edits here.
 */
function StatSheet() {
  const size = 300;
  const center = size / 2;
  const radius = center - 46;
  const count = stats.length;

  const angleAt = (i: number) => (i / count) * Math.PI * 2 - Math.PI / 2;
  const pointAt = (i: number, r: number) => [
    center + Math.cos(angleAt(i)) * r,
    center + Math.sin(angleAt(i)) * r,
  ];

  const ring = (fraction: number) =>
    stats
      .map((_, i) => pointAt(i, radius * fraction).map((n) => n.toFixed(1)).join(","))
      .join(" ");

  const shape = stats
    .map((stat, i) => pointAt(i, (radius * stat.value) / 100).map((n) => n.toFixed(1)).join(","))
    .join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-[320px]" role="img">
        <title>Discipline levels</title>

        {[0.25, 0.5, 0.75, 1].map((fraction) => (
          <polygon
            key={fraction}
            points={ring(fraction)}
            className="fill-none stroke-ink-600"
            strokeWidth={1}
          />
        ))}

        {stats.map((stat, i) => {
          const [x, y] = pointAt(i, radius);
          return (
            <line
              key={stat.id}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              className="stroke-ink-600"
              strokeWidth={1}
            />
          );
        })}

        {/* Grown from the centre rather than morphing the points string —
            SVG point-list interpolation is not something to rely on. */}
        <motion.polygon
          points={shape}
          className="fill-sakura-400/25 stroke-sakura-400"
          strokeWidth={2}
          strokeLinejoin="round"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.75, ease: EASE_OUT, delay: 0.12 }}
          style={{ originX: "50%", originY: "50%" }}
        />

        {stats.map((stat, i) => {
          const [x, y] = pointAt(i, radius + 22);
          return (
            <motion.circle
              key={stat.id}
              cx={pointAt(i, (radius * stat.value) / 100)[0]}
              cy={pointAt(i, (radius * stat.value) / 100)[1]}
              r={3}
              className="fill-sakura-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.05 }}
              data-x={x}
              data-y={y}
            />
          );
        })}
      </svg>

      <motion.ul
        className="mt-5 space-y-2"
        initial="hidden"
        animate="shown"
        variants={{ shown: { transition: { delayChildren: 0.35, staggerChildren: 0.05 } } }}
      >
        {stats.map((stat) => (
          <motion.li
            key={stat.id}
            className="flex items-center gap-3"
            variants={{ hidden: { opacity: 0, x: 12 }, shown: { opacity: 1, x: 0 } }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
          >
            <span className="w-44 shrink-0 text-sm text-paper-300">{stat.label}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-900/70">
              <motion.div
                className="h-full rounded-full bg-sakura-400"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: stat.value / 100 }}
                style={{ originX: 0 }}
                transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.3 }}
              />
            </div>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}
