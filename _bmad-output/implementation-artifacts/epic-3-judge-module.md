---
baseline_commit: 170243d6d47ad1585177b3619852a61a66ad0f9c
---

# Epic 3 — Parcours d'entraînement juge (public)

Status: review

Stories 3.1 → 3.5 implemented together as one cohesive module (a single page with three internal phases: select → judge → correct), since they share one page and state machine. AC coverage tracked per story below.

## Story coverage

- **3.1 Nav + shell** — route `/judge` added to `App.jsx` (lazy/code-split, confirmed: `JudgeTraining-*.js` 9.49 kB chunk). Landing surface = the select phase. ✅ NOTE: the public navbar link was added then **removed at the user's request** (feature not yet launched) — the route is reachable by direct URL; re-add `{ to: '/judge', icon: 'check', label: tr.judge.nav }` to `Navbar.jsx` links when going live.
- **3.2 Selection** — difficulty chips (easy/medium/hard) + discipline chips (wakeboard/wakeskate/seated, tinted via `--disc`); on both chosen, calls `list_judge_runs(p_discipline, p_difficulty)`; lists published runs (metadata only); honest empty state (`jt.noRuns`); picking a run → judge phase. ✅
- **3.3 Judging** — desktop-first two-pane (video left sticky + saisie right; mobile stacked via `@media (max-width: 900px)`); `<RunSaisie>` fixed to `selectedRun.grid_key` (not switchable); standard `<video controls>`; NO score panel/computation; "Évaluer mon run" disabled until ≥1 element; video text-alt when unavailable. ✅
- **3.4 Eval + diff** — `src/lib/judgeDiff.js` (pure): position-aligned states correct/attr/order/missing/extra (+ mismatch = missing+extra), "autre" excluded, no /20. On "Évaluer": `get_judge_run_solution(p_id)` fetched on demand (solution never bundled), diff computed client-side. ✅
- **3.5 Correction** — `diff-two-pane` (Ta saisie | Solution) aligned by position, row tint per state mapped to existing tokens (success/danger/ws/accent2/faint), sticky legend, color paired with icon+label (tally markers) so color is never the sole signal; plain-language tally (no /20); video persists & scrubbable; "Recommencer" → select; bilingual fr/en via `tr.judge.*`. ✅

## Files

- ADDED: `src/lib/judgeDiff.js`
- ADDED: `src/pages/JudgeTraining.jsx` + `JudgeTraining.module.css`
- MODIFIED: `src/App.jsx` (public `/judge` route, lazy)
- MODIFIED: `src/components/Navbar.jsx` (nav item)
- MODIFIED: `src/i18n/translations.js` (`judge` nested block, fr + en)

## Validation

- `npm run lint` → 0 new errors (3 pre-existing in untouched files remain). Fixed during dev: catalogue effect moved all setState into the async IIFE (set-state-in-effect); `VideoPlayer` component-in-render converted to a `videoPane` JSX variable (cannot-create-components-during-render).
- `npx vite build` → clean; `/judge` code-split (JudgeTraining 9.49 kB + 5.03 kB CSS).

## Pending (human / runtime verification)

Requires the 2.1 + 2.2 SQL to be live AND at least one **published** `judge_run` to exist.

- Select a difficulty + discipline → published runs appear; empty combo shows the empty state.
- Pick a run → video plays; enter a run via the saisie (no score); "Évaluer" enabled once ≥1 element.
- Evaluate → solution revealed, diff aligned by position, tally counts correct; states read at a glance (missing loudest, extra quietest); video still scrubbable.
- "Recommencer" → back to selection.
- Mobile: panes stack, all states identical.
- Edge: a run with an external `video_url` plays (direct file URL assumed; YouTube-style embeds are out of scope for this pass).

## Notes / follow-ups

- External video: rendered with `<video src>` — works for direct file URLs; embed providers (YouTube/Vimeo) would need an iframe branch (not in scope; flag if needed).
- `judgeDiff` jib comparison is full-signature (no per-attribute "attr" state for jib passes — only figures get the amber attr state); acceptable per the matching rule, refine later if judges want finer jib feedback.
