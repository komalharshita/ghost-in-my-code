import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { label } from "@/components/ghost/Report";
import { listRelics } from "@/lib/ghost/storage";
import { LANGUAGES, LANGUAGE_LABELS, type Language } from "@/lib/ghost/types";

const galleryQuery = queryOptions({ queryKey: ["relics", "gallery"], queryFn: () => listRelics({ limit: 100 }) });

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Relic Gallery — Ghost in My Code" },
      { name: "description", content: "Browse legacy code relics saved by visitors, each with its AI autopsy, modern rewrite and Ghost Diary." },
      { property: "og:title", content: "Relic Gallery — Ghost in My Code" },
      { property: "og:description", content: "A public archive of forgotten code and the ghosts that haunt it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(galleryQuery),
  component: Gallery,
  errorComponent: GalleryError,
  notFoundComponent: () => <p className="p-10 text-center font-mono text-xs">Gallery not found.</p>,
});

function GalleryError() {
  const router = useRouter();
  return (
    <div className="p-10 text-center">
      <p className="font-mono text-xs text-muted-foreground">The archive didn't answer.</p>
      <button onClick={() => router.invalidate()} className="mt-3 text-xs text-primary underline">Try again</button>
    </div>
  );
}

function Gallery() {
  const { data: relics } = useSuspenseQuery(galleryQuery);
  const [lang, setLang] = useState<Language | "all">("all");
  const shown = useMemo(() => (lang === "all" ? relics : relics.filter((r) => r.language === lang)), [relics, lang]);

  return (
    <div className="mx-auto min-h-screen w-full max-w-[1110px] px-4 py-10 sm:px-6">
      <Link to="/" className={`${label} inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary`}><ArrowLeft className="size-3" />Workspace</Link>
      <p className={`${label} mt-8 text-green-2`}>Archive / public</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Relic Gallery</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Every relic saved by visitors. Open one to see its full report in the workspace.</p>

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter by language">
        {(["all", ...LANGUAGES] as const).map((l) => (
          <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l}
            className={`${label} rounded border px-2.5 py-1.5 transition ${lang === l ? "border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            {l === "all" ? `All · ${relics.length}` : LANGUAGE_LABELS[l]}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="mt-6 rounded-[9px] border border-dashed p-10 text-center">
          <p className="font-mono text-xs text-muted-foreground">NO RELICS HERE YET</p>
          <Link to="/" className="mt-3 inline-block text-xs text-primary underline">Analyze and save the first one</Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((r) => (
            <Link key={r.id} to="/" search={{ relic: r.id }} className="group flex flex-col rounded-[9px] border bg-card p-5 transition hover:border-primary/50">
              <div className="flex items-center justify-between">
                <span className={`${label} text-green-2`}>{LANGUAGE_LABELS[r.language]}</span>
                <span className={`${label} rounded border px-1.5 py-0.5 text-[9px] ${r.result?.source === "ai" ? "text-primary" : "text-muted-foreground"}`}>
                  {r.result ? (r.result.source === "demo" ? "demo report" : "AI report") : "code only"}
                </span>
              </div>
              <p className="mt-3 truncate font-semibold group-hover:text-primary">{r.title}</p>
              {r.result?.report.summary && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.result.report.summary}</p>}
              <pre className="mt-3 overflow-hidden rounded border bg-panel p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">{r.code.split("\n").slice(0, 4).join("\n")}</pre>
              <div className={`${label} mt-3 flex items-center justify-between text-[9px] text-muted-foreground`}>
                <span>{new Date(r.savedAt).toLocaleDateString()}</span>
                <span className="inline-flex items-center gap-1 group-hover:text-primary"><FolderOpen className="size-3" />Open</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
