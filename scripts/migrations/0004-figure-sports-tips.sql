-- Migration 0004 — appartenance multi-discipline + tips override par discipline
--
-- Pourquoi : `figures.sport` (singulier) reste la discipline NATIVE (badge, SEO,
-- sport par défaut des vidéos), mais une figure peut être PRATICABLE dans
-- plusieurs disciplines même sans contenu (vidéo/tips) encore existant. On veut
-- qu'un rider seated trouve toutes les figures possibles → appartenance EXPLICITE
-- et curée `figures.sports` (jamais dérivée du contenu), source de vérité du
-- filtre catalogue. Les tips deviennent facettables : `tips`/`tips_en` = jeu par
-- défaut (discipline native), `tips_<discipline>` = OVERRIDE rempli uniquement
-- s'il diverge.
--
-- À exécuter dans l'éditeur SQL Supabase, APRÈS la migration 0003 (qui ajoute la
-- valeur d'enum `seated`), dans l'ordre des sections (autocommit) : l'étape 3
-- (check) suppose le backfill de l'étape 2.
-- ⚠️ Ordre de déploiement : appliquer cette migration AVANT de déployer le front
--    (le filtre catalogue lit la colonne `sports` exposée par `figures_card`).
-- Mirroré dans :
--   - scripts/wakeref_post_restore.sql  (les 2 vues — exécutable)
--   - scripts/wakeref_schema.sql        (colonnes figures + check — référence)

-- 1. Colonnes sur figures.
--    sports             → disciplines où le trick est PRATICABLE (⊇ {sport})
--    tips_<discipline>  → override des tips de la discipline (NULL/[] = hérite de tips)
alter table public.figures
  add column if not exists sports            sport_type[],
  add column if not exists tips_seated        text[],
  add column if not exists tips_seated_en     text[],
  add column if not exists tips_wakeskate     text[],
  add column if not exists tips_wakeskate_en  text[];

-- 2. Backfill : appartenance initiale = la discipline native seule.
update public.figures set sports = array[sport] where sports is null;

-- 3. Intégrité : sports non null et contient toujours la discipline native.
--    Idempotent (drop+add) pour pouvoir rejouer la section sans erreur.
alter table public.figures alter column sports set not null;
alter table public.figures drop constraint if exists figures_sport_in_sports;
alter table public.figures add constraint figures_sport_in_sports check (sport = any (sports));

-- 4. Vues : exposer `sports` (filtre catalogue) + les 4 colonnes tips (fiche).
--    Colonnes appendées en FIN → compatibles CREATE OR REPLACE malgré les
--    fonctions qui retournent `setof figures_card` / `setof figures_full`.

create or replace view public.figures_card as
select f.id, f.slug, f.name, f.sport, f.difficulty, f.contexts,
       c.name as category_name, c.slug as category_slug,
       f.sports
from figures f
left join categories c on c.id = f.category_id;

create or replace view public.figures_full as
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
  ) as base_figure,
  -- Appartenance multi-discipline + tips override (appendées en fin pour rester
  -- compatibles avec un CREATE OR REPLACE VIEW lors des migrations).
  f.tips_seated, f.tips_seated_en,
  f.tips_wakeskate, f.tips_wakeskate_en,
  f.sports
from figures f
left join categories c on c.id = f.category_id;

alter view public.figures_full set (security_invoker = true);
alter view public.figures_card set (security_invoker = true);
