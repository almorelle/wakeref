# Development Guide — WakeRef

> Generated: 2026-06-11 · Updated: 2026-09-02 (full rescan) · Deep Scan

## Prerequisites

- **Node.js** ≥ 20 recommended (Vite 8 + React 19 toolchain; ESM project — `"type": "module"`).
- **npm** (a `package-lock.json` is committed).
- A **Supabase** project (PostgreSQL + Auth + Storage).
- Optional, for DB/email work: **psql** (PostgreSQL 17 client) and the **Supabase CLI** (`npx supabase`).

## 1. Install

```bash
cd wakeref
npm install
```

## 2. Environment

```bash
cp .env.example .env.local
```

Fill `.env.local` (values from Supabase Dashboard → Settings → API Keys):

```
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxx
```

Only `VITE_`-prefixed vars are exposed to the client (Vite convention). `src/lib/supabase.js` throws at startup if either is missing. The anon key is safe to ship — data access is gated by RLS, not by key secrecy.

## 3. Database setup

No migration framework — schema lives in SQL files run against Supabase.

**From scratch:** in the Supabase **SQL Editor**, run `scripts/wakeref_post_restore.sql`. It creates extensions, functions, the `figures_full` and `figures_card` views, RLS policies, grants, triggers, indexes, and the `videos` Storage bucket. Then create the admin user manually (step 4). One-off changes applied by hand live in `scripts/migrations/`; `scripts/competition_parcours.sql` carries the competition module's table + RPC + policies.

**Restore from a backup:**
```bash
psql "$SUPABASE_DB_URL" < backup_YYYY-MM-DD.sql
psql "$SUPABASE_DB_URL" < scripts/wakeref_post_restore.sql
```
(`wakeref_schema.sql` is a reference dump only — do not execute it.)

## 4. Admin account

There is no public sign-up. Create the single admin in Supabase → **Authentication → Users → Add user** (email + password). This account is the only one that can mutate figures/videos (enforced by the `authenticated`-role RLS policies).

## 5. Run

```bash
npm run dev      # http://localhost:5173
```

## 6. Build & preview

```bash
npm run build    # node scripts/generate-sitemap.js && vite build  →  dist/
npm run preview  # serve the production build locally
```

> `npm run build` first runs `scripts/generate-sitemap.js`, which queries your Supabase project (using `.env.local`) for published figure slugs + categories and writes `public/sitemap.xml`. This step is **best-effort**: if Supabase is unreachable or env vars are missing, it warns and the build still proceeds (keeping the previous sitemap, or writing a static-only one). The `VITE_SUPABASE_*` vars are still baked into the client bundle, so they're required for the app itself.

## Scripts reference

| Command | What it does |
|---------|--------------|
| `npm run dev` | Vite dev server at `:5173` |
| `npm run build` | Generate sitemap, then `vite build` → `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint 9 flat config (`eslint.config.js`) over `src/`, `scripts/`, `*.config.js` |

Standalone Node scripts (run with `node`, they load `.env.local` via `dotenv` when they need the DB):

| Script | What it does |
|--------|--------------|
| `scripts/generate-sitemap.js` | Called by `npm run build`; best-effort sitemap generation |
| `scripts/gen-aliases.mjs` | Generates spoken aliases for figures (feeds `figures.aliases`, used by the voice matcher) |
| `scripts/test-normalize-jib.mjs` | Manual harness for the jib composer — run it after touching `normalizeJib.js` |
| `scripts/download-videos.mjs` | Bulk-exports videos from Storage into `videos-export/` |

There is **no test runner** configured. "Verification" today means `npm run lint` plus running the app and exercising flows manually. The lint config layers `js.configs.recommended` + `eslint-plugin-react` (flat, `jsx-runtime` — React 19 needs no `import React`) + `react-hooks` + `react-refresh`; unused vars are a warning, `react/prop-types` is off (plain JS project).

## 7. Verifying a change

There is no test runner, so verification is:

1. `npm run lint` — must end at **0 errors / 0 warnings**. The `react-hooks` rules are the strict React-Compiler set: no `setState` synchronously inside a `useEffect` body, no component declared during render (hoist it to module scope), no ref `.current` access during render.
   *Current state: the tree does not satisfy this — 14 errors / 7 warnings over 12 files. Fix what you touch, and don't add to it. By rule:*
   - *6 × `react/no-unescaped-entities` — raw French apostrophes in JSX (`admin/CompetitionSetup` ×4, `JudgeVoice`, `admin/AdminDashboard`). Mechanical.*
   - *5 × `react-hooks/set-state-in-effect` — `FigureDetail:64`, `admin/AdminCompetitions:22`, `admin/AdminVideos:80`, `admin/CompetitionSetup:107`, `competition/CompetitionView:24`. Each needs the effect re-read; a blind fix can change first-render behaviour.*
   - *2 × `react-hooks/immutability` — `admin/CompetitionSetup:238` (`pseen` reassigned after render) and `admin/FigureForm:203` (`genSlug` used before declaration). The two most substantive ones.*
   - *1 × `no-useless-escape` — `lib/normalizeJib.js:238`.*
2. `npm run dev` and exercise the flow. Prefer this over a full build.
3. For DB-visible changes, check the page **as `anon`** (private window), not only as the logged-in admin — RLS hides unpublished figures and takedown videos.
4. Jib composer changes: `node scripts/test-normalize-jib.mjs`.

## Working on the voice stack

The two house models are published on Hugging Face and loaded at runtime — nothing to install locally:

- `almorelle/whisper-wakeref-onnx` — isolated tricks (whisper-base, fp32), used with vocabulary bias.
- `almorelle/whisper-wakeref-jib-onnx` — jib passes (whisper-small, q8), used without bias, then normalized by `normalizeJib`.

`/judge/voix` is the lab: compare engines (Web Speech vs local Whisper base/small/large-v3-turbo vs the house models), then record (clip, confirmed label) pairs into IndexedDB and export them as an audiofolder `.zip`. The fine-tuning pipelines and model cards live in `training/tricks/` and `training/jib/` — see their READMEs before retraining. First local transcription downloads the model from the HF CDN; it is cached by the browser afterwards, and a pass on the small model takes ~8–15 s, which is why the competition Run tab queues transcription in the background instead of blocking the judge.

## Edge Functions (email)

Optional locally; deployed to Supabase. See also `README.md`.

```bash
npx supabase functions deploy notify-video-submission --project-ref <ref>
npx supabase functions deploy send-contact --project-ref <ref>
npx supabase secrets set RESEND_API_KEY=re_... NOTIFY_EMAIL=you@example.com --project-ref <ref>
```

Then create a **Database Webhook** (Dashboard → Database → Webhooks): table `video_submissions`, event `INSERT`, type *Supabase Edge Functions*, function `notify-video-submission`.

## Working conventions

- **Components:** one per file + co-located `*.module.css`. Reuse the global design system in `src/index.css` (CSS variables, `.btn-icon`, `.spinner`, theming via `[data-theme]`).
- **Icons:** add to the name map in `src/components/Icon.jsx`; don't import `@tabler/icons-react` directly elsewhere.
- **i18n:** every new UI string goes into both `fr` and `en` in `src/i18n/translations.js`. New DB text fields come as `field` (FR) + `field_en` (EN); read them with `useLocalizedField()`.
- **Data access:** always go through the singleton `src/lib/supabase.js`. There is no API layer — components query Supabase directly. Prefer the `figures_full` view for reads; prefer RPCs for anything that must not be a raw table query.
- **Schema changes:** apply in Supabase, then mirror into `scripts/wakeref_post_restore.sql` and `scripts/wakeref_schema.sql`; keep `src/data/categories.js` / `contexts.js` in sync. Update `CLAUDE.md` if architecture-level facts change.
- **Switch groups & takedowns:** when touching figures/videos, remember videos are shared across a switch group (`coalesce(switch_of, id)`) and that `takedown_requested = true` hides a video from all public reads.
- **Domain logic stays out of components.** Scoring (`lib/compoGrids.js`), diffing (`lib/judgeDiff.js`), the course/run models (`lib/competition/*`) and the voice pipeline (`lib/voiceMatch.js`, `normalizeJib.js`, `whisperStt.js`) are React-free modules. `compoGrids.js` in particular must stay React-free — it is imported by both `Compo` and `RunSaisie`, and a React import there would create a cycle.
- **Adding a scoring grid** = one entry in `GRIDS` (`lib/compoGrids.js`) + its translations. Scoring is **binary** (no degree thresholds) and normalized to **/20**, so grids stay comparable.
- **Slugs referenced by grids** live in `SCORING_SLUGS`. Slugs are editable in admin, so a rename silently breaks a scoring item — a dev-only guard warns when a referenced slug is missing from `figures`. Check the console after renaming anything.
- **Adding a jib trick to the voice composer** = a line in the `VOCAB` of `lib/normalizeJib.js` (sourced from `scripts/jib-atoms.md`), never a new regex. Verify with `node scripts/test-normalize-jib.mjs`.
- **Never precache the STT stack.** `@huggingface/transformers` must stay a dynamic import, and its chunk / `.wasm` / `ort-*` assets must stay in `workbox.globIgnores` — a regular visitor must never download tens of MB for a judge-only tool.
- **Approach axis is discipline-dependent**: `hs`/`ts` standing, `regular`/`fakie` seated. There is no DB CHECK — add any new value in both `admin/FigureForm.jsx` and `FigureDetail.jsx`.
- **Judging state is device-local.** Heats live in `localStorage['wakeref_heat_<code>']` and the voice dataset in IndexedDB; renaming a key discards a judge's work in progress.
