# Deployment Guide — WakeRef

> Generated: 2026-06-11 · Updated: 2026-09-02 (full rescan) · Deep Scan

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
- **Security headers** on all routes: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`, `Strict-Transport-Security` (HSTS, 2 yr, preload), `Permissions-Policy: camera=(), microphone=(self), geolocation=()`.

> **Why `microphone=(self)` and not `microphone=()`.** An empty allowlist means "no origin, **including `self`**" — it vetoes the feature for the site itself, not just for third-party frames. Until 2026-09-02 this header shipped as `microphone=()`, which blocked `navigator.mediaDevices.getUserMedia({ audio: true })` in production on both voice surfaces — `/judge/voix` (push-to-talk + dataset recording) and the competition **Run tab** dictation (`src/lib/competition/voice.js`) — while everything worked in `npm run dev`, where `vercel.json` is not applied. `(self)` grants nothing by itself: the browser still asks the user for permission. Keep `camera` and `geolocation` closed — nothing in the app uses them.

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

Configured via `vite-plugin-pwa` in `vite.config.js`: `registerType: 'autoUpdate'`, Workbox `skipWaiting` + `clientsClaim`, `injectRegister: null` (the SW is registered by hand in `main.jsx` through `virtual:pwa-register`). Manifest declares name/colors/icons and `display: standalone` (installable on mobile). The cache headers above ensure the SW and manifest are revalidated on each load so updates roll out quickly.

**Precache exclusions matter here.** `workbox.globIgnores` deliberately drops the `transformers-*` chunk, every `.wasm`, `ort-*` and `jszip*` from the precache manifest, and the Whisper weights are fetched from the **Hugging Face CDN at runtime** rather than shipped in `dist/`. Consequences to keep in mind when operating the site:

- a regular visitor never downloads the (tens of MB) speech stack;
- the voice tools therefore need **network access to `huggingface.co` / `cdn-lfs*.hf.co` on first use** — they are not usable fully offline until the browser has cached a model;
- if a Content-Security-Policy is ever added to `vercel.json`, it must allow those hosts plus `wasm-unsafe-eval`, or local STT breaks.

Vendor chunking (`build.rolldownOptions.advancedChunks`, Vite 8 / rolldown — *not* `rollupOptions`) isolates `react`, `supabase` and `transformers` so the speech chunk stays out of the critical path.

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
- **Judging data is not on the server.** A heat scored at `/competition/:code` lives only in that browser's `localStorage` (`wakeref_heat_<code>`), and the voice training corpus only in IndexedDB. Clearing site data on a judge's device loses the scoring; only the course itself (`parcours` table) can be recovered. There is no multi-judge sync and nothing to back up server-side for these features.
- **Deploy checklist for the judging tools:** `Permissions-Policy` must keep `microphone=(self)` (see above), HF CDN reachability, and `https` (getUserMedia requires a secure context — fine on Vercel).
