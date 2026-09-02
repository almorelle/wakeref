# Architecture — WakeRef

> Generated: 2026-06-11 · Updated: 2026-09-02 (full rescan) · Type: `web` · Repository: **monolith**

## Executive summary

**WakeRef** is a cable wakeboard / wakeskate / seated tricks reference **and a set of judging tools** — an installable PWA. It is a **client-rendered React SPA** with **no backend of its own**: the browser talks directly to **Supabase** (PostgreSQL + Auth + Storage + Edge Functions). All business logic and authorization live in the database (Row-Level Security, denormalizing views, RPC functions, triggers) plus two Deno Edge Functions for transactional email. The app is bilingual (FR default / EN), themeable (dark/light), and deployed as a static bundle on Vercel.

Two decisions define the shape:

1. **Thick database, thin client, no API layer.** The deploy artifact stays a static `dist/`; correctness and security are pushed into Postgres. **RLS policies + the `figures_full` / `figures_card` views + RPCs are the de-facto API contract.**
2. **The judging tools are local-first.** Heat state, run capture, speech models and the training dataset never leave the judge's device (`localStorage`, IndexedDB, in-memory). Only the **parcours** (course definition) travels, via a short code and a `security definer` RPC. There is no multi-judge sync and no server-side scoring.

## Technology stack

| Category | Technology | Version | Role |
|----------|-----------|---------|------|
| Language | JavaScript (ESM, JSX) | — | `"type": "module"`; no TypeScript (only `@types/*` dev deps) |
| UI | React | ^19.2 | Function components + hooks |
| Routing | react-router-dom | ^7.15 | SPA routing, `lazy()` code-splitting |
| Build | Vite | ^8.0 | Dev server + bundler — **rolldown** (`build.rolldownOptions`, not `rollupOptions`) |
| | @vitejs/plugin-react | ^6.0 | React fast refresh / JSX |
| PWA | vite-plugin-pwa | ^1.3 | Service worker (autoUpdate), web manifest, selective precache |
| Backend (BaaS) | Supabase (@supabase/supabase-js) | ^2.106 | Postgres, Auth, Storage, Edge Functions |
| Speech-to-text | @huggingface/transformers | ^4.2 | Whisper ONNX in-browser; **dynamic import only** |
| Packaging | jszip | ^3.10 | Voice-dataset export (audiofolder `.zip`) |
| Icons | @tabler/icons-react | ^3.44 | via central `Icon` wrapper |
| Analytics | @vercel/analytics, @vercel/speed-insights | ^2 | RUM + Web Vitals |
| Email | Resend (called from Edge Functions) | — | Transactional email |
| Styling | CSS Modules + global `index.css` | — | CSS variables, `[data-theme]` theming; no CSS framework |
| Lint | ESLint 9 (flat config) | ^9.39 | `npm run lint`; strict `react-hooks` (React Compiler) rules |
| Hosting | Vercel | — | Static SPA + CDN + headers |
| CI | GitHub Actions | — | Daily DB backup only |

## Architecture pattern

**Layered client-side SPA over a Backend-as-a-Service.** Layers:

1. **Presentation** — `src/pages/*` (route components) + `src/components/*` (shared UI), CSS Modules.
2. **App state** — React Context (`LanguageContext`, `ThemeContext`) + local component state; no global store. The competition module adds a **`useReducer` store** (`src/lib/competition/heatStore.js`) with `localStorage` autosave keyed by course code.
3. **Data access** — `src/lib/*` (singleton Supabase client, search expansion, scoring grids, voice stack, competition API) + hooks (`useAuth`, `useToast`, `useScrollDrive`). No repository/service abstraction — components call `supabase.*` directly. The one exception is `src/lib/competition/api.js`, a thin typed wrapper around the `parcours` table because it owns retry/short-code/duplicate-name semantics.
4. **Backend (Supabase)** — Postgres with RLS as the authorization boundary, `figures_full` / `figures_card` views as read models, RPCs as the explicit contract, triggers for invariants, Storage for media, Edge Functions for email.

### Routing & code-splitting (`src/App.jsx`)

Every route except `/` is `lazy()`-loaded. **Three** groups:

- **`PublicLayout`** — `Navbar` + `<Outlet/>` + `Footer`: `/`, `/figures`, `/figures/:slug`, `/quiz`, `/compo`, `/compo/:id`, `/compo-old`, `/judge`, `/judge/voix`, `/contact`, `/submit`, `/legal`, `/terms`, `/privacy`.
- **`AdminLayout`** (auth-guarded) — figures, videos, takedowns, no-videos, submissions, compositions, judge-runs, competitions; `/admin/login` sits outside the guard.
- **Chromeless public** — no Navbar/Footer, full-screen judging surfaces: `/composition-simple` (France 2026 sheet) and `/competition`, `/competition/:code`.

The entire admin area is split out of the public bundle. Provider order (`main.jsx`): `BrowserRouter → ThemeProvider → LanguageProvider → App`.

### Bundle strategy (`vite.config.js`)

Manual vendor groups isolate `supabase`, `react`, and **`transformers`**. The STT stack is deliberately quarantined: `@huggingface/transformers` is imported dynamically at first use, its chunk plus every `.wasm` / `ort-*` / `jszip*` asset is excluded from PWA precache (`workbox.globIgnores`), and the Whisper weights are fetched from the Hugging Face CDN at runtime — so they are never in `dist/` and a regular visitor never downloads them.

## Data architecture

See `data-models.md` for the full schema. Key ideas:

- **Core entity `figures`** with self-referential **switch groups** (`switch_of`), a self-referential **built-on tree** (`built_on_id`, kept acyclic by a trigger), and many-to-many **prerequisites**.
- **Two read views.** `figures_full` denormalizes category, switch relations, prerequisites, switch-group-shared videos, the built-on tree and the decomposition columns into one JSON-rich row (detail/admin reads). `figures_card` is a light projection (`slug, name, sport, sports, difficulty, contexts, category_*, aliases`) used by list/grid pages, the home rows, and — cached in `localStorage` — by the **voice matcher** so it works offline.
- **Trick decomposition** (`src/lib/trickDecomposition.js`) turns `spin` / `inverts` / `rewind_degs` / `rotation_type` into displayable rotation units.
- **Bilingual columns** (`field` / `field_en`) resolved client-side via `useLocalizedField()`.
- **Public-write inboxes** (`video_submissions`, `takedown_requests`, `compositions`) are insert-only for `anon`, read by admin.
- **Popularity:** `figure_views` (figure × day counter) written by the `track_figure_view` RPC and read back through `most_viewed_figures`.
- **Judging content:** `judge_runs` (reference run + its `solution` JSONB, admin-managed, exposed to the public through two RPCs) and `parcours` (competition course, admin-managed, read publicly by short code).
- **French full-text search** via a GIN index over `unaccent`-normalized text, exposed through `search_figures()` and enriched by client-side abbreviation expansion (`src/lib/searchExpand.js`).

## Domain engines (React-free modules)

Business logic that must stay testable and reusable lives in plain modules under `src/lib/`, not in components:

| Module | Owns |
|--------|------|
| `compoGrids.js` | `SCORING_SLUGS`, jib helpers, the four `GRIDS`, `computeScore` (binary tests → `/20`). Shared by `Compo` and `RunSaisie`; kept React-free specifically to avoid an import cycle between them. |
| `trickDecomposition.js` | Rotation units, fs/bs direction rules, rewind labels. |
| `judgeDiff.js` | LCS alignment of a judge's entry against a reference run *by element type*, then a **binary** correct/wrong verdict per aligned pair. No score is computed here. |
| `competition/model.js` | The course: ordered zones + pulleys, second-pass twins, pulley renumbering, snapshot/restore. All pure & immutable. |
| `competition/runModel.js` | Run rows, rider bookkeeping, run-2 drafts, `/100` scoring with `DNS` / `FRS` semantics. Mutates the rows it is handed — the reducer always passes a deep clone. |
| `competition/heatStore.js` | `heatReducer` + `useHeatStore`: full heat state, navigation cursors, `localStorage` autosave per course code. |
| `voiceMatch.js` | Dictation → figure matching (accent/phonetic normalization, alias index, tiered confidence). 100 % local. |
| `normalizeJib.js` | Vocabulary-driven jib composer: rotation convention → atom matching → adjacency assembly. Adding a trick = a `VOCAB` line, not a regex. Source vocabulary: `scripts/jib-atoms.md`. |
| `whisperStt.js` | Whisper model registry (incl. the two house fine-tunes), bias prompting, `transcribe`, audio → mono 16 kHz. |
| `voiceDataset.js` | IndexedDB sample store (audio + label) and `.zip` audiofolder export for fine-tuning. |

## Voice pipeline

Two house models, both published on Hugging Face and loaded at runtime:

- `almorelle/whisper-wakeref-onnx` — isolated tricks (whisper-base, fp32), used **with** vocabulary bias.
- `almorelle/whisper-wakeref-jib-onnx` — jib passes (whisper-small, q8), used **without** bias or grammar constraint, then piped through `normalizeJib`.

`/judge/voix` is the lab: it can also run the Web Speech API (online, Chrome-only) or stock Whisper base/small/large-v3-turbo for A/B comparison, and it records (clip, confirmed label) pairs into IndexedDB for the next fine-tune. `src/lib/competition/voice.js` is the production consumer: a **non-blocking** queue — the judge dictates, the entry is marked pending, a background worker transcribes (8–15 s per pass on the small model) and fills it in, and the judge validates or corrects after the run. Training pipelines and model cards live in `training/{tricks,jib}/`.

## Authorization model

There is no app-server to enforce permissions, so **PostgreSQL RLS is the security boundary**:

- `anon` can read public content (`published` figures, non-takedown videos) and insert into the three inboxes; it may also execute the read-only judging RPCs (`list_judge_runs`, `get_judge_run_solution`, `get_parcours`, `get_composition`, `track_figure_view`, `most_viewed_figures`, `recent_video_figures`).
- `authenticated` (the single admin) gets full CRUD on content tables, via policies of the form `(select auth.role()) = 'authenticated'` (sub-select so it's evaluated once per query).
- **`judge_runs` and `parcours` have no `anon` table policy at all** — public access goes exclusively through `security definer` RPCs, which is what keeps unpublished runs and un-shared courses invisible.
- The client-side `AdminLayout` guard is **UX only**; real enforcement is server-side.

See `api-contracts.md` for the per-role access matrix, RPC signatures, Storage rules, and Edge Functions.

## API design

No REST API is authored. The contract surface is:

1. **PostgREST** over tables and the two views (shaped by RLS + grants).
2. **RPC functions** — 12 callable ones (see `api-contracts.md`), of which 6 are `security definer` gateways for public reads.
3. **Storage** `videos` bucket (public read, admin write; thumbnails by `thumbnails/<shortcode>.jpg` convention; judge-run videos under the same bucket).
4. **Edge Functions:** `send-contact` (browser-invoked) and `notify-video-submission` (DB-webhook-invoked) → Resend email.

## Source tree

See `source-tree-analysis.md` for the annotated tree. Entry points: `index.html` → `src/main.jsx` → `src/App.jsx`; the only Supabase client is `src/lib/supabase.js`.

## Development & deployment

- **Dev/build:** `npm run dev` / `npm run build` (build also generates `public/sitemap.xml` by querying Supabase) / `npm run lint`. See `development-guide.md`.
- **Deploy:** static `dist/` to Vercel with two `VITE_*` env vars; Supabase schema applied via `scripts/wakeref_post_restore.sql`; Edge Functions + webhook configured separately. See `deployment-guide.md`.
- **Backups:** daily `pg_dump` GitHub Action to the Supabase `backups` bucket.

## Testing strategy

**No test runner.** `npm run lint` (ESLint 9) is the only automated check, and the intent is to keep it at 0 errors / 0 warnings. Everything else is manual verification (run the app, exercise flows). This remains the most significant gap for larger changes. Note the two Node scripts that double as manual harnesses: `scripts/test-normalize-jib.mjs` (jib composer cases) and `scripts/gen-aliases.mjs`.

## Notable cross-cutting concerns

- **i18n:** UI strings in `src/i18n/translations.js` (`{fr,en}`); DB content bilingual via `_en` columns. The judging surfaces (`/judge/voix`, `/competition`, `/composition-simple`) are intentionally French-only.
- **SEO:** `src/components/SEO.jsx` imperatively manages title/meta/OG per page+language; sitemap generated at build; security/cache headers in `vercel.json`.
- **PWA:** auto-updating service worker; installable manifest; STT/wasm assets excluded from precache.
- **Privacy of the voice stack:** audio never leaves the device — STT runs locally and the dataset lives in IndexedDB until an explicit `.zip` export.
- **Abuse control:** `compositions` insert rate-limit trigger (20/min) and 50 KB JSON size cap; `parcours.data` and `judge_runs.solution` carry the same 50 KB cap; `parcours.name` is unique and length-checked.
- **Data invariants in-DB:** `figures_built_on_acyclic` trigger forbids cycles/self-references in the built-on tree; `rotation_type` CHECK-constrained to `{ole, handle_pass}`; `judge_runs.difficulty` CHECK-constrained to `{easy, medium, hard}`.

## Architectural risks / watch-items

1. **No automated tests** — ESLint (`npm run lint`) is the only automated guard; refactors are otherwise unguarded. **It is currently failing** — 14 errors / 7 warnings spread over 12 files, so the 0/0 invariant is not holding today. The competition module accounts for 9 of the 14 errors, and `src/pages/admin/CompetitionSetup.jsx` alone for 6.
2. **Schema managed by hand** across two SQL files + the live DB — easy to drift; keep them and `src/data/*` in sync.
3. **Build env vars are baked into the client bundle** — `VITE_SUPABASE_*` are required at build time for the app to work (the sitemap step itself is best-effort and no longer breaks the build on a DB outage).
4. **Judging state is device-local and unbacked.** A heat lives in one browser's `localStorage`; clearing site data loses a competition's scoring. Only the course is recoverable (from `parcours`).
5. **Scoring grids reference figure slugs by value** (`SCORING_SLUGS`) while slugs stay editable in admin — a dev-only guard warns on drift, but production silently scores a missing item as "not achieved".
6. **Two parallel grid implementations** — `src/lib/compoGrids.js` (Compo/judge) and the self-contained `RAW_GRIDS` in `France2026.jsx`. Intentional (the France 2026 sheet must not move when the app's grids do), but a change in judging rules has to be applied in both places.
