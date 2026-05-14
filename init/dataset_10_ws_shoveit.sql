-- ============================================================
-- WakeRef — 10. WAKESKATE — Shove-it / Body-varial
-- ============================================================

insert into figures (slug,name,category_id,sport,difficulty,description,description_en,tips,tips_en) values

('ws-ollie','Ollie',(select id from categories where slug='shoveit'),'wakeskate',1,
'Base absolue du wakeskate. Le rider frappe le tail sur l''eau puis glisse le pied avant pour faire monter la board. Sans fixations, le timing est essentiel.',
'Absolute wakeskate foundation. The rider pops the tail on the water then slides the front foot to lift the board. Without bindings, timing is essential.',
array['Frapper le tail avec le pied arrière (claquement net)','Glisser le pied avant vers le nose simultanément','Sauter verticalement','Regarder la board pour la rattraper','Fléchir les genoux à l''atterrissage'],
array['Pop the tail with back foot (clean snap)','Slide front foot toward nose simultaneously','Jump vertically','Watch board to catch it','Bend knees on landing']),

('ws-shuvit','Shove-it',(select id from categories where slug='shoveit'),'wakeskate',1,
'Rotation de 180° de la board sous le corps du rider fixe. Peut être FS ou BS.',
'180° rotation of the board under the rider''s fixed body. Can be FS or BS.',
array['Pousser le tail en arrière, nose en avant','Sauter vertical pour laisser la board tourner','Regarder la board pendant la rotation','Atterrir sur les deux pieds simultanément'],
array['Push tail back, nose forward','Jump vertically to let board rotate','Watch board during rotation','Land on both feet simultaneously']),

('ws-pop-shuvit','Pop Shove-it',(select id from categories where slug='shoveit'),'wakeskate',1,
'Ollie avec un shove-it rotaté dans les airs. Peut être FS ou BS.',
'Ollie with a shove-it rotated in the air. Can be FS or BS.',
array['Ollie propre comme base','Pousser le tail pour le shove-it au moment du pop','Laisser la board tourner dans les airs','Rattraper et atterrir proprement'],
array['Clean ollie as base','Push tail for shove-it at pop moment','Let board rotate in the air','Catch and land cleanly']),

('ws-360-shuvit','360 Shove-it',(select id from categories where slug='shoveit'),'wakeskate',2,
'Rotation de 360° de la board sous le corps du rider fixe. FS ou BS.',
'360° rotation of the board under the rider''s fixed body. FS or BS.',
array['Maîtriser le shove-it','Pousser plus fort le tail pour 360°','Sauter plus haut pour donner du temps','Attendre la fin de rotation avant d''atterrir'],
array['Master the shove-it','Push tail harder for 360°','Jump higher for more time','Wait for full rotation before landing']),

('ws-body-varial','Body Varial',(select id from categories where slug='shoveit'),'wakeskate',2,
'Rotation de 180° du rider pendant que la board reste fixe. FS ou BS.',
'180° rotation of the rider while the board stays fixed. FS or BS.',
array['Laisser la board stable sous les pieds','Tourner le corps de 180°','Regagner les deux pieds sur la board','Genoux fléchis à l''atterrissage'],
array['Keep board stable under feet','Rotate body 180°','Regain both feet on board','Bent knees on landing']),

('ws-big-spin','Big Spin',(select id from categories where slug='shoveit'),'wakeskate',3,
'360° shove-it avec un body varial de 180° dans la même direction. FS ou BS.',
'360° shove-it with a same direction 180° body varial. FS or BS.',
array['Maîtriser le 360° shove-it et le body varial séparément','Les deux rotations partent dans le même sens','Timing précis','Atterrir centré sur la board'],
array['Master 360° shove-it and body varial separately','Both rotations go in the same direction','Precise timing','Land centered on board']),

('ws-bigger-spin','Bigger Spin',(select id from categories where slug='shoveit'),'wakeskate',4,
'540° shove-it avec un body varial de 180° dans la même direction. FS ou BS.',
'540° shove-it with a same direction 180° body varial. FS or BS.',
array['Big Spin maîtrisé','540° shove-it solide','Hauteur importante pour le timing','Figure technique avancée'],
array['Mastered Big Spin','Solid 540° shove-it','Good height for timing','Advanced technical trick']),

('ws-gazelle','Gazelle',(select id from categories where slug='shoveit'),'wakeskate',4,
'540° shove-it avec un body varial de 360° dans la même direction. FS ou BS.',
'540° shove-it with a same direction 360° body varial. FS or BS.',
array['Bigger Spin maîtrisé','540° shove-it et 360° body varial','Hauteur maximale','Figure d''élite du wakeskate'],
array['Mastered Bigger Spin','540° shove-it and 360° body varial','Maximum height','Elite wakeskate trick']);

-- Prérequis Shove-it
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ws-pop-shuvit' and r.slug='ws-ollie';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ws-shuvit' and r.slug='ws-ollie';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ws-360-shuvit' and r.slug='ws-shuvit';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ws-body-varial' and r.slug='ws-ollie';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ws-big-spin' and r.slug='ws-360-shuvit';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ws-big-spin' and r.slug='ws-body-varial';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ws-bigger-spin' and r.slug='ws-big-spin';
insert into prerequisites (figure_id, requires_id) select f.id,r.id from figures f,figures r where f.slug='ws-gazelle' and r.slug='ws-bigger-spin';
