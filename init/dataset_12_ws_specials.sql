-- ============================================================
-- WakeRef — 12. WAKESKATE — Specials
-- ============================================================

insert into figures (slug,name,category_id,sport,difficulty,description,description_en,tips,tips_en) values

('ws-benihana','Benihana',(select id from categories where slug='specials'),'wakeskate',2,
'Ollie avec un tail grab, pendant que le pied arrière est poussé par-dessus la carre heelside dans les airs.',
'Ollie with a tail grab, while the back foot is pushed over the heelside edge in the air.',
array['Ollie propre','Attraper le tail avec la main arrière','Pousser le pied arrière par-dessus le heelside','Revenir en position avant l''atterrissage'],
array['Clean ollie','Grab tail with back hand','Push back foot over heelside edge','Return to position before landing']),

('ws-madonna','Madonna',(select id from categories where slug='specials'),'wakeskate',2,
'Ollie avec un nose grab, pendant que le pied avant est poussé par-dessus la carre heelside dans les airs.',
'Ollie with a nose grab, while the front foot is pushed over the heelside edge in the air.',
array['Ollie propre','Attraper le nose avec la main avant','Pousser le pied avant par-dessus le heelside','Revenir en position avant l''atterrissage'],
array['Clean ollie','Grab nose with front hand','Push front foot over heelside edge','Return to position before landing']),

('ws-mute-special','Mute (Wakeskate)',(select id from categories where slug='specials'),'wakeskate',2,
'Ollie avec un nose grab, pendant que le pied avant est poussé par-dessus la carre toeside dans les airs.',
'Ollie with a nose grab, while the front foot is pushed over the toeside edge in the air.',
array['Ollie propre','Attraper le nose avec la main avant','Pousser le pied avant par-dessus le toeside','Revenir en position avant l''atterrissage'],
array['Clean ollie','Grab nose with front hand','Push front foot over toeside edge','Return to position before landing']),

('ws-christ-air','Christ Air',(select id from categories where slug='specials'),'wakeskate',3,
'Le rider attrape la board en indy et pousse ses pieds en style superman dans les airs, similaire à un railey.',
'The rider grabs the board indy and pushes their feet in superman style in the air, similar to a railey.',
array['Ollie très haut','Attraper la board en indy','Pousser les deux pieds en extension superman','Ramener les pieds avant l''atterrissage'],
array['Very high ollie','Grab board indy','Push both feet into superman extension','Bring feet back before landing']);

-- Prérequis Specials
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ws-benihana' and r.slug='ws-ollie';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ws-madonna' and r.slug='ws-ollie';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ws-mute-special' and r.slug='ws-ollie';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ws-christ-air' and r.slug='ws-ollie';
