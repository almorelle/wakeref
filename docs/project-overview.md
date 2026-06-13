# Project Overview — WakeRef

> Generated: 2026-06-11 · Updated: 2026-06-13

## What it is

**WakeRef** (https://wakeref.app) is a complete **wakeboard & wakeskate tricks reference** — an installable PWA where riders browse tricks, watch videos, follow prerequisites, take a quiz, and build/share "runs" (compositions). Content is bilingual (French default, English) and the app supports dark/light themes.

## Purpose & scope

- Public catalog of tricks (`figures`) organized by category, difficulty, sport (wakeboard/wakeskate), with bilingual descriptions, tips, prerequisites, switch variants, attached videos, a **built-on tree** (which trick each one is derived from), and a **rotation breakdown** of each trick.
- Engagement features: a trick **Quiz** and a **Compo** run builder with scoring and shareable links.
- Community inboxes: suggest a video, request a takedown, contact form.
- A private **admin area** (single account) to manage figures, videos, submissions, takedowns, and saved runs.

## Tech stack (summary)

| Area | Choice |
|------|--------|
| Frontend | React 19 + Vite 8, react-router-dom 7, CSS Modules |
| PWA | vite-plugin-pwa (auto-update SW, installable) |
| Backend | Supabase — PostgreSQL + Auth + Storage + Edge Functions (no custom API server) |
| Auth | Supabase email/password, admin-only |
| Email | Resend via Deno Edge Functions |
| Hosting | Vercel (static SPA) |
| Analytics | Vercel Analytics + Speed Insights |
| CI | GitHub Actions (daily DB backup) |
| Language | JavaScript/JSX (no TypeScript) |

## Architecture type

**Monolith** repository → a single client-rendered React SPA over a Backend-as-a-Service. The defining trait: **no API layer** — the browser queries Supabase directly, and **PostgreSQL RLS + the `figures_full` view + RPC functions are the API contract**. Business rules and authorization live in the database.

## Repository structure

```
src/            React app (pages/, components/, lib/, contexts/, hooks/, i18n/, data/)
scripts/        sitemap generator + executable DB setup (wakeref_post_restore.sql)
supabase/       Deno Edge Functions (email)
.github/        daily backup workflow
public/ assets/ static assets
```

## Key facts to know before working here

- **Singleton client** at `src/lib/supabase.js`; components query Supabase directly.
- **`figures_full`** is the read model; raw tables are mostly for admin writes.
- **Switch groups** (`coalesce(switch_of, id)`) share videos; `takedown_requested = true` hides videos everywhere.
- **Built-on tree** (`built_on_id`) links tricks to the simpler trick they extend; the view exposes parent/children/root and an acyclic trigger guards it. **Trick decomposition** lives in `src/lib/trickDecomposition.js`.
- **Bilingual** via `field` / `field_en` columns + `useLocalizedField()`; UI strings in `src/i18n/translations.js`.
- **No tests, no linter** configured — verification is manual.
- **Schema is hand-managed** in two SQL files; no migration tool.
- Build queries Supabase to generate the sitemap, so env vars + DB reachability are needed to build.
- Targets the Supabase **free plan** (avoid paid-only features).

## Documentation map

- [Architecture](./architecture.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [Data Models](./data-models.md)
- [API Contracts](./api-contracts.md)
- [Component & Page Inventory](./component-inventory.md)
- [Development Guide](./development-guide.md)
- [Deployment Guide](./deployment-guide.md)
- Project-level AI instructions: [`../CLAUDE.md`](../CLAUDE.md) · Setup: [`../README.md`](../README.md)
