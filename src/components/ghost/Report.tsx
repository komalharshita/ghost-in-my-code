import { Copy, FlaskConical, Cpu, AlertTriangle, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import type { AnalysisResult } from "@/lib/ghost/types";

export function copy(text: string, label = "Copied") {
  navigator.clipboard.writeText(text).then(() => toast.success(label), () => toast.error("Clipboard unavailable"));
}

function CopyBtn({ text, label }: { text: string; label: string }) {
  return (
    <Button variant="ghost" size="sm" onClick={() => copy(text, `${label} copied`)} aria-label={`Copy ${label}`}>
      <Copy className="size-3.5" /> Copy
    </Button>
  );
}

function Code({ code }: { code: string }) {
  return <pre className="max-h-[480px] overflow-auto rounded-md border bg-panel p-4 font-mono text-xs leading-relaxed text-foreground"><code>{code}</code></pre>;
}

function H({ children }: { children: React.ReactNode }) {
  return <h4 className="mb-2 mt-5 font-mono text-xs uppercase tracking-widest text-primary first:mt-0">{children}</h4>;
}

const sevClass = { high: "text-destructive", medium: "text-amber", low: "text-muted-foreground" } as const;

export function ReportView({ result, originalCode }: { result: AnalysisResult; originalCode: string }) {
  const r = result.report;
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-4 flex flex-wrap items-center gap-2 font-mono text-[11px]">
        {result.source === "demo" ? (
          <span className="rounded border border-amber/60 px-2 py-1 text-amber">DEMO MODE · pre-written sample report, not a fresh AI analysis</span>
        ) : (
          <span className="rounded border border-primary/50 px-2 py-1 text-primary">
            AI · {result.model} via {result.provider} {result.openWeight ? "· open-weight" : "· proprietary fallback"}
          </span>
        )}
        <span className="text-muted-foreground">{result.stats.lines} lines · {result.stats.chars} chars</span>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-panel p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="autopsy">Code Autopsy</TabsTrigger>
          <TabsTrigger value="modern">Modernized</TabsTrigger>
          <TabsTrigger value="lines">Line-by-Line</TabsTrigger>
          <TabsTrigger value="diary">Message from the Past</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 text-sm leading-relaxed">
          <div className="flex items-start justify-between gap-2"><H>What it does</H><CopyBtn text={r.summary} label="Summary" /></div>
          <p>{r.summary}</p>
          {r.language && <p className="mt-3 font-mono text-xs text-muted-foreground">Language: {r.language}</p>}
          {r.key_concepts.length > 0 && (<><H>Key concepts</H><div className="flex flex-wrap gap-1.5">{r.key_concepts.map((k) => <span key={k} className="rounded border px-2 py-0.5 font-mono text-xs">{k}</span>)}</div></>)}
          {r.uncertainties.length > 0 && (<><H>Needs human verification</H><ul className="space-y-1">{r.uncertainties.map((u, i) => <li key={i} className="flex gap-2"><HelpCircle className="mt-0.5 size-4 shrink-0 text-amber" />{u}</li>)}</ul></>)}
        </TabsContent>

        <TabsContent value="autopsy" className="mt-4 text-sm leading-relaxed">
          <H><span className="inline-flex items-center gap-1.5"><FlaskConical className="size-3.5" /> Deterministic static checks (regex rules, no AI)</span></H>
          {result.deterministic.length ? (
            <ul className="space-y-2">{result.deterministic.map((f) => (
              <li key={f.rule} className="rounded border bg-panel p-3"><span className="font-mono text-xs text-primary">{f.rule}</span>{f.lines.length > 0 && <span className="font-mono text-xs text-muted-foreground"> · line {f.lines.join(", ")}</span>}<p className="mt-1 text-muted-foreground">{f.detail}</p></li>
            ))}</ul>
          ) : <p className="text-muted-foreground">No rule matched. (Rules are limited; absence of findings means nothing is proven.)</p>}

          <H><span className="inline-flex items-center gap-1.5"><Cpu className="size-3.5" /> {result.source === "demo" ? "Sample observations" : "Model observations"} — outdated patterns</span></H>
          {r.outdated_patterns.length ? <ul className="space-y-2">{r.outdated_patterns.map((p, i) => (
            <li key={i} className="rounded border p-3"><p className="font-mono text-xs text-amber">{p.pattern}</p><p className="mt-1">{p.explanation}</p>{p.modern_alternative && <p className="mt-1 text-muted-foreground">→ {p.modern_alternative}</p>}</li>
          ))}</ul> : <p className="text-muted-foreground">None reported.</p>}

          <H><span className="inline-flex items-center gap-1.5"><AlertTriangle className="size-3.5" /> Possible bugs & risks</span></H>
          {r.potential_issues.length ? <ul className="space-y-2">{r.potential_issues.map((p, i) => (
            <li key={i} className="rounded border p-3"><p><span className={`font-mono text-xs uppercase ${sevClass[p.severity]}`}>[{p.severity}]</span> {p.issue}</p>{p.evidence && <p className="mt-1 text-muted-foreground">Evidence: {p.evidence}</p>}</li>
          ))}</ul> : <p className="text-muted-foreground">None reported.</p>}

          {r.compatibility_notes.length > 0 && (<><H>Compatibility</H><ul className="list-disc space-y-1 pl-5">{r.compatibility_notes.map((c, i) => <li key={i}>{c}</li>)}</ul></>)}
          <p className="mt-5 rounded border border-dashed p-3 text-xs text-muted-foreground">The code was never executed, compiled, or tested. This review does not prove the code is correct or secure.</p>
        </TabsContent>

        <TabsContent value="modern" className="mt-4 text-sm">
          {r.modernized_code ? (
            <>
              <div className="grid gap-3 lg:grid-cols-2">
                <div><div className="mb-1 flex items-center justify-between font-mono text-xs text-muted-foreground">ORIGINAL<CopyBtn text={originalCode} label="Original code" /></div><Code code={originalCode} /></div>
                <div><div className="mb-1 flex items-center justify-between font-mono text-xs text-primary">SUGGESTED REWRITE<CopyBtn text={r.modernized_code} label="Modernized code" /></div><Code code={r.modernized_code} /></div>
              </div>
              <H>What changed & why</H>
              <ul className="space-y-2">{r.changes.map((c, i) => <li key={i} className="rounded border p-3"><p className="font-medium">{c.what}</p><p className="mt-1 text-muted-foreground">{c.why}</p></li>)}</ul>
              <p className="mt-4 rounded border border-dashed p-3 text-xs text-muted-foreground">This is a suggested rewrite. Behavior equivalence is not guaranteed — run your tests before adopting it.</p>
            </>
          ) : <p className="text-muted-foreground">No rewrite was suggested.</p>}
        </TabsContent>

        <TabsContent value="lines" className="mt-4 text-sm">
          <div className="flex justify-end"><CopyBtn text={r.line_explanations.map((l) => `L${l.line}: ${l.code}\n  ${l.explanation}`).join("\n")} label="Explanations" /></div>
          <ol className="space-y-2">{r.line_explanations.map((l, i) => (
            <li key={i} className="rounded border p-3"><p className="font-mono text-xs"><span className="text-primary">L{l.line}</span> <span className="text-muted-foreground">{l.code}</span></p><p className="mt-1">{l.explanation}</p></li>
          ))}</ol>
        </TabsContent>

        <TabsContent value="diary" className="mt-4">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-amber">Fictional storytelling · not factual history</p>
          <blockquote className="rounded-md border-l-2 border-amber bg-panel p-5 font-mono text-sm italic leading-relaxed">{r.ghost_diary || "The ghost was silent."}</blockquote>
          <div className="mt-2 flex justify-end"><CopyBtn text={r.ghost_diary} label="Diary" /></div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
