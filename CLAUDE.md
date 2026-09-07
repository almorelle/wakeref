# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Dev server at http://localhost:5173
npm run build    # Production build → dist/
npm run preview  # Preview the production build
npm run lint     # ESLint 9 flat config (eslint.config.js) over src/, scripts/, *.config.js
```

No test runner is configured — `npm run lint` is the only automated check.

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

**Key tables** (defined in `scripts/wakeref_schema.sql`):
- `figures` — trick entries; `sport` enum (`wakeboard` | `wakeskate` | `seated`), `difficulty` 1–5, `is_switch` + `switch_of` self-reference, bilingual fields (`description` / `description_en`, `tips[]` / `tips_en[]`). Multi-discipline membership lives in `sports[]` (⊇ `{sport}`); per-discipline tip overrides in `tips_<discipline>[]` (`tips_seated`, `tips_wakeskate`) fall back to `tips` when empty
- `categories` — 14 fixed trick categories (spin, railey, s-bend, …) with color and sort order; mirrored in `src/data/categories.js` (which adds icon + color)
- `prerequisites` — many-to-many self-join on figures
- `videos` — references to video files stored in Supabase Storage
- `takedown_requests` — copyright removal requests from video authors
- `compositions` — saved runs from the Compo page (no auth); short text `id` used in the share URL, minimal JSONB snapshot in `data` (incl. `gridKey`), denormalized `score` (normalized to /20). Public can insert + load one by id via the `get_composition(cid)` function; only admin can list/delete (RLS)
- `figure_views` — per-figure/day counter; written by the `track_figure_view` RPC, read back through `most_viewed_figures`
- `judge_runs` — reference runs for `/entrainement-juge` (video + `solution` JSONB + `published`). No `anon` policy: public access only via `list_judge_runs()` (metadata, **no solution**) and `get_judge_run_solution(id)`
- `parcours` — competition courses; `id` = 8-char share code, `data` = course snapshot. No `anon` policy: public read only via `get_parcours(code)`
- `competitions` — public agenda of cable competitions (unrelated to `/juge`). **No status column** (past/live/upcoming are derived from the date), no source, **no discipline** (the implicit default is "all disciplines" — recording one would propagate an exclusion), and **no translatable prose, so no `_en` columns** — the free-text fields it does have (`name`, `wakepark`, `tour_name`) are proper nouns, which don't translate; everything else is an outbound link. `date_precision` (`day`|`year`) carries the uncertainty — for a year-only comp, `date_start` holds **Dec 31st** — an artefact that must never reach the screen. The last day, not the first: the comp stays upcoming while the year runs, and sorts after that year's dated comps in the feed. `cancelled` is the single editorial flag; anon reads `published = true` only
- `competition_videos` — video links of a competition (FK `on delete cascade`, `sort_order`). A dedicated table, not JSONB: rows are ordered and individually editable in the form (saved by wholesale replace, so validate before writing). `videos` is not reusable — its `figure_id` is NOT NULL. Anon reads a row only if its parent comp is published (`exists(...)` in the policy)

Two read views: **`figures_full`** (detail — JSON aggregates for videos/prereqs/switch group/built-on tree) and **`figures_card`** (light list payload + `aliases`; also cached in `localStorage` as the offline catalogue of the voice matcher). Both are `security_invoker` — recreating one without it leaks unpublished rows.

Full-text search on figures uses a GIN index with French `unaccent`.

### Compo scoring grids

The Compo page scores a run against a discipline-specific grid. The scoring engine lives in **`src/lib/compoGrids.js`** — a React-free module shared by `Compo` and the `<RunSaisie>` capture component (React-free specifically to avoid an import cycle between them); `src/pages/Compo.jsx` only owns state, persistence and sharing. All grids live in `GRIDS` there, keyed by grid id — `wakeboard`, `wakeskate`, `seated_mp1` (MP1→MP3), `seated_mp5` (MP3→MP5); seated has two grids (handicap class). Each grid = `{ discipline, modes, sections }`; a section item is `{ key, test(ctx) }` where `ctx = { entries, all }` (`all` includes jib pseudo-entries). Scoring is **binary, no degree thresholds** (anti-perf invariant) and **normalized to /20** (`score20`) so grids are comparable. The active `gridKey` drives the grid selector (cross-discipline switch locked once a figure exists), the per-grid add modes (incl. `flat`), the jib approach axis (hs/ts vs regular/fakie), and the figure-search sport filter. Figure slugs referenced by tests are centralized in `SCORING_SLUGS` (in `compoGrids.js`) with a dev-only guard in `Compo` that warns when a referenced slug is absent from `figures` (slugs are editable in admin → silent drift). "Body varial" and similar concepts with no backing field use explicit slug lists (`WS_BODY_VARIALS`). Adding a grid = one entry in `GRIDS` + translations. The figure data these grids depend on (the Ollie family, wakeskate reclassements) is recorded in `_bmad-output/implementation-artifacts/compo-figures-data.md` — the live DB is the source of truth; that file is just the trace of the one-time seed/reclass operations.

### Judging modules (`/entrainement-juge`, `/juge`, `/grille-composition`)

Roughly half the codebase is now judging tooling, and it follows different rules from the public app:

- **Local-first, no server state.** A heat lives only in `localStorage['wakeref_heat_<code>']` (`src/lib/competition/heatStore.js`), the voice training corpus only in IndexedDB (`src/lib/voiceDataset.js`). The **only** thing that travels between devices is the *parcours* (course), read by short code through the `get_parcours(code)` RPC. Don't add multi-judge sync assumptions.
- **Domain logic is React-free** and lives under `src/lib/`: `competition/model.js` (course, pure/immutable), `competition/runModel.js` (runs, riders, `/100` scoring with `DNS`/`FRS` — it *mutates* the rows it receives, and the reducer always hands it a deep clone), `judgeDiff.js` (LCS alignment by element type, then a binary correct/wrong verdict — no score).
- **`judge_runs` and `parcours` grant `anon` nothing.** Public reads go exclusively through `security definer` RPCs; `list_judge_runs()` deliberately omits the `solution` column so a trainee can judge before revealing it.
- **Voice: two house Whisper models** (`almorelle/whisper-wakeref-onnx` for tricks with vocab bias, `almorelle/whisper-wakeref-jib-onnx` for jib passes without bias then `normalizeJib`). `@huggingface/transformers` must stay a **dynamic import**, and its chunk plus `.wasm`/`ort-*` must stay in `workbox.globIgnores` — a regular visitor must never download the speech stack. Weights come from the HF CDN at runtime, never from `dist/`.
- **Transcription is non-blocking** (8–15 s per pass): the judge dictates, the entry goes "pending", a background queue fills it in (`src/lib/competition/voice.js`). Never make the judge wait on the model.
- **Adding a jib trick** = a line in `VOCAB` of `src/lib/normalizeJib.js` (vocabulary from `scripts/jib-atoms.md`), never a new regex. Check with `node scripts/test-normalize-jib.mjs`.
- `France2026.jsx` keeps its **own** self-contained grids on purpose — the official sheet must not move when `compoGrids.js` evolves.
- These surfaces are **French-only**; they're also chromeless (no Navbar/Footer).

### Seated (wakeboard assis) conventions

Decisions taken when adding the seated spins/shifty/boardslide catalogue (spec: `_bmad-output/implementation-artifacts/spec-seated-discipline-facets.md`; the seed itself was a one-off applied in the Supabase editor — the live DB is the source of truth):

- **`approach[]` is the entry-stance axis, per discipline.** Standing uses `hs` / `ts` (heelside/toeside); **seated uses `regular` / `fakie`** — `regular` = forward entry (facing the direction of travel), `fakie` = backward entry. `fakie` is the seated peer of the standing `ts` slot. There is **no** DB CHECK on this column, so the front carries the valid set: `FigureForm` shows hs/ts vs regular/fakie options conditionally on the figure's disciplines; `FigureDetail` maps all four to labels + decomp accent colors (hs=ambre, ts=violet, regular=cyan, fakie=rose). Add any new approach value in both places.
- **Seated figure names leave the default implicit, mark only the variant.** Mirroring how "un 180" implies `hs fs` in standing, a seated spin is named bare (`FS 180`, `BS 360`) for `regular`, and prefixed `Fakie …` (`Fakie FS 180`) for `fakie`. **Never** prefix names with "Seated"/"Handi" — discipline is conveyed by the badge + filter, not the name (product invariant: *inclusion by filling, not labeling*).
- **Seated figures are native (`sport='seated'`)**, so their `tips`/`description` already are the seated content (no `tips_seated` override needed). Conversely, a trick shared with standing (e.g. railey) stays native to its standing discipline and gains seated reach via `sports += 'seated'` + a `tips_seated` override — not a duplicate figure.

### i18n

Two languages: `fr` (default) and `en`. Language is persisted to `localStorage` under `wakeref_lang`.

- All UI strings live in `src/i18n/translations.js` as a `{ fr: {…}, en: {…} }` object
- `src/i18n/useT.js` — hook to get the current-language translation map
- `src/contexts/LanguageContext.jsx` — exports the Provider only. Import the hooks from `src/contexts/language-context.js`: `useLanguage()` and `useLocalizedField()` (returns the `_en` variant of a DB field when available, falls back to FR). Same split for the theme: Provider in `ThemeContext.jsx`, `useTheme` in `theme-context.js` — keeping the `.jsx` files fast-refresh clean
- The judging surfaces (`/entrainement-juge/voix`, `/grille-composition`, `/juge/*`) are **French-only by design** — judges are francophone; don't add EN strings there
- Bilingual DB fields follow the pattern: `field` (FR) and `field_en` (EN)

### Auth

Admin-only auth via Supabase email/password. `useAuth` (`src/hooks/useAuth.js`) wraps `supabase.auth` and exposes `{ session, loading, signIn, signOut }`.

`AdminLayout` (`src/pages/admin/AdminLayout.jsx`) guards all `/admin/*` routes — redirects unauthenticated users to `/admin/login`.

### Routing

Every route except `/` is lazy-loaded (`React.lazy` + `<Suspense>`). Three groups in `App.jsx`:

- **Public** (`PublicLayout` — `Navbar` + `<Outlet>` + `Footer`): `/`, `/figures`, `/figures/:slug`, `/quiz`, `/composition`, `/composition/:id`, `/grille-composition-old` (legacy `CompositionSimple`), `/entrainement-juge`, `/entrainement-juge/voix`, `/contact`, `/submit`, `/legal`, `/terms`, `/privacy`
- **Admin** (`AdminLayout`, auth-guarded): `/admin` + `figures`, `figures/new`, `figures/:id/edit`, `videos`, `takedowns`, `no-videos`, `submissions`, `compositions`, `runs-entrainement-juge`, `runs-entrainement-juge/new`, `runs-entrainement-juge/:id/edit`, `parcours`, `parcours/new`, `parcours/:id/edit` — plus `/admin/login` outside the guard
- **Chromeless public** (no `Navbar`/`Footer`, full-screen judging surfaces): `/grille-composition` (`France2026` — feuille de note grilles France 2026), `/juge` and `/juge/:code` (`CompetitionView` — le juge charge un parcours par son code)
- **Legacy redirects** (renamed 2026-09-07): `/compo*` → `/composition*`, `/judge*` → `/entrainement-juge*`, `/competition*` → `/juge*`. They exist in **two layers, both needed** — `vercel.json` `redirects` (308, so crawlers consolidate and link-unfurl bots that don't run JS follow through) and matching routes in `App.jsx` (for in-SPA navigation, and for returning PWA users whose service worker serves the shell from cache without ever hitting the edge). Don't delete one as a duplicate of the other. Both declare the **closed set of legacy suffixes one at a time** — never a splat or `:path*` — so an unknown deep path like `/compo/a/b/c` stays a 404 at its real URL instead of being rewritten to a path that never existed. In `App.jsx` the target is rebuilt from the route param, never by `String.replace` on the pathname: the router matches case-insensitively, so `/Compo/x` must redirect like `/compo/x`. `/compo-old` and `/composition-simple` were deliberately NOT redirected. **`/competitions` and `/admin/competitions` are reserved** for the upcoming public competitions agenda — do not claim them for anything else (see `_bmad-output/implementation-artifacts/deferred-work.md`)

### Database setup

**Restore from backup:**
1. `psql "$SUPABASE_DB_URL" < backup_YYYY-MM-DD.sql`
2. `scripts/wakeref_post_restore.sql` — recreates extensions, functions, view, RLS policies, grants, storage bucket

**From scratch:**
1. `scripts/wakeref_post_restore.sql` — full schema (tables, views, RLS policies, triggers, bucket)
2. Recreate admin account manually via Supabase Dashboard → Authentication → Users

**Schema reference:** `scripts/wakeref_schema.sql` — current DB schema exported from Supabase (context only, not meant to be executed). Keep this file up to date when making schema changes.