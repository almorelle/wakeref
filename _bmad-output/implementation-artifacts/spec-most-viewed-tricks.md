---
title: 'Home: most-viewed tricks section (rolling 30 days)'
type: 'feature'
created: '2026-06-14'
status: 'done'
baseline_commit: 'bd1c6d6423b806e9c41ca443f29bfecc4a0dbe6b'
context: ['{project-root}/_bmad-output/project-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The home's "Recent tricks" section surfaces the newest figures, not the ones riders actually look at — and page-view interest is recorded nowhere.

**Approach:** Track figure-detail page views in Supabase as daily buckets, then replace the home "Recent tricks" section with "Most viewed tricks" (top 5 over a rolling 30-day window), seeded once from the existing Vercel 30-day export.

## Boundaries & Constraints

**Always:**
- No auth: tracking and reads work for `anon`. Writes go through a `security definer` RPC (no direct anon table grant), mirroring the `compositions_rate_limit` pattern.
- Dedupe per browser: at most one counted view per figure per day via `localStorage`.
- Schema is hand-managed: deliver runnable SQL and mirror it into `scripts/wakeref_post_restore.sql` (executable) AND `scripts/wakeref_schema.sql` (reference). New table → RLS + grants; new RPCs → `set search_path = public` + explicit `grant execute`.
- i18n strings added in both `fr` and `en`.

**Ask First:**
- Before applying the SQL to the live Supabase (SQL editor or MCP).

**Never:**
- No per-view row logging — use daily aggregate buckets. No ranking of people; popularity is per-trick only (anti-ego invariant). No runtime dependency on Vercel (seed is one-time). Don't touch the "Last added videos" section.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| First view today | anon opens `/figures/:slug`, no localStorage flag | `track_figure_view` upserts today's bucket +1; flag set | RPC error swallowed; page unaffected |
| Repeat view same day | localStorage flag present | no RPC call | N/A |
| Home with data | ≥1 figure with views in last 30d | "Most viewed tricks" lists top ≤5, ordered desc | — |
| Home no data | no buckets in window | section not rendered (no empty header) | N/A |
| Seed ages out | seed bucket older than 30d | auto-excluded from window | N/A |

</frozen-after-approval>

## Code Map

- `scripts/migrations/0001-figure-views.sql` -- NEW: table + RLS + 2 RPCs + grants + index (run in Supabase SQL editor)
- `scripts/wakeref_post_restore.sql` -- mirror the executable objects (restore reproducibility)
- `scripts/wakeref_schema.sql` -- mirror table + functions in the reference dump
- `src/pages/FigureDetail.jsx` -- loads `figure` via `figures_full` by slug; add localStorage-deduped tracking effect on `figure.id`
- `src/pages/Home.jsx` -- currently fetches `recent` (figures_full by created_at) + renders `tr.recentFigures`; replace with most-viewed
- `src/i18n/translations.js` -- `recentFigures` (fr/en) used only by Home; add `mostViewedFigures`
- `scripts/seed-figure-views.js` -- NEW: convert Vercel CSV export → idempotent seed SQL (slug→id via subquery)

## Tasks & Acceptance

**Execution:**
- [x] `scripts/migrations/0001-figure-views.sql` -- create `figure_views(figure_id int references figures(id) on delete cascade, day date not null default current_date, views int not null default 0, primary key(figure_id, day))`; index on `(day)`; `enable row level security` + a select policy for `authenticated` only; RPC `track_figure_view(fig_id int)` `security definer` upserting `+1` on `(fig_id, current_date)`; RPC `most_viewed_figures(days int default 30, lim int default 5)` `security definer` returning `figure_id` ordered by `sum(views)` desc over `day > current_date - days`; `grant execute` both RPCs to `anon, authenticated` -- enables tracking + reads without exposing the table
- [x] `scripts/wakeref_post_restore.sql` -- append the same table / RLS / RPCs / grants / index
- [x] `scripts/wakeref_schema.sql` -- mirror the new table + functions in the reference dump
- [x] `src/pages/FigureDetail.jsx` -- after `figure` loads, if no localStorage flag for `<id>_<today>`, call `supabase.rpc('track_figure_view', { fig_id: figure.id })` then set the flag; swallow errors
- [x] `src/pages/Home.jsx` -- replace the `recent` state + fetch: call `supabase.rpc('most_viewed_figures')`, fetch `figures_full` for the returned ids, reorder by rank; render under `tr.mostViewedFigures`; keep hide-when-empty; leave the videos section intact
- [x] `src/i18n/translations.js` -- add `mostViewedFigures` (fr `'Figures les plus consultées'` / en `'Most viewed tricks'`); remove now-unused `recentFigures`
- [x] `scripts/seed-figure-views.js` -- read a Vercel export CSV with header `Page,Visitors,Total` (quoted paths); keep only rows whose `Page` matches `/figures/<slug>` (exclude `/figures` itself and non-figure paths); use the `Total` column (page views; switchable via a `METRIC` constant to `Visitors`); emit per row `insert into figure_views (figure_id, day, views) select id, current_date, <total> from figures where slug = '<slug>' on conflict (figure_id, day) do update set views = figure_views.views + excluded.views;` to stdout; CSV path passed as `argv[2]`; report kept/skipped counts to stderr (slugs are kebab-case so no quote-escaping needed, but assert no `'` in slug defensively)

**Acceptance Criteria:**
- Given an anon user opens a figure page for the first time today, when it loads, then that figure's today-bucket increments by exactly 1, and re-opening it the same day adds nothing.
- Given figures have views within 30 days, when the home loads, then the section after the WCT banner is "Most viewed tricks" listing ≤5 figures ordered by descending 30-day views, and "Last added videos" still renders unchanged.
- Given no views exist in the window, when the home loads, then the most-viewed section is not rendered.
- Given `npm run lint`, when it runs, then 0 errors / 0 warnings.

## Spec Change Log

## Design Notes

- Daily-bucket schema keeps writes O(1) per figure per day; the rolling window is `sum(views) where day > current_date - days`. The Vercel seed is one bucket per figure at `current_date`, which naturally expires after 30 days as organic data accrues.
- `most_viewed_figures` returns ids only; Home hydrates via `figures_full` (public read) and reorders client-side by rank — the same fetch-then-hydrate pattern Home already uses for the videos section.
- Seed unit note: the Vercel `Total` (raw page views) is a coarser unit than organic tracking (deduped ~once/browser/day), but the seed dominates only during its ≤30-day life and just sets initial ordering — acceptable for a best-effort popularity signal.
- Tracking effect (FigureDetail):
```
useEffect(() => {
  if (!figure?.id) return
  const k = `wakeref_viewed_${figure.id}_${new Date().toISOString().slice(0,10)}`
  if (localStorage.getItem(k)) return
  supabase.rpc('track_figure_view', { fig_id: figure.id })
    .then(() => localStorage.setItem(k, '1')).catch(() => {})
}, [figure?.id])
```

## Verification

**Commands:**
- `npm run lint` -- expected: 0 errors / 0 warnings
- `npm run dev` -- expected: after the SQL is applied, home shows "Most viewed tricks"; opening a figure then reloading reflects the increment

**Manual checks:**
- In Supabase SQL editor after the migration: `select track_figure_view(<id>);` then `select * from most_viewed_figures();` returns that id; confirm a direct `select * from figure_views` as `anon` is blocked by RLS.

## Suggested Review Order

**Schéma & RPC (entry point)**

- Contrat de lecture : top figures publiées sur fenêtre glissante (join + `where f.published`).
  [`0001-figure-views.sql:42`](../../scripts/migrations/0001-figure-views.sql#L42)

- Écriture publique : `security definer`, guard `where exists`, upsert bucket du jour.
  [`0001-figure-views.sql:30`](../../scripts/migrations/0001-figure-views.sql#L30)

- Table buckets journaliers (PK figure_id+day, FK on delete cascade).
  [`0001-figure-views.sql:10`](../../scripts/migrations/0001-figure-views.sql#L10)

**Écriture des vues (tracking)**

- Effet FigureDetail : flag localStorage optimiste (dédupe) + try/catch + RPC fire-and-forget.
  [`FigureDetail.jsx:86`](../../src/pages/FigureDetail.jsx#L86)

**Lecture & rendu (home)**

- Fetch RPC → réhydratation `figures_full` en conservant le classement.
  [`Home.jsx:33`](../../src/pages/Home.jsx#L33)

- Rendu de la section, masquée si vide.
  [`Home.jsx:183`](../../src/pages/Home.jsx#L183)

**Mirroring schéma (restore reproductibility)**

- post_restore : table + index + RLS + policy + fonctions + grants.
  [`wakeref_post_restore.sql:307`](../../scripts/wakeref_post_restore.sql#L307)

- schema.sql : table de référence.
  [`wakeref_schema.sql:100`](../../scripts/wakeref_schema.sql#L100)

**Périphérique (i18n & seed)**

- Libellé bilingue `mostViewedFigures` (fr/en), `recentFigures` retiré.
  [`translations.js:20`](../../src/i18n/translations.js#L20)

- Seed Vercel CSV → SQL idempotent (mapping par slug, métrique `Total`).
  [`seed-figure-views.js:55`](../../scripts/seed-figure-views.js#L55)
