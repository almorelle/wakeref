# Deployment Guide — WakeRef

> Generated: 2026-06-11 · Deep Scan

WakeRef deploys as a **static SPA on Vercel**, backed by a **Supabase** project (PostgreSQL + Auth + Storage + Edge Functions). There is no server to operate — the only build artifact is `dist/`.

## Topology

```
Vercel (static hosting + CDN)        Supabase (managed)
└─ dist/ (Vite build)                ├─ PostgreSQL (RLS, figures_full view, RPCs, triggers)
   served at https://wakeref.app     ├─ Auth (single admin)
                                     ├─ Storage: `videos` (public), `backups` (private)
                                     └─ Edge Functions: send-contact, notify-video-submission
GitHub Actions ─ daily pg_dump ─────────────────────► Supabase `backups` bucket
```

## Vercel configuration (`vercel.json`)

- **SPA routing:** `rewrites` send `/(.*)` → `/index.html` so client-side React Router handles every path (deep links like `/figures/<slug>` work on refresh).
- **Caching:**
  - `/assets/(.*)` → `Cache-Control: public, max-age=31536000, immutable` (hashed Vite assets).
  - `sw.js`, `registerSW.js`, `manifest.webmanifest` → `max-age=0, must-revalidate` (so the PWA service worker updates promptly).
- **Security headers** on all routes: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`, `Strict-Transport-Security` (HSTS, 2 yr, preload), `Permissions-Policy: camera=(), microphone=(), geolocation=()`.

## Build settings

- **Build command:** `npm run build` → runs `scripts/generate-sitemap.js` (best-effort Supabase query for slugs/categories, writes `public/sitemap.xml`) then `vite build`.
- **Output directory:** `dist/`.
- **Required env vars** (set in Vercel Project Settings → Environment Variables — baked into the client bundle at build time via `import.meta.env`):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

> The sitemap step queries Supabase during the build but is **best-effort**: if the project is unreachable or the env vars are missing, it logs a warning and the build still succeeds (keeping the previous `public/sitemap.xml`, or writing a static-only one if none exists). The `VITE_SUPABASE_*` vars are still baked into the client bundle, so they remain required for the deployed app to work.

## First-time deploy

```bash
npm i -g vercel
vercel            # link & deploy preview
vercel --prod     # promote to production
```

Then add the two env vars in the Vercel dashboard (Production + Preview).

## PWA / Service Worker

Configured via `vite-plugin-pwa` in `vite.config.js`: `registerType: 'autoUpdate'`, Workbox `skipWaiting` + `clientsClaim`. Manifest declares name/colors/icons and `display: standalone` (installable on mobile). The cache headers above ensure the SW and manifest are revalidated on each load so updates roll out quickly.

## Supabase deployment pieces

1. **Schema:** run `scripts/wakeref_post_restore.sql` in the SQL Editor (idempotent: drops+recreates policies/triggers/view; `create … if not exists` for the rest).
2. **Admin user:** create manually in Authentication → Users.
3. **Edge Functions + secrets:**
   ```bash
   npx supabase functions deploy send-contact --project-ref <ref>
   npx supabase functions deploy notify-video-submission --project-ref <ref>
   npx supabase secrets set RESEND_API_KEY=re_... NOTIFY_EMAIL=you@example.com --project-ref <ref>
   ```
4. **Webhook:** Database → Webhooks → on `video_submissions` INSERT → call `notify-video-submission`.
5. **Email sender domains** (`wakeref.app`) must be verified in Resend for `contact@` / `notifications@`.

## Backups & disaster recovery

`.github/workflows/backup.yml` (GitHub Actions):
- Runs daily at **03:00 UTC** (`cron: '0 3 * * *'`) + manual `workflow_dispatch`.
- `pg_dump` (PostgreSQL 17 client, `--no-owner --no-acl --format=plain`), gzips, uploads to the Supabase `backups` Storage bucket via the Storage REST API.
- Prunes backups older than 30 days.
- **Required GitHub secrets:** `SUPABASE_DB_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`.

**Restore:** download a dump from the `backups` bucket, then:
```bash
psql "$SUPABASE_DB_URL" < backup_YYYY-MM-DD.sql
psql "$SUPABASE_DB_URL" < scripts/wakeref_post_restore.sql
```

## Observability

- `@vercel/analytics` — `inject()` called in `src/main.jsx`.
- `@vercel/speed-insights` — `<SpeedInsights />` mounted in `App.jsx`.

## Operational notes

- The project targets the Supabase **free plan** — avoid paid-only features (e.g. Storage image transforms).
- Custom domain: `wakeref.app` (referenced throughout SEO, sitemap, and Edge Functions).
