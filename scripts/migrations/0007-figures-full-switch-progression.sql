-- Migration 0007 — progression héritée par les versions switch dans figures_full
--
-- Pourquoi : sur la page d'un trick switch, la section « Progression » et les
-- prérequis étaient vides. La cause : `built_on_figure`, `built_on_children`,
-- `prerequisites` et `base_figure` étaient calculés sur `f.id`, alors que ces
-- relations sont portées par la figure de BASE (la cible de `switch_of`), pas par
-- la version switch. Seules les vidéos étaient déjà partagées sur le groupe switch
-- via `coalesce(switch_of, id)` — d'où l'incohérence (vidéos OK, progression vide).
--
-- Correctif : on ancre ces 4 blocs sur la figure de base via un join
-- `bf = coalesce(f.switch_of, f.id)`. Pour une figure normale `bf = f` (comportement
-- inchangé) ; pour un switch, `bf` est sa base → la page switch hérite de toute la
-- progression. `switch_versions` / `switch_of_figure` restent sur `f.id` : la page
-- switch doit continuer d'afficher « Version switch de » et non lister des switchs.
--
-- `create or replace view` (PAS de drop) : la liste/ordre des colonnes est
-- inchangée (seules des sous-requêtes et le FROM changent) → les fonctions qui
-- retournent `setof figures_full` (search_figures…) survivent.
--
-- À exécuter dans l'éditeur SQL Supabase, APRÈS la migration 0006.
-- Mirroré dans : scripts/wakeref_post_restore.sql (source de vérité de la vue).

create or replace view figures_full as
select
  f.id, f.slug, f.name, f.sport, f.difficulty,
  f.description, f.description_en,
  f.tips, f.tips_en,
  f.is_switch, f.switch_of,
  f.built_on_id,
  f.contexts,
  f.approach,
  f.rotation,
  f.inverted,
  f.rewind,
  f.published, f.created_at, f.updated_at,
  c.name  as category_name,
  c.slug  as category_slug,
  c.color as category_color,
  case when f.switch_of is not null then
    (select json_build_object('id', o.id, 'name', o.name, 'slug', o.slug)
     from figures o where o.id = f.switch_of)
  end as switch_of_figure,
  -- Progression ancrée sur la figure de base (bf) : un switch hérite du « précédent ».
  case when bf.built_on_id is not null then
    (select json_build_object('id', b.id, 'name', b.name, 'slug', b.slug,
              'switch_names', (select string_agg(x.name, ', ' order by x.name)
                               from figures x where x.switch_of = b.id))
     from figures b where b.id = bf.built_on_id
       and b.switch_of is null)  -- pas de parent affiché si c'est lui-même un switch
  end as built_on_figure,
  coalesce(
    (select json_agg(json_build_object('id', s.id, 'name', s.name, 'slug', s.slug))
     from figures s where s.switch_of = f.id),
    '[]'
  ) as switch_versions,
  coalesce(
    (select json_agg(json_build_object('id', p.id, 'name', p.name, 'slug', p.slug))
     from prerequisites pr
     join figures p on p.id = pr.requires_id
     where pr.figure_id = bf.id),  -- prérequis de la base, hérités par le switch
    '[]'
  ) as prerequisites,
  coalesce(
    (select json_agg(
        json_build_object(
          'id', v.id, 'title', v.title, 'file_path', v.file_path,
          'source_type', v.source_type, 'source_url', v.source_url,
          'creator_name', v.creator_name, 'creator_url', v.creator_url,
          'caption', v.caption, 'performer_gender', v.performer_gender
        ) order by v.sort_order)
     from videos v
     where v.takedown_requested = false
       and v.figure_id in (
         -- figure courante + sa base/version switch (relation 1-à-1) :
         -- les vidéos sont partagées sur tout le groupe switch.
         select g.id from figures g
         where coalesce(g.switch_of, g.id) = coalesce(f.switch_of, f.id)
       )),
    '[]'
  ) as videos,
  -- Figures directement dérivées (built_on_id = figure de base) : le « +1 » de l'arbre.
  -- On exclut les switchs ; switch_names liste la/les version(s) switch de chaque nœud.
  coalesce(
    (select json_agg(json_build_object('id', n.id, 'name', n.name, 'slug', n.slug,
              'switch_names', (select string_agg(x.name, ', ' order by x.name)
                               from figures x where x.switch_of = n.id))
                     order by n.rotation, n.inverted, n.name)
     from figures n where n.built_on_id = bf.id
       and n.switch_of is null),
    '[]'
  ) as built_on_children,
  -- Champs de décomposition du trick (placés en fin de vue pour rester
  -- compatibles avec un CREATE OR REPLACE VIEW lors des migrations).
  f.spin,
  f.inverts,
  f.rewind_degs,
  f.rotation_type,
  -- Trick de base : racine de la chaîne built_on (le plus haut parent), depuis bf.
  (with recursive anc as (
     select b.id, b.name, b.slug, b.built_on_id
     from figures b where b.id = bf.built_on_id
     union all
     select p.id, p.name, p.slug, p.built_on_id
     from figures p join anc a on p.id = a.built_on_id
   )
   select json_build_object('id', a.id, 'name', a.name, 'slug', a.slug)
   from anc a where a.built_on_id is null
   limit 1
  ) as base_figure,
  f.tips_seated, f.tips_seated_en,
  f.tips_wakeskate, f.tips_wakeskate_en,
  f.sports
from figures f
left join categories c on c.id = f.category_id
-- Figure de base du groupe switch (bf = f pour une figure normale).
left join figures bf on bf.id = coalesce(f.switch_of, f.id);

alter view figures_full set (security_invoker = true);
