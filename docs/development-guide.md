# Development Guide — WakeRef

> Generated: 2026-06-11 · Deep Scan

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

**From scratch:** in the Supabase **SQL Editor**, run `scripts/wakeref_post_restore.sql`. It creates extensions, functions, the `figures_full` view, RLS policies, grants, triggers, indexes, and the `videos` Storage bucket. Then create the admin user manually (step 4).

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

There is **no test runner and no linter configured** in `package.json`. "Verification" today means running the app and exercising flows manually.

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

## Known doc drift

`README.md` and `CLAUDE.md` say "React 18 + React Router 6". `package.json` actually pins **React 19.2** and **react-router-dom 7.15**. Trust `package.json`.
