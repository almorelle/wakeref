---
baseline_commit: 170243d6d47ad1585177b3619852a61a66ad0f9c
---

# Story 2.2: Contrat de lecture public sécurisé (RPC)

Status: review

## Story

As the public judge module,
I want to list published reference runs by discipline + difficulty and fetch one run's solution only on demand,
so that the catalogue is browsable without ever exposing solutions ahead of evaluation.

## Acceptance Criteria

1. `list_judge_runs(p_discipline text, p_difficulty text)` returns published runs matching the filters, **metadata only** (id, name, discipline, grid_key, difficulty, category, source_type, video_path, video_url) and NEVER the `solution`. `security definer`, `set search_path = public`, granted execute to `anon` + `authenticated`.
2. `get_judge_run_solution(p_id bigint)` returns `(grid_key, solution)` for one **published** run only (nothing for unpublished/unknown ids). `security definer`, `set search_path = public`, granted execute to `anon` + `authenticated`.
3. Anon still has NO table grant on `judge_runs` (from Story 2.1) — data is reachable only through these two functions; the solution column is unreachable via any table query.
4. Both functions mirrored into `scripts/wakeref_post_restore.sql` (executable) and shipped as `scripts/migrations/0006-judge-runs-rpc.sql` to run in the Supabase SQL editor. (Functions are not in `wakeref_schema.sql` — that dump is tables-only.)

## Tasks / Subtasks

- [x] Task 1 — Write the two functions + grants (AC: 1, 2, 3)
  - [x] `list_judge_runs` (metadata only, published, nullable filters via text compare to avoid enum-cast errors).
  - [x] `get_judge_run_solution` (published-only, returns grid_key + solution).
  - [x] `grant execute` to `anon, authenticated` for both.
- [x] Task 2 — Mirror (AC: 4)
  - [x] `scripts/migrations/0006-judge-runs-rpc.sql` (to run in Supabase).
  - [x] Mirror functions near the other RPCs and grants in `scripts/wakeref_post_restore.sql`.
  - [ ] **HUMAN STEP (pending)**: run `0006-judge-runs-rpc.sql` in the Supabase SQL editor.

## Dev Notes

- Pattern copied from `get_composition` (security definer SQL fn, anon execute, no table grant) — `api-contracts.md` / `wakeref_post_restore.sql`.
- **Soft no-peek (accepted, AD-1)**: anon can call `get_judge_run_solution(id)` for any published id even before submitting a saisie. This is fine for a no-stakes training tool; the point is the solution is not bundled and the catalogue (`list_judge_runs`) never carries it.
- `discipline` filter compares `discipline::text = p_discipline` so an arbitrary text param never raises an enum cast error; `null` param = no filter on that axis.
- No `wakeref_schema.sql` change (functions live in post_restore; schema dump is tables-only). [Source: data-models.md]
- Consumed by Epic 3 (Selection calls `list_judge_runs`; Evaluation calls `get_judge_run_solution`).

### References

- [Source: epics.md#Epic 2 / Story 2.2; architecture.md#AD-3]
- [Source: scripts/wakeref_post_restore.sql get_composition ~201-205, grants ~478-492]
- [Source: 2-1-create-publish-reference-run.md (table + RLS, no anon grant)]

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (BMad dev-story, inline)

### Completion Notes List

- Two `security definer` functions added; both `set search_path = public`, `stable`, granted to `anon, authenticated`. Anon reaches `judge_runs` ONLY through these (no table grant). `list_judge_runs` projects metadata columns (no `solution`); `get_judge_run_solution` returns the solution for a published id on demand.
- ⚠️ Pending: run `scripts/migrations/0006-judge-runs-rpc.sql` in Supabase, then verify (Dev Notes verification below). The PostgREST RPC cache may need a moment / a schema reload to expose the new functions.

### Verification (manual, after running the SQL)

- As anon: `supabase.rpc('list_judge_runs', { p_discipline: 'wakeboard', p_difficulty: 'medium' })` returns only published wakeboard/medium runs, with NO `solution` field.
- As anon: `supabase.rpc('get_judge_run_solution', { p_id: <published id> })` returns `{ grid_key, solution }`; for an unpublished id returns nothing.
- As anon: `supabase.from('judge_runs').select()` still returns nothing (no table grant).

### File List

- ADDED: `scripts/migrations/0006-judge-runs-rpc.sql`
- MODIFIED: `scripts/wakeref_post_restore.sql` (two RPCs + grants)

### Change Log

- 2026-06-19 — Added `list_judge_runs` + `get_judge_run_solution` (security definer, anon execute) + mirror. Pending SQL run + verification.
