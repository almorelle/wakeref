# WakeRef — Project Documentation Index

> Primary entry point for AI-assisted development. Generated 2026-06-11 · Updated 2026-09-02 (BMAD document-project, full rescan / deep).

## Project Overview

- **Type:** Monolith — client-rendered React SPA over a Backend-as-a-Service (Supabase)
- **Primary Language:** JavaScript / JSX (ESM, no TypeScript)
- **Architecture:** Layered SPA with **no API layer** — RLS + `figures_full` / `figures_card` views + RPCs are the contract
- **Hosting:** Vercel (static SPA) + Supabase (Postgres / Auth / Storage / Edge Functions)
- **Two product lines:** the public trick reference, and a **local-first judging suite** (training, scoring sheets, voice capture, competition courses)

## Quick Reference

- **Tech Stack:** React 19.2 · Vite 8 (rolldown) · react-router-dom 7.15 · Supabase JS 2.106 · CSS Modules · vite-plugin-pwa · @huggingface/transformers (dynamic import)
- **Entry Point:** `index.html` → `src/main.jsx` → `src/App.jsx`
- **Data client:** `src/lib/supabase.js` (singleton; components query Supabase directly)
- **Read models:** `figures_full` (detail) · `figures_card` (lists, home rows, offline voice catalogue) · **DB setup:** `scripts/wakeref_post_restore.sql`
- **Domain engines (React-free):** `lib/compoGrids.js` (scoring /20) · `lib/judgeDiff.js` · `lib/competition/*` · `lib/voiceMatch.js` + `normalizeJib.js` + `whisperStt.js`
- **Routes:** public (`/`, `/figures`, `/figures/:slug`, `/quiz`, `/compo`, `/compo-old`, `/judge`, `/judge/voix`, `/contact`, `/submit`, `/legal`, `/terms`, `/privacy`) · chromeless judging (`/composition-simple`, `/competition/:code`) · admin (`/admin/*`, auth-guarded, code-split)
- **Checks:** `npm run lint` (ESLint 9) — the only automated one; no test runner

## Generated Documentation

- [Project Overview](./project-overview.md)
- [Architecture](./architecture.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [Data Models](./data-models.md)
- [API Contracts](./api-contracts.md)
- [Component & Page Inventory](./component-inventory.md)
- [Development Guide](./development-guide.md)
- [Deployment Guide](./deployment-guide.md)

## Existing Documentation

- [README.md](../README.md) — setup, Supabase init, Edge Functions, Vercel deploy (FR)
- [CLAUDE.md](../CLAUDE.md) — AI working instructions for this repo
- [_bmad-output/project-context.md](../_bmad-output/project-context.md) — condensed agent rules (stack pins, data-layer, security, domain gotchas)
- `proto-assets/` — frozen prototypes & handoff docs (competition module, voice pipeline, design exploration)
- `training/{tricks,jib}/README.md` — fine-tuning pipelines + model cards for the two house Whisper models
- `scripts/jib-atoms.md` — source vocabulary of the jib composer

## Getting Started

```bash
npm install
cp .env.example .env.local   # add VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev                  # http://localhost:5173
npm run lint                 # ESLint 9
```
DB from scratch: run `scripts/wakeref_post_restore.sql` in the Supabase SQL Editor, then create the admin user in Authentication → Users. Full details in the [Development Guide](./development-guide.md).

## Notes & caveats

- **No test runner** — `npm run lint` is the only automated check, and it is **currently failing**: 14 errors / 7 warnings over 12 files, 6 of them in `src/pages/admin/CompetitionSetup.jsx`. Everything else is manual verification.
- **Schema is hand-managed** across `scripts/wakeref_post_restore.sql` (executable) and `scripts/wakeref_schema.sql` (reference dump); no migration tool. Both were in sync as of this scan.
- **Build queries Supabase** for the sitemap, but **best-effort** — a DB outage no longer fails the build. `VITE_SUPABASE_*` are still baked into the client bundle (required for the app).
- **`Permissions-Policy: microphone=()` in `vercel.json` disables the microphone site-wide in production**, including for the two voice surfaces (`/judge/voix`, competition Run tab). They work in dev, where the header is absent. See the [Deployment Guide](./deployment-guide.md#pwa--service-worker).
- **Judging state never reaches the server** — heats live in `localStorage`, the voice dataset in IndexedDB. Only the course (`parcours`) travels, by short code.
- **Two grid implementations on purpose:** `lib/compoGrids.js` (app) and the self-contained `RAW_GRIDS` of `France2026.jsx` (official sheet). A rules change must be applied in both.
- Targets the Supabase **free plan** — avoid paid-only features.
