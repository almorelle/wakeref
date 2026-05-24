-- ============================================================
-- WakeRef — 01. Famille SPIN
-- ============================================================

insert into figures (slug,name,category_id,sport,difficulty,description,description_en,tips,tips_en) values

('hs-fs-180','HS FS 180',(select id from categories where slug='spin'),'wakeboard',1,
'Rotation frontside de 180° depuis le wake heelside. La plus accessible des rotations : le rider charge le wake côté talon et effectue un demi-tour en regardant vers la ligne pour atterrir en switch.',
'Frontside 180° rotation off the heelside wake. The most accessible rotation: load the heelside wake and complete a half turn facing the line to land switch.',
array['Charger le wake progressivement côté talon','Initier la rotation avec les épaules au décollage','Ramener la corde près du corps','Réceptionner en switch, genoux fléchis'],
array['Load the heelside wake progressively','Initiate rotation with shoulders at takeoff','Pull rope close to your body','Land switch with bent knees']),

('hs-bs-180','HS BS 180',(select id from categories where slug='spin'),'wakeboard',1,
'Rotation backside de 180° depuis le wake heelside. Le rider tourne en regardant d''abord vers l''extérieur (dos à la ligne) pour atterrir en switch.',
'Backside 180° rotation off the heelside wake. The rider turns first facing away from the line to land switch.',
array['Tourner les épaules backside avant de sauter','La vue se coupe à mi-rotation : anticiper l''atterrissage','Corde courte pour contrôle','Réceptionner en switch'],
array['Turn shoulders backside before jumping','Vision cuts at mid-rotation: anticipate landing','Short rope for control','Land switch']),

('ts-bs-180','TS BS 180',(select id from categories where slug='spin'),'wakeboard',2,
'Rotation backside de 180° depuis le wake toeside. Le rider charge le wake côté orteils et tourne backside pour atterrir en switch.',
'Backside 180° rotation off the toeside wake. The rider loads the toeside wake and turns backside to land switch.',
array['Charger le wake toeside avec une bonne carve','Initier le BS depuis les épaules','Regard par-dessus l''épaule backside','Réceptionner en switch'],
array['Load toeside wake with a good carve','Initiate BS from shoulders','Look over backside shoulder','Land switch']),

('ts-fs-180','TS FS 180',(select id from categories where slug='spin'),'wakeboard',2,
'Rotation frontside de 180° depuis le wake toeside. Le rider charge le wake côté orteils et tourne frontside pour atterrir en switch.',
'Frontside 180° rotation off the toeside wake. The rider loads the toeside wake and turns frontside to land switch.',
array['Charger le wake toeside','Initier le FS avec les épaules','Regarder par-dessus l''épaule frontside','Réceptionner en switch proprement'],
array['Load the toeside wake','Initiate FS with shoulders','Look over frontside shoulder','Land switch cleanly']),

('hs-fs-360','HS FS 360',(select id from categories where slug='spin'),'wakeboard',2,
'Rotation frontside de 360° depuis le wake heelside avec handle pass. Tour complet en regardant vers la ligne.',
'Frontside 360° rotation off the heelside wake with handle pass. Full rotation facing the line.',
array['Charger progressivement pour avoir de la hauteur','Initier la rotation dès le décollage','Passer le handle derrière le dos à mi-rotation','Repérer l''atterrissage par-dessus l''épaule'],
array['Load progressively for height','Initiate rotation at takeoff','Pass handle behind back at mid-rotation','Spot landing over shoulder']),

('hs-bs-360','HS BS 360',(select id from categories where slug='spin'),'wakeboard',2,
'Rotation backside de 360° depuis le wake heelside avec handle pass.',
'Backside 360° rotation off the heelside wake with handle pass.',
array['Charger le wake heelside','Initier le BS avec les épaules','Passer le handle dans le dos','Repérer l''atterrissage par-dessus l''épaule backside'],
array['Load the heelside wake','Initiate BS with shoulders','Pass handle behind back','Spot landing over backside shoulder']),

('ts-bs-360','TS BS 360',(select id from categories where slug='spin'),'wakeboard',3,
'Rotation backside de 360° depuis le wake toeside avec handle pass.',
'Backside 360° rotation off the toeside wake with handle pass.',
array['Bonne carve toeside','Déclencher le BS dès le décollage','Handle pass rapide','Repérer l''atterrissage'],
array['Good toeside carve','Trigger BS at takeoff','Fast handle pass','Spot the landing']),

('ts-fs-360','TS FS 360',(select id from categories where slug='spin'),'wakeboard',3,
'Rotation frontside de 360° depuis le wake toeside avec handle pass.',
'Frontside 360° rotation off the toeside wake with handle pass.',
array['Charger le wake toeside','Initier le FS avec les hanches et les épaules','Passer le handle rapidement','Maintenir la planche sous soi'],
array['Load toeside wake','Initiate FS with hips and shoulders','Pass handle quickly','Keep board under you']),

('hs-fs-540','HS FS 540',(select id from categories where slug='spin'),'wakeboard',3,
'Rotation frontside de 540° depuis le wake heelside : une rotation et demie avec handle pass. Cap important dans la progression.',
'Frontside 540° rotation off the heelside wake: one and a half rotations with handle pass. A real milestone.',
array['HS FS 360 propre comme base','Aller chercher plus de hauteur','Passer le handle tôt','Repérer l''eau dès que possible'],
array['Clean HS FS 360 as base','Get more height','Pass handle early','Spot the water as soon as possible']),

('hs-bs-540','HS BS 540',(select id from categories where slug='spin'),'wakeboard',3,
'Rotation backside de 540° depuis le wake heelside avec handle pass.',
'Backside 540° rotation off the heelside wake with handle pass.',
array['HS BS 360 solide','Hauteur maximale','Handle pass rapide dans le dos','Repérer l''atterrissage tôt'],
array['Solid HS BS 360','Maximum height','Fast handle pass behind back','Spot landing early']),

('ts-bs-540','TS BS 540',(select id from categories where slug='spin'),'wakeboard',3,
'Rotation backside de 540° depuis le wake toeside avec handle pass.',
'Backside 540° rotation off the toeside wake with handle pass.',
array['TS BS 360 maîtrisé','Carve toeside agressive','Handle pass précis','Rester compact pendant la rotation'],
array['Mastered TS BS 360','Aggressive toeside carve','Precise handle pass','Stay compact during rotation']),

('ts-fs-540','TS FS 540',(select id from categories where slug='spin'),'wakeboard',3,
'Rotation frontside de 540° depuis le wake toeside avec handle pass.',
'Frontside 540° rotation off the toeside wake with handle pass.',
array['TS FS 360 propre','Plus de hauteur que le 360','Handle pass tôt','Garder la tête haute'],
array['Clean TS FS 360','More height than the 360','Early handle pass','Keep head up']),

('hs-fs-720','HS FS 720',(select id from categories where slug='spin'),'wakeboard',4,
'Double rotation frontside complète (720°) depuis le wake heelside. Requiert hauteur maximale et double handle pass.',
'Double frontside full rotation (720°) off the heelside wake. Requires maximum height and double handle pass.',
array['HS FS 540 solide','Hauteur maximale au décollage','Rotation ultra-compacte','Repérer l''atterrissage tôt'],
array['Solid HS FS 540','Maximum height at takeoff','Ultra-compact rotation','Spot landing early']),

('hs-bs-720','HS BS 720',(select id from categories where slug='spin'),'wakeboard',4,
'Double rotation backside complète (720°) depuis le wake heelside.',
'Double backside full rotation (720°) off the heelside wake.',
array['HS BS 540 solide','Hauteur maximale','Double handle pass rapide','Anticiper l''atterrissage'],
array['Solid HS BS 540','Maximum height','Fast double handle pass','Anticipate landing']),

('hs-fs-900','HS FS 900',(select id from categories where slug='spin'),'wakeboard',5,
'Deux rotations et demie frontside (900°) depuis le wake heelside. Figure d''élite.',
'Two and a half frontside rotations (900°) off the heelside wake. Elite trick.',
array['720 propre comme base','Hauteur exceptionnelle requise','Rotation très compacte','Repérer l''atterrissage le plus tôt possible'],
array['Clean 720 as base','Exceptional height required','Very compact rotation','Spot landing as early as possible']),

('hs-bs-900','HS BS 900',(select id from categories where slug='spin'),'wakeboard',5,
'Deux rotations et demie backside (900°) depuis le wake heelside. Figure d''élite.',
'Two and a half backside rotations (900°) off the heelside wake. Elite trick.',
array['HS BS 720 solide','Conditions et vitesse parfaites','Rotation maximalement compacte','Figure de compétition haut niveau'],
array['Solid HS BS 720','Perfect conditions and speed','Maximally compact rotation','High-level competition trick']),

('hs-fs-1080','HS FS 1080',(select id from categories where slug='spin'),'wakeboard',5,
'Trois rotations frontside complètes (1080°) depuis le wake heelside. Figure de compétition au plus haut niveau mondial.',
'Three full frontside rotations (1080°) off the heelside wake. Competition trick at the highest world level.',
array['Réservé aux riders d''élite','Carve très agressive','Rotation wrapped ou double handle pass','Conditions parfaites requises'],
array['Reserved for elite riders','Very aggressive carve','Wrapped or double handle pass rotation','Perfect conditions required']),

('hs-bs-1080','HS BS 1080',(select id from categories where slug='spin'),'wakeboard',5,
'Trois rotations backside complètes (1080°) depuis le wake heelside.',
'Three full backside rotations (1080°) off the heelside wake.',
array['Figure d''élite absolue','HS BS 900 maîtrisé','Hauteur et vitesse maximales','Conditions parfaites'],
array['Absolute elite trick','Mastered HS BS 900','Maximum height and speed','Perfect conditions']);

('ts-bs-720','TS BS 720',
(select id from categories where slug='spin'),'wakeboard',4,
'Double rotation backside complète (720°) depuis le wake toeside. Requiert hauteur maximale et double handle pass.',
'Double backside full rotation (720°) off the toeside wake. Requires maximum height and double handle pass.',
array['TS BS 540 solide','Hauteur maximale au décollage','Double handle pass rapide','Anticiper l''atterrissage'],
array['Solid TS BS 540','Maximum height at takeoff','Fast double handle pass','Anticipate landing']),

('ts-bs-900','TS BS 900',
(select id from categories where slug='spin'),'wakeboard',5,
'Deux rotations et demie backside (900°) depuis le wake toeside. Figure d''élite.',
'Two and a half backside rotations (900°) off the toeside wake. Elite trick.',
array['TS BS 720 solide','Hauteur exceptionnelle requise','Rotation très compacte','Repérer l''atterrissage le plus tôt possible'],
array['Solid TS BS 720','Exceptional height required','Very compact rotation','Spot landing as early as possible']),

('ts-fs-900','TS FS 900',
(select id from categories where slug='spin'),'wakeboard',5,
'Deux rotations et demie frontside (900°) depuis le wake toeside. Figure d''élite.',
'Two and a half frontside rotations (900°) off the toeside wake. Elite trick.',
array['TS FS 720 solide','Hauteur exceptionnelle requise','Rotation très compacte','Repérer l''atterrissage le plus tôt possible'],
array['Solid TS FS 720','Exceptional height required','Very compact rotation','Spot landing as early as possible']),

('ts-fs-1080','TS FS 1080',
(select id from categories where slug='spin'),'wakeboard',5,
'Trois rotations frontside complètes (1080°) depuis le wake toeside. Figure de compétition au plus haut niveau mondial.',
'Three full frontside rotations (1080°) off the toeside wake. Competition trick at the highest world level.',
array['TS FS 900 maîtrisé','Hauteur et vitesse maximales','Rotation wrapped ou double handle pass','Conditions parfaites requises'],
array['Mastered TS FS 900','Maximum height and speed','Wrapped or double handle pass rotation','Perfect conditions required']),

('ts-fs-720','TS FS 720',
(select id from categories where slug='spin'),'wakeboard',5,
'Deux rotations frontside complètes (720°) depuis le wake toeside. Figure de compétition au plus haut niveau mondial.',
'Two full frontside rotations (720°) off the toeside wake. Competition trick at the highest world level.',
array['TS FS 540 solide','Hauteur maximale au décollage','Double handle pass rapide','Anticiper l''atterrissage'],
array['Solid TS FS 540','Maximum height at takeoff','Fast double handle pass','Anticipate landing']),

('ts-bs-1080','TS BS 1080',
(select id from categories where slug='spin'),'wakeboard',5,
'Trois rotations frontside complètes (1080°) depuis le wake toeside. Figure de compétition au plus haut niveau mondial.',
'Three full frontside rotations (1080°) off the toeside wake. Competition trick at the highest world level.',
array['TS BS 900 maîtrisé','Hauteur et vitesse maximales','Rotation wrapped ou double handle pass','Conditions parfaites requises'],
array['Mastered TS BS 900','Maximum height and speed','Wrapped or double handle pass rotation','Perfect conditions required']);

-- Prérequis Spin
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='hs-fs-360' and r.slug='hs-fs-180';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='hs-bs-360' and r.slug='hs-bs-180';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ts-bs-360' and r.slug='ts-bs-180';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ts-fs-360' and r.slug='ts-fs-180';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='hs-fs-540' and r.slug='hs-fs-360';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='hs-bs-540' and r.slug='hs-bs-360';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ts-bs-540' and r.slug='ts-bs-360';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ts-fs-540' and r.slug='ts-fs-360';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='hs-fs-720' and r.slug='hs-fs-540';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='hs-bs-720' and r.slug='hs-bs-540';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='hs-fs-900' and r.slug='hs-fs-720';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='hs-bs-900' and r.slug='hs-bs-720';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='hs-fs-1080' and r.slug='hs-fs-900';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='hs-bs-1080' and r.slug='hs-bs-900';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ts-bs-720' and r.slug='ts-bs-540';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ts-fs-720' and r.slug='ts-fs-540';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ts-bs-900' and r.slug='ts-bs-720';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ts-fs-900' and r.slug='ts-fs-540';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ts-fs-1080' and r.slug='ts-fs-900';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ts-bs-1080' and r.slug='ts-bs-900';
