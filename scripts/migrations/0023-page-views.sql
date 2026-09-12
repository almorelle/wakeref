-- Migration 0023 — page_views : le compteur des pages qui ne sont pas des figures.
--
-- Jumelle de `figure_views` (migration 0001), même forme : un bucket par
-- (page, jour), incrémenté par un RPC, lu par l'admin. Ce qu'on mesure reste
-- des VUES : aucun identifiant, aucune IP, aucun cookie — un flag localStorage
-- dédoublonne une page par jour et par navigateur. Les robots qui exécutent le
-- JS sont comptés. À lire en relatif.
--
-- À exécuter UNE fois dans l'éditeur SQL Supabase.
-- Mirroré dans :
--   - scripts/wakeref_post_restore.sql  (tables, RLS, policies, fonctions, grants)
--   - scripts/wakeref_schema.sql        (les deux tables — référence)

-- 1. Liste blanche des pages comptées.
--    Sans elle, `track_page_view` accepterait n'importe quelle chaîne d'un
--    appelant anonyme et la table enflerait d'autant de lignes qu'on lui en
--    poste. C'est le pendant du `where exists (select 1 from figures …)` de
--    `track_figure_view` : on ne compte que ce qui existe. `label` sert
--    directement à l'affichage admin — un libellé de plus côté JS serait un
--    deuxième endroit où le faire dériver.
create table if not exists public.page_routes (
  path  text primary key,
  label text not null
);

-- Motifs, pas URLs : `/competitions/:id` et non `/competitions/12-wake-open`.
-- Doit rester synchronisé avec `PAGE_ROUTES` de `src/lib/pageViews.js` —
-- `node scripts/test-page-routes.mjs` échoue si les deux divergent.
insert into public.page_routes (path, label) values
  ('/',                           'Accueil'),
  ('/figures',                    'Catalogue'),
  ('/quiz',                       'Quiz'),
  ('/competitions',               'Agenda des compétitions'),
  ('/competitions/proposer',      'Proposer une compétition'),
  ('/competitions/federales',     'Compétitions fédérales'),
  ('/competitions/circuit/:slug', 'Page de circuit'),
  ('/competitions/:id',           'Fiche de compétition'),
  ('/composition',                'Compo'),
  ('/composition/:id',            'Run partagé'),
  ('/entrainement-juge',          'Entraînement juge'),
  ('/entrainement-juge/voix',     'Saisie vocale'),
  ('/grille-composition-old',     'Grille de composition (héritée)'),
  ('/contact',                    'Contact'),
  ('/submit',                     'Proposer une vidéo'),
  ('/legal',                      'Mentions légales'),
  ('/terms',                      'Conditions d''utilisation'),
  ('/privacy',                    'Confidentialité')
on conflict (path) do update set label = excluded.label;

-- 2. Le compteur lui-même.
create table if not exists public.page_views (
  path  text not null references page_routes(path) on delete cascade,
  day   date not null default current_date,
  views integer not null default 0,
  primary key (path, day)
);

create index if not exists page_views_day_idx on public.page_views (day);

-- 3. RLS. Même règle que `figure_views` : rien pour anon, lecture pour l'admin.
--    `page_routes` est en revanche lisible par tous — c'est une nomenclature,
--    pas une donnée de fréquentation, et la RPC d'écriture s'en sert.
alter table public.page_views  enable row level security;
alter table public.page_routes enable row level security;

drop policy if exists "Lecture admin page_views" on public.page_views;
create policy "Lecture admin page_views" on public.page_views
  for select using ((select auth.role()) = 'authenticated');

drop policy if exists "Lecture publique page_routes" on public.page_routes;
create policy "Lecture publique page_routes" on public.page_routes
  for select using (true);

-- 4. GRANTS. Une policy autorise des LIGNES, elle ne donne pas le droit de lire
--    la TABLE : il faut les deux. C'est précisément ce qui manquait à
--    `figure_views` depuis 2026-06 — la policy était là, le grant ne vivait que
--    dans post_restore, et personne ne s'en est aperçu tant que le seul lecteur
--    était `security definer`. Ici, les fonctions de lecture s'exécutent avec
--    les droits de l'appelant : sans ces lignes, l'écran d'admin échoue.
grant select on public.page_views  to authenticated;
grant select on public.page_routes to anon, authenticated;

-- 5. Écriture : RPC security definer, comme `track_figure_view`. L'insertion
--    n'a lieu que si le chemin figure dans la liste blanche ; sinon la fonction
--    ne fait rien et ne dit rien — un appelant anonyme n'a pas à apprendre ce
--    qui est compté.
create or replace function public.track_page_view(p text)
returns void
language sql security definer
set search_path = public as $$
  insert into page_views (path, day, views)
  select p, current_date, 1
  where exists (select 1 from page_routes where path = p)
  on conflict (path, day) do update
    set views = page_views.views + 1;
$$;

-- 6. Lecture admin : une ligne par page, les trois fenêtres d'un coup. Pas de
--    `security definer` (cf. 0022) — la policy admin doit s'appliquer.
--    `left join` depuis `page_routes` : une page jamais vue doit apparaître à
--    zéro plutôt que disparaître, c'est l'information la plus utile de l'écran.
create or replace function public.page_view_stats()
returns table(
  path        text,
  label       text,
  views_30d   bigint,
  views_365d  bigint,
  views_total bigint
)
language sql stable
set search_path = public as $$
  select r.path,
         r.label,
         coalesce(sum(pv.views) filter (where pv.day > current_date - 30),  0)::bigint,
         coalesce(sum(pv.views) filter (where pv.day > current_date - 365), 0)::bigint,
         coalesce(sum(pv.views), 0)::bigint
  from page_routes r
  left join page_views pv on pv.path = r.path
  group by r.path, r.label
  order by 3 desc, r.path;
$$;

-- Profondeur réelle de la mesure : sans elle, un zéro ne se distingue pas d'une
-- page mise en service hier.
create or replace function public.page_view_span()
returns table(first_day date, last_day date, views_total bigint)
language sql stable
set search_path = public as $$
  select min(day), max(day), coalesce(sum(views), 0)::bigint from page_views;
$$;

-- 7. Grants d'exécution : écriture ouverte (c'est le point), lecture admin.
grant execute on function public.track_page_view(text) to anon, authenticated;
grant execute on function public.page_view_stats()     to authenticated;
grant execute on function public.page_view_span()      to authenticated;
