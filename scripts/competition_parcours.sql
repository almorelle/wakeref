-- Module compétition — table `parcours` (incrément 2 : persistance + partage par code).
-- Un parcours est l'objet PARTAGEABLE : édité côté admin, chargé par son short-code
-- côté /competition. Seul le parcours voyage entre devices (pas de sync de saisie v1).
-- Calque le pattern `compositions` : id text = short-code client-généré, data jsonb,
-- fonction security-definer pour la lecture publique par code sans SELECT global anon.
--
-- Idempotent : peut être rejoué. À appliquer via le SQL editor Supabase (ou MCP).

-- ── table ───────────────────────────────────────────────────────────────────
create table if not exists public.parcours (
  id          text        not null,                                   -- short-code partageable (URL /competition/<code>)
  name        text        not null unique check (char_length(name) between 1 and 80),
  data        jsonb       not null check (pg_column_size(data) <= 51200),  -- { cableSpin, nbPoulies, poulieStart, parcours }
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint parcours_pkey primary key (id)
);

-- maj automatique de updated_at
create or replace function public.parcours_touch()
returns trigger
language plpgsql
set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists parcours_touch on public.parcours;
create trigger parcours_touch
  before update on public.parcours
  for each row execute function public.parcours_touch();

-- ── lecture publique par code (sans exposer un SELECT global anon) ────────────
-- Jumeau de get_composition : le juge charge un parcours par son short-code.
create or replace function public.get_parcours(code text)
returns table(id text, name text, data jsonb)
language sql stable security definer
set search_path = public as $$
  select id, name, data from parcours where id = code;
$$;

-- ── RLS : écriture + liste = admin authentifié ; anon lit via get_parcours() ──
alter table public.parcours enable row level security;

drop policy if exists "Lecture admin parcours"     on public.parcours;
drop policy if exists "Insertion admin parcours"   on public.parcours;
drop policy if exists "Maj admin parcours"         on public.parcours;
drop policy if exists "Suppression admin parcours" on public.parcours;

create policy "Lecture admin parcours"     on public.parcours for select using ((select auth.role()) = 'authenticated');
create policy "Insertion admin parcours"   on public.parcours for insert with check ((select auth.role()) = 'authenticated');
create policy "Maj admin parcours"         on public.parcours for update using ((select auth.role()) = 'authenticated');
create policy "Suppression admin parcours" on public.parcours for delete using ((select auth.role()) = 'authenticated');

-- ── grants ───────────────────────────────────────────────────────────────────
grant select, insert, update, delete on public.parcours to authenticated;
grant execute on function public.get_parcours(text) to anon, authenticated;
