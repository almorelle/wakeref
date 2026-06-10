# Source Tree Analysis — WakeRef

> Generated: 2026-06-11 · Deep Scan · Repository type: **monolith** (single React SPA + Supabase backend-as-a-service)

```
wakeref/
├── index.html                  # Vite entry HTML (mounts #root, loads /src/main.jsx)
├── vite.config.js              # Vite + @vitejs/plugin-react + vite-plugin-pwa (manifest, autoUpdate SW)
├── vercel.json                 # SPA rewrite-to-index + cache & security headers
├── package.json                # Scripts: dev / build (sitemap+vite) / preview
├── .env.example                # VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
│
├── src/                        # ── Application source (the only build input besides public/) ──
│   ├── main.jsx                # ★ Entry: Router → ThemeProvider → LanguageProvider → App; Vercel Analytics inject()
│   ├── App.jsx                 # ★ Routing: PublicLayout vs AdminLayout, lazy() code-splitting
│   ├── index.css               # Global design system (CSS vars, theming via [data-theme])
│   │
│   ├── lib/                    # Data + utilities (no component imports)
│   │   ├── supabase.js         # ★ Singleton Supabase client (the only client instance)
│   │   ├── searchFigures.js    # Query expansion → parallel RPC → id-intersection → natural sort
│   │   ├── searchExpand.js     # Tokenizer + abbreviation map (tb3 → ts/bs/3, backroll → back roll)
│   │   └── url.js              # externalUrl() / creatorHandle() helpers
│   │
│   ├── contexts/               # React Context providers (app-wide state)
│   │   ├── LanguageContext.jsx # fr/en, localStorage, useLocalizedField()
│   │   └── ThemeContext.jsx    # dark/light, localStorage, data-theme + theme-color
│   │
│   ├── hooks/
│   │   ├── useAuth.js          # supabase.auth wrapper (session/loading/signIn/signOut)
│   │   └── useToast.js         # toast queue with auto-dismiss + optional action
│   │
│   ├── i18n/
│   │   ├── translations.js     # All UI strings { fr, en } (~430 lines)
│   │   └── useT.js             # hook → current-language map
│   │
│   ├── data/                   # Static reference data mirrored from DB
│   │   ├── categories.js       # 14 categories (+ icons/colors)
│   │   └── contexts.js         # 4 trick contexts
│   │
│   ├── components/             # Shared UI (each with co-located *.module.css)
│   │   ├── Navbar.jsx          # Public nav (desktop/mobile/bottom bar)
│   │   ├── Icon.jsx            # Central @tabler/icons-react name map
│   │   ├── FigureCard.jsx
│   │   ├── Badges.jsx · DifficultyDots.jsx
│   │   ├── LangSwitcher.jsx · SEO.jsx · Toast.jsx
│   │
│   └── pages/                  # Route components
│       ├── Home.jsx            # / (home_stats RPC, featured)
│       ├── Figures.jsx         # /figures (search + filter)
│       ├── FigureDetail.jsx    # /figures/:slug (videos, prereqs, takedown form)
│       ├── Quiz.jsx            # /quiz (lazy)
│       ├── Compo.jsx           # /compo, /compo/:id (lazy) — largest file (~800 LOC)
│       ├── Contact.jsx         # /contact (send-contact Edge Fn)
│       ├── SubmitVideo.jsx     # /submit (video_submissions insert)
│       ├── NotFound.jsx        # *
│       └── admin/              # ★ Admin area — lazy-loaded, code-split out of public bundle
│           ├── AdminLayout.jsx # Auth guard + sidebar/drawer nav
│           ├── Login.jsx
│           ├── AdminDashboard.jsx
│           ├── AdminFigures.jsx · FigureForm.jsx
│           ├── AdminVideos.jsx · AdminNoVideos.jsx
│           ├── AdminSubmissions.jsx · AdminTakedowns.jsx
│           └── AdminCompositions.jsx
│
├── scripts/                    # ── Build & DB tooling ──
│   ├── generate-sitemap.js     # Runs in `npm run build`: queries Supabase, writes public/sitemap.xml
│   ├── wakeref_post_restore.sql # ★ Executable: extensions, functions, view, RLS, grants, triggers, bucket
│   └── wakeref_schema.sql      # Reference dump (context only — NOT executed)
│
├── supabase/
│   └── functions/              # ── Deno Edge Functions (transactional email via Resend) ──
│       ├── send-contact/index.ts            # invoked from browser (Contact form)
│       └── notify-video-submission/index.ts # invoked by DB webhook on video_submissions INSERT
│
├── .github/workflows/
│   └── backup.yml              # Daily pg_dump → Supabase `backups` bucket (03:00 UTC, 30-day retention)
│
├── public/                     # Static assets served as-is
│   ├── favicon.svg · icon-192.png · icon-512.png · og-image.jpg · picto.svg
│   ├── robots.txt · sitemap.xml (generated) · wct-logo.png
│   └── fonts/
├── assets/                     # Logos (source assets)
├── dist/                       # Vite build output (deploy artifact) — generated, gitignored
└── node_modules/               # Dependencies — generated
```

★ = primary entry point / critical file.

## Critical directories

| Path | Role | Entry point? |
|------|------|--------------|
| `src/` | All application code | `src/main.jsx` → `src/App.jsx` |
| `src/lib/` | The **only** Supabase client + data-access helpers | `src/lib/supabase.js` |
| `src/pages/` | One component per route | mapped in `App.jsx` |
| `src/pages/admin/` | Auth-guarded admin, code-split | `AdminLayout.jsx` |
| `src/contexts/` | App-wide state (theme, language) | wired in `main.jsx` |
| `scripts/` | Sitemap generation + the executable DB setup file | `wakeref_post_restore.sql` |
| `supabase/functions/` | Server-side email endpoints | per-function `index.ts` |

## Data & control flow (high level)

```
Browser (React SPA on Vercel)
   │  @supabase/supabase-js (src/lib/supabase.js)
   ▼
Supabase
   ├─ PostgREST  ──►  figures_full view / tables   (authorized by RLS + grants)
   ├─ RPC        ──►  search_figures, home_stats, get_composition, figures_without_*
   ├─ Storage    ──►  `videos` bucket (public read; admin write)
   ├─ Auth       ──►  email/password (single admin)
   └─ Edge Fns   ──►  send-contact (browser) · notify-video-submission (DB webhook → Resend email)
```

There is **no intermediate API server**: the SPA is a static bundle, and all backend logic lives in Postgres (RLS, views, RPC, triggers) plus the two Edge Functions.
