"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { wantsTouchControls } from "@/game/quality";
import { scriptById } from "@/content/dialogue";
import { useTypewriter } from "@/hud/useTypewriter";
import { useGame, type DialoguePosition } from "@/store/game";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export function DialogueBox() {
  const dialogue = useGame((s) => s.dialogue);

  return (
    <AnimatePresence>
      {dialogue && <DialoguePanel key="dialogue" position={dialogue} />}
    </AnimatePresence>
  );
}

/*
  `position` is a prop, not a store read. AnimatePresence keeps this component
  mounted through its exit animation, and by then the store's `dialogue` is
  already null — reading it here (even with a non-null assertion) crashes on
  the way out. Holding the last value as a prop lets the exit play out.
*/
function DialoguePanel({ position: dialogue }: { position: DialoguePosition }) {
  const advance = useGame((s) => s.advance);
  const choose = useGame((s) => s.choose);
  const close = useGame((s) => s.closeDialogue);

  const node = scriptById(dialogue.scriptId)?.nodes[dialogue.nodeId];
  const line = node?.lines[dialogue.lineIndex];

  const { shown, done, skip } = useTypewriter(line?.text ?? "");

  // Keyboard affordances are a lie on a phone. Resolved in an effect because
  // matchMedia does not exist during SSR.
  const [touch, setTouch] = useState(false);
  useEffect(() => setTouch(wantsTouchControls()), []);

  const onLastLine = !!node && dialogue.lineIndex === node.lines.length - 1;
  const showChoices = onLastLine && done && !!node?.choices?.length;

  /** One key does both jobs: finish the line, or move on if it is finished. */
  const step = () => (done ? advance() : skip());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.code === "Escape") return close();

      /*
        Both `key` and `code` are checked. Space arrives as `key: " "` from a
        real keypress but as `code: "Space"` from synthetic and automated
        input, and Enter likewise — matching on one alone silently drops half
        the ways a key can reach the page.
      */
      const advanceKey =
        e.key === " " || e.code === "Space" || e.key === "Enter" || e.code === "Enter";

      if (advanceKey) {
        e.preventDefault();
        if (!showChoices) step();
        return;
      }
      // Number keys pick a choice, so the whole thing is keyboard-playable.
      if (showChoices && /^[1-9]$/.test(e.key)) {
        const index = Number(e.key) - 1;
        if (index < (node?.choices?.length ?? 0)) choose(index);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!node || !line) return null;

  return (
    <motion.div
      className="pointer-events-auto fixed inset-x-0 bottom-0 z-30 px-4 pb-4 md:px-8 md:pb-8"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
    >
      <div className="mx-auto max-w-3xl">
        {/* Speaker plate, offset above the box like a VN nameplate. */}
        <motion.div
          className="ml-2 inline-flex items-center gap-2 rounded-t-lg border border-b-0 border-ink-600 bg-ink-800 px-4 py-1.5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE_OUT, delay: 0.08 }}
        >
          {line.portrait && <span aria-hidden className="text-lg">{line.portrait}</span>}
          <span className="font-[family-name:var(--font-display)] text-sm tracking-wide text-sakura-400">
            {line.speaker}
          </span>
        </motion.div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => !showChoices && step()}
          onKeyDown={(e) => e.key === "Enter" && !showChoices && step()}
          className="rounded-xl rounded-tl-none border border-ink-600 bg-ink-800/95 p-5 shadow-2xl backdrop-blur-sm md:p-6"
        >
          <p className="min-h-[4.5rem] text-lg leading-relaxed text-paper-100 md:min-h-[3.5rem]">
            {shown}
            {/* Cursor only while typing, so a finished line reads cleanly. */}
            {!done && (
              <span className="ml-0.5 inline-block h-5 w-[2px] translate-y-0.5 animate-pulse bg-sakura-400" />
            )}
          </p>

          <AnimatePresence mode="wait">
            {showChoices ? (
              <motion.ul
                key="choices"
                className="mt-4 space-y-1 border-t border-ink-600 pt-4"
                initial="hidden"
                animate="shown"
                variants={{ shown: { transition: { staggerChildren: 0.07 } } }}
              >
                {node.choices!.map((choice, index) => (
                  <motion.li
                    key={choice.label}
                    variants={{
                      hidden: { opacity: 0, x: -12 },
                      shown: { opacity: 1, x: 0 },
                    }}
                    transition={{ duration: 0.32, ease: EASE_OUT }}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        choose(index);
                      }}
                      className="group flex w-full items-baseline gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-ink-700"
                    >
                      <span
                        aria-hidden
                        className="w-4 shrink-0 text-sakura-400 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        ▸
                      </span>
                      <span className="text-paper-200 transition-colors group-hover:text-sakura-300">
                        {choice.label}
                      </span>
                      {!touch && (
                        <span className="ml-auto shrink-0 text-xs text-ink-400">{index + 1}</span>
                      )}
                    </button>
                  </motion.li>
                ))}
              </motion.ul>
            ) : (
              <motion.p
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: done ? 1 : 0 }}
                className="mt-3 text-right text-xs uppercase tracking-[0.2em] text-ink-400"
              >
                {touch
                  ? onLastLine
                    ? "Tap to finish ▾"
                    : "Tap to continue ▾"
                  : onLastLine
                    ? "Space to finish ▾"
                    : "Space to continue ▾"}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
