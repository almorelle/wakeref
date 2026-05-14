-- ============================================================
-- WakeRef — 04. Famille HINTERBERGER
-- ============================================================

insert into figures (slug,name,category_id,sport,difficulty,description,description_en,tips,tips_en) values

('hinterberger','Hinterberger',(select id from categories where slug='hinterberger'),'wakeboard',4,
'Un railey avec un FS 360° et le handle au-dessus de la tête (olé frontside). Variante frontside du S-Bend.',
'A railey with a FS 360° and the handle above the head (frontside ole). Frontside variant of the S-Bend.',
array['Railey très chargé','FS 360° avec le handle en olé au-dessus de la tête','Timing précis pour la position du handle','Atterrissage face avant'],
array['Heavily loaded railey','FS 360° with handle in ole above head','Precise timing for handle position','Forward facing landing']),

('hinterberger-5','Hinterberger 5',(select id from categories where slug='hinterberger'),'wakeboard',5,
'Un Hinterberger avec un FS 180° supplémentaire pour atterrir en switch.',
'A Hinterberger with an extra FS 180° to land switch.',
array['Hinterberger propre comme base','FS 180° ajouté en fin de rotation','Atterrissage en switch','Figure d''élite'],
array['Clean Hinterberger as base','FS 180° added at end of rotation','Switch landing','Elite trick']),

('hinterberger-to-blind','Hinterberger to Blind',(select id from categories where slug='hinterberger'),'wakeboard',5,
'Un Hinterberger avec un BS 180° pour atterrir blind.',
'A Hinterberger with a BS 180° to land blind.',
array['Hinterberger maîtrisé','BS 180° initié en fin de rotation','Atterrissage blind','Figure de haut niveau'],
array['Mastered Hinterberger','BS 180° initiated at end of rotation','Blind landing','High level trick']),

('118','118',(select id from categories where slug='hinterberger'),'wakeboard',5,
'Double Hinterberger : un railey avec un FS 720° olé. Deux rotations frontside avec le handle au-dessus de la tête.',
'Double Hinterberger: a railey with a FS 720° ole. Two frontside rotations with the handle above the head.',
array['Hinterberger très propre et haut','Double la vitesse de rotation FS','Handle en olé pendant les deux rotations','Figure d''élite extrême'],
array['Very clean and high Hinterberger','Double FS rotation speed','Handle in ole during both rotations','Extreme elite trick']),

('118-900','118 900',(select id from categories where slug='hinterberger'),'wakeboard',5,
'Un 118 avec un FS 180° supplémentaire (total 900°).',
'A 118 with an extra FS 180° (total 900°).',
array['118 maîtrisé','FS 180° ajouté en fin','Figure d''élite absolue','Hauteur et conditions parfaites'],
array['Mastered 118','FS 180° added at end','Absolute elite trick','Perfect height and conditions']);

-- Prérequis Hinterberger
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='hinterberger' and r.slug='railey';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='hinterberger' and r.slug='hs-fs-360';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='hinterberger-5' and r.slug='hinterberger';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='hinterberger-to-blind' and r.slug='hinterberger';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='118' and r.slug='hinterberger';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='118-900' and r.slug='118';
