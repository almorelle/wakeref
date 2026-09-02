# Source Tree Analysis — WakeRef

> Generated: 2026-06-11 · Updated: 2026-09-02 (full rescan) · Repository type: **monolith** (single React SPA + Supabase backend-as-a-service)

```
wakeref/
├── index.html                  # Vite entry HTML (mounts #root, loads /src/main.jsx)
├── vite.config.js              # Vite 8 (rolldown) + plugin-react + vite-plugin-pwa; vendor chunks; STT excluded from precache
├── eslint.config.js            # ESLint 9 flat config: src/ (browser+React), scripts/ + *.config.js (Node)
├── vercel.json                 # SPA rewrite-to-index + cache & security headers
├── package.json                # Scripts: dev / build (sitemap+vite) / preview / lint
├── .env.example                # VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
│
├── src/                        # ── Application source (the only build input besides public/) ──
│   ├── main.jsx                # ★ Entry: Router → ThemeProvider → LanguageProvider → App; PWA register; Vercel Analytics
│   ├── App.jsx                 # ★ Routing: PublicLayout / AdminLayout / chromeless judging routes, lazy() everywhere but /
│   ├── index.css               # Global design system (CSS vars, theming via [data-theme])
│   │
│   ├── lib/                    # Data + domain logic (React-free unless noted)
│   │   ├── supabase.js         # ★ Singleton Supabase client (the only client instance)
│   │   ├── searchFigures.js    # Query expansion → parallel RPC → id-intersection → natural sort
│   │   ├── searchExpand.js     # Tokenizer + abbreviation map (tb3 → ts/bs/3, backroll → back roll)
│   │   ├── trickDecomposition.js # Breaks a trick into rotation units (spin/rewinds/ole/handle-pass)
│   │   ├── compoGrids.js       # ★ Scoring engine: SCORING_SLUGS, jib helpers, 4 GRIDS, computeScore → /20
│   │   ├── judgeDiff.js        # LCS alignment by element type + binary correct/wrong verdict
│   │   ├── voiceMatch.js       # Dictation → figure matcher (alias index, phonetic normalization), 100% local
│   │   ├── normalizeJib.js     # Vocabulary-driven jib composer (rotations → atoms → adjacency assembly)
│   │   ├── whisperStt.js       # Whisper registry (incl. 2 house fine-tunes), bias prompt, transcribe, audio→16k
│   │   ├── voiceDataset.js     # IndexedDB sample store + .zip audiofolder export (fine-tuning corpus)
│   │   ├── url.js              # externalUrl() / creatorHandle() helpers
│   │   └── competition/        # ── Competition module domain ──
│   │       ├── api.js          # `parcours` CRUD wrapper: short-code, 23505 retry, DuplicateNameError, duplicate
│   │       ├── model.js        # Course model: zones + pulleys, 2nd-pass twins, renumbering (pure/immutable)
│   │       ├── runModel.js     # Run rows, riders, run-2 drafts, /100 scoring (DNS / FRS)
│   │       ├── heatStore.js    # heatReducer + useHeatStore: heat state, cursors, localStorage autosave per code
│   │       └── voice.js        # Non-blocking dictation queue wiring the 2 house models into the Run tab
│   │
│   ├── contexts/               # React Context providers (app-wide state)
│   │   ├── LanguageContext.jsx # Provider only  ·  language-context.js  → useLanguage / useLocalizedField
│   │   └── ThemeContext.jsx    # Provider only  ·  theme-context.js     → useTheme
│   │                           #   (hooks live in the .js files so the .jsx stay fast-refresh clean)
│   ├── hooks/
│   │   ├── useAuth.js          # supabase.auth wrapper (session/loading/signIn/signOut)
│   │   ├── useToast.js         # toast queue with auto-dismiss + optional action
│   │   └── useScrollDrive.js   # scroll-driven animation driver (home hero)
│   │
│   ├── i18n/
│   │   ├── translations.js     # All UI strings { fr, en } (~660 lines)
│   │   └── useT.js             # hook → current-language map
│   │
│   ├── data/                   # Static reference data mirrored from DB
│   │   ├── categories.js       # 14 categories (+ icons/colors)
│   │   ├── contexts.js         # 4 trick contexts (kicker, feature, flat, air_trick)
│   │   └── heroClips.js        # Home hero video clips
│   │
│   ├── components/             # Shared UI (each with co-located *.module.css)
│   │   ├── Navbar.jsx          # Public nav (desktop/mobile/bottom bar)
│   │   ├── Footer.jsx          # Site footer — the only entry point to the legal pages
│   │   ├── RunSaisie.jsx       # ★ Shared run-capture UI (Compo + /judge), grid-driven add modes
│   │   ├── Icon.jsx            # Central @tabler/icons-react name map
│   │   ├── FigureCard.jsx · FilterDropdown.jsx · Badges.jsx · DifficultyDots.jsx
│   │   ├── LangSwitcher.jsx · SEO.jsx · Toast.jsx · ScrollToTop.jsx
│   │   └── competition/
│   │       └── CableMinimap.jsx # Course minimap (pulleys / zones / current position)
│   │
│   └── pages/                  # Route components
│       ├── Home.jsx            # / (home_stats, most_viewed_figures, recent_video_figures, hero clips)
│       ├── Figures.jsx         # /figures (search + filter, figures_card)
│       ├── FigureDetail.jsx    # /figures/:slug (videos, prereqs, takedown form, breakdown, built-on tree, view tracking)
│       ├── Quiz.jsx            # /quiz
│       ├── Compo.jsx           # /compo, /compo/:id — page shell: state, persistence, share; scoring is in lib/compoGrids
│       ├── CompositionSimple.jsx # /compo-old (legacy simple composition)
│       ├── France2026.jsx      # /composition-simple — chromeless France 2026 scoring sheet (self-contained grids)
│       ├── JudgeTraining.jsx   # /judge — judge a reference run from video, then diff against the solution
│       ├── JudgeVoice.jsx      # /judge/voix — voice lab: STT engines, matcher, jib composer, dataset recorder (FR-only)
│       ├── Contact.jsx         # /contact (send-contact Edge Fn)
│       ├── SubmitVideo.jsx     # /submit (video_submissions insert)
│       ├── Legal.jsx           # /legal · /terms · /privacy (3 named exports from one module)
│       ├── NotFound.jsx        # *
│       ├── competition/        # ── Chromeless judge app ──
│       │   ├── CompetitionView.jsx # /competition, /competition/:code — loads a course by code, hosts the 2 tabs
│       │   ├── HeatTab.jsx     # Riders, run count, order, scores (/100), ranking
│       │   └── RunTab.jsx      # Zone-by-zone capture with push-to-talk dictation
│       └── admin/              # ★ Admin area — lazy-loaded, code-split out of public bundle
│           ├── AdminLayout.jsx # Auth guard + sidebar/drawer nav
│           ├── Login.jsx · AdminDashboard.jsx
│           ├── AdminFigures.jsx · FigureForm.jsx        # figures CRUD (+ duplicate, rotation builder)
│           ├── AdminVideos.jsx · AdminNoVideos.jsx      # video CRUD/upload, coverage gaps
│           ├── AdminSubmissions.jsx · AdminTakedowns.jsx
│           ├── AdminCompositions.jsx                    # saved runs (list/delete)
│           ├── AdminJudgeRuns.jsx · JudgeRunForm.jsx    # reference runs + solutions for /judge
│           └── AdminCompetitions.jsx · CompetitionSetup.jsx # courses: build, name, share code, duplicate
│
├── scripts/                    # ── Build & DB tooling ──
│   ├── generate-sitemap.js     # Runs in `npm run build`: best-effort Supabase query → public/sitemap.xml (never fails the build)
│   ├── wakeref_post_restore.sql # ★ Executable: extensions, functions, views, RLS, grants, triggers, bucket
│   ├── wakeref_schema.sql      # Reference dump of the 10 tables (context only — NOT executed)
│   ├── competition_parcours.sql # `parcours` table + get_parcours RPC + policies (competition module)
│   ├── migrations/             # One-off SQL applied by hand in the Supabase editor
│   ├── jib-atoms.md            # ★ Source vocabulary for normalizeJib (atoms + variants)
│   ├── gen-aliases.mjs         # Generates spoken aliases for figures (voice matching)
│   ├── test-normalize-jib.mjs  # Manual harness for the jib composer
│   └── download-videos.mjs     # Bulk video export helper
│
├── training/                   # ── Fine-tuning pipelines for the 2 house Whisper models ──
│   ├── tricks/                 # whisper-wakeref (isolated tricks) — README + HF model card
│   └── jib/                    # whisper-wakeref-jib (jib passes) — README + HF model card
│
├── proto-assets/               # Frozen prototypes & handoff docs (competition module, voice, design exploration)
├── _bmad/ · _bmad-output/      # BMAD skills config + planning/implementation artifacts (specs, reviews, backlog)
│
├── supabase/
│   └── functions/              # ── Deno Edge Functions (transactional email via Resend) ──
│       ├── send-contact/index.ts            # invoked from browser (Contact form)
│       └── notify-video-submission/index.ts # invoked by DB webhook on video_submissions INSERT
│
├── .github/workflows/
│   └── backup.yml              # Daily pg_dump → Supabase `backups` bucket (03:00 UTC)
│
├── public/                     # Static assets served as-is
│   ├── favicon.svg · icon-192.png · icon-512.png · og-image.jpg · picto.svg
│   ├── robots.txt · sitemap.xml (generated) · wct-logo.png
│   └── fonts/
├── assets/                     # Logos (source assets)
├── videos-export/              # Local video export output — generated, not deployed
├── dist/                       # Vite build output (deploy artifact) — generated, gitignored
└── node_modules/               # Dependencies — generated
```

★ = primary entry point / critical file.

## Critical directories

| Path | Role | Entry point? |
|------|------|--------------|
| `src/` | All application code | `src/main.jsx` → `src/App.jsx` |
| `src/lib/` | The **only** Supabase client + all domain engines | `src/lib/supabase.js` |
| `src/lib/competition/` | Competition module domain (course, run, heat, voice) | `heatStore.js` (state), `api.js` (I/O) |
| `src/pages/` | One component per route | mapped in `App.jsx` |
| `src/pages/competition/` | Chromeless judge app | `CompetitionView.jsx` |
| `src/pages/admin/` | Auth-guarded admin, code-split | `AdminLayout.jsx` |
| `src/contexts/` | App-wide state (theme, language) | wired in `main.jsx` |
| `scripts/` | Sitemap generation + the executable DB setup file + voice tooling | `wakeref_post_restore.sql` |
| `supabase/functions/` | Server-side email endpoints | per-function `index.ts` |
| `training/` | Model fine-tuning pipelines (not shipped) | per-model `README.md` |

## Data & control flow (high level)

```
Browser (React SPA on Vercel)
   │  @supabase/supabase-js (src/lib/supabase.js)
   ▼
Supabase
   ├─ PostgREST  ──►  figures_full / figures_card / tables   (authorized by RLS + grants)
   ├─ RPC        ──►  search_figures · home_stats · most_viewed_figures · recent_video_figures
   │                  track_figure_view · get_composition · get_parcours
   │                  list_judge_runs · get_judge_run_solution · figures_without_*
   ├─ Storage    ──►  `videos` bucket (public read; admin write; thumbnails/, judge-run videos)
   ├─ Auth       ──►  email/password (single admin)
   └─ Edge Fns   ──►  send-contact (browser) · notify-video-submission (DB webhook → Resend email)

Device-local (never leaves the browser)
   ├─ localStorage  ──►  wakeref_lang · theme · wakeref_compo · wakeref_france2026
   │                     wakeref_voice_figures (offline figure catalogue) · heat state per course code
   ├─ IndexedDB     ──►  wakeref_voice_dataset (audio clips + labels, exported as .zip on demand)
   └─ HF CDN        ──►  Whisper ONNX weights, fetched at runtime on first use only
```

There is **no intermediate API server**: the SPA is a static bundle, and all backend logic lives in Postgres (RLS, views, RPC, triggers) plus the two Edge Functions. The judging tools add a second, purely client-side tier — a course is fetched once by code, everything after that is local.
