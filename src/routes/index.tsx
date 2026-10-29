import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Ghost, Play, Trash2, Save, FolderOpen, Loader2, Github, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ReportView } from "@/components/ghost/Report";
import { analyzeCode, getAiStatus } from "@/lib/ghost/analyze.functions";
import { runDeterministic } from "@/lib/ghost/deterministic";
import { SAMPLES, type Sample } from "@/lib/ghost/samples";
import { loadRelics, saveRelics } from "@/lib/ghost/storage";
import { LANGUAGES, LANGUAGE_LABELS, MAX_CODE_CHARS, MAX_TITLE_CHARS, type AnalysisResult, type Language, type SavedRelic } from "@/lib/ghost/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ghost in My Code — AI code archaeologist" },
      { name: "description", content: "Explain forgotten code, spot outdated patterns, get modern rewrites, and hear the story behind legacy software." },
      { property: "og:title", content: "Ghost in My Code — Every line of code has a past" },
      { property: "og:description", content: "An AI code archaeologist for legacy Python, JavaScript, Java, C and C++." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const PROGRESS = ["Dusting off the relic…", "Reading old inscriptions…", "Consulting the ghost…", "Drafting the archaeological report…"];
const REPO_URL = "https://github.com/your-username/ghost-in-my-code";

function Index() {
  const analyze = useServerFn(analyzeCode);
  const status = useServerFn(getAiStatus);
  const [ai, setAi] = useState<{ configured: boolean; model: string; provider: string; openWeight: boolean } | null>(null);
  const [code, setCode] = useState(SAMPLES[0].code);
  const [language, setLanguage] = useState<Language>(SAMPLES[0].language);
  const [title, setTitle] = useState(SAMPLES[0].title);
  const [sampleId, setSampleId] = useState<string | null>(SAMPLES[0].id);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [resultCode, setResultCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [relics, setRelics] = useState<SavedRelic[]>([]);
  const workspace = useRef<HTMLElement>(null);

  useEffect(() => { setRelics(loadRelics()); status().then(setAi).catch(() => setAi({ configured: false, model: "", provider: "", openWeight: false })); }, [status]);
  useEffect(() => { if (!loading) return; const t = setInterval(() => setStep((s) => (s + 1) % PROGRESS.length), 2200); return () => clearInterval(t); }, [loading]);

  const sample = sampleId ? SAMPLES.find((s) => s.id === sampleId) : undefined;
  const sampleUnchanged = !!sample && sample.code === code;
  const tooLong = code.length > MAX_CODE_CHARS;

  function pickSample(s: Sample) {
    setCode(s.code); setLanguage(s.language); setTitle(s.title); setSampleId(s.id); setError(null);
    workspace.current?.scrollIntoView({ behavior: "smooth" });
  }

  function showDemo() {
    if (!sample) return;
    const det = runDeterministic(sample.code, sample.language);
    setResult({ report: sample.demoReport, deterministic: det.findings, stats: det.stats, source: "demo", provider: "Bundled sample", model: "none", openWeight: false, createdAt: new Date().toISOString() });
    setResultCode(sample.code); setError(null);
  }

  async function run() {
    setError(null);
    if (!code.trim()) return setError("Paste some code first — the relic is empty.");
    if (tooLong) return setError(`Trim the code to ${MAX_CODE_CHARS} characters or fewer.`);
    setLoading(true); setStep(0);
    try {
      const res = await analyze({ data: { code, language, title: title.trim() || undefined } });
      if (res.ok) { setResult(res.result); setResultCode(code); toast.success("Excavation complete"); }
      else setError(res.error + (res.code === "not_configured" && sampleUnchanged ? " You can still view this sample's demo report." : ""));
    } catch { setError("Network error — check your connection and retry."); }
    finally { setLoading(false); }
  }

  function save() {
    if (!result) return;
    const relic: SavedRelic = { id: crypto.randomUUID(), title: title.trim() || "Untitled relic", language, code: resultCode, result, savedAt: new Date().toISOString() };
    const next = [relic, ...relics]; setRelics(next); saveRelics(next); toast.success("Relic saved to this browser");
  }
  function reopen(r: SavedRelic) { setCode(r.code); setLanguage(r.language); setTitle(r.title); setResult(r.result); setResultCode(r.code); setSampleId(null); workspace.current?.scrollIntoView({ behavior: "smooth" }); }
  function remove(id: string) { const next = relics.filter((r) => r.id !== id); setRelics(next); saveRelics(next); toast("Relic deleted"); }
  function clearAll() { setRelics([]); saveRelics([]); toast("History cleared"); }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3" aria-label="Main">
          <a href="#top" className="flex items-center gap-2 font-mono text-sm text-primary text-glow"><Ghost className="size-4" /> ghost_in_my_code</a>
          <div className="hidden gap-5 font-mono text-xs text-muted-foreground sm:flex">
            <a className="hover:text-primary" href="#workspace">workspace</a>
            <a className="hover:text-primary" href="#samples">samples</a>
            <a className="hover:text-primary" href="#saved">saved</a>
            <a className="hover:text-primary" href="#about">about</a>
          </div>
          <StatusBadge ai={ai} />
        </nav>
      </header>

      {/* HERO */}
      <section id="top" className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-2 lg:py-24">
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-700">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">Every line of code has a past.</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Your code has a past. <span className="text-primary text-glow">Let's uncover it.</span></h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">Decode forgotten logic, modernize outdated patterns, and hear the story behind your code.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="glow font-mono" onClick={() => workspace.current?.scrollIntoView({ behavior: "smooth" })}><Play className="size-4" /> Examine a Code Relic</Button>
            <Button size="lg" variant="outline" className="font-mono" asChild><a href="#samples">Explore Sample Relics</a></Button>
          </div>
        </div>
        <div className="rounded-lg border bg-panel shadow-2xl">
          <div className="flex items-center gap-1.5 border-b px-3 py-2"><span className="size-2.5 rounded-full bg-muted" /><span className="size-2.5 rounded-full bg-muted" /><span className="size-2.5 rounded-full bg-muted" /><span className="ml-2 font-mono text-[11px] text-muted-foreground">inventory.py — 2009?</span></div>
          <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-muted-foreground">{`for i in xrange(len(items.keys())):
    if items.has_key(name):
        print "%s: %d" % (name, n)`}</pre>
          <div className="border-t p-4 font-mono text-xs">
            <p className="text-primary">&gt; report.preview <span className="text-amber">(example)</span></p>
            <p className="mt-2 text-foreground">⚠ Python 2 print statement — invalid in Python 3</p>
            <p className="text-foreground">⚠ has_key() removed → use <span className="text-primary">name in items</span></p>
            <p className="mt-2 italic text-muted-foreground cursor-blink">"I counted apples one index at a time…"</p>
          </div>
        </div>
      </section>

      {/* WORKSPACE */}
      <section id="workspace" ref={workspace} className="mx-auto max-w-7xl scroll-mt-16 px-4 pb-16">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-4 font-mono text-sm uppercase tracking-widest text-primary">01 · The Relic</h2>
            <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_160px]">
              <div><label htmlFor="title" className="sr-only">Snippet title</label><Input id="title" placeholder="Snippet title (optional)" maxLength={MAX_TITLE_CHARS} value={title} onChange={(e) => setTitle(e.target.value)} className="font-mono text-xs" /></div>
              <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                <SelectTrigger aria-label="Language" className="font-mono text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{LANGUAGE_LABELS[l]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <label htmlFor="code" className="sr-only">Source code</label>
            <textarea id="code" spellCheck={false} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste your legacy code here…"
              onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") run(); }}
              className="h-[420px] w-full resize-y rounded-md border bg-panel p-4 font-mono text-xs leading-relaxed text-foreground outline-none focus:glow" />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span className={`font-mono text-xs ${tooLong ? "text-destructive" : "text-muted-foreground"}`}>{code.length} / {MAX_CODE_CHARS} chars · Ctrl+Enter to analyze</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setCode(""); setSampleId(null); setError(null); }}><Trash2 className="size-3.5" /> Clear</Button>
                {sampleUnchanged && <Button variant="outline" size="sm" onClick={showDemo}>View demo report</Button>}
                <Button size="sm" className="glow" onClick={run} disabled={loading}>{loading ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />} Analyze</Button>
              </div>
            </div>
            {error && <p role="alert" className="mt-3 rounded border border-destructive/50 p-3 text-sm text-destructive">{error}</p>}
            <p className="mt-3 flex gap-2 text-xs text-muted-foreground"><ShieldAlert className="size-4 shrink-0" />Analyzing sends your code to the configured AI provider ({ai?.provider || "none configured"}). It is never executed. Avoid pasting secrets.</p>
          </div>

          <div className="rounded-lg border bg-card p-4" aria-live="polite">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-mono text-sm uppercase tracking-widest text-primary">02 · Archaeological Report</h2>
              {result && <Button variant="outline" size="sm" onClick={save}><Save className="size-3.5" /> Save</Button>}
            </div>
            {loading ? (
              <div className="flex h-[420px] flex-col items-center justify-center gap-3 font-mono text-sm text-muted-foreground"><Loader2 className="size-6 animate-spin text-primary" /><span className="cursor-blink">{PROGRESS[step]}</span></div>
            ) : result ? <ReportView result={result} originalCode={resultCode} /> : (
              <div className="flex h-[420px] flex-col items-center justify-center gap-3 text-center text-muted-foreground"><Ghost className="size-10 text-primary/60 glitch" /><p className="font-mono text-sm">No report yet.</p><p className="max-w-xs text-xs">Paste code and press Analyze, or pick a sample relic below.</p></div>
            )}
          </div>
        </div>
      </section>

      {/* SAMPLES */}
      <section id="samples" className="mx-auto max-w-7xl scroll-mt-16 px-4 pb-16">
        <h2 className="mb-4 font-mono text-sm uppercase tracking-widest text-primary">03 · Sample Relics</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SAMPLES.map((s) => (
            <button key={s.id} onClick={() => pickSample(s)} className="rounded-lg border bg-card p-4 text-left transition hover:border-primary/60 hover:glow focus-visible:glow focus-visible:outline-none">
              <span className="font-mono text-[11px] uppercase text-amber">{LANGUAGE_LABELS[s.language]}</span>
              <p className="mt-1 font-medium">{s.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.blurb}</p>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Selecting a sample loads it into the editor. Analyze runs live AI; "View demo report" shows a clearly labeled pre-written report.</p>
      </section>

      {/* SAVED */}
      <section id="saved" className="mx-auto max-w-7xl scroll-mt-16 px-4 pb-16">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-mono text-sm uppercase tracking-widest text-primary">04 · Saved Relics</h2>
          {relics.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="ghost" size="sm">Clear all</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Clear all saved relics?</AlertDialogTitle><AlertDialogDescription>This deletes every saved analysis from this browser. It cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={clearAll}>Clear all</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        {relics.length === 0 ? <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Nothing saved yet. Saved relics stay only in this browser (localStorage).</p> : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {relics.map((r) => (
              <li key={r.id} className="rounded-lg border bg-card p-4">
                <p className="font-medium">{r.title}</p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">{LANGUAGE_LABELS[r.language]} · {r.result.source === "demo" ? "demo" : "AI"} · {new Date(r.savedAt).toLocaleString()}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => reopen(r)}><FolderOpen className="size-3.5" /> Reopen</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button size="sm" variant="ghost" aria-label={`Delete ${r.title}`}><Trash2 className="size-3.5" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Delete "{r.title}"?</AlertDialogTitle><AlertDialogDescription>This removes the saved analysis from this browser.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => remove(r.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ABOUT */}
      <section id="about" className="mx-auto max-w-3xl scroll-mt-16 px-4 pb-20 text-sm leading-relaxed text-muted-foreground">
        <h2 className="mb-4 font-mono text-sm uppercase tracking-widest text-primary">05 · About</h2>
        <p><span className="text-foreground">The problem.</span> Legacy code outlives its authors and documentation. Understanding it is slow, and rewriting it blindly is risky.</p>
        <p className="mt-3"><span className="text-foreground">Why open-weight AI.</span> Open models like Gemma can be inspected, self-hosted, and run without vendor lock-in — a good fit for code you may not want tied to one company.</p>
        <p className="mt-3"><span className="text-foreground">How it works.</span> A server function validates your input, runs deterministic regex checks (never executes code), then sends the snippet to the model with strict instructions to return JSON. The reply is validated server-side, retried once if malformed, and rendered as plain text. When an open-weight provider key is configured it uses Gemma; otherwise it falls back to the Lovable AI Gateway, labeled as a proprietary fallback.</p>
        <p className="mt-3"><span className="text-foreground">Privacy.</span> Code you analyze leaves your device and is processed by the AI provider shown at the top. Saved relics live only in your browser's localStorage. No accounts, no server-side storage.</p>
        <p className="mt-4"><a href={REPO_URL} className="inline-flex items-center gap-1.5 text-primary hover:underline"><Github className="size-4" /> Source & README</a> <span className="text-xs">(update the link once the repository is public)</span></p>
      </section>

      <footer className="border-t py-6 text-center font-mono text-[11px] text-muted-foreground">Ghost in My Code · built for DEV Hacktoberfest "Ghost in the Machine"</footer>
    </div>
  );
}

function StatusBadge({ ai }: { ai: { configured: boolean; model: string; openWeight: boolean } | null }) {
  if (!ai) return <span className="font-mono text-[11px] text-muted-foreground">checking AI…</span>;
  if (!ai.configured) return <span className="rounded border border-amber/60 px-2 py-1 font-mono text-[11px] text-amber">DEMO MODE · AI not configured</span>;
  return <span className="max-w-[55vw] truncate rounded border border-primary/50 px-2 py-1 font-mono text-[11px] text-primary" title={ai.model}>● AI online · {ai.model}{ai.openWeight ? "" : " (fallback)"}</span>;
}
