-- ============================================================
-- WakeRef — 02. Famille RAILEY
-- ============================================================

insert into figures (slug,name,category_id,sport,difficulty,description,description_en,tips,tips_en) values

('railey','Railey',(select id from categories where slug='railey'),'wakeboard',3,
'Release heelside où la planche est projetée derrière le rider au-dessus de la tête dans un style superman. La corde tire le rider en extension complète. Figure fondamentale pour toute la famille railey.',
'Heelside release where the board is thrown behind the rider above the head in superman style. The rope pulls the rider into full extension. Foundation for the entire railey family.',
array['Charger fort le wake heelside avec un edge agressif','Se laisser tirer par la corde en extension complète','Planche au-dessus de la tête, corps tendu','Ramener les pieds sous soi pour la réception','Ne pas lâcher la corde pendant la phase aérienne'],
array['Load the heelside wake aggressively','Let the rope pull you into full extension','Board above head, body fully extended','Bring feet back under for landing','Don''t release the rope during the air phase']),

('krypt','Krypt',(select id from categories where slug='railey'),'wakeboard',4,
'Un railey avec un FS 180° pour atterrir switch. Figure très stylée combinant la puissance du railey avec une rotation frontside.',
'A railey with a FS 180° to land switch. Very stylish trick combining railey power with a frontside rotation.',
array['Railey solide avant de tenter','Initier le FS 180° au sommet de la trajectoire','La corde guide naturellement la rotation','Préparer l''atterrissage en switch'],
array['Solid railey before attempting','Initiate FS 180° at the peak','The rope naturally guides the rotation','Prepare for the switch landing']),

('313','313',(select id from categories where slug='railey'),'wakeboard',4,
'Un railey avec un FS 360° handle pass. Combine l''extension superman avec une rotation complète et un handle pass.',
'A railey with a FS 360° handle pass. Combines superman extension with a full rotation and handle pass.',
array['Railey très haut pour avoir le temps','Initier le FS 360° depuis l''extension maximale','Passer le handle rapidement','Repérer l''atterrissage après la rotation'],
array['Very high railey for enough time','Initiate FS 360° from maximum extension','Pass handle quickly','Spot landing after rotation']),

('315','315',(select id from categories where slug='railey'),'wakeboard',5,
'Un railey avec un FS 540° handle pass. Aussi appelé Nickelodeon.',
'A railey with a FS 540° handle pass. Also known as Nickelodeon.',
array['313 solide comme base','Hauteur maximale requise','Handle pass très rapide','Repérer l''atterrissage tôt'],
array['Solid 313 as base','Maximum height required','Very fast handle pass','Spot landing early']),

('317','317',(select id from categories where slug='railey'),'wakeboard',5,
'Un railey avec un FS 720° handle pass.',
'A railey with a FS 720° handle pass.',
array['315 maîtrisé','Hauteur et rotation maximales','Figure d''élite','Conditions parfaites'],
array['Mastered 315','Maximum height and rotation','Elite trick','Perfect conditions']),

('blind-judge','Blind Judge',(select id from categories where slug='railey'),'wakeboard',4,
'Un railey avec un BS 180° pour atterrir blind (handle dans le dos).',
'A railey with a BS 180° to land blind (handle behind the back).',
array['Railey solide comme base','Initier le BS 180° depuis la position d''extension','Préparer à tenir le handle dans le dos','Genoux très fléchis à la réception'],
array['Solid railey as base','Initiate BS 180° from extended position','Prepare to hold handle behind back','Very bent knees on landing']),

('bs-313','BS 313',(select id from categories where slug='railey'),'wakeboard',4,
'Un railey avec un BS 360° handle pass. Version backside du 313.',
'A railey with a BS 360° handle pass. Backside version of the 313.',
array['Railey bien chargé','Initier le BS 360° depuis l''extension','Passer le handle dans le dos','Repérer l''atterrissage par-dessus l''épaule backside'],
array['Well-loaded railey','Initiate BS 360° from extension','Pass handle behind back','Spot landing over backside shoulder']),

('bs-315','BS 315',(select id from categories where slug='railey'),'wakeboard',5,
'Un railey avec un BS 540° handle pass.',
'A railey with a BS 540° handle pass.',
array['BS 313 solide','Hauteur maximale','Handle pass très rapide','Figure d''élite'],
array['Solid BS 313','Maximum height','Very fast handle pass','Elite trick']),

('hoochie-glide','Hoochie Glide',(select id from categories where slug='railey'),'wakeboard',3,
'Un railey où le rider attrape la carre heelside avec la main avant (Method Grab) en position d''extension.',
'A railey where the rider grabs the heelside edge with the front hand (Method Grab) in the extended position.',
array['Partir d''un railey propre','La main avant vient attraper le heelside en extension','Tweaker en tirant la planche vers soi','Relâcher avant de ramener les pieds'],
array['Start from a clean railey','Front hand grabs heelside in extended position','Tweak by pulling board toward you','Release before bringing feet back']),

('ohh','OHH',(select id from categories where slug='railey'),'wakeboard',3,
'Un railey où le rider attrape la carre heelside avec la main arrière (Other Hand Hoochie).',
'A railey where the rider grabs the heelside edge with the back hand (Other Hand Hoochie).',
array['Railey bien chargé','La main arrière attrape le heelside en extension','Garder le corps bien tendu','Relâcher et ramener les pieds proprement'],
array['Loaded railey','Back hand grabs heelside in extension','Keep body fully extended','Release cleanly and bring feet back']),

('indy-glide','Indy Glide',(select id from categories where slug='railey'),'wakeboard',3,
'Un railey avec un grab Indy (main arrière sur le toeside entre les pieds).',
'A railey with an Indy grab (back hand on toeside between feet).',
array['Railey solide','Main arrière attrape le toeside en extension','Tweaker en poussant le toeside','Relâcher avant la réception'],
array['Solid railey','Back hand grabs toeside in extension','Tweak by pushing toeside','Release before landing']),

('911','911',(select id from categories where slug='railey'),'wakeboard',3,
'Railey tweeké BS 90°. Le rider effectue un railey et tourne légèrement la planche backside en position d''extension.',
'BS 90° tweaked railey. The rider performs a railey and slightly rotates the board backside in the extended position.',
array['Partir d''un railey solide','Initier le BS 90° au moment de l''extension maximale','Tweaker en poussant le heel edge','Revenir face avant pour la réception'],
array['Start from a solid railey','Initiate BS 90° at maximum extension','Tweak by pushing heel edge','Return to forward position for landing']),

('butter-fuko','Butter Fuko',(select id from categories where slug='railey'),'wakeboard',4,
'Un 911 avec un FS 180°. Krypt avec un BS 90° tweeké.',
'A 911 with a FS 180°. Krypt with a BS 90° tweak.',
array['Maîtriser le 911 et le Krypt','Initier le FS 180° depuis la position tweakée','Atterrissage en switch','Figure de style avancé'],
array['Master both 911 and Krypt','Initiate FS 180° from tweaked position','Switch landing','Advanced style trick']),

('ts-railey','TS Railey',(select id from categories where slug='railey'),'wakeboard',4,
'Railey effectué depuis le wake toeside. Plus difficile que le railey heelside.',
'Railey performed off the toeside wake. Harder than the heelside railey.',
array['Charger le wake toeside agressivement','Se laisser projeter en extension depuis le toeside','Corps tendu, planche au-dessus de la tête','Ramener les pieds sous soi proprement'],
array['Load the toeside wake aggressively','Let yourself be projected into extension from toeside','Body extended, board above head','Bring feet back under cleanly']),

('ts-krypt','TS Krypt',(select id from categories where slug='railey'),'wakeboard',5,
'Un TS Railey avec un FS 180° pour atterrir switch. Version toeside du krypt.',
'A TS Railey with a FS 180° to land switch. Toeside version of the krypt.',
array['TS Railey solide','Initier le FS 180° au sommet','Atterrissage en switch','Figure de haut niveau'],
array['Solid TS Railey','Initiate FS 180° at peak','Switch landing','High level trick']),

('90210','90210',(select id from categories where slug='railey'),'wakeboard',4,
'Un TS Railey avec un FS 360° handle pass. Aussi appelé Skud en switch.',
'A TS Railey with a FS 360° handle pass. Also known as Skud in switch.',
array['TS Railey solide','FS 360° initié depuis l''extension','Handle pass rapide','Repérer l''atterrissage'],
array['Solid TS Railey','FS 360° initiated from extension','Fast handle pass','Spot the landing']),

('ts-blind-judge','TS Blind Judge',(select id from categories where slug='railey'),'wakeboard',5,
'Un TS Railey avec un BS 180° pour atterrir blind.',
'A TS Railey with a BS 180° to land blind.',
array['TS Railey maîtrisé','BS 180° depuis l''extension toeside','Atterrissage blind','Figure d''élite'],
array['Mastered TS Railey','BS 180° from toeside extension','Blind landing','Elite trick']),

('rubber-chicken','Rubber Chicken',(select id from categories where slug='railey'),'wakeboard',4,
'Un railey avec un BS 360° olé (handle au-dessus de la tête en rotation backside).',
'A railey with a BS 360° ole (handle above head in backside rotation).',
array['Partir d''un railey bien chargé','Le handle passe au-dessus de la tête (olé)','Rotation BS 360°','Ramener proprement pour la réception'],
array['Start from a well-loaded railey','Handle passes above the head (ole)','BS 360° rotation','Return cleanly for landing']);

-- Switches Railey
insert into figures (slug,name,category_id,sport,difficulty,is_switch,description,description_en,tips,tips_en)
select 'blind-jury','Blind Jury',category_id,sport,difficulty,true,
  'Version switch du Blind Judge. S''exécute en prenant le départ en switch depuis le wake heelside.',
  'Switch version of the Blind Judge. Performed starting switch off the heelside wake.',
  tips, tips_en from figures where slug='blind-judge';
update figures set switch_of=(select id from figures where slug='blind-judge') where slug='blind-jury';

insert into figures (slug,name,category_id,sport,difficulty,is_switch,description,description_en,tips,tips_en)
select 'skud','Skud',category_id,sport,difficulty,true,
  'Version switch du 90210 (TS Railey FS 360°). S''exécute en prenant le départ en switch depuis le wake toeside.',
  'Switch version of the 90210 (TS Railey FS 360°). Performed starting switch off the toeside wake.',
  tips, tips_en from figures where slug='90210';
update figures set switch_of=(select id from figures where slug='90210') where slug='skud';

-- Prérequis Railey
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='krypt' and r.slug='railey';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='313' and r.slug='railey';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='313' and r.slug='hs-fs-360';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='315' and r.slug='313';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='317' and r.slug='315';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='blind-judge' and r.slug='railey';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='bs-313' and r.slug='railey';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='bs-315' and r.slug='bs-313';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='hoochie-glide' and r.slug='railey';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ohh' and r.slug='railey';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='indy-glide' and r.slug='railey';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='911' and r.slug='railey';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='butter-fuko' and r.slug='911';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='butter-fuko' and r.slug='krypt';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='rubber-chicken' and r.slug='railey';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ts-railey' and r.slug='railey';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ts-railey' and r.slug='ts-fs-360';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ts-krypt' and r.slug='ts-railey';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='90210' and r.slug='ts-railey';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ts-blind-judge' and r.slug='ts-railey';
