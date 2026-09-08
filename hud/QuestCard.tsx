"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { displayHost, formatRange, questBySlug, showsDates } from "@/content/save-file";
import { useGame } from "@/store/game";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const EASE_ANIME = [0.34, 1.56, 0.64, 1] as const;

export function QuestCard() {
  const slug = useGame((s) => s.questCard);
  return <AnimatePresence>{slug && <Card key={slug} slug={slug} />}</AnimatePresence>;
}

function Card({ slug }: { slug: string }) {
  const dismiss = useGame((s) => s.dismissQuestCard);
  const quest = questBySlug(slug);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Match on key and code alike — see the note in DialogueBox.
      const dismissKey =
        e.key === "Escape" ||
        e.code === "Escape" ||
        e.key === "Enter" ||
        e.code === "Enter" ||
        e.key === " " ||
        e.code === "Space";

      if (dismissKey) {
        e.preventDefault();
        dismiss();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismiss]);

  if (!quest) return null;

  const range = showsDates(quest) ? formatRange(quest.start, quest.end) : "";

  return (
    <motion.div
      className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={dismiss}
    >
      <div className="absolute inset-0 bg-ink-900/70 backdrop-blur-sm" />

      <motion.div
        role="dialog"
        aria-label="Quest complete"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-gold-600/60 bg-ink-800 shadow-2xl"
        initial={{ opacity: 0, y: 40, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.5, ease: EASE_ANIME }}
      >
        {/* Gold sweep across the header, once, on reveal. */}
        <motion.div
          aria-hidden
          className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-transparent via-gold-400/25 to-transparent"
          initial={{ x: "-120%" }}
          animate={{ x: "120%" }}
          transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.15 }}
        />

        <div className="relative border-b border-ink-600 px-6 py-5">
          <motion.p
            className="font-[family-name:var(--font-display)] text-xs uppercase tracking-[0.4em] text-gold-400"
            initial={{ opacity: 0, letterSpacing: "0.8em" }}
            animate={{ opacity: 1, letterSpacing: "0.4em" }}
            transition={{ duration: 0.55, ease: EASE_OUT, delay: 0.1 }}
          >
            Quest Complete
          </motion.p>

          <motion.h2
            className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-paper-100"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE_OUT, delay: 0.22 }}
          >
            {quest.worldTitle}
          </motion.h2>

          <motion.p
            className="mt-1 text-sm text-ink-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            {quest.role} · {quest.org}
            {range && <span className="ml-2 tabular-nums">{range}</span>}
          </motion.p>
        </div>

        <div className="px-6 py-5">
          <motion.p
            className="leading-relaxed text-paper-300"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.36 }}
          >
            {quest.summary}
          </motion.p>

          <motion.ul
            className="mt-4 space-y-2"
            initial="hidden"
            animate="shown"
            variants={{ shown: { transition: { delayChildren: 0.44, staggerChildren: 0.08 } } }}
          >
            {quest.highlights.map((highlight) => (
              <motion.li
                key={highlight}
                className="flex gap-2.5 text-sm leading-relaxed text-paper-300/90"
                variants={{ hidden: { opacity: 0, x: -10 }, shown: { opacity: 1, x: 0 } }}
                transition={{ duration: 0.34, ease: EASE_OUT }}
              >
                <span aria-hidden className="mt-[0.5em] size-1.5 shrink-0 rounded-full bg-gold-400" />
                {highlight}
              </motion.li>
            ))}
          </motion.ul>

          <motion.div
            className="mt-5 flex flex-wrap gap-1.5"
            initial="hidden"
            animate="shown"
            variants={{ shown: { transition: { delayChildren: 0.7, staggerChildren: 0.04 } } }}
          >
            {quest.stack ? (
              quest.stack.map((tech) => (
                <motion.span
                  key={tech}
                  className="rounded border border-ink-600 px-2 py-0.5 text-xs text-ink-400"
                  variants={{ hidden: { opacity: 0, scale: 0.85 }, shown: { opacity: 1, scale: 1 } }}
                  transition={{ duration: 0.28, ease: EASE_ANIME }}
                >
                  {tech}
                </motion.span>
              ))
            ) : (
              <motion.span
                className="rounded border border-dashed border-ink-600 px-2 py-0.5 text-xs italic text-ink-400"
                variants={{ hidden: { opacity: 0 }, shown: { opacity: 1 } }}
              >
                {quest.stackNote ?? "Stack withheld"}
              </motion.span>
            )}
          </motion.div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-ink-600 px-6 py-4">
          {quest.orgUrl ? (
            <a
              href={quest.orgUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-ink-400 underline decoration-ink-600 underline-offset-4 transition-colors hover:text-gold-400 hover:decoration-gold-600"
            >
              {displayHost(quest.orgUrl)} ↗
            </a>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={dismiss}
            className="rounded-full border border-ink-600 px-5 py-1.5 text-sm text-paper-300 transition-colors hover:border-gold-400 hover:text-gold-400"
          >
            Continue
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
