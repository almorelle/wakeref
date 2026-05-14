-- ============================================================
-- WakeRef — 05. Famille BACKROLL
-- ============================================================

insert into figures (slug,name,category_id,sport,difficulty,description,description_en,tips,tips_en) values

('hs-back-roll','HS Back Roll',(select id from categories where slug='backroll'),'wakeboard',3,
'Release heelside où la planche tourne nose over tail en cartwheel latéral (roue inverse, axe de rotation perpendiculaire aux épaules). Différent du tantrum car la rotation est plus latérale.',
'Heelside release where the board rotates nose over tail in a lateral cartwheel (reverse wheel, rotation axis perpendicular to shoulders). Different from tantrum as rotation is more lateral.',
array['Charger fort le wake côté heelside','Regarder par-dessus l''épaule frontside','La rotation est latérale, pas verticale','Tenir la corde courte pour garder le contrôle'],
array['Load the heelside wake hard','Look over your frontside shoulder','Rotation is lateral, not vertical','Keep rope short for control']),

('roll-to-revert','Roll to Revert',(select id from categories where slug='backroll'),'wakeboard',3,
'Un HS Back Roll avec un FS 180° pour atterrir en switch.',
'A HS Back Roll with a FS 180° to land switch.',
array['Back roll maîtrisé','FS 180° s''initie à mi-rotation du roll','Regarder l''atterrissage par-dessus l''épaule frontside','Les bras guident le 180° naturellement'],
array['Mastered back roll','FS 180° initiates at mid-roll rotation','Look at landing over frontside shoulder','Arms guide the 180° naturally']),

('roll-to-blind','Roll to Blind',(select id from categories where slug='backroll'),'wakeboard',4,
'Un HS Back Roll avec un BS 180° pour atterrir blind.',
'A HS Back Roll with a BS 180° to land blind.',
array['Back roll solide','BS 180° initié pendant la rotation du roll','Préparer l''atterrissage blind','Handle dans le dos à la réception'],
array['Solid back roll','BS 180° initiated during roll rotation','Prepare for blind landing','Handle behind back on landing']),

('back-mobe','Back Mobe',(select id from categories where slug='backroll'),'wakeboard',4,
'Un HS Back Roll avec un FS 360° handle pass.',
'A HS Back Roll with a FS 360° handle pass.',
array['Back roll solide et HS FS 360° propre','Initier le 360° pendant la phase inversée','Passer le handle rapidement','Genoux très fléchis à la réception'],
array['Solid back roll and clean HS FS 360°','Initiate 360° during inverted phase','Pass handle quickly','Very bent knees on landing']),

('back-mobe-5','Back Mobe 5',(select id from categories where slug='backroll'),'wakeboard',5,
'Un HS Back Roll avec un FS 540° handle pass.',
'A HS Back Roll with a FS 540° handle pass.',
array['Back Mobe maîtrisé','Hauteur maximale','Handle pass très rapide','Figure d''élite'],
array['Mastered Back Mobe','Maximum height','Very fast handle pass','Elite trick']),

('kgb','KGB',(select id from categories where slug='backroll'),'wakeboard',4,
'Un HS Back Roll avec un BS 360° handle pass.',
'A HS Back Roll with a BS 360° handle pass.',
array['Back roll solide','Initier le BS 360° pendant le roll','Passer le handle dans le dos','Voir l''atterrissage par-dessus l''épaule backside'],
array['Solid back roll','Initiate BS 360° during roll','Pass handle behind back','Spot landing over backside shoulder']),

('kgb-5','KGB 5',(select id from categories where slug='backroll'),'wakeboard',5,
'Un HS Back Roll avec un BS 540° handle pass.',
'A HS Back Roll with a BS 540° handle pass.',
array['KGB maîtrisé','Hauteur maximale','Handle pass ultra-rapide','Figure de compétition'],
array['Mastered KGB','Maximum height','Ultra-fast handle pass','Competition trick']),

('big-mac','Big Mac',(select id from categories where slug='backroll'),'wakeboard',4,
'Un HS Back Roll avec un BS 360° olé (handle au-dessus de la tête). Version olé du KGB.',
'A HS Back Roll with a BS 360° ole (handle above head). Ole version of the KGB.',
array['Back roll très haut','BS 360° avec le handle en olé','Ne pas passer le handle dans le dos','Atterrissage face avant'],
array['Very high back roll','BS 360° with handle in ole','Don''t pass handle behind back','Forward facing landing']),

('ts-back-roll','TS Back Roll',(select id from categories where slug='backroll'),'wakeboard',3,
'Backflip en approche toeside (saut périlleux arrière, principalement sur kicker en TS). Roue inverse depuis le wake toeside.',
'Backflip on toeside approach (backward flip, mainly on kicker in TS). Reverse wheel from toeside wake.',
array['Charger le wake toeside progressivement','Basculer en arrière depuis le toeside','Regarder par-dessus l''épaule pour voir l''atterrissage','Réceptionner avec les genoux fléchis'],
array['Load the toeside wake progressively','Tilt back from the toeside','Look over shoulder to spot landing','Land with bent knees']),

('ts-roll-to-revert','TS Roll to Revert',(select id from categories where slug='backroll'),'wakeboard',4,
'Un TS Back Roll avec un FS 180° pour atterrir en switch.',
'A TS Back Roll with a FS 180° to land switch.',
array['TS Back Roll maîtrisé','FS 180° initié pendant la rotation','Atterrissage en switch','Genoux fléchis'],
array['Mastered TS Back Roll','FS 180° initiated during rotation','Switch landing','Bent knees']),

('ts-roll-to-blind','TS Roll to Blind',(select id from categories where slug='backroll'),'wakeboard',4,
'Un TS Back Roll avec un BS 180° pour atterrir blind.',
'A TS Back Roll with a BS 180° to land blind.',
array['TS Back Roll solide','BS 180° initié pendant le roll','Atterrissage blind','Handle dans le dos'],
array['Solid TS Back Roll','BS 180° initiated during roll','Blind landing','Handle behind back']),

('pete-rose','Pete Rose',(select id from categories where slug='backroll'),'wakeboard',4,
'Un TS Back Roll avec un FS 360° handle pass.',
'A TS Back Roll with a FS 360° handle pass.',
array['TS Back Roll solide et FS 360° maîtrisé','Initier le FS 360° pendant la phase inversée','Passer le handle rapidement','Repérer l''atterrissage tôt'],
array['Solid TS Back Roll and mastered FS 360°','Initiate FS 360° during inverted phase','Pass handle quickly','Spot landing early']),

('pete-rose-5','Pete Rose 5',(select id from categories where slug='backroll'),'wakeboard',5,
'Un TS Back Roll avec un FS 540° handle pass.',
'A TS Back Roll with a FS 540° handle pass.',
array['Pete Rose maîtrisé','Hauteur maximale','Handle pass très rapide','Figure d''élite'],
array['Mastered Pete Rose','Maximum height','Very fast handle pass','Elite trick']),

('blind-pete','Blind Pete',(select id from categories where slug='backroll'),'wakeboard',5,
'Un TS Back Roll avec un BS 360° handle pass.',
'A TS Back Roll with a BS 360° handle pass.',
array['TS Back Roll solide','BS 360° pendant la phase inversée','Passer le handle dans le dos','Figure de haut niveau'],
array['Solid TS Back Roll','BS 360° during inverted phase','Pass handle behind back','High level trick']);

-- Switches Backroll
insert into figures (slug,name,category_id,sport,difficulty,is_switch,description,description_en,tips,tips_en)
select 'half-cab-roll','Half Cab Roll',category_id,sport,difficulty,true,
  'Version switch du Roll to Revert. S''exécute en prenant le départ en switch depuis le wake heelside.',
  'Switch version of Roll to Revert. Performed starting switch off the heelside wake.',
  tips, tips_en from figures where slug='roll-to-revert';
update figures set switch_of=(select id from figures where slug='roll-to-revert') where slug='half-cab-roll';

insert into figures (slug,name,category_id,sport,difficulty,is_switch,description,description_en,tips,tips_en)
select 'skeletor','Skeletor',category_id,sport,difficulty,true,
  'Version switch du Roll to Blind. S''exécute en prenant le départ en switch depuis le wake heelside.',
  'Switch version of Roll to Blind. Performed starting switch off the heelside wake.',
  tips, tips_en from figures where slug='roll-to-blind';
update figures set switch_of=(select id from figures where slug='roll-to-blind') where slug='skeletor';

insert into figures (slug,name,category_id,sport,difficulty,is_switch,description,description_en,tips,tips_en)
select 'ts-half-cab-roll','TS Half Cab Roll',category_id,sport,difficulty,true,
  'Version switch du TS Roll to Revert. S''exécute en prenant le départ en switch depuis le wake toeside.',
  'Switch version of TS Roll to Revert. Performed starting switch off the toeside wake.',
  tips, tips_en from figures where slug='ts-roll-to-revert';
update figures set switch_of=(select id from figures where slug='ts-roll-to-revert') where slug='ts-half-cab-roll';

insert into figures (slug,name,category_id,sport,difficulty,is_switch,description,description_en,tips,tips_en)
select 'blind-pete-rose','Blind Pete Rose',category_id,sport,difficulty,true,
  'Version switch du Pete Rose. S''exécute en prenant le départ en switch depuis le wake toeside.',
  'Switch version of Pete Rose. Performed starting switch off the toeside wake.',
  tips, tips_en from figures where slug='pete-rose';
update figures set switch_of=(select id from figures where slug='pete-rose') where slug='blind-pete-rose';

-- Prérequis Backroll
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='hs-back-roll' and r.slug='hs-fs-360';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='roll-to-revert' and r.slug='hs-back-roll';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='roll-to-blind' and r.slug='hs-back-roll';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='back-mobe' and r.slug='hs-back-roll';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='back-mobe' and r.slug='hs-fs-360';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='back-mobe-5' and r.slug='back-mobe';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='kgb' and r.slug='hs-back-roll';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='kgb-5' and r.slug='kgb';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='big-mac' and r.slug='hs-back-roll';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ts-back-roll' and r.slug='ts-fs-360';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ts-roll-to-revert' and r.slug='ts-back-roll';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ts-roll-to-blind' and r.slug='ts-back-roll';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='pete-rose' and r.slug='ts-back-roll';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='pete-rose' and r.slug='hs-fs-360';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='pete-rose-5' and r.slug='pete-rose';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='blind-pete' and r.slug='ts-back-roll';
