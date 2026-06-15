-- Migration 0003 — métadonnées vidéo : sport (override) + genre de la personne
--
-- Pourquoi : le sport vit aujourd'hui sur `figures`, mais une exécution filmée
-- peut diverger (cross-pollination wakeboard/wakeskate, ou wakeboard assis =
-- `seated`). Le genre de la personne filmée est une donnée de CURATION INTERNE
-- (équilibrer collections & quiz) — jamais un label ni un filtre public.
--
-- À exécuter dans l'éditeur SQL Supabase, APRÈS la migration 0002.
-- ⚠️ L'étape 1 (ALTER TYPE … ADD VALUE) doit être validée AVANT que l'étape 2
--    ne référence la nouvelle valeur. Dans l'éditeur Supabase (autocommit),
--    exécute l'étape 1 seule, puis l'étape 2.
-- Mirroré dans : scripts/wakeref_schema.sql (dump tables, non exécutable).

-- 1. Étendre l'enum sport (handiwake / wakeboard assis).
alter type sport_type add value if not exists 'seated';

-- 2. Colonnes sur videos.
--    sport NULL            → hérite du sport de la figure (override seulement si diverge)
--    performer_gender NULL → non renseigné (distinct de 'other')
alter table public.videos
  add column if not exists sport sport_type,
  add column if not exists performer_gender text
    check (performer_gender in ('man', 'woman', 'other'));
