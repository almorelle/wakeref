---
project_name: 'wakeref'
user_name: 'Wushu'
date: '2026-09-02'
previous_date: '2026-06-13'
sections_completed: ['technology_stack', 'build_lint_verification', 'architecture_guardrails', 'data_layer', 'security', 'i18n_ui', 'domain_model', 'judging_modules']
status: 'complete'
rule_count: 76
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **React 19.2** + **react-dom 19.2** — function components + hooks only.
- **react-router-dom 7.15** — `lazy()` code-splitting on every route except `/`.
- **Vite 8.0** + `@vitejs/plugin-react 6.0` — ESM project (`"type": "module"`); dev server on `:5173`. **Vite 8 runs rolldown**: bundler options live under `build.rolldownOptions` (with `output.advancedChunks.groups`), NOT `rollupOptions` — don't "fix" it back.
- **vite-plugin-pwa 1.3** — `registerType: 'autoUpdate'`, `injectRegister: null`; the SW is registered by hand in `main.jsx` via `virtual:pwa-register` (+ hourly `registration.update()`).
- **@supabase/supabase-js 2.106** — the ONLY backend SDK; there is no custom server.
- **@huggingface/transformers 4.2** — Whisper STT. **Dynamic import only** (see guardrails).
- **jszip 3.10** — voice-dataset export only.
- **@tabler/icons-react 3.44** — imported ONLY through the `Icon` wrapper (`src/components/Icon.jsx`).
- **@vercel/analytics** (`inject()` in `main.jsx`) + **speed-insights** (`<SpeedInsights/>` in `App.jsx`).
- **Language: JavaScript / JSX (ESM).** `@types/react` exist but there is NO `tsconfig.json` — **do not author `.ts`/`.tsx` files** and do not add TypeScript.
- **Tooling: ESLint 9 (flat config) only.** No Prettier, no test runner.

**Version / setup constraints:**
- React 19 + Router 7 are intentional — do NOT downgrade, and do NOT add `react-helmet` (SEO is hand-rolled in `SEO.jsx`).
- Target the Supabase **free plan** — avoid paid-only features (e.g. Storage image transforms).
- `package.json` is the source of truth for versions.

## Critical Implementation Rules

### Build, lint & verification

- **`npm run lint` (ESLint 9) is the only automated check — there are no tests.** The target is 0 errors / 0 warnings. ⚠️ **9 errors / 7 warnings remain, ALL inside the judging & competition module** (`admin/CompetitionSetup.jsx`, `admin/AdminCompetitions.jsx`, `competition/CompetitionView.jsx`, `competition/HeatTab.jsx`, `JudgeVoice.jsx`, `CompositionSimple.jsx`, `France2026.jsx`) — that module is **still under active development**, so its noise is accepted and deliberately not churned. **Everything else is clean: any new error you introduce outside that module is yours.** Inside it, prefer solving the pattern (re-key the component, derive the flag) over moving a `setState` one line down to silence the rule.
- The `react-hooks` rules are the strict React-Compiler set: no `setState` synchronously inside a `useEffect` body, no component declared during render (hoist it to module scope), no ref `.current` access during render. `react/prop-types` is off; unused vars are warnings (`^[A-Z_]` vars / `^_` args exempt).
- **`npm run build`** runs `scripts/generate-sitemap.js` then `vite build`. The sitemap step is **best-effort** — a Supabase outage or missing env vars no longer fails the build. To verify a change, prefer **`npm run dev`** over a full build.
- The `VITE_SUPABASE_*` env vars are baked into the client bundle (`import.meta.env`), so they are still required at build time for the app to work.
- **Verify DB-visible changes as `anon`** (private window), not only as the logged-in admin — RLS hides unpublished figures and takedown videos.
- Jib-composer changes: `node scripts/test-normalize-jib.mjs`.
- Commit prefixes in use: `feat:` `fix:` `refacto:` `docs:` `ux:` `chore:` `ci:`. Work happens on `main` or a short-lived branch merged by PR.

### Architecture guardrails (do NOT)

- Do NOT add a server / API layer — the backend is Postgres (RLS + views + RPCs) plus 2 Deno Edge Functions.
- Do NOT add a CSS framework or component library — UI is **CSS Modules** + global tokens in `src/index.css` (`[data-theme]` theming).
- Do NOT import Tabler icons directly in a component — extend the `Icon` wrapper's name map instead.
- Do NOT put domain logic in components. Scoring (`lib/compoGrids.js`), diffing (`lib/judgeDiff.js`), course/run models (`lib/competition/*`) and the voice pipeline (`voiceMatch.js`, `normalizeJib.js`, `whisperStt.js`) are React-free modules. **`compoGrids.js` must stay React-free** — it is imported by both `Compo` and `RunSaisie`, and a React import there re-creates the cycle it was extracted to break.
- Do NOT make `@huggingface/transformers` a static import, and do NOT remove the `workbox.globIgnores` entries (`transformers-*`, `*.wasm`, `ort-*`, `jszip*`). A regular visitor must never download the speech stack; Whisper weights come from the HF CDN at runtime, never `dist/`.
- New `scripts/*.js` are Node ESM and load env via `dotenv` from `.env.local`.

### Data layer (Supabase)

- Use the singleton client from `src/lib/supabase.js` — never call `createClient` elsewhere. Components query Supabase directly; there is no service/repository layer. The one deliberate exception is `src/lib/competition/api.js` (it owns short-code generation and `23505` retry semantics).
- **Two read views.** `figures_full` = detail (JSON aggregates: videos, prerequisites, switch group, built-on tree, decomposition). `figures_card` = light list payload + `aliases`, used by `/figures`, the home rows, and cached in `localStorage` as the **offline catalogue of the voice matcher**. Use raw tables mainly for admin writes and narrow lookups.
- `figures_full` JSON aggregates (`videos`, `prerequisites`, `switch_versions`, `built_on_children`) may arrive as **strings** via PostgREST — guard with `typeof x === 'string' ? JSON.parse(x) : x`.
- **Switch groups** share videos via `coalesce(switch_of, id)`; `takedown_requested = true` hides a video everywhere.
- **Built-on tree** (`built_on_id`) is kept acyclic by a DB trigger; `built_on_id` must point at the **base** of a switch group, never at the switch (otherwise progression breaks).
- **Search** goes through `src/lib/searchFigures.js` (query expansion -> parallel `search_figures` RPC -> intersect by id -> natural sort), not raw `ilike`.
- `.single()` returns `{ data: null, error }` on not-found (not an exception) — handle it.
- **Schema is hand-managed, no migration tool**: apply in the Supabase SQL editor, then mirror into `scripts/wakeref_post_restore.sql` (executable: views/functions/RLS/grants/triggers/bucket) AND `scripts/wakeref_schema.sql` (reference dump of tables only). One-offs go in `scripts/migrations/`. Keep `src/data/categories.js` / `contexts.js` in sync.
- Adding a `figures` column means adding it to `figures_full` (decomposition columns stay appended at the END for `create or replace` compatibility) and, if it belongs on cards, to `figures_card`. A **new table** needs `enable row level security` + explicit policies + grants; a **new RPC** needs an explicit `grant execute`.
- Size/abuse caps live in the DB: `compositions` 20 inserts/min + 50 KB JSON; `parcours.data` and `judge_runs.solution` 50 KB; `parcours.name` unique, 1-80 chars.

### Security (RLS is the only boundary)

- The Supabase **anon key is public by design** (shipped in the bundle) — all security rests on RLS. `AdminLayout`'s guard is UX-only. Every new table/view/RPC must get RLS policies + grants reviewed before shipping.
- Keep `figures_full` and `figures_card` as `security_invoker = true` — recreating a view without it runs as owner and **leaks unpublished rows**.
- `security definer` functions MUST pin `set search_path = public`.
- **`judge_runs`, `parcours` and `figure_views` grant `anon` nothing.** Public access goes exclusively through `security definer` RPCs. Keep it that way: `list_judge_runs()` deliberately omits the `solution` column so a trainee can judge a run before revealing the answer — never widen it, and never embed a solution in a listing payload.
- Auth is a **single admin; never add a public sign-up flow** — `authenticated` gets full CRUD via RLS.
- RLS hides unpublished figures / takedown videos from `anon` — verify visibility **as anon**.
- Public-insert inboxes are abuse vectors: only `compositions` is rate-limited (20/min); `video_submissions` (fires a notification email) and `takedown_requests` are not. Anyone with a code can read a run via `get_composition(id)` or a course via `get_parcours(code)` — store nothing sensitive there.
- **Don't tighten `Permissions-Policy` back to `microphone=()`** in `vercel.json`. An empty allowlist bans the feature for the site itself, not just third parties, and silently kills both voice surfaces in production while dev keeps working (the header isn't applied there). `microphone=(self)` is required and grants nothing on its own — the browser still prompts the user. `camera` and `geolocation` stay closed.

### i18n & UI conventions

- UI strings live in `src/i18n/translations.js` as `{ fr: {...}, en: {...} }` — add new strings to **both** languages; read them via `useT()`.
- DB content is bilingual via `field` / `field_en` columns, rendered through `useLocalizedField()` (FR fallback). New DB text fields come in `field` + `field_en` pairs.
- **Exception — the judging surfaces are French-only by design**: `/judge/voix`, `/composition-simple` and `/competition/*` ship inline FR strings. Judges are francophone and the vocabulary is the FFSNW's. Don't add an EN layer there.
- **Import the context hooks from the `-context.js` modules**: `useLanguage` / `useLocalizedField` from `src/contexts/language-context.js`, `useTheme` from `src/contexts/theme-context.js`. The matching `.jsx` files export ONLY their Provider (fast-refresh clean) — don't move hooks back.
- One component per file with a co-located `*.module.css`. Reuse global classes/tokens from `src/index.css` (`.btn`, `.btn-ghost`, `.btn-icon`, `.spinner`, `[data-theme]` vars) before adding new ones — no CSS framework.
- Theming is `[data-theme]` on `<html>` + a `theme-color` meta update, persisted to `localStorage`. Provider order (`main.jsx`): `StrictMode -> BrowserRouter -> ThemeProvider -> LanguageProvider -> App`.
- SEO is imperative (`src/components/SEO.jsx`) — no `react-helmet`.
- Admin pages are `lazy()`-loaded and code-split out of the public bundle — never import an `admin/*` module from a public page/component.

### Domain model & gotchas

- **Scope: cable only** (wakeboard, wakeskate, seated). Never introduce boat/wave vocabulary ("wake-to-wake", "transfert", "passages de vague"); the cable equivalents are kickers / modules / features / poulies and the cable itself.
- A `figure` is a trick: `sport` in {`wakeboard`, `wakeskate`, `seated`}, `difficulty` 1-5. `sport` is the **native** discipline; `sports[]` (superset of `{sport}`) is where it's offered. A trick shared with another discipline stays ONE row + a `tips_<discipline>[]` override — never a duplicate figure.
- **`approach[]` carries two vocabularies**: `hs`/`ts` standing, **`regular`/`fakie` seated** (forward vs backward entry; `fakie` is the seated peer of `ts`). There is **no DB CHECK** — the valid set is enforced only by `admin/FigureForm.jsx` and `FigureDetail.jsx`. Add any new value in both.
- **Seated names leave the default implicit**: bare (`FS 180`) for `regular`, `Fakie ...` prefix for `fakie`. **Never** prefix a name with "Seated"/"Handi" — the discipline is the badge and the filter, not the name (product invariant: *inclusion by filling, not labeling*).
- **Switch variant** = `is_switch` + `switch_of`. A figure and its switch form a **switch group** keyed by `coalesce(switch_of, id)` and **share videos** — don't attach the same video twice.
- **`built_on_id`** = the simpler trick this one extends (a 540 is built on a 360); acyclic tree. DISTINCT from **`prerequisites`** (many-to-many "should know first"). Don't conflate them.
- **Rotation decomposition** is driven by `spin` / `inverts` / `rewind_degs` / `rotation_type` (subset of {`ole`, `handle_pass`}). All the logic (rotation units, `fs`=clockwise / `bs`=counter-clockwise, rewind rules) lives in `src/lib/trickDecomposition.js` — extend it THERE.
- **Contexts** are `kicker`, `feature`, `flat`, `air_trick` (`src/data/contexts.js`). The `jib` context was renamed to `feature`; the `Jib` **category** (id 9, formerly "Slides") is a separate concept.
- **Categories**: 14 fixed entries, mirrored in `src/data/categories.js` (icons/colors) and the `categories` table — keep both in sync.

### Judging modules (`/judge`, `/competition`, `/composition-simple`)

- **Local-first, no server state.** A heat lives only in `localStorage['wakeref_heat_<code>']` (`lib/competition/heatStore.js`); the voice corpus only in IndexedDB (`lib/voiceDataset.js`). The ONLY thing that travels between devices is the *parcours*, read by short code via `get_parcours`. Don't add multi-judge sync assumptions, and don't rename a storage key without a migration — that discards a judge's work in progress.
- **Scoring is binary and normalized to /20** (`score20`), no degree thresholds (anti-perf invariant), so grids stay comparable. Adding a grid = one entry in `GRIDS` (`lib/compoGrids.js`) + translations.
- **`SCORING_SLUGS` references figure slugs by value** and slugs are editable in admin -> silent drift. A dev-only guard in `Compo` warns when a referenced slug is missing; check the console after renames.
- `lib/competition/runModel.js` **mutates** the rows it receives — the reducer always hands it a deep clone. Keep that contract if you touch either side.
- `France2026.jsx` keeps its **own** self-contained grids on purpose: the official sheet must not move when `compoGrids.js` evolves. A rules change may need applying in both.
- **Voice: two house models** — `almorelle/whisper-wakeref-onnx` (tricks, with vocab bias) and `almorelle/whisper-wakeref-jib-onnx` (jib passes, no bias, then `normalizeJib`).
- **Transcription must stay non-blocking** (8-15 s/pass): the judge dictates, the entry goes "pending", a background queue fills it in (`lib/competition/voice.js`). Never make the judge wait.
- **Adding a jib trick** = a line in the `VOCAB` of `lib/normalizeJib.js` (vocabulary sourced from `scripts/jib-atoms.md`), never a new regex. Verify with `node scripts/test-normalize-jib.mjs`.
- `lib/judgeDiff.js` aligns by element **type** (LCS) then judges content **binary** correct/wrong — no partial credit, no score computed there.

## Usage Guidelines

**For AI agents:**
- Read this file before implementing code in this repo, and follow the rules exactly.
- When unsure, prefer the more restrictive option. `npm run lint` is the only automated check — leave it no worse than you found it (it is currently red; see the build section).
- Cross-reference the deeper docs in `docs/` (architecture, data-models, api-contracts, component-inventory) for detail beyond these rules, and `CLAUDE.md` for the repo's working instructions.
- Two rule families are load-bearing and easy to break by "simplifying": the **RPC-only access** to `judge_runs` / `parcours` / `figure_views`, and the **isolation of the speech stack** (dynamic import + precache exclusions).

**For humans:**
- Keep this lean and focused on unobvious agent needs; remove rules that become obvious.
- Update when the stack, schema, or conventions change — especially the version pins, the data-layer/security rules, and the judging-module invariants.
- Regenerate with `/bmad-generate-project-context` after any large feature; the last full pass followed a `bmad-document-project` deep rescan of `docs/`.

Last Updated: 2026-09-02
