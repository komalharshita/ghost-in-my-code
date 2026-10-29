# 👻 Ghost in My Code

> *Every line of code has a past.*

An AI-powered code archaeologist that explains forgotten code, flags outdated patterns, suggests modern rewrites, and tells a (clearly fictional) story from the code's point of view. Built for the DEV Community Hacktoberfest Week 4 challenge, "Ghost in the Machine".

## Problem
Legacy code outlives its authors and docs. Students, maintainers, and open-source contributors spend hours decoding it — and rewriting it blindly is risky.

## Features
- Paste code (Python, JavaScript, Java, C, C++; 8,000 char limit) and get:
  - Plain-English overview, key concepts, uncertainties
  - **Code Autopsy** — deterministic regex findings (labeled) separate from model observations; risks with severity + evidence
  - **Modernization Studio** — original vs suggested rewrite side by side, with what/why for each change
  - **Line-by-line** explanations
  - **Ghost's Diary** — fictional first-person message, labeled as storytelling
- Copy buttons everywhere, toasts on copy/save
- Four sample relics (Python 2, JS callbacks, nested-loop Java, unsafe C strings)
- **Demo Mode**: pre-written, clearly labeled reports for samples — works with no API key
- Saved relics in `localStorage` (save, reopen, delete, clear all with confirmation)

## Screenshots
_Placeholder — add `docs/hero.png`, `docs/report.png`, `docs/mobile.png`._

## Architecture
```text
Browser (React + TanStack Start, Tailwind)
   │  analyzeCode server function (POST)
   ▼
Server (Cloudflare Worker)
   ├─ validate input (size, language, title)
   ├─ best-effort per-IP rate limit (8/min/instance)
   ├─ deterministic static checks (regex; code is NEVER executed)
   ├─ OpenAI-compatible chat call (streamed) → JSON report
   ├─ extract + validate JSON, one corrective retry
   └─ return typed report
```
Key files: `src/lib/ghost/analyze.functions.ts`, `validate.ts`, `deterministic.ts`, `samples.ts`, `src/routes/index.tsx`.

## AI model & provider
- **Preferred (open-weight):** `google/gemma-3-27b-it` via [Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) (OpenAI-compatible `/v1/chat/completions`). Any OpenAI-compatible host serving Gemma (or another open model) works via `OPEN_MODEL_BASE_URL` / `OPEN_MODEL_ID`. You must accept the Gemma license on Hugging Face with your account.
- **Fallback:** if `OPEN_MODEL_API_KEY` is absent but `LOVABLE_API_KEY` is set, the app uses the Lovable AI Gateway (`openai/gpt-6-astra`) — **not open-weight**. The UI labels this as "proprietary fallback". The Gateway did not offer a Gemma model at build time.
- The prompt treats submitted code as untrusted data inside `<relic>` tags and forbids following embedded instructions or claiming execution.

## Setup
```bash
bun install
cp .env.example .env   # fill in OPEN_MODEL_API_KEY (HF token with Inference permission)
bun run dev
bun run test
```

## Deployment
Deployed via Lovable (Publish button). Add `OPEN_MODEL_API_KEY` (and optional `OPEN_MODEL_*`) as project secrets in Lovable → Cloud → Secrets. Any other Cloudflare Workers-compatible host works with `bun run build`.

## Privacy & security
- Code you analyze is sent to the configured provider (shown in the header). Nothing is stored server-side; only short metadata (language, length) is logged.
- Saved relics are in your browser only. No secrets are stored client-side.
- Model output is rendered as text (no HTML injection). Code is never executed.

## Known limitations
- Regex checks are shallow; absence of findings proves nothing.
- Modernized code is a suggestion; equivalence is not tested.
- The rate limiter is in-memory per worker instance.

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md).

## License
Project code: MIT (see `LICENSE`). Gemma weights are governed by Google's [Gemma Terms of Use](https://ai.google.dev/gemma/terms), not by this project's license.
