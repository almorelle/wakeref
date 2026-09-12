-- Migration 0022 — lecture longue de figure_views : les RPC de /admin/vues.
--
-- Le compteur existe depuis la migration 0001 et on ne le purge pas (décision
-- du 2026-06-16, tracée dans _bmad-output/implementation-artifacts/deferred-work.md) :
-- l'historique s'accumule donc depuis la mise en service, mais rien ne le lisait
-- au-delà des 5 ids que `most_viewed_figures` rend à la home. Ces quatre
-- fonctions ouvrent cette réserve à l'admin, sans rien changer à l'écriture.
--
-- SÉCURITÉ — à l'inverse des RPC publiques du projet, aucune n'est
-- `security definer` : elles s'exécutent avec les droits de l'appelant, donc la
-- policy « Lecture admin figure_views » (authenticated) s'applique telle quelle.
-- Un `anon` qui les appellerait lirait une table vide plutôt que des stats. Le
-- grant ne va d'ailleurs qu'à `authenticated`. Ne pas les passer en definer :
-- ce sont des données de fréquentation, pas du contenu public.
--
-- À exécuter UNE fois dans l'éditeur SQL Supabase.
-- Mirroré dans :
--   - scripts/wakeref_post_restore.sql  (exécutable)
--   - scripts/wakeref_schema.sql        (référence — la table n'y change pas)

-- 0. LE PRIVILÈGE, sans lequel tout le reste échoue par
--    « permission denied for table figure_views ».
--
--    La migration 0001 a créé la policy « Lecture admin figure_views », mais une
--    policy RLS autorise des LIGNES — elle ne donne pas le droit SQL de lire la
--    TABLE. Les deux sont nécessaires, et seul `wakeref_post_restore.sql` portait
--    le grant, c'est-à-dire un fichier qu'on ne joue qu'en restauration : la base
--    de production ne l'a jamais reçu. Personne ne s'en est aperçu parce que
--    `most_viewed_figures` est `security definer` et lit avec les droits du
--    propriétaire, contournant à la fois la policy et le grant absent. Les
--    fonctions ci-dessous sont les premières à lire cette table avec les droits
--    de l'appelant : elles ont révélé le trou.
grant select on public.figure_views to authenticated;

-- 1. Cartouche de tête : les totaux et, surtout, la profondeur réelle de
--    l'historique. `first_day` est ce qui distingue « personne n'est venu » de
--    « on ne mesurait pas encore » — sans lui, un mois vide est illisible.
create or replace function public.view_stats_totals()
returns table(
  views_30d       bigint,
  views_365d      bigint,
  views_total     bigint,
  first_day       date,
  last_day        date,
  figures_tracked bigint
)
language sql stable
set search_path = public as $$
  select
    coalesce(sum(views) filter (where day > current_date - 30),  0)::bigint,
    coalesce(sum(views) filter (where day > current_date - 365), 0)::bigint,
    coalesce(sum(views), 0)::bigint,
    min(day),
    max(day),
    count(distinct figure_id)::bigint
  from figure_views;
$$;

-- 2. Série mensuelle. `generate_series` produit les mois vides : un trou dans
--    la courbe est une information, une absence de barre serait un mensonge par
--    omission. Les mois antérieurs à la première mesure sont écartés par
--    l'appelant, qui connaît `first_day`.
create or replace function public.views_by_month(months integer default 12)
returns table(month date, views bigint)
language sql stable
set search_path = public as $$
  select m.month::date,
         coalesce(sum(fv.views), 0)::bigint
  from generate_series(
         date_trunc('month', current_date) - ((greatest(months, 1) - 1) || ' months')::interval,
         date_trunc('month', current_date),
         interval '1 month'
       ) as m(month)
  left join figure_views fv on date_trunc('month', fv.day) = m.month
  group by m.month
  order by m.month;
$$;

-- 3. Top figures sur une fenêtre glissante. Distinct de `most_viewed_figures`,
--    qui ne rend que des ids et ne sert que la home : ici on veut le nom, le
--    total, et AUSSI les figures non publiées — une page dépubliée qui continue
--    d'être visitée est précisément ce qu'un admin doit voir.
create or replace function public.top_viewed_figures(days integer default 30, lim integer default 10)
returns table(
  figure_id integer,
  name      text,
  slug      text,
  sport     text,
  published boolean,
  views     bigint
)
language sql stable
set search_path = public as $$
  select f.id, f.name, f.slug, f.sport::text, f.published, sum(fv.views)::bigint
  from figure_views fv
  join figures f on f.id = fv.figure_id
  where fv.day > current_date - greatest(days, 1)
  group by f.id, f.name, f.slug, f.sport, f.published
  order by sum(fv.views) desc, f.name
  limit greatest(lim, 1);
$$;

-- 4. L'angle mort : les figures publiées que personne n'a ouvertes sur la
--    fenêtre. `not exists` plutôt qu'un `left join ... is null` — l'index
--    (figure_id, day) de la PK suffit et la lecture est plus directe.
create or replace function public.never_viewed_figures(days integer default 365)
returns table(
  figure_id integer,
  name      text,
  slug      text,
  sport     text
)
language sql stable
set search_path = public as $$
  select f.id, f.name, f.slug, f.sport::text
  from figures f
  where f.published
    and not exists (
      select 1 from figure_views fv
      where fv.figure_id = f.id
        and fv.day > current_date - greatest(days, 1)
    )
  order by f.name;
$$;

-- 5. Grants : l'admin seul. Pas d'`anon` ici, contrairement aux autres RPC.
grant execute on function public.view_stats_totals()                    to authenticated;
grant execute on function public.views_by_month(integer)                to authenticated;
grant execute on function public.top_viewed_figures(integer, integer)   to authenticated;
grant execute on function public.never_viewed_figures(integer)          to authenticated;
