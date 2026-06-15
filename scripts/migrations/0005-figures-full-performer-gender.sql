-- Migration 0005 — exposer performer_gender dans figures_full
--
-- Pourquoi : le quiz tire ses questions depuis figures_full et n'avait pas accès
-- au genre de la vidéo montrée. On l'ajoute au json des vidéos pour alimenter
-- l'échantillonnage équilibré femme/homme du quiz (parité garantie par session).
--
-- `create or replace view` (PAS de drop) : on ne change aucune colonne de la vue,
-- seulement le contenu du json_build_object des vidéos → les fonctions qui
-- retournent `setof figures_full` survivent.
--
-- À exécuter dans l'éditeur SQL Supabase, APRÈS la migration 0004.
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
  case when f.built_on_id is not null then
    (select json_build_object('id', b.id, 'name', b.name, 'slug', b.slug,
              'switch_names', (select string_agg(x.name, ', ' order by x.name)
                               from figures x where x.switch_of = b.id))
     from figures b where b.id = f.built_on_id
       and b.switch_of is null)
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
     where pr.figure_id = f.id),
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
         select g.id from figures g
         where coalesce(g.switch_of, g.id) = coalesce(f.switch_of, f.id)
       )),
    '[]'
  ) as videos,
  coalesce(
    (select json_agg(json_build_object('id', n.id, 'name', n.name, 'slug', n.slug,
              'switch_names', (select string_agg(x.name, ', ' order by x.name)
                               from figures x where x.switch_of = n.id))
                     order by n.rotation, n.inverted, n.name)
     from figures n where n.built_on_id = f.id
       and n.switch_of is null),
    '[]'
  ) as built_on_children,
  f.spin,
  f.inverts,
  f.rewind_degs,
  f.rotation_type,
  (with recursive anc as (
     select b.id, b.name, b.slug, b.built_on_id
     from figures b where b.id = f.built_on_id
     union all
     select p.id, p.name, p.slug, p.built_on_id
     from figures p join anc a on p.id = a.built_on_id
   )
   select json_build_object('id', a.id, 'name', a.name, 'slug', a.slug)
   from anc a where a.built_on_id is null
   limit 1
  ) as base_figure
from figures f
left join categories c on c.id = f.category_id;

alter view figures_full set (security_invoker = true);
