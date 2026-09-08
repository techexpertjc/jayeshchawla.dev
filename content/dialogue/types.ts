/**
 * The visual-novel script format.
 *
 * A script is a graph of nodes. Each node plays a run of lines, then either
 * offers choices or ends. Ending a node can reveal a quest card, which is how
 * dialogue hands off to the content in save-file.ts rather than restating it —
 * dialogue is flavour, `save-file.ts` is the record.
 */

export interface DialogueLine {
  speaker: string;
  /** Emoji stand-in until real portrait art exists. */
  portrait?: string;
  text: string;
}

export interface DialogueChoice {
  label: string;
  /** Node to jump to. Omit to end the conversation. */
  next?: string;
}

export interface DialogueNode {
  lines: DialogueLine[];
  choices?: DialogueChoice[];
  /** Quest slug from save-file.ts to reveal when this node finishes. */
  revealQuest?: string;
}

export interface DialogueScript {
  id: string;
  start: string;
  nodes: Record<string, DialogueNode>;
}
