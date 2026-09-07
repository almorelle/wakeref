---
title: 'Competitions: data foundation + admin CRUD (lot A)'
type: 'feature'
created: '2026-09-07'
status: 'done'
baseline_commit: 'a846118d45d7cc6be4ae8ca44bbd255d1dd76167'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The competitions agenda has no foundation — no table, no admin. Nothing can be entered, so the 2026 season archive (the feature's bootstrap capital, and the longest job in human time) cannot start.

**Approach:** Create `competitions` + `competition_videos` with RLS, and the admin CRUD to feed them. No public surface whatsoever — that is lot B.

## Boundaries & Constraints

**Always:**
- Schema is hand-managed: write `scripts/migrations/0016-competitions.sql` for **Alexis to run himself**, then mirror into `wakeref_post_restore.sql` + `wakeref_schema.sql`.
- RLS on both tables. `anon` reads only `published = true`. Admin policies use the sub-select form `(select auth.role()) = 'authenticated'` (evaluated once per query).
- Reuse what exists: the `set_updated_at()` trigger, the `videos` bucket (logo under a `competitions/` prefix, like `thumbnails/`), and the `AdminJudgeRuns`/`JudgeRunForm` pair as the structural model.
- Admin is French-only and lazy-loaded; never import an `admin/*` module from a public page.

**Ask First:**
- Creating a new Storage bucket, or any column beyond the frozen list below.
- Applying the migration to the database — that is Alexis's to run, never the agent's.

**Never:**
- No public page, no public route, no Navbar/Home entry, no `<SEO>` — lot B owns all of that.
- No status column (past/live/upcoming are derived from the date), no source column, no discipline column, no series/recurrence notion.
- No free-text field, therefore **no `_en` columns** — this feature's bilingualism is UI labels only, in lot B.
- No JSONB for the video links: they are relational rows that must be ordered and edited individually.

**Columns (the ceiling, not a starting point):** `name` · `date_start` · `date_end` (nullable — a one-day comp) · `date_precision` (`day` | `year`) · `wakepark` · `affiliation` (`federal` | `independent`) · `tour_name` · `tour_url` · `cancelled` · `info_url` · `entry_url` · `live_video_url` · `live_scoring_url` · `organiser_instagram_url` · `wakepark_url` · `logo_path` · `published` · `created_at` · `updated_at`. Constrained values are `text` + `CHECK`, never a PG enum (the `judge_runs.difficulty` pattern).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Precise comp | 12–14 June 2026, or a single day | `date_precision='day'`; `date_end` filled, or NULL for one day | N/A |
| Year-only comp | "there will be one in 2027" | `date_start='2027-01-01'`, `date_precision='year'`, `date_end` NULL; admin UI shows a year picker, not a day | N/A |
| Empty shell | Only a name + a year | Saves; every link NULL. Required: `name`, `date_start`, `date_precision`, `affiliation` | N/A |
| Cancelled | Admin clicks "annuler" | `cancelled=true`, row kept and listed; the button toggles back | N/A |
| New comp | Admin saves a creation | `published=true` by default — visible as soon as it exists | N/A |
| Anon reader | `select` as `anon` on either table | Only `published=true` comps, and only video rows whose parent is published | RLS (`exists(...)` on the parent), never client filtering |
| Logo upload | Admin picks an image | Uploaded to `videos/competitions/…`, path in `logo_path` | Replacing a logo removes the previous object |
| Delete comp | Admin deletes | Child video rows go with it (`on delete cascade`) | Storage object removed too |

</frozen-after-approval>

## Code Map

- `scripts/migrations/0016-competitions.sql` -- NEW, run by hand; mirrored into `wakeref_post_restore.sql` (policies §6, grants §8, trigger) and `wakeref_schema.sql` (tables)
- Models to follow: `admin/AdminJudgeRuns.jsx` (83 l., list), `admin/JudgeRunForm.jsx` (248 l., form), `admin/AdminVideos.jsx:153` (Storage `.upload()`/`.remove()`)
- `src/App.jsx` (lazy imports + three `/admin/competitions*` routes), `admin/AdminLayout.jsx:38-46` (sidebar)
- `CLAUDE.md` (Key tables) + `_bmad-output/project-context.md` (Data layer) -- record the new tables

## Tasks & Acceptance

**Execution:**
- [x] `scripts/migrations/0016-competitions.sql` -- create `competitions` + `competition_videos` (FK `on delete cascade`, `sort_order`), CHECKs on `date_precision` / `affiliation`, an index on `date_start`, RLS policies, grants, and the `set_updated_at` trigger -- the whole foundation in one runnable file
- [x] `scripts/wakeref_post_restore.sql` + `scripts/wakeref_schema.sql` -- mirror it -- a restore must rebuild the same state
- [x] `src/pages/admin/AdminCompetitions.jsx` + `.module.css` -- list sorted by `date_start` desc (name, dates, wakepark, cancelled/unpublished states) + create/edit/delete + the "annuler" toggle -- the entry point for entering the 2026 season
- [x] `src/pages/admin/CompetitionForm.jsx` + `.module.css` -- every column above, a `day`/`year` switch driving the date input, logo upload -- one screen per listing
- [x] `src/App.jsx` -- lazy imports + the three routes under the guarded `/admin` branch -- reachable
- [x] `src/pages/admin/AdminLayout.jsx` -- sidebar entry "Compétitions", next to "Parcours"
- [x] `CLAUDE.md` + `_bmad-output/project-context.md` -- document both tables + their RLS -- so the next agent doesn't re-derive them

**Acceptance Criteria:**
- Given a competition with `published=false`, when it is read as `anon`, then neither it nor its video rows are returned.
- Given a comp saved with `date_precision='year'`, when it is reloaded in the form, then the year input shows 2027 and no day is displayed anywhere.
- Given the "annuler" button is clicked twice, when the list reloads, then the row is back to its non-cancelled state and was never deleted.
- Given a logo is replaced, when the form is saved, then the previous Storage object no longer exists.
- Given `npm run lint`, when it runs, then no new error or warning outside the judging module (baseline: 9 errors / 7 warnings).

## Spec Change Log

**2026-09-07 — review iteration 1 (patches only, no re-derivation).** Three reviewers; `toast` stability, the `refresh` icon and `confirm()` were each claimed as findings and each verified false. `published = true` by default and `authenticated = admin` are the human's own decisions, left alone.
- *Data loss #1 (all three reviewers): the old logo was removed from Storage BEFORE the row was written.* A failed save destroyed the object while `logo_path` still pointed at it, unrecoverably. Reordered: write the row, then remove — and on a failed write, remove the object just uploaded so it can't orphan. Same inversion fixed in the list's delete.
- *Data loss #2 (edge-case hunter): the child-video load discarded its `error`.* A transient failure rendered "no videos", and the next save — a wholesale replace — deleted every link and reported success. The error is now surfaced and blocks saving.
- *Data loss #3 (edge-case + blind): the URL input had no `maxLength` against a `CHECK(<= 500)`.* One over-long link rejected the whole batch insert **after** the delete had committed. Client-side validation now runs before anything is deleted, and `maxLength` matches every CHECK.
- *Invariant hole (all three): flipping precision to "year" did not normalize `date_start` to Jan 1* — the year input's `onChange` never fires when the displayed year is already right. Normalized in the payload, and now enforced by a DB CHECK (`competitions_year_is_jan1`) rather than trusting the form.
- *Unusable input (blind, critical): the year field round-tripped every keystroke through `padStart(4,'0')`* — typing "2" showed "0002". The year now lives in its own state and is composed into a date only at save.
- *Security (blind): no URL scheme constraint.* `type="url"` accepts `javascript:`, and lot B will render these as `href`. Added `~* '^https?://'` CHECKs on all eight URL columns — in the DB, the only real boundary.
- Also fixed: an editable blank form on a failed load (it would overwrite the real row), the RLS subquery's unqualified `competition_id`, `create table if not exists` → `create table` (a silent no-op on a pre-existing table would apply policies to the wrong shape), missing length CHECKs on nine columns, a dead mobile media query, index-as-key on removable rows, a non-deterministic list order, a toggle that reported success on zero rows written, a list that showed "empty" on a failed load, no way to clear a logo, the malformed `wakeref_schema.sql` seam, and doc claiming "no free text" when `name`/`wakepark`/`tour_name` are exactly that.
- **KEEP on any re-derivation:** Storage writes ordered after the row write; validation before any destructive delete; DB CHECKs as the enforcement point rather than the form; the year held as its own state.

## Verification

**Commands:**
- `npm run lint` -- expected: baseline unchanged
- `npm run dev` -- expected: the three admin routes render, create/edit/delete/cancel all round-trip

**Manual checks:**
- Alexis runs `scripts/migrations/0016-competitions.sql` in the Supabase SQL editor before any UI test — the agent must not.
- Read `competitions` from a private window (anon): an unpublished row must be invisible. This is the one check that cannot be done as the logged-in admin.

## Suggested Review Order

**Start here: the migration you have to run**

- The whole foundation in one file; the header documents what is deliberately *absent* and why.
  [`0016-competitions.sql:23`](../../scripts/migrations/0016-competitions.sql#L23)

- The invariant no longer trusted to the form: year precision forces Jan 1st.
  [`0016-competitions.sql:50`](../../scripts/migrations/0016-competitions.sql#L50)

- URL scheme CHECKs — `type="url"` accepts `javascript:`, and lot B renders these as `href`.
  [`0016-competitions.sql:56`](../../scripts/migrations/0016-competitions.sql#L56)

**Security boundary (RLS is the only one)**

- A video row is readable only if its parent competition is published.
  [`0016-competitions.sql:110`](../../scripts/migrations/0016-competitions.sql#L110)

**The order of operations that the review caught**

- Row written first, old Storage object removed only after; upload rolled back on failure.
  [`CompetitionForm.jsx:120`](../../src/pages/admin/CompetitionForm.jsx#L120)

- Video links validated before anything is deleted — the delete/insert is not transactional.
  [`CompetitionForm.jsx:91`](../../src/pages/admin/CompetitionForm.jsx#L91)

- A failed child load blocks saving instead of silently wiping every link.
  [`CompetitionForm.jsx:66`](../../src/pages/admin/CompetitionForm.jsx#L66)

**Date handling**

- The year lives in its own state; the Jan-1st date is composed only at save.
  [`CompetitionForm.jsx:46`](../../src/pages/admin/CompetitionForm.jsx#L46)

- Shared with lot B, with a dev-only guard against a `select` that forgets `date_precision`.
  [`competitionDates.js:33`](../../src/lib/competitionDates.js#L33)

**Admin surface**

- List: cancellation is a reversible toggle, deletion is the only destructive act.
  [`AdminCompetitions.jsx:36`](../../src/pages/admin/AdminCompetitions.jsx#L36)
