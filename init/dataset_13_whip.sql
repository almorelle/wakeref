-- ============================================================
-- WakeRef — Famille WHIP (contre carre)
-- Source : WHIP_FAMILY_TREE.pdf
-- À exécuter après les datasets existants
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- On réutilise la catégorie Tantrum (slug='tantrum')
-- Les whip tricks sont des variantes contre-carre des familles
-- Tantrum (Bell Air), Front Roll (Ben Air) et Scarecrow (Egg Roll)
-- ════════════════════════════════════════════════════════════

insert into figures (slug,name,category_id,sport,difficulty,description,description_en,tips,tips_en) values

-- ────────────────────────────────────────────────────────────
-- BELL AIR family
-- ────────────────────────────────────────────────────────────
(
  'bell-air','Bell Air',
  (select id from categories where slug='tantrum'),'wakeboard',4,
  'Backflip heelside effectué en quittant l''eau sur la carre toeside (contre-carre). Variante du Tantrum où le rider charge côté talon mais décolle sur la carre opposée, créant une rotation différente.',
  'Heelside backflip performed by leaving the water on the toeside edge (opposite edge). Tantrum variant where the rider loads heelside but takes off on the opposite edge, creating a different rotation.',
  array['Charger côté heelside puis transférer sur la carre toeside au décollage','La rotation est similaire au tantrum mais l''axe est différent','Garder les bras tendus et la corde tirée','Réceptionner avec les genoux bien fléchis'],
  array['Load heelside then transfer to toeside edge at takeoff','Rotation is similar to tantrum but axis is different','Keep arms extended and rope pulled','Land with well-bent knees']
),
(
  'bell-air-to-fakie','Bell Air to Fakie',
  (select id from categories where slug='tantrum'),'wakeboard',4,
  'Un Bell Air avec un FS 180° pour atterrir en switch.',
  'A Bell Air with a FS 180° to land switch.',
  array['Bell Air maîtrisé comme base','FS 180° initié au sommet du backflip','Atterrissage en switch','Genoux fléchis pour absorber'],
  array['Mastered Bell Air as base','FS 180° initiated at top of backflip','Switch landing','Bent knees to absorb']
),
(
  'bell-air-to-blind','Bell Air to Blind',
  (select id from categories where slug='tantrum'),'wakeboard',5,
  'Un Bell Air avec un BS 180° pour atterrir blind.',
  'A Bell Air with a BS 180° to land blind.',
  array['Bell Air solide','BS 180° initié pendant le flip','Préparer l''atterrissage blind','Handle dans le dos à la réception'],
  array['Solid Bell Air','BS 180° initiated during flip','Prepare for blind landing','Handle behind back on landing']
),
(
  'bell-air-moby-dick','Bell Air Moby Dick',
  (select id from categories where slug='tantrum'),'wakeboard',5,
  'Un Bell Air avec un BS 360° handle pass. Version Bell Air du Moby Dick.',
  'A Bell Air with a BS 360° handle pass. Bell Air version of the Moby Dick.',
  array['Bell Air solide et BS 360° maîtrisé','Initier le BS 360° pendant le backflip','Passer le handle dans le dos','Repérer l''atterrissage après la rotation'],
  array['Solid Bell Air and mastered BS 360°','Initiate BS 360° during backflip','Pass handle behind back','Spot landing after rotation']
),
(
  'tweetie','Tweetie',
  (select id from categories where slug='tantrum'),'wakeboard',5,
  'Whirly Bird effectué en quittant l''eau sur la carre toeside (contre-carre). Combine l''axe du Bell Air avec la rotation olé du Whirly Bird.',
  'Whirly Bird performed by leaving the water on the toeside edge (opposite edge). Combines the Bell Air axis with the Whirly Bird ole rotation.',
  array['Bell Air et Whirly Bird maîtrisés','Partir sur la carre toeside comme un Bell Air','BS 360° olé pendant la phase de backflip','Figure d''élite, hauteur maximale requise'],
  array['Mastered Bell Air and Whirly Bird','Take off on toeside edge like a Bell Air','BS 360° ole during backflip phase','Elite trick, maximum height required']
),
(
  'tweetie-5','Tweetie 5',
  (select id from categories where slug='tantrum'),'wakeboard',5,
  'Un Tweetie avec un BS 180° supplémentaire pour atterrir blind (BS 540° olé total).',
  'A Tweetie with an extra BS 180° to land blind (total BS 540° ole).',
  array['Tweetie propre comme base','BS 180° ajouté en fin de rotation','Atterrissage blind','Figure d''élite absolue'],
  array['Clean Tweetie as base','BS 180° added at end of rotation','Blind landing','Absolute elite trick']
),

-- ────────────────────────────────────────────────────────────
-- BEN AIR family
-- ────────────────────────────────────────────────────────────
(
  'ben-air','Ben Air',
  (select id from categories where slug='front'),'wakeboard',4,
  'Front Roll effectué en quittant l''eau sur la carre heelside (contre-carre). Variante du Front Roll où le rider décolle sur la carre opposée à l''approche toeside habituelle.',
  'Front Roll performed by leaving the water on the heelside edge (opposite edge). Front Roll variant where the rider takes off on the opposite edge to the usual toeside approach.',
  array['Front Roll maîtrisé','Approche toeside mais décollage sur la carre heelside (contre-carre)','La rotation reste heel over toe','Réceptionner avec les genoux fléchis'],
  array['Mastered Front Roll','Toeside approach but take off on heelside edge (opposite edge)','Rotation stays heel over toe','Land with bent knees']
),
(
  'ben-air-tootsie','Ben Air Tootsie',
  (select id from categories where slug='front'),'wakeboard',5,
  'Un Ben Air avec un BS 180° pour atterrir en switch.',
  'A Ben Air with a BS 180° to land switch.',
  array['Ben Air maîtrisé','BS 180° initié pendant le roll','Atterrissage en switch','Figure de haut niveau'],
  array['Mastered Ben Air','BS 180° initiated during roll','Switch landing','High level trick']
),

-- ────────────────────────────────────────────────────────────
-- EGG ROLL family
-- ────────────────────────────────────────────────────────────
(
  'egg-roll','Egg Roll',
  (select id from categories where slug='front'),'wakeboard',4,
  'Scarecrow effectué en quittant l''eau sur la carre heelside (contre-carre). Combine l''axe du Ben Air avec la rotation FS 180° du Scarecrow.',
  'Scarecrow performed by leaving the water on the heelside edge (opposite edge). Combines the Ben Air axis with the Scarecrow FS 180° rotation.',
  array['Scarecrow et Ben Air maîtrisés','Décollage sur la carre heelside comme un Ben Air','FS 180° intégré comme dans le Scarecrow','Figure avancée demandant une bonne maîtrise des deux figures de base'],
  array['Mastered Scarecrow and Ben Air','Take off on heelside edge like a Ben Air','FS 180° integrated like in the Scarecrow','Advanced trick requiring good mastery of both base tricks']
),
(
  'egg-mobe','Egg Mobe',
  (select id from categories where slug='front'),'wakeboard',5,
  'Un Egg Roll avec un BS 180° supplémentaire.',
  'An Egg Roll with an extra BS 180°.',
  array['Egg Roll propre comme base','BS 180° ajouté en fin de rotation','Atterrissage sur le pied d''origine','Figure d''élite'],
  array['Clean Egg Roll as base','BS 180° added at end of rotation','Landing on original foot','Elite trick']
);

-- ════════════════════════════════════════════════════════════
-- PRÉREQUIS
-- ════════════════════════════════════════════════════════════

-- Bell Air family
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='bell-air'          and r.slug='tantrum';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='bell-air-to-fakie' and r.slug='bell-air';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='bell-air-to-blind' and r.slug='bell-air';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='bell-air-moby-dick' and r.slug='bell-air';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='bell-air-moby-dick' and r.slug='moby-dick';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='tweetie'           and r.slug='bell-air';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='tweetie'           and r.slug='whirly-bird';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='tweetie-5'         and r.slug='tweetie';

-- Ben Air family
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ben-air'           and r.slug='front-roll';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ben-air-tootsie'   and r.slug='ben-air';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ben-air-tootsie'   and r.slug='tootsie';

-- Egg Roll family
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='egg-roll'          and r.slug='ben-air';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='egg-roll'          and r.slug='scarecrow';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='egg-mobe'          and r.slug='egg-roll';