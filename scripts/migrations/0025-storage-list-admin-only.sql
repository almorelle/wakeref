-- Migration 0025 — Storage : le listing du bucket `videos` réservé à l'admin.
--
-- Constat (2026-09-13) : la policy « Videos publiques » ouvrait le SELECT sur
-- `storage.objects` à tout le monde. Or ce SELECT ne sert pas à télécharger un
-- fichier d'un bucket public — `/storage/v1/object/public/…` sert l'objet sans
-- consulter aucune policy — il sert à LISTER. N'importe quel visiteur pouvait
-- donc appeler `storage.from('videos').list('competitions')` avec la clé anon et
-- obtenir le nom de chaque fichier : affiches et logos des compétitions non
-- publiées compris, vidéos des figures non publiées et des runs d'entraînement
-- juge compris. La RLS des tables ne s'étend pas au Storage.
--
-- Rien de public n'en a besoin : le site ne fabrique que des URL publiques
-- (`getPublicUrl`, un calcul local, aucune requête). Les seuls `list()` du code
-- sont dans l'admin (`AdminDashboard`, `AdminNoVideos`, `JudgeRunForm`), qui est
-- authentifié. `remove()` a besoin du SELECT pour retrouver l'objet : l'admin le
-- garde.
--
-- Ce qui reste vrai après : un fichier dont on connaît l'URL exacte reste
-- servi, c'est la nature d'un bucket public. Les nouveaux dépôts de
-- `CompetitionForm` prennent un nom aléatoire (UUID) plutôt qu'un horodatage,
-- pour que cette URL ne se devine pas.
--
-- À exécuter UNE fois dans l'éditeur SQL Supabase.
-- Mirroré dans scripts/wakeref_post_restore.sql (section 7).

drop policy if exists "Videos publiques"        on storage.objects;
drop policy if exists "Lecture admin seulement" on storage.objects;

create policy "Lecture admin seulement"
  on storage.objects for select
  using (bucket_id = 'videos' and (select auth.role()) = 'authenticated');

-- Contrôle, avec la clé anon (doit renvoyer `[]`) :
--   curl -X POST "$SUPABASE_URL/storage/v1/object/list/videos" \
--     -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
--     -H "Content-Type: application/json" -d '{"prefix":"competitions"}'
-- Et une URL publique existante doit toujours répondre 200 :
--   curl -I "$SUPABASE_URL/storage/v1/object/public/videos/competitions/ffsnw.png"
