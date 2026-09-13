-- Migration 0026 — plafond d'insertions sur `video_submissions` et `takedown_requests`.
-- Générée le 2026-09-13. À relire, puis appliquer dans l'éditeur SQL Supabase.
--
-- Les deux dernières boîtes publiques sans limite. Un script pouvait y pousser
-- des milliers de lignes d'affilée ; pour `video_submissions`, chaque ligne
-- déclenche en plus un e-mail (webhook → Edge Function `notify-video-submission`
-- → Resend), donc autant d'e-mails dans la boîte de l'admin et sur le quota
-- Resend. Même patron que `competition_submissions` (migration 0019) :
--
--   - deux fenêtres — la minute borne la rafale, le jour borne le volume ;
--   - trigger AFTER ... FOR EACH STATEMENT, pour qu'un insert en lot (PostgREST
--     accepte un tableau) soit compté en entier ;
--   - SQLSTATE PT429, que PostgREST rend en HTTP 429 : le client distingue
--     « trop d'envois » d'une vraie erreur ;
--   - security definer, pour compter des lignes que l'anon ne peut pas lire.
--
-- Une ligne refusée ne part pas par e-mail : l'exception annule la transaction,
-- et la file de pg_net (qui porte l'appel du webhook) est annulée avec elle.
--
-- Le plafond est GLOBAL, pas par soumetteur : Postgres ne voit pas l'IP. Il
-- protège la boîte de réception et le quota, pas la disponibilité du
-- formulaire. Pour les demandes de retrait, le message côté client renvoie donc
-- aussi vers la page Contact, qui ne passe pas par cette table.
--
-- Mirroré dans scripts/wakeref_post_restore.sql (fonctions, triggers, grants).

begin;

-- ── Index des fenêtres de comptage ───────────────────────────────────────────
create index if not exists video_submissions_submitted_idx
  on public.video_submissions (submitted_at desc);
create index if not exists takedown_requests_created_idx
  on public.takedown_requests (created_at desc);

-- ── video_submissions ────────────────────────────────────────────────────────
create or replace function public.video_submissions_rate_limit()
returns trigger
language plpgsql security definer
set search_path = public as $$
declare
  last_minute integer;
  last_day    integer;
begin
  select count(*) filter (where submitted_at > now() - interval '1 minute'),
         count(*) filter (where submitted_at > now() - interval '1 day')
    into last_minute, last_day
  from video_submissions;

  if last_minute > 10 or last_day > 60 then
    raise exception 'Trop de vidéos soumises récemment. Réessaie plus tard.'
      using errcode = 'PT429';
  end if;

  return null;
end;
$$;

drop trigger if exists video_submissions_rate_limit on public.video_submissions;
create trigger video_submissions_rate_limit
  after insert on public.video_submissions
  for each statement execute function public.video_submissions_rate_limit();

-- ── takedown_requests ────────────────────────────────────────────────────────
create or replace function public.takedown_requests_rate_limit()
returns trigger
language plpgsql security definer
set search_path = public as $$
declare
  last_minute integer;
  last_day    integer;
begin
  select count(*) filter (where created_at > now() - interval '1 minute'),
         count(*) filter (where created_at > now() - interval '1 day')
    into last_minute, last_day
  from takedown_requests;

  if last_minute > 10 or last_day > 60 then
    raise exception 'Trop de demandes de retrait reçues récemment. Réessaie plus tard.'
      using errcode = 'PT429';
  end if;

  return null;
end;
$$;

drop trigger if exists takedown_requests_rate_limit on public.takedown_requests;
create trigger takedown_requests_rate_limit
  after insert on public.takedown_requests
  for each statement execute function public.takedown_requests_rate_limit();

-- ── Grants par COLONNE pour anon ─────────────────────────────────────────────
-- Sans ça le plafond se contourne : un grant de table porte sur toutes les
-- colonnes, et `with check (true)` ne restreint rien. L'anon pouvait poser
-- lui-même `submitted_at` / `created_at` dans le passé (la ligne échappe à la
-- fenêtre), ou `status` / `handled` (la ligne naît classée, invisible dans la
-- file de l'admin — grave pour une demande de retrait). L'anon n'écrit que les
-- champs de ses formulaires (`SubmitVideo`, modale de retrait de `FigureDetail`).
revoke insert on public.video_submissions from anon;
grant insert (figure_id, source_url, title, creator_name, creator_url, caption)
  on public.video_submissions to anon;

revoke insert on public.takedown_requests from anon;
grant insert (video_id, name, email, message) on public.takedown_requests to anon;
-- Tant qu'on y est : le grant qui manquait. L'insertion anon marchait jusqu'ici
-- grâce aux privilèges par défaut du projet, jamais écrits nulle part.
grant usage, select on sequence public.takedown_requests_id_seq to anon, authenticated;

commit;

-- Contrôles :
--   select tgname from pg_trigger where tgname like '%_rate_limit';
--   -> doit lister video_submissions_rate_limit et takedown_requests_rate_limit
--   select grantee, privilege_type, column_name
--     from information_schema.column_privileges
--    where table_name in ('video_submissions', 'takedown_requests') and grantee = 'anon';
