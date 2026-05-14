-- ============================================================
-- WakeRef — 11. WAKESKATE — Flip Tricks
-- ============================================================

insert into figures (slug,name,category_id,sport,difficulty,description,description_en,tips,tips_en) values

('ws-kickflip','Kickflip',(select id from categories where slug='fliptricks'),'wakeskate',2,
'Ollie où le pied avant donne un coup sur la carre heelside pour faire flipper la board de 360° sur son axe longitudinal.',
'Ollie where the front foot kicks the heelside edge to make the board flip 360° along its longitudinal axis.',
array['Partir d''un ollie propre','Flicker le pied avant vers le bas et l''extérieur côté heel','Sauter verticalement','Regarder la board pour la rattraper','Atterrir simultanément sur les deux pieds'],
array['Start from a clean ollie','Flick front foot down and outward heel side','Jump vertically','Watch board to catch it','Land simultaneously on both feet']),

('ws-heelflip','Heelflip',(select id from categories where slug='fliptricks'),'wakeskate',2,
'Ollie où le pied avant donne un coup sur la carre toeside pour faire flipper la board dans le sens inverse du kickflip.',
'Ollie where the front foot kicks the toeside edge to make the board flip in the opposite direction to the kickflip.',
array['Ollie propre','Flicker le pied avant vers l''extérieur côté toe','Mouvement vers l''extérieur (contrairement au kickflip)','Garder la board sous le corps','Rattraper et atterrir simultanément'],
array['Clean ollie','Flick front foot outward toe side','Movement outward (opposite to kickflip)','Keep board under body','Catch and land simultaneously']),

('ws-fs-kickflip','Frontside Kickflip',(select id from categories where slug='fliptricks'),'wakeskate',3,
'Kickflip avec un FS 180° du rider.',
'Kickflip with a FS 180° of the rider.',
array['Kickflip et FS 180° maîtrisés séparément','Les deux se font simultanément','Le flip et la rotation partent ensemble','Atterrir en switch centré'],
array['Kickflip and FS 180° mastered separately','Both happen simultaneously','Flip and rotation start together','Land switch centered']),

('ws-bs-kickflip','Backside Kickflip',(select id from categories where slug='fliptricks'),'wakeskate',3,
'Kickflip avec un BS 180° du rider.',
'Kickflip with a BS 180° of the rider.',
array['Kickflip et BS 180° maîtrisés','Simultanéité du flip et de la rotation BS','Atterrir en switch','Genoux fléchis'],
array['Mastered kickflip and BS 180°','Simultaneous flip and BS rotation','Land switch','Bent knees']),

('ws-varial-kickflip','Varial Kickflip',(select id from categories where slug='fliptricks'),'wakeskate',3,
'BS 180° pop shove-it combiné avec un kickflip.',
'BS 180° pop shove-it combined with a kickflip.',
array['Kickflip et BS shove-it maîtrisés','Les deux rotations se font en même temps','Atterrir centré sur la board','Genoux fléchis'],
array['Mastered kickflip and BS shove-it','Both rotations happen simultaneously','Land centered on board','Bent knees']),

('ws-hardflip','Hardflip',(select id from categories where slug='fliptricks'),'wakeskate',3,
'FS 180° pop shove-it combiné avec un kickflip. La board flip et pivote FS simultanément dans des directions opposées.',
'FS 180° pop shove-it combined with a kickflip. Board flips and pivots FS simultaneously in opposing directions.',
array['Maîtriser kickflip et FS shove-it séparément','Les deux mouvements se font simultanément','Timing très serré','Patience : un des tricks les plus techniques'],
array['Master kickflip and FS shove-it separately','Both movements happen simultaneously','Very tight timing','Patience: one of the most technical tricks']),

('ws-sexchange','Sexchange',(select id from categories where slug='fliptricks'),'wakeskate',3,
'Kickflip avec un FS 180° body varial.',
'Kickflip with a FS 180° body varial.',
array['Kickflip et body varial FS maîtrisés','La board flip pendant que le corps tourne','Timing précis','Atterrir en switch'],
array['Mastered kickflip and FS body varial','Board flips while body rotates','Precise timing','Land switch']),

('ws-360-kickflip','360 Kickflip',(select id from categories where slug='fliptricks'),'wakeskate',4,
'BS 360° pop shove-it combiné avec un kickflip.',
'BS 360° pop shove-it combined with a kickflip.',
array['Varial kickflip et 360° shove-it maîtrisés','Beaucoup de hauteur requise','La board fait 360° en flippant','Figure technique avancée'],
array['Mastered varial kickflip and 360° shove-it','Much height required','Board does 360° while flipping','Advanced technical trick']),

('ws-bigflip','Bigflip',(select id from categories where slug='fliptricks'),'wakeskate',4,
'FS ou BS Bigspin combiné avec un kickflip.',
'FS or BS Bigspin combined with a kickflip.',
array['Big Spin et kickflip maîtrisés','Hauteur importante','Timing très précis','Figure de haut niveau'],
array['Mastered Big Spin and kickflip','Good height','Very precise timing','High level trick']),

('ws-fingerflip','Fingerflip',(select id from categories where slug='fliptricks'),'wakeskate',3,
'Le rider initie la rotation du kickflip avec sa main au lieu du pied.',
'The rider starts the kickflip rotation with their hand instead of their foot.',
array['Ollie propre','Utiliser la main pour initier le flip','Rattraper la board après le flip','Figure de style unique'],
array['Clean ollie','Use hand to initiate flip','Catch board after flip','Unique style trick']);

-- Prérequis Flip Tricks
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ws-kickflip' and r.slug='ws-ollie';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ws-heelflip' and r.slug='ws-ollie';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ws-fs-kickflip' and r.slug='ws-kickflip';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ws-bs-kickflip' and r.slug='ws-kickflip';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ws-varial-kickflip' and r.slug='ws-kickflip';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ws-varial-kickflip' and r.slug='ws-shuvit';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ws-hardflip' and r.slug='ws-kickflip';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ws-sexchange' and r.slug='ws-kickflip';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ws-sexchange' and r.slug='ws-body-varial';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ws-360-kickflip' and r.slug='ws-varial-kickflip';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ws-bigflip' and r.slug='ws-big-spin';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ws-bigflip' and r.slug='ws-kickflip';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ws-fingerflip' and r.slug='ws-kickflip';
