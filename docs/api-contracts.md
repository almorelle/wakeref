# API Contracts — WakeRef

> Generated: 2026-06-11 · Updated: 2026-09-02 (full rescan)

WakeRef has **no custom HTTP/REST API layer of its own**. The browser talks straight to Supabase:

1. **PostgREST** — auto-generated REST over the `public` schema, accessed through the `@supabase/supabase-js` client (`.from(...)`, `.rpc(...)`). What the client may do is governed entirely by **RLS policies + grants** (see `data-models.md`).
2. **Postgres RPC functions** — the explicit, hand-written contract for anything that shouldn't be a raw table query.
3. **Supabase Storage** — the public `videos` bucket.
4. **Supabase Edge Functions** (Deno) — two server-side HTTP endpoints for transactional email.

The singleton client lives at `src/lib/supabase.js` and is created from `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.

---

## 1. RPC functions (the explicit contract)

All are `SECURITY` as noted and granted to specific roles in `wakeref_post_restore.sql`.

| Function | Signature | Returns | Security | Granted to | Used by |
|----------|-----------|---------|----------|------------|---------|
| `search_figures(query text)` | text query | `setof figures_full` | invoker | `anon`, `authenticated` | `src/lib/searchFigures.js` |
| `home_stats()` | — | `(total_figures bigint, figures_with_video bigint)` | invoker | `anon`, `authenticated` | `Home.jsx`, `AdminDashboard.jsx` |
| `most_viewed_figures(days int = 30, lim int = 5)` | rolling window | `setof figures_card` | **definer** | `anon`, `authenticated` | `Home.jsx` |
| `recent_video_figures(lim int = 5)` | — | `setof figures_card` | invoker | `anon`, `authenticated` | `Home.jsx` |
| `track_figure_view(fig_id int)` | figure id | `void` | **definer** | `anon`, `authenticated` | `FigureDetail.jsx` |
| `get_composition(cid text)` | run id | `table(name, data jsonb)` | **definer** | `anon`, `authenticated` | `Compo.jsx` |
| `get_parcours(code text)` | course short code | `table(id, name, data jsonb)` | **definer** | `anon`, `authenticated` | `lib/competition/api.js` |
| `list_judge_runs(p_discipline text = null, p_difficulty text = null)` | optional filters | `table(id, name, discipline, grid_key, difficulty, category, source_type, video_path, video_url)` — **no `solution`** | **definer** | `anon`, `authenticated` | `JudgeTraining.jsx` |
| `get_judge_run_solution(p_id bigint)` | run id | `table(grid_key text, solution jsonb)` | **definer** | `anon`, `authenticated` | `JudgeTraining.jsx` |
| `figures_without_videos()` | — | `setof figures_full` | invoker | `authenticated` | `AdminNoVideos.jsx`, `AdminDashboard.jsx` |
| `figures_without_uploaded_videos()` | — | `setof figures_full` | invoker | `authenticated` | `AdminNoVideos.jsx`, `AdminDashboard.jsx` |
| `immutable_unaccent(text)` | — | `text` | immutable | `anon`, `authenticated` | internal (index + search) |

Every `security definer` function pins `set search_path = public` (search-path hijacking guard). The definer functions exist for one reason: they are the **only** public read path into tables that grant `anon` nothing — `compositions`, `parcours`, `judge_runs`, `figure_views`.

### `search_figures(query)`
French full-text + "compact" substring matching. Implementation details:
- Builds two normalized forms of the query: `raw` (lowercased, unaccented) and `compact` (additionally stripped of all non-`[a-z0-9]`).
- Matches a figure if either the `tsvector` over `name + description` matches `plainto_tsquery('french', raw)`, **or** the compacted figure name contains the compacted query (progressive/typed-together matching: `backr` → "Back Roll", `frontflip` → "Front Flip").
- Ranks: exact name (0) → name prefix (1) → name substring (2) → description-only full-text (3), tie-broken by `ts_rank` then name.

**Client-side expansion** (`src/lib/searchExpand.js` + `searchFigures.js`): before calling the RPC, the raw user query is tokenized and expanded (e.g. `tb3` → `["ts","bs","3"]`, `toeside` → `ts`, `backroll` → `back roll`). One RPC call is issued **per term in parallel**, and the result sets are **intersected by figure id**, then naturally sorted (numeric-aware so `180 < 360 < 1080`).

### `get_composition(cid)`
`security definer` so anonymous visitors can load a single saved run by id without a table-wide SELECT grant on `compositions`.

### `home_stats()` / `figures_without_*()`
Switch-group aware: a figure counts as "having a video" if any figure in its switch group (`coalesce(switch_of, id)`) has a non-takedown video. The two `figures_without_*` admin functions differ only in whether they require an `upload`-type video specifically.

### `get_parcours(code)`
Twin of `get_composition`: a judge loads a shared competition course by its 8-char short code without any table-wide grant. Everything after this single read is device-local — see `architecture.md`.

### `list_judge_runs()` / `get_judge_run_solution(id)`
Deliberately split in two. The listing returns published runs **without their `solution`**, so the trainee can pick and judge a run; the solution is fetched only on "Évaluer". This is a *soft* no-peek — the RPC is callable early by anyone who wants to — but the solution is never embedded in a listing or in the page payload.

### `track_figure_view(fig_id)` / `most_viewed_figures(days, lim)`
`track_figure_view` upserts a `(figure_id, day)` counter and silently ignores unknown ids (`where exists`). It is fire-and-forget on the client (`.then(() => {}, () => {})`) so a failed write never disturbs the page. `most_viewed_figures` joins the rolling window onto `figures_card` and returns display-ready rows — the home page needs no second round-trip to rehydrate ids. Same for `recent_video_figures`.

---

## 2. PostgREST table access (per role)

Reads go through the `figures_full` view for display; raw tables are used for admin writes and narrow lookups. The view now also exposes the built-on tree (`built_on_figure`, `built_on_children`, `base_figure`) and the trick-decomposition columns (`spin`, `inverts`, `rewind_degs`, `rotation_type`) consumed by `FigureDetail` (breakdown + tree) and `FigureForm` (rotation builder) — see `data-models.md`. Effective access (RLS + grants):

| Table / View | `anon` | `authenticated` (admin) |
|--------------|--------|--------------------------|
| `figures_full` (view) | SELECT | SELECT |
| `figures_card` (view) | SELECT | SELECT |
| `figures` | SELECT (`published`) | SELECT, INSERT, UPDATE, DELETE |
| `categories` | SELECT | full |
| `prerequisites` | SELECT | full |
| `videos` | SELECT (non-takedown) | full |
| `video_submissions` | INSERT | SELECT, UPDATE |
| `takedown_requests` | INSERT | SELECT |
| `compositions` | INSERT | SELECT, DELETE |
| `figure_views` | — (RPC only) | SELECT |
| `judge_runs` | — (RPC only) | full |
| `parcours` | — (RPC only) | SELECT, INSERT, UPDATE, DELETE |

Page → data-access map (from the source scan):

| Page | Tables / RPC / Storage |
|------|------------------------|
| `Home` | `figures_card`, `videos`, rpc `home_stats`, `most_viewed_figures`, `recent_video_figures`, Storage `getPublicUrl` |
| `Figures` | `figures_card` (+ `search_figures` via lib) |
| `FigureDetail` | `figures_full`, `videos`, `takedown_requests` (insert), rpc `track_figure_view`, Storage `getPublicUrl` |
| `Quiz` | `figures_full`, `videos`, Storage `getPublicUrl` |
| `Compo` | `figures` (slug-drift guard, dev), `compositions` (insert), rpc `get_composition`; search via lib |
| `CompositionSimple` (`/compo-old`) | none — fully local |
| `France2026` (`/composition-simple`) | none — fully local (`localStorage`) |
| `JudgeTraining` (`/judge`) | rpc `list_judge_runs`, `get_judge_run_solution`, Storage `getPublicUrl` |
| `JudgeVoice` (`/judge/voix`) | `figures_card` (cached in `localStorage`); models from the HF CDN; dataset in IndexedDB |
| `competition/CompetitionView` | rpc `get_parcours` (once, by code) — everything else is local |
| `Contact` | Edge Function `send-contact` |
| `SubmitVideo` | `figures`, `video_submissions` (insert) |
| `Legal` (`/legal`, `/terms`, `/privacy`) | none — static |
| `admin/AdminDashboard` | `figures`, `videos`, `video_submissions`, `takedown_requests`, `compositions`, rpc `home_stats`, `figures_without_*`, Storage `list` |
| `admin/AdminFigures` | `figures`, `figures_full`, `categories` |
| `admin/FigureForm` | `figures`, `figures_full`, `categories`, `prerequisites` |
| `admin/AdminVideos` | `figures`, `videos`, Storage `upload`/`remove` |
| `admin/AdminNoVideos` | `videos`, rpc `figures_without_videos`, rpc `figures_without_uploaded_videos`, Storage `list` |
| `admin/AdminSubmissions` | `video_submissions` |
| `admin/AdminTakedowns` | `takedown_requests`, `videos` |
| `admin/AdminCompositions` | `compositions` |
| `admin/AdminJudgeRuns` · `JudgeRunForm` | `judge_runs`, Storage `upload`/`remove` |
| `admin/AdminCompetitions` · `CompetitionSetup` | `parcours` (via `lib/competition/api.js`) |

---

## 3. Storage — `videos` bucket (public)

Accessed via `supabase.storage.from('videos')`:
- `getPublicUrl(file_path)` — public playback URL (`FigureDetail`, `Quiz`).
- Thumbnails by convention: `thumbnails/<shortcode>.jpg`; `list('thumbnails', …)` is used by admin pages to detect which figures already have a thumbnail.
- `upload(path, file, …)` / `remove([file_path])` — admin only (RLS restricts INSERT/DELETE to `authenticated`).

Judge-run videos are stored in the same bucket (`judge_runs.video_path`), uploaded and removed from `admin/JudgeRunForm.jsx`.

There is also a `backups` bucket written by the daily backup GitHub Action (not used by the app).

---

## 4. Edge Functions (Deno · transactional email via Resend)

Source under `supabase/functions/`. Both read secrets `RESEND_API_KEY` and `NOTIFY_EMAIL`.

### `send-contact`
- **Invoked from the browser** via `supabase.functions.invoke('send-contact', { body: form })` (`Contact.jsx`).
- Handles CORS preflight (`OPTIONS`). Validates that `email` and `message` are present (400 otherwise).
- Sends an email from `contact@wakeref.app` to `NOTIFY_EMAIL` with `reply_to` set to the sender.
- Response: `{ ok: boolean }`, status 200/500.

### `notify-video-submission`
- **Invoked by a database webhook**, not the browser: configured on `video_submissions` INSERT (Supabase Dashboard → Database → Webhooks).
- Reads `payload.record`, emails a formatted submission summary from `notifications@wakeref.app` to `NOTIFY_EMAIL`.
- Response: `{ ok: boolean }`, status 200/500.

Deploy: `npx supabase functions deploy <name> --project-ref <ref>`; secrets via `npx supabase secrets set …` (see `development-guide.md` / `README.md`).

---

## 5. Device-local contracts (no server involved)

The judging tools and several preferences are local-first. These keys are as much a contract as the SQL ones — renaming one silently drops a judge's in-progress heat or a visitor's saved run.

| Store | Key | Written by | Holds |
|-------|-----|------------|-------|
| localStorage | `wakeref_lang` | `LanguageContext` | `fr` \| `en` |
| localStorage | `wakeref_theme` | `ThemeContext` | `dark` \| `light` |
| localStorage | `wakeref_facet` | `FigureDetail` | last-selected discipline facet for tips |
| localStorage | `wakeref_compo` | `Compo` | current run draft (entries, jib passes, off-course entries, `gridKey`) |
| localStorage | `wakeref_composition_simple` | `CompositionSimple` | legacy simple-composition draft |
| localStorage | `wakeref_france2026` | `France2026` | France 2026 sheet state, keyed `s{section}i{item}` |
| localStorage | `wakeref_voice_figures` | `JudgeVoice`, `competition/voice.js` | cached `figures_card` catalogue so the matcher works offline |
| localStorage | `wakeref_heat_<code>` | `heatStore` | **the whole heat**: riders, runs, scores, cursors — autosaved per course code |
| IndexedDB | `wakeref_voice_dataset` / `samples` | `voiceDataset.js` | (audio blob, label) training pairs; leaves the device only via explicit `.zip` export |

External runtime dependency: the Whisper weights are fetched from the **Hugging Face CDN** on first use of local STT (`almorelle/whisper-wakeref-onnx`, `almorelle/whisper-wakeref-jib-onnx`, plus the stock `onnx-community/whisper-*` models offered for comparison). They are never bundled and never precached by the service worker.

---

## Auth

Email/password, admin-only, via Supabase Auth (`supabase.auth.signInWithPassword`). There is no public sign-up flow in the app — the single admin account is created manually in the Supabase dashboard. Session handling is in `src/hooks/useAuth.js`; route guarding in `src/pages/admin/AdminLayout.jsx`. All admin-level data access is authorized server-side by the `authenticated`-role RLS policies above — the client guard is UX only.
