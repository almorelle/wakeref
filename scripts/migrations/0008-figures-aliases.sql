-- Migration 0008 — alias de reconnaissance (colonne figures.aliases)
--
-- Pourquoi : socle (« palier 0 ») de la saisie de run à la voix pour les juges.
-- Le STT transcrit du jargon parlé (« tan », « half cab », « back lip », « indy »)
-- que le nom canonique de la figure ne contient pas → le matching dictée→trick a
-- besoin d'une liste d'alias PORTÉE PAR LA FIGURE (éditable en admin, mise en cache
-- avec la donnée figure pour un matcher 100 % hors-ligne au palier 2).
--
-- Distinct de WORD_MAP (src/lib/searchExpand.js), qui est au niveau du TERME
-- compositionnel (ts, bs, 3, mobe…) et en ligne. `aliases` est au niveau de la
-- FIGURE. Les deux cohabitent.
--
-- Bénéfice immédiat : le RPC `search_figures` devient alias-aware → la recherche
-- tapée du catalogue retrouve une figure par son surnom dès cette migration.
--
-- NB : on ne touche PAS encore la vue figures_full (les objets figure renvoyés au
-- front n'exposent pas `aliases`). Le RPC lit les alias par join sur la table base.
-- L'ajout de `aliases` à figures_full viendra au palier 2, quand le matcher offline
-- aura besoin des alias dans les objets figure chargés côté client.
--
-- À exécuter dans l'éditeur SQL Supabase, APRÈS la migration 0007.
-- Mirroré dans :
--   - scripts/wakeref_post_restore.sql  (la fonction search_figures — exécutable)
--   - scripts/wakeref_schema.sql        (colonne figures.aliases — référence)

-- 1. Colonne : surnoms / variantes parlées d'une figure. Défaut tableau vide,
--    jamais null (simplifie le matching : array_to_string / unnest sans coalesce).
alter table public.figures
  add column if not exists aliases text[] not null default '{}';

-- 2. RPC alias-aware. Inchangé par ailleurs ; ajouts :
--    - join sur la table base `figures fb` pour lire fb.aliases
--    - les alias entrent dans le tsvector (match plein-texte par mot)
--    - match « compact » (sans accents/ponctuation) sur chaque alias
--    - un alias en préfixe se classe au palier 2 (juste après les matches par nom,
--      avant le match par description seule)
create or replace function public.search_figures(query text)
returns setof figures_full language sql stable
set search_path = public as $$
  with q as (
    select
      public.immutable_unaccent(lower(trim(query))) as raw,
      regexp_replace(public.immutable_unaccent(lower(trim(query))), '[^a-z0-9]', '', 'g') as compact
  )
  select f.* from figures_full f
  join figures fb on fb.id = f.id, q
  where
    to_tsvector('french', public.immutable_unaccent(
      coalesce(f.name,'') || ' ' || coalesce(f.description,'') || ' ' || array_to_string(fb.aliases, ' ')))
      @@ plainto_tsquery('french', q.raw)
    or (q.compact <> '' and regexp_replace(public.immutable_unaccent(lower(f.name)), '[^a-z0-9]', '', 'g')
          like '%' || q.compact || '%')
    or (q.compact <> '' and exists (
          select 1 from unnest(fb.aliases) a
          where regexp_replace(public.immutable_unaccent(lower(a)), '[^a-z0-9]', '', 'g') like '%' || q.compact || '%'))
  order by
    case
      when public.immutable_unaccent(lower(f.name)) = q.raw then 0
      when q.compact <> '' and regexp_replace(public.immutable_unaccent(lower(f.name)), '[^a-z0-9]', '', 'g') like q.compact || '%' then 1
      when q.compact <> '' and regexp_replace(public.immutable_unaccent(lower(f.name)), '[^a-z0-9]', '', 'g') like '%' || q.compact || '%' then 2
      when q.compact <> '' and exists (
        select 1 from unnest(fb.aliases) a
        where regexp_replace(public.immutable_unaccent(lower(a)), '[^a-z0-9]', '', 'g') like q.compact || '%') then 2
      else 3
    end,
    ts_rank(
      to_tsvector('french', public.immutable_unaccent(coalesce(f.name,'') || ' ' || coalesce(f.description,''))),
      plainto_tsquery('french', q.raw)
    ) desc,
    f.name;
$$;
