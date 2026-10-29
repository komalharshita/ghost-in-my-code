<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- AI analysis lives in `src/lib/ghost/analyze.functions.ts`: prefers an open-weight model via OPEN_MODEL_* env (OpenAI-compatible), falls back to Lovable AI Gateway — keeps the open-weight goal while staying demoable.
- Demo reports are bundled in `samples.ts` and must always be labeled as demo, never as AI output.
- Submitted code is never executed; deterministic checks are regex-only.
- Relics live in the `relics` table and are public (anyone reads/inserts); rename/delete go through `rename_relic`/`delete_relic` RPCs that check a per-relic edit token kept in the creator's localStorage — no accounts needed while keeping edits owner-only.
