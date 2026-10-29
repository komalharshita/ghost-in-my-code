export const LANGUAGES = ["python", "javascript", "java", "cpp", "c"] as const;
export type Language = (typeof LANGUAGES)[number];
export const LANGUAGE_LABELS: Record<Language, string> = {
  python: "Python",
  javascript: "JavaScript",
  java: "Java",
  cpp: "C++",
  c: "C",
};
export const MAX_CODE_CHARS = 8000;
export const MAX_TITLE_CHARS = 80;

export interface OutdatedPattern { pattern: string; explanation: string; modern_alternative: string }
export interface PotentialIssue { issue: string; severity: "low" | "medium" | "high"; evidence: string }
export interface Change { what: string; why: string }
export interface LineExplanation { line: string; code: string; explanation: string }

export interface Report {
  summary: string;
  language: string;
  key_concepts: string[];
  outdated_patterns: OutdatedPattern[];
  potential_issues: PotentialIssue[];
  modernized_code: string;
  changes: Change[];
  line_explanations: LineExplanation[];
  compatibility_notes: string[];
  ghost_diary: string;
  uncertainties: string[];
}

export interface DeterministicFinding { rule: string; detail: string; lines: number[] }

export interface AnalysisResult {
  report: Report;
  deterministic: DeterministicFinding[];
  stats: { lines: number; chars: number; maxNesting: number };
  source: "ai" | "demo";
  provider: string;
  model: string;
  openWeight: boolean;
  createdAt: string;
}

export interface SavedRelic {
  id: string;
  title: string;
  language: Language;
  code: string;
  result: AnalysisResult;
  savedAt: string;
}
