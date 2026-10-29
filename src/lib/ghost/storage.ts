import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { LANGUAGES, MAX_TITLE_CHARS, type AnalysisResult, type Language, type SavedRelic } from "./types";

/** Edit tokens for relics this browser created: { relicId: token }. Only the token proves ownership. */
const TOKENS_KEY = "ghost-in-my-code:edit-tokens";

export function loadTokens(): Record<string, string> {
  try { const v = JSON.parse(localStorage.getItem(TOKENS_KEY) || "{}"); return v && typeof v === "object" ? v : {}; } catch { return {}; }
}
function setTokens(t: Record<string, string>) { try { localStorage.setItem(TOKENS_KEY, JSON.stringify(t)); } catch { /* ignore */ } }

const COLS = "id, title, language, code, result, created_at";
type Row = { id: string; title: string; language: string; code: string; result: Json | null; created_at: string };

export function toRelic(r: Row): SavedRelic {
  const language = (LANGUAGES as readonly string[]).includes(r.language) ? (r.language as Language) : "python";
  return { id: r.id, title: r.title, language, code: r.code, result: (r.result as unknown as AnalysisResult) ?? null, savedAt: r.created_at };
}

export async function listRelics(opts: { ids?: string[]; limit?: number } = {}): Promise<SavedRelic[]> {
  let q = supabase.from("relics").select(COLS).order("created_at", { ascending: false }).limit(opts.limit ?? 60);
  if (opts.ids) { if (!opts.ids.length) return []; q = q.in("id", opts.ids); }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data as Row[]).map(toRelic);
}

export async function getRelic(id: string): Promise<SavedRelic | null> {
  const { data, error } = await supabase.from("relics").select(COLS).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toRelic(data as Row) : null;
}

export async function createRelic(input: { title: string; language: Language; code: string; result: AnalysisResult | null }): Promise<string> {
  const id = crypto.randomUUID(); const token = crypto.randomUUID();
  const { error } = await supabase.from("relics").insert({
    id, edit_token: token, title: input.title.trim().slice(0, MAX_TITLE_CHARS) || "Untitled relic",
    language: input.language, code: input.code, result: input.result as unknown as Json,
  });
  if (error) throw new Error(error.message);
  setTokens({ ...loadTokens(), [id]: token });
  return id;
}

export async function renameRelic(id: string, title: string): Promise<boolean> {
  const token = loadTokens()[id]; if (!token) return false;
  const { data, error } = await supabase.rpc("rename_relic", { _id: id, _token: token, _title: title });
  if (error) throw new Error(error.message);
  return !!data;
}

export async function deleteRelic(id: string): Promise<boolean> {
  const token = loadTokens()[id]; if (!token) return false;
  const { data, error } = await supabase.rpc("delete_relic", { _id: id, _token: token });
  if (error) throw new Error(error.message);
  const t = loadTokens(); delete t[id]; setTokens(t);
  return !!data;
}
