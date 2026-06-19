---
stepsCompleted: [1]
inputDocuments:
  - _bmad-output/planning-artifacts/ux-designs/ux-wakeref-2026-06-19/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-wakeref-2026-06-19/EXPERIENCE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-wakeref-2026-06-19/.decision-log.md
  - _bmad-output/project-context.md
  - docs/data-models.md
  - docs/api-contracts.md
  - docs/architecture.md
workflowType: 'architecture'
project_name: 'wakeref'
user_name: 'Wushu'
date: '2026-06-19'
feature: 'Judge Training module — reference-solution data model'
prd: 'none (design-first; UX package + decision log substitute as the requirements source)'
---

# Architecture Decision Document — Judge Training (reference solution model)

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## AD-0 — Scope & inputs

Designing the data model + access contract for the Judge Training module's **reference solution**. Requirements source: the UX package (`DESIGN.md`, `EXPERIENCE.md`, `.decision-log.md` D1–D9) — no formal PRD (design-first, user-approved substitution). Everything stays inside WakeRef's existing constraints: Supabase Postgres, **RLS + grants + RPCs are the only API**, no custom server, hand-managed schema mirrored into `scripts/wakeref_post_restore.sql` (executable) + `scripts/wakeref_schema.sql` (reference dump).

## AD-1 — Diff location & "no-peek" enforcement (DECIDED)

**Decision: client-side diff; reference fetched on submit via a `security definer` RPC; solution never bundled during saisie. "No-peek" is intentionally soft.**

- Rationale: the solution is revealed post-submit anyway (D6), so the only requirement is "don't ship it before the judge clicks Évaluer." This is a no-stakes self-training tool (not the official exam); a determined console user could fetch early — accepted by the user.
- Most optimized path: one small RPC fetch at submit (jsonb ≈ a composition, <50 KB), diff computed in JS reusing Compo entry structures. No server compute, no Edge Function (avoids cold starts), no PL/pgSQL re-implementation of the comparison.

## AD-2 — `judge_runs` table (reference solution)

New standalone table. A full-run reference is NOT a `videos` row: the `videos` table is figure-scoped (`figure_id NOT NULL`, per-trick), whereas a run video is a distinct asset. The run video reference lives on `judge_runs` directly.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `integer` PK (serial) | admin-managed, like `figures`. (uuid optional; not needed since no-peek is soft) |
| `name` | `text` | label, e.g. "Run wakeboard medium #3"; CHECK length ≤ 120 |
| `discipline` | `sport_type` | `wakeboard` \| `wakeskate` \| `seated` — drives the selection filter chip. Enum confirmed to include `seated` (migration `0003-video-sport-gender.sql:15`) |
| `grid_key` | `text` | the Compo grid id (`wakeboard`/`wakeskate`/`seated_mp1`/`seated_mp5`) — fixes the saisie engine + sport filter for this run |
| `difficulty` | `text` | bucket: `easy` \| `medium` \| `hard` (CHECK). Stored directly — the bucket→category mapping is product logic that may evolve |
| `category` | `text` | optional display label of the competition category (U11, U14, O30…) |
| `source_type` | `video_source` | reuse existing enum: `upload` (Storage) vs external |
| `video_path` | `text` | Storage path in the existing `videos` bucket, new prefix `runs/<id>...` (upload case) |
| `video_url` | `text` | external video URL (non-upload case) |
| `solution` | `jsonb` NOT NULL | snapshot `{ entries, jibPasses, gridKey }` — same shape as `compositions.data`. CHECK `pg_column_size(solution) <= 51200` |
| `published` | `boolean` | default `false` — only published runs surface in the catalog (admin can draft) |
| `created_at`, `updated_at` | `timestamptz` | `updated_at` via the existing `set_updated_at()` trigger |

## AD-3 — Access contract (RPC pair — the WakeRef idiom)

Anon never touches the base table. Two `security definer` functions (mirroring `get_composition` / `search_figures`), both pinning `set search_path = public`, both `grant execute` to `anon, authenticated`:

- **`list_judge_runs(p_discipline text, p_difficulty text)`** → `setof` run **metadata only** (id, name, discipline, grid_key, difficulty, category, source_type, video_path, video_url) WHERE `published = true`. Powers the Selection catalog. **Excludes `solution`.**
- **`get_judge_run_solution(p_id integer)`** → `table(grid_key text, solution jsonb)` for one published run. Called only at "Évaluer mon run". This is the on-demand reveal.

RLS on `judge_runs`: enable RLS; **admin (`authenticated`) full access**; **no anon table grant at all** (anon reaches data only through the two RPCs). Consistent with `compositions` (anon reads via `get_composition`, cannot list).

> Note: this differs from the `figures_full` security_invoker pattern on purpose — here the RPCs are `security definer` and self-filter `published = true`, so the solution column is structurally unreachable by anon. Document the rationale next to the function defs.

## AD-4 — Diff logic (client, new lib)

New `src/lib/judgeDiff.js` (placed like `src/lib/trickDecomposition.js`). Input: judge saisie (`entries` + `jibPasses`) and reference (`entries` + `jibPasses`), both for the same `grid_key`. Output: per-position diff states (`correct` / `missing` / `extra` / `attr` / `order`) per EXPERIENCE.md State Patterns.

- Matching rule (D8): correct = exact trick (slug) + approach + side + rotation + position. Free-text "autre" entries are **excluded** from the diff (never missing/extra/attr).
- Order detection: a right trick present at the wrong position → `order`. Needs a position-aligned comparison with a secondary "present elsewhere" pass; exact algorithm is a dev-story concern, not an architecture blocker.
- No `/20` score is computed anywhere (the GRIDS scoring engine is not invoked in this module).

## AD-5 — Compo saisie reuse (refactor risk — flagged)

EXPERIENCE.md requires the saisie UI without the score calculator. `Compo.jsx` (~1125 lines) currently keeps the saisie **inline** in the page, intertwined with `computeScore`/`score20`, the grid/score panel, the `gridKey` selector, and composition save/load via `useParams`. The only already-extracted pieces are `JibForm`, `OtherForm`, `OptBtn`.

**Architecture action: extract a presentation-neutral `<RunSaisie>` component** (entry list + add modes jib/kicker/air_trick/flat + side + search + JibForm/OtherForm, driven by `gridKey`, exposing `value`/`onChange` over `{entries, jibPasses}`). Consumed by BOTH Compo (with its score panel) and the judge module (without).

**Hard constraint — must not degrade Compo's responsiveness.** Compo is significantly more responsive than the desktop-first judge page; that responsiveness must be preserved. Therefore:

- `<RunSaisie>` owns ONLY the saisie's own (existing) styles, moved **verbatim** from `Compo.module.css`. It must not set its own width, grid, or breakpoints — it adapts to whatever container it's placed in.
- **Page layout stays in each consumer.** Compo keeps its current layout + score panel + responsive behavior; the judge page provides its own desktop-first two-pane layout and drops `<RunSaisie>` into the right pane. The judge feature's desktop-first choices live in the judge page CSS, never in the component, so nothing leaks back into Compo.
- **Behavior-preserving refactor**: the extraction story only moves JSX/state/CSS — Compo must look and behave identically (desktop AND mobile) before/after. Verify parity manually via `npm run dev` (no test runner) as its own isolated story, BEFORE building the judge module on top.

This refactor is the main implementation risk (large central file) — scope it as the first story, gated on Compo parity.

## AD-6 — Storage & schema management

- Run videos go in the existing public `videos` bucket under a new `runs/` prefix; public SELECT already covers playback, admin-only upload/remove (existing bucket policies). Optional thumbnail convention reusable.
- Mirror all of the above into `scripts/wakeref_post_restore.sql` (table + RLS + grants + the two RPCs + trigger) AND `scripts/wakeref_schema.sql`. New table → `enable row level security` + policies + grants; new RPCs → `security definer` + `set search_path = public` + `grant execute`. (project-context.md data-layer rules.)
- Admin authoring UI: a new `admin/*` page to create a `judge_run` — reuses the extracted saisie component to capture the reference, plus the run-video upload. Code-split like other admin pages.
