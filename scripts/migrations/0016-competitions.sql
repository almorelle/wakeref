-- WakeRef — agenda des compétitions : socle de données (lot A)
-- Généré le 2026-09-07. À relire, puis appliquer dans l'éditeur SQL Supabase.
--
-- Crée les deux tables de la future page publique « Compétitions » (sans rapport
-- avec /juge, l'outil de jugement). Conception figée le 2026-09-06, voir
-- _bmad-output/brainstorming/brainstorming-session-2026-09-06-19-13.md
--
-- Deux partis pris qui expliquent ce qui MANQUE ici :
--   * aucune colonne de statut. Passé / en cours / à venir se calculent depuis
--     la date : un statut stocké se périme, une date non.
--   * aucune colonne de discipline. Le défaut implicite est « toutes les
--     disciplines » ; afficher « wakeboard uniquement » enregistrerait une
--     exclusion dont l'organisateur est responsable, pas le référentiel.
--   * aucun texte libre, donc aucune colonne _en : la fiche ne contient que des
--     liens vers l'extérieur. Le bilinguisme se limite aux libellés d'interface.
--
-- date_precision porte l'incertitude. Pour une compétition connue à l'année
-- seulement, date_start vaut le 31 décembre : artefact de stockage que
-- l'interface ne montre jamais. Le 31/12 et pas le 01/01, pour deux raisons —
-- une compétition annoncée « en 2027 » est à venir tant que 2027 n'est pas
-- écoulée, et dans un fil chronologique elle se range après les compétitions
-- datées de la même année, ce que la zone floue en fin de file demande.

begin;

create table public.competitions (
  id                       bigint generated always as identity primary key,
  name                     text        not null check (char_length(name) between 1 and 160),
  date_start               date        not null,
  date_end                 date,                 -- null = compétition d'un seul jour
  date_precision           text        not null default 'day'
                             check (date_precision in ('day', 'year')),
  wakepark                 text        check (char_length(wakepark) <= 160),
  affiliation              text        not null default 'independent'
                             check (affiliation in ('federal', 'independent')),
  tour_name                text        check (char_length(tour_name) <= 160),
  tour_url                 text        check (char_length(tour_url) <= 500),
  cancelled                boolean     not null default false,
  info_url                 text        check (char_length(info_url) <= 500),
  entry_url                text        check (char_length(entry_url) <= 500),
  live_video_url           text        check (char_length(live_video_url) <= 500),
  live_scoring_url         text        check (char_length(live_scoring_url) <= 500),
  organiser_instagram_url  text        check (char_length(organiser_instagram_url) <= 500),
  wakepark_url             text        check (char_length(wakepark_url) <= 500),
  logo_path                text        check (char_length(logo_path) <= 500),  -- bucket `videos`, préfixe competitions/
  published                boolean     not null default true,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint competitions_dates_ordered check (date_end is null or date_end >= date_start),
  -- L'année seule est stockée sur le 31 décembre. Le formulaire le garantit, mais
  -- la base est la seule frontière : sans ça, la dérive est invisible (l'écran
  -- n'affiche que l'année) et casserait le calcul d'état du lot B.
  constraint competitions_year_is_dec31 check (
    date_precision <> 'year'
    or (extract(month from date_start) = 12 and extract(day from date_start) = 31 and date_end is null)
  ),
  -- Sept colonnes de liens rendues en href par le lot B. `javascript:` passe la
  -- validation HTML type="url" : le schéma est le seul endroit où l'exclure.
  constraint competitions_urls_http check (
    coalesce(tour_url, 'https://')               ~* '^https?://' and
    coalesce(info_url, 'https://')               ~* '^https?://' and
    coalesce(entry_url, 'https://')              ~* '^https?://' and
    coalesce(live_video_url, 'https://')         ~* '^https?://' and
    coalesce(live_scoring_url, 'https://')       ~* '^https?://' and
    coalesce(organiser_instagram_url, 'https://') ~* '^https?://' and
    coalesce(wakepark_url, 'https://')           ~* '^https?://'
  )
);

-- Liens vidéo (Instagram / YouTube). Table dédiée et non JSONB : ces lignes sont
-- ordonnées et éditées une par une. `videos` n'est pas réutilisable, sa colonne
-- figure_id est NOT NULL avec une FK vers figures.
create table public.competition_videos (
  id              bigint generated always as identity primary key,
  competition_id  bigint  not null references public.competitions(id) on delete cascade,
  url             text    not null check (char_length(url) between 1 and 500 and url ~* '^https?://'),
  title           text    check (char_length(title) <= 160),
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists competitions_date_start_idx
  on public.competitions (date_start desc);
create index if not exists competition_videos_competition_idx
  on public.competition_videos (competition_id, sort_order);

drop trigger if exists competitions_updated_at on public.competitions;
create trigger competitions_updated_at
  before update on public.competitions
  for each row execute procedure public.set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.competitions      enable row level security;
alter table public.competition_videos enable row level security;

drop policy if exists "Lecture publique competitions"        on public.competitions;
drop policy if exists "Ecriture admin competitions"          on public.competitions;
drop policy if exists "Lecture publique competition_videos"  on public.competition_videos;
drop policy if exists "Ecriture admin competition_videos"    on public.competition_videos;

create policy "Lecture publique competitions"
  on public.competitions for select using (published = true);
create policy "Ecriture admin competitions"
  on public.competitions for all
  using ((select auth.role()) = 'authenticated')
  with check ((select auth.role()) = 'authenticated');

-- Une vidéo n'est lisible que si sa compétition l'est : sans ce garde-fou, les
-- liens d'une fiche non publiée resteraient exposés à l'anon.
create policy "Lecture publique competition_videos"
  on public.competition_videos for select
  using (exists (
    select 1 from public.competitions c
    where c.id = competition_videos.competition_id and c.published = true
  ));
create policy "Ecriture admin competition_videos"
  on public.competition_videos for all
  using ((select auth.role()) = 'authenticated')
  with check ((select auth.role()) = 'authenticated');

-- ── GRANTS ───────────────────────────────────────────────────────────────────
grant select on public.competitions, public.competition_videos to anon, authenticated;
grant insert, update, delete on public.competitions       to authenticated;
grant insert, update, delete on public.competition_videos to authenticated;

commit;
