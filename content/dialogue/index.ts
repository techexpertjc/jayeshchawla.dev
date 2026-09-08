import type { DialogueScript } from "./types";
import { streeboScript } from "./streebo";
import { xmplifyScript } from "./xmplify";
import { patriciaScript } from "./patricia";
import { predixtionsScript } from "./predixtions";
import { hiikeScript, timeeScript } from "./isles";
import { tavernScript } from "./tavern";

export * from "./types";

/** Every script, keyed by id. Add new zones here. */
export const scripts: Record<string, DialogueScript> = {
  [streeboScript.id]: streeboScript,
  [xmplifyScript.id]: xmplifyScript,
  [patriciaScript.id]: patriciaScript,
  [predixtionsScript.id]: predixtionsScript,
  [timeeScript.id]: timeeScript,
  [hiikeScript.id]: hiikeScript,
  [tavernScript.id]: tavernScript,
};

export function scriptById(id: string): DialogueScript | undefined {
  return scripts[id];
}
