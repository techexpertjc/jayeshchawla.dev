import type { DialogueScript } from "./types";

const WARDEN = { speaker: "Warden", portrait: "🏰" };

export const predixtionsScript: DialogueScript = {
  id: "predixtions",
  start: "greet",
  nodes: {
    greet: {
      lines: [
        { ...WARDEN, text: "You are looking at a fortress that has to be somewhere else by morning." },
        {
          ...WARDEN,
          text: "Not a copy of it. It. Every application, every server, and the production data with them.",
        },
      ],
      choices: [
        { label: "Why move at all?", next: "why" },
        { label: "What is the vault for?", next: "vault" },
      ],
    },

    why: {
      lines: [
        { ...WARDEN, text: "One cloud to another. GCP behind us, Azure ahead." },
        {
          ...WARDEN,
          text: "The hard part was never the buildings. It was the crates — the database and the buckets, which have to arrive intact and arrive once.",
        },
      ],
      choices: [
        { label: "What is the vault for?", next: "vault" },
        { label: "Then move it.", next: "close" },
      ],
    },

    vault: {
      lines: [
        {
          ...WARDEN,
          text: "SOC 2. Before anyone would trust us with their data, we had to prove we could be trusted with it.",
        },
        { ...WARDEN, text: "Bolts first. Then you are allowed to move." },
      ],
      choices: [
        { label: "Why move at all?", next: "why" },
        { label: "Then move it.", next: "close" },
      ],
    },

    close: {
      lines: [
        { ...WARDEN, text: "Stand back. This is the part people come to watch." },
      ],
      revealQuest: "predixtions",
    },
  },
};
