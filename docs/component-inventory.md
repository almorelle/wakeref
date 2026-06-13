# Component & Page Inventory — WakeRef

> Generated: 2026-06-11 · Updated: 2026-06-13

WakeRef is a React 19 SPA. UI is plain React function components with **CSS Modules** (`*.module.css`) per component/page, plus one global design system in `src/index.css` (CSS custom properties, theming via `data-theme` attribute). No UI component library, no Tailwind. Icons come from `@tabler/icons-react`, wrapped by a single `Icon` component.

## State management

No Redux/Zustand. State is React-local plus two React Contexts:

| Context | File | Exposes | Persistence |
|---------|------|---------|-------------|
| `LanguageProvider` | `src/contexts/LanguageContext.jsx` | `useLanguage()` → `{lang, setLang}`; `useLocalizedField()` → picks `_en` field with FR fallback | `localStorage['wakeref_lang']`; defaults to browser language, then `fr` |
| `ThemeProvider` | `src/contexts/ThemeContext.jsx` | `useTheme()` → `{theme, setTheme, toggleTheme}` | `localStorage['wakeref_theme']`; defaults to `prefers-color-scheme`; applies `data-theme` + updates `theme-color` meta |

Provider order (`src/main.jsx`): `BrowserRouter` → `ThemeProvider` → `LanguageProvider` → `App`.

## Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useAuth` | `src/hooks/useAuth.js` | Wraps `supabase.auth`: `{session, loading, signIn, signOut}`; subscribes to `onAuthStateChange` |
| `useToast` | `src/hooks/useToast.js` | Toast queue: `{toasts, toast(message, type, opts), dismiss}`; auto-dismiss (default 3.5 s), optional action button |
| `useT` | `src/i18n/useT.js` | Returns the current-language translation map from `translations.js` |
| `useLanguage`, `useLocalizedField` | `LanguageContext.jsx` | (see above) |
| `useTheme` | `ThemeContext.jsx` | (see above) |

## Shared components (`src/components/`)

| Component | Purpose |
|-----------|---------|
| `Navbar` | Public nav: desktop topbar (transparent → translucent on scroll), mobile topbar (logo/theme/lang), mobile bottom tab bar. Links: Home, Figures, Quiz, Compo, Contact |
| `Icon` | Central wrapper mapping string names → `@tabler/icons-react` icons (one import surface for the whole app) |
| `FigureCard` (+ `.module.css`) | Trick card used in lists/grids |
| `Badges` | Difficulty / sport / attribute badges |
| `DifficultyDots` | 1–5 difficulty dot indicator |
| `LangSwitcher` (+ `.module.css`) | FR/EN toggle, wired to `LanguageContext` |
| `SEO` | Imperatively sets `document.title` + meta/OG tags per page & language (no react-helmet); defaults defined inline |
| `Toast` | Renders the toast queue from `useToast` |

## Public pages (`src/pages/`)

| Page | Route | Notes |
|------|-------|-------|
| `Home` | `/` | Hero + `home_stats` RPC, featured figures from `figures_full` |
| `Figures` | `/figures` | Searchable/filterable trick list; reads `figures_full`, search via `searchFigures` lib; category filter via `?cat=` |
| `FigureDetail` | `/figures/:slug` | Full trick page: description/tips (localized), videos (Storage), prerequisites, switch group, takedown form; **trick breakdown** (rotation units via `lib/trickDecomposition.js`) + **built-on tree** (base → this → children, from the view's `base_figure`/`built_on_figure`/`built_on_children`) |
| `Quiz` | `/quiz` | Lazy-loaded. Video-based guess-the-trick quiz |
| `Compo` | `/compo`, `/compo/:id` | Lazy-loaded. Run/line builder with score; saves to `compositions`, shareable by id via `get_composition` |
| `Contact` | `/contact` | Contact form → `send-contact` Edge Function |
| `SubmitVideo` | `/submit` | Public "suggest a video" form → `video_submissions` insert (triggers email webhook) |
| `NotFound` | `*` | 404 |

## Admin pages (`src/pages/admin/`)

All lazy-loaded and **never bundled into the public chunk** (code-split in `App.jsx`). Guarded by `AdminLayout`.

| Page | Route | Notes |
|------|-------|-------|
| `Login` | `/admin/login` | Email/password sign-in |
| `AdminLayout` | `/admin/*` wrapper | Auth guard (redirects to `/admin/login`); sidebar + mobile drawer nav |
| `AdminDashboard` | `/admin` | Counts across tables + thumbnail coverage |
| `AdminFigures` | `/admin/figures` | Figure list/management |
| `FigureForm` | `/admin/figures/new`, `/admin/figures/:id/edit` | Create/edit figure incl. prerequisites, bilingual fields, **built-on parent**, and a **rotation builder** (spin degrees / rewinds / per-slot ole·handle-pass via `lib/trickDecomposition.js`) writing `spin`/`inverts`/`rewind_degs`/`rotation_type` |
| `AdminVideos` | `/admin/videos` | Upload/remove videos (Storage), manage `videos` rows |
| `AdminNoVideos` | `/admin/no-videos` | Figures missing (uploaded) videos — foldable sections |
| `AdminSubmissions` | `/admin/submissions` | Moderate `video_submissions` |
| `AdminTakedowns` | `/admin/takedowns` | Handle `takedown_requests` |
| `AdminCompositions` | `/admin/compositions` | List/delete saved runs |

## i18n

Two languages, `fr` (default) + `en`. All UI strings in `src/i18n/translations.js` as `{ fr: {…}, en: {…} }` (~465 lines). DB content is bilingual via `field` / `field_en` columns, resolved at render time by `useLocalizedField()` (FR fallback). Language persisted in `localStorage`.

## Static reference data (`src/data/`)

- `categories.js` — 14 categories with `{id, name, slug, icon, color}` (mirrors the `categories` table, adds icons). Note: the `Jib` category (id 9) was formerly "Slides".
- `contexts.js` — 4 trick contexts: `kicker`, `feature`, `flat`, `air_trick` (with icon + color). The former `jib` context was migrated to `feature`.

## Conventions for new UI

- One component per file; co-locate a `*.module.css` next to it.
- Use the global CSS variables / classes from `index.css` (`.btn-icon`, `.spinner`, theme tokens) before adding new ones.
- Add icons through `Icon` (extend its name map) rather than importing Tabler icons directly elsewhere.
- New UI strings go in **both** `fr` and `en` of `translations.js`; new DB-backed text fields come in `field` + `field_en` pairs.
