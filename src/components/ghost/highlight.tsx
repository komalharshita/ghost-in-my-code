import type { ReactNode } from "react";
import type { Language } from "@/lib/ghost/types";

const KW: Record<string, string[]> = {
  python: ["def", "return", "if", "elif", "else", "for", "while", "in", "import", "from", "as", "class", "try", "except", "finally", "with", "print", "and", "or", "not", "None", "True", "False", "lambda", "pass", "raise", "yield", "is"],
  javascript: ["var", "let", "const", "function", "return", "if", "else", "for", "while", "async", "await", "new", "class", "import", "export", "from", "try", "catch", "throw", "null", "undefined", "true", "false", "this", "require"],
  java: ["public", "private", "protected", "static", "class", "void", "int", "boolean", "new", "return", "if", "else", "for", "while", "import", "true", "false", "null", "final", "try", "catch", "throw", "extends", "implements"],
  cpp: ["#include", "int", "char", "void", "return", "if", "else", "for", "while", "const", "auto", "new", "delete", "class", "struct", "std", "using", "namespace", "nullptr", "size_t", "true", "false"],
  c: ["#include", "int", "char", "void", "return", "if", "else", "for", "while", "const", "struct", "sizeof", "size_t", "NULL", "unsigned", "static"],
};

const TOKEN = /(#.*$|\/\/.*$|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|(#?[A-Za-z_]\w*)(?=\s*\()?/gm;

/** Tiny tokenizer for display only — returns React text nodes (never HTML). */
export function highlight(code: string, language: Language): ReactNode[] {
  const kws = new Set(KW[language] ?? []);
  const out: ReactNode[] = [];
  let last = 0, i = 0;
  const re = new RegExp(TOKEN.source, "gm");
  for (let m = re.exec(code); m; m = re.exec(code)) {
    if (m.index > last) out.push(code.slice(last, m.index));
    const [t, com, str, num, word] = m;
    const isHashComment = com?.startsWith("#") && language !== "python" ? false : true;
    if (com && isHashComment) out.push(<span key={i++} className="tok-com">{t}</span>);
    else if (str) out.push(<span key={i++} className="tok-str">{t}</span>);
    else if (num) out.push(<span key={i++} className="tok-num">{t}</span>);
    else if (word && kws.has(word)) out.push(<span key={i++} className="tok-kw">{t}</span>);
    else if (word && code.slice(re.lastIndex).match(/^\s*\(/)) out.push(<span key={i++} className="tok-fn">{t}</span>);
    else out.push(t);
    last = re.lastIndex;
    if (m[0] === "") re.lastIndex++;
  }
  out.push(code.slice(last));
  return out;
}
