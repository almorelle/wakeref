-- Migration 0002 — figures_card : vue légère pour les listes de cartes
-- (home most-viewed / vidéos récentes, catalogue /figures), sans aucun des
-- agrégats JSON coûteux de figures_full. Les RPC de listes renvoient désormais
-- ces colonnes directement → suppression des waterfalls « rpc → figures_full.in(ids) ».
--
-- À exécuter UNE fois dans l'éditeur SQL Supabase, APRÈS la migration 0001.
-- Mirroré dans :
--   - scripts/wakeref_post_restore.sql  (vue, fonctions, grants — exécutable)
--   - scripts/wakeref_schema.sql        (dump tables — non concerné, pas de vue)

-- 1. Vue légère : strictement les colonnes affichées par FigureCard.
drop view if exists figures_card cascade;
create view figures_card as
select f.id, f.slug, f.name, f.sport, f.difficulty, f.contexts,
       c.name as category_name, c.slug as category_slug
from figures f
left join categories c on c.id = f.category_id;

alter view figures_card set (security_invoker = true);
grant select on figures_card to anon, authenticated;

-- 2. most_viewed_figures : renvoie les cartes ordonnées par vues desc, prêtes à
--    afficher. Change de type de retour → drop + recreate obligatoire.
drop function if exists public.most_viewed_figures(integer, integer);
create function public.most_viewed_figures(days integer default 30, lim integer default 5)
returns setof figures_card
language sql stable security definer
set search_path = public as $$
  with top as (
    select fv.figure_id, sum(fv.views) as v
    from figure_views fv
    join figures f on f.id = fv.figure_id
    where f.published
      and fv.day > current_date - days
    group by fv.figure_id
    order by v desc
    limit lim
  )
  select c.* from top
  join figures_card c on c.id = top.figure_id
  order by top.v desc;
$$;
grant execute on function public.most_viewed_figures(integer, integer) to anon, authenticated;

-- 3. recent_video_figures : figures dont la vidéo (hors retrait) est la plus
--    récente, prêtes à afficher. Remplace l'ancien waterfall de la home.
create or replace function public.recent_video_figures(lim integer default 5)
returns setof figures_card
language sql stable
set search_path = public as $$
  with recent as (
    select v.figure_id, max(v.uploaded_at) as last_up
    from videos v
    where v.takedown_requested = false
    group by v.figure_id
    order by last_up desc
    limit lim
  )
  select c.* from recent
  join figures_card c on c.id = recent.figure_id
  order by recent.last_up desc;
$$;
grant execute on function public.recent_video_figures(integer) to anon, authenticated;
