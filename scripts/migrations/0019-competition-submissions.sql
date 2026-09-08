-- WakeRef — compétitions : boîte de soumission publique (lot C)
-- Généré le 2026-09-08. À relire, puis appliquer dans l'éditeur SQL Supabase.
--
-- Permet à un visiteur — en pratique un organisateur — de signaler une
-- compétition absente. Rien n'est publié automatiquement : la ligne atterrit
-- dans une file que l'admin dépouille. Ce n'est pas de la prudence excessive,
-- c'est structurel : à l'écran, rien ne distingue une compétition soumise d'une
-- compétition saisie, donc tout ce qui s'affiche engage l'éditeur du site.
--
-- Trois champs et pas un de plus. La motivation de celui qui soumet est faible
-- (« ça ne me coûte rien de pousser l'info ») ; un formulaire plus long ne
-- serait jamais rempli. `date_text` est du TEXTE libre, volontairement : celui
-- qui signale une compétition ne connaît pas toujours les dates exactes, et lui
-- imposer un calendrier écarterait le cas le plus courant — « en juin », « été
-- 2027 ». C'est l'admin qui traduira en date lors de la création de la fiche.

begin;

create table public.competition_submissions (
  id          bigint      generated always as identity primary key,
  name        text        not null check (char_length(name) between 2 and 160),
  date_text   text        not null check (char_length(date_text) between 2 and 80),
  url         text        check (url is null or (char_length(url) <= 500 and url ~* '^https?://')),
  status      text        not null default 'pending'
                            check (status in ('pending', 'handled', 'rejected')),
  created_at  timestamptz not null default now()
);

-- Non partiel : c'est le comptage du trigger, tous statuts confondus, qui a
-- besoin de l'index. Le tri « à traiter d'abord » se fait côté client.
create index if not exists competition_submissions_created_idx
  on public.competition_submissions (created_at desc);

-- Anti-spam : plafond d'insertions, calqué sur celui des compositions.
-- Nécessaire ici plus qu'ailleurs — la boîte est publique, sans compte ni
-- captcha, et chaque ligne déclenche en plus un e-mail. Deux fenêtres : la
-- minute borne la rafale, le jour borne le volume — dix par minute tenues sans
-- interruption feraient 14 400 e-mails par jour sans jamais toucher le plafond.
-- security definer pour compter les lignes récentes malgré l'absence de policy
-- SELECT pour anon.
--
-- Le plafond est GLOBAL, pas par soumetteur : Postgres ne voit pas l'IP. Il
-- protège la boîte de réception, pas la disponibilité du formulaire — de quoi
-- fermer l'accès à tout le monde pour qui s'en donne la peine. Faire mieux
-- demanderait de passer l'insertion par une Edge Function ou un captcha, soit
-- la brique d'infrastructure que ce lot s'interdit (cf. deferred-work.md).
create or replace function public.competition_submissions_rate_limit()
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
  from competition_submissions;

  -- SQLSTATE distinct des CHECK de la table (23514) : sans ça, un nom trop
  -- court et un envoi trop rapide arrivaient au client sous le même code, et
  -- une erreur de saisie s'affichait en « réessaie dans une minute ».
  -- PT429 : convention PostgREST — la réponse HTTP porte un 429.
  if last_minute > 10 or last_day > 60 then
    raise exception 'Trop de propositions envoyées récemment. Réessaie plus tard.'
      using errcode = 'PT429';
  end if;

  return null;
end;
$$;

-- AFTER ... FOR EACH STATEMENT, et non BEFORE ... FOR EACH ROW : un trigger
-- ligne ne voit pas les lignes insérées par la même commande (le compteur de
-- commande n'avance pas entre elles), si bien qu'un `insert` de mille lignes en
-- une requête — ce que PostgREST accepte — passait le plafond sans le déclencher.
-- En AFTER statement, le comptage voit le lot entier ; l'exception annule tout.
drop trigger if exists competition_submissions_rate_limit on public.competition_submissions;
create trigger competition_submissions_rate_limit
  after insert on public.competition_submissions
  for each statement execute function public.competition_submissions_rate_limit();

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- L'anon écrit et ne lit RIEN : une boîte publique qui serait aussi lisible
-- deviendrait un mur d'affichage pour le premier spammeur venu.
alter table public.competition_submissions enable row level security;

drop policy if exists "Soumission publique competitions" on public.competition_submissions;
drop policy if exists "Lecture admin competition_submissions" on public.competition_submissions;
drop policy if exists "Maj admin competition_submissions" on public.competition_submissions;

create policy "Soumission publique competitions"
  on public.competition_submissions for insert with check (true);
create policy "Lecture admin competition_submissions"
  on public.competition_submissions for select using ((select auth.role()) = 'authenticated');
create policy "Maj admin competition_submissions"
  on public.competition_submissions for update using ((select auth.role()) = 'authenticated');

-- ── GRANTS ───────────────────────────────────────────────────────────────────
-- Grant par COLONNE : `grant insert on <table>` porte sur toutes les colonnes,
-- et `with check (true)` ne restreint rien. Un client pouvait donc poser lui-même
-- `created_at` dans le passé — la ligne échappait alors à la fenêtre du plafond —
-- ou `status = 'handled'`, ce qui la faisait naître déjà classée, invisible dans
-- la file. L'anon n'écrit que les trois champs du formulaire.
grant insert (name, date_text, url) on public.competition_submissions to anon;
grant insert on public.competition_submissions to authenticated;
grant select, update on public.competition_submissions to authenticated;

commit;
