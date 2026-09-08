import { profile } from "@/content/save-file";
import type { DialogueScript } from "./types";

const HOST = { speaker: "Innkeeper", portrait: "🏮" };

const github = profile.socials.find((s) => s.label === "GitHub")?.href;
const linkedin = profile.socials.find((s) => s.label === "LinkedIn")?.href;

/**
 * The save point.
 *
 * Contact details are read from `profile` rather than typed here, so there is
 * still exactly one place in the codebase where the email address lives.
 */
export const tavernScript: DialogueScript = {
  id: "tavern",
  start: "greet",
  nodes: {
    greet: {
      lines: [
        { ...HOST, text: "You have walked the whole road. Sit down." },
        {
          ...HOST,
          text: "Travellers who get this far usually want to say something to the man whose road it was.",
        },
      ],
      choices: [
        { label: "How do I reach him?", next: "contact" },
        { label: "What are the postcards?", next: "postcards" },
      ],
    },

    contact: {
      lines: [
        { ...HOST, text: `By letter: ${profile.email}` },
        {
          ...HOST,
          text: [
            github && `Code: ${github.replace("https://", "")}`,
            linkedin && `Work: ${linkedin.replace("https://www.", "")}`,
          ]
            .filter(Boolean)
            .join("   ·   "),
        },
      ],
      choices: [
        { label: "What are the postcards?", next: "postcards" },
        { label: "Thank you.", next: "close" },
      ],
    },

    postcards: {
      lines: [
        {
          ...HOST,
          text: "His. He travels when he is not building, and the wall fills up faster than the road does.",
        },
      ],
      choices: [
        { label: "How do I reach him?", next: "contact" },
        { label: "Thank you.", next: "close" },
      ],
    },

    close: {
      lines: [{ ...HOST, text: "Rest as long as you like. The save point does not expire." }],
    },
  },
};
