import type { Metadata } from "next";
import Link from "next/link";
import { PrintButton } from "@/components/PrintButton";
import { StructuredData } from "@/components/StructuredData";
import {
  bio,
  durationMonths,
  formatDuration,
  formatRange,
  gear,
  mainQuests,
  profile,
  showsDates,
  sideQuests,
  yearsOfExperience,
  type Quest,
} from "@/content/save-file";

export const metadata: Metadata = {
  title: "Resume",
  alternates: { canonical: "/resume" },
  description: `${profile.name} — ${profile.title}. ${profile.tagline}`,
};

/** Rebuild daily so "Present" durations and years of experience stay current. */
export const revalidate = 86400;

export default function ResumePage() {
  const years = yearsOfExperience();
  const activeSocials = profile.socials.filter((s) => s.href);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 print:py-0 md:px-8">
      <StructuredData />

      {/* ---------- Mode bar ---------- */}
      <div className="no-print mb-10 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm text-[var(--text-muted)] transition-colors hover:text-sakura-600"
        >
          <span
            aria-hidden
            className="inline-block transition-transform duration-300 group-hover:-translate-x-1"
          >
            ←
          </span>
          Enter the world
        </Link>
        <PrintButton />
      </div>

      {/* ---------- Header ---------- */}
      <header className="border-b border-[var(--rule)] pb-8">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight md:text-5xl">
          {profile.name}
        </h1>
        <p className="mt-2 text-lg text-[var(--text-muted)]">
          {profile.title} · {years}+ years
        </p>

        <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <li>
            <a
              href={`mailto:${profile.email}`}
              className="underline decoration-[var(--rule)] underline-offset-4 transition-colors hover:decoration-sakura-600"
            >
              {profile.email}
            </a>
          </li>
          {activeSocials.map((social) => (
            <li key={social.label}>
              <a
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-[var(--rule)] underline-offset-4 transition-colors hover:decoration-sakura-600"
              >
                {social.label}
              </a>
            </li>
          ))}
          <li className="text-[var(--text-muted)]">{profile.location}</li>
        </ul>
      </header>

      {/* ---------- Summary ---------- */}
      <Section title="Summary">
        <p className="leading-relaxed text-[var(--text)]">{bio()}</p>
      </Section>

      {/* ---------- Experience ---------- */}
      <Section title="Experience">
        <div className="space-y-9">
          {mainQuests.map((quest) => (
            <QuestEntry key={quest.id} quest={quest} />
          ))}
        </div>
      </Section>

      {/* ---------- Freelance ---------- */}
      <Section title="Selected Freelance Projects">
        <div className="space-y-9">
          {sideQuests.map((quest) => (
            <QuestEntry key={quest.id} quest={quest} />
          ))}
        </div>
      </Section>

      {/* ---------- Skills ---------- */}
      {/*
        Divided, and the relic row is labelled by era. Sitting flush under the
        freelance list, a bare "Also shipped with" row reads as belonging to
        the last project above it rather than to the career as a whole.
      */}
      <Section title="Skills" divided>
        <dl className="space-y-4">
          <SkillRow label="Core" kinds={["weapon"]} />
          <SkillRow label="Supporting" kinds={["armor"]} />
          <SkillRow label="Earlier in my career" kinds={["relic"]} />
        </dl>
      </Section>

      <footer className="no-print mt-16 border-t border-[var(--rule)] pt-6 text-sm text-[var(--text-muted)]">
        Prefer the scenic route?{" "}
        <Link href="/" className="underline underline-offset-4 hover:text-sakura-600">
          Explore the world instead
        </Link>
        .
      </footer>
    </main>
  );
}

/* ------------------------------------------------------------------ */

function Section({
  title,
  children,
  divided,
}: {
  title: string;
  children: React.ReactNode;
  /** Draws a rule above the section, for a block that must not read as a
      continuation of the one before it. */
  divided?: boolean;
}) {
  return (
    <section className={divided ? "mt-10 border-t border-[var(--rule)] pt-8" : "mt-10"}>
      <h2 className="mb-4 font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function QuestEntry({ quest }: { quest: Quest }) {
  const dated = showsDates(quest);
  const range = dated ? formatRange(quest.start, quest.end) : "";
  const duration =
    dated && quest.start ? formatDuration(durationMonths(quest.start, quest.end)) : null;

  return (
    <article>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-lg font-semibold">
          {quest.role}
          <span className="font-normal text-[var(--text-muted)]"> · </span>
          {quest.orgUrl ? (
            /*
              The org name carries the link rather than a separate URL chip.
              Print CSS appends every external href, so a visible duplicate
              would print the address twice.
            */
            <a
              href={quest.orgUrl}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-[var(--rule)] underline-offset-4 transition-colors hover:decoration-sakura-600"
            >
              {quest.org}
              <span aria-hidden className="ml-1 text-[0.8em] text-[var(--text-muted)]">
                ↗
              </span>
            </a>
          ) : (
            quest.org
          )}
        </h3>
        {range && (
          <p className="text-sm tabular-nums text-[var(--text-muted)]">
            {range}
            {duration && <span className="ml-2 opacity-70">({duration})</span>}
          </p>
        )}
      </div>

      <p className="mt-2 leading-relaxed text-[var(--text-muted)]">{quest.summary}</p>

      <ul className="mt-3 space-y-1.5">
        {quest.highlights.map((highlight) => (
          <li key={highlight} className="flex gap-2.5 leading-relaxed">
            <span aria-hidden className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-sakura-400" />
            <span>{highlight}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {quest.stack ? (
          quest.stack.map((tech) => (
            <span
              key={tech}
              className="rounded border border-[var(--rule)] px-2 py-0.5 text-xs text-[var(--text-muted)]"
            >
              {tech}
            </span>
          ))
        ) : (
          <span className="rounded border border-dashed border-[var(--rule)] px-2 py-0.5 text-xs italic text-[var(--text-muted)]">
            {quest.stackNote ?? "Stack withheld"}
          </span>
        )}
      </div>
    </article>
  );
}

function SkillRow({ label, kinds }: { label: string; kinds: Array<"weapon" | "armor" | "relic"> }) {
  const items = gear.filter((item) => kinds.includes(item.kind));
  if (!items.length) return null;

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
      <dt className="w-40 shrink-0 text-sm text-[var(--text-muted)]">{label}</dt>
      <dd className="leading-relaxed">{items.map((item) => item.name).join(" · ")}</dd>
    </div>
  );
}

