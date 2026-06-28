-- Migration 0010 — expose figures.aliases dans la vue figures_card
--
-- Pourquoi : le matcher dictée→tricks (saisie de run à la voix, outil juge) doit
-- tourner HORS-LIGNE → il charge le catalogue une fois et matche en local. Il lui
-- faut donc `aliases` dans le payload léger anon-readable. figures_card est la vue
-- du catalogue (security_invoker → RLS de figures s'applique, published seulement).
--
-- `create or replace view` (append-only : aliases ajouté EN FIN) → les fonctions
-- qui retournent `setof figures_card` (most_viewed/recent) survivent.
--
-- À exécuter dans l'éditeur SQL Supabase, APRÈS la migration 0009.
-- Mirroré dans : scripts/wakeref_post_restore.sql (source de vérité de la vue).

create or replace view figures_card as
select f.id, f.slug, f.name, f.sport, f.difficulty, f.contexts,
       c.name as category_name, c.slug as category_slug,
       f.sports,
       f.aliases
from figures f
left join categories c on c.id = f.category_id;
