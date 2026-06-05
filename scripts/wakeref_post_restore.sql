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

create or replace function public.search_figures(query text)
returns setof figures_full language sql stable
set search_path = public as $$
  select * from figures_full
  where to_tsvector('french', public.immutable_unaccent(coalesce(name,'') || ' ' || coalesce(description,'')))
        @@ plainto_tsquery('french', public.immutable_unaccent(query))
     or name ilike '%' || query || '%'
  order by case when lower(name) = lower(query) then 0 else 1 end, name;
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
-- Jointure figures → categories.
create index if not exists figures_category_id_idx on figures (category_id);
-- Sous-requête prerequisites (jointure par requires_id ; la PK couvre figure_id en tête).
create index if not exists prerequisites_requires_id_idx on prerequisites (requires_id);

-- ────────────────────────────────────────────────────────────
-- 4. TRIGGER
-- ────────────────────────────────────────────────────────────
drop trigger if exists figures_updated_at on figures;
create trigger figures_updated_at
  before update on figures
  for each row execute procedure set_updated_at();

drop trigger if exists compositions_rate_limit on compositions;
create trigger compositions_rate_limit
  before insert on compositions
  for each row execute function compositions_rate_limit();

-- ────────────────────────────────────────────────────────────
-- 5. VUE figures_full
-- ────────────────────────────────────────────────────────────
drop view if exists figures_full cascade;

create view figures_full as
select
  f.id, f.slug, f.name, f.sport, f.difficulty,
  f.description, f.description_en,
  f.tips, f.tips_en,
  f.is_switch, f.switch_of,
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
          'caption', v.caption
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
  ) as videos
from figures f
left join categories c on c.id = f.category_id;

alter view figures_full set (security_invoker = true);

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
grant select on categories, figures, prerequisites, videos, figures_full to anon, authenticated;
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
grant execute on function public.immutable_unaccent(text)  to anon, authenticated;
grant insert on public.video_submissions to anon, authenticated;
grant select, update on public.video_submissions to authenticated;
grant usage, select on sequence video_submissions_id_seq to anon, authenticated;
grant insert on public.compositions to anon, authenticated;
grant select, delete on public.compositions to authenticated;