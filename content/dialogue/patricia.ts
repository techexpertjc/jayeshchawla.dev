import type { DialogueScript } from "./types";

const ARCHITECT = { speaker: "Architect", portrait: "🔭" };

export const patriciaScript: DialogueScript = {
  id: "patricia",
  start: "greet",
  nodes: {
    greet: {
      lines: [
        { ...ARCHITECT, text: "Look at the frames hanging beside the walls." },
        {
          ...ARCHITECT,
          text: "Every one of them existed before its panel did — measured, spaced, decided. The building only had to agree with them.",
        },
      ],
      choices: [
        { label: "Why is it half-built twice?", next: "twice" },
        { label: "What is the ring at the top?", next: "portal" },
      ],
    },

    twice: {
      lines: [
        {
          ...ARCHITECT,
          text: "Because it was. Two and a half years here, and the whole thing raised from nothing on two separate occasions.",
        },
        {
          ...ARCHITECT,
          text: "New frames, new language, same ground. The second time you know which walls were load-bearing.",
        },
      ],
      choices: [
        { label: "What is the ring at the top?", next: "portal" },
        { label: "Show me the second pass.", next: "close" },
      ],
    },

    portal: {
      lines: [
        {
          ...ARCHITECT,
          text: "A door out of the flat world. Step through and you are handed to something built in Unity, walking a place instead of reading one.",
        },
        { ...ARCHITECT, text: "Getting someone across that seam without them noticing was most of the work." },
      ],
      choices: [
        { label: "Why is it half-built twice?", next: "twice" },
        { label: "Show me the second pass.", next: "close" },
      ],
    },

    close: {
      lines: [{ ...ARCHITECT, text: "Then stand back. It comes apart before it comes together." }],
      revealQuest: "patricia-ai",
    },
  },
};
