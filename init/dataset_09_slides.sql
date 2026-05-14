-- ============================================================
-- WakeRef — 09. SLIDES
-- ============================================================

insert into figures (slug,name,category_id,sport,difficulty,description,description_en,tips,tips_en) values

('50-50','50-50',(select id from categories where slug='slides'),'wakeboard',1,
'Slide sur un rail ou une box avec la planche alignée dans le sens du rail, nose pointant dans la direction de déplacement. Figure d''entrée au wake park.',
'Slide on a rail or box with the board aligned along the rail, nose pointing in the direction of travel. Entry-level wake park trick.',
array['Approcher perpendiculairement à la feature','Plier les genoux à l''abordage du rail','Garder le poids centré','Regarder la sortie dès que possible','Absorber la réception avec les genoux'],
array['Approach perpendicular to the feature','Bend knees when mounting the rail','Keep weight centered','Look at exit as soon as possible','Absorb landing with knees']),

('bs-boardslide','BS Boardslide',(select id from categories where slug='slides'),'wakeboard',2,
'Approche heelside, nose passe par-dessus le rail (rotation FS 90°), glisse perpendiculairement en regardant vers la ligne.',
'Heelside approach, nose over the rail (FS 90° rotation), slides perpendicular facing up the line.',
array['Approcher côté heelside','Nose par-dessus avec pop FS 90°','Poids au milieu de la planche','Sortir en finissant la rotation FS'],
array['Approach heelside','Nose over with FS 90° pop','Weight in middle of board','Exit by completing FS rotation']),

('front-lip','Front Lip',(select id from categories where slug='slides'),'wakeboard',2,
'Approche toeside, tail passe par-dessus le rail (rotation FS 90°), glisse perpendiculairement en regardant vers la ligne.',
'Toeside approach, tail over the rail (FS 90° rotation), slides perpendicular facing up the line.',
array['Approcher côté toeside','Tail par-dessus avec pop FS 90°','Équilibre côté nose','Sortir en complétant le FS 90°'],
array['Approach toeside','Tail over with FS 90° pop','Balance on nose side','Exit by completing FS 90°']),

('back-lip','Back Lip',(select id from categories where slug='slides'),'wakeboard',2,
'Approche heelside, tail passe par-dessus le rail (rotation BS 90°), glisse en regardant à l''opposé de la ligne.',
'Heelside approach, tail over the rail (BS 90° rotation), slides facing away from the line.',
array['Approche HS, rotation BS au pop','Tail par-dessus avec BS 90°','Regarder par-dessus l''épaule backside','Sortir en complétant le BS 90°'],
array['HS approach, BS rotation at pop','Tail over with BS 90°','Look over backside shoulder','Exit by completing BS 90°']),

('front-board','Front Board',(select id from categories where slug='slides'),'wakeboard',2,
'Approche toeside, nose passe par-dessus le rail (rotation BS 90°), glisse en regardant à l''opposé de la ligne.',
'Toeside approach, nose over the rail (BS 90° rotation), slides facing away from the line.',
array['Approche TS, pop BS 90°','Centrer le poids côté tail','Légère pression frontside sur le rail','Sortir en complétant le BS 90°'],
array['TS approach, BS 90° pop','Center weight on tail side','Slight frontside pressure on rail','Exit by completing BS 90°']),

('gap','Gap',(select id from categories where slug='slides'),'wakeboard',3,
'Jump depuis un rail vers le même rail en sautant par-dessus un espace vide.',
'Jump from a rail to the same rail jumping over a gap.',
array['Maîtriser les slides sur ce type de rail','Générer l''élan avant le gap','Ollie en maintenant la position de slide','Réceptionner au milieu de la planche'],
array['Master slides on this type of rail','Generate momentum before gap','Ollie while maintaining slide position','Land in middle of board']),

('transfer','Transfer',(select id from categories where slug='slides'),'wakeboard',3,
'Jump d''une feature à une autre ou d''une partie d''un rail à l''autre.',
'Jump from one feature to another or from one part of a rail to another.',
array['Analyser la géométrie du transfer','Générer l''élan nécessaire','Maintenir la position en l''air','Regarder la réception cible pendant le transfer'],
array['Analyze transfer geometry','Generate necessary momentum','Maintain position in the air','Look at target landing throughout transfer']);

-- Prérequis Slides
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='bs-boardslide' and r.slug='50-50';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='front-lip' and r.slug='50-50';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='back-lip' and r.slug='bs-boardslide';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='front-board' and r.slug='front-lip';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='gap' and r.slug='50-50';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='transfer' and r.slug='50-50';
