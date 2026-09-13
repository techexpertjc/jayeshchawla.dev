export type WorkItem = {
  href: string;
  shotLabel: string;
  shot?: string;
  title: string;
  period: string;
  current?: boolean;
  desc: string;
  tags: string[];
  offset?: boolean;
};

export const workItems: WorkItem[] = [
  {
    href: "https://www.patricia-ai.com",
    shot: "/media/work/patricia.jpg",
    shotLabel: "screenshot → patricia-ai.com",
    title: "Patricia AI",
    period: "2021 — 2023",
    desc: "Owned the web frontend from Figma to production across two full design overhauls, including a handoff into a Unity WebGL 3D environment and Stripe payments.",
    tags: ["React", "TypeScript", "Material UI", "Unity WebGL", "Stripe"],
  },
  {
    href: "https://www.hiike.com",
    shot: "/media/work/hiike.jpg",
    shotLabel: "screenshot → hiike.com",
    title: "Hiike",
    period: "Freelance",
    desc: "Owned complete features end to end — the user-facing interface through the data and auth layer behind it — as part of a small dev team, with direct client accountability.",
    tags: ["Next.js", "Node.js", "Auth", "Full-stack"],
    offset: true,
  },
  {
    href: "https://impumpkin02.com",
    shot: "/media/work/pumpkin.jpg",
    shotLabel: "screenshot → impumpkin02.com",
    title: "Pumpkin",
    period: "Side project",
    desc: "Personal site for a Vietnamese travel and lifestyle creator — bilingual VI/EN, dark and light themes, and a map of the places she has covered, built to hold up on the phones her audience actually uses.",
    tags: ["Next.js", "TypeScript", "i18n", "Netlify"],
  },
  {
    href: "https://univo.de",
    shot: "/media/work/univo.jpg",
    shotLabel: "screenshot → univo.de",
    title: "Univo",
    period: "Current",
    current: true,
    desc: "A European secure-workspace platform — chat, meetings and collaboration in one product, built with data sovereignty as a requirement rather than a feature. I work across the full stack in a two-developer team, sharing deployment and architectural decisions.",
    tags: ["Full-stack", "Architecture", "Deployment"],
    offset: true,
  },
  {
    href: "https://emgage.work",
    shot: "/media/work/emgage.jpg",
    shotLabel: "screenshot → emgage.work",
    title: "Emgage",
    period: "2020 — 2021",
    desc: "Frontend work across an employee-management platform, including a flagship geofencing feature: polygon containment, boundary transitions and distance accumulation, accurate enough to drive real field-agent payouts and replace manual claims.",
    tags: ["React", "Google Maps API", "Spring Boot"],
  },
];

export const techMarquee = [
  "React",
  "Next.js",
  "TypeScript",
  "Material UI",
  "Emotion",
  "Node.js",
  "LiveKit",
  "Stripe",
  "Azure",
  "SOC 2",
];

export type ExperienceItem = {
  date: string;
  active?: boolean;
  title: string;
  company: string;
  bullets: string[];
  products?: { label: string; href: string }[];
  dashed?: boolean;
};

export const experienceItems: ExperienceItem[] = [
  {
    date: "Dec 2023 — Present",
    active: true,
    title: "Frontend Engineer → DevOps Engineer",
    company: "Predixtions Inc",
    bullets: [
      "Built and maintained the production React/TypeScript frontend before moving into infrastructure ownership.",
      "Took the application through SOC 2 compliance.",
      "Led a full GCP → Azure migration covering all applications, production database data and bucket storage, with the service kept live.",
    ],
    products: [
      { label: "predixtions.com ↗", href: "https://predixtions.com" },
      { label: "docgpt.legal ↗", href: "https://docgpt.legal" },
      { label: "xspan.ai ↗", href: "https://xspan.ai" },
      { label: "trustmodel.ai ↗", href: "https://trustmodel.ai" },
    ],
  },
  {
    date: "Jun 2021 — Nov 2023",
    title: "Frontend Engineer",
    company: "Patricia AI",
    bullets: [
      "Translated Figma designs into pixel-perfect React interfaces with TypeScript, Material UI and Emotion.",
      "Built the product frontend from the ground up twice, across two full brand and architecture overhauls.",
      "Integrated a Unity/WebGL build, handing users into a 3D navigable environment, plus REST APIs and Stripe.",
      "Reviewed pull requests and onboarded new joiners onto the frontend codebase.",
    ],
  },
  {
    date: "Aug 2020 — May 2021",
    title: "Associate Tech Consultant",
    company: "Xmplify Technolabs",
    bullets: [
      "Built a flagship geofencing feature end to end on Emgage, a React + Spring Boot HRMS, using the Google Maps API.",
      "Automated field-agent compensation by calculating distance travelled inside a mapped boundary, replacing manual claims.",
      "Delivered ongoing features and bug fixes across the wider React HRMS frontend.",
    ],
  },
  {
    date: "Jun 2019 — Jul 2020",
    title: "Associate Tech Consultant",
    company: "Streebo Soft Solutions",
    bullets: [
      "Shipped one hybrid codebase to web, iOS and Android for a live consumer insurance product.",
      "Owned the application in production, not just in development, and provided L3 technical support.",
    ],
  },
  {
    date: "Alongside · Freelance",
    title: "Hiike · Timee",
    company: "Full-stack and real-time contract work",
    bullets: [],
    dashed: true,
  },
];

export type StackGroup = {
  eyebrow: string;
  accent?: boolean;
  title: string;
  items: string[];
};

export const stackGroups: StackGroup[] = [
  {
    eyebrow: "Daily driver",
    accent: true,
    title: "Frontend",
    items: [
      "React",
      "Next.js",
      "TypeScript",
      "JavaScript",
      "Material UI",
      "Emotion",
      "Google Maps API",
      "Unity / WebGL integration",
    ],
  },
  {
    eyebrow: "Shipped in production",
    title: "Platform & real-time",
    items: [
      "Node.js",
      "REST APIs",
      "Firebase Cloud Functions",
      "WebRTC / LiveKit",
      "Stripe",
      "Flutter",
      "Spring Boot (integration)",
    ],
  },
  {
    eyebrow: "Breadth",
    title: "Cloud & ops",
    items: ["Azure", "Google Cloud Platform", "CI/CD", "SOC 2 compliance", "Production database & storage migration"],
  },
];

export type Postcard = {
  id: string;
  rotate: number;
  left: number;
  top: number;
  width: number;
  photoHeight: number;
  place: string;
  year: string;
  photo?: string;
};

export const postcards: Postcard[] = [
  { id: "sq1", rotate: -6, left: 20, top: 40, width: 300, photoHeight: 200, photo: "/media/postcards/tuy-hoa.jpg", place: "Tuy Hoa", year: "2024" },
  { id: "sq2", rotate: 4, left: 368, top: -34, width: 320, photoHeight: 214, photo: "/media/postcards/koh-kham.jpg", place: "Koh Kham", year: "2024" },
  { id: "sq3", rotate: -3, left: 740, top: 56, width: 300, photoHeight: 200, photo: "/media/postcards/manali.jpg", place: "Manali", year: "2025" },
  { id: "sq4", rotate: 5, left: 60, top: 352, width: 320, photoHeight: 214, photo: "/media/postcards/koh-tao.jpg", place: "Koh Tao", year: "2025" },
  { id: "sq5", rotate: -7, left: 424, top: 398, width: 300, photoHeight: 200, photo: "/media/postcards/penida.jpg", place: "Penida", year: "2026" },
  { id: "sq6", rotate: 3, left: 854, top: 388, width: 320, photoHeight: 214, photo: "/media/postcards/east-java.jpg", place: "East Java", year: "2026" },
];

export const morphPanels: { headline: [string, string]; body: string }[] = [
  {
    headline: ["Figma in.", "Pixel-perfect React out."],
    body: "Two and a half years translating design files into production interfaces with TypeScript, Material UI and Emotion — matched to the spec, not approximated.",
  },
  {
    headline: ["Built from zero.", "Twice over."],
    body: "Patricia AI's frontend went through two complete brand and architecture overhauls. I rebuilt it both times, and the component architecture had to survive both.",
  },
  {
    headline: ["Then I took the", "infrastructure too."],
    body: "SOC 2 compliance, then a full GCP-to-Azure migration with the service kept live. It changed how I think about frontend architecture beyond the component level.",
  },
];
