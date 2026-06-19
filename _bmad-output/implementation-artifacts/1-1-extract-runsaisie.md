---
baseline_commit: 170243d6d47ad1585177b3619852a61a66ad0f9c
---

# Story 1.1: Extraire `<RunSaisie>` de Compo à comportement constant

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the Compo saisie (entry list, add modes, side, search, JibForm/OtherForm) extracted into a reusable, presentation-neutral `<RunSaisie>` component,
so that both Compo and the upcoming judge-training module can capture a run without duplicating the saisie logic — and Compo behaves and looks exactly as before.

## Acceptance Criteria

1. A new component `src/components/RunSaisie.jsx` (+ co-located `RunSaisie.module.css`) owns the run-capture UI: the add-mode buttons (jib/kicker/air_trick/flat + "autre"), the figure search, `JibForm`, `OtherForm`, the pending-figure question flow, and the ordered entry list with reorder/remove.
2. `<RunSaisie>` is a **controlled** component with this exact contract: `gridKey` (string, the active grid id — fixed by the parent, NOT switchable inside the component), `value` = `{ entries, jibPasses, otherEntries }`, `onChange(next)` (called with the full next `{ entries, jibPasses, otherEntries }` on every mutation), and `toast` (the toast fn, for undo-on-remove). It calls `useT()` itself.
3. `<RunSaisie>` contains **no scoring logic** — `GRIDS`, `computeScore`, `SCORING_SLUGS`, `jibPassToEntries`, the grid predicates, and the score panel JSX all stay in `Compo.jsx`.
4. `<RunSaisie>` is **presentation-neutral**: it sets no outer width, grid, or breakpoints, and its CSS is moved verbatim from `Compo.module.css` (no visual change). It renders only the saisie blocks; the consumer wraps it (Compo keeps `.layout`/`.left`/`.right`). It relies on an inherited `--disc` CSS custom property set by the consumer (Compo sets it on `.layout`).
5. Compo consumes `<RunSaisie>` for the saisie and keeps everything else (grid selector, name/save/share panels, score panel, localStorage, `/compo/:id` load) — fed by the same `{ entries, jibPasses, otherEntries }` it now passes down via `value`/`onChange`.
6. **Parity gate** — Compo looks and behaves identically on desktop AND mobile before/after: all add modes, jib pass, "autre", side/context/approach questions, the seated-kicker-spin rewind toggle, cross-type reorder, remove+undo, grid-switch discipline lock, discipline-filtered search, live score, mobile score fold, save/share, `/compo/:id` load, and localStorage persist/restore all work as before. The saved `compositions.data` snapshot shape is byte-identical for the same run.
7. `npm run lint` ends at 0 errors / 0 warnings (react-hooks strict set: `<RunSaisie>`, `OptBtn`, `JibForm`, `OtherForm` declared at module scope, no setState-in-effect-body, no ref `.current` read during render).
8. Parity verified manually via `npm run dev` (no test runner exists) — see the parity checklist in Dev Notes.

## Tasks / Subtasks

- [x] Task 1 — Create `src/components/RunSaisie.jsx` with the controlled contract (AC: 1, 2)
  - [x] Move sub-components verbatim: `OptBtn`, `JibForm`, `OtherForm` (declared at module scope).
  - [x] Move saisie-only constants: `JIB_FIGURES`, `JIB_FIGURES_SEATED`, `JIB_FIGURE_BY_SLUG`, `ROTATIONS`, `MODE_LABEL`, `STANDING_APPROACH`, `SEATED_APPROACH`, `parseArr`, `parseFigure`. (`WS_JIB_TRICKS` lives in `compoGrids.js` since the scoring engine also uses it — imported here.)
  - [x] Move saisie-only state: `query`, `suggestions`, `searching`, `highlightIdx`, `pendingFigure`, `pendingAnswers`, `pendingRewind`, `addMode`. (next-seq derived from `value` via `nextSeqOf`, no ref needed.)
  - [x] Move handlers: `search`, `selectFigure`, `confirmEntry`, `confirmJib`, `confirmOther`, `allQuestionsAnswered`, `moveItem`, `removeItem`, `rowControls`, `jibSummary`, `sideLabel`, `ctxLabel`, `appLabel`, and the `allItems` derivation (`sortedAllItems`).
  - [x] Rewire mutations through `onChange` with **functional updaters** `onChange(prev => next)` (preserves fresh-value undo). Grid info (`modes`, `seatedApproach`, `gridSupportsRewind`) read from `GRIDS[gridKey]` imported from the neutral `src/lib/compoGrids.js` — no circular dep, scoring engine not pulled into the component.
- [x] Task 2 — Move saisie CSS to `RunSaisie.module.css` verbatim (AC: 4)
  - [x] Moved only the saisie classes. Page/score/save classes kept in `Compo.module.css`.
  - [x] `.spinner` (+ `@keyframes spin`) duplicated into both module files (CSS Modules scope the keyframes name per file). Compo's `.spinner` kept verbatim (absolute positioning) to avoid any visual drift on the save button.
- [x] Task 3 — Refactor `Compo.jsx` to consume `<RunSaisie>` (AC: 3, 5)
  - [x] Run data consolidated into a single `run` object state (`{entries, jibPasses, otherEntries}`) so `onChange = setRun` supports functional updaters cleanly. `gridKey`, score, persistence, URL load, save/share, grid selector, SEO kept in Compo.
  - [x] `<RunSaisie key={`${gridKey}-${resetNonce}`} gridKey value={run} onChange={setRun} toast={toast} />` rendered inside `.left` after the header + grid selector + save/share panels (DOM order preserved).
  - [x] `resetCompo` clears the run + bumps `resetNonce`; `changeGrid` changes `gridKey`. Both remount `<RunSaisie>` via its `key`, purging in-progress saisie state — behavior-equivalent to the old explicit resets.
- [x] Task 4 — Verify parity + lint (AC: 6, 7, 8)
  - [x] `npm run lint` → no errors introduced by this story. (3 errors remain in unrelated, untouched files — `useInView`, `AdminDashboard.jsx`, `AdminVideos.jsx` — confirmed pre-existing on baseline commit 170243d.)
  - [x] `npx vite build` → builds clean (no import/compile errors).
  - [ ] `npm run dev` manual parity walk (desktop + mobile, FR + EN) — **pending human verification** (no test runner in this project; cannot drive interactive dev headlessly).

## Dev Notes

### What this story is (and is NOT)

- IS: a **behavior-preserving structural refactor** of one file (`src/pages/Compo.jsx`, ~1125 lines) + its CSS. No new feature, no UX change, no DB change.
- IS NOT: any judge-training feature, any new route, any scoring change. Those are later stories (Epic 2/3). Do not add them here. [Source: epics.md#Epic 1, architecture.md#AD-5]

### The GRIDS dependency (important)

`<RunSaisie>` needs, per `gridKey`: the available **add modes** (`activeGrid.modes`), whether the discipline is **seated** (approach axis hs/ts vs regular/fakie), and whether the grid **supports rewind** (`seated_rewind` item present → the kicker-spin rewind toggle). Today these are read from `GRIDS` (the scoring engine, lines 188–282). AC-3 says scoring stays in Compo.

Resolve this WITHOUT pulling the scoring engine into the component: either (a) export from `Compo.jsx` (or a small shared module) a lightweight grid **descriptor** map `{ [gridKey]: { discipline, modes, supportsRewind } }` that both Compo and RunSaisie import, or (b) pass `modes` / `seatedApproach` / `gridSupportsRewind` as props from Compo. Prefer (a) — it keeps the component self-driven by `gridKey` and is what the judge module will reuse. Do not duplicate the GRIDS data; derive the descriptor from it or co-locate both. [Source: Compo.jsx:526-530]

### Controlled-component contract details

- `value` carries all three run arrays. Every current mutation (`confirmEntry`, `confirmJib`, `confirmOther`, `moveItem`, `removeItem`) must produce the next `{entries, jibPasses, otherEntries}` and call `onChange` — never hold a private copy of the run data (Compo is the owner, for score + save + persistence).
- `seqRef`: items need a monotonic unique `_seq` for ordering across the three arrays. Today a `useRef` seeded from the max restored `_seq` (Compo.jsx:533-536). Inside RunSaisie you may either keep a ref re-seeded from `value` when it grows, or derive next seq as `max(_seq over value items) + 1` at mutation time — outcome must match (unique, increasing; `moveItem` already renumbers 1..N). [Source: Compo.jsx:533-536, 778-789]
- `removeItem` shows an **undo toast** (Compo.jsx:796-804) — that is why `toast` is a prop. Keep the 6000ms duration + undo that restores the item at its original `_seq`.
- `tr` via `useT()` called inside RunSaisie (pure lookup hook — safe). Do NOT pass `tr` as a prop.

### Move vs keep — exact inventory

MOVE to `RunSaisie.jsx`: `OptBtn`, `JibForm`, `OtherForm`; constants `WS_JIB_TRICKS`, `JIB_FIGURES`, `JIB_FIGURES_SEATED`, `JIB_FIGURE_BY_SLUG`, `ROTATIONS`, `MODE_LABEL`, `STANDING_APPROACH`, `SEATED_APPROACH`, `parseArr`, `parseFigure`; the saisie state + handlers listed in Task 1; JSX blocks at Compo.jsx **lines 916-1087** (add buttons → search section → JibForm → OtherForm → pending questions → entry list).

KEEP in `Compo.jsx`: `STORAGE_KEY`, `loadStored`, `shortId`, `serializeEntry`; the entire scoring engine `SCORING_SLUGS`, `jibPassToEntries`, predicates, `ROT_BY_SIDE`, `SEATED_*`, `WS_BODY_VARIALS`, `GRIDS`, `computeScore`, `GRID_OPTIONS`, `DISCIPLINE_COLOR`; the dev slug-drift guard (Compo.jsx:579-588); state `name`, `saving`, `savedId`, `savedSig`, `showSave`, `detailsOpen`, plus the owner run state + `gridKey`; `snapshot`/localStorage effect, `/compo/:id` load effect, `saveRun`, `shareUrl`, `copyLink`, `resetCompo`, `changeGrid`; JSX: SEO, `.layout` (sets `--disc`), `.left` header + grid selector + save/share panels, and the whole `.right` score panel (Compo.jsx:1090-1120). [Source: Compo.jsx — full file read]

### CSS split (`Compo.module.css` → `RunSaisie.module.css`)

MOVE (saisie): `.optBtn`, `.optSelected`, `.pending`, `.pendingTitle`, `.questionRow`, `.questionLabel`, `.questionOptions`, `.pendingActions`, `.addBtns`, `.addBtn`, `.searchSection`, `.searchWrap`, `.suggestions`, `.suggestion`, `.suggestionHighlight`, `.suggName`, `.suggCat`, `.entryList`, `.entryRow`, `.entryRowAir`, `.entryRowKicker`, `.entryRowJib`, `.entryRowOther`, `.entryInfo`, `.entryName`, `.entryTags`, `.tag`, `.tagJib`, `.empty`, `.rowActions`, `.moveGroup`, `.moveBtn`, `.moveUp`, `.moveDown`, `.removeBtn`.

KEEP (page/score/save): `.page`, `.layout`, `.left`, `.right`, `.headerRow`, `.sectionTitle`, `.headerActions`, `.savePulse`, `.gridSelect`, `.gridTab`, `.gridTabActive`, `.saveHintLine`, `.savePanel`, `.saveLabel`, `.saveActions`, `.sharePanel`, `.shareTitle`, `.shareRow`, `.disciplineTag`, `.scoreHeader`, `.scoreTotal`, `.scoreMax`, `.scoreToggle`, `.scoreToggleOpen`, `.scoreDetails`, `.scoreDetailsCollapsed`, `.scoreSection`, `.scoreSectionTitle`, `.scoreItem`, `.scoreItemOn`, `.scoreItemDot`, `.scoreItemLabel`, `.scoreItemPt`.

### Cross-dependency: `SCORING_SLUGS`

The jib figure lists that move to RunSaisie (`JIB_FIGURES`, `JIB_FIGURES_SEATED`, `WS_JIB_TRICKS`) reference `SCORING_SLUGS` (e.g. `SCORING_SLUGS.fiftyFifty`, `.wsBodyVarial`), but `SCORING_SLUGS` is the scoring source-of-truth and stays with the engine. Avoid a broken import: either export `SCORING_SLUGS` from `Compo.jsx` and import it in RunSaisie, OR (cleaner, and what the judge module will also want) move `SCORING_SLUGS` into a small shared module (e.g. `src/lib/compoSlugs.js`) imported by both. Keep ONE source of truth — do not copy the slug values. [Source: Compo.jsx:63-95, 303-334]

### CSS — shared class

SHARED: `.spinner` (search loader AND save button) — duplicate into both module files (or hoist) so neither loses it. The entry-row accent colors / tags may read `var(--disc)`; since `--disc` is set on `.layout` in Compo and inherited, RunSaisie styles can keep referencing it — the consumer MUST set `--disc` on a wrapping element.

### Parity checklist (manual, `npm run dev`, desktop + mobile, FR + EN)

- Add modes per grid: wakeboard {jib, kicker, air_trick}, wakeskate {jib, kicker, flat}, seated_mp1 {jib, kicker, flat}, seated_mp5 {jib, kicker, flat, air_trick} + "autre" always.
- Figure search filters by active discipline + context; arrow-key highlight, Enter to pick, Escape to cancel.
- Pending questions: side (hidden for `flat`), context disambiguation (air vs kicker/feature when no addMode), approach (hs/ts when figure has both); seated-kicker-spin **rewind** toggle only on seated grids that score `seated_rewind`.
- Jib pass: side + approach (hs/ts standing vs regular/fakie seated), entry/exit rotations, jib figures (seated set differs), wakeskate entry/exit tricks; summary line renders.
- "Autre": free-text, Enter confirm / Escape cancel.
- Entry list: cross-type reorder (jib above figure works), remove shows undo toast (6s) restoring original position.
- Grid selector: switching level within a discipline allowed with items present; switching discipline is LOCKED once any item exists (tooltip).
- Score panel updates live; mobile fold toggles; discipline color (`--disc`) tints active pill/score/criteria.
- Save: name (≤80), save inserts to `compositions`, share link appears and invalidates when content drifts; copy link toasts.
- `/compo/:id` loads a saved run (entries/jibPasses/otherEntries/gridKey), seq resumes.
- localStorage: refresh restores the in-progress run; `compositions.data` for a given run is unchanged vs before refactor.

### Project Structure Notes

- One component per file + co-located `*.module.css` (project convention). New file lands in `src/components/` alongside the other shared components. [Source: project-context.md#i18n & UI conventions]
- Icons only via the `Icon` wrapper (`rowControls` uses `Icon name="chevron-right"`/`"x"`) — keep as-is. [Source: project-context.md]
- No new i18n strings expected (all `tr.*` keys already exist); if any string is newly surfaced, add to BOTH `fr` and `en`. [Source: project-context.md#i18n]
- No CSS framework / no new global tokens — reuse existing. [Source: project-context.md#Architecture guardrails]
- JS/JSX only, no TypeScript. [Source: project-context.md#Technology Stack]

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 1 / Story 1.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#AD-5]
- [Source: src/pages/Compo.jsx — full file (state 500-522, derived grid 524-536, handlers 590-822, JSX 824-1125)]
- [Source: src/pages/Compo.module.css — class inventory]
- [Source: _bmad-output/project-context.md — build/lint, UI conventions, data-layer rules]
- UX context (why presentation-neutral): [Source: _bmad-output/planning-artifacts/ux-designs/ux-wakeref-2026-06-19/EXPERIENCE.md#Foundation; DESIGN.md#Layout & Spacing] — the judge page is desktop-first while Compo is responsive; the component must not impose layout.

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (BMad dev-story)

### Debug Log References

- `npm run lint` → 3 errors, all pre-existing in untouched files (verified by stashing this story's tracked changes and re-linting against baseline 170243d: same 3 errors). Zero errors in `Compo.jsx`, `RunSaisie.jsx`, `compoGrids.js`.
- `npx vite build` → ✓ built; Compo chunk 28.78 kB (RunSaisie + compoGrids statically bundled into the lazy Compo chunk; no stray chunk).

### Completion Notes List

- Behavior-preserving extraction. Three structural decisions, each chosen to keep behavior identical:
  1. **Shared engine module** `src/lib/compoGrids.js` (neutral, no React) holds `GRIDS`, `computeScore`, `jibPassToEntries`, `SCORING_SLUGS`, `WS_JIB_TRICKS`, `GRID_OPTIONS`. Imported by both Compo (scoring + panel) and RunSaisie (grid descriptor only). Avoids a Compo↔RunSaisie import cycle and is reusable by the future judge module.
  2. **Consolidated run state** in Compo (`run = {entries, jibPasses, otherEntries}`) so the controlled `onChange = setRun` accepts functional updaters. This is what makes the remove→undo toast keep fresh-value semantics (append to latest, never overwrite a concurrent change).
  3. **Reset via remount**: `<RunSaisie key={`${gridKey}-${resetNonce}`}>`. Grid change (gridKey) and reset (resetNonce bump) remount the component, purging its in-progress saisie state — equivalent to the old explicit `setAddMode(null)/setPendingFigure(null)/setQuery('')…`.
- `seqRef` removed; next `_seq` derived as `max(_seq)+1` from current value at mutation time. Ordering outcome identical (monotonic, unique; moveItem still renumbers 1..N).
- Snapshot shape unchanged → localStorage and `compositions.data` are byte-identical for the same run; share-link staleness logic untouched.
- ⚠️ Manual parity walk (clic-à-clic, desktop + mobile, FR + EN) NOT yet performed — no test runner exists and interactive dev can't be driven headlessly here. This is the remaining gate item before merge. Recommended: run `npm run dev`, open `/compo`, walk the parity checklist in Dev Notes, and load an existing `/compo/:id` saved before this change to confirm identical render.

### File List

- ADDED: `src/lib/compoGrids.js` (scoring/grid engine extracted from Compo)
- ADDED: `src/components/RunSaisie.jsx` (controlled saisie component)
- ADDED: `src/components/RunSaisie.module.css` (saisie styles, moved verbatim)
- MODIFIED: `src/pages/Compo.jsx` (consume `<RunSaisie>`, consolidated `run` state, scoring imported from compoGrids)
- MODIFIED: `src/pages/Compo.module.css` (saisie classes removed; page/score/save kept)

### Change Log

- 2026-06-19 — Extracted `<RunSaisie>` + `compoGrids.js` from `Compo.jsx`; Compo refactored to consume the controlled component. Behavior-preserving (lint: no new errors; build: clean). Manual UI parity verification pending.
