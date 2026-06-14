-- Migration 0001 — figure_views : compteur de vues par figure (buckets journaliers)
-- + section « Figures les plus consultées » de la home (fenêtre glissante 30j).
--
-- À exécuter UNE fois dans l'éditeur SQL Supabase.
-- Mirroré dans :
--   - scripts/wakeref_post_restore.sql  (index, RLS, policy, fonctions, grants — exécutable)
--   - scripts/wakeref_schema.sql        (la table — référence)

-- 1. Table : un bucket par (figure, jour) ; compteur incrémental léger.
create table if not exists public.figure_views (
  figure_id integer not null references figures(id) on delete cascade,
  day       date    not null default current_date,
  views     integer not null default 0,
  primary key (figure_id, day)
);

-- Index pour la requête de fenêtre glissante (filtre sur day).
create index if not exists figure_views_day_idx on public.figure_views (day);

-- 2. RLS : aucun accès direct anon. Lecture pour l'admin (authenticated).
--    Les écritures et le top public passent par les RPC security definer.
alter table public.figure_views enable row level security;

drop policy if exists "Lecture admin figure_views" on public.figure_views;
create policy "Lecture admin figure_views" on public.figure_views
  for select using ((select auth.role()) = 'authenticated');

-- 3. RPC : incrémente la vue du jour pour une figure. security definer pour
--    écrire malgré l'absence de grant direct anon (cf. compositions_rate_limit).
create or replace function public.track_figure_view(fig_id integer)
returns void
language sql security definer
set search_path = public as $$
  insert into figure_views (figure_id, day, views)
  select fig_id, current_date, 1
  where exists (select 1 from figures where id = fig_id)
  on conflict (figure_id, day) do update
    set views = figure_views.views + 1;
$$;

-- 4. RPC : top figures sur une fenêtre glissante (défaut 30j), ids ordonnés desc.
create or replace function public.most_viewed_figures(days integer default 30, lim integer default 5)
returns table(figure_id integer)
language sql stable security definer
set search_path = public as $$
  select fv.figure_id
  from figure_views fv
  join figures f on f.id = fv.figure_id
  where f.published
    and fv.day > current_date - days
  group by fv.figure_id
  order by sum(fv.views) desc
  limit lim;
$$;

-- 5. Grants : exécution des RPC pour le public et l'admin.
grant execute on function public.track_figure_view(integer)             to anon, authenticated;
grant execute on function public.most_viewed_figures(integer, integer)  to anon, authenticated;
