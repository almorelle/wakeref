---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - _bmad-output/planning-artifacts/ux-designs/ux-wakeref-2026-06-19/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-wakeref-2026-06-19/EXPERIENCE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-wakeref-2026-06-19/.decision-log.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/project-context.md
  - docs/data-models.md
  - docs/api-contracts.md
prd: 'none (design-first; UX package + architecture substitute as the requirements source)'
---

# wakeref — Judge Training · Epic Breakdown

## Overview

Complete epic and story breakdown for the **Judge Training module**, decomposing the UX package (DESIGN.md / EXPERIENCE.md / decision-log D1–D9) and the Architecture decisions (AD-1 → AD-6) into implementable stories. No formal PRD — design-first; the UX + architecture documents are the requirements source.

## Requirements Inventory

### Functional Requirements

FR1: A new top-level nav item ("Entraînement juge" / "Judge training") sits alongside Quiz and routes to the module.
FR2: A Selection surface lets the user pick a **difficulty** (easy / medium / hard) and a **discipline** (wakeboard / wakeskate / seated) and resolve to a run to train on.
FR3: The Selection surface lists only **published** reference runs matching the chosen discipline + difficulty, exposing run metadata only (never the solution).
FR4: A Judging surface plays the run video with standard controls (play/pause/scrub/seek) and lets the judge enter the run via the reused saisie UI, with **no score calculator** shown or computed.
FR5: The saisie is fixed to the run's `grid_key` (add modes jib/kicker/air_trick/flat per grid, side left/right, per-discipline approach axis, jib passes) — the grid is not user-switchable in this module.
FR6: An "Évaluer mon run" action is disabled until ≥1 element is entered; on click it locks the saisie, fetches the reference solution on demand, and computes the diff.
FR7: A Correction surface reveals the reference solution diffed against the judge's saisie element-by-element, with per-position states (correct / missing / extra / wrong-attribute / wrong-order) and a plain-language tally — never a /20 score.
FR8: Correctness matching = exact trick (slug) + approach + side + rotation + position; the free-text "autre" field is excluded from the diff (never flagged).
FR9: The run video persists on the Correction surface so the judge can scrub to the moments she erred.
FR10: A "Recommencer" action returns to Selection (fresh difficulty/discipline choice) and discards the session.
FR11: An admin can create/edit a reference run: capture the fixed solution via the saisie UI, set name/discipline/grid_key/difficulty/category, attach the run video (upload or external URL), and publish/unpublish.
FR12: When no published run matches the chosen discipline × difficulty, the Selection surface shows an honest empty state suggesting another combination.

### NonFunctional Requirements

NFR1: JavaScript/JSX only (no TypeScript), React 19 function components + hooks; `npm run lint` stays 0 errors / 0 warnings (react-hooks strict set).
NFR2: No server/API layer — Supabase via the singleton client; RLS + grants + RPCs are the only contract.
NFR3: CSS Modules + global tokens in `src/index.css` only (no CSS framework / component lib); icons via the `Icon` wrapper.
NFR4: All UI strings bilingual fr/en in `src/i18n/translations.js` (both languages), via `useT()`; any new DB text fields come as `field` / `field_en`.
NFR5: Supabase free plan — no paid-only features (e.g. Storage image transforms).
NFR6: Schema is hand-managed — mirror every change into `scripts/wakeref_post_restore.sql` (executable) + `scripts/wakeref_schema.sql` (reference). New table → `enable row level security` + policies + grants; new RPC → `security definer` + `set search_path = public` + `grant execute`.
NFR7: Public pages stay in the public bundle; any admin page is `lazy()`-loaded/code-split and never imported from a public page.
NFR8: The `solution` jsonb is capped at 50 KB (`pg_column_size <= 51200`), consistent with `compositions`.
NFR9: Stateless / anonymous — no public sign-up, no per-user progress storage; all security rests on RLS (anon key is public).
NFR10: Judge pages are desktop-first (two-pane), mobile degraded but functional; the `<RunSaisie>` extraction must NOT degrade Compo's existing responsiveness.

### Additional Requirements

(From Architecture AD-1 → AD-6.)

- **No starter template** — brownfield feature inside the existing WakeRef app; no greenfield bootstrap story.
- AD-2: New `judge_runs` table (id, name, discipline `sport_type`, grid_key, difficulty easy|medium|hard, category, source_type, video_path, video_url, solution jsonb, published, timestamps). `seated` enum value confirmed present.
- AD-3: RPC pair — `list_judge_runs(p_discipline, p_difficulty)` returning metadata WITHOUT `solution`; `get_judge_run_solution(p_id)` returning `(grid_key, solution)`. Both `security definer`, self-filter `published = true`, `grant execute` to anon + authenticated. Anon has NO table grant on `judge_runs`.
- AD-1/AD-4: Client-side diff in a new `src/lib/judgeDiff.js`; solution never bundled — fetched only at "Évaluer". No /20 computed.
- AD-5: Extract a presentation-neutral `<RunSaisie>` from `Compo.jsx` (value/onChange over `{entries, jibPasses}`, driven by `gridKey`), consumed by Compo (with score panel) and the judge module (without). Behavior-preserving; Compo parity (desktop + mobile) verified before building on it.
- AD-6: Run videos in the existing public `videos` bucket under a `runs/` prefix (public SELECT for playback, admin-only upload). Admin authoring page reuses `<RunSaisie>` + run-video upload, code-split like other admin pages.

### UX Design Requirements

(From DESIGN.md + EXPERIENCE.md.)

UX-DR1: Diff semantic color set — correct → `--c-success`, missing → `--c-danger`, extra → `--c-faint` (de-emphasised), wrong-attribute → `--c-ws` (amber), wrong-order → `--c-accent2` (blue) — mapped onto existing status tokens; "missing" loudest, "extra" quietest. **Color is never the sole signal** (always paired with icon + label).
UX-DR2: Desktop-first two-pane layouts at `module-max` 1280px — Judging: video left (sticky) + saisie right; Correction: persistent video + two-column diff (judge saisie | reference). Mobile (degraded): panes stack, video sticky/collapsible, diff collapses to one column fusing both sides per position. Theming via `[data-theme]` dark/light.
UX-DR3: `difficulty-card` (3 cards showing bucket + the competition categories it covers) and `discipline-chip` (tinted by discipline token) for the Selection surface.
UX-DR4: `diff-row` (position, judge cell, reference cell, attribute badges, state tint) and `diff-two-pane` (container + sticky legend of the 5 diff colors).
UX-DR5: `video-player` with standard HTML5 controls, no custom scoring timeline; persists from Judging into Correction.
UX-DR6: Bilingual coaching microcopy — CTAs ("Évaluer mon run", "Recommencer"), diff labels ("Trick oublié", "En trop", "Mauvaise approche", "Bon trick, mauvaise position"), empty/loading/error states; neutral, never punitive.
UX-DR7: Accessibility floor inherited from WakeRef (`:focus-visible` ring, contrast); saisie controls + video player keyboard-operable; text alternative for "video unavailable"; the free-text "autre" rendered neutral (never colored as right/wrong).

### FR Coverage Map

FR1: Epic 3 — judge-training nav item + route
FR2: Epic 3 — Selection (difficulty × discipline)
FR3: Epic 3 — published-run catalog (via `list_judge_runs` from Epic 2)
FR4: Epic 3 — Judging surface (video + `<RunSaisie>` from Epic 1), no score panel
FR5: Epic 3 — saisie fixed to the run's `grid_key`
FR6: Epic 3 — "Évaluer mon run" + on-demand solution fetch (via `get_judge_run_solution` from Epic 2)
FR7: Epic 3 — Correction diff (5 states) + plain-language tally
FR8: Epic 3 — matching rule (exact trick + order; "autre" excluded) via `judgeDiff.js`
FR9: Epic 3 — video persists on Correction
FR10: Epic 3 — "Recommencer" → Selection
FR11: Epic 2 — admin reference-run authoring
FR12: Epic 3 — empty state when no run matches

(Epic 1 covers no FR directly — it is an enabler that unblocks FR4, FR5, FR11.)

## Epic List

### Epic 1: Socle — composant de saisie réutilisable `<RunSaisie>`
Enabler / risk-isolated. Extract the inline saisie from `Compo.jsx` into a presentation-neutral `<RunSaisie>` (value/onChange over `{entries, jibPasses}`, driven by `gridKey`), consumed by Compo (with score panel) and later by the judge module (without). Behavior-preserving — Compo must look and behave identically on desktop AND mobile (parity gate) before anything is built on it.
**FRs covered:** none directly (enabler — unblocks FR4, FR5, FR11)

### Epic 2: Bibliothèque de runs de référence (admin + données)
The admin can create, edit and publish fixed reference runs that the judge module will train against. Delivers the `judge_runs` table, the RPC pair (`list_judge_runs` metadata-only + `get_judge_run_solution`), RLS/grants, SQL mirroring, run-video storage under the `runs/` prefix, and a code-split admin authoring page reusing `<RunSaisie>` + run-video upload. Stands alone: the catalogue can be authored before the public module exists.
**FRs covered:** FR11 (+ data/RPC foundation consumed by Epic 3)

### Epic 3: Parcours d'entraînement juge (public)
The headline value: a judge picks a difficulty + discipline, captures the run on video without a score, evaluates, reads an element-by-element correction with the revealed solution, and restarts. Adds the public nav item/route, Selection / Judging / Correction surfaces, and the client-side `src/lib/judgeDiff.js`. Builds on Epic 1 (`<RunSaisie>`) and Epic 2 (published runs + RPCs).
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR12

---

## Epic 1: Socle — composant de saisie réutilisable `<RunSaisie>`

Extract the inline saisie from `Compo.jsx` into a presentation-neutral, reusable component, with no change to Compo's behavior or responsiveness — the foundation both the admin authoring page and the public judge module build on.

### Story 1.1: Extraire `<RunSaisie>` de Compo à comportement constant

As a developer,
I want the Compo saisie (entry list, add modes, side, search, JibForm/OtherForm) extracted into a reusable `<RunSaisie>` component,
So that both Compo and the new judge module can capture a run without duplicating the saisie logic.

**Acceptance Criteria:**

**Given** the current `Compo.jsx` renders the saisie inline (entry list, add modes jib/kicker/air_trick/flat, side left/right, figure search, `JibForm`, `OtherForm`)
**When** the saisie is extracted into `src/components/RunSaisie.jsx` (+ co-located `*.module.css`)
**Then** `<RunSaisie>` exposes a controlled API — `value` = `{ entries, jibPasses }`, `onChange`, and `gridKey` — and contains NO scoring logic (`computeScore`/`score20` stay in Compo)
**And** the component sets no width/grid/breakpoints of its own (presentation-neutral); its CSS is moved verbatim so it adapts to its container.

**Given** Compo now consumes `<RunSaisie>` and keeps its score panel as a sibling fed by the same `{entries, jibPasses}`
**When** Compo is used on desktop and on mobile
**Then** Compo looks and behaves identically to before extraction (parity gate) — add modes, jib passes, "autre", reorder, remove, search, gridKey switch, save/load by URL all work as before
**And** the saved `compositions.data` snapshot shape is unchanged.

**Given** the project lint/build rules
**When** `npm run lint` runs
**Then** it ends at 0 errors / 0 warnings (react-hooks strict; no component declared during render — `<RunSaisie>` hoisted to module scope)
**And** parity is verified manually via `npm run dev` (no test runner) before any later epic builds on the component.

---

## Epic 2: Bibliothèque de runs de référence (admin + données)

The admin can author, publish and manage the fixed reference runs the judge module trains against, backed by a new table, a safe public read contract, and run-video storage.

### Story 2.1: Créer et publier un run de référence (admin)

As an admin,
I want to create, edit and publish a reference run — its metadata, its fixed solution captured via the saisie, and its run video,
So that judges have published runs to train against.

**Acceptance Criteria:**

**Given** the schema is hand-managed
**When** the `judge_runs` table is created
**Then** it has `id`, `name` (CHECK length ≤ 120), `discipline` (`sport_type`), `grid_key` (text), `difficulty` (CHECK in `easy|medium|hard`), `category` (text, nullable), `source_type` (`video_source`), `video_path`, `video_url`, `solution` (jsonb NOT NULL, CHECK `pg_column_size(solution) <= 51200`), `published` (boolean default false), `created_at`/`updated_at` (with the existing `set_updated_at()` trigger)
**And** RLS is enabled with `authenticated` full access and NO anon table grant
**And** the change is mirrored into `scripts/wakeref_post_restore.sql` (executable) and `scripts/wakeref_schema.sql` (reference).

**Given** a code-split admin page (lazy-loaded, never imported from a public page)
**When** the admin fills name/discipline/grid_key/difficulty/category, captures the solution via `<RunSaisie>` (grid driven by the chosen `grid_key`), and attaches a run video (upload to the `videos` bucket under `runs/`, or an external URL)
**Then** the run is saved to `judge_runs` and can be toggled `published`/unpublished, edited, and deleted
**And** an unpublished run never appears to the public (verified as anon).

**Given** all new UI strings
**When** the admin page renders
**Then** every string exists in both `fr` and `en` via `useT()`, and icons go through the `Icon` wrapper.

### Story 2.2: Contrat de lecture public sécurisé (RPC)

As the public judge module,
I want to list published reference runs by discipline + difficulty and fetch one run's solution only on demand,
So that the catalogue is browsable without ever exposing solutions ahead of evaluation.

**Acceptance Criteria:**

**Given** anon has no table grant on `judge_runs`
**When** `list_judge_runs(p_discipline text, p_difficulty text)` is called as anon
**Then** it returns only published runs matching the filters, exposing metadata only (id, name, discipline, grid_key, difficulty, category, source_type, video_path, video_url) and NEVER the `solution` column
**And** the function is `security definer`, pins `set search_path = public`, and is granted execute to `anon` + `authenticated`.

**Given** a published run id
**When** `get_judge_run_solution(p_id integer)` is called as anon
**Then** it returns `(grid_key text, solution jsonb)` for that published run only (nothing for unpublished/unknown ids)
**And** it is `security definer`, pins `set search_path = public`, granted execute to `anon` + `authenticated`, and mirrored into both SQL files.

**Given** the anti-peek intent is soft (documented)
**When** the contract is reviewed
**Then** anon cannot read the solution via any table query — only via `get_judge_run_solution` — and the rationale is documented next to the function definitions.

---

## Epic 3: Parcours d'entraînement juge (public)

A judge picks a difficulty + discipline, captures a recorded run on video without a score, evaluates, and reads an element-by-element correction with the revealed solution — then trains again.

### Story 3.1: Onglet de navigation + coquille du module

As a judge,
I want a "Judge training" entry in the main navigation that opens the module,
So that I can reach the training tool as a first-class feature.

**Acceptance Criteria:**

**Given** the public navigation lists Quiz and the other top-level items
**When** the app renders
**Then** a new top-level item ("Entraînement juge" / "Judge training", strings in fr + en) appears alongside Quiz and routes to the module
**And** the module page is `lazy()`-loaded/code-split like other heavy public pages
**And** the module's landing surface is the Selection screen (Story 3.2).

### Story 3.2: Sélection (discipline × difficulté)

As a judge,
I want to choose a difficulty and a discipline and see the matching published runs,
So that I can start training on a relevant run.

**Acceptance Criteria:**

**Given** the Selection surface
**When** it renders
**Then** it shows three `difficulty-card`s (easy / medium / hard, each listing the competition categories it covers) and `discipline-chip`s tinted per discipline (wakeboard / wakeskate / seated)

**Given** a chosen difficulty + discipline
**When** the selection resolves
**Then** the surface calls `list_judge_runs` and lists the matching published runs (metadata only)
**And** picking a run navigates to the Judging surface (Story 3.3)
**And** when no published run matches, an honest empty state is shown suggesting another combination (fr + en).

### Story 3.3: Jugement — vidéo + saisie sans score

As a judge,
I want to watch the run video and capture the tricks via the saisie, without any score,
So that I record what I judged before checking myself.

**Acceptance Criteria:**

**Given** a resolved run
**When** the Judging surface renders (desktop-first two-pane at `module-max` 1280px: video left/sticky, saisie right; mobile: stacked, video sticky/collapsible)
**Then** the run video plays with standard controls (play/pause/scrub/seek) and the saisie is `<RunSaisie>` fixed to the run's `grid_key` (not switchable)
**And** NO score calculator is shown and none is computed
**And** the video shows a text alternative if unavailable.

**Given** the judge has entered the run
**When** she has at least one element
**Then** the "Évaluer mon run" CTA is enabled (disabled while empty); pause/scrub are allowed throughout.

### Story 3.4: Évaluation + moteur de diff

As a judge,
I want my saisie compared to the run's fixed solution when I evaluate,
So that I learn exactly where I was wrong.

**Acceptance Criteria:**

**Given** `src/lib/judgeDiff.js` (pure JS, placed like `trickDecomposition.js`)
**When** it compares judge `{entries, jibPasses}` vs reference `{entries, jibPasses}` for the same `grid_key`
**Then** it produces per-position states: `correct` (exact trick + approach + side + rotation + position), `missing`, `extra`, `attr` (right trick & position, wrong approach/side/rotation), `order` (right trick, wrong position)
**And** free-text "autre" entries are excluded (never missing/extra/attr/order)
**And** no `/20` score is computed.

**Given** the judge clicks "Évaluer mon run"
**When** evaluation runs
**Then** the saisie locks, `get_judge_run_solution` is called on demand (solution never bundled before this point), and the diff is computed client-side
**And** the result drives the Correction surface (Story 3.5).

### Story 3.5: Correction — révélation + diff + recommencer

As a judge,
I want to see the revealed solution diffed against my saisie with the video still available,
So that I can review my mistakes and train again.

**Acceptance Criteria:**

**Given** a computed diff
**When** the Correction surface renders
**Then** it shows a `diff-two-pane` (my saisie | revealed reference) aligned by position, with each row tinted by its state and a sticky legend; colors map to existing tokens (correct→success, missing→danger loudest, extra→faint quietest, attr→amber, order→blue) and every state pairs color with an icon + label (color never the sole signal)
**And** a plain-language tally is shown (e.g. "3 corrects · 1 oublié · 1 mauvaise approche") with NO /20.

**Given** the Correction surface
**When** the judge reviews
**Then** the run video persists and is scrubbable to inspect her errors
**And** a "Recommencer" action returns to Selection (fresh choice) and discards the session
**And** all microcopy is bilingual fr/en, neutral/coaching in tone.
