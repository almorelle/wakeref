# Component & Page Inventory — WakeRef

> Generated: 2026-06-11 · Updated: 2026-09-02 (full rescan)

WakeRef is a React 19 SPA. UI is plain React function components with **CSS Modules** (`*.module.css`) per component/page, plus one global design system in `src/index.css` (CSS custom properties, theming via `data-theme` attribute). No UI component library, no Tailwind. Icons come from `@tabler/icons-react`, wrapped by a single `Icon` component.

## State management

No Redux/Zustand. State is React-local plus two React Contexts, and one `useReducer` store for the competition module:

| Context / store | File | Exposes | Persistence |
|-----------------|------|---------|-------------|
| `LanguageProvider` | `src/contexts/LanguageContext.jsx` (hooks in `language-context.js`) | `useLanguage()` → `{lang, setLang}`; `useLocalizedField()` → picks `_en` field with FR fallback | `localStorage['wakeref_lang']`; defaults to browser language, then `fr` |
| `ThemeProvider` | `src/contexts/ThemeContext.jsx` (hook in `theme-context.js`) | `useTheme()` → `{theme, setTheme, toggleTheme}` | `localStorage['wakeref_theme']`; defaults to `prefers-color-scheme`; applies `data-theme` + updates `theme-color` meta |
| `useHeatStore` | `src/lib/competition/heatStore.js` | `heatReducer` state (riders, runs, scores, navigation cursors) + `dispatch` | `localStorage['wakeref_heat_<code>']`, autosaved on every change |

> **Import the hooks from the `-context.js` modules**, not from the `.jsx`: the provider files export only their Provider so they stay fast-refresh clean.

Provider order (`src/main.jsx`): `BrowserRouter` → `ThemeProvider` → `LanguageProvider` → `App`.

## Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useAuth` | `src/hooks/useAuth.js` | Wraps `supabase.auth`: `{session, loading, signIn, signOut}`; subscribes to `onAuthStateChange` |
| `useToast` | `src/hooks/useToast.js` | Toast queue: `{toasts, toast(message, type, opts), dismiss}`; auto-dismiss (default 3.5 s), optional action button |
| `useScrollDrive` | `src/hooks/useScrollDrive.js` | Scroll-driven animation progress (home hero) |
| `useT` | `src/i18n/useT.js` | Returns the current-language translation map from `translations.js` |
| `useLanguage`, `useLocalizedField` | `src/contexts/language-context.js` | (see above) |
| `useTheme` | `src/contexts/theme-context.js` | (see above) |
| `useHeatStore` | `src/lib/competition/heatStore.js` | Heat state + autosave for the competition judge app |
| `useCompetitionVoice` | `src/lib/competition/voice.js` | Push-to-talk recorder + non-blocking transcription queue feeding the Run tab |

## Shared components (`src/components/`)

| Component | Purpose |
|-----------|---------|
| `Navbar` | Public nav: desktop topbar (transparent → translucent on scroll), mobile topbar (logo/theme/lang), mobile bottom tab bar |
| `Footer` | Site footer — nav shortcuts + the **only** entry point to `/legal`, `/terms`, `/privacy` |
| `RunSaisie` (+ `.module.css`) | **Shared run-capture UI**, used by both `Compo` and `JudgeTraining`. Its add modes, approach axis, rewind toggle and jib lists are all driven by the active grid from `lib/compoGrids.js` |
| `Icon` | Central wrapper mapping string names → `@tabler/icons-react` icons (one import surface for the whole app) |
| `FigureCard` (+ `.module.css`) | Trick card used in lists/grids |
| `FilterDropdown` (+ `.module.css`) | Multi-select filter used on `/figures` |
| `Badges` | Difficulty / sport / attribute badges |
| `DifficultyDots` | 1–5 difficulty dot indicator |
| `LangSwitcher` (+ `.module.css`) | FR/EN toggle, wired to `LanguageContext` |
| `SEO` | Imperatively sets `document.title` + meta/OG tags per page & language (no react-helmet) |
| `Toast` | Renders the toast queue from `useToast` |
| `ScrollToTop` | Resets scroll position on route change |
| `competition/CableMinimap` (+ `.module.css`) | Course minimap: pulleys, zones, current judging position |

## Public pages (`src/pages/`)

| Page | Route | Notes |
|------|-------|-------|
| `Home` | `/` | Hero (scroll-driven clips) + `home_stats`, **most-viewed** and **recent-video** rows (both RPC-backed, display-ready `figures_card`) |
| `Figures` | `/figures` | Searchable/filterable trick list; reads `figures_card`, search via `searchFigures` lib; category filter via `?cat=` |
| `FigureDetail` | `/figures/:slug` | Full trick page: description/tips (localized, **per-discipline facet** persisted in `wakeref_facet`), videos, prerequisites, switch group, takedown form; **trick breakdown** (`lib/trickDecomposition.js`) + **built-on tree**; fires `track_figure_view` |
| `Quiz` | `/quiz` | Video-based guess-the-trick quiz |
| `Compo` | `/compo`, `/compo/:id` | Run builder. The page owns state, persistence and sharing; **scoring lives in `lib/compoGrids.js`** and capture in `<RunSaisie>`. Saves to `compositions`, shareable by id |
| `CompositionSimple` | `/compo-old` | Legacy simple composition, kept for existing links |
| `JudgeTraining` | `/judge` | Pick a published reference run → judge it from video with `<RunSaisie>` → `diffRuns` against the official solution. Phases: `select` → `judge` → `correct` |
| `JudgeVoice` | `/judge/voix` | Voice lab (FR-only, unlisted in the nav): Web Speech vs local Whisper, the two house models, jib composer, and the IndexedDB dataset recorder with `.zip` export |
| `Contact` | `/contact` | Contact form → `send-contact` Edge Function |
| `SubmitVideo` | `/submit` | Public "suggest a video" form → `video_submissions` insert (triggers email webhook) |
| `Legal` | `/legal`, `/terms`, `/privacy` | Three named exports (`LegalNotice`, `Terms`, `Privacy`) from one module, lazily split per route |
| `NotFound` | `*` | 404 |

## Chromeless judging pages (no Navbar/Footer)

| Page | Route | Notes |
|------|-------|-------|
| `France2026` | `/composition-simple` | Full-screen France 2026 scoring sheet. **Self-contained grids** (`RAW_GRIDS`) — deliberately independent of `compoGrids.js` so the official sheet doesn't move when app grids evolve. State in `localStorage` |
| `competition/CompetitionView` | `/competition`, `/competition/:code` | Loads a course by short code (`get_parcours`), then hosts two tabs over `useHeatStore` |
| `competition/HeatTab` | (tab) | Riders, run count, run-2 order, scores `/100` (`DNS` / `FRS`), ranking |
| `competition/RunTab` | (tab) | Zone-by-zone capture along the course, with push-to-talk dictation queued through `useCompetitionVoice` |

## Admin pages (`src/pages/admin/`)

All lazy-loaded and **never bundled into the public chunk** (code-split in `App.jsx`). Guarded by `AdminLayout`.

| Page | Route | Notes |
|------|-------|-------|
| `Login` | `/admin/login` | Email/password sign-in (outside the guard) |
| `AdminLayout` | `/admin/*` wrapper | Auth guard (redirects to `/admin/login`); sidebar + mobile drawer nav |
| `AdminDashboard` | `/admin` | Counts across tables + thumbnail/video coverage |
| `AdminFigures` | `/admin/figures` | Figure list/management |
| `FigureForm` | `/admin/figures/new`, `/admin/figures/:id/edit` | Create/edit/**duplicate** a figure: prerequisites, bilingual fields, multi-discipline `sports[]` + per-discipline tips, discipline-aware `approach[]` options (hs/ts vs regular/fakie), built-on parent, and a **rotation builder** writing `spin`/`inverts`/`rewind_degs`/`rotation_type` |
| `AdminVideos` | `/admin/videos` | Upload/remove videos (Storage), manage `videos` rows |
| `AdminNoVideos` | `/admin/no-videos` | Figures missing (uploaded) videos — foldable sections |
| `AdminSubmissions` | `/admin/submissions` | Moderate `video_submissions` |
| `AdminTakedowns` | `/admin/takedowns` | Handle `takedown_requests` |
| `AdminCompositions` | `/admin/compositions` | List/delete saved runs |
| `AdminJudgeRuns` | `/admin/judge-runs` | List/delete reference runs (also removes the Storage video) |
| `JudgeRunForm` | `/admin/judge-runs/new`, `/admin/judge-runs/:id/edit` | Create/edit a reference run: metadata, video (upload or URL), `solution` JSON, publish flag |
| `AdminCompetitions` | `/admin/competitions` | List courses, copy share code, duplicate, delete |
| `CompetitionSetup` | `/admin/competitions/new`, `/admin/competitions/:id/edit` | Build a course: cable direction, pulley count/start, zones (modules / blocks), second-pass twins |

## i18n

Two languages, `fr` (default) + `en`. All UI strings in `src/i18n/translations.js` as `{ fr: {…}, en: {…} }` (~660 lines). DB content is bilingual via `field` / `field_en` columns, resolved at render time by `useLocalizedField()` (FR fallback). Language persisted in `localStorage`.

**Exception:** the judging surfaces (`JudgeVoice`, `France2026`, `competition/*`) ship French-only strings inline. Judges are francophone and the vocabulary is the FFSNW's; adding an EN layer there would be cost without a user.

## Static reference data (`src/data/`)

- `categories.js` — **14** categories with `{id, name, slug, icon, color}` (mirrors the `categories` table, adds icons). Note: the `Jib` category (id 9) was formerly "Slides".
- `contexts.js` — 4 trick contexts: `kicker`, `feature`, `flat`, `air_trick` (with icon + color). The former `jib` context was migrated to `feature`.
- `heroClips.js` — home hero video clips.

## Conventions for new UI

- One component per file; co-locate a `*.module.css` next to it.
- Use the global CSS variables / classes from `index.css` (`.btn-icon`, `.spinner`, theme tokens) before adding new ones.
- Add icons through `Icon` (extend its name map) rather than importing Tabler icons directly elsewhere.
- New UI strings go in **both** `fr` and `en` of `translations.js`; new DB-backed text fields come in `field` + `field_en` pairs.
- Keep domain logic out of components: scoring, diffing, course/run models and the voice pipeline all live in `src/lib/` as React-free modules.
- `npm run lint` enforces the strict `react-hooks` (React Compiler) rules — no `setState` synchronously in a `useEffect` body, no component declared during render, no ref access during render.
