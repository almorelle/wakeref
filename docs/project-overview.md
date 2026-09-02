# Project Overview — WakeRef

> Generated: 2026-06-11 · Updated: 2026-09-02 (BMAD document-project, full rescan / deep)

## What it is

**WakeRef** (https://wakeref.app) is a complete **cable wakeboard, wakeskate & seated-wakeboard tricks reference** — an installable PWA where riders browse tricks, watch videos, follow prerequisites, take a quiz, and build/share "runs" (compositions). It has since grown a second product line: **judging tools** for cable competitions (training, scoring sheets, voice-driven run capture, and a shareable competition course). Content is bilingual (French default, English) and the app supports dark/light themes.

**Scope: cable only.** All three disciplines target cable / téléski-nautique riding, never boat. The vocabulary is kickers / modules / features / poulies (pulleys) and the cable itself — never "wake-to-wake" or wave concepts.

## Purpose & scope

- **Trick catalog** (`figures`) by category, difficulty and discipline (wakeboard / wakeskate / seated), with bilingual descriptions and tips, prerequisites, switch variants, attached videos, a **built-on tree** (which trick each one derives from), and a **rotation breakdown**. Multi-discipline reach via `sports[]` + per-discipline tip overrides (`tips_seated`, `tips_wakeskate`).
- **Engagement:** a trick **Quiz**, and the **Compo** run builder — binary, discipline-specific scoring grids normalized to /20, with shareable links.
- **Judging tools** (the newer half of the product):
  - `/judge` — training: judge a reference run from video, then diff your entry against the official solution.
  - `/judge/voix` — voice lab: local Whisper STT (fine-tuned house models) + trick matcher + jib composer, with an on-device dataset recorder for further fine-tuning.
  - `/composition-simple` — France 2026 scoring sheet (standalone, self-contained grids).
  - `/competition/:code` — a judge loads a shared **parcours** (course) by short code and scores a heat on-device.
- **Community inboxes:** suggest a video, request a takedown, contact form.
- **Legal surface:** legal notice, terms, privacy (`/legal`, `/terms`, `/privacy`) linked from the footer.
- A private **admin area** (single account) to manage figures, videos, submissions, takedowns, saved runs, judge runs, and competition courses.

## Tech stack (summary)

| Area | Choice |
|------|--------|
| Frontend | React 19.2 + Vite 8 (rolldown), react-router-dom 7.15, CSS Modules |
| PWA | vite-plugin-pwa (auto-update SW, installable); STT assets deliberately excluded from precache |
| Backend | Supabase — PostgreSQL + Auth + Storage + Edge Functions (no custom API server) |
| Auth | Supabase email/password, admin-only |
| Speech-to-text | `@huggingface/transformers` (Whisper ONNX) — **dynamic import**, weights fetched from the HF CDN at runtime |
| Email | Resend via Deno Edge Functions |
| Hosting | Vercel (static SPA) |
| Analytics | Vercel Analytics + Speed Insights |
| CI | GitHub Actions (daily DB backup via `pg_dump`) |
| Lint | ESLint 9 flat config (`npm run lint`) — the only automated check; no test runner |
| Language | JavaScript/JSX (no TypeScript) |

## Architecture type

**Monolith** repository → a single client-rendered React SPA over a Backend-as-a-Service. The defining trait: **no API layer** — the browser queries Supabase directly, and **PostgreSQL RLS + the `figures_full` / `figures_card` views + RPC functions are the API contract**. Business rules and authorization live in the database.

A second trait now matters as much: **the judging tools are local-first**. Heat state, run entries, voice models, and the training dataset live in `localStorage` / IndexedDB / in-memory on the judge's device. Only the *parcours* (course definition) travels between devices, through a short code. There is no multi-judge sync.

## Repository structure

```
src/            React app (pages/, components/, lib/, contexts/, hooks/, i18n/, data/)
scripts/        sitemap generator, DB setup SQL, dataset/alias tooling, jib atom vocabulary
supabase/       Deno Edge Functions (email)
training/       fine-tuning pipelines + model cards for the two house Whisper models
proto-assets/   frozen prototypes and handoff docs (competition module, voice, design)
_bmad/          BMAD skills config · _bmad-output/  planning & implementation artifacts
.github/        daily backup workflow
public/ assets/ static assets
```

## Key facts to know before working here

- **Singleton client** at `src/lib/supabase.js`; components query Supabase directly.
- **Two read views:** `figures_full` (full detail, JSON aggregates) and `figures_card` (light list/card payload — also the catalogue the voice matcher caches offline).
- **Switch groups** (`coalesce(switch_of, id)`) share videos; `takedown_requested = true` hides videos everywhere.
- **Built-on tree** (`built_on_id`) links tricks to the simpler trick they extend; the view exposes parent/children/root and an acyclic trigger guards it. **Trick decomposition** lives in `src/lib/trickDecomposition.js`.
- **Compo scoring lives in `src/lib/compoGrids.js`** (not in the page) — a React-free module shared by `Compo` and the `RunSaisie` capture component. Scoring is binary and normalized to /20.
- **Bilingual** via `field` / `field_en` columns + `useLocalizedField()`; UI strings in `src/i18n/translations.js`. The judging surfaces (`/judge/voix`, `/competition`) are **French-only by design** — judges are francophone.
- **`npm run lint` is the only automated check**; there is no test runner, so verification is manual (`npm run dev`).
- **Schema is hand-managed** in two SQL files; no migration tool.
- Build queries Supabase for the sitemap (best-effort: a DB outage won't fail the build); `VITE_SUPABASE_*` env vars are still baked into the client bundle and required.
- Targets the Supabase **free plan** (avoid paid-only features such as Storage image transforms).

## Documentation map

- [Architecture](./architecture.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [Data Models](./data-models.md)
- [API Contracts](./api-contracts.md)
- [Component & Page Inventory](./component-inventory.md)
- [Development Guide](./development-guide.md)
- [Deployment Guide](./deployment-guide.md)
- Project-level AI instructions: [`../CLAUDE.md`](../CLAUDE.md) · Agent rules: [`../_bmad-output/project-context.md`](../_bmad-output/project-context.md) · Setup: [`../README.md`](../README.md)
