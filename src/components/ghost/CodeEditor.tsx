import { useRef } from "react";
import type { Language } from "@/lib/ghost/types";
import { highlight } from "./highlight";

const shared = "m-0 whitespace-pre p-0 font-mono text-[13px] leading-[1.9]";

export function CodeEditor({ value, onChange, language, onSubmit }: { value: string; onChange: (v: string) => void; language: Language; onSubmit: () => void }) {
  const pre = useRef<HTMLPreElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  const lines = value.split("\n").length;
  return (
    <div className="relative flex h-[260px] overflow-hidden bg-panel sm:h-[300px] focus-within:shadow-[inset_0_0_0_1px_var(--primary)]">
      <div ref={gutter} aria-hidden className={`${shared} select-none overflow-hidden py-5 pl-4 pr-3 text-right text-muted-foreground/60`}>
        {Array.from({ length: lines }, (_, i) => <div key={i}>{String(i + 1).padStart(2, "0")}</div>)}
      </div>
      <div className="relative flex-1 overflow-hidden">
        <pre ref={pre} aria-hidden className={`${shared} pointer-events-none absolute inset-0 overflow-hidden py-5 pr-4 text-foreground`}>
          {highlight(value, language)}{"\n"}
        </pre>
        <textarea
          aria-label="Source code"
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={(e) => { const t = e.currentTarget; if (pre.current) { pre.current.scrollTop = t.scrollTop; pre.current.scrollLeft = t.scrollLeft; } if (gutter.current) gutter.current.scrollTop = t.scrollTop; }}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); onSubmit(); }
            else if (e.key === "Tab" && !e.shiftKey) {
              e.preventDefault();
              const t = e.currentTarget, s = t.selectionStart, en = t.selectionEnd;
              onChange(value.slice(0, s) + "    " + value.slice(en));
              requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = s + 4; });
            }
          }}
          placeholder="Paste a fragment from the past…"
          className={`${shared} absolute inset-0 h-full w-full resize-none overflow-auto bg-transparent py-5 pr-4 text-transparent caret-primary outline-none placeholder:text-muted-foreground`}
        />
      </div>
    </div>
  );
}

export function CodeBlock({ code, language }: { code: string; language: Language }) {
  return <pre className="max-h-[360px] overflow-auto rounded-md border bg-panel p-4 font-mono text-xs leading-relaxed text-foreground"><code>{highlight(code, language)}</code></pre>;
}
