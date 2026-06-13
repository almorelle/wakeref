---
project_name: 'wakeref'
user_name: 'Wushu'
date: '2026-06-13'
sections_completed: ['technology_stack', 'data_layer', 'security', 'i18n_ui', 'domain_model']
status: 'complete'
rule_count: 48
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **React 19.2** + **react-dom 19.2** — function components + hooks only.
- **react-router-dom 7.15** — `lazy()` route-level code-splitting (public heavy pages + the whole admin area).
- **Vite 8.0** + `@vitejs/plugin-react 6.0` — ESM project (`"type": "module"`); dev server on `:5173`.
- **vite-plugin-pwa 1.3** — `registerType: 'autoUpdate'`, `skipWaiting`/`clientsClaim` (the SW updates silently; there is no update prompt).
- **@supabase/supabase-js 2.106** — the ONLY backend SDK; there is no custom server.
- **@tabler/icons-react 3.44** — imported ONLY through the `Icon` wrapper (`src/components/Icon.jsx`).
- **@vercel/analytics + speed-insights** — injected in `main.jsx`.
- **Language: JavaScript / JSX (ESM).** `@types/react` exist but there is NO `tsconfig.json` — **do not author `.ts`/`.tsx` files** and do not add TypeScript.
- **Tooling: ESLint 9 (flat config) only.** No Prettier, no test runner.

**Version / setup constraints:**
- React 19 + Router 7 are intentional — do NOT downgrade, and do NOT add `react-helmet` (SEO is hand-rolled in `SEO.jsx`).
- Target the Supabase **free plan** — avoid paid-only features (e.g. Storage image transforms).
- `README.md` / `CLAUDE.md` may mention React 18 / Router 6 — `package.json` is the source of truth (19.2 / 7.15).

## Critical Implementation Rules

### Build, lint & verification

- **`npm run lint` (ESLint 9) must stay at 0 errors / 0 warnings.** The `react-hooks` rules are the strict React-Compiler set: no `setState` synchronously inside a `useEffect` body, no component declared during render (hoist it to module scope), no ref `.current` access during render.
- **`npm run build`** runs `scripts/generate-sitemap.js` then `vite build`. The sitemap step is **best-effort** — a Supabase outage or missing env vars no longer fails the build. To verify a change, prefer **`npm run dev`** rather than a full build.
- The `VITE_SUPABASE_*` env vars are baked into the client bundle (`import.meta.env`), so they are still required at build time for the app to work.
- There are **no automated tests** — verify changes by running the app.

### Architecture guardrails (do NOT)

- Do NOT add a server / API layer — the backend is Postgres (RLS + `figures_full` view + RPCs) plus 2 Deno Edge Functions.
- Do NOT add a CSS framework or component library — UI is **CSS Modules** + global tokens in `src/index.css` (`[data-theme]` theming).
- Do NOT import Tabler icons directly in a component — extend the `Icon` wrapper's name map instead.
- New `scripts/*.js` are Node ESM and load env via `dotenv` from `.env.local`.

### Data layer (Supabase)

- Use the singleton client from `src/lib/supabase.js` — never call `createClient` elsewhere. Components query Supabase directly; there is no service/repository layer.
- **Read through the `figures_full` view** for display (it denormalizes category, switch relations, prerequisites, switch-group-shared videos, the built-on tree, and decomposition columns into JSON). Use raw tables mainly for admin writes and narrow lookups.
- `figures_full` JSON aggregates (`videos`, `prerequisites`, `switch_versions`, `built_on_children`) may arrive as **strings** via PostgREST — guard with `typeof x === 'string' ? JSON.parse(x) : x` before mapping.
- **Switch groups** share videos via `coalesce(switch_of, id)`; `takedown_requested = true` hides a video everywhere.
- **Built-on tree** (`built_on_id`) is kept acyclic by a DB trigger — never write a cycle; the view exposes parent / children / root.
- **Search** goes through `src/lib/searchFigures.js` (query expansion → parallel `search_figures` RPC → intersect by id → natural sort), not raw `ilike` queries.
- `.single()` returns `{ data: null, error }` on not-found (not an exception) — handle it.
- **Schema is hand-managed, no migration tool**: apply changes in the Supabase SQL editor, then mirror into `scripts/wakeref_post_restore.sql` (executable: view/functions/RLS/grants/triggers/bucket) AND `scripts/wakeref_schema.sql` (reference dump). Keep `src/data/categories.js` / `contexts.js` in sync.
- Adding a `figures` column means also adding it to the `figures_full` view (decomposition columns stay appended at the END for `create or replace` compatibility). A **new table** needs `enable row level security` + explicit policies + grants; a **new RPC** needs an explicit `grant execute`.
- `compositions` has a DB rate limit (20 inserts/min) and a 50 KB JSON cap — don't build bulk-insert flows.

### Security (RLS is the only boundary)

- The Supabase **anon key is public by design** (shipped in the bundle) — all security rests on RLS. `AdminLayout`'s guard is UX-only. Every new table/view/RPC must get RLS policies + grants reviewed before shipping. `anon` may read published figures / non-takedown videos and INSERT into the three inboxes; everything else is `authenticated`.
- Keep `figures_full` as `security_invoker = true` — recreating the view without it runs as owner and **leaks unpublished rows**.
- `security definer` functions MUST pin `set search_path = public` (prevents search_path hijacking).
- Auth is a **single admin; never add a public sign-up flow** — the `authenticated` role gets full CRUD via RLS.
- RLS hides unpublished figures / takedown videos from `anon` — verify visibility **as anon**, not just as the logged-in admin.
- Public-insert inboxes are abuse vectors: only `compositions` is rate-limited (20/min); `video_submissions` (fires a notification email) and `takedown_requests` are not. Anyone can read a run via `get_composition(id)` — don't store anything sensitive in `compositions`.

### i18n & UI conventions

- UI strings live in `src/i18n/translations.js` as `{ fr: {…}, en: {…} }` — add new strings to **both** languages; read them via `useT()`.
- DB content is bilingual via `field` / `field_en` columns, rendered through `useLocalizedField()` (FR fallback). New DB text fields come in `field` + `field_en` pairs.
- **Import the context hooks from the `-context.js` modules**: `useLanguage` / `useLocalizedField` from `src/contexts/language-context.js`, `useTheme` from `src/contexts/theme-context.js`. The matching `.jsx` files export ONLY their Provider (so the files stay fast-refresh-clean — don't move hooks back into them).
- One component per file with a co-located `*.module.css`. Reuse global classes/tokens from `src/index.css` (`.btn`, `.btn-ghost`, `.btn-icon`, `.spinner`, `[data-theme]` vars) before adding new ones — no CSS framework.
- Theming is `[data-theme]` on `<html>` + a `theme-color` meta update, persisted to `localStorage`. Provider order (`main.jsx`): `BrowserRouter → ThemeProvider → LanguageProvider → App`.
- SEO is imperative (`src/components/SEO.jsx` sets title/meta/OG per page + language) — no `react-helmet`.
- Admin pages are `lazy()`-loaded and code-split out of the public bundle — never import an `admin/*` module from a public page/component.

### Domain model & gotchas

- A `figure` is a trick: `sport` ∈ {wakeboard, wakeskate}, `difficulty` 1–5.
- **Switch variant** = `is_switch` + `switch_of` (self-ref to the base). A figure and its switch form a **switch group** keyed by `coalesce(switch_of, id)` and **share videos** — don't attach the same video twice across the group.
- **`built_on_id`** = the simpler trick this one extends (e.g. a 540 is built on a 360); forms the acyclic trick tree. This is DISTINCT from **`prerequisites`** (many-to-many "should know first"). Don't conflate them.
- **Rotation decomposition** is driven by `spin` (deg), `inverts` (count), `rewind_degs` (array), `rotation_type` (⊆ {`ole`, `handle_pass`}). The admin `FigureForm` rotation builder writes them; `FigureDetail` renders the breakdown. All decomposition logic (rotation units, `fs`=clockwise / `bs`=counter-clockwise, rewind direction/label rules) lives in `src/lib/trickDecomposition.js` — extend it THERE, not inline in components.
- **Contexts** are `kicker`, `feature`, `flat`, `air_trick` (`src/data/contexts.js`). Note: the `jib` context was renamed to `feature`; the `Jib` category (id 9, formerly "Slides") is a separate concept.
- **Categories**: 14 fixed entries, mirrored in both `src/data/categories.js` (with icons/colors) and the `categories` table — keep both in sync when adding one.

---

## Usage Guidelines

**For AI agents:**
- Read this file before implementing code in this repo, and follow the rules exactly.
- When unsure, prefer the more restrictive option; `npm run lint` must end at 0/0.
- Cross-reference the deeper docs in `docs/` (architecture, data-models, api-contracts) for detail beyond these rules.

**For humans:**
- Keep this lean and focused on unobvious agent needs; remove rules that become obvious.
- Update when the stack, schema, or conventions change — especially the version pins and the data-layer/security rules.

Last Updated: 2026-06-13
