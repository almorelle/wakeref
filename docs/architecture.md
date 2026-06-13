# Architecture — WakeRef

> Generated: 2026-06-11 · Updated: 2026-06-13 · Type: `web` · Repository: **monolith**

## Executive summary

**WakeRef** is a complete wakeboard & wakeskate tricks reference — an installable PWA. It is a **client-rendered React SPA** with **no backend of its own**: the browser talks directly to **Supabase** (PostgreSQL + Auth + Storage + Edge Functions). All business logic and authorization live in the database (Row-Level Security, a denormalizing view, RPC functions, triggers) plus two Deno Edge Functions for transactional email. The app is bilingual (FR default / EN), themeable (dark/light), and deployed as a static bundle on Vercel.

This "thick database, thin client, no API layer" shape is the defining architectural decision: it keeps the deploy artifact a static `dist/`, pushes correctness/security into Postgres RLS, and makes the **RLS policies + `figures_full` view + RPCs the de-facto API contract**.

## Technology stack

| Category | Technology | Version | Role |
|----------|-----------|---------|------|
| Language | JavaScript (ESM, JSX) | — | `"type": "module"`; no TypeScript (only `@types/*` dev deps) |
| UI | React | ^19.2 | Function components + hooks |
| Routing | react-router-dom | ^7.15 | SPA routing, `lazy()` code-splitting |
| Build | Vite | ^8.0 | Dev server + production bundler |
| | @vitejs/plugin-react | ^6.0 | React fast refresh / JSX |
| PWA | vite-plugin-pwa | ^1.3 | Service worker (autoUpdate), web manifest |
| Backend (BaaS) | Supabase (@supabase/supabase-js) | ^2.106 | Postgres, Auth, Storage, Edge Functions |
| Icons | @tabler/icons-react | ^3.44 | via central `Icon` wrapper |
| Analytics | @vercel/analytics, @vercel/speed-insights | ^2 | RUM + Web Vitals |
| Email | Resend (called from Edge Functions) | — | Transactional email |
| Styling | CSS Modules + global `index.css` | — | CSS variables, `[data-theme]` theming; no CSS framework |
| Hosting | Vercel | — | Static SPA + CDN + headers |
| CI | GitHub Actions | — | Daily DB backup only |

> Note: `README.md`/`CLAUDE.md` mention React 18 / Router 6; `package.json` is the source of truth (React 19.2 / Router 7.15).

## Architecture pattern

**Layered client-side SPA over a Backend-as-a-Service.** Layers:

1. **Presentation** — `src/pages/*` (route components) + `src/components/*` (shared UI), CSS Modules.
2. **App state** — React Context (`LanguageContext`, `ThemeContext`) + local component state; no global store.
3. **Data access** — `src/lib/*` (singleton Supabase client, search expansion, URL helpers) + hooks (`useAuth`, `useToast`). No repository/service abstraction — components call `supabase.*` directly.
4. **Backend (Supabase)** — Postgres with RLS as the authorization boundary, `figures_full` view as the read model, RPCs as the explicit contract, triggers for invariants, Storage for media, Edge Functions for email.

### Routing & code-splitting (`src/App.jsx`)
Two route groups: a `PublicLayout` (Navbar + `<Outlet/>`) and an auth-guarded `AdminLayout`. Heavy public pages (`Quiz`, `Compo`) and the **entire admin area** are `lazy()`-loaded so the admin code is never shipped in the public bundle. Provider order (`main.jsx`): `BrowserRouter → ThemeProvider → LanguageProvider → App`.

## Data architecture

See `data-models.md` for the full schema. Key ideas:

- **Core entity `figures`** with self-referential **switch groups** (`switch_of`), a self-referential **built-on tree** (`built_on_id`, kept acyclic by a trigger), and many-to-many **prerequisites**.
- **`figures_full` view** denormalizes category, switch relations, prerequisites, **switch-group-shared videos**, the **built-on tree** (parent / children / recursive root), and the **trick-decomposition** columns (`spin`/`inverts`/`rewind_degs`/`rotation_type`) into one JSON-rich row — this is what the UI reads.
- **Trick decomposition** (`src/lib/trickDecomposition.js`) turns those columns into displayable rotation units for the breakdown UI and the admin rotation builder.
- **Bilingual columns** (`field` / `field_en`) resolved client-side via `useLocalizedField()`.
- **Public-write inboxes** (`video_submissions`, `takedown_requests`, `compositions`) are insert-only for `anon`, read by admin.
- **French full-text search** via a GIN index over `unaccent`-normalized text, exposed through `search_figures()` and enriched by client-side abbreviation expansion.

## Authorization model

There is no app-server to enforce permissions, so **PostgreSQL RLS is the security boundary**:
- `anon` can read public content (`published` figures, non-takedown videos) and insert into the three inboxes.
- `authenticated` (the single admin) gets full CRUD on content tables, via policies of the form `(select auth.role()) = 'authenticated'` (sub-select so it's evaluated once per query).
- The client-side `AdminLayout` guard is **UX only**; real enforcement is server-side.

See `api-contracts.md` for the per-role access matrix, RPC signatures, Storage rules, and Edge Functions.

## API design

No REST API is authored. The contract surface is:
1. **PostgREST** over tables/`figures_full` (shaped by RLS + grants).
2. **RPC functions:** `search_figures`, `home_stats`, `get_composition`, `figures_without_videos`, `figures_without_uploaded_videos` (+ internal `immutable_unaccent`).
3. **Storage** `videos` bucket (public read, admin write; thumbnails by `thumbnails/<shortcode>.jpg` convention).
4. **Edge Functions:** `send-contact` (browser-invoked) and `notify-video-submission` (DB-webhook-invoked) → Resend email.

## Source tree

See `source-tree-analysis.md` for the annotated tree. Entry points: `index.html` → `src/main.jsx` → `src/App.jsx`; the only Supabase client is `src/lib/supabase.js`.

## Development & deployment

- **Dev/build:** `npm run dev` / `npm run build` (build also generates `public/sitemap.xml` by querying Supabase). See `development-guide.md`.
- **Deploy:** static `dist/` to Vercel with two `VITE_*` env vars; Supabase schema applied via `scripts/wakeref_post_restore.sql`; Edge Functions + webhook configured separately. See `deployment-guide.md`.
- **Backups:** daily `pg_dump` GitHub Action to the Supabase `backups` bucket.

## Testing strategy

**None configured.** No test runner, no linter, no CI checks beyond the backup workflow. Verification is manual (run the app, exercise flows). This is the most significant gap for anyone planning larger changes.

## Notable cross-cutting concerns

- **i18n:** UI strings in `src/i18n/translations.js` (`{fr,en}`); DB content bilingual via `_en` columns.
- **SEO:** `src/components/SEO.jsx` imperatively manages title/meta/OG per page+language; sitemap generated at build; security/cache headers in `vercel.json`.
- **PWA:** auto-updating service worker; installable manifest.
- **Abuse control:** `compositions` insert rate-limit trigger (20/min) and 50 KB JSON size cap.
- **Data invariants in-DB:** `figures_built_on_acyclic` trigger forbids cycles/self-references in the built-on tree; `rotation_type` CHECK-constrained to `{ole, handle_pass}`.

## Architectural risks / watch-items

1. **No automated tests or linting** — refactors are unguarded.
2. **Schema managed by hand** across two SQL files + the live DB — easy to drift; keep them and `src/data/*` in sync.
3. **Build depends on Supabase reachability** (sitemap step) — a DB outage breaks deploys.
4. **Doc drift** on framework versions (React/Router) between `package.json` and `README`/`CLAUDE.md`.
