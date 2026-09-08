import { create } from "zustand";
import { scriptById } from "@/content/dialogue";

/**
 * All HUD and game state.
 *
 * Deliberately free of any three.js import: this is shared by the DOM HUD and
 * the 3D scene, and pulling three in here would drag it into the route's
 * initial bundle. See the note in game/camera/railsState.ts.
 */

/** Story rides the rails; Explore hands you the controls. */
export type Mode = "story" | "explore";

export type Panel = "quests" | "inventory" | "stats" | "postcards" | null;

export interface DialoguePosition {
  scriptId: string;
  nodeId: string;
  lineIndex: number;
}

export interface CinematicShot {
  /** World-space camera position. */
  position: [number, number, number];
  /** World-space point to aim at. */
  focus: [number, number, number];
  /**
   * Freeze the player for the duration. True for a set piece that must play
   * out; false for a composed viewpoint the visitor can simply walk out of.
   */
  lockPlayer?: boolean;
}

export interface Nearby {
  id: string;
  /** Shown in the interaction prompt, e.g. "Examine the Trinity Gate". */
  label: string;
  /** Dialogue to open. Mutually exclusive with `panel`. */
  scriptId?: string;
  /** Panel to open instead of a conversation — for things you look at rather
   *  than talk to, like the postcard board. */
  panel?: NonNullable<Panel>;
}

interface GameState {
  mode: Mode;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;

  moving: boolean;
  setMoving: (moving: boolean) => void;

  /** The interactable currently in range, if any. */
  nearby: Nearby | null;
  setNearby: (nearby: Nearby | null) => void;

  /**
   * True while the pointer is dragging something in the 3D world (a geofence
   * corner, say). The camera stops orbiting so one gesture does one thing.
   */
  worldDrag: boolean;
  setWorldDrag: (dragging: boolean) => void;

  /**
   * A framing a zone has claimed for a set piece. While set, the camera flies
   * to it and holds, ignoring both the rails and the player — some things are
   * worth taking the controls away for. Cleared when the sequence ends.
   */
  cinematic: CinematicShot | null;
  setCinematic: (shot: CinematicShot | null) => void;

  /**
   * Acts on whatever is in range — opens its conversation, or its panel.
   * Lives here so the keyboard and the touch button cannot disagree about
   * what interacting means.
   */
  engageNearby: () => void;

  dialogue: DialoguePosition | null;
  openDialogue: (scriptId: string) => void;
  advance: () => void;
  choose: (index: number) => void;
  closeDialogue: () => void;

  /** Quest slug whose completion card is on screen. */
  questCard: string | null;
  dismissQuestCard: () => void;

  /** Quest slugs the visitor has uncovered. Drives the quest log. */
  discovered: string[];

  panel: Panel;
  setPanel: (panel: Panel) => void;
  togglePanel: (panel: NonNullable<Panel>) => void;
}

export const useGame = create<GameState>((set, get) => ({
  /*
    Story is the default: it needs no controls, works on a phone, and a visitor
    who does not want to play a game still gets the whole tour by scrolling.
    Explore is opt-in.
  */
  mode: "story",
  setMode: (mode) => set({ mode }),
  toggleMode: () => set((s) => ({ mode: s.mode === "story" ? "explore" : "story" })),

  moving: false,
  setMoving: (moving) => set({ moving }),

  nearby: null,
  setNearby: (nearby) => set({ nearby }),

  worldDrag: false,
  setWorldDrag: (worldDrag) => set({ worldDrag }),

  cinematic: null,
  setCinematic: (cinematic) => set({ cinematic }),

  engageNearby: () => {
    const { nearby, openDialogue, setPanel } = get();
    if (!nearby) return;
    if (nearby.panel) return setPanel(nearby.panel);
    if (nearby.scriptId) openDialogue(nearby.scriptId);
  },

  dialogue: null,

  openDialogue: (scriptId) => {
    const script = scriptById(scriptId);
    if (!script) return;
    set({
      dialogue: { scriptId, nodeId: script.start, lineIndex: 0 },
      panel: null,
    });
  },

  advance: () => {
    const { dialogue } = get();
    if (!dialogue) return;

    const node = scriptById(dialogue.scriptId)?.nodes[dialogue.nodeId];
    if (!node) return set({ dialogue: null });

    if (dialogue.lineIndex < node.lines.length - 1) {
      return set({ dialogue: { ...dialogue, lineIndex: dialogue.lineIndex + 1 } });
    }

    // On the last line: choices take over, otherwise the node ends.
    if (node.choices?.length) return;
    finish(node.revealQuest, set, get);
  },

  choose: (index) => {
    const { dialogue } = get();
    if (!dialogue) return;

    const node = scriptById(dialogue.scriptId)?.nodes[dialogue.nodeId];
    const choice = node?.choices?.[index];
    if (!choice) return;

    if (choice.next) {
      return set({ dialogue: { ...dialogue, nodeId: choice.next, lineIndex: 0 } });
    }
    finish(node?.revealQuest, set, get);
  },

  closeDialogue: () => set({ dialogue: null }),

  questCard: null,
  dismissQuestCard: () => set({ questCard: null }),

  discovered: [],

  panel: null,
  setPanel: (panel) => set({ panel }),
  togglePanel: (panel) =>
    set((s) => ({ panel: s.panel === panel ? null : panel, dialogue: null })),
}));

/*
  Dev-only handle for inspecting and driving state from the console:
  `__game.getState()`, `__game.setState({ mode: "explore" })`.
*/
/*
  Dev-only handle for inspecting and driving state from the console:
  `__game.getState()`, `__game.setState({ mode: "explore" })`.
*/
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as { __game?: unknown }).__game = useGame;
}

/** Ends the current conversation, revealing and recording a quest if it has one. */
function finish(
  revealQuest: string | undefined,
  set: (partial: Partial<GameState>) => void,
  get: () => GameState,
) {
  const discovered = get().discovered;
  set({
    dialogue: null,
    questCard: revealQuest ?? null,
    discovered:
      revealQuest && !discovered.includes(revealQuest)
        ? [...discovered, revealQuest]
        : discovered,
  });
}
