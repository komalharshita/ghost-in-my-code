import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Play, Save, Github, Menu, X, Check, Loader2, Trash2, FolderOpen, Pencil, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ReportView, label } from "@/components/ghost/Report";
import { CodeEditor } from "@/components/ghost/CodeEditor";
import { analyzeCode, getAiStatus } from "@/lib/ghost/analyze.functions";
import { runDeterministic } from "@/lib/ghost/deterministic";
import { SAMPLES, type Sample } from "@/lib/ghost/samples";
import { listRelics, loadTokens, createRelic, renameRelic, deleteRelic, getRelic } from "@/lib/ghost/storage";
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
  validateSearch: (s: Record<string, unknown>): { relic?: string } => (typeof s["relic"] === "string" ? { relic: s["relic"] } : {}),
  component: Index,
});

type View = "workspace" | "samples" | "saved" | "about";
const NAV: { id: View; name: string }[] = [{ id: "workspace", name: "Workspace" }, { id: "samples", name: "Sample Relics" }, { id: "saved", name: "Saved" }, { id: "about", name: "About" }];
const PROGRESS = ["Dusting off the relic…", "Reading old inscriptions…", "Consulting the ghost…", "Drafting the report…"];
type AiStatus = { configured: boolean; model: string; provider: string; openWeight: boolean };

function demoResult(s: Sample): AnalysisResult {
  const det = runDeterministic(s.code, s.language);
  return { report: s.demoReport, deterministic: det.findings, stats: det.stats, source: "demo", provider: "Bundled sample", model: "none", openWeight: false, createdAt: new Date().toISOString() };
}

function Logo() {
  return <span aria-hidden className="relative grid size-7 place-items-center rounded-md border-2 border-primary"><span className="absolute bottom-1.5 left-1.5 size-0.5 rounded-full bg-primary" /><span className="absolute bottom-1.5 right-1.5 size-0.5 rounded-full bg-primary" /></span>;
}

function Index() {
  const analyze = useServerFn(analyzeCode);
  const status = useServerFn(getAiStatus);
  const first = SAMPLES[0]!;
  const [view, setView] = useState<View>("workspace");
  const [menu, setMenu] = useState(false);
  const [ai, setAi] = useState<AiStatus | null>(null);
  const [code, setCode] = useState(first.code);
  const [language, setLanguage] = useState<Language>(first.language);
  const [title, setTitle] = useState(first.title);
  const [result, setResult] = useState<AnalysisResult | null>(() => demoResult(first));
  const [resultCode, setResultCode] = useState(first.code);
  const [resultLang, setResultLang] = useState<Language>(first.language);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [relics, setRelics] = useState<SavedRelic[]>([]);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");

  const { relic: relicParam } = Route.useSearch();
  const refreshMine = () => listRelics({ ids: Object.keys(loadTokens()) }).then(setRelics).catch(() => toast.error("Couldn't load your saved relics."));
  useEffect(() => { if (!relicParam) return; getRelic(relicParam).then((r) => (r ? reopen(r) : toast.error("That relic no longer exists."))).catch(() => toast.error("Couldn't open that relic.")); }, [relicParam]);
  useEffect(() => { refreshMine(); status().then(setAi).catch(() => setAi({ configured: false, model: "", provider: "", openWeight: false })); }, [status]);
  useEffect(() => { if (!loading) return; const t = setInterval(() => setStep((s) => (s + 1) % PROGRESS.length), 2200); return () => clearInterval(t); }, [loading]);

  const go = (v: View) => { setView(v); setMenu(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const matchingSample = SAMPLES.find((s) => s.code === code);

  function loadSample(s: Sample) { setCode(s.code); setLanguage(s.language); setTitle(s.title); setError(null); go("workspace"); toast(`Loaded "${s.title}"`); }

  async function run() {
    if (loading) return;
    setError(null);
    if (!code.trim()) return setError("The relic is empty — paste some code first.");
    if (code.length > MAX_CODE_CHARS) return setError(`Trim the code to ${MAX_CODE_CHARS.toLocaleString()} characters or fewer.`);
    setLoading(true); setStep(0);
    try {
      const res = await analyze({ data: { code, language, title: title.trim() || undefined } });
      if (res.ok) { setResult(res.result); setResultCode(code); setResultLang(language); toast.success("Analysis complete"); }
      else setError(res.error);
    } catch { setError("Network error — check your connection and try again."); }
    finally { setLoading(false); }
  }

  async function act(fn: () => Promise<unknown>, msg: string) {
    try { await fn(); toast.success(msg); } catch { toast.error("Couldn't reach the archive — try again."); }
    refreshMine();
  }
  function openSave() { setSaveTitle(title || "Untitled relic"); setSaveOpen(true); }
  function confirmSave() {
    const r = result && resultCode === code ? result : null;
    act(() => createRelic({ title: saveTitle, language, code, result: r }), "Relic added to the public gallery"); setSaveOpen(false);
  }
  function reopen(r: SavedRelic) { setCode(r.code); setLanguage(r.language); setTitle(r.title); if (r.result) { setResult(r.result); setResultCode(r.code); setResultLang(r.language); } go("workspace"); }
  function rename(id: string) {
    const r = relics.find((x) => x.id === id); if (!r) return;
    const t = window.prompt("Rename relic", r.title)?.trim(); if (!t) return;
    act(() => renameRelic(id, t.slice(0, MAX_TITLE_CHARS)), "Relic renamed");
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <div className="mx-auto w-full max-w-[1110px] flex-1 px-4 sm:px-6">
        {/* NAV */}
        <header className="relative flex items-center justify-between border-b">
          <button onClick={() => go("workspace")} className="flex items-center gap-2.5 py-3.5" aria-label="Ghost in My Code home">
            <Logo /><span className="font-mono text-[13px] font-bold tracking-wide">GHOST IN MY CODE</span>
            <span className="hidden rounded border border-green-2/60 px-1.5 py-0.5 font-mono text-[9px] text-green-2 sm:inline">v0.1</span>
          </button>
          <nav aria-label="Main" className="hidden items-center md:flex">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => go(n.id)} aria-current={view === n.id ? "page" : undefined}
                className={`${label} relative px-3 py-5 transition hover:text-foreground ${view === n.id ? "text-primary after:absolute after:inset-x-1 after:-bottom-px after:h-0.5 after:bg-primary after:shadow-[0_0_8px_var(--primary)]" : "text-muted-foreground"}`}>{n.name}</button>
            ))}
            <Link to="/gallery" className={`${label} px-3 py-5 text-muted-foreground transition hover:text-foreground`}>Gallery</Link>
            <span className={`${label} ml-5 flex items-center gap-1.5 text-primary`}><span className="size-1.5 animate-pulse rounded-full bg-primary" />System online</span>
            <a href="#repo" onClick={(e) => { e.preventDefault(); go("about"); }} className="ml-4 text-muted-foreground hover:text-primary" aria-label="Source repository (see About)"><Github className="size-4" /></a>
          </nav>
          <button className="p-2 md:hidden" aria-label={menu ? "Close menu" : "Open menu"} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X className="size-5" /> : <Menu className="size-5" />}</button>
          {menu && (
            <div className="absolute inset-x-0 top-full z-40 border-b bg-card p-2 md:hidden">
              {NAV.map((n) => <button key={n.id} onClick={() => go(n.id)} className={`${label} block w-full rounded px-3 py-3 text-left ${view === n.id ? "bg-elevated text-primary" : "text-muted-foreground"}`}>{n.name}</button>)}
              <Link to="/gallery" className={`${label} block w-full rounded px-3 py-3 text-left text-muted-foreground`}>Gallery</Link>
              <p className={`${label} flex items-center gap-1.5 px-3 py-2 text-primary`}><span className="size-1.5 rounded-full bg-primary" />System online</p>
            </div>
          )}
        </header>

        {view === "workspace" && (
          <main className="animate-in fade-in duration-300">
            {/* HERO */}
            <section className="flex flex-col gap-5 pt-10 pb-7 sm:pt-12 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className={`${label} text-green-2`}>Digital archaeology lab / 001</p>
                <h1 className="mt-3 text-[32px] font-semibold leading-tight tracking-tight sm:text-[34px] lg:text-[32px]">Your code has a past. <span className="text-primary">Let's uncover it.</span></h1>
                <p className="mt-2 text-[13px] text-muted-foreground sm:text-sm">Decode forgotten logic, modernize outdated patterns, and hear the story behind your code.</p>
              </div>
              <div className="flex shrink-0 flex-col gap-4 lg:items-end">
                <div className="flex flex-wrap gap-1.5 lg:flex-nowrap">{["Code explanation", "Pattern detection", "Legacy modernization"].map((t) => <span key={t} className={`${label} rounded border px-2 py-1.5 text-[9px] text-muted-foreground`}>{t}</span>)}</div>
                <button onClick={openSave} className={`${label} inline-flex w-fit items-center gap-2 rounded-md border px-4 py-2.5 font-bold text-foreground transition hover:border-primary/60 hover:text-primary`}><Save className="size-3.5" />Save relic</button>
              </div>
            </section>

            {/* PANELS */}
            <section className="grid gap-4 md:grid-cols-2 md:items-start">
              {/* RELIC */}
              <div className="relative flex flex-col overflow-hidden rounded-[9px] border bg-card before:absolute before:left-3 before:top-0 before:h-0.5 before:w-12 before:bg-primary">
                <PanelHead n="01" title="The Relic" sub="Insert a fragment from the past." tag="Input / source code" />
                <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2.5">
                  <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                    <SelectTrigger aria-label="Programming language" className={`${label} h-8 w-auto gap-2 bg-elevated font-bold text-foreground`}><span className="size-1.5 rounded-full bg-primary" /><SelectValue /></SelectTrigger>
                    <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{LANGUAGE_LABELS[l].toUpperCase()}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={matchingSample?.id ?? ""} onValueChange={(id) => { const s = SAMPLES.find((x) => x.id === id); if (s) loadSample(s); }}>
                    <SelectTrigger aria-label="Load sample" className={`${label} h-8 w-[150px] bg-panel text-muted-foreground sm:w-[136px]`}><SelectValue placeholder="Load sample" /></SelectTrigger>
                    <SelectContent>{SAMPLES.map((s) => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}</SelectContent>
                  </Select>
                  <button onClick={() => { setCode(""); setError(null); }} className={`${label} ml-auto px-2 py-1 text-muted-foreground hover:text-destructive`}>Clear</button>
                </div>
                <CodeEditor value={code} onChange={setCode} language={language} onSubmit={run} />
                <div className={`${label} flex justify-between border-t px-3 py-2.5 text-[9px] ${code.length > MAX_CODE_CHARS ? "text-destructive" : "text-muted-foreground"}`}>
                  <span>{code.length.toLocaleString()} / {MAX_CODE_CHARS.toLocaleString()} characters</span><span>UTF-8 · LF</span>
                </div>
                <div className="flex items-center gap-3 px-3 pb-3">
                  <button onClick={run} disabled={loading} className={`${label} flex flex-1 items-center justify-center gap-2 rounded-md bg-primary py-3 font-bold text-primary-foreground transition hover:shadow-[0_0_18px_-2px_var(--primary)] disabled:opacity-60`}>
                    {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}{loading ? "Examining…" : "Examine this relic"}
                  </button>
                  <span className={`${label} hidden w-16 text-[9px] leading-snug text-muted-foreground lg:block`}>Ctrl + Enter to analyze</span>
                </div>
                {error && <p role="alert" className="mx-3 mb-3 flex gap-2 rounded border border-destructive/50 p-2.5 text-xs text-destructive"><AlertTriangle className="size-4 shrink-0" /><span>{error}{matchingSample && !ai?.configured && <> <button className="underline" onClick={() => { setResult(demoResult(matchingSample)); setResultCode(matchingSample.code); setResultLang(matchingSample.language); setError(null); }}>View this sample's demo report.</button></>}</span></p>}
              </div>

              {/* FINDINGS */}
              <div className="relative flex h-[560px] flex-col overflow-hidden rounded-[9px] md:h-[515px] border bg-card before:absolute before:left-3 before:top-0 before:h-0.5 before:w-12 before:bg-primary" aria-live="polite">
                <PanelHead n="02" title="The Findings" sub="A new perspective on forgotten logic." tag="Output / report" />
                <div className={`${label} flex items-center justify-between gap-2 border-b px-4 py-3 text-[9px]`}>
                  {loading ? <span className="flex items-center gap-1.5 text-amber"><Loader2 className="size-3 animate-spin" />Analyzing</span>
                    : result ? <span className={`flex items-center gap-1.5 font-bold ${result.source === "demo" ? "text-amber" : "text-primary"}`}><Check className="size-3" />{result.source === "demo" ? "Demo report" : "Analysis complete"}</span>
                    : <span className="text-muted-foreground">Awaiting relic</span>}
                  {result && !loading && <span className="truncate text-muted-foreground">{LANGUAGE_LABELS[resultLang]} / {result.report.outdated_patterns.length ? "Legacy syntax" : "No legacy flags"}</span>}
                </div>
                {loading ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 font-mono text-xs text-muted-foreground"><Loader2 className="size-5 animate-spin text-primary" /><span className="cursor-blink">{PROGRESS[step]}</span></div>
                ) : result ? <ReportView key={result.createdAt} result={result} originalCode={resultCode} language={resultLang} /> : (
                  <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center"><p className="font-mono text-xs text-muted-foreground glitch">NO SIGNAL</p><p className="text-xs text-muted-foreground">Examine a relic to see findings.</p></div>
                )}
              </div>
            </section>

            <div className={`${label} flex flex-col gap-1 py-4 text-[9px] text-muted-foreground sm:flex-row sm:justify-between`}>
              <span className="flex items-center gap-1.5"><span className={`size-1.5 rounded-full ${ai?.configured ? "bg-primary" : "bg-amber"}`} />
                {ai == null ? "Checking AI…" : ai.configured ? `Live AI · ${ai.model} via ${ai.provider}${ai.openWeight ? " · open-weight" : " · fallback, not open-weight"} · code is sent to this provider` : "Demo mode · AI not configured · no code is transmitted"}
              </span>
              <span>Never executed · static review only</span>
            </div>
          </main>
        )}

        {view === "samples" && (
          <main className="animate-in fade-in py-10 duration-300">
            <ViewHead k="Archive / samples" title="Sample Relics" sub="Load a specimen into the workspace, then examine it." />
            <div className="grid gap-3 sm:grid-cols-2">
              {SAMPLES.map((s) => (
                <button key={s.id} onClick={() => loadSample(s)} className="group rounded-[9px] border bg-card p-5 text-left transition hover:border-primary/50 focus-visible:outline-1 focus-visible:outline-primary">
                  <div className="flex items-center justify-between"><span className={`${label} text-green-2`}>{s.tag}</span><span className={`${label} rounded border px-1.5 py-0.5 text-[9px] text-muted-foreground`}>{s.difficulty}</span></div>
                  <p className="mt-3 font-semibold group-hover:text-primary">{s.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{s.blurb}</p>
                  <pre className="mt-3 overflow-hidden rounded border bg-panel p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">{s.code.split("\n").slice(0, 3).join("\n")}</pre>
                </button>
              ))}
            </div>
          </main>
        )}

        {view === "saved" && (
          <main className="animate-in fade-in py-10 duration-300">
            <div className="flex items-end justify-between gap-3">
              <ViewHead k="Archive / yours" title="Saved Relics" sub="Relics you saved from this browser. They're also visible to everyone in the gallery." />
              {relics.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild><button className={`${label} mb-6 rounded border px-3 py-2 text-muted-foreground hover:border-destructive/60 hover:text-destructive`}>Clear all</button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Clear all saved relics?</AlertDialogTitle><AlertDialogDescription>Every relic you saved will be removed from the public gallery. This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => act(() => Promise.all(relics.map((x) => deleteRelic(x.id))), "All your relics deleted")}>Clear all</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            {relics.length === 0 ? <div className="rounded-[9px] border border-dashed p-10 text-center"><p className="font-mono text-xs text-muted-foreground">NO RELICS ARCHIVED</p><button onClick={() => go("workspace")} className="mt-3 text-xs text-primary underline">Go to workspace</button></div> : (
              <ul className="rounded-[9px] border bg-card">
                {relics.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-3 border-b px-4 py-3.5 last:border-0">
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{r.title}</p>
                      <p className={`${label} mt-1 text-[9px] text-muted-foreground`}>{LANGUAGE_LABELS[r.language]} · {r.result ? (r.result.source === "demo" ? "demo report" : "AI report") : "code only"} · {new Date(r.savedAt).toLocaleString()}</p></div>
                    <button onClick={() => reopen(r)} className={`${label} inline-flex items-center gap-1 rounded border px-2.5 py-1.5 hover:border-primary/60 hover:text-primary`}><FolderOpen className="size-3" />Reopen</button>
                    <button onClick={() => rename(r.id)} aria-label={`Rename ${r.title}`} className="rounded border p-1.5 text-muted-foreground hover:text-primary"><Pencil className="size-3.5" /></button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><button aria-label={`Delete ${r.title}`} className="rounded border p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Delete "{r.title}"?</AlertDialogTitle><AlertDialogDescription>This removes the relic from the public gallery for everyone.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => act(() => deleteRelic(r.id), "Relic deleted")}>Delete</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </li>
                ))}
              </ul>
            )}
          </main>
        )}

        {view === "about" && (
          <main className="animate-in fade-in max-w-2xl py-10 text-sm leading-relaxed text-muted-foreground duration-300">
            <ViewHead k="Documentation" title="About" sub="Every line of code has a past." />
            {[
              ["The problem", "Legacy code outlives its authors and its documentation. Reading it is slow, and rewriting it blindly is risky."],
              ["How it works", "Your snippet is validated on the server, checked by deterministic pattern rules, then sent to a language model with strict instructions to return a structured JSON report. The reply is validated (and retried once if malformed) before it is shown. Submitted code is treated as untrusted text and is never executed."],
              ["Why open-weight AI", "Open-weight models such as Gemma can be inspected, self-hosted and run without vendor lock-in. The app prefers Gemma via an OpenAI-compatible host; if that isn't configured it falls back to the Lovable AI Gateway, which is clearly labeled as not open-weight."],
              ["Deterministic vs AI", "Deterministic: input limits, static regex checks (e.g. Python 2 print, gets/strcpy, var, loop nesting), character counts, saving. AI: summary, patterns, issues, rewrite, line explanations, Ghost Diary. Sample reports are pre-written and labeled as demo."],
              ["Privacy & security", "When live AI is on, your code leaves your device and is processed by the provider shown under the workspace. Nothing is stored on the server. Saved relics live only in this browser. The review is not a security audit."],
            ].map(([h, t]) => <div key={h} className="mt-6"><h3 className={`${label} mb-1.5 text-green-2`}>{h}</h3><p>{t}</p></div>)}
            <div id="repo" className="mt-6"><h3 className={`${label} mb-1.5 text-green-2`}>Source repository</h3><p className="inline-flex items-center gap-2"><Github className="size-4" />Repository URL not published yet.</p></div>
          </main>
        )}
      </div>

      <footer className="mx-auto mt-10 w-full max-w-[1110px] border-t px-4 py-5 sm:px-6">
        <div className={`${label} flex flex-col gap-1 text-[9px] text-muted-foreground sm:flex-row sm:justify-between`}><span>Ghost in my code</span><span>Every line of code has a past.</span><span>Open source / 2026</span></div>
      </footer>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-mono text-sm uppercase tracking-widest">Save relic</DialogTitle>
            <DialogDescription>{result && resultCode === code ? "Saves the code and its report to the public gallery — anyone can view it." : "Saves the code only to the public gallery — analyze it first to include a report."}</DialogDescription></DialogHeader>
          <label htmlFor="save-title" className={`${label} text-muted-foreground`}>Title</label>
          <input id="save-title" autoFocus maxLength={MAX_TITLE_CHARS} value={saveTitle} onChange={(e) => setSaveTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && confirmSave()} className="w-full rounded-md border bg-panel px-3 py-2 font-mono text-sm outline-none focus:border-primary" />
          <DialogFooter><button onClick={confirmSave} className={`${label} rounded-md bg-primary px-4 py-2.5 font-bold text-primary-foreground`}>Save</button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PanelHead({ n, title, sub, tag }: { n: string; title: string; sub: string; tag: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b px-4 py-4">
      <div className="flex gap-2.5"><span className="pt-0.5 font-mono text-[9px] text-green-2">{n}</span><div><h2 className="font-mono text-[13px] font-bold uppercase tracking-wide">{title}</h2><p className="mt-0.5 text-xs text-muted-foreground">{sub}</p></div></div>
      <span className={`${label} hidden pt-2 text-[9px] text-muted-foreground sm:block`}>{tag}</span>
    </div>
  );
}

function ViewHead({ k, title, sub }: { k: string; title: string; sub: string }) {
  return <div className="mb-6"><p className={`${label} text-green-2`}>{k}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{sub}</p></div>;
}
