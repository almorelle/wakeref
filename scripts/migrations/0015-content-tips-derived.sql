-- WakeRef — conseils des figures sans tutoriel vidéo
-- Généré le 2026-09-04. À relire, puis appliquer dans l'éditeur SQL Supabase.
--
-- Complète le 0011, qui ne couvrait que les 57 figures disposant d'un how-to.
-- Ces 104 figures n'ont aucune source vidéo : les conseils sont EXTRAPOLÉS à
-- partir de la figure de base (dont les conseils, eux, sont sourcés) et du
-- lexique dégagé des tutoriels. À relire avec ça en tête.
--
-- Deux traitements distincts :
--   * 7 fiches déjà bonnes, corrigées chirurgicalement (un mot, pas la fiche) :
--     seated-fs-180, seated-bs-540, seated-fakie-bs-540, mexican-roll, ole,
--     ollie-360, ollie-bs-360 — « handle » / « poignée » / « charge l'appui »
--   * 97 fiches télégraphiques réécrites : « X maîtrisé », « Hauteur maximale »,
--     « Figure d'élite », « Timing très précis » ne disaient rien d'exécutable
--
-- Conventions : tutoiement, phrases courtes, un conseil = un geste, 4 à 5 par
-- figure. Lexique : palonnier, coupe, pop, kicker, switch, blind, wrapped,
-- « cherche l'eau du regard ». La distinction kicker / blocage n'est PAS traitée
-- ici, elle fera l'objet d'un lot séparé.
--
-- underflip et underflip-rewind : conseils conservés tels quels, seules les
-- tournures sont corrigées (infinitif -> tutoiement, edge -> coupe, corde ->
-- câble, wrapé -> wrapped, complétement -> complètement, pré-spin -> pré-tour).

begin;

do $guard$
declare missing text;
begin
  select string_agg(s, ', ') into missing
  from unnest(array[
    '118',
    '118-900',
    '313-rewind',
    '315',
    '317',
    'back-mobe-5',
    'back-mobe-7',
    'bell-air-moby-dick',
    'bell-air-to-blind',
    'bell-air-to-fakie',
    'ben-air',
    'ben-air-tootsie',
    'ben-air-tootsie-rewind',
    'big-mac',
    'blind-jury',
    'blind-pete',
    'blind-pete-rose',
    'bs-313',
    'bs-313-rewind',
    'bs-315',
    'butter-fuko',
    'crow-mobe-5',
    'crow-mobe-7',
    'double-backroll-to-revert',
    'double-half-cab-roll',
    'double-s-bend',
    'double-s-bend-to-blind',
    'dum-dum',
    'dum-dum-5',
    'egg-mobe',
    'egg-roll',
    'fat-chance',
    'front-blind-mobe',
    'front-flip-to-blind',
    'hassle-hoff',
    'heart-attack',
    'heart-attack-5',
    'hinterberger',
    'hinterberger-5',
    'hinterberger-to-blind',
    'hs-bs-1080',
    'hs-bs-1260',
    'hs-bs-1440',
    'hs-bs-180',
    'hs-bs-900',
    'hs-fs-1080',
    'hs-fs-1260',
    'hs-fs-1440',
    'hs-fs-900',
    'kgb-5',
    'mexican-roll',
    'moby-dick-5',
    'moby-dick-7',
    'ohh',
    'ole',
    'ollie-360',
    'ollie-bs-360',
    'pete-rose-5',
    'pete-rose-7',
    'rubber-chicken',
    's-mobe',
    's-mobe-5',
    's-mobe-rewind',
    'seated-bs-540',
    'seated-fakie-bs-540',
    'seated-fs-180',
    'skeletor',
    'skud',
    'slim-chance',
    'slim-chance-5',
    'squeezer',
    'squeezer-5',
    'tantrum-to-fakie',
    'ts-313',
    'ts-315',
    'ts-blind-judge',
    'ts-bs-1080',
    'ts-bs-1260',
    'ts-bs-1440',
    'ts-bs-313',
    'ts-bs-720',
    'ts-fs-1080',
    'ts-fs-1260',
    'ts-fs-1440',
    'ts-half-cab-roll',
    'ts-krypt',
    'ts-roll-to-blind',
    'ts-s-bend',
    'ts-s-bend-to-blind',
    'tweetie-5',
    'tweetie-dick',
    'underflip',
    'underflip-rewind',
    'whirly-5',
    'whirly-7',
    'whirly-dick',
    'ws-360-kickflip',
    'ws-big-spin',
    'ws-bigflip',
    'ws-bigger-spin',
    'ws-bs-kickflip',
    'ws-fingerflip',
    'ws-fs-kickflip',
    'ws-gazelle',
    'ws-sexchange',
    'ws-varial-kickflip'
  ]) as s
  where not exists (select 1 from figures f where f.slug = s);
  if missing is not null then
    raise exception 'slugs introuvables dans figures : %', missing;
  end if;
end
$guard$;

update figures set
  tips    = array[
    $wr$Il te faut un hinterberger très propre et haut : le double tour se joue entièrement sur le temps d'air.$wr$,
    $wr$L'olé doit tenir pendant les deux rotations, le palonnier ne repasse jamais dans le dos.$wr$,
    $wr$Engage la vitesse de rotation d'un bloc au déclenchement : elle ne se relance pas en l'air.$wr$,
    $wr$Cherche l'eau du regard au dernier demi-tour.$wr$
  ]::text[],
  tips_en = array[
    $wr$You need a very clean, high hinterberger: the double rotation rides entirely on air time.$wr$,
    $wr$The ole has to hold through both rotations, the handle never goes behind your back.$wr$,
    $wr$Commit all the rotation speed at the release: it doesn't restart in the air.$wr$,
    $wr$Find the water on the last half turn.$wr$
  ]::text[]
where slug = '118';

update figures set
  tips    = array[
    $wr$Un 118 constant est le seul vrai prérequis : le demi-tour de plus ne se rattrape pas en l'air.$wr$,
    $wr$Ajoute le demi-tour frontside tout à la fin, une fois les deux rotations bouclées.$wr$,
    $wr$Garde le corps tendu et l'olé stable jusqu'au dernier moment.$wr$,
    $wr$Cherche l'eau du regard avant de finir, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$A consistent 118 is the only real prerequisite: the extra half turn can't be salvaged in the air.$wr$,
    $wr$Add the frontside half turn right at the end, once both rotations are closed.$wr$,
    $wr$Keep the body extended and the ole stable until the last moment.$wr$,
    $wr$Find the water before finishing, knees bent.$wr$
  ]::text[]
where slug = '118-900';

update figures set
  tips    = array[
    $wr$Laisse le 360 finir complètement avant d'inverser. Amorcer le rewind trop tôt casse les deux rotations.$wr$,
    $wr$Le changement de sens vient des hanches, franc et volontaire, pas d'une hésitation.$wr$,
    $wr$Garde le palonnier serré aux hanches pendant tout le rewind : c'est la tension qui te fait repartir en sens inverse.$wr$,
    $wr$Cherche l'eau du regard dès que la rotation s'inverse.$wr$
  ]::text[],
  tips_en = array[
    $wr$Let the 360 finish completely before reversing. Starting the rewind early wrecks both rotations.$wr$,
    $wr$The direction change comes from the hips, deliberate and crisp, not from hesitation.$wr$,
    $wr$Keep the handle tight to your hips through the rewind: it's the tension that sends you back the other way.$wr$,
    $wr$Find the water as soon as the rotation reverses.$wr$
  ]::text[]
where slug = '313-rewind';

update figures set
  tips    = array[
    $wr$Même départ que ton 313, mais il te faut nettement plus de hauteur : allonge la coupe plutôt que de la durcir.$wr$,
    $wr$Engage le 540 dès l'extension du railey. Faire un 360 puis décider d'ajouter un demi-tour ne passe pas.$wr$,
    $wr$Passe le palonnier plus tôt que sur le 313 pour garder de la marge sur la fin.$wr$,
    $wr$Cherche l'eau du regard dès la fin du deuxième demi-tour, genoux fléchis à l'impact.$wr$
  ]::text[],
  tips_en = array[
    $wr$Same entry as your 313, but you need noticeably more height: lengthen the edge rather than hardening it.$wr$,
    $wr$Commit to the 540 from the railey extension. Doing a 360 and then adding a half turn doesn't work.$wr$,
    $wr$Pass the handle earlier than on the 313 to keep some margin at the end.$wr$,
    $wr$Find the water at the end of the second half turn, knees bent on impact.$wr$
  ]::text[]
where slug = '315';

update figures set
  tips    = array[
    $wr$Il te faut la hauteur d'un 315 propre avant d'ajouter le tour supplémentaire.$wr$,
    $wr$Deux passages de palonnier à enchaîner sans temps mort, le second dans le dos.$wr$,
    $wr$Garde le corps tendu comme sur un railey pendant toute la rotation : c'est la position qui tient l'axe.$wr$,
    $wr$Cherche l'eau du regard avant de boucler le dernier demi-tour.$wr$
  ]::text[],
  tips_en = array[
    $wr$You need the height of a clean 315 before adding the extra rotation.$wr$,
    $wr$Two handle passes to chain with no dead time, the second behind your back.$wr$,
    $wr$Keep your body extended like a railey through the whole rotation: that position holds the axis.$wr$,
    $wr$Find the water before closing the last half turn.$wr$
  ]::text[]
where slug = '317';

update figures set
  tips    = array[
    $wr$Même départ que ton back mobe, mais il te faut nettement plus de hauteur.$wr$,
    $wr$Lance la rotation plus franchement dès la sortie du kicker : le demi-tour de plus se décide là.$wr$,
    $wr$Passe le palonnier plus tôt pour ne pas être en retard sur la fin.$wr$,
    $wr$Cherche l'eau du regard dès que le flip est passé, et pose en switch.$wr$
  ]::text[],
  tips_en = array[
    $wr$Same entry as your back mobe, but you need noticeably more height.$wr$,
    $wr$Throw the rotation harder off the kicker: the extra half turn is decided right there.$wr$,
    $wr$Pass the handle earlier so you're not late at the end.$wr$,
    $wr$Find the water as soon as the flip is through, and land switch.$wr$
  ]::text[]
where slug = 'back-mobe-5';

update figures set
  tips    = array[
    $wr$Il te faut un back roll haut et constant : le double tour se joue entièrement sur le temps d'air.$wr$,
    $wr$Deux passages de palonnier pendant le flip, enchaînés sans pause.$wr$,
    $wr$Reste groupé : à deux tours, toute ouverture du corps te fait perdre la fin de rotation.$wr$,
    $wr$Cherche l'eau du regard avant de finir la rotation, pas après.$wr$
  ]::text[],
  tips_en = array[
    $wr$You need a high, consistent back roll: the double rotation rides entirely on air time.$wr$,
    $wr$Two handle passes during the flip, chained with no pause.$wr$,
    $wr$Stay tucked: at two rotations, any opening of the body loses you the end of the spin.$wr$,
    $wr$Find the water before you finish the rotation, not after.$wr$
  ]::text[]
where slug = 'back-mobe-7';

update figures set
  tips    = array[
    $wr$Transfère le poids des talons vers les orteils comme sur ton bell air, épaules alignées sur la planche.$wr$,
    $wr$Lance le backside pendant le flip, en allant chercher le palonnier tôt.$wr$,
    $wr$Passe le palonnier dans le dos, puis tire fort avec le bras arrière pour boucler.$wr$,
    $wr$Cherche l'eau du regard après la rotation, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$Transfer weight from heels to toes like your bell air, shoulders in line with the board.$wr$,
    $wr$Start the backside during the flip, reaching for the handle early.$wr$,
    $wr$Pass the handle behind your back, then pull hard with the back arm to close it.$wr$,
    $wr$Find the water after the rotation, knees bent.$wr$
  ]::text[]
where slug = 'bell-air-moby-dick';

update figures set
  tips    = array[
    $wr$Transfère le poids des talons vers les orteils comme sur ton bell air.$wr$,
    $wr$Ajoute le demi-tour backside pendant le flip, une fois le transfert fait.$wr$,
    $wr$Amène le palonnier au creux du dos et garde-le collé pour la pose.$wr$,
    $wr$Cherche l'eau du regard côté dos avant le contact, poitrine basse.$wr$
  ]::text[],
  tips_en = array[
    $wr$Transfer weight from heels to toes like your bell air.$wr$,
    $wr$Add the backside half turn during the flip, once the transfer is done.$wr$,
    $wr$Bring the handle to the small of your back and keep it pinned for the landing.$wr$,
    $wr$Find the water over your back before contact, chest down.$wr$
  ]::text[]
where slug = 'bell-air-to-blind';

update figures set
  tips    = array[
    $wr$Même départ que ton bell air : poids sur le pied avant, tout part vers le haut.$wr$,
    $wr$Lance le demi-tour frontside au sommet du flip.$wr$,
    $wr$Garde les épaules alignées sur la planche jusqu'à ce que le flip soit passé.$wr$,
    $wr$Pose en switch, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$Same entry as your bell air: weight on the front foot, everything goes up.$wr$,
    $wr$Start the frontside half turn at the top of the flip.$wr$,
    $wr$Keep your shoulders in line with the board until the flip is through.$wr$,
    $wr$Land switch, knees bent.$wr$
  ]::text[]
where slug = 'bell-air-to-fakie';

update figures set
  tips    = array[
    $wr$Approche toeside mais décollage sur la carre talons : c'est cette contre-carre qui fait la figure.$wr$,
    $wr$Le mouvement reste celui d'un front roll, seule la carre de décollage change.$wr$,
    $wr$Il te faut un front roll constant avant d'essayer : la contre-carre déstabilise au début.$wr$,
    $wr$Cherche l'eau du regard en redescendant, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$Toeside approach but taking off on the heelside edge: that opposite edge is what makes the trick.$wr$,
    $wr$The movement stays a front roll, only the takeoff edge changes.$wr$,
    $wr$You need a consistent front roll first: the opposite edge is unsettling at first.$wr$,
    $wr$Find the water on the way down, knees bent.$wr$
  ]::text[]
where slug = 'ben-air';

update figures set
  tips    = array[
    $wr$Il te faut un ben air propre avant d'ajouter la rotation.$wr$,
    $wr$Lance le demi-tour backside pendant le roll, pas après.$wr$,
    $wr$Garde le palonnier près du corps pendant la rotation.$wr$,
    $wr$Pose en switch, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$You need a clean ben air before adding the rotation.$wr$,
    $wr$Start the backside half turn during the roll, not after.$wr$,
    $wr$Keep the handle close to your body through the rotation.$wr$,
    $wr$Land switch, knees bent.$wr$
  ]::text[]
where slug = 'ben-air-tootsie';

update figures set
  tips    = array[
    $wr$Il te faut un ben air tootsie constant : le rewind s'ajoute par-dessus, il ne le rattrape pas.$wr$,
    $wr$Lance le demi-tour backside pendant le roll comme d'habitude.$wr$,
    $wr$N'amorce le rewind qu'une fois l'eau repérée, jamais avant.$wr$,
    $wr$Regarde le tail de ta planche pour poser en blind, poitrine basse.$wr$
  ]::text[],
  tips_en = array[
    $wr$You need a consistent ben air tootsie: the rewind is added on top, it doesn't save a bad one.$wr$,
    $wr$Start the backside half turn during the roll as usual.$wr$,
    $wr$Only trigger the rewind once you've found the water, never before.$wr$,
    $wr$Look at the tail of your board to land blind, chest down.$wr$
  ]::text[]
where slug = 'ben-air-tootsie-rewind';

update figures set
  tips    = array[
    $wr$Départ de back roll heelside, coupe moyenne et longue jusqu'au kicker.$wr$,
    $wr$Envoie le palonnier au-dessus de la tête pendant le roll : sur cette figure il ne passe jamais dans le dos.$wr$,
    $wr$Il te faut un back roll haut, l'olé consomme du temps d'air.$wr$,
    $wr$Cherche l'eau du regard en fin de rotation, réception face avant.$wr$
  ]::text[],
  tips_en = array[
    $wr$Heelside back roll entry, medium long cut into the kicker.$wr$,
    $wr$Punch the handle over your head during the roll: on this one it never goes behind your back.$wr$,
    $wr$You need a high back roll, the ole eats air time.$wr$,
    $wr$Find the water at the end of the rotation, forward landing.$wr$
  ]::text[]
where slug = 'big-mac';

update figures set
  tips    = array[
    $wr$Version switch du blind judge : travaille d'abord ton railey en switch.$wr$,
    $wr$Une fois en extension, tire le palonnier vers toi plutôt que vers la hanche avant.$wr$,
    $wr$Lâche la main arrière au dernier moment et regarde derrière toi.$wr$,
    $wr$Poitrine et épaules basses pour poser blind, genoux très fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$Switch version of the blind judge: get your switch railey solid first.$wr$,
    $wr$Once extended, pull the handle in towards you rather than to your leading hip.$wr$,
    $wr$Drop the back hand at the last moment and look behind you.$wr$,
    $wr$Chest and shoulders down to land blind, knees well bent.$wr$
  ]::text[]
where slug = 'blind-jury';

update figures set
  tips    = array[
    $wr$Départ de back roll toeside à deux mains, tête droite en arrière au sommet du kicker.$wr$,
    $wr$Lance le backside pendant la phase inversée, pas après le flip.$wr$,
    $wr$Passe le palonnier dans le dos pendant que tu es à l'envers.$wr$,
    $wr$Cherche l'eau du regard dès que tu redescends, poids sur les orteils.$wr$
  ]::text[],
  tips_en = array[
    $wr$Toeside back roll entry with both hands, head straight back at the top of the kicker.$wr$,
    $wr$Start the backside during the inverted phase, not after the flip.$wr$,
    $wr$Pass the handle behind your back while you're inverted.$wr$,
    $wr$Find the water as soon as you come down, weight over your toes.$wr$
  ]::text[]
where slug = 'blind-pete';

update figures set
  tips    = array[
    $wr$Version switch du pete rose : c'est l'entrée switch en toeside qui fait la difficulté.$wr$,
    $wr$Lance la rotation pendant la phase inversée, pas après le flip.$wr$,
    $wr$Passe le palonnier rapidement dans le dos.$wr$,
    $wr$Cherche l'eau du regard tôt, poids sur les orteils à la pose.$wr$
  ]::text[],
  tips_en = array[
    $wr$Switch version of the pete rose: the switch toeside entry is where the difficulty is.$wr$,
    $wr$Start the rotation during the inverted phase, not after the flip.$wr$,
    $wr$Pass the handle quickly behind your back.$wr$,
    $wr$Find the water early, weight over your toes on landing.$wr$
  ]::text[]
where slug = 'blind-pete-rose';

update figures set
  tips    = array[
    $wr$Approche de railey, coupe moyenne à forte, déclenchement juste après être passé sous le câble.$wr$,
    $wr$Fais d'abord un railey droit, planche parallèle à l'eau, avant de lancer le backside.$wr$,
    $wr$Passe le palonnier dans le dos au moment où tu tournes le dos à la ligne.$wr$,
    $wr$Cherche l'eau du regard par-dessus l'épaule backside pour finir le tour.$wr$
  ]::text[],
  tips_en = array[
    $wr$Railey approach, medium to hard edge, release just after you pass under the cable.$wr$,
    $wr$Throw a straight railey first, board parallel to the water, before starting the backside.$wr$,
    $wr$Pass the handle behind your back as you turn away from the line.$wr$,
    $wr$Find the water over your backside shoulder to close the rotation.$wr$
  ]::text[]
where slug = 'bs-313';

update figures set
  tips    = array[
    $wr$Laisse le passage backside finir avant d'inverser : c'est le point qui rate le plus souvent.$wr$,
    $wr$Le rewind frontside doit être net, lancé depuis les hanches.$wr$,
    $wr$Palonnier serré tout au long du changement de sens, sinon tu perds la tension et la rotation s'arrête.$wr$,
    $wr$Cherche l'eau du regard dès l'inversion, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$Let the backside pass finish before reversing: that's the step people miss most.$wr$,
    $wr$The frontside rewind has to be crisp, driven from the hips.$wr$,
    $wr$Handle tight through the whole direction change, or you lose the tension and the rotation dies.$wr$,
    $wr$Find the water as soon as it reverses, knees bent.$wr$
  ]::text[]
where slug = 'bs-313-rewind';

update figures set
  tips    = array[
    $wr$Même départ que ton BS 313, avec plus de hauteur pour le demi-tour supplémentaire.$wr$,
    $wr$Engage le backside plus franchement dès l'extension, sinon la fin de rotation ne vient pas.$wr$,
    $wr$Passe le palonnier tôt, dès le premier dos à la ligne.$wr$,
    $wr$Reste compact après le passage et cherche l'eau du regard pour poser.$wr$
  ]::text[],
  tips_en = array[
    $wr$Same entry as your BS 313, with more height for the extra half turn.$wr$,
    $wr$Commit the backside harder from the extension, or the end of the rotation won't come.$wr$,
    $wr$Pass the handle early, the first time your back comes round to the line.$wr$,
    $wr$Stay compact after the pass and find the water to land.$wr$
  ]::text[]
where slug = 'bs-315';

update figures set
  tips    = array[
    $wr$Il te faut un 911 et un krypt propres : la figure combine le shifty de l'un et la rotation de l'autre.$wr$,
    $wr$Tiens d'abord la position tweakée du 911, palonnier près des hanches.$wr$,
    $wr$Ne lance le demi-tour frontside qu'une fois le shifty tenu, sinon tout se mélange.$wr$,
    $wr$Ramène la planche sous toi et pose en switch, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$You need a clean 911 and krypt: this trick combines the shifty of one and the rotation of the other.$wr$,
    $wr$Hold the tweaked 911 position first, handle close to your hips.$wr$,
    $wr$Only start the frontside half turn once the shifty is held, or everything blurs together.$wr$,
    $wr$Bring the board back under you and land switch, knees bent.$wr$
  ]::text[]
where slug = 'butter-fuko';

update figures set
  tips    = array[
    $wr$Même approche que ton crow mobe, avec une coupe un peu plus longue pour la hauteur.$wr$,
    $wr$Le demi-tour supplémentaire s'engage au déclenchement, pas en l'air.$wr$,
    $wr$Passe le palonnier tôt, dès la phase inversée, pour finir sans être en retard.$wr$,
    $wr$Cherche l'eau du regard en redescendant et absorbe avec les genoux.$wr$
  ]::text[],
  tips_en = array[
    $wr$Same approach as your crow mobe, with a slightly longer edge for height.$wr$,
    $wr$The extra half turn is committed at the release, not in the air.$wr$,
    $wr$Pass the handle early, during the inverted phase, so you're not late finishing.$wr$,
    $wr$Find the water on the way down and absorb with your knees.$wr$
  ]::text[]
where slug = 'crow-mobe-5';

update figures set
  tips    = array[
    $wr$Deux tours complets pendant un front roll : il te faut la hauteur d'un crow mobe 5 très propre avant d'y aller.$wr$,
    $wr$Deux passages de palonnier enchaînés, le premier dès la phase inversée.$wr$,
    $wr$Garde les bras près du corps tout du long pour ne pas casser la vitesse de rotation.$wr$,
    $wr$Cherche l'eau du regard au dernier demi-tour, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$Two full rotations inside a front roll: you need the height of a very clean crow mobe 5 first.$wr$,
    $wr$Two handle passes chained, the first from the inverted phase.$wr$,
    $wr$Keep your arms in throughout so you don't kill the rotation speed.$wr$,
    $wr$Find the water on the last half turn, knees bent.$wr$
  ]::text[]
where slug = 'crow-mobe-7';

update figures set
  tips    = array[
    $wr$Il te faut un double back roll constant : le demi-tour ne se rattrape pas si les deux flips sont justes.$wr$,
    $wr$Déclenche le demi-tour dès le début, en même temps que le premier flip.$wr$,
    $wr$Enchaîne les deux rotations en gardant la tête en arrière, sans marquer d'arrêt entre les deux.$wr$,
    $wr$Pose en switch, genoux fléchis pour absorber.$wr$
  ]::text[],
  tips_en = array[
    $wr$You need a consistent double back roll: the half turn can't be salvaged if the two flips are already tight.$wr$,
    $wr$Trigger the half turn from the start, at the same time as the first flip.$wr$,
    $wr$Chain both rotations keeping your head back, with no pause between them.$wr$,
    $wr$Land switch, knees bent to absorb.$wr$
  ]::text[]
where slug = 'double-backroll-to-revert';

update figures set
  tips    = array[
    $wr$Version switch du double back roll to revert : l'entrée switch double la difficulté.$wr$,
    $wr$Déclenche le demi-tour dès le début, avec le premier flip.$wr$,
    $wr$Reste groupé pour boucler les deux rotations, tête tirée en arrière.$wr$,
    $wr$Cherche l'eau du regard après le second flip, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$Switch version of the double back roll to revert: the switch entry doubles the difficulty.$wr$,
    $wr$Trigger the half turn from the start, with the first flip.$wr$,
    $wr$Stay tucked to close both rotations, head pulled back.$wr$,
    $wr$Find the water after the second flip, knees bent.$wr$
  ]::text[]
where slug = 'double-half-cab-roll';

update figures set
  tips    = array[
    $wr$Il te faut un S-bend très propre et haut avant d'envisager les deux rotations.$wr$,
    $wr$Garde la tête sous l'aisselle arrière pendant tout l'enchaînement : la sortir arrête la rotation net.$wr$,
    $wr$L'olé tient pendant les deux tours, le palonnier ne passe jamais dans le dos.$wr$,
    $wr$Reste raide comme un bâton du début à la fin, puis cherche l'eau du regard.$wr$
  ]::text[],
  tips_en = array[
    $wr$You need a very clean, high S-bend before attempting two rotations.$wr$,
    $wr$Keep your head under the rear armpit through the whole sequence: pulling it out stops the rotation dead.$wr$,
    $wr$The ole holds through both rotations, the handle never goes behind your back.$wr$,
    $wr$Stay stiff as a board from start to finish, then find the water.$wr$
  ]::text[]
where slug = 'double-s-bend';

update figures set
  tips    = array[
    $wr$Même construction que le double S-bend, avec le demi-tour backside ajouté tout à la fin.$wr$,
    $wr$Ne pars en blind qu'une fois les deux rotations bouclées, sinon tu poses en travers.$wr$,
    $wr$Amène le palonnier au creux du dos et garde-le collé pour la pose.$wr$,
    $wr$Cherche l'eau du regard côté dos avant le contact.$wr$
  ]::text[],
  tips_en = array[
    $wr$Same build as the double S-bend, with the backside half turn added right at the end.$wr$,
    $wr$Only go to blind once both rotations are closed, or you'll land sideways.$wr$,
    $wr$Bring the handle to the small of your back and keep it pinned for the landing.$wr$,
    $wr$Find the water over your back before contact.$wr$
  ]::text[]
where slug = 'double-s-bend-to-blind';

update figures set
  tips    = array[
    $wr$Départ de front roll : coupe moyenne, main arrière lâchée, poussée au sommet du kicker.$wr$,
    $wr$Le backside se lance pendant le roll, pas après : tire le palonnier vers la hanche arrière dès que tu bascules.$wr$,
    $wr$Passe le palonnier dans le dos pendant que tu es à l'envers.$wr$,
    $wr$Cherche l'eau du regard en fin de flip, poids sur les orteils à la réception.$wr$
  ]::text[],
  tips_en = array[
    $wr$Front roll entry: medium edge, back hand off, push at the top of the kicker.$wr$,
    $wr$The backside starts during the roll, not after: pull the handle to your rear hip as you tip over.$wr$,
    $wr$Pass the handle behind your back while you're inverted.$wr$,
    $wr$Find the water at the end of the flip, weight over your toes on landing.$wr$
  ]::text[]
where slug = 'dum-dum';

update figures set
  tips    = array[
    $wr$Même départ que le dum dum, avec plus de hauteur pour le demi-tour supplémentaire.$wr$,
    $wr$Engage le backside dès le début du roll, sinon tu n'auras jamais le temps de finir.$wr$,
    $wr$Le palonnier passe une fois, tôt, puis tu continues de tirer pour boucler.$wr$,
    $wr$Cherche l'eau du regard avant la fin de la rotation, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$Same entry as the dum dum, with more height for the extra half turn.$wr$,
    $wr$Commit the backside from the start of the roll, or you'll never have time to finish.$wr$,
    $wr$The handle passes once, early, then you keep pulling to close it.$wr$,
    $wr$Find the water before the rotation ends, knees bent.$wr$
  ]::text[]
where slug = 'dum-dum-5';

update figures set
  tips    = array[
    $wr$Il te faut un egg roll propre avant d'ajouter le demi-tour.$wr$,
    $wr$Le demi-tour backside s'ajoute en fin de rotation, pas pendant le roll.$wr$,
    $wr$Garde le palonnier près du corps pour ne pas casser l'axe de la contre-carre.$wr$,
    $wr$Tu reposes sur le pied d'origine : anticipe-le en cherchant l'eau du regard tôt.$wr$
  ]::text[],
  tips_en = array[
    $wr$You need a clean egg roll before adding the half turn.$wr$,
    $wr$The backside half turn is added at the end, not during the roll.$wr$,
    $wr$Keep the handle close so you don't break the opposite-edge axis.$wr$,
    $wr$You land on your original foot: anticipate it by finding the water early.$wr$
  ]::text[]
where slug = 'egg-mobe';

update figures set
  tips    = array[
    $wr$Il te faut un scarecrow et un ben air propres : la figure emprunte l'axe de l'un et la rotation de l'autre.$wr$,
    $wr$Décolle sur la carre talons comme un ben air, en approche toeside.$wr$,
    $wr$Le demi-tour frontside s'intègre exactement comme sur le scarecrow, pendant le roll.$wr$,
    $wr$Cherche l'eau du regard en redescendant, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$You need a clean scarecrow and ben air: this borrows the axis of one and the rotation of the other.$wr$,
    $wr$Take off on the heelside edge like a ben air, on a toeside approach.$wr$,
    $wr$The frontside half turn goes in exactly like the scarecrow, during the roll.$wr$,
    $wr$Find the water on the way down, knees bent.$wr$
  ]::text[]
where slug = 'egg-roll';

update figures set
  tips    = array[
    $wr$Version switch du slim chance : travaille d'abord ton front flip en switch avant d'ajouter la rotation.$wr$,
    $wr$L'entrée switch est le vrai obstacle, pas le 360. Prends le temps de la stabiliser.$wr$,
    $wr$Passe le palonnier pendant le flip, coudes serrés.$wr$,
    $wr$Cherche l'eau du regard devant toi, genoux fléchis à l'impact.$wr$
  ]::text[],
  tips_en = array[
    $wr$Switch version of the slim chance: get your switch front flip solid before adding the rotation.$wr$,
    $wr$The switch entry is the real obstacle, not the 360. Take the time to make it stable.$wr$,
    $wr$Pass the handle during the flip, elbows in.$wr$,
    $wr$Find the water in front of you, knees bent on impact.$wr$
  ]::text[]
where slug = 'fat-chance';

update figures set
  tips    = array[
    $wr$Départ de front flip propre, coupe progressive et déclenchement court.$wr$,
    $wr$Le backside se lance pendant la phase de flip, pas en sortie.$wr$,
    $wr$Passe le palonnier rapidement dans le dos, coudes serrés pour ne pas dériver.$wr$,
    $wr$Cherche l'eau du regard avant la fin de rotation, poitrine basse pour la pose.$wr$
  ]::text[],
  tips_en = array[
    $wr$Clean front flip entry, progressive edge and a short scoop.$wr$,
    $wr$The backside starts during the flip phase, not on the way out.$wr$,
    $wr$Pass the handle quickly behind your back, elbows in so you don't drift.$wr$,
    $wr$Find the water before the rotation ends, chest down for the landing.$wr$
  ]::text[]
where slug = 'front-blind-mobe';

update figures set
  tips    = array[
    $wr$Départ de front flip : coupe progressive, déclenchement court sous le câble, oreille avant collée à l'épaule.$wr$,
    $wr$Lance le demi-tour backside pendant le flip, pas en sortie.$wr$,
    $wr$Amène le palonnier dans le dos et garde-le collé pour la pose blind.$wr$,
    $wr$Cherche l'eau du regard avant le contact, poitrine basse.$wr$
  ]::text[],
  tips_en = array[
    $wr$Front flip entry: progressive edge, short scoop under the cable, front ear into your shoulder.$wr$,
    $wr$Start the backside half turn during the flip, not on the way out.$wr$,
    $wr$Bring the handle behind your back and keep it pinned for the blind landing.$wr$,
    $wr$Find the water before contact, chest down.$wr$
  ]::text[]
where slug = 'front-flip-to-blind';

update figures set
  tips    = array[
    $wr$Version switch du front flip to blind : stabilise d'abord ton front flip en switch.$wr$,
    $wr$L'entrée switch est le vrai obstacle, la rotation ne change pas.$wr$,
    $wr$Amène le palonnier dans le dos pendant le flip et garde-le collé.$wr$,
    $wr$Cherche l'eau du regard côté dos avant le contact.$wr$
  ]::text[],
  tips_en = array[
    $wr$Switch version of the front flip to blind: get your switch front flip solid first.$wr$,
    $wr$The switch entry is the real obstacle, the rotation itself doesn't change.$wr$,
    $wr$Bring the handle behind your back during the flip and keep it pinned.$wr$,
    $wr$Find the water over your back before contact.$wr$
  ]::text[]
where slug = 'hassle-hoff';

update figures set
  tips    = array[
    $wr$Construis d'abord l'axe du S-bend avant de penser à la rotation.$wr$,
    $wr$Le backside se lance pendant la phase d'extension, quand le corps est le plus tendu.$wr$,
    $wr$Passe le palonnier dans le dos sans relâcher la position du S-bend.$wr$,
    $wr$Cherche l'eau du regard en fin de rotation et ramène les pieds sous toi.$wr$
  ]::text[],
  tips_en = array[
    $wr$Build the S-bend axis first before thinking about the rotation.$wr$,
    $wr$The backside starts during the extension phase, when the body is at its most stretched.$wr$,
    $wr$Pass the handle behind your back without letting the S-bend position go.$wr$,
    $wr$Find the water at the end of the rotation and bring your feet back under you.$wr$
  ]::text[]
where slug = 'heart-attack';

update figures set
  tips    = array[
    $wr$Construis d'abord l'axe du S-bend, exactement comme sur le heart attack.$wr$,
    $wr$Déclenche le backside tardivement, en redescente : c'est ce décalage qui fait la figure.$wr$,
    $wr$Trop tôt et tu pars sous l'axe ; trop tard et tu n'as plus le temps de boucler.$wr$,
    $wr$Cherche l'eau du regard dès la fin du passage, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$Build the S-bend axis first, exactly like the heart attack.$wr$,
    $wr$Trigger the backside late, on the way down: that delay is what makes the trick.$wr$,
    $wr$Too early and you go under axis; too late and you run out of time to close it.$wr$,
    $wr$Find the water as soon as the pass is done, knees bent.$wr$
  ]::text[]
where slug = 'heart-attack-5';

update figures set
  tips    = array[
    $wr$Approche de railey, coupe progressive, déclenchement juste après être passé sous le câble.$wr$,
    $wr$Envoie le palonnier au-dessus de la tête au lieu de le passer dans le dos : c'est l'olé qui fait la figure.$wr$,
    $wr$Lance-le tôt dans la rotation, sinon tu n'as pas le temps de le rattraper de l'autre côté.$wr$,
    $wr$Garde les yeux sur le palonnier pour ne pas le perdre, puis cherche l'eau du regard pour poser.$wr$
  ]::text[],
  tips_en = array[
    $wr$Railey approach, progressive edge, release just after passing under the cable.$wr$,
    $wr$Send the handle over your head instead of behind your back: the ole is what makes the trick.$wr$,
    $wr$Throw it early in the rotation, or you won't have time to catch it on the other side.$wr$,
    $wr$Keep your eyes on the handle so you don't lose it, then find the water to land.$wr$
  ]::text[]
where slug = 'hinterberger';

update figures set
  tips    = array[
    $wr$Il te faut un hinterberger propre et haut avant d'ajouter le demi-tour.$wr$,
    $wr$Le demi-tour supplémentaire s'ajoute en fin de rotation, une fois l'olé rattrapé.$wr$,
    $wr$Ne précipite pas l'olé pour gagner du temps : c'est lui qui tient toute la figure.$wr$,
    $wr$Pose en switch, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$You need a clean, high hinterberger before adding the half turn.$wr$,
    $wr$The extra half turn is added at the end, once the ole is caught.$wr$,
    $wr$Don't rush the ole to save time: it's what holds the whole trick together.$wr$,
    $wr$Land switch, knees bent.$wr$
  ]::text[]
where slug = 'hinterberger-5';

update figures set
  tips    = array[
    $wr$Même construction que le hinterberger, avec le demi-tour backside ajouté en fin de rotation.$wr$,
    $wr$Attends d'avoir rattrapé le palonnier avant de partir en blind.$wr$,
    $wr$Amène le palonnier au creux du dos et garde-le collé pour la pose.$wr$,
    $wr$Cherche l'eau du regard côté dos avant le contact, poitrine basse.$wr$
  ]::text[],
  tips_en = array[
    $wr$Same build as the hinterberger, with the backside half turn added at the end.$wr$,
    $wr$Wait until you've caught the handle before going to blind.$wr$,
    $wr$Bring the handle to the small of your back and keep it pinned for the landing.$wr$,
    $wr$Find the water over your back before contact, chest down.$wr$
  ]::text[]
where slug = 'hinterberger-to-blind';

update figures set
  tips    = array[
    $wr$Coupe maximale mais parfaitement lisse, et engagement décidé avant d'arriver au kicker.$wr$,
    $wr$Trois passages de palonnier au toucher, sans jamais les regarder.$wr$,
    $wr$Évite d'enchaîner des back 720 dans la même session, tu resteras bloqué dessus.$wr$,
    $wr$Repère le posé au dernier demi-tour et absorbe long.$wr$
  ]::text[],
  tips_en = array[
    $wr$Maximum but perfectly smooth edge, and commit before you even reach the kicker.$wr$,
    $wr$Three handle passes by feel, never looking at them.$wr$,
    $wr$Avoid doing backside 720s in the same session or you'll stay stuck on them.$wr$,
    $wr$Spot the landing on the last half turn and absorb long.$wr$
  ]::text[]
where slug = 'hs-bs-1080';

update figures set
  tips    = array[
    $wr$Coupe longue et tenue, pop vertical : le demi-tour de plus se paie en hauteur.$wr$,
    $wr$Engage le backside tôt et garde la tête menée pendant toute la rotation.$wr$,
    $wr$Palonnier près des hanches entre les passages, jamais tendu à bout de bras.$wr$,
    $wr$Cherche l'eau côté dos avant de boucler, pose en switch, jambes fléchies.$wr$
  ]::text[],
  tips_en = array[
    $wr$Long, held edge, vertical pop: the extra half turn is paid for in height.$wr$,
    $wr$Commit the backside early and keep your eyes leading the whole way round.$wr$,
    $wr$Handle close to your hips between passes, never out at arm's length.$wr$,
    $wr$Find the water over your back before closing, land switch, legs bent.$wr$
  ]::text[]
where slug = 'hs-bs-1260';

update figures set
  tips    = array[
    $wr$Hauteur et axe avant tout : coupe longue, aplatie juste avant, pop vertical.$wr$,
    $wr$Toute la vitesse de rotation vient du pop, puis le corps reste verrouillé compact.$wr$,
    $wr$Quatre tours, c'est quatre passages enchaînés au toucher. Ils doivent être acquis avant.$wr$,
    $wr$Compte tes tours au regard et finis la rotation avant de chercher l'eau.$wr$
  ]::text[],
  tips_en = array[
    $wr$Height and axis above all: long edge, flattened just before, vertical pop.$wr$,
    $wr$All the rotation speed comes from the pop, then the body stays locked and tucked.$wr$,
    $wr$Four rotations means four passes chained by feel. They have to be second nature first.$wr$,
    $wr$Count your rotations with your eyes and finish spinning before looking for the water.$wr$
  ]::text[]
where slug = 'hs-bs-1440';

update figures set
  tips    = array[
    $wr$Coupe légère, juste assez pour t'éloigner du câble.$wr$,
    $wr$Aplatis au dernier moment et monte le kicker à plat.$wr$,
    $wr$Amorce la rotation avec les épaules au pop, pas avant : pré-tourner sur le kicker te met en travers.$wr$,
    $wr$Tu perds la ligne du regard à mi-tour. Va chercher l'eau côté dos sans attendre.$wr$,
    $wr$Pose en switch, palonnier bas près des hanches, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$Mellow edge, just enough to travel away from the cable.$wr$,
    $wr$Flatten off at the last second and ride up the kicker flat.$wr$,
    $wr$Start the rotation with your shoulders at the pop, not before: pre-spinning on the kicker leaves you sideways.$wr$,
    $wr$You lose sight of the line halfway. Go looking for the water over your back straight away.$wr$,
    $wr$Land switch, handle low by your hips, knees bent.$wr$
  ]::text[]
where slug = 'hs-bs-180';

update figures set
  tips    = array[
    $wr$Coupe moyenne tenue, pop bien vertical : c'est la seule façon d'avoir le temps de boucler.$wr$,
    $wr$Comme sur le back 720, pense « passage, passage » plutôt que vitesse de rotation.$wr$,
    $wr$Garde les bras près du corps. S'ils s'écartent, tu dois tout retirer pour finir.$wr$,
    $wr$Prépare la sortie switch : cherche l'eau côté dos dès le dernier demi-tour.$wr$
  ]::text[],
  tips_en = array[
    $wr$Held medium edge, vertical pop: it's the only way to buy time to close it.$wr$,
    $wr$Like the backside 720, think 'handle pass, handle pass' rather than spin speed.$wr$,
    $wr$Keep your arms in. Let them out and you have to rip everything back in to finish.$wr$,
    $wr$Prepare the switch landing: look for the water over your back from the last half turn.$wr$
  ]::text[]
where slug = 'hs-bs-900';

update figures set
  tips    = array[
    $wr$Coupe maximale mais lisse : la moindre saccade coûte la hauteur dont tu as besoin.$wr$,
    $wr$Toute la vitesse de rotation se donne au pop. Rien ne s'ajoute une fois en l'air.$wr$,
    $wr$Trois tours, trois passages de palonnier. Partir wrapped permet d'en économiser un.$wr$,
    $wr$Ne cherche l'eau qu'au dernier demi-tour, puis absorbe long à la réception.$wr$
  ]::text[],
  tips_en = array[
    $wr$Maximum edge but smooth: any hitch costs you the height you need.$wr$,
    $wr$All the rotation speed is set at the pop. Nothing gets added once you're in the air.$wr$,
    $wr$Three rotations, three handle passes. Starting wrapped saves you one.$wr$,
    $wr$Only look for the water on the last half-turn, then absorb long on landing.$wr$
  ]::text[]
where slug = 'hs-fs-1080';

update figures set
  tips    = array[
    $wr$Le demi-tour de plus ne se gagne qu'en hauteur : coupe longue, aplatie juste avant, pop bien vertical.$wr$,
    $wr$Si tu pars tiré vers l'intérieur, tu perds l'axe et la fin de rotation avec.$wr$,
    $wr$Tête menée en permanence, palonnier près des hanches entre les passages.$wr$,
    $wr$Repère le posé avant de boucler le dernier demi-tour, et pose en switch.$wr$
  ]::text[],
  tips_en = array[
    $wr$The extra half turn is bought with height alone: long edge, flattened just before, vertical pop.$wr$,
    $wr$Leave pulled inside and you lose the axis, and the end of the rotation with it.$wr$,
    $wr$Eyes leading throughout, handle close to your hips between passes.$wr$,
    $wr$Spot the landing before closing the last half turn, and land switch.$wr$
  ]::text[]
where slug = 'hs-fs-1260';

update figures set
  tips    = array[
    $wr$Coupe longue et lisse, aplatie juste avant le kicker pour partir bien vertical.$wr$,
    $wr$La rotation part d'un bloc au pop et ne se relance jamais : engage fort, puis reste verrouillé.$wr$,
    $wr$Les passages de palonnier doivent être automatiques bien avant de tenter la figure.$wr$,
    $wr$Compte tes tours au regard et finis la rotation avant de chercher l'eau.$wr$
  ]::text[],
  tips_en = array[
    $wr$Long, smooth edge, flattened just before the kicker so you leave vertical.$wr$,
    $wr$The rotation fires all at once at the pop and never restarts: commit hard, then stay locked.$wr$,
    $wr$Handle passes must be automatic well before you attempt this.$wr$,
    $wr$Count your rotations with your eyes and finish spinning before looking for the water.$wr$
  ]::text[]
where slug = 'hs-fs-1440';

update figures set
  tips    = array[
    $wr$Coupe longue et tenue : à deux tours et demi, c'est la hauteur qui décide, pas la vitesse d'épaules.$wr$,
    $wr$Vise le 900 dès le départ. Faire un 720 et décider en l'air d'ajouter un demi-tour ne marche pas.$wr$,
    $wr$Enchaîne les deux passages de palonnier sans temps mort.$wr$,
    $wr$Reste compact du début à la fin : chaque ouverture du corps coûte un quart de tour.$wr$,
    $wr$Garde de la rotation en réserve pour finir en switch plutôt que de poser en travers.$wr$
  ]::text[],
  tips_en = array[
    $wr$Long, held edge: at two and a half rotations it's height that decides, not shoulder speed.$wr$,
    $wr$Commit to the 900 from the start. Doing a 720 and deciding mid-air to add a half turn doesn't work.$wr$,
    $wr$Chain both handle passes with no dead time.$wr$,
    $wr$Stay compact throughout: every opening of the body costs a quarter turn.$wr$,
    $wr$Keep rotation in reserve to finish switch rather than landing sideways.$wr$
  ]::text[]
where slug = 'hs-fs-900';

update figures set
  tips    = array[
    $wr$Même coupe moyenne et longue que sur ton KGB, mais avec plus de pop au sommet du kicker.$wr$,
    $wr$Tourne la tête et tire le palonnier vers la hanche arrière en même temps, plus franchement que sur le KGB.$wr$,
    $wr$Le demi-tour supplémentaire se gagne sur la vitesse du passage, pas sur la force des bras.$wr$,
    $wr$Ramène le palonnier vers la hanche avant pour poser, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$Same medium, long cut as your KGB, but with more pop at the top of the kicker.$wr$,
    $wr$Turn your head and pull the handle to your rear hip together, harder than on the KGB.$wr$,
    $wr$The extra half turn comes from the speed of the pass, not from arm strength.$wr$,
    $wr$Bring the handle to your leading hip to land, knees bent.$wr$
  ]::text[]
where slug = 'kgb-5';

update figures set
  tips    = array[
    $wr$Approche heelside du kicker$wr$,
    $wr$Relâcher la main arrière au bas du kicker$wr$,
    $wr$Lancer la rotation sous l'aisselle, pas au-dessus des orteils$wr$,
    $wr$Ne jamais tirer sur le palonnier pendant la rotation$wr$,
    $wr$Spotter l'eau côté toeside pour la réception$wr$
  ]::text[],
  tips_en = array[
    $wr$Heelside approach to the kicker$wr$,
    $wr$Release the back hand at the bottom of the kicker$wr$,
    $wr$Throw your rotation under your armpit, not over your toes$wr$,
    $wr$Never pull the handle during your rotation$wr$,
    $wr$Spot the landing on your toeside for the landing$wr$
  ]::text[]
where slug = 'mexican-roll';

update figures set
  tips    = array[
    $wr$Coupe moyenne à forte comme sur ton moby dick, sans jamais aller jusqu'à une coupe de railey.$wr$,
    $wr$Attrape le palonnier le plus tôt possible après le pop : c'est ce qui te donne le temps du demi-tour en plus.$wr$,
    $wr$Tire très fort avec le bras arrière après le premier 180 pour enrouler la fin.$wr$,
    $wr$Cherche l'eau du regard dès que tu redescends, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$Medium to hard edge like your moby dick, never a full railey edge.$wr$,
    $wr$Get the handle as early as possible after the pop: that's what buys you the extra half turn.$wr$,
    $wr$Pull hard with the back arm after the first 180 to wind up the end.$wr$,
    $wr$Find the water as soon as you come down, knees bent.$wr$
  ]::text[]
where slug = 'moby-dick-5';

update figures set
  tips    = array[
    $wr$Il te faut un tantrum haut et constant : c'est le temps d'air qui fait les deux tours.$wr$,
    $wr$Deux passages de palonnier dans le dos, enchaînés sans marquer d'arrêt.$wr$,
    $wr$Reste groupé pendant le flip, sinon la deuxième rotation ne se boucle pas.$wr$,
    $wr$Cherche l'eau du regard avant de finir, pas au moment de poser.$wr$
  ]::text[],
  tips_en = array[
    $wr$You need a high, consistent tantrum: air time is what makes the two rotations.$wr$,
    $wr$Two handle passes behind your back, chained without stopping.$wr$,
    $wr$Stay tucked through the flip, or the second rotation won't come round.$wr$,
    $wr$Find the water before you finish, not as you land.$wr$
  ]::text[]
where slug = 'moby-dick-7';

update figures set
  tips    = array[
    $wr$Pars d'un railey propre et bien tendu avant de chercher le grab.$wr$,
    $wr$La main arrière vient attraper la carre talons pendant l'extension.$wr$,
    $wr$Garde le corps tendu : c'est la position qui rend le grab atteignable, pas le fait de se plier.$wr$,
    $wr$Relâche avant de ramener les pieds sous toi, puis tire le palonnier vers la hanche avant.$wr$
  ]::text[],
  tips_en = array[
    $wr$Start from a clean, fully extended railey before reaching for the grab.$wr$,
    $wr$The back hand takes the heelside edge during the extension.$wr$,
    $wr$Keep the body stretched: that position is what brings the grab within reach, not folding up.$wr$,
    $wr$Release before bringing your feet back under you, then pull the handle to your leading hip.$wr$
  ]::text[]
where slug = 'ohh';

update figures set
  tips    = array[
    $wr$L'olé doit être initié tôt dans la figure pour avoir le temps de rattraper$wr$,
    $wr$Lancer le palonnier vers le haut et en avant, pas en arrière$wr$,
    $wr$Garder les yeux sur le palonnier pour ne pas le perdre$wr$,
    $wr$Commencer à s'entraîner à l'olé à plat sur la plage ou en salle$wr$
  ]::text[],
  tips_en = array[
    $wr$The olé must be initiated early in the trick to have time to catch$wr$,
    $wr$Throw the handle upward and forward, not backward$wr$,
    $wr$Keep your eyes on the handle to avoid losing it$wr$,
    $wr$Start practising the olé flat on the beach or indoors$wr$
  ]::text[]
where slug = 'ole';

update figures set
  tips    = array[
    $wr$Accélère la rotation dès le pop : le 360 enchaîne deux demi-tours sans temps mort.$wr$,
    $wr$Passe le palonnier dans le dos pour accompagner le second demi-tour.$wr$,
    $wr$Garde le palonnier bas et proche des hanches pour ne pas casser la rotation.$wr$
  ]::text[],
  tips_en = array[
    $wr$Speed up the spin right off the pop: the 360 links two half-rotations with no pause.$wr$,
    $wr$Pass the handle behind your back to carry the second half-rotation.$wr$,
    $wr$Keep the handle low and close to your hips so you don't stall the spin.$wr$
  ]::text[]
where slug = 'ollie-360';

update figures set
  tips    = array[
    $wr$Accélère la rotation dès le pop : le 360 enchaîne deux demi-tours sans temps mort.$wr$,
    $wr$Garde le palonnier bas et proche des hanches pour ne pas casser la rotation.$wr$,
    $wr$Anticipe la réception switch en repérant l'eau tôt.$wr$
  ]::text[],
  tips_en = array[
    $wr$Speed up the spin right off the pop: the 360 links two half-rotations with no pause.$wr$,
    $wr$Keep the handle low and close to your hips so you don't stall the spin.$wr$,
    $wr$Anticipate the switch landing by spotting the water early.$wr$
  ]::text[]
where slug = 'ollie-bs-360';

update figures set
  tips    = array[
    $wr$Coupe légère comme sur ton pete rose : trop fort, tu sur-tournes avant d'avoir fini le grab.$wr$,
    $wr$Lâche la main avant tôt, prends le grab, puis descends la main restée sur le palonnier vers la hanche arrière.$wr$,
    $wr$Le demi-tour supplémentaire vient d'un passage plus rapide, pas d'une coupe plus dure.$wr$,
    $wr$Tourne la tête pour chercher l'eau du regard en tenant le grab, puis pose sur les orteils.$wr$
  ]::text[],
  tips_en = array[
    $wr$Gentle edge like your pete rose: too hard and you over-rotate before finishing the grab.$wr$,
    $wr$Drop the front hand early, take the grab, then bring the hand on the handle down to your rear hip.$wr$,
    $wr$The extra half turn comes from a faster pass, not a harder edge.$wr$,
    $wr$Turn your head to find the water while holding the grab, then land over your toes.$wr$
  ]::text[]
where slug = 'pete-rose-5';

update figures set
  tips    = array[
    $wr$Garde le back roll toeside compact : c'est la compacité qui permet les deux tours, pas la vitesse d'entrée.$wr$,
    $wr$Deux passages de palonnier très rapides pendant la phase inversée.$wr$,
    $wr$Ne tiens le grab que si tu as le temps. Sur cette figure, la rotation prime.$wr$,
    $wr$Cherche l'eau du regard avant de poser sur la carre de réception.$wr$
  ]::text[],
  tips_en = array[
    $wr$Keep the toeside back roll compact: it's compactness that allows two rotations, not entry speed.$wr$,
    $wr$Two very fast handle passes during the inverted phase.$wr$,
    $wr$Only hold the grab if you have time. On this one the rotation comes first.$wr$,
    $wr$Find the water before the landing edge loads up.$wr$
  ]::text[]
where slug = 'pete-rose-7';

update figures set
  tips    = array[
    $wr$Pars d'un railey propre, coupe progressive et corps bien tendu.$wr$,
    $wr$Le palonnier passe au-dessus de la tête pendant la rotation backside, jamais dans le dos.$wr$,
    $wr$Lance l'olé tôt : en backside tu perds la ligne du regard, il te faut de la marge.$wr$,
    $wr$Ramène les pieds proprement sous toi et cherche l'eau du regard pour poser.$wr$
  ]::text[],
  tips_en = array[
    $wr$Start from a clean railey, progressive edge and body stretched out.$wr$,
    $wr$The handle goes over your head through the backside rotation, never behind your back.$wr$,
    $wr$Throw the ole early: on backside you lose sight of the line, so you need margin.$wr$,
    $wr$Bring your feet back cleanly under you and find the water to land.$wr$
  ]::text[]
where slug = 'rubber-chicken';

update figures set
  tips    = array[
    $wr$Construis d'abord l'axe du S-bend : tête entre les bras et sous l'aisselle arrière, corps raide.$wr$,
    $wr$N'ajoute la rotation frontside qu'une fois le barrel roll engagé, jamais avant.$wr$,
    $wr$Passe le palonnier pendant la phase d'extension, sans sortir la tête de sous l'aisselle.$wr$,
    $wr$Cherche l'eau du regard en fin de rotation et ramène les pieds sous toi.$wr$
  ]::text[],
  tips_en = array[
    $wr$Build the S-bend axis first: head between your arms and under the rear armpit, body stiff.$wr$,
    $wr$Only add the frontside rotation once the barrel roll is going, never before.$wr$,
    $wr$Pass the handle during the extension phase, without pulling your head out from under the armpit.$wr$,
    $wr$Find the water at the end of the rotation and bring your feet back under you.$wr$
  ]::text[]
where slug = 's-mobe';

update figures set
  tips    = array[
    $wr$Même construction que le s-mobe, avec une coupe plus longue pour la hauteur.$wr$,
    $wr$Le demi-tour supplémentaire se prend sur la vitesse du passage de palonnier.$wr$,
    $wr$Garde la position du S-bend jusqu'au bout : dès que tu t'ouvres, la rotation cale et tu pars sur le dos.$wr$,
    $wr$Cherche l'eau du regard au dernier demi-tour, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$Same build as the s-mobe, with a longer edge for height.$wr$,
    $wr$The extra half turn comes from the speed of the handle pass.$wr$,
    $wr$Hold the S-bend position to the end: open up and the rotation stalls and you go onto your back.$wr$,
    $wr$Find the water on the last half turn, knees bent.$wr$
  ]::text[]
where slug = 's-mobe-5';

update figures set
  tips    = array[
    $wr$Laisse le passage frontside finir avant d'inverser, sinon les deux rotations se mélangent.$wr$,
    $wr$Le rewind backside doit être net et contrôlé, lancé depuis les hanches.$wr$,
    $wr$Palonnier serré pendant tout le changement de sens : c'est la tension qui te renvoie dans l'autre sens.$wr$,
    $wr$Cherche l'eau du regard dès l'inversion.$wr$
  ]::text[],
  tips_en = array[
    $wr$Let the frontside pass finish before reversing, or the two rotations blur together.$wr$,
    $wr$The backside rewind has to be crisp and controlled, driven from the hips.$wr$,
    $wr$Handle tight through the direction change: it's the tension that sends you back the other way.$wr$,
    $wr$Find the water as soon as it reverses.$wr$
  ]::text[]
where slug = 's-mobe-rewind';

update figures set
  tips    = array[
    $wr$Appuie fort : le BS 540 demande de la vitesse de rotation pour finir le demi-tour blind.$wr$,
    $wr$Enchaîne deux passes de regard et garde le palonnier qui circule en continu autour du corps.$wr$,
    $wr$Prépare la sortie blind dès les 360° : spotte l'eau côté dos avant de relâcher la planche.$wr$
  ]::text[],
  tips_en = array[
    $wr$Load the edge hard: the BS 540 needs rotation speed to finish the blind half-turn.$wr$,
    $wr$Chain two spots and keep the handle flowing continuously around the body.$wr$,
    $wr$Prepare the blind exit from 360°: spot the water over your back before releasing the board.$wr$
  ]::text[]
where slug = 'seated-bs-540';

update figures set
  tips    = array[
    $wr$La figure cumule entrée fakie, rotation backside et sortie blind : engage fort la rotation.$wr$,
    $wr$Enchaîne les passes de regard et garde le palonnier qui circule sans à-coup.$wr$,
    $wr$Anticipe la sortie blind dès la 2e moitié de tour : spotte l'eau côté dos avant la pose.$wr$
  ]::text[],
  tips_en = array[
    $wr$This trick stacks fakie entry, backside rotation and a blind exit: load rotation speed hard.$wr$,
    $wr$Chain your spots and keep the handle flowing smoothly.$wr$,
    $wr$Anticipate the blind exit from the second half-turn: spot the water over your back before landing.$wr$
  ]::text[]
where slug = 'seated-fakie-bs-540';

update figures set
  tips    = array[
    $wr$Prends un appui régulier en regardant vers l'extérieur, puis lance la tête et les épaules côté cable pour enrouler le frontside.$wr$,
    $wr$Garde le palonnier collé à la hanche pendant toute la rotation : c'est lui qui tient l'appui et règle la vitesse.$wr$,
    $wr$Repère l'eau derrière toi à mi-tour et reçois en fakie, buste droit, en amortissant avec le tronc.$wr$
  ]::text[],
  tips_en = array[
    $wr$Build a steady edge looking outside, then lead with head and shoulders toward the cable to wind up the frontside.$wr$,
    $wr$Keep the handle pinned to your hip through the whole spin — it holds your edge and meters the rotation speed.$wr$,
    $wr$Spot the water halfway round and land fakie, chest tall, absorbing with your core.$wr$
  ]::text[]
where slug = 'seated-fs-180';

update figures set
  tips    = array[
    $wr$Version switch du roll to blind : c'est l'entrée switch qui fait la difficulté.$wr$,
    $wr$Lance le demi-tour backside pendant la rotation du roll.$wr$,
    $wr$Amène le palonnier dans le dos et garde-le collé jusqu'au contact.$wr$,
    $wr$Cherche l'eau du regard côté dos, poitrine et épaules basses.$wr$
  ]::text[],
  tips_en = array[
    $wr$Switch version of the roll to blind: the switch entry is where the difficulty is.$wr$,
    $wr$Start the backside half turn during the roll rotation.$wr$,
    $wr$Bring the handle behind your back and keep it pinned until contact.$wr$,
    $wr$Find the water over your back, chest and shoulders down.$wr$
  ]::text[]
where slug = 'skeletor';

update figures set
  tips    = array[
    $wr$Version switch du ts 313 : c'est l'entrée switch en toeside qui fait toute la difficulté.$wr$,
    $wr$Stabilise d'abord ton railey toeside en switch avant d'ajouter la rotation.$wr$,
    $wr$Engage le 360 depuis l'extension, puis passe le palonnier rapidement.$wr$,
    $wr$Cherche l'eau du regard pour poser, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$Switch version of the toeside 313: the switch toeside entry is the whole difficulty.$wr$,
    $wr$Get your switch toeside railey solid before adding the rotation.$wr$,
    $wr$Start the 360 from the extension, then pass the handle quickly.$wr$,
    $wr$Find the water to land, knees bent.$wr$
  ]::text[]
where slug = 'skud';

update figures set
  tips    = array[
    $wr$Départ de front flip : coupe progressive, déclenchement court et fort sous le câble.$wr$,
    $wr$Colle l'oreille avant à l'épaule pour lancer le flip, puis tire le palonnier vers la hanche arrière.$wr$,
    $wr$Passe le palonnier pendant la phase de flip, coudes serrés.$wr$,
    $wr$Cherche l'eau du regard devant toi et pose sur les talons.$wr$
  ]::text[],
  tips_en = array[
    $wr$Front flip entry: progressive edge, short hard scoop under the cable.$wr$,
    $wr$Slam your front ear into your shoulder to start the flip, then pull the handle to your rear hip.$wr$,
    $wr$Pass the handle during the flip phase, elbows in.$wr$,
    $wr$Find the water in front of you and land on your heels.$wr$
  ]::text[]
where slug = 'slim-chance';

update figures set
  tips    = array[
    $wr$Il te faut un front flip très haut : le demi-tour de plus se paie entièrement en temps d'air.$wr$,
    $wr$Le palonnier passe deux fois pendant le flip. Enchaîne-les sans marquer d'arrêt.$wr$,
    $wr$Le point délicat est la synchronisation entre l'axe du flip et la rotation : engage les deux ensemble.$wr$,
    $wr$Cherche l'eau du regard avant de boucler, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$You need a very high front flip: the extra half turn is paid for entirely in air time.$wr$,
    $wr$The handle passes twice during the flip. Chain them without stopping.$wr$,
    $wr$The tricky part is syncing the flip axis with the rotation: commit to both together.$wr$,
    $wr$Find the water before closing, knees bent.$wr$
  ]::text[]
where slug = 'slim-chance-5';

update figures set
  tips    = array[
    $wr$Version switch du crow mobe : stabilise ton front roll en switch avant d'ajouter la rotation.$wr$,
    $wr$Le 360 se lance pendant la phase inversée, comme sur le crow mobe.$wr$,
    $wr$Passe le palonnier rapidement, coudes serrés.$wr$,
    $wr$Cherche l'eau du regard tôt, genoux fléchis à l'impact.$wr$
  ]::text[],
  tips_en = array[
    $wr$Switch version of the crow mobe: get your switch front roll solid before adding the rotation.$wr$,
    $wr$The 360 starts during the inverted phase, like the crow mobe.$wr$,
    $wr$Pass the handle quickly, elbows in.$wr$,
    $wr$Find the water early, knees bent on impact.$wr$
  ]::text[]
where slug = 'squeezer';

update figures set
  tips    = array[
    $wr$Même construction que le squeezer, avec la hauteur nécessaire au demi-tour supplémentaire.$wr$,
    $wr$Engage le 540 dès le déclenchement : ajouter un demi-tour en l'air ne marche pas.$wr$,
    $wr$Passe le palonnier tôt pour ne pas être en retard sur la fin.$wr$,
    $wr$Cherche l'eau du regard avant de boucler, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$Same build as the squeezer, with the height needed for the extra half turn.$wr$,
    $wr$Commit to the 540 at the release: adding a half turn mid-air doesn't work.$wr$,
    $wr$Pass the handle early so you're not late at the end.$wr$,
    $wr$Find the water before closing, knees bent.$wr$
  ]::text[]
where slug = 'squeezer-5';

update figures set
  tips    = array[
    $wr$Coupe moyenne comme sur ton tantrum, épaules bien face à la ligne.$wr$,
    $wr$Lance le demi-tour frontside au sommet du backflip, pas en sortie.$wr$,
    $wr$Garde la tension pendant tout le flip : c'est elle qui enroule le demi-tour.$wr$,
    $wr$Pose en switch, genoux fléchis pour absorber.$wr$
  ]::text[],
  tips_en = array[
    $wr$Medium edge like your tantrum, shoulders square to the line.$wr$,
    $wr$Start the frontside half turn at the top of the backflip, not on the way out.$wr$,
    $wr$Hold the tension through the flip: that's what winds the half turn.$wr$,
    $wr$Land switch, knees bent to absorb.$wr$
  ]::text[]
where slug = 'tantrum-to-fakie';

update figures set
  tips    = array[
    $wr$Coupe orteils progressive de trois secondes, coude arrière verrouillé sur le ventre.$wr$,
    $wr$Fais d'abord un railey toeside bien haut : sans hauteur, tu n'as pas le temps du tour.$wr$,
    $wr$Engage le 360 depuis l'extension maximale, pas avant.$wr$,
    $wr$Passe le palonnier rapidement et cherche l'eau du regard pour poser.$wr$
  ]::text[],
  tips_en = array[
    $wr$Progressive three-second toeside cut, back elbow locked on your stomach.$wr$,
    $wr$Throw a good high toeside railey first: without height you don't have time for the rotation.$wr$,
    $wr$Start the 360 from full extension, not before.$wr$,
    $wr$Pass the handle quickly and find the water to land.$wr$
  ]::text[]
where slug = 'ts-313';

update figures set
  tips    = array[
    $wr$Même départ que ton ts 313, avec plus de hauteur pour le demi-tour supplémentaire.$wr$,
    $wr$Engage le 540 dès l'extension : décider en l'air d'ajouter un demi-tour ne marche pas.$wr$,
    $wr$Passe le palonnier tôt pour ne pas être en retard sur la fin.$wr$,
    $wr$Cherche l'eau du regard avant de boucler, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$Same entry as your toeside 313, with more height for the extra half turn.$wr$,
    $wr$Commit to the 540 from the extension: deciding mid-air to add a half turn doesn't work.$wr$,
    $wr$Pass the handle early so you're not late at the end.$wr$,
    $wr$Find the water before closing, knees bent.$wr$
  ]::text[]
where slug = 'ts-315';

update figures set
  tips    = array[
    $wr$Départ de railey toeside, coude arrière verrouillé sur le ventre pendant la coupe.$wr$,
    $wr$Une fois en extension, tire le palonnier vers toi au lieu de la hanche avant.$wr$,
    $wr$Lâche la main arrière au dernier moment et regarde derrière toi.$wr$,
    $wr$Poitrine et épaules basses pour la pose blind, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$Toeside railey entry, back elbow locked on your stomach through the cut.$wr$,
    $wr$Once extended, pull the handle in towards you instead of your leading hip.$wr$,
    $wr$Drop the back hand at the last moment and look behind you.$wr$,
    $wr$Chest and shoulders down for the blind landing, knees bent.$wr$
  ]::text[]
where slug = 'ts-blind-judge';

update figures set
  tips    = array[
    $wr$Coupe moyenne, aplatie tôt : c'est le palonnier attrapé tôt qui donne l'avance nécessaire.$wr$,
    $wr$Trois passages, ou deux si tu poses wrapped. Décide avant, pas en l'air.$wr$,
    $wr$Reste très compact, planche ramenée sous toi pendant toute la rotation.$wr$,
    $wr$Repère l'eau au dernier demi-tour seulement.$wr$
  ]::text[],
  tips_en = array[
    $wr$Medium edge, flattened early: getting the handle early is what buys the lead you need.$wr$,
    $wr$Three passes, or two if you land wrapped. Decide before, not in the air.$wr$,
    $wr$Stay very compact, board pulled under you through the whole rotation.$wr$,
    $wr$Only look for the water on the last half turn.$wr$
  ]::text[]
where slug = 'ts-bs-1080';

update figures set
  tips    = array[
    $wr$Appuie progressivement sur la carre orteils et tiens-la jusqu'au pop, sans à-coups.$wr$,
    $wr$Engage le backside tôt : à trois tours et demi, la rotation ne se relance jamais en l'air.$wr$,
    $wr$Palonnier près des hanches entre les passages, ligne tendue en permanence.$wr$,
    $wr$Repère le posé avant de boucler le dernier demi-tour.$wr$
  ]::text[],
  tips_en = array[
    $wr$Press progressively into the toeside edge and hold it to the pop, with no hitches.$wr$,
    $wr$Commit the backside early: at three and a half rotations, nothing restarts in the air.$wr$,
    $wr$Handle close to your hips between passes, line kept tight throughout.$wr$,
    $wr$Spot the landing before closing the last half turn.$wr$
  ]::text[]
where slug = 'ts-bs-1260';

update figures set
  tips    = array[
    $wr$Coupe orteils longue et lisse, aplatie juste avant pour un pop bien vertical.$wr$,
    $wr$Toute la vitesse de rotation vient du pop : engage fort puis reste verrouillé.$wr$,
    $wr$Les passages s'enchaînent au toucher, très vite, sans jamais regarder le palonnier.$wr$,
    $wr$Compte tes tours au regard et finis la rotation avant de chercher l'eau.$wr$
  ]::text[],
  tips_en = array[
    $wr$Long, smooth toeside edge, flattened just before for a vertical pop.$wr$,
    $wr$All the rotation speed comes from the pop: commit hard, then stay locked.$wr$,
    $wr$Passes chain by feel, very fast, never looking at the handle.$wr$,
    $wr$Count your rotations with your eyes and finish spinning before looking for the water.$wr$
  ]::text[]
where slug = 'ts-bs-1440';

update figures set
  tips    = array[
    $wr$Coupe orteils progressive, railey toeside bien haut avant de penser à la rotation.$wr$,
    $wr$Engage le backside depuis l'extension maximale et passe le palonnier dans le dos.$wr$,
    $wr$En backside tu perds la ligne du regard : va chercher l'eau côté dos tôt.$wr$,
    $wr$Ramène les pieds sous toi avant le contact, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$Progressive toeside cut, good high toeside railey before thinking about the rotation.$wr$,
    $wr$Start the backside from full extension and pass the handle behind your back.$wr$,
    $wr$On backside you lose sight of the line: go looking for the water over your back early.$wr$,
    $wr$Bring your feet under you before contact, knees bent.$wr$
  ]::text[]
where slug = 'ts-bs-313';

update figures set
  tips    = array[
    $wr$Même coupe que sur ton toe back 540, relâchée quelques mètres avant le kicker pour attraper le palonnier tôt.$wr$,
    $wr$Ce palonnier pris tôt est ce qui rend le double tour possible : sans lui tu es en retard dès le premier tour.$wr$,
    $wr$Pense-le comme deux toe back 360 enchaînés plutôt que comme un 540 avec un 180 ajouté.$wr$,
    $wr$Regarde par-dessus l'épaule arrière et laisse-toi dérouler sans forcer sur les bras.$wr$,
    $wr$Anticipe la réception sur le dernier demi-tour, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$Same edge as your toeside backside 540, backed off a few metres before the kicker so you get the handle early.$wr$,
    $wr$Getting the handle early is what makes the double rotation possible: without it you're late from the first turn.$wr$,
    $wr$Think of it as two toeside backside 360s back to back rather than a 540 with a 180 added.$wr$,
    $wr$Look over your rear shoulder and let yourself unwind without pulling with the arms.$wr$,
    $wr$Anticipate the landing on the last half turn, knees bent.$wr$
  ]::text[]
where slug = 'ts-bs-720';

update figures set
  tips    = array[
    $wr$Coupe orteils maximale et parfaitement lisse : tout se joue sur la qualité de la carre.$wr$,
    $wr$Engage la rotation dès le pop et verrouille la position, rien ne s'ajoute en l'air.$wr$,
    $wr$Enchaîne les passages au toucher, ou pars wrapped pour en économiser un.$wr$,
    $wr$Ne cherche l'eau qu'au dernier demi-tour, puis absorbe long.$wr$
  ]::text[],
  tips_en = array[
    $wr$Maximum toeside edge, perfectly smooth: it all rides on edge quality.$wr$,
    $wr$Commit the rotation at the pop and lock the position, nothing gets added in the air.$wr$,
    $wr$Chain the passes by feel, or start wrapped to save one.$wr$,
    $wr$Only look for the water on the last half turn, then absorb long.$wr$
  ]::text[]
where slug = 'ts-fs-1080';

update figures set
  tips    = array[
    $wr$Appuie progressivement sur la carre orteils et tiens-la jusqu'au pop : le demi-tour de plus se gagne en hauteur.$wr$,
    $wr$Pop vertical et axe propre. Partir tiré vers l'intérieur condamne la fin de rotation.$wr$,
    $wr$Tête menée en permanence, palonnier près des hanches entre les passages.$wr$,
    $wr$Repère le posé avant de boucler et pose en switch.$wr$
  ]::text[],
  tips_en = array[
    $wr$Press progressively into the toeside edge and hold it to the pop: the extra half turn comes from height.$wr$,
    $wr$Vertical pop, clean axis. Leaving pulled inside dooms the end of the rotation.$wr$,
    $wr$Eyes leading throughout, handle close to your hips between passes.$wr$,
    $wr$Spot the landing before closing and land switch.$wr$
  ]::text[]
where slug = 'ts-fs-1260';

update figures set
  tips    = array[
    $wr$Coupe orteils longue et lisse, aplatie juste avant le kicker pour partir vertical.$wr$,
    $wr$Toute la vitesse de rotation est donnée au pop : engage fort, puis reste verrouillé compact.$wr$,
    $wr$Les passages de palonnier s'enchaînent au toucher, sans les regarder.$wr$,
    $wr$Finis la rotation avant de chercher l'eau, puis absorbe long à la réception.$wr$
  ]::text[],
  tips_en = array[
    $wr$Long, smooth toeside edge, flattened just before the kicker so you leave vertical.$wr$,
    $wr$All the rotation speed is given at the pop: commit hard, then stay locked and tucked.$wr$,
    $wr$Handle passes chain by feel, without looking.$wr$,
    $wr$Finish the rotation before looking for the water, then absorb long on landing.$wr$
  ]::text[]
where slug = 'ts-fs-1440';

update figures set
  tips    = array[
    $wr$Version switch du ts roll to revert : travaille d'abord ton back roll toeside en switch.$wr$,
    $wr$Décolle à deux mains et force le palonnier à rester du côté avant du corps.$wr$,
    $wr$Lance le demi-tour frontside vers la moitié du flip, pas au départ.$wr$,
    $wr$Pose en switch, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$Switch version of the toeside roll to revert: get your switch toeside back roll solid first.$wr$,
    $wr$Take off with both hands and force the handle to stay on the front side of your body.$wr$,
    $wr$Start the frontside half turn about halfway through the flip, not at the start.$wr$,
    $wr$Land switch, knees bent.$wr$
  ]::text[]
where slug = 'ts-half-cab-roll';

update figures set
  tips    = array[
    $wr$Il te faut un railey toeside solide : c'est lui le vrai obstacle, pas le demi-tour.$wr$,
    $wr$Fais d'abord un railey toeside propre, puis lâche la main avant en extension.$wr$,
    $wr$Tire le palonnier vers la hanche arrière pour enrouler le demi-tour.$wr$,
    $wr$Garde le palonnier près du corps : si tu t'ouvres, tu poses à plat sur le dos.$wr$
  ]::text[],
  tips_en = array[
    $wr$You need a solid toeside railey: that's the real obstacle, not the half turn.$wr$,
    $wr$Throw a clean toeside railey first, then drop the front hand at full extension.$wr$,
    $wr$Pull the handle to your rear hip to wind the half turn.$wr$,
    $wr$Keep the handle close: flare out and you'll land flat on your back.$wr$
  ]::text[]
where slug = 'ts-krypt';

update figures set
  tips    = array[
    $wr$Départ de back roll toeside : coupe minimale, main arrière lâchée, tête droite en arrière au sommet.$wr$,
    $wr$Lance le demi-tour backside pendant le roll.$wr$,
    $wr$Amène le palonnier dans le dos et garde-le collé jusqu'au contact.$wr$,
    $wr$Cherche l'eau du regard côté dos, poitrine basse.$wr$
  ]::text[],
  tips_en = array[
    $wr$Toeside back roll entry: minimal edge, back hand off, head straight back at the top.$wr$,
    $wr$Start the backside half turn during the roll.$wr$,
    $wr$Bring the handle behind your back and keep it pinned until contact.$wr$,
    $wr$Find the water over your back, chest down.$wr$
  ]::text[]
where slug = 'ts-roll-to-blind';

update figures set
  tips    = array[
    $wr$Pars en extension comme sur un railey toeside, corps raide et bras verrouillés.$wr$,
    $wr$Envoie le palonnier au-dessus de la tête au lieu de le passer dans le dos.$wr$,
    $wr$Le geste doit être fluide et lancé tôt : c'est lui qui entraîne la rotation.$wr$,
    $wr$Cherche l'eau du regard avant de finir la rotation, puis ramène les pieds sous toi.$wr$
  ]::text[],
  tips_en = array[
    $wr$Leave in extension like a toeside railey, body stiff and arms locked.$wr$,
    $wr$Send the handle over your head instead of passing it behind your back.$wr$,
    $wr$The movement has to be smooth and thrown early: it's what drives the rotation.$wr$,
    $wr$Find the water before finishing the rotation, then bring your feet back under you.$wr$
  ]::text[]
where slug = 'ts-s-bend';

update figures set
  tips    = array[
    $wr$Il te faut un ts s-bend propre avant d'ajouter le demi-tour.$wr$,
    $wr$Ajoute le backside en toute fin de figure, une fois l'olé terminé.$wr$,
    $wr$Garde le palonnier au creux du dos pour la pose blind.$wr$,
    $wr$Cherche l'eau du regard côté dos, genoux fléchis à la réception.$wr$
  ]::text[],
  tips_en = array[
    $wr$You need a clean toeside S-bend before adding the half turn.$wr$,
    $wr$Add the backside right at the end, once the ole is finished.$wr$,
    $wr$Keep the handle in the small of your back for the blind landing.$wr$,
    $wr$Find the water over your back, knees bent on landing.$wr$
  ]::text[]
where slug = 'ts-s-bend-to-blind';

update figures set
  tips    = array[
    $wr$Il te faut un tweetie propre avant d'ajouter le demi-tour.$wr$,
    $wr$Le demi-tour backside s'ajoute en fin de rotation, après l'olé.$wr$,
    $wr$Pars sur la carre orteils comme un bell air et garde les épaules alignées sur la planche.$wr$,
    $wr$Amène le palonnier au creux du dos pour la pose blind.$wr$
  ]::text[],
  tips_en = array[
    $wr$You need a clean tweetie before adding the half turn.$wr$,
    $wr$The backside half turn is added at the end, after the ole.$wr$,
    $wr$Take off on the toeside edge like a bell air and keep your shoulders in line with the board.$wr$,
    $wr$Bring the handle to the small of your back for the blind landing.$wr$
  ]::text[]
where slug = 'tweetie-5';

update figures set
  tips    = array[
    $wr$Pars sur la carre toeside comme un bell air, poids sur le pied avant.$wr$,
    $wr$Enchaîne sur la rotation du whirly bird, palonnier envoyé au-dessus de la tête.$wr$,
    $wr$Le passage de palonnier vient après la phase de backflip, pas pendant.$wr$,
    $wr$Il te faut beaucoup de hauteur : sans elle, l'enchaînement ne rentre pas.$wr$
  ]::text[],
  tips_en = array[
    $wr$Take off on the toeside edge like a bell air, weight on the front foot.$wr$,
    $wr$Go straight into the whirly bird rotation, handle punched over your head.$wr$,
    $wr$The handle pass comes after the backflip phase, not during.$wr$,
    $wr$You need plenty of height: without it the sequence doesn't fit.$wr$
  ]::text[]
where slug = 'tweetie-dick';

update figures set
  tips    = array[
    $wr$Aborde du côté opposé du câble par rapport au kicker, sur une coupe moyenne et progressive, en gardant de la vitesse.$wr$,
    $wr$Aplatis juste avant le kicker pour alléger la tension, et passe le palonnier tôt, wrapped dans le dos.$wr$,
    $wr$Monte le kicker bien groupé, puis grandis-toi au sommet pour un pop vertical.$wr$,
    $wr$À la sortie, déroule le toeside backside 180 en lançant la tête vers le bas et l'arrière pour amorcer le flip.$wr$,
    $wr$Vers 90°, regarde sous l'aisselle comme sur un mexican roll pour faire tourner la planche. Spotte la réception et fléchis les genoux à l'impact.$wr$,
    $wr$Pour débuter, pré-tourne le 180 jusqu'à 90° sur le kicker puis enchaîne le mexican roll, en réduisant le pré-tour au fur et à mesure.$wr$
  ]::text[],
  tips_en = array[
    $wr$Approach on the opposite side of the cable from the kicker, on a progressive medium edge carrying plenty of speed.$wr$,
    $wr$Flatten off just before the kicker to lighten the tension, and pass the handle early, wrapped behind your back.$wr$,
    $wr$Ride up the kicker low and tucked, then stand tall at the top for a straight-up pop.$wr$,
    $wr$Off the top, unwind the toeside backside 180 while throwing your head down and behind you to initiate the flip.$wr$,
    $wr$Around 90°, look under your armpit like a mexican roll to flip the board over. Spot the landing and bend your knees on impact.$wr$,
    $wr$To learn it, pre-spin the 180 to 90° up the kicker then scrape into the mexican roll, backing off the pre-spin gradually.$wr$
  ]::text[]
where slug = 'underflip';

update figures set
  tips    = array[
    $wr$Aborde du côté opposé du câble par rapport au kicker, sur une coupe moyenne et progressive, en gardant de la vitesse.$wr$,
    $wr$Aplatis juste avant le kicker pour alléger la tension, et passe le palonnier tôt, wrapped dans le dos.$wr$,
    $wr$Monte le kicker bien groupé, puis grandis-toi au sommet pour un pop vertical.$wr$,
    $wr$À la sortie, déroule le toeside backside 180 en lançant la tête vers le bas et l'arrière pour amorcer le flip.$wr$,
    $wr$Vers 90°, regarde sous l'aisselle comme sur un mexican roll pour faire tourner la planche. Spotte la réception et fléchis les genoux à l'impact.$wr$,
    $wr$Ne démarre le rewind qu'une fois la rotation complètement terminée.$wr$
  ]::text[],
  tips_en = array[
    $wr$Approach on the opposite side of the cable from the kicker, on a progressive medium edge carrying plenty of speed.$wr$,
    $wr$Flatten off just before the kicker to lighten the tension, and pass the handle early, wrapped behind your back.$wr$,
    $wr$Ride up the kicker low and tucked, then stand tall at the top for a straight-up pop.$wr$,
    $wr$Off the top, unwind the toeside backside 180 while throwing your head down and behind you to initiate the flip.$wr$,
    $wr$Around 90°, look under your armpit like a mexican roll to flip the board over. Spot the landing and bend your knees on impact.$wr$,
    $wr$Only initiate the rewind once the full rotation is complete.$wr$
  ]::text[]
where slug = 'underflip-rewind';

update figures set
  tips    = array[
    $wr$Il te faut un whirly bird propre et constant avant d'ajouter le demi-tour.$wr$,
    $wr$Le demi-tour backside s'ajoute en fin de rotation, une fois le palonnier ramené devant toi.$wr$,
    $wr$Ne précipite pas le geste de l'olé pour gagner du temps, tu perdrais la rotation.$wr$,
    $wr$Amène le palonnier au creux du dos pour la pose blind, poitrine basse.$wr$
  ]::text[],
  tips_en = array[
    $wr$You need a clean, consistent whirly bird before adding the half turn.$wr$,
    $wr$The backside half turn is added at the end, once the handle is back in front of you.$wr$,
    $wr$Don't rush the ole to save time, you'd lose the rotation.$wr$,
    $wr$Bring the handle to the small of your back for the blind landing, chest down.$wr$
  ]::text[]
where slug = 'whirly-5';

update figures set
  tips    = array[
    $wr$Deux rotations olé enchaînées : il te faut un whirly bird très haut pour avoir le temps.$wr$,
    $wr$Le palonnier repasse au-dessus de la tête une seconde fois sans jamais aller dans le dos.$wr$,
    $wr$Garde le geste identique sur les deux tours : c'est la régularité qui fait passer la figure.$wr$,
    $wr$Cherche l'eau du regard au dernier demi-tour.$wr$
  ]::text[],
  tips_en = array[
    $wr$Two ole rotations chained: you need a very high whirly bird to have the time.$wr$,
    $wr$The handle goes over your head a second time, never behind your back.$wr$,
    $wr$Keep the same movement on both rotations: consistency is what gets it round.$wr$,
    $wr$Find the water on the last half turn.$wr$
  ]::text[]
where slug = 'whirly-7';

update figures set
  tips    = array[
    $wr$Il te faut un whirly bird constant avant d'ajouter le passage de palonnier.$wr$,
    $wr$Envoie d'abord le palonnier en travers du visage comme sur le whirly, puis passe-le dans le dos.$wr$,
    $wr$L'enchaînement olé puis passage est le point difficile : ne précipite pas le second.$wr$,
    $wr$Cherche l'eau du regard en fin de rotation et pose genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$You need a consistent whirly bird before adding the handle pass.$wr$,
    $wr$Punch the handle across your face like the whirly first, then pass it behind your back.$wr$,
    $wr$The ole-into-pass sequence is the hard part: don't rush the second half.$wr$,
    $wr$Find the water at the end of the rotation and land knees bent.$wr$
  ]::text[]
where slug = 'whirly-dick';

update figures set
  tips    = array[
    $wr$Il te faut un varial kickflip constant et un 360 shuvit propre.$wr$,
    $wr$Il te faut beaucoup de hauteur : la planche doit vriller pendant qu'elle fait un tour complet.$wr$,
    $wr$Accompagne bien le coup de pied, sinon la vrille n'a pas la place de se faire.$wr$,
    $wr$Regarde le grip revenir avant de ramener les pieds.$wr$
  ]::text[],
  tips_en = array[
    $wr$You need a consistent varial kickflip and a clean 360 shuvit.$wr$,
    $wr$You need plenty of height: the board has to flip while doing a full rotation.$wr$,
    $wr$Follow through on the flick, or the flip won't have room to happen.$wr$,
    $wr$Watch for the grip tape before bringing your feet down.$wr$
  ]::text[]
where slug = 'ws-360-kickflip';

update figures set
  tips    = array[
    $wr$Il te faut un 360 shuvit et un body varial solides séparément avant de les combiner.$wr$,
    $wr$Les deux rotations partent dans le même sens : lance-les ensemble, pas l'une après l'autre.$wr$,
    $wr$Le corps ne fait qu'un demi-tour pendant que la planche en fait un complet : laisse-la tourner sous toi.$wr$,
    $wr$Repose-toi centré sur la planche, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$You need a solid 360 shuvit and body varial separately before combining them.$wr$,
    $wr$Both rotations go the same way: launch them together, not one after the other.$wr$,
    $wr$Your body does a half turn while the board does a full one: let it spin under you.$wr$,
    $wr$Land centred on the board, knees bent.$wr$
  ]::text[]
where slug = 'ws-big-spin';

update figures set
  tips    = array[
    $wr$Il te faut un big spin et un kickflip constants avant de les combiner.$wr$,
    $wr$Il te faut de la hauteur : la planche doit vriller et faire son tour pendant que tu tournes.$wr$,
    $wr$Lance les deux ensemble et accompagne bien le coup de pied.$wr$,
    $wr$Regarde le grip revenir avant de ramener les pieds, pose centré.$wr$
  ]::text[],
  tips_en = array[
    $wr$You need a consistent big spin and kickflip before combining them.$wr$,
    $wr$You need height: the board has to flip and spin while you rotate.$wr$,
    $wr$Launch both together and follow through on the flick.$wr$,
    $wr$Watch for the grip tape before bringing your feet down, land centred.$wr$
  ]::text[]
where slug = 'ws-bigflip';

update figures set
  tips    = array[
    $wr$Il te faut un big spin constant et un 540 shuvit propre avant d'y aller.$wr$,
    $wr$Il te faut plus de hauteur : la planche a un demi-tour de plus à faire sous toi.$wr$,
    $wr$Garde le demi-tour du corps identique au big spin, c'est la planche qui tourne davantage.$wr$,
    $wr$Regarde la planche pour la rattraper et pose centré.$wr$
  ]::text[],
  tips_en = array[
    $wr$You need a consistent big spin and a clean 540 shuvit first.$wr$,
    $wr$You need more height: the board has an extra half rotation to do under you.$wr$,
    $wr$Keep the body's half turn identical to the big spin, it's the board that spins more.$wr$,
    $wr$Watch the board to catch it and land centred.$wr$
  ]::text[]
where slug = 'ws-bigger-spin';

update figures set
  tips    = array[
    $wr$Il te faut un kickflip propre et un backside 180 avant de combiner.$wr$,
    $wr$Le flip de la planche et ta rotation partent en même temps, pas l'un puis l'autre.$wr$,
    $wr$Garde le regard sur la planche malgré la rotation du corps.$wr$,
    $wr$Pose en switch, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$You need a clean kickflip and a backside 180 before combining them.$wr$,
    $wr$The board flip and your rotation start together, not one then the other.$wr$,
    $wr$Keep your eyes on the board despite the body rotation.$wr$,
    $wr$Land switch, knees bent.$wr$
  ]::text[]
where slug = 'ws-bs-kickflip';

update figures set
  tips    = array[
    $wr$Il te faut un ollie propre : la main remplace le pied, mais le pop reste le même.$wr$,
    $wr$Attrape la planche et lance la vrille avec la main au lieu du coup de pied.$wr$,
    $wr$Lâche assez tôt pour laisser la planche finir sa vrille toute seule.$wr$,
    $wr$Regarde-la revenir et rattrape-la pieds écartés, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$You need a clean ollie: the hand replaces the foot, but the pop stays the same.$wr$,
    $wr$Grab the board and start the flip with your hand instead of a flick.$wr$,
    $wr$Let go early enough for the board to finish the flip on its own.$wr$,
    $wr$Watch it come round and catch it feet wide, knees bent.$wr$
  ]::text[]
where slug = 'ws-fingerflip';

update figures set
  tips    = array[
    $wr$Il te faut un kickflip et un frontside 180 solides séparément.$wr$,
    $wr$Le flip et la rotation se lancent ensemble : c'est la simultanéité qui fait la figure.$wr$,
    $wr$Ne te précipite pas sur la rotation du corps, laisse d'abord le nose monter.$wr$,
    $wr$Pose en switch, centré sur la planche.$wr$
  ]::text[],
  tips_en = array[
    $wr$You need a solid kickflip and frontside 180 separately.$wr$,
    $wr$The flip and rotation launch together: the simultaneity is what makes the trick.$wr$,
    $wr$Don't rush the body rotation, let the nose come up first.$wr$,
    $wr$Land switch, centred on the board.$wr$
  ]::text[]
where slug = 'ws-fs-kickflip';

update figures set
  tips    = array[
    $wr$Il te faut un bigger spin constant : le tour complet du corps s'ajoute par-dessus.$wr$,
    $wr$Le corps fait un tour entier pendant que la planche fait un tour et demi, dans le même sens.$wr$,
    $wr$Lance le regard en premier et laisse le corps suivre, sinon tu perds la planche de vue.$wr$,
    $wr$Il te faut le maximum de hauteur : c'est le temps d'air qui décide.$wr$
  ]::text[],
  tips_en = array[
    $wr$You need a consistent bigger spin: the full body rotation goes on top of it.$wr$,
    $wr$The body does a full rotation while the board does one and a half, the same way.$wr$,
    $wr$Lead with your eyes and let the body follow, or you'll lose sight of the board.$wr$,
    $wr$You need maximum height: air time is what decides.$wr$
  ]::text[]
where slug = 'ws-gazelle';

update figures set
  tips    = array[
    $wr$Il te faut un kickflip propre et un body varial frontside.$wr$,
    $wr$La planche vrille pendant que ton corps tourne, mais la planche ne pivote pas : elle reste dans l'axe.$wr$,
    $wr$Lance la vrille d'abord, puis laisse le corps tourner par-dessus.$wr$,
    $wr$Pose en switch, pieds écartés et genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$You need a clean kickflip and a frontside body varial.$wr$,
    $wr$The board flips while your body turns, but the board doesn't pivot: it stays on axis.$wr$,
    $wr$Start the flip first, then let the body turn over it.$wr$,
    $wr$Land switch, feet wide and knees bent.$wr$
  ]::text[]
where slug = 'ws-sexchange';

update figures set
  tips    = array[
    $wr$Il te faut un kickflip et un backside shuvit propres séparément.$wr$,
    $wr$Les deux mouvements partent en même temps : le coup de pied qui fait vriller et le scoop du tail.$wr$,
    $wr$Laisse le nose monter avant de lancer la vrille, comme sur un kickflip normal.$wr$,
    $wr$Repose-toi centré sur la planche, pieds écartés, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$You need a clean kickflip and backside shuvit separately.$wr$,
    $wr$Both movements start together: the flick that flips it and the scoop off the tail.$wr$,
    $wr$Let the nose come up before flicking, exactly like a normal kickflip.$wr$,
    $wr$Land centred on the board, feet wide, knees bent.$wr$
  ]::text[]
where slug = 'ws-varial-kickflip';

-- contrôle : plus aucun terme proscrit, 3 à 5 conseils par figure
select slug,
       array_length(tips, 1)    as n_fr,
       array_length(tips_en, 1) as n_en,
       array_to_string(tips, ' ') ~* '\mwake\M|vague|charg|\mhandle\M|poignée|figure d''élite|maîtrisé|conditions parfaites|hauteur maximale' as vocab_ko
from figures
where slug in ('118', '118-900', '313-rewind', '315', '317', 'back-mobe-5', 'back-mobe-7', 'bell-air-moby-dick', 'bell-air-to-blind', 'bell-air-to-fakie', 'ben-air', 'ben-air-tootsie', 'ben-air-tootsie-rewind', 'big-mac', 'blind-jury', 'blind-pete', 'blind-pete-rose', 'bs-313', 'bs-313-rewind', 'bs-315', 'butter-fuko', 'crow-mobe-5', 'crow-mobe-7', 'double-backroll-to-revert', 'double-half-cab-roll', 'double-s-bend', 'double-s-bend-to-blind', 'dum-dum', 'dum-dum-5', 'egg-mobe', 'egg-roll', 'fat-chance', 'front-blind-mobe', 'front-flip-to-blind', 'hassle-hoff', 'heart-attack', 'heart-attack-5', 'hinterberger', 'hinterberger-5', 'hinterberger-to-blind', 'hs-bs-1080', 'hs-bs-1260', 'hs-bs-1440', 'hs-bs-180', 'hs-bs-900', 'hs-fs-1080', 'hs-fs-1260', 'hs-fs-1440', 'hs-fs-900', 'kgb-5', 'mexican-roll', 'moby-dick-5', 'moby-dick-7', 'ohh', 'ole', 'ollie-360', 'ollie-bs-360', 'pete-rose-5', 'pete-rose-7', 'rubber-chicken', 's-mobe', 's-mobe-5', 's-mobe-rewind', 'seated-bs-540', 'seated-fakie-bs-540', 'seated-fs-180', 'skeletor', 'skud', 'slim-chance', 'slim-chance-5', 'squeezer', 'squeezer-5', 'tantrum-to-fakie', 'ts-313', 'ts-315', 'ts-blind-judge', 'ts-bs-1080', 'ts-bs-1260', 'ts-bs-1440', 'ts-bs-313', 'ts-bs-720', 'ts-fs-1080', 'ts-fs-1260', 'ts-fs-1440', 'ts-half-cab-roll', 'ts-krypt', 'ts-roll-to-blind', 'ts-s-bend', 'ts-s-bend-to-blind', 'tweetie-5', 'tweetie-dick', 'underflip', 'underflip-rewind', 'whirly-5', 'whirly-7', 'whirly-dick', 'ws-360-kickflip', 'ws-big-spin', 'ws-bigflip', 'ws-bigger-spin', 'ws-bs-kickflip', 'ws-fingerflip', 'ws-fs-kickflip', 'ws-gazelle', 'ws-sexchange', 'ws-varial-kickflip')
order by vocab_ko desc nulls last, slug;

commit;  -- ou rollback;
