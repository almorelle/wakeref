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

**WakeRef** is a complete wakeboard & wakeskate tricks reference app — a PWA built with React 19 + Vite, backed by Supabase (PostgreSQL + Auth + Storage), deployed on Vercel.

**Scope: cable-only.** All three disciplines (wakeboard, wakeskate, seated/handiwake) target cable / téléski-nautique riding — never boat. Do not introduce boat/wave concepts or vocabulary (e.g. "wake-to-wake", "transfert", "passages de vague"); the cable equivalents are kickers / modules / features and the cable itself.

### Data layer

All data fetching goes through the singleton Supabase client at `src/lib/supabase.js`. There is no intermediate API layer — components and pages query Supabase directly.

**Key tables** (defined in `init/wakeref_schema.sql`):
- `figures` — trick entries; `sport` enum (`wakeboard` | `wakeskate`), `difficulty` 1–5, `is_switch` + `switch_of` self-reference, bilingual fields (`description` / `description_en`, `tips[]` / `tips_en[]`)
- `categories` — 12 fixed trick categories (spin, railey, s-bend, …) with color and sort order
- `prerequisites` — many-to-many self-join on figures
- `videos` — references to video files stored in Supabase Storage
- `takedown_requests` — copyright removal requests from video authors
- `compositions` — saved runs from the Compo page (no auth); short text `id` used in the share URL, minimal JSONB snapshot in `data`, denormalized `score`. Public can insert + load one by id via the `get_composition(cid)` function; only admin can list/delete (RLS)

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

**Restore from backup:**
1. `psql "$SUPABASE_DB_URL" < backup_YYYY-MM-DD.sql`
2. `scripts/wakeref_post_restore.sql` — recreates extensions, functions, view, RLS policies, grants, storage bucket

**From scratch:**
1. `scripts/wakeref_post_restore.sql` — full schema (tables, views, RLS policies, triggers, bucket)
2. Recreate admin account manually via Supabase Dashboard → Authentication → Users

**Schema reference:** `scripts/wakeref_schema.sql` — current DB schema exported from Supabase (context only, not meant to be executed). Keep this file up to date when making schema changes.