-- Migration 0024 — competition_views : le compteur par fiche de compétition.
--
-- La migration 0023 comptait toutes les fiches sous un seul motif,
-- `/competitions/:id`, au motif que le slug d'URL est décoratif. Mais l'URL porte
-- aussi l'id, qui est stable : on peut donc compter chaque compétition sans
-- craindre qu'un renommage ouvre un second compteur. C'est la forme exacte de
-- `figure_views` (migration 0001), appliquée à l'agenda.
--
-- Toujours des VUES, pas des visiteurs : aucun identifiant, aucune IP, aucun
-- cookie ; un flag localStorage dédoublonne une fiche par jour et par navigateur.
--
-- À exécuter UNE fois dans l'éditeur SQL Supabase.
-- Mirroré dans :
--   - scripts/wakeref_post_restore.sql  (table, RLS, policy, fonctions, grants)
--   - scripts/wakeref_schema.sql        (la table — référence)

-- 1. Le compteur. `on delete cascade` : supprimer une compétition emporte son
--    historique de vues, comme pour les figures.
create table if not exists public.competition_views (
  competition_id bigint  not null references competitions(id) on delete cascade,
  day            date    not null default current_date,
  views          integer not null default 0,
  primary key (competition_id, day)
);

create index if not exists competition_views_day_idx on public.competition_views (day);

-- 2. RLS : rien pour anon, lecture pour l'admin.
alter table public.competition_views enable row level security;

drop policy if exists "Lecture admin competition_views" on public.competition_views;
create policy "Lecture admin competition_views" on public.competition_views
  for select using ((select auth.role()) = 'authenticated');

-- 3. GRANT de lecture. Une policy autorise des lignes, pas la table : sans cette
--    ligne, la RPC de lecture ci-dessous (qui n'est pas security definer) échoue
--    par « permission denied » — l'incident de figure_views, cf. 0022.
grant select on public.competition_views to authenticated;

-- 4. Écriture : security definer, et seulement pour une compétition PUBLIÉE.
--    Un id inventé ou un brouillon ne font rien et ne disent rien.
create or replace function public.track_competition_view(cid bigint)
returns void
language sql security definer
set search_path = public as $$
  insert into competition_views (competition_id, day, views)
  select cid, current_date, 1
  where exists (select 1 from competitions where id = cid and published)
  on conflict (competition_id, day) do update
    set views = competition_views.views + 1;
$$;

-- 5. Lecture admin : une ligne par compétition publiée, vues ou non — une fiche
--    que personne n'ouvre est une information. Pas de security definer (cf. 0022).
--    `date_precision` est renvoyée avec les dates : sans elle, une compétition
--    datée à l'année afficherait son 31 décembre de stockage.
create or replace function public.competition_view_stats()
returns table(
  competition_id bigint,
  name           text,
  date_start     date,
  date_end       date,
  date_precision text,
  tour_name      text,
  cancelled      boolean,
  views_30d      bigint,
  views_total    bigint
)
language sql stable
set search_path = public as $$
  select c.id, c.name, c.date_start, c.date_end, c.date_precision, c.tour_name, c.cancelled,
         coalesce(sum(cv.views) filter (where cv.day > current_date - 30), 0)::bigint,
         coalesce(sum(cv.views), 0)::bigint
  from competitions c
  left join competition_views cv on cv.competition_id = c.id
  where c.published
  group by c.id
  order by 9 desc, 8 desc, c.date_start;
$$;

grant execute on function public.track_competition_view(bigint) to anon, authenticated;
grant execute on function public.competition_view_stats()       to authenticated;

-- 6. Le motif agrégé de 0023 disparaît. La cascade de `page_views.path` efface
--    les lignes déjà écrites sous ce motif (import Vercel compris) : elles sont
--    remplacées par le détail par compétition, qu'on réimporte à part.
delete from public.page_routes where path = '/competitions/:id';
