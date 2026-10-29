import type { Report } from "./types";

const str = (v: unknown, max = 4000): string =>
  typeof v === "string" ? v.slice(0, max) : v == null ? "" : String(v).slice(0, max);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v.slice(0, 40) : []);
const strArr = (v: unknown) => arr(v).map((x) => (typeof x === "string" ? x : JSON.stringify(x))).filter(Boolean).map((s) => s.slice(0, 1000));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = any;
const obj = (v: unknown): Loose => (v && typeof v === "object" ? v : { text: v });

/** Extract the first JSON object from a model reply (handles ``` fences and stray prose). */
export function extractJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("No JSON object found");
  return JSON.parse(cleaned.slice(start, end + 1));
}

/** Coerce untrusted model output into a Report; throws if the core fields are missing. */
export function validateReport(raw: unknown): Report {
  if (!raw || typeof raw !== "object") throw new Error("Report is not an object");
  const r = raw as Loose;
  const summary = str(r.summary);
  if (!summary.trim()) throw new Error("Report is missing a summary");
  const sev = (s: unknown) => (s === "high" || s === "medium" ? s : "low") as "low" | "medium" | "high";
  return {
    summary,
    language: str(r.language, 40),
    key_concepts: strArr(r.key_concepts),
    outdated_patterns: arr(r.outdated_patterns).map(obj).map((o) => ({
      pattern: str(o.pattern ?? o.text, 300),
      explanation: str(o.explanation, 1000),
      modern_alternative: str(o.modern_alternative, 1000),
    })),
    potential_issues: arr(r.potential_issues).map(obj).map((o) => ({
      issue: str(o.issue ?? o.text, 500),
      severity: sev(o.severity),
      evidence: str(o.evidence, 1000),
    })),
    modernized_code: str(r.modernized_code, 16000),
    changes: arr(r.changes).map(obj).map((o) => ({ what: str(o.what ?? o.text, 500), why: str(o.why, 1000) })),
    line_explanations: arr(r.line_explanations).map(obj).map((o) => ({
      line: str(o.line, 20),
      code: str(o.code, 500),
      explanation: str(o.explanation ?? o.text, 1000),
    })),
    compatibility_notes: strArr(r.compatibility_notes),
    ghost_diary: str(r.ghost_diary, 1200),
    uncertainties: strArr(r.uncertainties),
  };
}
