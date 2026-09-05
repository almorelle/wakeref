-- WakeRef — correctif de données : figures.contexts
-- Généré le 2026-09-04. À relire, puis appliquer dans l'éditeur SQL Supabase.
--
-- Deux familles étaient incomplètes :
--   * les rolls toeside et la famille pete-rose étaient en 'kicker' seul, alors que
--     leur équivalent heelside porte déjà 'air_trick' (et qu'une vidéo attachée à
--     pete-rose s'intitule « How to pete en blocage »)
--   * trois dérivés du ws-kickflip et le ws-360-shuvit étaient en 'flat' seul alors
--     que leur base porte 'kicker'
--
-- Les mises à jour sont idempotentes : rejouer le script ne duplique rien.
-- Non modifiés volontairement (arbitrage rider) : railey et tweetie restent en
-- 'air_trick' seul, la famille tantrum reste en 'kicker' seul — le même mouvement
-- en blocage relève du whip-trick, pas de la même figure.

begin;

do $guard$
declare missing text;
begin
  select string_agg(s, ', ') into missing
  from unnest(array[
    'pete-rose', 'pete-rose-5', 'pete-rose-7', 'blind-pete', 'blind-pete-rose',
    'ts-back-roll', 'ts-roll-to-blind', 'ts-half-cab-roll', 'ts-roll-to-revert',
    'ws-bigflip', 'ws-hardflip', 'ws-360-shuvit', 'ws-varial-kickflip'
  ]) as s
  where not exists (select 1 from figures f where f.slug = s);
  if missing is not null then
    raise exception 'slugs introuvables dans figures : %', missing;
  end if;
end
$guard$;

-- 1. rolls toeside + famille pete-rose : ajout du blocage
update figures
set contexts = contexts || array['air_trick']
where slug in (
  'pete-rose', 'pete-rose-5', 'pete-rose-7', 'blind-pete', 'blind-pete-rose',
  'ts-back-roll', 'ts-roll-to-blind', 'ts-half-cab-roll', 'ts-roll-to-revert'
)
  and not ('air_trick' = any(contexts));

-- 2. famille kickflip wakeskate : ajout du kicker
update figures
set contexts = contexts || array['kicker']
where slug in ('ws-bigflip', 'ws-hardflip', 'ws-360-shuvit', 'ws-varial-kickflip')
  and not ('kicker' = any(contexts));

-- contrôle : les 13 figures doivent porter le contexte attendu
select slug,
       contexts,
       case
         when slug like 'ws-%' then 'kicker' = any(contexts)
         else 'air_trick' = any(contexts)
       end as ok
from figures
where slug in (
  'pete-rose', 'pete-rose-5', 'pete-rose-7', 'blind-pete', 'blind-pete-rose',
  'ts-back-roll', 'ts-roll-to-blind', 'ts-half-cab-roll', 'ts-roll-to-revert',
  'ws-bigflip', 'ws-hardflip', 'ws-360-shuvit', 'ws-varial-kickflip'
)
order by ok, slug;

-- contrôle : plus aucune paire toeside / heelside divergente sur ces familles
select t.slug as toeside, t.contexts as ctx_ts,
       h.slug as heelside, h.contexts as ctx_hs
from figures t
join figures h on h.slug = substring(t.slug from 4)
where t.slug in ('ts-back-roll', 'ts-roll-to-blind', 'ts-half-cab-roll', 'ts-roll-to-revert')
  and not (t.contexts @> h.contexts and h.contexts @> t.contexts);

commit;  -- ou rollback;
