import type { DeterministicFinding, Language } from "./types";

interface Rule { lang: Language[]; re: RegExp; rule: string; detail: string }

const RULES: Rule[] = [
  { lang: ["python"], re: /^\s*print\s+[^(\s]/, rule: "Python 2 print statement", detail: "`print x` is invalid in Python 3; use print(x)." },
  { lang: ["python"], re: /\b(xrange|raw_input|iteritems|has_key)\b/, rule: "Python 2-only builtin", detail: "xrange/raw_input/iteritems/has_key were removed in Python 3." },
  { lang: ["python"], re: /except\s+\w+\s*,\s*\w+\s*:/, rule: "Python 2 except syntax", detail: "`except E, e:` must be `except E as e:` in Python 3." },
  { lang: ["python"], re: /%\s*\(|"\s*%\s*[\w(]/, rule: "%-style string formatting", detail: "Works, but f-strings are usually clearer." },
  { lang: ["javascript"], re: /\bvar\s+\w/, rule: "`var` declaration", detail: "Function-scoped; prefer const/let." },
  { lang: ["javascript"], re: /function\s*\(\s*err\b/, rule: "Node-style error-first callback", detail: "Consider Promises / async-await." },
  { lang: ["javascript"], re: /==[^=]|!=[^=]/, rule: "Loose equality", detail: "== performs type coercion; === is usually intended." },
  { lang: ["c", "cpp"], re: /\b(gets|strcpy|strcat|sprintf)\s*\(/, rule: "Unbounded string function", detail: "No bounds checking; risk of buffer overflow." },
  { lang: ["c", "cpp"], re: /\bmalloc\s*\(/, rule: "Manual allocation (malloc)", detail: "Ensure every allocation is freed and checked for NULL." },
  { lang: ["cpp"], re: /\bnew\s+\w+(\[|\()/, rule: "Raw `new`", detail: "Prefer smart pointers or containers in modern C++." },
  { lang: ["java"], re: /\b(Vector|Hashtable|StringBuffer)\b/, rule: "Legacy synchronized collection", detail: "ArrayList/HashMap/StringBuilder are usually preferred." },
  { lang: ["java"], re: /\bnew\s+(ArrayList|HashMap)\s*\(\s*\)/, rule: "Raw generic type", detail: "Missing type parameters loses compile-time checks." },
];

/** Static, regex-based checks. These never execute the code. */
export function runDeterministic(code: string, language: Language) {
  const lines = code.split("\n");
  const findings = new Map<string, DeterministicFinding>();
  lines.forEach((line, i) => {
    for (const r of RULES) {
      if (!r.lang.includes(language) || !r.re.test(line)) continue;
      const f = findings.get(r.rule) ?? { rule: r.rule, detail: r.detail, lines: [] };
      f.lines.push(i + 1);
      findings.set(r.rule, f);
    }
  });

  // Loop nesting depth estimate (indent-based for Python, brace-based otherwise).
  let maxNesting = 0;
  if (language === "python") {
    const stack: number[] = [];
    for (const line of lines) {
      if (!line.trim()) continue;
      const indent = line.length - line.trimStart().length;
      while (stack.length && indent <= stack[stack.length - 1]) stack.pop();
      if (/^\s*(for|while)\b/.test(line)) { stack.push(indent); maxNesting = Math.max(maxNesting, stack.length); }
    }
  } else {
    let depth = 0; const loopDepths: number[] = []; let pendingLoop = false;
    for (const ch of code.replace(/(for|while)\s*\(/g, "\u0001(")) {
      if (ch === "\u0001") pendingLoop = true;
      else if (ch === "{") { depth++; if (pendingLoop) { loopDepths.push(depth); pendingLoop = false; maxNesting = Math.max(maxNesting, loopDepths.length); } }
      else if (ch === "}") { if (loopDepths[loopDepths.length - 1] === depth) loopDepths.pop(); depth--; }
    }
  }
  if (maxNesting >= 3) findings.set("Deep loop nesting", { rule: "Deep loop nesting", detail: `Loops nested ${maxNesting} levels deep; often a sign of O(n^${maxNesting}) work worth reviewing.`, lines: [] });

  return { findings: [...findings.values()], stats: { lines: lines.length, chars: code.length, maxNesting } };
}
