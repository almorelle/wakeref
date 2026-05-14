-- ============================================================
-- WakeRef — 06. Famille FRONT
-- ============================================================

insert into figures (slug,name,category_id,sport,difficulty,description,description_en,tips,tips_en) values

('front-flip','Front Flip',(select id from categories where slug='front'),'wakeboard',3,
'Approche heelside, la planche fait une rotation tail vers nose (roue, axe de rotation perpendiculaire aux épaules). Opposé du Back Roll dans son axe.',
'Heelside approach, board rotates tail over nose (wheel, rotation axis perpendicular to shoulders). Opposite of the Back Roll.',
array['Charger le wake HS puis basculer vers l''avant','Regarder vers le nose au décollage','Garder les bras proches du corps pendant le flip','Repérer l''eau rapidement pour l''atterrissage'],
array['Load HS wake then tilt forward','Look toward the nose at takeoff','Keep arms close during the flip','Spot the water quickly for landing']),

('front-flip-to-fakie','Front Flip to Fakie',(select id from categories where slug='front'),'wakeboard',3,
'Un Front Flip avec un FS 180° pour atterrir en switch.',
'A Front Flip with a FS 180° to land switch.',
array['Front Flip propre comme base','FS 180° initié pendant le flip','Atterrissage en switch','Genoux fléchis pour absorber'],
array['Clean Front Flip as base','FS 180° initiated during flip','Switch landing','Bent knees to absorb']),

('front-flip-to-blind','Front Flip to Blind',(select id from categories where slug='front'),'wakeboard',4,
'Un Front Flip avec un BS 180° pour atterrir blind. Aussi appelé Hassle Hoff.',
'A Front Flip with a BS 180° to land blind. Also known as Hassle Hoff.',
array['Front Flip maîtrisé','BS 180° initié pendant le flip','Préparer l''atterrissage blind','Handle dans le dos'],
array['Mastered Front Flip','BS 180° initiated during flip','Prepare for blind landing','Handle behind back']),

('front-blind-mobe','Front Blind Mobe',(select id from categories where slug='front'),'wakeboard',5,
'Un Front Flip avec un BS 360° handle pass.',
'A Front Flip with a BS 360° handle pass.',
array['Front Flip propre et BS 360° maîtrisé','BS 360° pendant la phase de flip','Passer le handle rapidement','Figure d''élite'],
array['Clean Front Flip and mastered BS 360°','BS 360° during flip phase','Pass handle quickly','Elite trick']),

('slim-chance','Slim Chance',(select id from categories where slug='front'),'wakeboard',5,
'Un Front Flip avec un FS 360° handle pass. Aussi appelé Phat Chance.',
'A Front Flip with a FS 360° handle pass. Also known as Phat Chance.',
array['Front Flip très haut','FS 360° handle pass pendant le flip','Timing précis','Figure d''élite'],
array['Very high Front Flip','FS 360° handle pass during flip','Precise timing','Elite trick']),

('front-roll','Front Roll',(select id from categories where slug='front'),'wakeboard',3,
'Approche toeside, la planche effectue une rotation carre HS vers carre TS (saut périlleux avant, axe de rotation parallèle aux épaules).',
'Toeside approach, board rotates heelside edge to toeside edge (forward flip, rotation axis parallel to shoulders).',
array['Charger le wake toeside','Basculer vers l''avant depuis le toeside','Regarder vers le bas pendant la rotation','Réceptionner avec les genoux fléchis'],
array['Load the toeside wake','Tilt forward from toeside','Look downward during rotation','Land with bent knees']),

('scarecrow','Scarecrow',(select id from categories where slug='front'),'wakeboard',3,
'Un Front Roll avec un FS 180° pour atterrir face avant.',
'A Front Roll with a FS 180° to land forward.',
array['Front Roll solide','FS 180° s''initie naturellement avec le roll','Regarder l''atterrissage par-dessus l''épaule frontside','Ne pas précipiter la rotation'],
array['Solid Front Roll','FS 180° initiates naturally with the roll','Look at landing over frontside shoulder','Don''t rush the rotation']),

('crow-mobe','Crow Mobe',(select id from categories where slug='front'),'wakeboard',4,
'Un Front Roll avec un FS 360° handle pass.',
'A Front Roll with a FS 360° handle pass.',
array['Front Roll solide et FS 360° maîtrisé','Initier le FS 360° pendant la phase inversée','Passer le handle rapidement','Repérer l''atterrissage tôt'],
array['Solid Front Roll and mastered FS 360°','Initiate FS 360° during inverted phase','Pass handle quickly','Spot landing early']),

('crow-mobe-5','Crow Mobe 5',(select id from categories where slug='front'),'wakeboard',5,
'Un Front Roll avec un FS 540° handle pass.',
'A Front Roll with a FS 540° handle pass.',
array['Crow Mobe maîtrisé','Hauteur maximale','Handle pass très rapide','Figure d''élite'],
array['Mastered Crow Mobe','Maximum height','Very fast handle pass','Elite trick']),

('crow-mobe-7','Crow Mobe 7',(select id from categories where slug='front'),'wakeboard',5,
'Un Front Roll avec un FS 720° handle pass.',
'A Front Roll with a FS 720° handle pass.',
array['Crow Mobe 5 maîtrisé','Hauteur maximale','Figure d''élite absolue','Conditions parfaites'],
array['Mastered Crow Mobe 5','Maximum height','Absolute elite trick','Perfect conditions']),

('elephant','Elephant',(select id from categories where slug='front'),'wakeboard',4,
'Un Scarecrow avec un rewind BS 180° pour atterrir sur le pied d''origine. Aussi appelé FANT.',
'A Scarecrow with a BS 180° rewind to land on the original foot. Also known as FANT.',
array['Scarecrow solide','Rewind BS 180° initié après le FS 180° du scarecrow','Atterrissage sur le pied original','Timing précis pour le rewind'],
array['Solid Scarecrow','BS 180° rewind initiated after scarecrow FS 180°','Landing on original foot','Precise timing for rewind']),

('tootsie','Tootsie',(select id from categories where slug='front'),'wakeboard',4,
'Un Front Roll avec un BS 180° handle pass.',
'A Front Roll with a BS 180° handle pass.',
array['Front Roll propre','BS 180° avec handle pass pendant le roll','Atterrissage en switch','Figure de style'],
array['Clean Front Roll','BS 180° with handle pass during roll','Switch landing','Style trick']),

('dum-dum','Dum Dum',(select id from categories where slug='front'),'wakeboard',5,
'Un Front Roll avec un BS 360° handle pass.',
'A Front Roll with a BS 360° handle pass.',
array['Tootsie maîtrisé','BS 360° handle pass pendant le roll','Timing très précis','Figure de haut niveau'],
array['Mastered Tootsie','BS 360° handle pass during roll','Very precise timing','High level trick']);

-- Switches Front
insert into figures (slug,name,category_id,sport,difficulty,is_switch,description,description_en,tips,tips_en)
select 'hassle-hoff','Hassle Hoff',category_id,sport,difficulty,true,
  'Version switch du Front Flip to Blind. S''exécute en prenant le départ en switch depuis le wake heelside.',
  'Switch version of Front Flip to Blind. Performed starting switch off the heelside wake.',
  tips, tips_en from figures where slug='front-flip-to-blind';
update figures set switch_of=(select id from figures where slug='front-flip-to-blind') where slug='hassle-hoff';

insert into figures (slug,name,category_id,sport,difficulty,is_switch,description,description_en,tips,tips_en)
select 'fat-chance','Fat Chance',category_id,sport,difficulty,true,
  'Version switch du Slim Chance. S''exécute en prenant le départ en switch depuis le wake heelside.',
  'Switch version of Slim Chance. Performed starting switch off the heelside wake.',
  tips, tips_en from figures where slug='slim-chance';
update figures set switch_of=(select id from figures where slug='slim-chance') where slug='fat-chance';

insert into figures (slug,name,category_id,sport,difficulty,is_switch,description,description_en,tips,tips_en)
select 'squeezer','Squeezer',category_id,sport,difficulty,true,
  'Version switch du Scarecrow. S''exécute en prenant le départ en switch depuis le wake toeside.',
  'Switch version of the Scarecrow. Performed starting switch off the toeside wake.',
  tips, tips_en from figures where slug='scarecrow';
update figures set switch_of=(select id from figures where slug='scarecrow') where slug='squeezer';

insert into figures (slug,name,category_id,sport,difficulty,is_switch,description,description_en,tips,tips_en)
select 'squeezer-5','Squeezer 5',category_id,sport,difficulty,true,
  'Version switch du Crow Mobe. S''exécute en prenant le départ en switch depuis le wake toeside.',
  'Switch version of the Crow Mobe. Performed starting switch off the toeside wake.',
  tips, tips_en from figures where slug='crow-mobe';
update figures set switch_of=(select id from figures where slug='crow-mobe') where slug='squeezer-5';

-- Prérequis Front
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='front-flip' and r.slug='hs-fs-360';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='front-flip-to-fakie' and r.slug='front-flip';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='front-flip-to-blind' and r.slug='front-flip';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='front-blind-mobe' and r.slug='front-flip';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='slim-chance' and r.slug='front-flip';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='slim-chance' and r.slug='hs-fs-360';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='front-roll' and r.slug='ts-fs-360';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='scarecrow' and r.slug='front-roll';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='crow-mobe' and r.slug='front-roll';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='crow-mobe' and r.slug='hs-fs-360';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='crow-mobe-5' and r.slug='crow-mobe';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='crow-mobe-7' and r.slug='crow-mobe-5';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='elephant' and r.slug='scarecrow';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='tootsie' and r.slug='front-roll';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='dum-dum' and r.slug='tootsie';
