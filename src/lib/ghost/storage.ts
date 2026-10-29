import type { SavedRelic } from "./types";

const KEY = "ghost-in-my-code:relics";

export function loadRelics(): SavedRelic[] {
  try { const v = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
}
export function saveRelics(list: SavedRelic[]) {
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)));
}
