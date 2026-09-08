import type { DialogueScript } from "./types";

const KEEPER = { speaker: "Shrine Keeper", portrait: "⛩️" };

export const streeboScript: DialogueScript = {
  id: "streebo",
  start: "greet",
  nodes: {
    greet: {
      lines: [
        { ...KEEPER, text: "You found the Trinity Gate." },
        {
          ...KEEPER,
          text: "Three gates stood here once. Web. iOS. Android. Each wanted its own prayers.",
        },
        {
          ...KEEPER,
          text: "Most who came tended all three separately, and grew tired, and left.",
        },
      ],
      choices: [
        { label: "So who bound them into one?", next: "how" },
        { label: "What is the bell for?", next: "bell" },
      ],
    },

    how: {
      lines: [
        {
          ...KEEPER,
          text: "One did. With a relic called IBM MobileFirst 7 — a framework few still know how to swing.",
        },
        {
          ...KEEPER,
          text: "One codebase. Three platforms. A live insurance product, and policyholders who never once had to care which gate they walked through.",
        },
      ],
      choices: [
        { label: "And the bell?", next: "bell" },
        { label: "I have seen enough.", next: "close" },
      ],
    },

    bell: {
      lines: [
        {
          ...KEEPER,
          text: "The bell is for when something breaks in production and the first two who tried could not mend it.",
        },
        { ...KEEPER, text: "L3, they called it. The last person you get to ask." },
        { ...KEEPER, text: "It rang. Someone always answered." },
      ],
      choices: [
        { label: "Who bound the gates?", next: "how" },
        { label: "I have seen enough.", next: "close" },
      ],
    },

    close: {
      lines: [
        { ...KEEPER, text: "Then take the record with you. Walk on when you are ready." },
      ],
      revealQuest: "streebo",
    },
  },
};
