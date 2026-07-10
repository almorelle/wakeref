-- ============================================================
-- WakeRef — Post-restore schema
-- À exécuter APRÈS avoir restauré le dump pg_dump
-- Recrée tout ce que pg_dump n'inclut pas :
-- extensions, fonctions, vue, policies RLS, grants, buckets
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. EXTENSIONS
-- ────────────────────────────────────────────────────────────
create schema if not exists extensions;
create extension if not exists "unaccent" schema extensions;

-- ────────────────────────────────────────────────────────────
-- 2. FONCTIONS
-- ────────────────────────────────────────────────────────────
create or replace function public.immutable_unaccent(text)
returns text language sql immutable strict parallel safe
set search_path = public as $$
  select extensions.unaccent('extensions.unaccent', $1);
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

-- Vue figures_full créée AVANT les fonctions qui retournent `setof figures_full`
-- (sinon le `drop view ... cascade` plus bas les supprimerait sans les recréer).
drop view if exists figures_full cascade;

create view figures_full as
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
  -- Progression ancrée sur la figure de base (bf) : un switch hérite du « précédent ».
  case when bf.built_on_id is not null then
    (select json_build_object('id', b.id, 'name', b.name, 'slug', b.slug,
              'switch_names', (select string_agg(x.name, ', ' order by x.name)
                               from figures x where x.switch_of = b.id))
     from figures b where b.id = bf.built_on_id
       and b.switch_of is null)  -- pas de parent affiché si c'est lui-même un switch
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
     where pr.figure_id = bf.id),  -- prérequis de la base, hérités par le switch
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
         -- figure courante + sa base/version switch (relation 1-à-1) :
         -- les vidéos sont partagées sur tout le groupe switch.
         select g.id from figures g
         where coalesce(g.switch_of, g.id) = coalesce(f.switch_of, f.id)
       )),
    '[]'
  ) as videos,
  -- Figures directement dérivées (built_on_id = figure de base) : le « +1 » de l'arbre.
  -- On exclut les switchs ; switch_names liste la/les version(s) switch de chaque nœud.
  coalesce(
    (select json_agg(json_build_object('id', n.id, 'name', n.name, 'slug', n.slug,
              'switch_names', (select string_agg(x.name, ', ' order by x.name)
                               from figures x where x.switch_of = n.id))
                     order by n.rotation, n.inverted, n.name)
     from figures n where n.built_on_id = bf.id
       and n.switch_of is null),
    '[]'
  ) as built_on_children,
  -- Champs de décomposition du trick (placés en fin de vue pour rester
  -- compatibles avec un CREATE OR REPLACE VIEW lors des migrations).
  f.spin,
  f.inverts,
  f.rewind_degs,
  f.rotation_type,
  -- Trick de base : racine de la chaîne built_on (le plus haut parent), depuis bf.
  (with recursive anc as (
     select b.id, b.name, b.slug, b.built_on_id
     from figures b where b.id = bf.built_on_id
     union all
     select p.id, p.name, p.slug, p.built_on_id
     from figures p join anc a on p.id = a.built_on_id
   )
   select json_build_object('id', a.id, 'name', a.name, 'slug', a.slug)
   from anc a where a.built_on_id is null
   limit 1
  ) as base_figure,
  -- Appartenance multi-discipline + tips override par discipline (appendées en
  -- fin de vue pour rester compatibles avec un CREATE OR REPLACE VIEW lors des
  -- migrations). `sports` ⊇ {sport} pilote le filtre catalogue ; `tips_<d>` =
  -- override des tips de la discipline (NULL/[] = hérite de `tips`).
  f.tips_seated, f.tips_seated_en,
  f.tips_wakeskate, f.tips_wakeskate_en,
  f.sports
from figures f
left join categories c on c.id = f.category_id
-- Figure de base du groupe switch (bf = f pour une figure normale).
left join figures bf on bf.id = coalesce(f.switch_of, f.id);

alter view figures_full set (security_invoker = true);

-- Vue légère pour les listes de cartes (home : most-viewed / vidéos récentes).
-- Strictement les colonnes affichées par FigureCard — aucun des agrégats JSON
-- coûteux de figures_full (videos, switch_versions, base_figure récursif…).
drop view if exists figures_card cascade;
create view figures_card as
select f.id, f.slug, f.name, f.sport, f.difficulty, f.contexts,
       c.name as category_name, c.slug as category_slug,
       f.sports,
       f.aliases
from figures f
left join categories c on c.id = f.category_id;

alter view figures_card set (security_invoker = true);

create or replace function public.search_figures(query text)
returns setof figures_full language sql stable
set search_path = public as $$
  with q as (
    select
      public.immutable_unaccent(lower(trim(query))) as raw,
      -- forme « compacte » : minuscule, sans accents, sans espaces ni ponctuation.
      -- Permet le match progressif au fil de la frappe ("backr" → Back Roll) et les
      -- noms tapés collés ("frontflip", "frontroll") malgré les espaces du nom en base.
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
    -- Alias parlés (figures.aliases) : surnoms de figure absents du nom canonique,
    -- socle du matching dictée→trick (saisie de run à la voix).
    or (q.compact <> '' and exists (
          select 1 from unnest(fb.aliases) a
          where regexp_replace(public.immutable_unaccent(lower(a)), '[^a-z0-9]', '', 'g') like '%' || q.compact || '%'))
  order by
    -- Pertinence : nom exact, préfixe de nom, sous-chaîne de nom, préfixe d'alias,
    -- puis match uniquement par description (full-text). Départage par rang full-text.
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

create or replace function public.figures_without_videos()
returns setof figures_full language sql stable
set search_path = public as $$
  select * from figures_full
  where json_array_length(videos) = 0
  order by name;
$$;

-- Figures sans vidéo de type « upload direct ». Lit videos depuis figures_full,
-- donc partagé sur le groupe switch (une version switch compte comme pourvue si
-- sa figure de base a un upload).
create or replace function public.figures_without_uploaded_videos()
returns setof figures_full language sql stable
set search_path = public as $$
  select * from figures_full
  where not exists (
    select 1 from json_array_elements(videos) as v
    where v->>'source_type' = 'upload'
  )
  order by name;
$$;

-- Lecture publique d'un run sauvegardé par son id (sans exposer un SELECT
-- global de la table compositions aux visiteurs anonymes).
create or replace function public.get_composition(cid text)
returns table(name text, data jsonb)
language sql stable security definer
set search_path = public as $$
  select name, data from compositions where id = cid;
$$;

-- Module compétition — lecture publique d'un parcours par son short-code (le juge
-- charge un parcours partagé). Jumeau de get_composition : pas de SELECT global anon.
create or replace function public.get_parcours(code text)
returns table(id text, name text, data jsonb)
language sql stable security definer
set search_path = public as $$
  select id, name, data from parcours where id = code;
$$;

-- Module compétition — maj automatique de parcours.updated_at.
create or replace function public.parcours_touch()
returns trigger
language plpgsql
set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Module juge — catalogue public : runs PUBLIÉS filtrés par discipline/niveau,
-- métadonnées SEULES (jamais la colonne solution). security definer pour lire
-- sans grant table anon. Comparaison discipline en texte → pas d'erreur de cast
-- enum si le paramètre est libre ; paramètre null = pas de filtre sur cet axe.
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

-- Module juge — récupération de la solution d'UN run publié, à la demande (au
-- clic « Évaluer »). C'est le seul chemin vers la colonne solution. No-peek soft
-- assumé (AD-1) : appelable tôt, mais la solution n'est jamais embarquée ni listée.
create or replace function public.get_judge_run_solution(p_id bigint)
returns table(grid_key text, solution jsonb)
language sql stable security definer
set search_path = public as $$
  select grid_key, solution from judge_runs where id = p_id and published = true;
$$;

-- Anti-spam : plafond global d'insertions de runs par minute. security definer
-- pour compter les lignes récentes malgré l'absence de policy SELECT pour anon.
create or replace function public.compositions_rate_limit()
returns trigger
language plpgsql security definer
set search_path = public as $$
declare
  recent_count integer;
begin
  select count(*) into recent_count
  from compositions
  where created_at > now() - interval '1 minute';

  if recent_count >= 20 then
    raise exception 'Trop de runs créés récemment. Réessaie dans une minute.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

-- Stats publiques de la home : total de figures + nb de figures ayant
-- au moins une vidéo (hors retraits). Évite de transférer toutes les lignes.
create or replace function public.home_stats()
returns table(total_figures bigint, figures_with_video bigint)
language sql stable
set search_path = public as $$
  -- Une figure compte comme « avec vidéo » si une vidéo existe dans son
  -- groupe switch (la figure de base et sa version switch partagent les vidéos).
  -- Clé de groupe : coalesce(switch_of, id).
  select
    (select count(*) from figures),
    (select count(*) from figures f
     where exists (
       select 1 from videos v
       join figures b on b.id = v.figure_id
       where v.takedown_requested = false
         and coalesce(b.switch_of, b.id) = coalesce(f.switch_of, f.id)
     ));
$$;

-- Vues de figures : incrémente le bucket du jour. security definer pour écrire
-- malgré l'absence de grant direct anon (cf. compositions_rate_limit).
create or replace function public.track_figure_view(fig_id integer)
returns void
language sql security definer
set search_path = public as $$
  insert into figure_views (figure_id, day, views)
  select fig_id, current_date, 1
  where exists (select 1 from figures where id = fig_id)
  on conflict (figure_id, day) do update
    set views = figure_views.views + 1;
$$;

-- Top figures sur une fenêtre glissante (défaut 30j), prêtes à afficher.
-- Renvoie directement les colonnes de carte, ordonnées par vues desc : la home
-- n'a plus besoin d'un second aller-retour pour réhydrater les ids.
drop function if exists public.most_viewed_figures(integer, integer);
create function public.most_viewed_figures(days integer default 30, lim integer default 5)
returns setof figures_card
language sql stable security definer
set search_path = public as $$
  with top as (
    select fv.figure_id, sum(fv.views) as v
    from figure_views fv
    join figures f on f.id = fv.figure_id
    where f.published
      and fv.day > current_date - days
    group by fv.figure_id
    order by v desc
    limit lim
  )
  select c.* from top
  join figures_card c on c.id = top.figure_id
  order by top.v desc;
$$;

-- Figures dont la vidéo (hors retrait) est la plus récente, prêtes à afficher.
-- Remplace l'ancien waterfall « videos → figures_full.in(ids) » de la home.
create or replace function public.recent_video_figures(lim integer default 5)
returns setof figures_card
language sql stable
set search_path = public as $$
  with recent as (
    select v.figure_id, max(v.uploaded_at) as last_up
    from videos v
    where v.takedown_requested = false
    group by v.figure_id
    order by last_up desc
    limit lim
  )
  select c.* from recent
  join figures_card c on c.id = recent.figure_id
  order by recent.last_up desc;
$$;

-- Arbre de dépendance built_on : interdit les cycles (A→B→…→A) et l'auto-référence.
-- Remonte la chaîne des parents depuis le nouveau built_on_id ; si elle repasse
-- par la figure courante, c'est un cycle.
create or replace function public.check_built_on_acyclic()
returns trigger language plpgsql
set search_path = public as $$
declare
  cur  integer := new.built_on_id;
  hops integer := 0;
begin
  while cur is not null loop
    if cur = new.id then
      raise exception 'Dépendance circulaire détectée sur built_on_id (figure %)', new.id
        using errcode = 'check_violation';
    end if;
    hops := hops + 1;
    if hops > 1000 then
      raise exception 'Chaîne built_on trop longue (cycle probable)'
        using errcode = 'check_violation';
    end if;
    select built_on_id into cur from figures where id = cur;
  end loop;
  return new;
end;
$$;

-- ────────────────────────────────────────────────────────────
-- 3. INDEX
-- ────────────────────────────────────────────────────────────
-- Recherche plein-texte français (unaccent).
create index if not exists figures_search_idx on figures
  using gin(to_tsvector('french', public.immutable_unaccent(
    coalesce(name,'') || ' ' || coalesce(description,'')
  )));

-- Clés étrangères sollicitées par la vue figures_full et le groupe switch.
-- Agrégation des vidéos (filtre figure_id + takedown_requested).
create index if not exists videos_figure_id_idx
  on videos (figure_id) where takedown_requested = false;
-- Groupe switch : coalesce(switch_of, id) + sous-requête switch_versions.
create index if not exists figures_switch_of_idx on figures (switch_of);
-- Arbre de dépendance : sous-requête built_on_figure + parcours des enfants.
create index if not exists figures_built_on_id_idx on figures (built_on_id);
-- Jointure figures → categories.
create index if not exists figures_category_id_idx on figures (category_id);
-- Sous-requête prerequisites (jointure par requires_id ; la PK couvre figure_id en tête).
create index if not exists prerequisites_requires_id_idx on prerequisites (requires_id);
-- Compteur de vues par figure (buckets journaliers). Créée ici (avant l'index/RLS)
-- pour que le chemin restore « from scratch » fonctionne sans la migration 0001.
create table if not exists public.figure_views (
  figure_id integer not null references figures(id) on delete cascade,
  day       date    not null default current_date,
  views     integer not null default 0,
  primary key (figure_id, day)
);
-- Fenêtre glissante de most_viewed_figures (filtre sur day).
create index if not exists figure_views_day_idx on figure_views (day);

-- Runs de référence du module d'entraînement juge. Une vidéo de run = une
-- solution fixe (snapshot Compo : entries + jibPasses + otherEntries + gridKey).
-- Authoré en admin, taggé par niveau (easy/medium/hard) ; l'anon n'y accède
-- JAMAIS en direct (pas de grant) — seulement via les RPC de lecture (story 2.2).
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

-- ────────────────────────────────────────────────────────────
-- 4. TRIGGER
-- ────────────────────────────────────────────────────────────
drop trigger if exists figures_updated_at on figures;
create trigger figures_updated_at
  before update on figures
  for each row execute procedure set_updated_at();

drop trigger if exists figures_built_on_acyclic on figures;
create trigger figures_built_on_acyclic
  before insert or update of built_on_id on figures
  for each row when (new.built_on_id is not null)
  execute function check_built_on_acyclic();

drop trigger if exists compositions_rate_limit on compositions;
create trigger compositions_rate_limit
  before insert on compositions
  for each row execute function compositions_rate_limit();

drop trigger if exists parcours_touch on parcours;
create trigger parcours_touch
  before update on parcours
  for each row execute function parcours_touch();

drop trigger if exists judge_runs_updated_at on judge_runs;
create trigger judge_runs_updated_at
  before update on judge_runs
  for each row execute procedure set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 5. VUE figures_full → déplacée en section 2 (avant les fonctions
--    qui retournent `setof figures_full`, pour survivre au drop cascade).
-- ────────────────────────────────────────────────────────────

-- ────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────
alter table categories        enable row level security;
alter table figures           enable row level security;
alter table prerequisites     enable row level security;
alter table videos            enable row level security;
alter table takedown_requests enable row level security;
alter table video_submissions enable row level security;
alter table compositions      enable row level security;
alter table figure_views      enable row level security;
alter table judge_runs        enable row level security;
alter table parcours          enable row level security;

-- Supprime les policies existantes avant de les recréer
drop policy if exists "Lecture publique categories"    on categories;
drop policy if exists "Lecture publique figures"       on figures;
drop policy if exists "Lecture publique prerequisites" on prerequisites;
drop policy if exists "Lecture publique videos"        on videos;
drop policy if exists "Ecriture admin figures"         on figures;
drop policy if exists "Ecriture admin categories"      on categories;
drop policy if exists "Ecriture admin prerequisites"   on prerequisites;
drop policy if exists "Ecriture admin videos"          on videos;
drop policy if exists "Insertion publique takedown"    on takedown_requests;
drop policy if exists "Lecture admin takedown"         on takedown_requests;
drop policy if exists "Soumission publique"            on video_submissions;
drop policy if exists "Lecture admin soumissions"      on video_submissions;
drop policy if exists "Mise à jour admin soumissions"  on video_submissions;
drop policy if exists "Insertion publique compositions" on compositions;
drop policy if exists "Lecture admin compositions"      on compositions;
drop policy if exists "Suppression admin compositions"  on compositions;
drop policy if exists "Lecture admin figure_views"      on figure_views;

create policy "Lecture publique categories"    on categories    for select using (true);
create policy "Lecture publique figures"       on figures       for select using (published = true);
create policy "Lecture publique prerequisites" on prerequisites for select using (true);
create policy "Lecture publique videos"        on videos        for select using (takedown_requested = false);
-- auth.role() encapsulé dans un sous-select : évalué une seule fois par
-- requête (initplan) au lieu d'une fois par ligne.
create policy "Ecriture admin figures"         on figures       for all using ((select auth.role())='authenticated') with check ((select auth.role())='authenticated');
create policy "Ecriture admin categories"      on categories    for all using ((select auth.role())='authenticated') with check ((select auth.role())='authenticated');
create policy "Ecriture admin prerequisites"   on prerequisites for all using ((select auth.role())='authenticated') with check ((select auth.role())='authenticated');
create policy "Ecriture admin videos"          on videos        for all using ((select auth.role())='authenticated') with check ((select auth.role())='authenticated');
create policy "Insertion publique takedown"    on takedown_requests for insert with check (true);
create policy "Lecture admin takedown"         on takedown_requests for select using ((select auth.role()) = 'authenticated');
create policy "Soumission publique"            on video_submissions for insert with check (true);
create policy "Lecture admin soumissions"      on video_submissions for select using ((select auth.role()) = 'authenticated');
create policy "Mise à jour admin soumissions"  on video_submissions for update using ((select auth.role()) = 'authenticated');
create policy "Insertion publique compositions" on compositions for insert with check (true);
create policy "Lecture admin compositions"      on compositions for select using ((select auth.role()) = 'authenticated');
create policy "Suppression admin compositions"  on compositions for delete using ((select auth.role()) = 'authenticated');
-- figure_views : pas d'accès direct anon (écritures/top via RPC security definer) ; lecture admin seule.
create policy "Lecture admin figure_views"      on figure_views  for select using ((select auth.role()) = 'authenticated');
-- judge_runs : accès admin total ; pas de policy anon (l'anon lit via les RPC story 2.2).
drop policy if exists "Ecriture admin judge_runs" on judge_runs;
create policy "Ecriture admin judge_runs"       on judge_runs    for all using ((select auth.role()) = 'authenticated') with check ((select auth.role()) = 'authenticated');
-- parcours : écriture + liste admin ; l'anon lit un parcours par son code via get_parcours().
drop policy if exists "Lecture admin parcours"     on parcours;
drop policy if exists "Insertion admin parcours"   on parcours;
drop policy if exists "Maj admin parcours"         on parcours;
drop policy if exists "Suppression admin parcours" on parcours;
create policy "Lecture admin parcours"     on parcours for select using ((select auth.role()) = 'authenticated');
create policy "Insertion admin parcours"   on parcours for insert with check ((select auth.role()) = 'authenticated');
create policy "Maj admin parcours"         on parcours for update using ((select auth.role()) = 'authenticated');
create policy "Suppression admin parcours" on parcours for delete using ((select auth.role()) = 'authenticated');


-- ────────────────────────────────────────────────────────────
-- 7. STORAGE BUCKET
-- ────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict do nothing;

drop policy if exists "Videos publiques"      on storage.objects;
drop policy if exists "Upload admin seulement" on storage.objects;
drop policy if exists "Delete admin seulement" on storage.objects;

create policy "Videos publiques"
  on storage.objects for select
  using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] is not null
  );

create policy "Upload admin seulement"
  on storage.objects for insert
  with check (bucket_id = 'videos' and (select auth.role()) = 'authenticated');

create policy "Delete admin seulement"
  on storage.objects for delete
  using (bucket_id = 'videos' and (select auth.role()) = 'authenticated');

-- ────────────────────────────────────────────────────────────
-- 8. GRANTS
-- ────────────────────────────────────────────────────────────
grant usage on schema public to anon, authenticated;
grant select on categories, figures, prerequisites, videos, figures_full, figures_card to anon, authenticated;
grant select on takedown_requests to authenticated;
grant insert, update, delete on public.videos          to authenticated;
grant insert, update, delete on public.categories      to authenticated;
grant insert, update, delete on public.figures         to authenticated;
grant insert, update, delete on public.prerequisites   to authenticated;
grant insert, update, delete on public.takedown_requests to authenticated;
grant usage, select on all sequences in schema public  to authenticated;
grant execute on function public.search_figures(text)      to anon, authenticated;
grant execute on function public.figures_without_videos() to authenticated;
grant execute on function public.figures_without_uploaded_videos() to authenticated;
grant execute on function public.home_stats()             to anon, authenticated;
grant execute on function public.get_composition(text)    to anon, authenticated;
grant execute on function public.list_judge_runs(text, text)        to anon, authenticated;
grant execute on function public.get_judge_run_solution(bigint)     to anon, authenticated;
grant execute on function public.immutable_unaccent(text)  to anon, authenticated;
grant insert on public.video_submissions to anon, authenticated;
grant select, update on public.video_submissions to authenticated;
grant usage, select on sequence video_submissions_id_seq to anon, authenticated;
grant insert on public.compositions to anon, authenticated;
grant select, delete on public.compositions to authenticated;
grant select, insert, update, delete on public.parcours to authenticated;
grant execute on function public.get_parcours(text)       to anon, authenticated;
-- judge_runs : admin uniquement (l'anon passe par les RPC de lecture, story 2.2).
grant select, insert, update, delete on public.judge_runs to authenticated;
grant select on public.figure_views to authenticated;
grant execute on function public.track_figure_view(integer)            to anon, authenticated;
grant execute on function public.most_viewed_figures(integer, integer)  to anon, authenticated;
grant execute on function public.recent_video_figures(integer)          to anon, authenticated;