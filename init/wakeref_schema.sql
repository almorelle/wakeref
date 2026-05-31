-- ============================================================
-- WakeRef — Schéma Supabase v4
-- 12 catégories, i18n FR/EN, figures switch
-- Security hardened (search_path, security_invoker, bucket)
-- À exécuter sur un projet vierge
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. EXTENSIONS (dans schéma dédié)
-- ────────────────────────────────────────────────────────────
create schema if not exists extensions;
create extension if not exists "unaccent" schema extensions;

create or replace function public.immutable_unaccent(text)
returns text language sql immutable strict parallel safe
set search_path = public as $$
  select extensions.unaccent('extensions.unaccent', $1);
$$;

-- ────────────────────────────────────────────────────────────
-- 2. CATÉGORIES
-- ────────────────────────────────────────────────────────────
create table categories (
  id         serial primary key,
  name       text not null unique,
  slug       text not null unique,
  color      text,
  sort_order int default 0
);

insert into categories (name, slug, color, sort_order) values
  ('Spin',         'spin',         '#6366f1', 1),
  ('Railey',       'railey',       '#0ea5e9', 2),
  ('S-Bend',       's-bend',       '#06b6d4', 3),
  ('Hinterberger', 'hinterberger', '#8b5cf6', 4),
  ('Backroll',     'backroll',     '#f59e0b', 5),
  ('Front',        'front',        '#22c55e', 6),
  ('Tantrum',      'tantrum',      '#ef4444', 7),
  ('Grabs',        'grabs',        '#3b82f6', 8),
  ('Slides',       'slides',       '#10b981', 9),
  ('Shove-it',     'shoveit',      '#f97316', 10),
  ('Flip Tricks',  'fliptricks',   '#ec4899', 11),
  ('Specials',     'specials',     '#a855f7', 12),
  ('Whip',         'whip',         '#f43f5e', 13);
  ('Variations',   'variations',   '#94a3b8', 14);

-- ────────────────────────────────────────────────────────────
-- 3. FIGURES
-- ────────────────────────────────────────────────────────────
create type sport_type as enum ('wakeboard', 'wakeskate');

create table figures (
  id             serial primary key,
  slug           text not null unique,
  name           text not null,
  category_id    int references categories(id) on delete set null,
  sport          sport_type not null default 'wakeboard',
  difficulty     smallint not null default 1 check (difficulty between 1 and 5),
  description    text,
  description_en text,
  tips           text[],
  tips_en        text[],
  is_switch      boolean not null default false,
  switch_of      int references figures(id) on delete set null,
  published      boolean not null default true,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  contexts       text[],
  approach       text[],
  rotation       text[],
  inverted       boolean not null default false
  rewind         boolean not null default false
);

create index figures_search_idx on figures
  using gin(to_tsvector('french', public.immutable_unaccent(
    coalesce(name,'') || ' ' || coalesce(description,'')
  )));

create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger figures_updated_at
  before update on figures
  for each row execute procedure set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 4. PRÉREQUIS
-- ────────────────────────────────────────────────────────────
create table prerequisites (
  figure_id   int not null references figures(id) on delete cascade,
  requires_id int not null references figures(id) on delete cascade,
  primary key (figure_id, requires_id),
  check (figure_id <> requires_id)
);

-- ────────────────────────────────────────────────────────────
-- 5. VIDÉOS
-- ────────────────────────────────────────────────────────────
create type video_source as enum ('upload', 'youtube', 'instagram');

create table videos (
  id                 serial primary key,
  figure_id          int not null references figures(id) on delete cascade,
  title              text,
  file_path          text,
  source_type        video_source not null default 'upload',
  source_url         text,
  creator_name       text,
  creator_url        text,
  caption            text,
  takedown_requested boolean not null default false,
  takedown_email     text,
  takedown_at        timestamptz,
  sort_order         int default 0,
  uploaded_at        timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- 6. STORAGE BUCKET
-- ────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict do nothing;

-- Lecture restreinte : pas de listing global du bucket
create policy "Videos publiques"
  on storage.objects for select
  using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] is not null
  );

create policy "Upload admin seulement"
  on storage.objects for insert
  with check (bucket_id = 'videos' and auth.role() = 'authenticated');

create policy "Delete admin seulement"
  on storage.objects for delete
  using (bucket_id = 'videos' and auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────────────
-- 7. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────
alter table categories        enable row level security;
alter table figures           enable row level security;
alter table prerequisites     enable row level security;
alter table videos            enable row level security;

create policy "Lecture publique categories"    on categories    for select using (true);
create policy "Lecture publique figures"       on figures       for select using (published = true);
create policy "Lecture publique prerequisites" on prerequisites for select using (true);
create policy "Lecture publique videos"        on videos        for select using (takedown_requested = false);

create policy "Ecriture admin figures"         on figures       for all using (auth.role()='authenticated') with check (auth.role()='authenticated');
create policy "Ecriture admin categories"      on categories    for all using (auth.role()='authenticated') with check (auth.role()='authenticated');
create policy "Ecriture admin prerequisites"   on prerequisites for all using (auth.role()='authenticated') with check (auth.role()='authenticated');
create policy "Ecriture admin videos"          on videos        for all using (auth.role()='authenticated') with check (auth.role()='authenticated');

-- ────────────────────────────────────────────────────────────
-- 8. VUE figures_full (security_invoker = RLS respecté)
-- ────────────────────────────────────────────────────────────
create view figures_full as
select
  f.id, f.slug, f.name, f.sport, f.difficulty,
  f.description, f.description_en,
  f.tips, f.tips_en,
  f.is_switch, f.switch_of,
  f.contexts,
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
     where v.figure_id = f.id and v.takedown_requested = false),
    '[]'
  ) as videos
from figures f
left join categories c on c.id = f.category_id;

-- RLS respecté par la vue (security_invoker)
alter view figures_full set (security_invoker = true);

-- ────────────────────────────────────────────────────────────
-- 9. RECHERCHE FULL-TEXT
-- ────────────────────────────────────────────────────────────
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

-- ────────────────────────────────────────────────────────────
-- 10. DEMANDES DE RETRAIT
-- ────────────────────────────────────────────────────────────
create table takedown_requests (
  id         serial primary key,
  video_id   int references videos(id) on delete cascade,
  name       text,
  email      text not null,
  message    text,
  handled    boolean not null default false,
  created_at timestamptz default now()
);

alter table takedown_requests enable row level security;

-- Intentionnellement permissif : n'importe qui peut soumettre une demande de retrait
create policy "Insertion publique takedown" on takedown_requests for insert with check (true);
create policy "Lecture admin takedown"      on takedown_requests for select using (auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────────────
-- 11. GRANTS
-- ────────────────────────────────────────────────────────────
grant usage on schema public to anon, authenticated;
grant select on categories, figures, prerequisites, videos, figures_full to anon, authenticated;
grant select on takedown_requests to authenticated;
grant execute on function public.search_figures(text)     to anon, authenticated;
grant execute on function public.figures_without_videos() to authenticated;
grant execute on function public.figures_without_uploaded_videos() to authenticated;
grant execute on function public.immutable_unaccent(text) to anon, authenticated;
grant insert, update, delete on public.videos to authenticated;
grant insert, update, delete on public.categories to authenticated;
grant insert, update, delete on public.figures to authenticated;
grant insert, update, delete on public.prerequisites to authenticated;
grant insert, update, delete on public.takedown_requests to authenticated;
grant usage, select on all sequences in schema public to authenticated;