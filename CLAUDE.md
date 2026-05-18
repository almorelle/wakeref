# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Dev server at http://localhost:5173
npm run build    # Production build → dist/
npm run preview  # Preview the production build
```

No test runner is configured.

## Environment

Copy `.env.example` to `.env.local` and fill in:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Architecture

**WakeRef** is a complete wakeboard & wakeskate tricks reference app — a PWA built with React 18 + Vite, backed by Supabase (PostgreSQL + Auth + Storage), deployed on Vercel.

### Data layer

All data fetching goes through the singleton Supabase client at `src/lib/supabase.js`. There is no intermediate API layer — components and pages query Supabase directly.

**Key tables** (defined in `init/wakeref_schema.sql`):
- `figures` — trick entries; `sport` enum (`wakeboard` | `wakeskate`), `difficulty` 1–5, `is_switch` + `switch_of` self-reference, bilingual fields (`description` / `description_en`, `tips[]` / `tips_en[]`)
- `categories` — 12 fixed trick categories (spin, railey, s-bend, …) with color and sort order
- `prerequisites` — many-to-many self-join on figures
- `videos` — references to video files stored in Supabase Storage
- `takedown_requests` — copyright removal requests from video authors

Full-text search on figures uses a GIN index with French `unaccent`.

### i18n

Two languages: `fr` (default) and `en`. Language is persisted to `localStorage` under `wakeref_lang`.

- All UI strings live in `src/i18n/translations.js` as a `{ fr: {…}, en: {…} }` object
- `src/i18n/useT.js` — hook to get the current-language translation map
- `src/contexts/LanguageContext.jsx` — wraps the app; exposes `useLanguage()` and `useLocalizedField()` (returns the `_en` variant of a DB field when available, falls back to FR)
- Bilingual DB fields follow the pattern: `field` (FR) and `field_en` (EN)

### Auth

Admin-only auth via Supabase email/password. `useAuth` (`src/hooks/useAuth.js`) wraps `supabase.auth` and exposes `{ session, loading, signIn, signOut }`.

`AdminLayout` (`src/pages/admin/AdminLayout.jsx`) guards all `/admin/*` routes — redirects unauthenticated users to `/admin/login`.

### Routing

Two layout groups in `App.jsx`:
- **Public** (`PublicLayout`) — wraps `Navbar` + `<Outlet>`: `/`, `/figures`, `/figures/:slug`, `/quiz`
- **Admin** (`AdminLayout`, auth-guarded): `/admin`, `/admin/figures`, `/admin/figures/new`, `/admin/figures/:id/edit`, `/admin/videos`, `/admin/takedowns`

### Database setup

Run once against a blank Supabase project, in order:
1. `init/wakeref_schema.sql` — tables, views, RLS policies, triggers
2. `init/dataset_01_*.sql` … `dataset_12_*.sql` — seed data per category