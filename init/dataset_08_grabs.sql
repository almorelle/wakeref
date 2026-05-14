-- ============================================================
-- WakeRef — 08. GRABS
-- ============================================================

insert into figures (slug,name,category_id,sport,difficulty,description,description_en,tips,tips_en) values

('indy','Indy',(select id from categories where slug='grabs'),'wakeboard',1,
'Main arrière sur la carre toeside entre les deux pieds. L''un des grabs les plus naturels, hérité du skateboard.',
'Back hand on the toeside edge between both feet. One of the most natural grabs, borrowed from skateboarding.',
array['Monter les genoux vers la poitrine','Attraper entre les pieds, pas vers le tail','Tenir le grab au moins une seconde','Relâcher avant la réception'],
array['Pull knees to chest','Grab between feet, not toward the tail','Hold grab for at least one second','Release before landing']),

('tindy','Tindy',(select id from categories where slug='grabs'),'wakeboard',1,
'Main arrière sur la carre toeside entre le pied arrière et le tail. Variante de l''Indy vers le tail.',
'Back hand on the toeside edge between the back foot and the tail. Indy variant toward the tail.',
array['Étendre légèrement la jambe arrière','Main arrière vise entre le pied arrière et le tail','Tweaker en poussant le toeside','Tenir avant de relâcher'],
array['Slightly extend back leg','Back hand aims between back foot and tail','Tweak by pushing toeside','Hold before releasing']),

('tail-grab','Tail Grab',(select id from categories where slug='grabs'),'wakeboard',2,
'Main arrière attrape le tail de la planche.',
'Back hand grabs the tail of the board.',
array['Étendre la jambe arrière en gardant la jambe avant fléchie','Pencher légèrement le buste vers l''arrière','Tenir le tail fermement','Revenir en position neutre avant l''atterrissage'],
array['Extend back leg while keeping front leg bent','Lean torso slightly back','Hold tail firmly','Return to neutral before landing']),

('tailfish','Tailfish',(select id from categories where slug='grabs'),'wakeboard',2,
'Main arrière sur la carre heelside entre le back binding et le tail.',
'Back hand on the heelside edge between the back binding and the tail.',
array['Bras arrière vers le heelside côté tail','Monter le genou arrière pour faciliter','Tweaker en poussant le heel edge vers le bas','Tenir avant de relâcher'],
array['Back arm reaches heelside toward tail','Lift back knee to facilitate','Tweak by pushing heel edge down','Hold before releasing']),

('stalefish','Stalefish',(select id from categories where slug='grabs'),'wakeboard',2,
'Main arrière sur la carre heelside entre les deux pieds. Le bras doit passer derrière le corps.',
'Back hand on the heelside edge between both feet. The arm must reach behind the body.',
array['Monter les genoux très haut','Le bras arrière passe derrière le dos','Garder le buste droit','Tweaker en poussant le heelside vers le bas'],
array['Pull knees very high','Back arm reaches behind back','Keep torso upright','Tweak by pushing heelside down']),

('melon','Melon',(select id from categories where slug='grabs'),'wakeboard',1,
'Main avant sur la carre heelside entre les deux pieds. Grab esthétique et très polyvalent.',
'Front hand on the heelside edge between both feet. Aesthetic and very versatile grab.',
array['Lever les genoux vers la poitrine','La main avant vient naturellement vers la carre heelside','Tweaker en poussant le heel edge vers l''extérieur','Tenir jusqu''à l''initiation de l''atterrissage'],
array['Pull knees to chest','Front hand naturally reaches heelside edge','Tweak by pushing heel edge outward','Hold until initiating landing']),

('mute','Mute',(select id from categories where slug='grabs'),'wakeboard',1,
'Main avant sur la carre toeside entre les pieds. Classique du wakeboard.',
'Front hand on the toeside edge between the feet. Wakeboarding classic.',
array['Croiser le bras avant vers le toeside','Tenir la planche fermement','Tweaker en tirant côté toeside','Associer à n''importe quel spin pour le style'],
array['Cross front arm toward toeside','Hold board firmly','Tweak by pulling toeside','Combine with any spin for style']),

('method','Method',(select id from categories where slug='grabs'),'wakeboard',2,
'Main avant sur la carre heelside entre le front binding et le nose, avec un tweaking backside caractéristique.',
'Front hand on the heelside edge between the front binding and the nose, with a characteristic backside tweak.',
array['Attraper entre le pied avant et le nose','Tweaker fortement en tirant la planche backside','La planche doit être presque parallèle au corps','Tenir longtemps : la durée fait le style'],
array['Grab between front foot and nose','Tweak hard by pulling board backside','Board should be almost parallel to body','Hold long: duration is the style']),

('nose-grab','Nose Grab',(select id from categories where slug='grabs'),'wakeboard',2,
'Main avant attrape le nose de la planche.',
'Front hand grabs the nose of the board.',
array['Étendre la jambe avant vers le nose','Pencher le buste vers l''avant','Garder la jambe arrière fléchie pour le contrepoids','Relâcher avant la réception'],
array['Extend front leg toward nose','Lean torso forward','Keep back leg bent as counterweight','Release before landing']),

('slob','Slob',(select id from categories where slug='grabs'),'wakeboard',2,
'Main avant sur la carre toeside entre le pied avant et le nose. Variante du Mute vers le nose.',
'Front hand on the toeside edge between the front foot and the nose. Mute variant toward the nose.',
array['Étendre légèrement la jambe avant','Main avant vise entre le pied avant et le nose','Garder l''équilibre avec la jambe arrière','Tweaker en poussant le toeside'],
array['Slightly extend front leg','Front hand aims between front foot and nose','Maintain balance with back leg','Tweak by pushing toeside']),

('crail','Crail',(select id from categories where slug='grabs'),'wakeboard',3,
'Main arrière sur la carre toeside entre le front binding et le nose. Demande une bonne amplitude.',
'Back hand on the toeside edge between the front binding and the nose. Requires good range of motion.',
array['Le bras arrière doit croiser devant le corps','Lever les genoux pour réduire la distance','Attraper aussi loin vers le nose que possible','Ne pas perdre l''axe si combiné à un spin'],
array['Back arm must cross in front of body','Lift knees to reduce distance','Grab as far toward nose as possible','Don''t lose axis if combined with spin']),

('nuclear','Nuclear',(select id from categories where slug='grabs'),'wakeboard',3,
'Main arrière sur la carre heelside entre le front binding et le nose.',
'Back hand on the heelside edge between the front binding and the nose.',
array['Bras arrière passe derrière et en avant','Monter les genoux très haut','Pencher légèrement côté heelside','Tenir avant de relâcher'],
array['Back arm reaches across and forward','Pull knees very high','Lean slightly heelside','Hold before releasing']),

('seat-belt','Seat Belt',(select id from categories where slug='grabs'),'wakeboard',2,
'Main avant sur la carre heelside entre le back binding et le tail.',
'Front hand on the heelside edge between the back binding and the tail.',
array['Bras avant traverse le corps vers le heelside arrière','Monter les genoux pour rapprocher le grab','Garder le buste stable','Tweaker en poussant le heel edge vers le bas'],
array['Front arm crosses body toward rear heelside','Lift knees to bring grab closer','Keep torso stable','Tweak by pushing heel edge down']),

('roast-beef','Roast Beef',(select id from categories where slug='grabs'),'wakeboard',3,
'Main arrière sur la carre heelside entre les deux pieds, coude pointant vers la carre heel.',
'Back hand on the heelside edge between both feet, elbow pointing toward heel edge.',
array['Monter les genoux très haut','Coude arrière pointe vers la carre heelside','Flexibilité des ischio-jambiers nécessaire','Tweaker en poussant le heelside'],
array['Pull knees very high','Back elbow points toward heelside edge','Hamstring flexibility required','Tweak by pushing heelside']),

('chicken-salad','Chicken Salad',(select id from categories where slug='grabs'),'wakeboard',3,
'Main arrière sur la carre heelside entre les deux pieds, coude pointant vers la carre toeside.',
'Back hand on the heelside edge between both feet, elbow pointing toward toe edge.',
array['Coude arrière pointe côté toeside (contrairement au Roast Beef)','Excellente flexibilité requise','Monter les genoux au maximum','Tweaker en poussant le heelside'],
array['Back elbow points toeside (opposite to Roast Beef)','Excellent flexibility required','Pull knees as high as possible','Tweak by pushing heelside']);

-- Prérequis Grabs
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='indy' and r.slug='hs-fs-180';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='melon' and r.slug='hs-fs-180';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='mute' and r.slug='hs-fs-180';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='tindy' and r.slug='indy';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='tail-grab' and r.slug='indy';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='tailfish' and r.slug='indy';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='stalefish' and r.slug='melon';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='method' and r.slug='melon';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='nose-grab' and r.slug='mute';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='slob' and r.slug='mute';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='seat-belt' and r.slug='melon';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='roast-beef' and r.slug='stalefish';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='chicken-salad' and r.slug='stalefish';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='crail' and r.slug='mute';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='nuclear' and r.slug='nose-grab';
