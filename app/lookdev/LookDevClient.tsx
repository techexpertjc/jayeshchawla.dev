"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

/**
 * One dynamic import, pulling the entire three.js subtree as a single chunk.
 * See the note in game/LookDevRoot.tsx for why this must not be split further.
 */
const LookDevRoot = dynamic(() => import("@/game/LookDevRoot").then((m) => m.LookDevRoot), {
  ssr: false,
  loading: () => <LoadingCard />,
});

export function LookDevClient() {
  return (
    <main className="relative h-dvh w-full bg-ink-900">
      <LookDevRoot />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-5">
        <div>
          <p className="font-[family-name:var(--font-display)] text-xs uppercase tracking-[0.3em] text-sakura-400">
            Phase 1 · Look Dev
          </p>
          <p className="mt-1 text-sm text-paper-300/70">Drag to orbit · scroll to zoom</p>
        </div>
        <Link
          href="/"
          className="pointer-events-auto rounded-full border border-ink-600 px-4 py-1.5 text-sm text-paper-300 transition-colors hover:border-sakura-400 hover:text-sakura-400"
        >
          Back
        </Link>
      </div>
    </main>
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
