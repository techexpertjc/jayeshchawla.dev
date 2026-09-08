/**
 * SAVE FILE — the single source of truth for the entire site.
 *
 * The 3D world, Resume Mode, the /work case-study pages and the dialogue scripts
 * all read from this file. Change a job title here and it changes everywhere.
 *
 * Items marked `TODO(jayesh)` need your confirmation.
 */

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

export type ZoneId =
  | "streebo"
  | "xmplify"
  | "patricia"
  | "predixtions"
  | "isles"
  | "tavern";

export type QuestKind = "main" | "side";

export type Rarity = "common" | "rare" | "epic" | "legendary";

/** `YYYY-MM`, or null for "present". */
export type YearMonth = `${number}-${string}`;

export interface Link {
  label: string;
  href: string;
}

export interface Gear {
  id: string;
  name: string;
  /** weapon = daily driver, armor = supporting tech, relic = retired but earned. */
  kind: "weapon" | "armor" | "relic";
  rarity: Rarity;
  /** Year first picked up — "years wielded" is derived from this. */
  since: number;
  /** Set when you have stopped using it, so the relic stops accruing years. */
  until?: number;
  blurb: string;
}

export interface Stat {
  id: string;
  label: string;
  /** 0–100. Drives the radar chart on the stat sheet. */
  value: number;
}

export interface Quest {
  id: string;
  slug: string;
  kind: QuestKind;
  zone: ZoneId;
  /** In-world name of the location. */
  worldTitle: string;
  /** Real-world job title. */
  role: string;
  org: string;
  orgUrl?: string;
  start: YearMonth | null;
  end: YearMonth | null;
  /** One or two sentences. Used on the quest card and the resume. */
  summary: string;
  /** Bullet points. Lead with impact. */
  highlights: string[];
  /**
   * Public tech stack. `null` means deliberately withheld — the UI renders
   * a "withheld" chip instead of a list. Do not work around this.
   */
  stack: string[] | null;
  /** Shown when `stack` is null. */
  stackNote?: string;
  /**
   * Whether to render the date range.
   *
   * Defaults to true for main quests and false for freelance, which is listed
   * by capability rather than chronology — freelance runs alongside full-time
   * work, so dates invite the wrong question. The dates stay in the data:
   * they still drive ordering and duration maths, they are just not shown.
   * Set explicitly to override either way.
   */
  showDates?: boolean;
  /** The one interaction this zone is built around. */
  signatureInteraction?: string;
}

/* ------------------------------------------------------------------ *
 * Profile
 * ------------------------------------------------------------------ */

export const profile = {
  name: "Jayesh Chawla",
  handle: "jayesh",
  title: "Frontend Engineer",
  /**
   * No year count here on purpose — it renders directly beside the computed
   * one, and two numbers that can disagree is one number too many.
   */
  tagline: "Turning designs into interfaces people actually use.",
  /**
   * Longer intro for Resume Mode. `{years}` is substituted by `bio()` below;
   * never write the number literally.
   */
  bioTemplate:
    "Frontend engineer with {years}+ years across hybrid mobile, React, and Next.js — " +
    "lately extending into infrastructure. I have shipped a production insurance app " +
    "to web, iOS and Android from one codebase, built a geofenced field-compensation " +
    "engine, rebuilt an AI product from the ground up twice, and led a full cloud " +
    "migration from GCP to Azure including production data.",
  location: "India",
  email: "jayeshchawla123@gmail.com",
  /**
   * Canonical site URL. The single place the domain is written — metadata,
   * sitemap, robots and the structured data all derive from it.
   *
   * No trailing slash: it gets composed with paths.
   */
  siteUrl: "https://jayeshchawla.dev",
  socials: [
    { label: "GitHub", href: "https://github.com/techexpertjc" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/jayeshchawlajc" },
  ] satisfies Link[],
  /** Career start. The only place a year count is stated — everything derives from it. */
  careerStart: "2019-06" as YearMonth,
};

/* ------------------------------------------------------------------ *
 * Stats — the in-game character sheet.
 *
 * Disciplines, not technologies. Never rendered in Resume Mode.
 * Add, remove or reorder freely — the radar chart derives its axis count,
 * angles and labels from this array, so it redraws itself to fit.
 * ------------------------------------------------------------------ */

export const stats: Stat[] = [
  { id: "frontend", label: "Frontend Engineering", value: 92 },
  { id: "motion", label: "Animation & Motion", value: 84 },
  { id: "devops", label: "DevOps & Cloud", value: 80 },
  { id: "mobile", label: "Mobile & Hybrid", value: 78 },
  { id: "mentorship", label: "Mentorship & Review", value: 76 },
  { id: "backend", label: "Backend & APIs", value: 74 },
  { id: "security", label: "Compliance & Security", value: 68 },
];

/* ------------------------------------------------------------------ *
 * Inventory — the tech stack as equipment
 * ------------------------------------------------------------------ */

export const gear: Gear[] = [
  {
    id: "react",
    name: "React",
    kind: "weapon",
    rarity: "legendary",
    since: 2020,
    blurb: "The main hand. Five years of production components, state and edge cases.",
  },
  {
    id: "next",
    name: "Next.js",
    kind: "weapon",
    rarity: "epic",
    since: 2022,
    blurb: "App Router, RSC, SSG. Reach for it when the work needs to rank and load fast.",
  },
  {
    id: "typescript",
    name: "TypeScript",
    kind: "armor",
    rarity: "legendary",
    since: 2020,
    blurb: "Worn at all times. Types as design, not decoration.",
  },
  {
    id: "node",
    name: "Node.js",
    kind: "weapon",
    rarity: "epic",
    since: 2021,
    blurb: "Cloud functions, WebRTC signalling services, and the glue between systems.",
  },
  {
    id: "flutter",
    name: "Flutter",
    kind: "weapon",
    rarity: "rare",
    since: 2022,
    blurb: "Cross-platform mobile when one codebase has to serve both stores.",
  },
  {
    id: "mobilefirst",
    name: "IBM MobileFirst 7",
    kind: "relic",
    rarity: "legendary",
    since: 2019,
    until: 2020,
    blurb:
      "An ancient relic. Few still know how to swing it — web, iOS and Android from a " +
      "single hybrid codebase, in production, for an insurance provider.",
  },
  {
    id: "azure",
    name: "Azure",
    kind: "armor",
    rarity: "epic",
    since: 2024,
    blurb: "Destination of the migration. Infra, networking, and production data.",
  },
  {
    id: "gcp",
    name: "Google Cloud",
    kind: "armor",
    rarity: "rare",
    since: 2023,
    blurb: "Origin of the migration. Knew it well enough to leave it safely.",
  },
  {
    id: "maps",
    name: "Google Maps API",
    kind: "weapon",
    rarity: "rare",
    since: 2020,
    until: 2021,
    blurb: "Geofencing, polygon containment, and distance maths that decided real payouts.",
  },
  {
    id: "firebase",
    name: "Firebase",
    kind: "armor",
    rarity: "rare",
    since: 2022,
    blurb: "Cloud Functions as a backend when the team needed one without running servers.",
  },
];

/* ------------------------------------------------------------------ *
 * Quests
 * ------------------------------------------------------------------ */

export const quests: Quest[] = [
  /* ---------------- MAIN ---------------- */
  {
    id: "streebo",
    slug: "streebo",
    kind: "main",
    zone: "streebo",
    worldTitle: "The Trinity Gate",
    role: "Associate Tech Consultant",
    org: "Streebo Soft Solutions Pvt Ltd",
    start: "2019-06",
    end: "2020-07",
    summary:
      "Built and supported a front-facing production application for an insurance " +
      "provider — website, iOS and Android delivered from a single IBM MobileFirst 7 " +
      "codebase.",
    highlights: [
      "Shipped one hybrid codebase to three platforms — web, iOS and Android — for a live insurance product used by real policyholders.",
      "Owned the application in production, not just in development.",
      "Provided L3 technical support: the escalation point when an issue survived the first two tiers.",
      "Learned production ownership on a framework with a small community and little margin for error.",
    ],
    stack: ["IBM MobileFirst 7", "JavaScript", "Cordova", "Hybrid iOS/Android"],
    signatureInteraction:
      "Three torii gates — Web, iOS, Android — dissolve and merge into one MobileFirst gate. " +
      "A shrine bell labelled L3 Support triggers a live production incident to triage.",
  },
  {
    id: "xmplify",
    slug: "xmplify",
    kind: "main",
    zone: "xmplify",
    worldTitle: "The Geofence Garden",
    role: "Associate Tech Consultant",
    org: "Xmplify Technolabs",
    start: "2020-08",
    end: "2021-05",
    summary:
      "Frontend engineer on a React + Spring Boot HRMS. Designed and built a geofencing " +
      "system that automatically calculated field-agent compensation from distance " +
      "travelled inside a mapped boundary.",
    highlights: [
      "Built the flagship geofencing feature end to end on the frontend using the Google Maps API.",
      "Automated field-agent compensation by measuring distance travelled within a geofenced area — replacing manual claims with a calculated figure.",
      "Handled polygon containment, boundary transitions and distance accumulation so the output could be trusted for real payouts.",
      "Delivered ongoing features and bug fixes across the wider HRMS frontend.",
    ],
    stack: ["React", "Google Maps API", "Spring Boot", "JavaScript"],
    signatureInteraction:
      "A shader-drawn geofence polygon on the ground. Drag its vertices while an NPC field " +
      "agent walks a route — the compensation counter ticks up inside the boundary and " +
      "freezes outside it. The feature itself, playable.",
  },
  {
    id: "patricia",
    slug: "patricia-ai",
    kind: "main",
    zone: "patricia",
    worldTitle: "The Observatory",
    role: "Frontend Engineer",
    org: "Patricia AI",
    orgUrl: "https://www.patricia-ai.com",
    start: "2021-06",
    end: "2023-11",
    summary:
      "Two and a half years building Patricia AI's web frontend from Figma to production — " +
      "twice, from the ground up, through two complete design overhauls.",
    highlights: [
      "Translated Figma designs into pixel-perfect React interfaces.",
      "Built the product from the ground up twice, across two full brand and design ramp-ups.",
      "Integrated the frontend with a Unity build, handing users off into a 3D navigable environment.",
      "Integrated REST APIs across the application surface.",
      "Reviewed pull requests and onboarded new joiners onto the frontend codebase.",
    ],
    stack: ["React", "TypeScript", "Material UI", "Emotion", "Unity (WebGL handoff)", "Stripe"],
    signatureInteraction:
      "Ghosted Figma frames snap onto the building's real architecture — hover for a " +
      "Figma-vs-built diff slider. The rooftop portal transitions into the Unity 3D nav home. " +
      "Then the whole building glitches and rebuilds itself in a new style: Design Ramp-Up x2.",
  },
  {
    id: "predixtions",
    slug: "predixtions",
    kind: "main",
    zone: "predixtions",
    worldTitle: "The Fortress",
    role: "Frontend Engineer → DevOps Engineer",
    org: "Predixtions Inc",
    start: "2023-12",
    end: null,
    summary:
      "Joined as a frontend engineer, drove the application to SOC 2 compliance, and now " +
      "work as a DevOps engineer — leading the migration of every application and the " +
      "entire infrastructure from GCP to Azure.",
    highlights: [
      "Led a full cloud migration from GCP to Azure covering all applications and infrastructure.",
      "Migrated production database data and bucket storage with the service intact.",
      "Took the application and supporting systems through SOC 2 compliance.",
      "Built and maintained the React frontend before moving into infrastructure.",
      "Grew from frontend into DevOps ownership inside two years.",
    ],
    stack: ["React", "TypeScript", "Azure", "Google Cloud", "SOC 2", "CI/CD"],
    signatureInteraction:
      "Three acts: the FE wing, a SOC 2 vault whose locks click into place as the compliance " +
      "checklist animates in, and the migration — the fortress detaches and cargo-lifts across " +
      "the sea to a second island while data crates fly overhead.",
  },

  /* ---------------- SIDE ---------------- */
  {
    id: "timee",
    slug: "timee",
    kind: "side",
    zone: "isles",
    worldTitle: "The Signal Lighthouse",
    role: "Freelance Engineer",
    org: "Timee",
    orgUrl: "https://app.timee.com",
    // TODO(jayesh): you said "around 2022" — set the real starting month if you have it.
    start: "2022-01",
    end: "2026-02",
    summary:
      "Backend and real-time work for a Flutter application — Firebase Cloud Functions as " +
      "the backend, plus Node services for WebRTC video built on LiveKit.",
    highlights: [
      "Built and managed the backend through Firebase Cloud Functions.",
      "Wrote Node applications for WebRTC real-time communication using LiveKit.",
      "Shipped improvements and bug fixes inside the Flutter client.",
    ],
    stack: ["Firebase Cloud Functions", "Node.js", "LiveKit", "WebRTC", "Flutter"],
    signatureInteraction:
      "A lighthouse beams a signal between two boats — the WebRTC handshake, made visible. " +
      "Cloud-function machinery turns below deck.",
  },
  {
    id: "hiike",
    slug: "hiike",
    kind: "side",
    zone: "isles",
    worldTitle: "The Workshop",
    role: "Freelance Full-Stack Engineer",
    org: "Hiike",
    // Canonical host: www.hiike.com 308-redirects here.
    orgUrl: "https://hiike.com",
    start: "2026-03",
    end: null,
    summary:
      "Full-stack engineer building complete features end to end — from the user-facing " +
      "interface through to the data and auth behind it — alongside bug fixes across the " +
      "application.",
    highlights: [
      "Developed entire features end to end, owning both the interface and the server side.",
      "Diagnosed and fixed bugs across the full stack.",
      "Worked independently as the engineer responsible for the feature, not just a layer of it.",
    ],
    // Withheld at the client's request. Do not populate this.
    stack: null,
    stackNote: "Stack details withheld at the client's request.",
    signatureInteraction:
      "A workshop with the bench set for both halves of the job — the tools on the wall are " +
      "deliberately unlabelled.",
  },
];

/* ------------------------------------------------------------------ *
 * Derived helpers
 * ------------------------------------------------------------------ */

export const mainQuests = quests.filter((q) => q.kind === "main");
export const sideQuests = quests.filter((q) => q.kind === "side");

/** Main quests show their dates; freelance does not, unless told otherwise. */
export function showsDates(quest: Quest): boolean {
  return quest.showDates ?? quest.kind === "main";
}

export function questBySlug(slug: string): Quest | undefined {
  return quests.find((q) => q.slug === slug);
}

/** Parses `YYYY-MM` into a Date at the first of that month. */
export function parseYearMonth(value: YearMonth): Date {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

/** "hiike.com" — the bit of a URL worth showing a reader. */
export function displayHost(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
}

/** "Jun 2019" */
export function formatYearMonth(value: YearMonth | null, fallback = "Present"): string {
  if (!value) return fallback;
  return parseYearMonth(value).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

/** "Jun 2019 — Jul 2020" */
export function formatRange(start: YearMonth | null, end: YearMonth | null): string {
  if (!start && !end) return "";
  return `${formatYearMonth(start, "?")} — ${formatYearMonth(end)}`;
}

/** Whole months between two dates, treating null end as now. */
export function durationMonths(start: YearMonth, end: YearMonth | null, now = new Date()): number {
  const from = parseYearMonth(start);
  const to = end ? parseYearMonth(end) : now;
  return Math.max(0, (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()));
}

/** "1 yr 2 mos" */
export function formatDuration(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years) parts.push(`${years} yr${years > 1 ? "s" : ""}`);
  if (rest) parts.push(`${rest} mo${rest > 1 ? "s" : ""}`);
  return parts.join(" ") || "< 1 mo";
}

/** Years of experience, computed so it never goes stale. */
export function yearsOfExperience(now = new Date()): number {
  return Math.floor(durationMonths(profile.careerStart, null, now) / 12);
}

/**
 * The bio, with the year count filled in from `careerStart`.
 *
 * Deliberately a function rather than a field on `profile`: the object literal
 * cannot call `yearsOfExperience()` during its own initialisation, and baking
 * the number in by hand is what let the tagline and the bio drift apart.
 */
export function bio(now = new Date()): string {
  return profile.bioTemplate.replace("{years}", String(yearsOfExperience(now)));
}

/** Years a piece of gear has been wielded. */
export function yearsWielded(item: Gear, now = new Date()): number {
  return Math.max(1, (item.until ?? now.getFullYear()) - item.since);
}
