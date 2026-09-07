-- WakeRef — compétitions : l'année seule se stocke au 31 décembre, plus au 1er janvier
-- Généré le 2026-09-08. À relire, puis appliquer dans l'éditeur SQL Supabase.
--
-- Correctif du 0016. Une compétition annoncée pour une année sans date connue
-- était posée au 1er janvier ; elle basculait donc « passée » dès le premier jour
-- de l'année alors que, par définition, elle est encore à venir. Le 31 décembre
-- dit la même incertitude sans mentir sur le temps, et il range la fiche APRÈS
-- les compétitions datées de la même année — exactement la place de la zone floue
-- en fin de fil.
--
-- Sans effet si le 0016 n'a jamais été appliqué : la table y est déjà correcte.

begin;

-- La contrainte d'abord, sinon l'update la viole ligne à ligne.
alter table public.competitions drop constraint if exists competitions_year_is_jan1;

update public.competitions
   set date_start = make_date(extract(year from date_start)::int, 12, 31)
 where date_precision = 'year'
   and (extract(month from date_start) <> 12 or extract(day from date_start) <> 31);

alter table public.competitions
  add constraint competitions_year_is_dec31 check (
    date_precision <> 'year'
    or (extract(month from date_start) = 12 and extract(day from date_start) = 31 and date_end is null)
  );

commit;
