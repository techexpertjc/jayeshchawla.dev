import Link from "next/link";
import { PreloadWorld } from "./PreloadWorld";
import { mainQuests, profile, yearsOfExperience } from "@/content/save-file";

/**
 * Rebuild daily, for the same reason `/resume` does: the years of experience
 * shown below is computed from a date, so a page built once and cached forever
 * would keep showing whatever the number was on the day it shipped.
 */
export const revalidate = 86400;

/**
 * Boot screen. Deliberately pure DOM + CSS — it must paint instantly, before
 * any JavaScript or 3D payload arrives. Phase 1 mounts the world behind it and
 * wires NEW GAME to the dynamic <World /> import; nothing here changes.
 */
export default function BootPage() {
  const years = yearsOfExperience();

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-ink-900 text-paper-100">
      {/* Fetches the world in the background while this screen is being read. */}
      <PreloadWorld />
      <Sky />
      <Petals />

      <div className="relative z-10 flex flex-1 flex-col justify-center px-6 py-16 md:px-16">
        <p
          className="rise font-[family-name:var(--font-display)] text-xs uppercase tracking-[0.4em] text-sakura-400"
          style={{ animationDelay: "120ms" }}
        >
          Save File
        </p>

        <h1
          className="rise mt-4 font-[family-name:var(--font-display)] text-[clamp(2.75rem,10vw,7rem)] font-bold leading-[0.95] tracking-tight"
          style={{ animationDelay: "240ms" }}
        >
          {profile.name}
        </h1>

        <p
          className="rise mt-5 max-w-xl text-lg leading-relaxed text-paper-300"
          style={{ animationDelay: "380ms" }}
        >
          {profile.title} · {years}+ years. {profile.tagline}
        </p>

        <nav
          className="rise mt-12 flex flex-col gap-1"
          style={{ animationDelay: "520ms" }}
          aria-label="Main menu"
        >
          <MenuItem href="/play" label="New Game" hint="Walk the world" />
          <MenuItem href="/resume" label="Load Save File" hint="Read the resume" />
        </nav>
      </div>

      {/* Region list — a quiet hint at what the world will contain. */}
      <footer className="relative z-10 border-t border-ink-600/60 px-6 py-5 md:px-16">
        <ul className="flex flex-wrap gap-x-6 gap-y-2 font-[family-name:var(--font-display)] text-[0.7rem] uppercase tracking-[0.2em] text-ink-400">
          {mainQuests.map((quest) => (
            <li key={quest.id}>{quest.worldTitle}</li>
          ))}
        </ul>
      </footer>
    </main>
  );
}

/* ------------------------------------------------------------------ */

function MenuItem({
  label,
  hint,
  href,
  disabled,
}: {
  label: string;
  hint: string;
  href?: string;
  disabled?: boolean;
}) {
  const content = (
    <>
      <span
        aria-hidden
        className="w-5 shrink-0 text-sakura-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
        style={disabled ? undefined : { animation: "cursor-pulse 1.4s ease-in-out infinite" }}
      >
        ▸
      </span>
      <span className="font-[family-name:var(--font-display)] text-2xl tracking-wide md:text-3xl">
        {label}
      </span>
      <span className="text-sm text-ink-400">{hint}</span>
    </>
  );

  if (disabled || !href) {
    return (
      <span
        aria-disabled
        className="group flex cursor-not-allowed items-baseline gap-4 py-2 opacity-40"
      >
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="group flex items-baseline gap-4 py-2 transition-transform duration-300 ease-[var(--ease-out-quint)] hover:translate-x-2 focus-visible:translate-x-2"
    >
      {content}
    </Link>
  );
}

function Sky() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "radial-gradient(120% 90% at 50% 110%, var(--color-sky-800) 0%, transparent 55%)," +
          "linear-gradient(180deg, var(--color-ink-900) 0%, var(--color-ink-800) 45%, var(--color-ink-700) 100%)",
      }}
    />
  );
}

/** Deterministic scatter — no Math.random(), so SSR and client agree. */
function Petals() {
  const petals = Array.from({ length: 14 }, (_, i) => ({
    left: `${(i * 37) % 100}%`,
    duration: `${11 + ((i * 7) % 9)}s`,
    delay: `${-(i * 1.7) % 14}s`,
    drift: `${((i % 5) - 2) * 4}vw`,
    scale: 0.6 + ((i % 4) * 0.25),
    opacity: 0.25 + ((i % 3) * 0.18),
  }));

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {petals.map((petal, i) => (
        <span
          key={i}
          className="petal"
          style={
            {
              left: petal.left,
              scale: petal.scale,
              "--petal-duration": petal.duration,
              "--petal-delay": petal.delay,
              "--petal-drift": petal.drift,
              "--petal-opacity": petal.opacity,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
