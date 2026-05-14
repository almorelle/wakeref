-- ============================================================
-- WakeRef — 07. Famille TANTRUM
-- ============================================================

insert into figures (slug,name,category_id,sport,difficulty,description,description_en,tips,tips_en) values

('tantrum','Tantrum',(select id from categories where slug='tantrum'),'wakeboard',3,
'Heelside backflip : saut périlleux arrière en approche HS. Le rider charge le wake côté talon et bascule en arrière. L''une des premières inverts apprises.',
'Heelside backflip: backward flip on HS approach. The rider loads the heelside wake and falls back. One of the first inverts to learn.',
array['Charger progressivement le wake heelside','Au sommet du wake, regarder par-dessus l''épaule arrière','Laisser le wake faire le travail','Garder les bras tendus et la corde tirée','Réceptionner avec les genoux bien fléchis'],
array['Load the heelside wake progressively','At the top of the wake, look over your back shoulder','Let the wake do the work','Keep arms extended and rope pulled','Land with well-bent knees']),

('tantrum-to-fakie','Tantrum to Fakie',(select id from categories where slug='tantrum'),'wakeboard',3,
'Un Tantrum avec un FS 180° pour atterrir en switch.',
'A Tantrum with a FS 180° to land switch.',
array['Tantrum propre comme base','FS 180° initié au sommet du backflip','Atterrissage en switch','Genoux fléchis pour absorber'],
array['Clean Tantrum as base','FS 180° initiated at top of backflip','Switch landing','Bent knees to absorb']),

('tantrum-to-blind','Tantrum to Blind',(select id from categories where slug='tantrum'),'wakeboard',4,
'Un Tantrum avec un BS 180° pour atterrir blind.',
'A Tantrum with a BS 180° to land blind.',
array['Tantrum solide','BS 180° initié pendant le flip','Préparer l''atterrissage blind','Handle dans le dos à la réception'],
array['Solid Tantrum','BS 180° initiated during flip','Prepare for blind landing','Handle behind back on landing']),

('moby-dick','Moby Dick',(select id from categories where slug='tantrum'),'wakeboard',4,
'Un Tantrum avec un BS 360° handle pass.',
'A Tantrum with a BS 360° handle pass.',
array['Tantrum solide et BS 360° maîtrisé','Initier le BS 360° pendant le backflip','Passer le handle dans le dos','Repérer l''atterrissage après la rotation'],
array['Solid Tantrum and mastered BS 360°','Initiate BS 360° during backflip','Pass handle behind back','Spot landing after rotation']),

('moby-dick-5','Moby Dick 5',(select id from categories where slug='tantrum'),'wakeboard',5,
'Un Tantrum avec un BS 540° handle pass.',
'A Tantrum with a BS 540° handle pass.',
array['Moby Dick maîtrisé','Hauteur maximale','Handle pass ultra-rapide','Figure d''élite'],
array['Mastered Moby Dick','Maximum height','Ultra-fast handle pass','Elite trick']),

('whirly-bird','Whirly Bird',(select id from categories where slug='tantrum'),'wakeboard',4,
'Un Tantrum avec un BS 360° olé (handle au-dessus de la tête). Version olé du Moby Dick.',
'A Tantrum with a BS 360° ole (handle above head). Ole version of the Moby Dick.',
array['Tantrum très haut','BS 360° avec le handle en olé au-dessus de la tête','Le handle ne passe pas dans le dos : il reste au-dessus','Atterrissage face avant'],
array['Very high Tantrum','BS 360° with handle in ole above head','Handle doesn''t go behind back: stays above','Forward facing landing']),

('whirly-5','Whirly 5',(select id from categories where slug='tantrum'),'wakeboard',5,
'Un Whirly Bird avec un BS 180° supplémentaire pour atterrir blind (BS 540° olé total).',
'A Whirly Bird with an extra BS 180° to land blind (total BS 540° ole).',
array['Whirly Bird propre','BS 180° ajouté en fin de rotation','Atterrissage blind','Figure de haut niveau'],
array['Clean Whirly Bird','BS 180° added at end of rotation','Blind landing','High level trick']),

('whirly-7','Whirly 7',(select id from categories where slug='tantrum'),'wakeboard',5,
'Un Whirly Bird avec un BS 360° handle pass supplémentaire.',
'A Whirly Bird with an extra BS 360° handle pass.',
array['Whirly Bird très haut','BS 360° handle pass ajouté','Timing extrêmement précis','Figure d''élite'],
array['Very high Whirly Bird','BS 360° handle pass added','Extremely precise timing','Elite trick']),

('whirly-dick','Whirly Dick',(select id from categories where slug='tantrum'),'wakeboard',5,
'Un Whirly Bird avec un BS 360° handle pass.',
'A Whirly Bird with a BS 360° handle pass.',
array['Whirly Bird maîtrisé','BS 360° handle pass pendant la phase olé','Timing très précis','Figure d''élite'],
array['Mastered Whirly Bird','BS 360° handle pass during ole phase','Very precise timing','Elite trick']),

('double-whirly','Double Whirly',(select id from categories where slug='tantrum'),'wakeboard',5,
'Double Whirly Bird : un Tantrum avec un BS 720° olé.',
'Double Whirly Bird: a Tantrum with a BS 720° ole.',
array['Whirly Bird très propre et haut','Double la vitesse de rotation','Handle en olé pendant les deux rotations','Figure d''élite extrême'],
array['Very clean and high Whirly Bird','Double rotation speed','Handle in ole during both rotations','Extreme elite trick']);

-- Prérequis Tantrum
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='tantrum' and r.slug='hs-fs-360';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='tantrum-to-fakie' and r.slug='tantrum';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='tantrum-to-blind' and r.slug='tantrum';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='moby-dick' and r.slug='tantrum';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='moby-dick-5' and r.slug='moby-dick';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='whirly-bird' and r.slug='tantrum';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='whirly-5' and r.slug='whirly-bird';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='whirly-7' and r.slug='whirly-bird';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='whirly-dick' and r.slug='whirly-bird';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='double-whirly' and r.slug='whirly-bird';
