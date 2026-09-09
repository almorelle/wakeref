-- WakeRef — plafond de taille sur le bucket `videos`
-- Généré le 2026-09-09. À relire, puis appliquer dans l'éditeur SQL Supabase.
--
-- Les formulaires d'admin refusent désormais un fichier trop lourd
-- (`src/lib/uploadLimits.js` : 25 Mo pour une vidéo, 5 Mo pour une image), mais
-- ce contrôle vit dans le navigateur : il se contourne, et il disparaît si un
-- futur écran d'upload oublie de l'appeler. La borne réelle est ici.
--
-- 25 Mo, soit le plus large des deux plafonds applicatifs : le bucket ne
-- distingue pas une affiche d'un clip, donc il doit laisser passer le plus gros.
-- C'est le filet, pas la règle — c'est côté formulaire que se joue la finesse.
--
-- Pour mémoire : le bucket est PUBLIC et le plan est gratuit (1 Go). Quelques
-- fichiers non compressés suffisent à le remplir.

update storage.buckets
   set file_size_limit = 25 * 1024 * 1024
 where id = 'videos';

-- Contrôle : doit renvoyer 26214400.
-- select id, file_size_limit from storage.buckets where id = 'videos';
