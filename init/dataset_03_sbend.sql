-- ============================================================
-- WakeRef — 03. Famille S-BEND
-- ============================================================

insert into figures (slug,name,category_id,sport,difficulty,description,description_en,tips,tips_en) values

('s-bend','S-Bend',(select id from categories where slug='s-bend'),'wakeboard',4,
'Un railey où le rider effectue un BS 360° avec le handle au-dessus de la tête (olé). Figure emblématique du wakeboard de haut niveau.',
'A railey where the rider does a BS 360° with the handle above their head (ole). Iconic high-level wakeboard trick.',
array['Railey très chargé','Le handle passe au-dessus de la tête au lieu d''être passé derrière le dos','Rotation BS 360° en position étendue','Ramener les pieds proprement pour l''atterrissage'],
array['Heavily loaded railey','Handle passes above the head instead of behind the back','BS 360° rotation in extended position','Bring feet back cleanly for landing']),

('vulcan','Vulcan',(select id from categories where slug='s-bend'),'wakeboard',5,
'Un S-Bend avec un rewind FS 180°. Combine la complexité du S-Bend avec un changement de direction de rotation.',
'An S-Bend with a FS 180° rewind. Combines S-Bend complexity with a rotation direction change.',
array['S-Bend solide et propre','Initier le rewind FS 180° après le BS 360°','Timing très précis','Figure de très haut niveau'],
array['Clean solid S-Bend','Initiate FS 180° rewind after the BS 360°','Very precise timing','Very high level trick']),

('s-bend-to-blind','S-Bend to Blind',(select id from categories where slug='s-bend'),'wakeboard',5,
'Un S-Bend avec un BS 180° supplémentaire pour atterrir blind.',
'An S-Bend with an extra BS 180° to land blind.',
array['S-Bend maîtrisé','Ajouter le BS 180° en fin de rotation','Préparer l''atterrissage blind','Figure d''élite'],
array['Mastered S-Bend','Add BS 180° at end of rotation','Prepare for blind landing','Elite trick']),

('heart-attack','Heart Attack',(select id from categories where slug='s-bend'),'wakeboard',5,
'Un S-Bend avec un BS 360° handle pass ajouté.',
'An S-Bend with a BS 360° handle pass added.',
array['S-Bend solide','BS 360° handle pass pendant la phase d''extension','Timing très précis','Figure de compétition'],
array['Solid S-Bend','BS 360° handle pass during extension phase','Very precise timing','Competition trick']),

('s-mobe','S-Mobe',(select id from categories where slug='s-bend'),'wakeboard',5,
'Un S-Bend avec un FS 360° handle pass ajouté.',
'An S-Bend with a FS 360° handle pass added.',
array['S-Bend et 313 maîtrisés','FS 360° handle pass pendant la phase S-Bend','Timing extrêmement précis','Figure d''élite'],
array['Mastered S-Bend and 313','FS 360° handle pass during S-Bend phase','Extremely precise timing','Elite trick']),

('s-mobe-5','S-Mobe 5',(select id from categories where slug='s-bend'),'wakeboard',5,
'Un S-Bend avec un FS 540° handle pass ajouté.',
'An S-Bend with a FS 540° handle pass added.',
array['S-Mobe maîtrisé','Hauteur maximale','Handle pass ultra-rapide','Figure d''élite absolue'],
array['Mastered S-Mobe','Maximum height','Ultra-fast handle pass','Absolute elite trick']),

('double-s-bend','Double S-Bend',(select id from categories where slug='s-bend'),'wakeboard',5,
'Un railey avec un BS 720° olé. Deux rotations BS avec le handle au-dessus de la tête.',
'A railey with a BS 720° ole. Two BS rotations with the handle above the head.',
array['S-Bend très propre et haut comme base','Double la vitesse de rotation','Handle reste en olé pendant les deux rotations','Figure d''élite extrême'],
array['Very clean and high S-Bend as base','Double rotation speed','Handle stays in ole during both rotations','Extreme elite trick']),

('double-s-bend-to-blind','Double S-Bend to Blind',(select id from categories where slug='s-bend'),'wakeboard',5,
'Un Double S-Bend avec un BS 180° supplémentaire pour atterrir blind.',
'A Double S-Bend with an extra BS 180° to land blind.',
array['Double S-Bend maîtrisé','BS 180° ajouté en fin de rotation','Atterrissage blind','Figure d''élite absolue'],
array['Mastered Double S-Bend','BS 180° added at end of rotation','Blind landing','Absolute elite trick']);

-- Prérequis S-Bend
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='s-bend' and r.slug='railey';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='vulcan' and r.slug='s-bend';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='s-bend-to-blind' and r.slug='s-bend';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='heart-attack' and r.slug='s-bend';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='s-mobe' and r.slug='s-bend';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='s-mobe' and r.slug='313';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='s-mobe-5' and r.slug='s-mobe';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='double-s-bend' and r.slug='s-bend';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='double-s-bend-to-blind' and r.slug='double-s-bend';
