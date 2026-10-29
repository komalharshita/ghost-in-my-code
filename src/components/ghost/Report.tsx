import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import type { AnalysisResult, Language } from "@/lib/ghost/types";
import { CodeBlock } from "./CodeEditor";

export function copy(text: string, label = "Copied") {
  navigator.clipboard.writeText(text).then(() => toast.success(label), () => toast.error("Clipboard unavailable in this browser"));
}

export const label = "font-mono text-[10px] uppercase tracking-[0.14em]";

function CopyBtn({ text, name }: { text: string; name: string }) {
  return (
    <button type="button" onClick={() => copy(text, `${name} copied`)} aria-label={`Copy ${name}`} className={`${label} inline-flex items-center gap-1 rounded border px-2 py-1 text-muted-foreground transition hover:border-primary/50 hover:text-primary focus-visible:outline-1 focus-visible:outline-primary`}>
      <Copy className="size-3" /> Copy
    </button>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mt-5 first:mt-0">
      <div className="mb-2 flex items-center justify-between"><h4 className={`${label} text-green-2`}>{title}</h4>{action}</div>
      {children}
    </div>
  );
}

function Row({ k, v, tone = "text-foreground" }: { k: string; v: string; tone?: string }) {
  return <div className="flex items-center justify-between gap-4 border-b px-3 py-2.5 last:border-0"><span className={`${label} text-muted-foreground`}>{k}</span><span className={`text-right font-mono text-xs font-semibold ${tone}`}>{v}</span></div>;
}

/** Render `code` spans inside model text without using HTML. */
function Rich({ text }: { text: string }) {
  return <>{text.split(/(`[^`]+`)/).map((p, i) => p.startsWith("`") && p.endsWith("`") ? <code key={i} className="font-mono text-primary">{p.slice(1, -1)}</code> : p)}</>;
}

const sev = { high: "text-destructive border-destructive/40", medium: "text-amber border-amber/40", low: "text-muted-foreground" } as const;
const TABS = ["overview", "autopsy", "modernize", "diary"] as const;
const TAB_LABEL = { overview: "Overview", autopsy: "Code Autopsy", modernize: "Modernize", diary: "Ghost Diary" };

export function ReportView({ result, originalCode, language }: { result: AnalysisResult; originalCode: string; language: Language }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("overview");
  const r = result.report;
  const compat = r.compatibility_notes[0] || (r.outdated_patterns.length ? "Review recommended" : "No issues flagged");
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div role="tablist" aria-label="Report sections" className="flex gap-6 overflow-x-auto border-b px-5">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`${label} -mb-px shrink-0 border-b-2 py-3.5 transition ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="flex-1 overflow-y-auto p-5 text-sm leading-relaxed animate-in fade-in duration-300" key={tab}>
        {result.source === "demo" && <p className={`${label} mb-4 inline-block rounded border border-amber/50 px-2 py-1 text-amber`}>Demo report · pre-written, not a live AI analysis</p>}

        {tab === "overview" && (
          <>
            <p className="text-[13px]"><Rich text={r.summary} /></p>
            <div className="mt-4 rounded-md border">
              <Row k="Language" v={r.language || language} tone="text-primary" />
              <Row k="Pattern" v={r.outdated_patterns[0]?.pattern || "None detected"} />
              <Row k="Compatibility" v={compat} tone="text-amber" />
            </div>
            {r.line_explanations.length > 0 && (
              <div className="mt-5 border-l-2 border-green-2/60 pl-3">
                <h4 className={`${label} mb-1.5 text-green-2`}>What the code does</h4>
                <ul className="space-y-1 text-xs text-muted-foreground">{r.line_explanations.map((l, i) => <li key={i}><span className="font-mono text-primary">L{l.line}</span> <Rich text={l.explanation} /></li>)}</ul>
              </div>
            )}
            {r.key_concepts.length > 0 && <Section title="Important concepts"><div className="flex flex-wrap gap-1.5">{r.key_concepts.map((k) => <span key={k} className="rounded border bg-elevated px-2 py-0.5 font-mono text-[11px]">{k}</span>)}</div></Section>}
            {r.uncertainties.length > 0 && <Section title="Uncertainties · verify by hand"><ul className="space-y-1 text-xs text-muted-foreground">{r.uncertainties.map((u, i) => <li key={i}>? {u}</li>)}</ul></Section>}
          </>
        )}

        {tab === "autopsy" && (
          <>
            <Section title="Static checks · deterministic, no AI">
              {result.deterministic.length ? <div className="rounded-md border">{result.deterministic.map((f) => (
                <div key={f.rule} className="border-b px-3 py-2.5 last:border-0"><p className="font-mono text-xs text-primary">{f.rule}{f.lines.length > 0 && <span className="text-muted-foreground"> · L{f.lines.join(", ")}</span>}</p><p className="mt-0.5 text-xs text-muted-foreground">{f.detail}</p></div>
              ))}</div> : <p className="text-xs text-muted-foreground">No rule matched. The rule set is small — this proves nothing.</p>}
            </Section>
            <Section title={`Outdated patterns · ${result.source === "demo" ? "demo" : "model"}`}>
              {r.outdated_patterns.length ? <div className="rounded-md border">{r.outdated_patterns.map((p, i) => (
                <div key={i} className="border-b px-3 py-2.5 last:border-0"><p className="font-mono text-xs text-amber">{p.pattern}</p><p className="mt-0.5 text-xs"><Rich text={p.explanation} /></p>{p.modern_alternative && <p className="mt-0.5 text-xs text-muted-foreground">→ <Rich text={p.modern_alternative} /></p>}</div>
              ))}</div> : <p className="text-xs text-muted-foreground">None reported.</p>}
            </Section>
            <Section title="Potential issues">
              {r.potential_issues.length ? <div className="rounded-md border">{r.potential_issues.map((p, i) => (
                <div key={i} className="border-b px-3 py-2.5 last:border-0"><p className="text-xs"><span className={`${label} mr-2 rounded border px-1.5 py-0.5 ${sev[p.severity]}`}>{p.severity}</span><Rich text={p.issue} /></p>{p.evidence && <p className="mt-1 text-xs text-muted-foreground">Evidence: <Rich text={p.evidence} /></p>}</div>
              ))}</div> : <p className="text-xs text-muted-foreground">None reported.</p>}
            </Section>
            {r.compatibility_notes.length > 0 && <Section title="Compatibility notes"><ul className="space-y-1 text-xs">{r.compatibility_notes.map((c, i) => <li key={i}>· {c}</li>)}</ul></Section>}
            {r.changes.length > 0 && <Section title="Suggested improvements"><ul className="space-y-1 text-xs">{r.changes.map((c, i) => <li key={i}>· <Rich text={c.what} /></li>)}</ul></Section>}
            <p className="mt-5 rounded border border-dashed p-3 text-[11px] text-muted-foreground">Code was never executed, compiled, benchmarked or security-tested.</p>
          </>
        )}

        {tab === "modernize" && (r.modernized_code ? (
          <>
            <div className="grid gap-3 xl:grid-cols-2">
              <div><div className="mb-1.5 flex items-center justify-between"><span className={`${label} text-muted-foreground`}>Original</span><CopyBtn text={originalCode} name="Original code" /></div><CodeBlock code={originalCode} language={language} /></div>
              <div><div className="mb-1.5 flex items-center justify-between"><span className={`${label} text-primary`}>Suggested</span><CopyBtn text={r.modernized_code} name="Suggested code" /></div><CodeBlock code={r.modernized_code} language={language} /></div>
            </div>
            <Section title="What changed & why">
              <div className="rounded-md border">{r.changes.map((c, i) => <div key={i} className="border-b px-3 py-2.5 last:border-0"><p className="text-xs font-medium"><Rich text={c.what} /></p><p className="mt-0.5 text-xs text-muted-foreground"><Rich text={c.why} /></p></div>)}</div>
            </Section>
            {r.compatibility_notes.length > 0 && <Section title="Compatibility"><ul className="space-y-1 text-xs">{r.compatibility_notes.map((c, i) => <li key={i}>· {c}</li>)}</ul></Section>}
            <p className="mt-5 rounded border border-amber/40 p-3 text-[11px] text-amber">Suggested rewrite only. Behavior may change — run your tests before adopting it.</p>
          </>
        ) : <p className="text-xs text-muted-foreground">No rewrite suggested.</p>)}

        {tab === "diary" && (
          <>
            <div className="flex items-center justify-between"><span className={`${label} text-amber`}>Fictional narrative</span><CopyBtn text={r.ghost_diary} name="Diary" /></div>
            <blockquote className="mt-3 rounded-md border border-l-2 border-l-primary bg-panel p-5 font-mono text-[13px] leading-relaxed text-foreground/90">
              <span className="text-primary">&gt; </span>{r.ghost_diary || "The ghost was silent."}<span className="cursor-blink" />
            </blockquote>
            <p className="mt-3 text-[11px] text-muted-foreground">Creative writing based on the snippet. No real author, date or history is implied.</p>
          </>
        )}
      </div>
    </div>
  );
}

export function CopiedIcon() { return <Check className="size-3" />; }
