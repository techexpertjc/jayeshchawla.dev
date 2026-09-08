import type { DialogueScript } from "./types";

const AGENT = { speaker: "Field Agent", portrait: "🧭" };

export const xmplifyScript: DialogueScript = {
  id: "xmplify",
  start: "greet",
  nodes: {
    greet: {
      lines: [
        { ...AGENT, text: "Mind the boundary. Everything I walk inside it, I get paid for." },
        {
          ...AGENT,
          text: "Everything outside it, I walk for free. Nobody used to be able to tell the difference.",
        },
      ],
      choices: [
        { label: "Who decided where the line goes?", next: "line" },
        { label: "How was it counted before?", next: "before" },
      ],
    },

    line: {
      lines: [
        {
          ...AGENT,
          text: "You can, apparently. Drag a corner and watch my wages move.",
        },
        {
          ...AGENT,
          text: "That is the whole trick — the map is not decoration, it is the thing doing the arithmetic.",
        },
      ],
      choices: [
        { label: "How was it counted before?", next: "before" },
        { label: "Understood.", next: "close" },
      ],
    },

    before: {
      lines: [
        { ...AGENT, text: "Before? I wrote it on a form. Someone else believed me, or did not." },
        {
          ...AGENT,
          text: "Now the polygon decides, the distance adds itself up, and the figure is already there when I get back.",
        },
      ],
      choices: [
        { label: "Who decides where the line goes?", next: "line" },
        { label: "Understood.", next: "close" },
      ],
    },

    close: {
      lines: [{ ...AGENT, text: "Then you have the measure of it. Safe travels." }],
      revealQuest: "xmplify",
    },
  },
};
