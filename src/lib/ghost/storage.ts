import type { SavedRelic } from "./types";

const KEY = "ghost-in-my-code:relics";

export function loadRelics(): SavedRelic[] {
  try { const v = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
}
/** Returns false when storage is unavailable or full. */
export function saveRelics(list: SavedRelic[]): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50))); return true; } catch { return false; }
}
