-- Migration 0005 — table judge_runs (module d'entraînement juge)
--
-- Pourquoi : le module d'entraînement juge compare la saisie d'un juge à une
-- SOLUTION DE RÉFÉRENCE FIXE par vidéo de run. Cette table stocke ces solutions,
-- authorées en admin, au même format snapshot que `compositions.data`
-- (entries + jibPasses + otherEntries + gridKey), taggées par niveau de
-- compétition regroupé (easy/medium/hard) et liées à une vidéo de run.
--
-- Sécurité : l'anon n'a AUCUN accès direct à cette table (pas de grant, pas de
-- policy anon) — il lira via des RPC security definer (migration suivante,
-- story 2.2 : list_judge_runs sans la colonne solution + get_judge_run_solution).
-- C'est ce qui empêche la solution de fuiter avant l'évaluation.
--
-- La vidéo de run réutilise le bucket Storage `videos` existant sous le préfixe
-- `runs/` : les policies Storage en place couvrent déjà SELECT public (lecture)
-- et INSERT/DELETE admin — rien à ajouter côté Storage.
--
-- À exécuter dans l'éditeur SQL Supabase, APRÈS la migration 0003 (valeur d'enum
-- `seated`). Sans dépendance sur le front.
-- Mirroré dans :
--   - scripts/wakeref_post_restore.sql  (table + trigger + RLS + grant — exécutable)
--   - scripts/wakeref_schema.sql        (table — référence)

-- 1. Table
create table if not exists public.judge_runs (
  id           bigint generated always as identity primary key,
  name         text not null check (char_length(name) <= 120),
  discipline   public.sport_type not null,
  grid_key     text not null,
  difficulty   text not null check (difficulty in ('easy','medium','hard')),
  category     text,
  source_type  public.video_source not null default 'upload',
  video_path   text,
  video_url    text,
  solution     jsonb not null check (pg_column_size(solution) <= 51200),
  published    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 2. Trigger updated_at (fonction set_updated_at() déjà présente)
drop trigger if exists judge_runs_updated_at on public.judge_runs;
create trigger judge_runs_updated_at
  before update on public.judge_runs
  for each row execute procedure public.set_updated_at();

-- 3. RLS : admin total, aucun accès anon direct
alter table public.judge_runs enable row level security;
drop policy if exists "Ecriture admin judge_runs" on public.judge_runs;
create policy "Ecriture admin judge_runs" on public.judge_runs
  for all using ((select auth.role()) = 'authenticated')
  with check ((select auth.role()) = 'authenticated');

-- 4. Grant (la séquence d'identité est couverte par le grant global
--    "usage, select on all sequences ... to authenticated" du post_restore).
grant select, insert, update, delete on public.judge_runs to authenticated;
