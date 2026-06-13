# API Contracts — WakeRef

> Generated: 2026-06-11 · Updated: 2026-06-13

WakeRef has **no custom HTTP/REST API layer of its own**. The browser talks straight to Supabase:

1. **PostgREST** — auto-generated REST over the `public` schema, accessed through the `@supabase/supabase-js` client (`.from(...)`, `.rpc(...)`). What the client may do is governed entirely by **RLS policies + grants** (see `data-models.md`).
2. **Postgres RPC functions** — the explicit, hand-written contract for anything that shouldn't be a raw table query.
3. **Supabase Storage** — the public `videos` bucket.
4. **Supabase Edge Functions** (Deno) — two server-side HTTP endpoints for transactional email.

The singleton client lives at `src/lib/supabase.js` and is created from `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.

---

## 1. RPC functions (the explicit contract)

All are `SECURITY` as noted and granted to specific roles in `wakeref_post_restore.sql`.

| Function | Signature | Returns | Granted to | Used by |
|----------|-----------|---------|------------|---------|
| `search_figures(query text)` | text query | `setof figures_full` | `anon`, `authenticated` | `src/lib/searchFigures.js` |
| `home_stats()` | — | `(total_figures bigint, figures_with_video bigint)` | `anon`, `authenticated` | `Home.jsx`, `AdminDashboard.jsx` |
| `get_composition(cid text)` | run id | `table(name text, data jsonb)` | `anon`, `authenticated` | `Compo.jsx` |
| `figures_without_videos()` | — | `setof figures_full` | `authenticated` | `AdminNoVideos.jsx` |
| `figures_without_uploaded_videos()` | — | `setof figures_full` | `authenticated` | `AdminNoVideos.jsx` |
| `immutable_unaccent(text)` | — | `text` | `anon`, `authenticated` | internal (index + search) |

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

---

## 2. PostgREST table access (per role)

Reads go through the `figures_full` view for display; raw tables are used for admin writes and narrow lookups. The view now also exposes the built-on tree (`built_on_figure`, `built_on_children`, `base_figure`) and the trick-decomposition columns (`spin`, `inverts`, `rewind_degs`, `rotation_type`) consumed by `FigureDetail` (breakdown + tree) and `FigureForm` (rotation builder) — see `data-models.md`. Effective access (RLS + grants):

| Table / View | `anon` | `authenticated` (admin) |
|--------------|--------|--------------------------|
| `figures_full` (view) | SELECT | SELECT |
| `figures` | SELECT (`published`) | SELECT, INSERT, UPDATE, DELETE |
| `categories` | SELECT | full |
| `prerequisites` | SELECT | full |
| `videos` | SELECT (non-takedown) | full |
| `video_submissions` | INSERT | SELECT, UPDATE |
| `takedown_requests` | INSERT | SELECT |
| `compositions` | INSERT | SELECT, DELETE |

Page → data-access map (from the source scan):

| Page | Tables / RPC / Storage |
|------|------------------------|
| `Home` | `figures_full`, `videos`, rpc `home_stats` |
| `Figures` | `figures_full` (+ `search_figures` via lib) |
| `FigureDetail` | `figures_full`, `videos`, `takedown_requests` (insert), Storage `getPublicUrl` |
| `Quiz` | `figures_full`, `videos`, Storage `getPublicUrl` |
| `Compo` | `compositions` (insert), rpc `get_composition` |
| `Contact` | Edge Function `send-contact` |
| `SubmitVideo` | `figures`, `video_submissions` (insert) |
| `admin/AdminDashboard` | `figures`, `videos`, `video_submissions`, `takedown_requests`, `compositions`, rpc `home_stats`, Storage `list` |
| `admin/AdminFigures` | `figures`, `figures_full`, `categories` |
| `admin/FigureForm` | `figures`, `figures_full`, `categories`, `prerequisites` |
| `admin/AdminVideos` | `figures`, `videos`, Storage `upload`/`remove` |
| `admin/AdminNoVideos` | `videos`, rpc `figures_without_videos`, rpc `figures_without_uploaded_videos`, Storage `list` |
| `admin/AdminSubmissions` | `video_submissions` |
| `admin/AdminTakedowns` | `takedown_requests`, `videos` |
| `admin/AdminCompositions` | `compositions` |

---

## 3. Storage — `videos` bucket (public)

Accessed via `supabase.storage.from('videos')`:
- `getPublicUrl(file_path)` — public playback URL (`FigureDetail`, `Quiz`).
- Thumbnails by convention: `thumbnails/<shortcode>.jpg`; `list('thumbnails', …)` is used by admin pages to detect which figures already have a thumbnail.
- `upload(path, file, …)` / `remove([file_path])` — admin only (RLS restricts INSERT/DELETE to `authenticated`).

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

## Auth

Email/password, admin-only, via Supabase Auth (`supabase.auth.signInWithPassword`). There is no public sign-up flow in the app — the single admin account is created manually in the Supabase dashboard. Session handling is in `src/hooks/useAuth.js`; route guarding in `src/pages/admin/AdminLayout.jsx`. All admin-level data access is authorized server-side by the `authenticated`-role RLS policies above — the client guard is UX only.
