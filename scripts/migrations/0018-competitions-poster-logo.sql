-- WakeRef — compétitions : séparer l'affiche du logo
-- Généré le 2026-09-08. À relire, puis appliquer dans l'éditeur SQL Supabase.
--
-- Le lot A n'avait qu'une image par compétition, nommée `logo_path`. À l'usage,
-- ce qui y a été déposé sont des AFFICHES : riches, faites pour être regardées —
-- parfaites sur la fiche, inutilisables comme repère dans une timeline où il faut
-- un signe reconnaissable au premier coup d'œil, à petite taille.
--
-- On renomme donc l'existant en `poster_path` (les fichiers déjà uploadés sont
-- bien des affiches, aucune donnée à déplacer) et on rouvre `logo_path` pour le
-- logo du parc ou de la compétition, qui servira de marqueur visuel dans le fil.
--
-- Aucun ratio n'est supposé pour l'une ni pour l'autre : côté rendu, les images
-- sont contenues dans leur cadre (`object-fit: contain`), jamais recadrées ni
-- étirées. Un logo large, un logo carré et une affiche portrait doivent tous
-- tomber juste.
--
-- Les deux vivent dans le même préfixe Storage (`videos/competitions/`) : ils
-- sont distingués par la colonne qui les référence, pas par leur chemin.

begin;

alter table public.competitions rename column logo_path to poster_path;

alter table public.competitions
  add column logo_path text check (char_length(logo_path) <= 500);

comment on column public.competitions.poster_path is
  'Affiche de la compétition — bucket videos, préfixe competitions/. Affichée sur la fiche, format d''origine préservé.';
comment on column public.competitions.logo_path is
  'Logo du parc ou de la compétition — bucket videos, préfixe competitions/. Repère visuel dans le fil, contenu sans recadrage.';

commit;
