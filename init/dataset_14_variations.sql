-- ============================================================
-- WakeRef — 14. VARIATIONS (Blind, Olé, Wrapped, Osmosis)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- New category
-- ────────────────────────────────────────────────────────────
insert into categories (name, slug, color, sort_order) values
  ('Variations', 'variations', '#94a3b8', 14);

-- ────────────────────────────────────────────────────────────
-- Modifier figures
-- ────────────────────────────────────────────────────────────
insert into figures (slug,name,category_id,sport,difficulty,description,description_en,tips,tips_en) values

('blind','Blind',
 (select id from categories where slug='variations'),'wakeboard',2,
 'Atterrissage avec le handle dans le dos. Le rider complète sa figure en ayant effectué un demi-tour supplémentaire avec le corps, gardant le handle derrière le dos à la réception. S''applique principalement aux figures se terminant à 180° de la position de départ (180, wrapped 360, etc.).',
 'Landing with the handle behind your back. The rider completes the trick having rotated an extra half-turn with the body, keeping the handle behind the back on landing. Applies mainly to tricks finishing 180° from the starting position (180, wrapped 360, etc.).',
 array['Se préparer à l''atterrissage blind en regardant par-dessus l''épaule arrière','Garder le handle serré contre le bas du dos','Plier davantage les genoux car l''équilibre est réduit','S''entraîner d''abord sur un trampoline ou en eau peu profonde'],
 array['Prepare for the blind landing by looking over the rear shoulder','Keep the handle tight against the lower back','Bend knees more as balance is reduced','Practise first on a trampoline or in shallow water']),

('ole','Olé',
 (select id from categories where slug='variations'),'wakeboard',2,
 'Passage du handle au-dessus de la tête en cours de figure. La main directrice relâche le handle, qui passe au-dessus de la tête du rider, puis est rattrapé de l''autre côté. Ce geste permet d''ajouter une rotation supplémentaire sans que la corde ne se tende. Utilisé dans le Whirly Bird, le Moby Dick, le Tweetie…',
 'Passing the handle over your head mid-trick. The lead hand releases the handle, which passes over the rider''s head, then is caught on the other side. This move allows an extra rotation without the rope tensioning. Used in the Whirly Bird, Moby Dick, Tweetie…',
 array['L''olé doit être initié tôt dans la figure pour avoir le temps de rattraper','Lancer le handle vers le haut et en avant, pas en arrière','Garder les yeux sur le handle pour ne pas le perdre','Commencer à s''entraîner à l''olé à plat sur la plage ou en salle'],
 array['The olé must be initiated early in the trick to have time to catch','Throw the handle upward and forward, not backward','Keep your eyes on the handle to avoid losing it','Start practising the olé flat on the beach or indoors']),

('wrapped','Wrapped',
 (select id from categories where slug='variations'),'wakeboard',3,
 'Position dans laquelle le rider passe le handle dans le dos avant de déclencher une figure ou d''aborder une feature. Le bras arrière passe derrière le dos pour saisir le handle côté opposé, enroulant la corde autour du corps. Cette position facilite certaines rotations et est la base de l''osmosis.',
 'Position in which the rider passes the handle behind their back before initiating a trick or mounting a feature. The rear arm passes behind the back to grip the handle on the opposite side, wrapping the rope around the body. This position facilitates certain rotations and is the foundation of osmosis.',
 array['Se placer en wrapped avant le kicker ou la feature, pas dessus','Garder le coude arrière haut pour que la corde ne gêne pas','Pratiquer le passage en wrapped à l''arrêt d''abord','Le wrapped ouvre l''accès aux rotations BS et aux combos de slides avancés'],
 array['Get into the wrapped position before the kicker or feature, not on it','Keep the rear elbow high so the rope doesn''t catch','Practise getting wrapped while standing still first','Wrapped opens up BS rotations and advanced slide combos']),

('osmosis','Osmosis',
 (select id from categories where slug='variations'),'wakeboard',4,
 'Combinaison des positions wrapped et blind en une seule figure : le rider entre en wrapped sur une feature et en sort blind. La corde traverse le corps dans les deux sens, créant un enchaînement fluide de positions. Très utilisé dans les combinaisons de slides avancées au wake park.',
 'Combination of the wrapped and blind positions in a single trick: the rider enters a feature wrapped and exits blind. The rope crosses the body in both directions, creating a fluid sequence of positions. Widely used in advanced slide combinations at the wake park.',
 array['Maîtriser les positions wrapped et blind séparément avant de les combiner','Entrer en wrapped avec élan et sortir en laissant la rotation finir naturellement','Le timing de la sortie blind est critique : trop tôt et on chute, trop tard et la corde tire','Se concentrer sur des features droites avant d''essayer des rails courbés'],
 array['Master wrapped and blind positions separately before combining them','Enter wrapped with momentum and exit by letting the rotation finish naturally','Exit timing for blind is critical: too early and you fall, too late and the rope pulls','Focus on straight features before attempting curved rails']);

-- ────────────────────────────────────────────────────────────
-- Hardway — belongs in slides
-- ────────────────────────────────────────────────────────────
insert into figures (slug,name,category_id,sport,difficulty,description,description_en,tips,tips_en) values

('hardway','Hardway',
 (select id from categories where slug='slides'),'wakeboard',3,
 'Approche d''un slide dans le sens le moins naturel pour la rotation. Là où un BS Boardslide s''effectue côté heelside, le hardway l''aborde côté toeside — et inversement pour les autres slides. L''appel de rotation est inversé, ce qui demande plus d''engagement et un timing précis.',
 'Approaching a slide from the least natural direction for the rotation. Where a standard BS Boardslide is done from the heelside, the hardway version approaches toeside — and vice versa for other slides. The rotation impulse is reversed, requiring more commitment and precise timing.',
 array['Bien maîtriser le slide "normal" avant la version hardway','Engager la rotation plus tôt que d''habitude pour compenser le sens difficile','Garder les épaules carrées avec la feature malgré l''appel inversé','Commencer sur des boxes courtes avant de passer aux rails'],
 array['Master the standard slide before attempting the hardway version','Commit to the rotation earlier than usual to compensate for the harder direction','Keep shoulders square to the feature despite the reversed impulse','Start on short boxes before moving to rails']);
