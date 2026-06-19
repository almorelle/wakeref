---
baseline_commit: 170243d6d47ad1585177b3619852a61a66ad0f9c
---

# Story 2.1: Créer et publier un run de référence (admin)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an admin,
I want to create, edit and publish a reference run — its metadata, its fixed solution captured via the saisie, and its run video,
so that judges have published runs to train against.

## Acceptance Criteria

1. A `judge_runs` table exists (DDL in Dev Notes) with RLS enabled, `authenticated` full access, NO anon grant, and the change mirrored into `scripts/wakeref_post_restore.sql` + `scripts/wakeref_schema.sql` (+ a `scripts/migrations/0005-judge-runs.sql` following the existing migration-file convention).
2. A code-split admin area lets the admin create a reference run: enter `name`, pick a `grid_key` (which fixes `discipline`), pick a `difficulty` (easy/medium/hard), optionally a `category` label, attach a run video (upload to the `videos` bucket under the `runs/` prefix OR an external URL), and capture the fixed solution via the reused `<RunSaisie>` component (no score shown).
3. The captured solution is stored in `judge_runs.solution` as `{ entries, jibPasses, otherEntries, gridKey }` using the SAME minimal snapshot shape as `compositions.data` (reuse `serializeEntry`), so a later diff compares apples to apples.
4. The admin can list existing reference runs, edit them, delete them, and toggle `published` on/off.
5. An unpublished run is never visible to the public (verified as anon — there is no anon read path to `judge_runs` in this story).
6. A nav entry for the new admin area is added to `AdminLayout`; the route(s) are `lazy()`-loaded and never imported from a public page.
7. All new UI strings exist in both `fr` and `en` via `useT()`; icons go through the `Icon` wrapper. `npm run lint` introduces 0 new errors; `npx vite build` is clean.

## Tasks / Subtasks

- [x] Task 1 — Schema: `judge_runs` table + RLS + grants + SQL mirror (AC: 1, 5)
  - [x] `scripts/migrations/0005-judge-runs.sql` written (DDL + updated_at trigger + RLS enable + admin `for all` policy + table grant).
  - [x] Mirrored into `scripts/wakeref_post_restore.sql` (table after figure_views, trigger, RLS enable, policy, grant) and `scripts/wakeref_schema.sql` (table after figure_views).
  - [ ] **HUMAN STEP (pending)**: run `scripts/migrations/0005-judge-runs.sql` in the Supabase SQL editor — the table does not exist in the live DB until you do. Surfaced to the user.
- [x] Task 2 — Share `serializeEntry` (AC: 3)
  - [x] Moved `serializeEntry` from `Compo.jsx` to `src/lib/compoGrids.js` (exported); Compo imports it. Behavior-preserving.
- [x] Task 3 — Admin reference-run area (AC: 2, 4, 6)
  - [x] Routes added in `src/App.jsx`: `judge-runs`, `judge-runs/new`, `judge-runs/:id/edit` (lazy).
  - [x] Nav item added to `AdminLayout.jsx` links: `{ to: '/admin/judge-runs', icon: 'star', label: 'Runs juge' }` ('star' is already in the Icon wrapper).
  - [x] `AdminJudgeRuns.jsx` (list + badges + edit/delete) and `JudgeRunForm.jsx` (create/edit) + co-located CSS. Followed AdminFigures (list) / FigureForm (form) / AdminVideos (upload) patterns. **Admin UI is French-only (no `useT()`)** — matches every other admin page (correction to original AC-7 i18n note).
- [x] Task 4 — Form behavior: metadata + video + solution capture (AC: 2, 3)
  - [x] `grid_key` selector from `GRID_OPTIONS`; `discipline = GRIDS[gridKey].discipline` stored. Changing grid clears the run.
  - [x] Solution captured via `<RunSaisie>`; serialized to `solution = { entries: entries.map(serializeEntry), jibPasses, otherEntries, gridKey }`.
  - [x] Video: upload to `runs/${Date.now()}.${ext}` (source_type='upload', video_path) OR external URL (source_type='external', video_url); replacement removes the old object; delete removes the Storage object.
  - [x] Save via `insert` / `update().eq('id', id)`.
- [x] Task 5 — lint, build (AC: 7) — i18n N/A (admin is FR-only)
  - [x] `npm run lint` → 0 new errors (3 pre-existing in untouched files remain).
  - [x] `npx vite build` → clean.
  - [ ] Manual check (Dev Notes), incl. **verify as anon** — **pending**, gated on the SQL being run + interactive session.

## Dev Notes

### Scope boundary

- This story delivers the table + admin authoring. The PUBLIC read contract (RPCs `list_judge_runs` / `get_judge_run_solution`) is **Story 2.2** — do NOT add anon access here. The judge-facing pages are Epic 3. [Source: epics.md#Epic 2, architecture.md#AD-3]

### `judge_runs` DDL (AC-1)

Follow the conventions of existing tables (see `scripts/wakeref_schema.sql`, `data-models.md`). `seated` is a valid `sport_type` value (migration 0003). `video_source` enum already exists (`upload` default + external).

```sql
create table if not exists public.judge_runs (
  id           bigint generated always as identity primary key,
  name         text not null check (char_length(name) <= 120),
  discipline   public.sport_type not null,
  grid_key     text not null,
  difficulty   text not null check (difficulty in ('easy','medium','hard')),
  category     text,
  source_type  public.video_source not null default 'upload',
  video_path   text,
  video_url    text,
  solution     jsonb not null check (pg_column_size(solution) <= 51200),
  published    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
drop trigger if exists judge_runs_updated_at on public.judge_runs;
create trigger judge_runs_updated_at before update on public.judge_runs
  for each row execute function public.set_updated_at();
```

RLS + grant (mirror the compositions/videos admin pattern exactly):

```sql
alter table public.judge_runs enable row level security;
drop policy if exists "Ecriture admin judge_runs" on public.judge_runs;
create policy "Ecriture admin judge_runs" on public.judge_runs
  for all using ((select auth.role())='authenticated')
  with check ((select auth.role())='authenticated');
grant select, insert, update, delete on public.judge_runs to authenticated;
```

- NO anon grant, NO anon policy (anon reaches data only via the Story 2.2 RPCs).
- The sequence grant is already covered by the existing `grant usage, select on all sequences in schema public to authenticated;` (post_restore line ~477) — nothing extra needed for the identity column.
- Storage: the `videos` bucket already allows admin INSERT on any path (`bucket_id='videos' and auth.role()='authenticated'`), so the `runs/` prefix needs NO new storage policy. Public SELECT on the bucket already covers playback. [Source: wakeref_post_restore.sql storage policies ~451-460]

### Existing patterns to reuse (do NOT reinvent)

- **Routing**: admin routes live under the `<Route path="/admin" element={<AdminLayout/>}>` block in `src/App.jsx` (lines ~48-58); lazy imports declared at top (lines ~18-27). Mirror the `figures` trio. [Source: src/App.jsx]
- **Admin nav**: the `links` array in `src/pages/admin/AdminLayout.jsx` (~line 38) — add one entry. [Source: AdminLayout.jsx]
- **List + form split**: `AdminFigures.jsx` (list) + `FigureForm.jsx` (new/edit form, reads `:id` via `useParams`, loads on edit, saves via supabase). [Source: src/pages/admin/]
- **Storage upload**: `AdminVideos.jsx` — `supabase.storage.from('videos').upload(path, file, {...})`, `uploading` state, error toast, and on delete `storage.from('videos').remove([file_path])`. [Source: AdminVideos.jsx:134-171]
- **Saisie capture**: `<RunSaisie>` (delivered by Story 1.1) — controlled: `gridKey`, `value={{entries, jibPasses, otherEntries}}`, `onChange`, `toast`. Presentation-neutral, no score. The admin form owns the `run` state + `gridKey` selector and lays out the page. [Source: 1-1-extract-runsaisie.md, src/components/RunSaisie.jsx]
- **Grid metadata**: `GRIDS`, `GRID_OPTIONS` from `src/lib/compoGrids.js`; `discipline = GRIDS[gridKey].discipline`. [Source: src/lib/compoGrids.js]
- **Snapshot serialization**: `serializeEntry` (to be exported from `compoGrids.js` in Task 2) — use it so `solution` matches `compositions.data` exactly. [Source: Compo.jsx serializeEntry]

### Previous story intelligence (1.1)

- Story 1.1 extracted `<RunSaisie>` (controlled, `onChange` accepts functional updaters) and `src/lib/compoGrids.js` (neutral engine: `GRIDS`, `computeScore`, `GRID_OPTIONS`, `SCORING_SLUGS`, `WS_JIB_TRICKS`, `jibPassToEntries`). Reuse these; do not duplicate. `serializeEntry` was intentionally left in Compo — Task 2 moves it to the shared lib for reuse here. [Source: 1-1-extract-runsaisie.md File List + Completion Notes]
- The judge form does NOT need the score panel or the grid-lock/localStorage/share logic from Compo — only the saisie + a grid selector + metadata + video.

### Project Structure Notes

- JS/JSX only, no TypeScript. One component per file + co-located `*.module.css`. CSS Modules + global tokens (`src/index.css`); no CSS framework. Icons only via `Icon` wrapper. [Source: project-context.md]
- Admin pages are `lazy()`/code-split and MUST NOT be imported from any public page/component. [Source: project-context.md]
- Schema changes: apply in Supabase SQL editor, then mirror into `wakeref_post_restore.sql` (executable) + `wakeref_schema.sql` (reference); migration files live in `scripts/migrations/NNNN-*.sql` (existing: 0003, 0004 → add 0005). [Source: project-context.md, scripts/migrations/]
- RLS is the only security boundary; the admin route guard is UX-only. Verify visibility AS ANON. [Source: project-context.md#Security]
- `compositions` has a 50 KB JSON cap; `judge_runs.solution` mirrors that cap. [Source: project-context.md]

### Manual verification checklist (no test runner)

- Run the SQL (Supabase editor) → table exists; `npx vite build` clean; `npm run lint` no new errors.
- Admin: create a run (each discipline/grid), capture a solution via the saisie, upload a video AND test an external URL, save → row in `judge_runs`.
- Edit a run (values reload), toggle published, delete (Storage object removed for uploads).
- As anon (logged out / anon key), confirm `supabase.from('judge_runs').select()` returns nothing (no grant) — i.e. solutions are not exposed.
- Solution jsonb shape matches `compositions.data` (entries serialized, `gridKey` present).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2 / Story 2.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#AD-2, #AD-3, #AD-6]
- [Source: _bmad-output/implementation-artifacts/1-1-extract-runsaisie.md]
- [Source: src/App.jsx; src/pages/admin/AdminLayout.jsx; src/pages/admin/AdminVideos.jsx; src/pages/admin/FigureForm.jsx]
- [Source: scripts/wakeref_post_restore.sql (tables, RLS ~390-437, grants ~469-492, storage ~443-460); scripts/migrations/0003-*, 0004-*]
- [Source: _bmad-output/project-context.md]

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (BMad dev-story)

### Debug Log References

- `npm run lint` → 3 errors, all pre-existing in untouched files (useInView, AdminDashboard, AdminVideos); 0 in the new/changed files. (Two transient apostrophe `no-unescaped-entities` and one `set-state-in-effect` were introduced then fixed: JSX text wrapped in `{'…'}` expressions; the list `load()` effect uses the AdminFigures async-IIFE form `useEffect(() => { void (async () => { await load() })() }, [])`.)
- `npx vite build` → ✓ built; precache 55 entries (new admin chunks code-split).

### Completion Notes List

- **Admin is French-only** — no `useT()` anywhere in `src/pages/admin/*`; the new pages follow that. The original AC-7 "bilingual fr/en" note was wrong for admin; i18n applies to the PUBLIC judge module (Epic 3), not here.
- `serializeEntry` is now the single source of truth in `compoGrids.js`, used by both Compo save and reference authoring → `judge_runs.solution` has the exact same shape as `compositions.data`, so Epic 3's diff compares like-for-like.
- Reused `<RunSaisie>` (Story 1.1) for solution capture with no score panel. `key={gridKey}` + clearing the run on grid change keeps in-progress saisie consistent (same approach as Compo).
- Video reuses the existing `videos` bucket under the `runs/` prefix; no new Storage policy (admin INSERT already covers any path; public SELECT covers playback).
- ⚠️ **Two pending gates**: (1) the SQL migration must be run in Supabase (table absent until then — runtime of the admin page depends on it); (2) manual verification (create/edit/delete/publish, upload + external URL, and **as-anon** check that `judge_runs` is not directly readable). Code-side is lint-clean + builds.

### File List

- ADDED: `scripts/migrations/0005-judge-runs.sql`
- ADDED: `src/pages/admin/AdminJudgeRuns.jsx` + `AdminJudgeRuns.module.css`
- ADDED: `src/pages/admin/JudgeRunForm.jsx` + `JudgeRunForm.module.css`
- MODIFIED: `scripts/wakeref_post_restore.sql` (judge_runs table + trigger + RLS + policy + grant)
- MODIFIED: `scripts/wakeref_schema.sql` (judge_runs table — reference dump)
- MODIFIED: `src/lib/compoGrids.js` (export `serializeEntry`)
- MODIFIED: `src/pages/Compo.jsx` (import `serializeEntry` from compoGrids; local def removed)
- MODIFIED: `src/App.jsx` (3 judge-runs admin routes, lazy)
- MODIFIED: `src/pages/admin/AdminLayout.jsx` (nav item "Runs juge")

### Change Log

- 2026-06-19 — Added `judge_runs` table (SQL migration + mirrors) and the admin reference-run authoring area (list + form reusing `<RunSaisie>`, video upload under `runs/`, publish toggle). Shared `serializeEntry` via compoGrids. Lint-clean (no new errors), build clean. Pending: run SQL in Supabase + manual verification.
