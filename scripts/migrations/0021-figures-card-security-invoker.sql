-- WakeRef — rétablir `security_invoker` sur les vues de lecture
-- Généré le 2026-09-09. À appliquer dans l'éditeur SQL Supabase.
--
-- Signalé par l'advisor Supabase (niveau critique) :
--   « View public.figures_card is defined with the SECURITY DEFINER property »
--
-- Une vue sans `security_invoker` s'exécute sous l'identité de son PROPRIÉTAIRE,
-- pas de celui qui l'interroge. Le propriétaire ici contourne la RLS, donc la
-- vue rend toutes les lignes de `figures` — y compris les non publiées.
--
-- `figures_card` n'a AUCUN filtre `published` dans sa définition : elle repose
-- entièrement sur `security_invoker` + la RLS de `figures`. L'option sautée,
-- c'est toute la protection qui saute.
--
-- Deux chemins concrètement exposés :
--   · une requête anon directe sur `figures_card` ;
--   · `recent_video_figures()`, qui n'est PAS `security definer` et compte donc
--     sur la vue pour filtrer — la rangée « vidéos récentes » de la home.
-- (`most_viewed_figures()` est `security definer` mais filtre `where f.published`
--  en dur : elle, elle tient.)
--
-- La dérive vient d'un `create view` rejoué sans le `alter` qui suit. Règle :
-- toute recréation de ces vues doit être immédiatement suivie de son `alter`.

begin;

-- Les deux vues, même si l'advisor n'en signale qu'une : l'ordre est idempotent
-- et poser la seconde coûte moins cher que de vérifier qu'elle n'a pas dérivé.
alter view public.figures_full set (security_invoker = true);
alter view public.figures_card set (security_invoker = true);

commit;

-- ── Contrôle ────────────────────────────────────────────────────────────────
-- Doit renvoyer deux lignes portant `security_invoker=true` :
--
--   select c.relname, c.reloptions
--     from pg_class c
--     join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public'
--      and c.relkind = 'v'
--      and c.relname in ('figures_full', 'figures_card');
--
-- Puis, en navigation privée (donc en anon), vérifier qu'une figure non publiée
-- n'apparaît ni dans `figures_card`, ni sur la home.
