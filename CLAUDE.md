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
- `figures` — trick entries; `sport` enum (`wakeboard` | `wakeskate` | `seated`), `difficulty` 1–5, `is_switch` + `switch_of` self-reference, bilingual fields (`description` / `description_en`, `tips[]` / `tips_en[]`). Multi-discipline membership lives in `sports[]` (⊇ `{sport}`); per-discipline tip overrides in `tips_<discipline>[]` (`tips_seated`, `tips_wakeskate`) fall back to `tips` when empty
- `categories` — 12 fixed trick categories (spin, railey, s-bend, …) with color and sort order
- `prerequisites` — many-to-many self-join on figures
- `videos` — references to video files stored in Supabase Storage
- `takedown_requests` — copyright removal requests from video authors
- `compositions` — saved runs from the Compo page (no auth); short text `id` used in the share URL, minimal JSONB snapshot in `data` (incl. `gridKey`), denormalized `score` (normalized to /20). Public can insert + load one by id via the `get_composition(cid)` function; only admin can list/delete (RLS)

Full-text search on figures uses a GIN index with French `unaccent`.

### Compo scoring grids

The Compo page scores a run against a discipline-specific grid. All grids live in `GRIDS` in `src/pages/Compo.jsx`, keyed by grid id — `wakeboard`, `wakeskate`, `seated_mp1` (MP1→MP3), `seated_mp5` (MP3→MP5); seated has two grids (handicap class). Each grid = `{ discipline, modes, sections }`; a section item is `{ key, test(ctx) }` where `ctx = { entries, all }` (`all` includes jib pseudo-entries). Scoring is **binary, no degree thresholds** (anti-perf invariant) and **normalized to /20** (`score20`) so grids are comparable. The active `gridKey` drives the grid selector (cross-discipline switch locked once a figure exists), the per-grid add modes (incl. `flat`), the jib approach axis (hs/ts vs regular/fakie), and the figure-search sport filter. Figure slugs referenced by tests are centralized in `SCORING_SLUGS` with a dev-only guard that warns when a referenced slug is absent from `figures` (slugs are editable in admin → silent drift). "Body varial" and similar concepts with no backing field use explicit slug lists (`WS_BODY_VARIALS`). Adding a grid = one entry in `GRIDS` + translations. The figure data these grids depend on (the Ollie family, wakeskate reclassements) is recorded in `_bmad-output/implementation-artifacts/compo-figures-data.md` — the live DB is the source of truth; that file is just the trace of the one-time seed/reclass operations.

### Seated (wakeboard assis) conventions

Decisions taken when adding the seated spins/shifty/boardslide catalogue (see `scripts/seed-seated-figures.sql`):

- **`approach[]` is the entry-stance axis, per discipline.** Standing uses `hs` / `ts` (heelside/toeside); **seated uses `regular` / `fakie`** — `regular` = forward entry (facing the direction of travel), `fakie` = backward entry. `fakie` is the seated peer of the standing `ts` slot. There is **no** DB CHECK on this column, so the front carries the valid set: `FigureForm` shows hs/ts vs regular/fakie options conditionally on the figure's disciplines; `FigureDetail` maps all four to labels + decomp accent colors (hs=ambre, ts=violet, regular=cyan, fakie=rose). Add any new approach value in both places.
- **Seated figure names leave the default implicit, mark only the variant.** Mirroring how "un 180" implies `hs fs` in standing, a seated spin is named bare (`FS 180`, `BS 360`) for `regular`, and prefixed `Fakie …` (`Fakie FS 180`) for `fakie`. **Never** prefix names with "Seated"/"Handi" — discipline is conveyed by the badge + filter, not the name (product invariant: *inclusion by filling, not labeling*).
- **Seated figures are native (`sport='seated'`)**, so their `tips`/`description` already are the seated content (no `tips_seated` override needed). Conversely, a trick shared with standing (e.g. railey) stays native to its standing discipline and gains seated reach via `sports += 'seated'` + a `tips_seated` override — not a duplicate figure.

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