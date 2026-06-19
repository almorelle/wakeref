-- Migration 0006 — RPC de lecture publique des runs de référence (module juge)
--
-- Pourquoi : l'anon n'a aucun grant sur judge_runs (migration 0005). Ces deux
-- fonctions security definer sont le SEUL chemin de lecture côté public :
--   - list_judge_runs    : catalogue (runs publiés, métadonnées SEULES, jamais
--                          la colonne solution) → page de sélection.
--   - get_judge_run_solution : la solution d'UN run publié, à la demande (clic
--                          « Évaluer ») → page de correction.
-- No-peek soft assumé (AD-1) : la solution n'est jamais embarquée ni listée ;
-- get_judge_run_solution reste appelable tôt, ce qui est acceptable pour un
-- outil d'entraînement sans enjeu.
--
-- À exécuter dans l'éditeur SQL Supabase, APRÈS la migration 0005.
-- Mirroré dans scripts/wakeref_post_restore.sql (fonctions + grants).
-- (Pas de miroir schema.sql : ce dump ne contient que les tables.)

-- Catalogue : runs publiés, métadonnées seules (jamais solution).
create or replace function public.list_judge_runs(p_discipline text default null, p_difficulty text default null)
returns table(
  id bigint, name text, discipline public.sport_type, grid_key text,
  difficulty text, category text, source_type public.video_source,
  video_path text, video_url text
)
language sql stable security definer
set search_path = public as $$
  select id, name, discipline, grid_key, difficulty, category, source_type, video_path, video_url
  from judge_runs
  where published = true
    and (p_discipline is null or discipline::text = p_discipline)
    and (p_difficulty is null or difficulty = p_difficulty)
  order by created_at desc;
$$;

-- Solution d'un run publié, à la demande.
create or replace function public.get_judge_run_solution(p_id bigint)
returns table(grid_key text, solution jsonb)
language sql stable security definer
set search_path = public as $$
  select grid_key, solution from judge_runs where id = p_id and published = true;
$$;

grant execute on function public.list_judge_runs(text, text)    to anon, authenticated;
grant execute on function public.get_judge_run_solution(bigint) to anon, authenticated;
