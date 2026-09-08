import type { DialogueScript } from "./types";

const KEEPER = { speaker: "Lighthouse Keeper", portrait: "🗼" };
const SMITH = { speaker: "Workshop Hand", portrait: "🔧" };

export const timeeScript: DialogueScript = {
  id: "timee",
  start: "greet",
  nodes: {
    greet: {
      lines: [
        { ...KEEPER, text: "Two boats. Neither can shout far enough to reach the other." },
        {
          ...KEEPER,
          text: "So the light does the introducing. Once they can see each other, they talk directly and I stop being involved.",
        },
      ],
      choices: [
        { label: "That is just signalling.", next: "signal" },
        { label: "Who keeps the light on?", next: "keep" },
      ],
    },

    signal: {
      lines: [
        {
          ...KEEPER,
          text: "It is exactly signalling. The hard part was never the picture or the sound — it was the handshake before either.",
        },
      ],
      choices: [
        { label: "Who keeps the light on?", next: "keep" },
        { label: "Understood.", next: "close" },
      ],
    },

    keep: {
      lines: [
        {
          ...KEEPER,
          text: "Nobody, on purpose. Functions that wake when called and sleep when they are not — no keeper's cottage, no rota, no server sitting idle at four in the morning.",
        },
      ],
      choices: [
        { label: "That is just signalling.", next: "signal" },
        { label: "Understood.", next: "close" },
      ],
    },

    close: {
      lines: [{ ...KEEPER, text: "Safe crossing, then." }],
      revealQuest: "timee",
    },
  },
};

export const hiikeScript: DialogueScript = {
  id: "hiike",
  start: "greet",
  nodes: {
    greet: {
      lines: [
        { ...SMITH, text: "You will notice none of the tools are labelled." },
        { ...SMITH, text: "That is on purpose. The client would rather I described the work than the workshop." },
      ],
      choices: [
        { label: "So what was the work?", next: "work" },
        { label: "Fair enough.", next: "close" },
      ],
    },

    work: {
      lines: [
        {
          ...SMITH,
          text: "Whole features, end to end. The screen someone touches, the data behind it, and the question of who is allowed to see it.",
        },
        {
          ...SMITH,
          text: "One bench, both halves of the job. Nobody handed me a finished back end to plug into.",
        },
      ],
      choices: [{ label: "Fair enough.", next: "close" }],
    },

    close: {
      lines: [{ ...SMITH, text: "Then that is the measure of it. Mind the bench on your way out." }],
      revealQuest: "hiike",
    },
  },
};
