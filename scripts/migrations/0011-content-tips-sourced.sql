-- WakeRef — conseils réécrits à partir des how-to vidéo (lot « figures sourcées »)
-- Généré le 2026-09-04. À relire, puis appliquer dans l'éditeur SQL Supabase.
--
-- Périmètre : 57 figures qui disposent d'un tutoriel vidéo. Chaque bloc de conseils
-- est le résumé du ou des how-to attachés à la figure — rien n'est extrapolé ici.
-- Seuls `tips` et `tips_en` sont touchés ; les descriptions ne bougent pas.
--
-- Conventions retenues : tutoiement, phrases courtes, un conseil = un geste.
-- Lexique FR : palonnier, coupe (légère / moyenne / forte / progressive, ou en
-- secondes), pop, kicker, switch, blind, wrapped. Lexique EN : handle, edge, cut.
-- Les figures à double contexte portent « en blocage, … » / « sur kicker, … »
-- directement dans la phrase.
--
-- Non touchées volontairement : underflip et mexican-roll (déjà écrites à la main),
-- indy et ws-big-spin (transcript sans contenu technique exploitable).

begin;

do $guard$
declare missing text;
begin
  select string_agg(s, ', ') into missing
  from unnest(array[
    '313',
    '911',
    'back-board',
    'back-lip',
    'back-mobe',
    'back-roll',
    'bell-air',
    'blind',
    'blind-judge',
    'crow-mobe',
    'elephant',
    'front-flip',
    'front-flip-to-fakie',
    'front-roll',
    'half-cab-roll',
    'hs-bs-360',
    'hs-bs-540',
    'hs-bs-720',
    'hs-fs-180',
    'hs-fs-360',
    'hs-fs-540',
    'hs-fs-720',
    'kgb',
    'krypt',
    'method',
    'moby-dick',
    'ollie',
    'pete-rose',
    'railey',
    'rewind',
    'roll-to-blind',
    'roll-to-revert',
    's-bend',
    's-bend-to-blind',
    'scarecrow',
    'stalefish',
    'tail-grab',
    'tantrum',
    'tantrum-to-blind',
    'tootsie',
    'transfer',
    'ts-back-roll',
    'ts-bs-180',
    'ts-bs-360',
    'ts-bs-540',
    'ts-fs-180',
    'ts-fs-360',
    'ts-fs-540',
    'ts-fs-720',
    'ts-railey',
    'ts-roll-to-revert',
    'tweetie',
    'vulcan',
    'whirly-bird',
    'ws-360-shuvit',
    'ws-kickflip',
    'ws-pop-shuvit'
  ]) as s
  where not exists (select 1 from figures f where f.slug = s);
  if missing is not null then
    raise exception 'slugs introuvables dans figures : %', missing;
  end if;
end
$guard$;

update figures set
  tips    = array[
    $wr$Coupe progressive : commence doux et monte jusqu'à une coupe forte vers la troisième seconde.$wr$,
    $wr$Un déclenchement fort est la clé : c'est lui qui te donne le mou nécessaire au passage de palonnier.$wr$,
    $wr$Appuie légèrement sur le pied avant pour rester dans l'axe. Appuyer sur le pied arrière pour tourner plus vite est contre-productif.$wr$,
    $wr$Fais d'abord un railey droit, puis tire le palonnier vers la hanche arrière pour lancer le 360.$wr$,
    $wr$Attrape, tourne la tête pour chercher l'eau du regard, et pose.$wr$
  ]::text[],
  tips_en = array[
    $wr$Progressive cut: start reasonably gentle and build to a hard edge by about the three-second mark.$wr$,
    $wr$A strong release is the key: it's what gives you the slack you need for the handle pass.$wr$,
    $wr$Put a little weight on the front foot to stay on axis. Putting weight on the back foot to spin faster is counterproductive.$wr$,
    $wr$Throw a straight railey first, then pull the handle down to your back hip to start the 360.$wr$,
    $wr$Grab it, turn your head to spot the landing, and ride away.$wr$
  ]::text[]
where slug = '313';

update figures set
  tips    = array[
    $wr$Tu dois d'abord faire un bon railey avec les mains près des hanches. C'est ce contrôle qui rend le shifty possible.$wr$,
    $wr$Coupe progressive sur les talons, en déclenchant un peu plus avec le pied arrière que sur un railey normal.$wr$,
    $wr$Après le déclenchement, garde le palonnier près des hanches et pousse-le vers le bas.$wr$,
    $wr$Tourne le corps de 90° backside en gardant cette position basse.$wr$,
    $wr$Fléchis les genoux pour amener la planche vers tes mains, pas l'inverse. C'est valable pour tous les grabs en railey.$wr$,
    $wr$Pour le method, lâche la main avant et attrape entre les fixations côté talons, puis relâche avant de redescendre la planche.$wr$
  ]::text[],
  tips_en = array[
    $wr$You need a solid railey with your hands close to your hips first. That control is what makes the shifty possible.$wr$,
    $wr$Progressive heelside edge, releasing a bit more off the rear foot than on a normal railey.$wr$,
    $wr$After the release, keep the handle close to your hips and push it down.$wr$,
    $wr$Twist your body 90° backside while holding that low position.$wr$,
    $wr$Bend your knees to bring the board up to your hands, not the other way round. That goes for every railey grab.$wr$,
    $wr$For the method, drop the front hand and grab between the bindings on the heelside edge, then release before bringing the board back down.$wr$
  ]::text[]
where slug = '911';

update figures set
  tips    = array[
    $wr$Approche sur les talons, dos au module, et c'est le pied avant qui monte sur le rail.$wr$,
    $wr$Palonnier dans la main avant seulement. La main arrière sert à équilibrer.$wr$,
    $wr$Trouve la bonne distance : trop près le nose accroche le côté du rail, trop loin tu ne montes pas complètement dessus.$wr$,
    $wr$Coupe légère sur les talons, genoux fléchis, reste bas.$wr$,
    $wr$Palonnier près de toi et poitrine basse pendant tout le slide, c'est ce qui tient l'équilibre.$wr$,
    $wr$Pour sortir, ramène le palonnier devant la hanche avant pour te remettre droit, puis absorbe avec les genoux.$wr$
  ]::text[],
  tips_en = array[
    $wr$Approach on your heels with your back to the feature, and it's the front foot that comes up onto the rail.$wr$,
    $wr$Handle in your front hand only. The rear hand is there for balance.$wr$,
    $wr$Find the right distance: too close and the nose clips the side of the rail, too far and you won't get fully on.$wr$,
    $wr$Gentle heelside edge, knees bent, stay low.$wr$,
    $wr$Handle close and chest down through the whole slide — that's what holds your balance.$wr$,
    $wr$To exit, bring the handle back in front of your leading hip to straighten up, then absorb with your knees.$wr$
  ]::text[]
where slug = 'back-board';

update figures set
  tips    = array[
    $wr$Garde le palonnier devant toi à l'approche, puis tire-le légèrement vers la hanche arrière pour amorcer.$wr$,
    $wr$Une fois dos au module, poitrine basse et genoux fléchis : c'est la position qui tient le slide.$wr$,
    $wr$Ne tire pas plus que nécessaire, sinon tu te fais emmener hors du rail.$wr$,
    $wr$Pour poser, ramène le palonnier droit devant toi, poitrine basse, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$Keep the handle in front of you on the approach, then pull it slightly to your back hip to start it.$wr$,
    $wr$Once your back is to the feature, chest down and knees bent: that's the position that holds the slide.$wr$,
    $wr$Don't pull more than you need to, or you'll get taken off the rail.$wr$,
    $wr$To land, bring the handle straight back in front of you, chest down, knees bent.$wr$
  ]::text[]
where slug = 'back-lip';

update figures set
  tips    = array[
    $wr$Coupe lente à moyenne. Comme tu poses wrapped, une coupe forte te donne trop de tension et rend la pose impossible.$wr$,
    $wr$Aplatis et monte droit le plus longtemps possible pour éviter de pré-tourner.$wr$,
    $wr$Le départ est exactement celui d'un half cab roll ou d'un roll to revert.$wr$,
    $wr$Aux trois quarts de la rotation, cherche l'eau du regard et continue de tirer la main avant vers le bas du dos pour finir le 360 wrapped.$wr$,
    $wr$À la réception, genoux fléchis, poitrine au-dessus des orteils et tête tournée dans la nouvelle direction.$wr$
  ]::text[],
  tips_en = array[
    $wr$Slow to medium edge. Since you're landing wrapped, a hard edge gives you too much tension to hold that position.$wr$,
    $wr$Flatten off and ride straight as long as you can to avoid pre-spinning.$wr$,
    $wr$The entry is exactly a half cab roll or a roll to revert.$wr$,
    $wr$Three quarters through, spot the water and keep pulling the front hand to your lower back to finish the 360 wrapped.$wr$,
    $wr$On landing, knees bent, chest over your toes and head turned into the new direction.$wr$
  ]::text[]
where slug = 'back-mobe';

update figures set
  tips    = array[
    $wr$Bras serrés, palonnier collé à la hanche avant. Dès que les bras s'écartent, tu perds la tension et la rotation ne passe pas.$wr$,
    $wr$En blocage, coupe de 2 secondes, un peu moins forte que sur un railey.$wr$,
    $wr$En blocage, envoie fort le talon dans l'eau puis vers le haut pour faire passer la planche.$wr$,
    $wr$Sur kicker, coupe moyenne, puis aplatis juste avant le kicker en lâchant la main arrière.$wr$,
    $wr$Sur kicker, attends le sommet pour déclencher, tête lancée en avant sous l'aisselle.$wr$,
    $wr$Une fois la rotation bien engagée, cherche l'eau du regard pour commencer à la stopper. Genoux fléchis à l'impact.$wr$
  ]::text[],
  tips_en = array[
    $wr$Arms in tight, handle glued to your front hip. The moment your arms come out you lose the tension and the rotation stalls.$wr$,
    $wr$Off the water, a 2-second cut, slightly less hard than for a railey.$wr$,
    $wr$Off the water, drive your front heel down into the water then up to send the board over.$wr$,
    $wr$Off a kicker, medium edge, then flatten off right before the kicker and drop your rear hand.$wr$,
    $wr$Off a kicker, wait for the top before you throw it, head forward and under your front armpit.$wr$,
    $wr$Once the rotation is well underway, find the water to start slowing it down. Bend your knees on impact.$wr$
  ]::text[]
where slug = 'back-roll';

update figures set
  tips    = array[
    $wr$Sors du virage avec de la vitesse sur les talons et attends trois à quatre secondes avant d'envoyer. Bras avant tendu.$wr$,
    $wr$Transfère très vite le poids des talons vers les orteils : c'est ce transfert qui fait basculer.$wr$,
    $wr$N'essaie pas de ollier en jetant la tête en arrière. Ouvre la poitrine, tout le poids sur le pied avant.$wr$,
    $wr$Pense à taper dans un ballon avec le pied avant : tout part vers le haut, pas vers l'arrière. C'est ça qui te donne le temps de boucler.$wr$,
    $wr$Ne laisse pas les épaules partir dans la rotation : elles restent alignées sur la planche. Sinon tu pars en 90 frontside et tu finis sur les fesses.$wr$,
    $wr$Même un peu court, si les épaules n'ont pas tourné, ça passe quand même.$wr$
  ]::text[],
  tips_en = array[
    $wr$Come out of the corner carrying speed on your heels and wait three or four seconds before throwing it. Front arm extended.$wr$,
    $wr$Transfer your weight from heels to toes fast: that transfer is what flips you over.$wr$,
    $wr$Don't try to ollie and throw your head back. Open your chest and get all your weight onto the front foot.$wr$,
    $wr$Think of chipping a football with your front foot: everything goes up, not backwards. That's what buys you time to come round.$wr$,
    $wr$Keep your shoulders completely square through the rotation. Otherwise you turn frontside 90 and slip out on your bum.$wr$,
    $wr$Even coming up a bit short, square shoulders will usually bring it round.$wr$
  ]::text[]
where slug = 'bell-air';

update figures set
  tips    = array[
    $wr$Commence petit : un 180 backside à la surface ou en ollie.$wr$,
    $wr$Tire le palonnier vers la hanche avant et regarde par-dessus l'épaule arrière.$wr$,
    $wr$Regarde le tail de ta planche, palonnier dans le dos, genoux fléchis et poitrine au-dessus des orteils.$wr$,
    $wr$Passe le palonnier une fois posé et repars.$wr$,
    $wr$Le geste ne change pas quand tu passes sur module ou kicker, seul le timing change : plus c'est haut, plus tu attends avant de tirer en blind.$wr$
  ]::text[],
  tips_en = array[
    $wr$Start small: a surface or ollie backside 180.$wr$,
    $wr$Pull the handle to your front hip and look around your back shoulder.$wr$,
    $wr$Look at the tail of your board, handle behind your back, knees bent and chest over your toes.$wr$,
    $wr$Pass the handle once you've landed and ride away.$wr$,
    $wr$The movement doesn't change on features or kickers, only the timing does: the higher it is, the longer you wait before pulling to blind.$wr$
  ]::text[]
where slug = 'blind';

update figures set
  tips    = array[
    $wr$Départ de railey : passe sous le câble, aplatis, puis coupe progressive.$wr$,
    $wr$Au sommet du railey, au lieu de tirer vers la hanche avant, tire le palonnier vers toi.$wr$,
    $wr$Au dernier moment, lâche la main arrière et regarde derrière toi. Ce regard est le point critique de la figure.$wr$,
    $wr$Garde la poitrine et les épaules basses pour poser blind.$wr$,
    $wr$Quand tu le tiens des deux côtés, essaie-le en switch : c'est le même geste.$wr$
  ]::text[],
  tips_en = array[
    $wr$Railey entry: get under the cable, flatten off, then a progressive edge.$wr$,
    $wr$At the peak of the railey, instead of pulling to your front hip, pull the handle in towards you.$wr$,
    $wr$At the last moment, drop your back hand and look behind you. That look is the critical part of the trick.$wr$,
    $wr$Keep your chest and shoulders down to land blind.$wr$,
    $wr$Once you have it both ways, try it switch: it's the same movement.$wr$
  ]::text[]
where slug = 'blind-judge';

update figures set
  tips    = array[
    $wr$En blocage, coupe toeside progressive avec le coude verrouillé sur la hanche avant.$wr$,
    $wr$En blocage, au maximum de tension, envoie fort les pointes de pied en l'air comme sur un ts railey, puis envoie tête et épaules pour lancer la rotation.$wr$,
    $wr$En blocage, garde la poitrine haute au déclenchement. Si tu la baisses, tu ne sors pas de l'eau.$wr$,
    $wr$Sur kicker, coupe moyenne, aplatis au dernier moment et garde la planche droite pour ne pas pré-tourner.$wr$,
    $wr$Sur kicker, le décollage est celui d'un scarecrow : pousse en rotation de front roll et tire progressivement le palonnier vers la hanche arrière.$wr$,
    $wr$À partir du moment où tu vois l'eau, c'est un front to blind : tire le palonnier en blind avec le bras avant et verrouille-le.$wr$
  ]::text[],
  tips_en = array[
    $wr$Off the water, progressive toeside cut with your elbow locked onto your front hip.$wr$,
    $wr$Off the water, at maximum tension drive your toes up into the air like a toeside railey, then throw head and shoulders to start the rotation.$wr$,
    $wr$Off the water, keep your chest up on the release. Drop it and you won't get out of the water.$wr$,
    $wr$Off a kicker, medium edge, flatten off at the last second and keep the board straight so you don't pre-spin.$wr$,
    $wr$Off a kicker, the takeoff is a scarecrow: push into the front roll rotation and pull the handle progressively to your rear hip.$wr$,
    $wr$From the moment you see the water it's a front to blind: pull the handle into blind with the front arm and lock it in.$wr$
  ]::text[]
where slug = 'crow-mobe';

update figures set
  tips    = array[
    $wr$Coupe moyenne à forte : couper un peu plus fort que sur un scarecrow t'aide à garder la tension tout du long.$wr$,
    $wr$Approche identique au scarecrow. Aplatis, genoux bien fléchis, et pousse au sommet.$wr$,
    $wr$Lance la rotation de front roll en regardant par-dessus l'épaule avant pour amorcer le 180.$wr$,
    $wr$Aux trois quarts du 180, tu vois l'eau : c'est le moment de lâcher la main arrière.$wr$,
    $wr$Ramène la main avant du côté avant du corps et sers-toi de la tension pour remettre la planche en position de front roll.$wr$,
    $wr$Continue de regarder l'eau jusqu'au contact, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$Medium to hard edge: edging a bit harder than on a scarecrow helps you hold tension throughout.$wr$,
    $wr$Same approach as a scarecrow. Flatten off, really bend your knees, and push at the top.$wr$,
    $wr$Throw the front roll rotation while looking over your front shoulder to start the 180.$wr$,
    $wr$Three quarters through the 180 you'll spot the water: that's when you drop your rear hand.$wr$,
    $wr$Bring the front hand back to the front side of your body and use the tension to pull the board back to the front roll landing position.$wr$,
    $wr$Keep watching the water until impact, knees bent.$wr$
  ]::text[]
where slug = 'elephant';

update figures set
  tips    = array[
    $wr$En blocage, coupe progressive comme sur un railey, mais tenue un peu plus longtemps.$wr$,
    $wr$Déclenche juste sous le câble ou légèrement au-delà : tu obtiens un pop vertical au lieu de partir en balancier.$wr$,
    $wr$Envoie le talon avant dans l'eau, court et fort, puis bascule sur le tail.$wr$,
    $wr$Pour lancer la rotation, colle l'oreille avant contre l'épaule avant. Ne regarde pas sous l'aisselle arrière, ça c'est un S-bend.$wr$,
    $wr$Coudes serrés et palonnier devant toi. Si les bras s'écartent, ça dérive en front bend.$wr$,
    $wr$Tu vois l'eau devant toi tout du long. Genoux fléchis et repars sur les talons.$wr$
  ]::text[],
  tips_en = array[
    $wr$Off the water, progressive edge like a railey, but held a little longer.$wr$,
    $wr$Scoop just under the cable or slightly past it: you get a straight-up, straight-down pop instead of swinging out.$wr$,
    $wr$Drive the front heel down into the water, short and hard, then rock off the tail.$wr$,
    $wr$To start the rotation, slam your front ear into your front shoulder. Don't look under your rear armpit — that's an S-bend.$wr$,
    $wr$Elbows in, handle right in front of you. Let the arms out and it drifts into a front bend.$wr$,
    $wr$You can see the water in front of you the whole way. Bend your knees and ride away on your heels.$wr$
  ]::text[]
where slug = 'front-flip';

update figures set
  tips    = array[
    $wr$Approche du côté opposé du câble par rapport au kicker, sur une coupe entre moyenne et forte.$wr$,
    $wr$Aplatis juste avant le kicker, à quelques centimètres, pour monter proprement.$wr$,
    $wr$Mets un peu de poids sur le pied arrière, puis appuie dessus près du sommet en regardant par-dessus l'épaule avant.$wr$,
    $wr$Une fois le flip lancé, lâche la main avant.$wr$,
    $wr$Tire le palonnier vers la hanche arrière pour enrouler le 180 frontside.$wr$,
    $wr$Aux trois quarts du flip, spotte devant toi, genoux fléchis et poitrine au-dessus des orteils.$wr$
  ]::text[],
  tips_en = array[
    $wr$Approach from the opposite side of the cable to the kicker, on a medium-to-hard edge.$wr$,
    $wr$Flatten off just before the kicker, a foot or so, so you ride up smoothly.$wr$,
    $wr$Put a little weight on the rear foot, then push off it near the top while looking up and over your front shoulder.$wr$,
    $wr$Once the flip is going, drop your front hand.$wr$,
    $wr$Pull the handle to your rear hip to wind the frontside 180.$wr$,
    $wr$Three quarters through the flip, spot the landing in front of you, knees bent and chest over your toes.$wr$
  ]::text[]
where slug = 'front-flip-to-fakie';

update figures set
  tips    = array[
    $wr$Sur kicker, coupe moyenne à forte, deux mains sur le palonnier, hanches poussées vers le palonnier et genoux fléchis.$wr$,
    $wr$Reste bas, aplatis juste avant le kicker, puis lâche la main arrière et lève-la en l'air.$wr$,
    $wr$Attends le tout dernier moment du kicker pour déclencher.$wr$,
    $wr$Pousse les pieds vers l'arrière, saute avec les jambes et sers-toi du bras arrière pour donner la puissance au flip.$wr$,
    $wr$Un flip engagé à 80 % ne passe pas. C'est tout ou rien.$wr$,
    $wr$En redescendant, cherche l'eau du regard par-dessus la jambe avant et absorbe avec les genoux.$wr$
  ]::text[],
  tips_en = array[
    $wr$Off a kicker, medium to hard cut, both hands on the handle, hips up towards the handle and knees bent.$wr$,
    $wr$Stay low, flatten off just before the kicker, then release your back hand and put it up in the air.$wr$,
    $wr$Wait until the very last part of the kicker to initiate the rotation.$wr$,
    $wr$Push your feet back, jump with the legs and use that back arm to power yourself into the flip.$wr$,
    $wr$An 80% flip won't cut it. It's all or nothing.$wr$,
    $wr$Coming down, spot the water over your front leg and absorb with your knees.$wr$
  ]::text[]
where slug = 'front-roll';

update figures set
  tips    = array[
    $wr$Coupe lente à moyenne selon la taille du kicker : gros kicker, tu n'as presque pas besoin de couper.$wr$,
    $wr$Monte à deux mains et lâche la main avant à mi-hauteur ou aux trois quarts du kicker.$wr$,
    $wr$Laisse le pied avant dériver dans le 180 frontside et pousse la hanche arrière vers l'avant : c'est ça qui amorce la rotation de back roll toeside.$wr$,
    $wr$Lâcher la main avant tôt facilite le pré-tour. Garde la planche droite le plus longtemps possible sur le kicker.$wr$,
    $wr$Une fois la hanche envoyée, regarde droit en arrière comme sur un ts back roll : main avant devant, main arrière derrière, épaules parallèles au câble.$wr$
  ]::text[],
  tips_en = array[
    $wr$Slow to medium edge depending on the size of the kicker: on a big one you barely need to edge at all.$wr$,
    $wr$Ride up with both hands and drop the front hand halfway to three quarters up the kicker.$wr$,
    $wr$Let the front foot drift into the frontside 180 and push your rear hip forward: that's what starts the toeside back roll rotation.$wr$,
    $wr$Dropping the front hand early makes it easy to pre-spin. Keep the board straight as long as you can up the kicker.$wr$,
    $wr$Once the hip is through, look straight back like a toeside back roll: front hand in front, rear hand behind, shoulders parallel to the cable.$wr$
  ]::text[]
where slug = 'half-cab-roll';

update figures set
  tips    = array[
    $wr$Coupe légère. Si tu coupes à deux mains, lâche la main arrière en arrivant sur le kicker.$wr$,
    $wr$Aplatis et monte le kicker bien à plat.$wr$,
    $wr$En montant, tire le palonnier vers la hanche puis vers le bas du dos, et lance la rotation en regardant par-dessus l'épaule arrière.$wr$,
    $wr$Passe le palonnier tôt : la main arrière vient le chercher dans le bas du dos.$wr$,
    $wr$Reste à plat et laisse-toi dérouler. Ramène le palonnier près de la hanche avant pour poser.$wr$
  ]::text[],
  tips_en = array[
    $wr$Gentle edge. If you edge with both hands, drop the rear one as you get onto the kicker.$wr$,
    $wr$Flatten off and ride up the kicker perfectly flat.$wr$,
    $wr$On the way up, pull the handle to your hip then to your lower back, and start the rotation by looking over your rear shoulder.$wr$,
    $wr$Pass the handle early: the rear hand reaches around to your lower back to take it.$wr$,
    $wr$Stay flat and let yourself unwind. Bring the handle close to your front hip to land.$wr$
  ]::text[]
where slug = 'hs-bs-360';

update figures set
  tips    = array[
    $wr$Le plus simple : un back 180 avec le palonnier passé tôt, puis un switch toeside frontside 360 dans la descente.$wr$,
    $wr$Même coupe que sur ton back 360, moyenne. Pas besoin de sauter énorme.$wr$,
    $wr$Passe le palonnier tôt, puis marque une pause. C'est la patience qui fait la figure, pas la vitesse.$wr$,
    $wr$Reprends de l'autre main et envoie les hanches pour boucler.$wr$,
    $wr$Réception blind : poitrine au-dessus des orteils, sinon tu pars sur les fesses.$wr$
  ]::text[],
  tips_en = array[
    $wr$The easiest way in: a backside 180 with an early handle pass, then a switch toeside frontside 360 on the way down.$wr$,
    $wr$Same edge as your backside 360, medium. You don't need to go huge.$wr$,
    $wr$Pass the handle early, then pause. This trick is about patience, not speed.$wr$,
    $wr$Grab back on with the other hand and whip your hips round to finish it.$wr$,
    $wr$Blind landing: chest over your toes, or you'll slip out on your butt.$wr$
  ]::text[]
where slug = 'hs-bs-540';

update figures set
  tips    = array[
    $wr$Coupe moyenne. Évite d'enchaîner des back 540 le même jour, tu resteras bloqué dessus.$wr$,
    $wr$Ne cherche pas à tourner vite. Pense « passage, passage » : deux passages de palonnier suffisent à faire la rotation.$wr$,
    $wr$Deux façons de le construire : un back 180 puis un toe 540, ou deux back 360 à la suite.$wr$,
    $wr$Garde les bras près du corps. Si tu les laisses s'écarter, tu dois tout retirer pour finir.$wr$,
    $wr$Engage-toi avant d'arriver au kicker, et attends le sommet pour déclencher plutôt que de pré-tourner.$wr$
  ]::text[],
  tips_en = array[
    $wr$Medium edge. Avoid doing backside 540s the same session or you'll stay stuck on them.$wr$,
    $wr$Don't try to spin fast. Think 'handle pass, handle pass': two passes are enough to get the rotation round.$wr$,
    $wr$Two ways to build it: a backside 180 then a toe 540, or two backside 360s back to back.$wr$,
    $wr$Keep your arms in. Let them come out and you have to rip everything back in to finish.$wr$,
    $wr$Commit before you reach the kicker, and wait for the top rather than pre-spinning.$wr$
  ]::text[]
where slug = 'hs-bs-720';

update figures set
  tips    = array[
    $wr$Coupe légère, juste assez pour t'éloigner du câble. Si le câble te ramène vers le centre, la figure devient dure.$wr$,
    $wr$Aplatis au dernier moment et monte le kicker bien à plat.$wr$,
    $wr$Palonnier à la hanche avant le plus longtemps possible : c'est ce qui t'empêche de pré-tourner sur le kicker.$wr$,
    $wr$Attends d'être en l'air pour amener le palonnier à la hanche arrière, c'est ça qui déclenche la rotation.$wr$,
    $wr$Lâche la main avant vers 90°, aligne les épaules, puis cherche l'eau du regard. Genoux fléchis, poids sur les orteils.$wr$
  ]::text[],
  tips_en = array[
    $wr$Mellow edge, just enough to travel away from the cable. If the cable pulls you back to the centre the trick gets harder.$wr$,
    $wr$Flatten off at the last second and ride up the kicker completely flat.$wr$,
    $wr$Handle at your front hip as long as possible: that's what stops you pre-spinning off the kicker.$wr$,
    $wr$Wait until you're in the air before pulling the handle across to your rear hip — that's what starts the rotation.$wr$,
    $wr$Drop your front hand around 90°, square your shoulders, then spot the water. Knees bent, weight over your toes.$wr$
  ]::text[]
where slug = 'hs-fs-180';

update figures set
  tips    = array[
    $wr$Coupe légère, deux mains sur le palonnier, et monte le kicker bien à plat.$wr$,
    $wr$Reste bas sur le kicker et pousse au sommet, comme sur un simple saut.$wr$,
    $wr$En haut du kicker, tire le palonnier à deux mains vers la hanche arrière, puis lâche la main avant en continuant vers le bas du dos.$wr$,
    $wr$Passe la main avant dans le dos de l'autre côté pour récupérer le palonnier.$wr$,
    $wr$C'est là que la plupart abandonnent : garde la main arrière le plus longtemps possible, tu as plus de temps que tu crois.$wr$
  ]::text[],
  tips_en = array[
    $wr$Gentle edge, both hands on the handle, and ride up the kicker completely flat.$wr$,
    $wr$Stay low on the kicker and push at the top, like a normal jump.$wr$,
    $wr$At the top of the kicker pull the handle to your rear hip with both hands, then let go with the front hand and keep pulling to your lower back.$wr$,
    $wr$Reach your front hand around your back from the other side to take the handle.$wr$,
    $wr$This is where most people give up: hang on with the rear hand as long as you can, you have far more time than you think.$wr$
  ]::text[]
where slug = 'hs-fs-360';

update figures set
  tips    = array[
    $wr$Même coupe que sur ton 360, un peu plus forte.$wr$,
    $wr$Aux trois quarts du kicker, fléchis puis pousse pour être au maximum au sommet : il te faut un pop bien vertical.$wr$,
    $wr$Tire le palonnier vers la hanche arrière plus fort que sur un 360, et continue de tirer après le passage pour le reprendre de l'autre main.$wr$,
    $wr$Vise le 540 dès le départ. Faire un 360 puis décider d'ajouter un 180 ne marche pas.$wr$,
    $wr$À la réception, poitrine au-dessus des orteils, sinon tu pars sur les fesses.$wr$
  ]::text[],
  tips_en = array[
    $wr$Same edge as your 360, just a little harder.$wr$,
    $wr$Three quarters of the way up the kicker, bend then push so you peak right at the top — you want a straight-up, straight-down pop.$wr$,
    $wr$Rip the handle to your rear hip harder than on a 360, and keep pulling after the pass so you can get it back in the other hand.$wr$,
    $wr$Commit to the 540 from the start. Doing a 360 and then deciding to add a 180 doesn't work.$wr$,
    $wr$On landing, chest over your toes, or you'll slip out on your butt.$wr$
  ]::text[]
where slug = 'hs-fs-540';

update figures set
  tips    = array[
    $wr$Coupe moyenne à un peu plus forte : il te faut de la tension pour tirer deux fois.$wr$,
    $wr$Aplatis au dernier moment, monte le kicker à plat, palonnier côté hanche avant pour ne pas pré-tourner.$wr$,
    $wr$Pense deux 360, pas un 540 plus un 180 : si tu t'ouvres après le 540, tu ne peux plus retirer.$wr$,
    $wr$Tire le palonnier vers la hanche arrière bien plus fort que sur ton 360, et enchaîne le deuxième passage sans marquer de pause.$wr$,
    $wr$Décide avant d'arriver au kicker. Si tu attends d'être en l'air pour voir si tu as le temps, c'est déjà trop tard.$wr$
  ]::text[],
  tips_en = array[
    $wr$Medium to slightly harder edge: you need the tension to pull twice.$wr$,
    $wr$Flatten off at the last second, ride up flat, handle on your front hip so you don't pre-spin.$wr$,
    $wr$Think two 360s, not a 540 plus a 180: if you open up after the 540 you can't pull again.$wr$,
    $wr$Rip the handle to your rear hip much harder than on your 360, and go straight into the second pass with no pause.$wr$,
    $wr$Commit before you reach the kicker. Waiting to see in the air whether you have time is already too late.$wr$
  ]::text[]
where slug = 'hs-fs-720';

update figures set
  tips    = array[
    $wr$Coupe moyenne mais longue : tu ne veux pas trop de tension, mais tu veux porter la vitesse jusqu'au kicker.$wr$,
    $wr$Au sommet, lance la rotation de back roll en tournant la tête et en tirant le palonnier vers la hanche arrière en même temps.$wr$,
    $wr$Passe le palonnier, puis continue la rotation sans marquer d'arrêt.$wr$,
    $wr$Commence à spotter la réception dès que tu redescends.$wr$,
    $wr$Ramène le palonnier en travers, vers la hanche avant, pour remettre le bon pied devant à la pose.$wr$
  ]::text[],
  tips_en = array[
    $wr$Medium but long cut: you don't want too much tension, but you do want to carry speed across into the kicker.$wr$,
    $wr$At the top, start the back roll rotation by turning your head and pulling the handle into your back hip at the same time.$wr$,
    $wr$Pass the handle, then keep the rotation going without stalling.$wr$,
    $wr$Start spotting the landing as soon as you come down.$wr$,
    $wr$Bring the handle across to your leading hip to get the correct foot forward for the landing.$wr$
  ]::text[]
where slug = 'kgb';

update figures set
  tips    = array[
    $wr$Approche identique à un railey, coupe moyenne à forte.$wr$,
    $wr$Déclenche juste après être passé sous le câble. Trop loin au-delà, tu perds ton pop.$wr$,
    $wr$Fais d'abord un railey propre, planche parallèle à l'eau. Lancer le 180 trop tôt te met en travers et t'empêchera plus tard de construire le 313.$wr$,
    $wr$Une fois en extension, lâche la main avant et tire le palonnier vers la hanche arrière.$wr$,
    $wr$Garde le palonnier près du corps pendant la rotation. Si tu t'ouvres, tu poses à plat sur le dos.$wr$
  ]::text[],
  tips_en = array[
    $wr$Same approach as a railey, medium to hard edge.$wr$,
    $wr$Scoop just after you pass under the cable. Too far past it and you lose your pop.$wr$,
    $wr$Do a proper railey first, board parallel to the water. Starting the 180 too early puts you off axis and will block your 313 later on.$wr$,
    $wr$Once you're fully extended, let go with the front hand and pull the handle to your rear hip.$wr$,
    $wr$Keep the handle close through the rotation. Flare out and you'll land flat on your back.$wr$
  ]::text[]
where slug = 'krypt';

update figures set
  tips    = array[
    $wr$C'est un melon tweaké derrière toi. Il n'y a pas de version canonique : c'est une figure de style, à toi de la faire tienne.$wr$,
    $wr$Il te faut un melon et un shifty avant de t'y mettre.$wr$,
    $wr$Pour un method glide, garde beaucoup de tension : coupe assez forte vers le kicker.$wr$,
    $wr$Aplatis au tout dernier moment, juste avant le kicker.$wr$,
    $wr$Décolle un peu comme un railey, mais sans laisser la planche partir complètement derrière toi.$wr$,
    $wr$Tiens le grab longtemps : sur cette figure, la durée fait le style.$wr$
  ]::text[],
  tips_en = array[
    $wr$It's a melon tweaked out behind you. There's no canonical version — it's a style trick, make it your own.$wr$,
    $wr$You want a melon and a shifty before you start on this.$wr$,
    $wr$For a method glide, keep plenty of tension: a fairly hard edge into the kicker.$wr$,
    $wr$Flatten off at the very last moment, right before the kicker.$wr$,
    $wr$Take off a bit like a railey, but without letting the board drift all the way out behind you.$wr$,
    $wr$Hold the grab long: on this one, duration is the style.$wr$
  ]::text[]
where slug = 'method';

update figures set
  tips    = array[
    $wr$Coupe moyenne à forte, un peu plus que sur ton tantrum, pour avoir la tension qui te tire autour.$wr$,
    $wr$Ne pars pas sur une coupe de railey : tu te ferais arracher le palonnier des mains.$wr$,
    $wr$Monte le kicker comme un tantrum, mais au pop ne bascule pas droit en arrière : regarde par-dessus l'épaule arrière.$wr$,
    $wr$Envoie le palonnier vers le bas du dos avec la main avant pour que la main arrière l'attrape le plus tôt possible.$wr$,
    $wr$Une fois le palonnier passé, laisse-toi dérouler pendant que tu flippes.$wr$,
    $wr$Après le premier 180 backside, tire très fort avec le bras arrière pour boucler le tour, puis spotte et pose.$wr$
  ]::text[],
  tips_en = array[
    $wr$Medium to hard edge, a bit more than your tantrum, so you have tension to pull yourself round.$wr$,
    $wr$Don't take a railey edge: the handle will get ripped out of your hands.$wr$,
    $wr$Ride up the kicker like a tantrum, but at the pop don't flip straight back — look over your rear shoulder.$wr$,
    $wr$Rip the handle to your lower back with the front hand so your rear hand can get it as early as possible.$wr$,
    $wr$Once the handle is passed, let it unwind you while you flip.$wr$,
    $wr$After the first backside 180, pull as hard as you can with the back arm to bring it round, then spot and land.$wr$
  ]::text[]
where slug = 'moby-dick';

update figures set
  tips    = array[
    $wr$Ne regarde pas en bas. Si tu regardes tes pieds, tu tombes. Poitrine et tête hautes, regard devant.$wr$,
    $wr$Ne précipite pas le pop : appuie d'abord avec le pied avant, puis sors par le tail.$wr$,
    $wr$L'erreur classique est d'écraser le pied avant et de sauter des deux pieds en même temps. C'est le tail qui libère la planche.$wr$,
    $wr$Ne tire pas sur le palonnier pour te soulever. Bras détendu devant toi, légèrement fléchi.$wr$,
    $wr$Appuie sur l'eau d'abord : la planche rebondit, et c'est sur ce rebond que tu tires le pied avant vers le haut.$wr$,
    $wr$Quand c'est acquis, ajoute une petite coupe avant le pop pour créer de la tension et monter plus haut.$wr$
  ]::text[],
  tips_en = array[
    $wr$Don't look down. If you look down, you go down. Chest and head up, eyes forward.$wr$,
    $wr$Don't rush the pop: push down with the front foot first, then come up off the tail.$wr$,
    $wr$The classic mistake is stamping the front foot and jumping off both feet at once. It's the tail that releases the board.$wr$,
    $wr$Don't pull on the handle to lift yourself. Arm relaxed in front of you, slightly bent.$wr$,
    $wr$Push down into the water first: the board rebounds, and it's on that rebound that you pull the front foot up.$wr$,
    $wr$Once you have it, add a small edge before the pop to build tension and go higher.$wr$
  ]::text[]
where slug = 'ollie';

update figures set
  tips    = array[
    $wr$Coupe légère. Plus tu restes petit, plus la figure est constante ; trop fort et tu sur-tournes.$wr$,
    $wr$Approche comme un ts back roll à deux mains : reste bas, pousse au sommet, tête droite en arrière.$wr$,
    $wr$Lâche la main avant tôt et va chercher le grab, nose ou melon. C'est le grab qui fait le Pete Rose : sans lui, c'est juste un ts back roll 360.$wr$,
    $wr$Ne laisse pas le palonnier t'emmener trop tôt. Tiens la position pendant le grab.$wr$,
    $wr$Descends ensuite la main restée sur le palonnier vers la hanche arrière pour lancer le 360.$wr$,
    $wr$En tenant le grab, tourne la tête pour spotter, puis serre le palonnier contre le dos et pose sur les orteils.$wr$
  ]::text[],
  tips_en = array[
    $wr$Gentle edge. The smaller you keep it the more consistent it is; too hard and you over-rotate.$wr$,
    $wr$Approach like a two-handed toeside back roll: stay low, push at the top, head straight back.$wr$,
    $wr$Drop the front hand early and go for the grab, nose or melon. The grab is what makes it a Pete Rose — without it, it's just a toeside back roll 360.$wr$,
    $wr$Don't let the handle pull you round too early. Hold the position through the grab.$wr$,
    $wr$Then bring the hand still on the handle down to your back hip to start the 360.$wr$,
    $wr$Holding the grab, turn your head to spot the landing, then pull the handle tight against your back and land over your toes.$wr$
  ]::text[]
where slug = 'pete-rose';

update figures set
  tips    = array[
    $wr$Place-toi à mi-chemin entre les deux derniers virages, là où la ligne est la plus tendue.$wr$,
    $wr$Coupe progressive de 3 secondes sur les talons : 30 % au début, puis 60 %, puis presque 100 %. Ne rippe pas d'un coup.$wr$,
    $wr$Bras verrouillés coudes près du corps, buste haut et gainé. C'est la tension qui te soulève, n'essaie pas de te lever toi-même.$wr$,
    $wr$Le déclenchement vient du pied avant : envoie-le dans l'eau puis vers l'arrière, le pied arrière suit juste après.$wr$,
    $wr$Regard droit devant. Regarder à gauche ou à droite t'emmène en S-bend ou en back roll.$wr$,
    $wr$Pour ramener la planche sous toi, tire le palonnier vers la hanche avant, jamais vers l'arrière.$wr$
  ]::text[],
  tips_en = array[
    $wr$Line yourself up halfway between the last two corners, where the line has the most tension.$wr$,
    $wr$Progressive 3-second cut on your heels: around 30% at first, then 60%, finishing near 100%. Don't rip it all at once.$wr$,
    $wr$Arms locked with elbows in, chest tall, core squeezed. It's the tension that lifts you — don't try to pull yourself up.$wr$,
    $wr$The release comes from the front foot: kick it down into the water and out behind you, back foot following just after.$wr$,
    $wr$Eyes straight ahead. Looking left or right turns it into an S-bend or a back roll.$wr$,
    $wr$To bring the board back under you, pull the handle to your leading hip, never the back one.$wr$
  ]::text[]
where slug = 'railey';

update figures set
  tips    = array[
    $wr$Les plus accessibles sont le switch toe back 180 rewind et le heel back 360 suivi d'un 180 frontside.$wr$,
    $wr$Tout repose sur la tension de la ligne. Une coupe légère ne t'en donnera pas assez pour rewinder : pars sur une coupe moyenne.$wr$,
    $wr$Aplatis trois à cinq mètres avant le kicker et arrive droit, pour te tirer vers l'avant et attraper le palonnier tôt.$wr$,
    $wr$Déroule ta rotation en allant un peu au-delà, jusqu'à 270°, pour que la ligne se retende.$wr$,
    $wr$C'est cette remise en tension qui rend le rewind possible. Sans elle, il n'y a rien pour t'inverser.$wr$,
    $wr$Marque une pause en l'air, spotte sous toi, puis envoie le palonnier vers le bas du dos au dernier moment. Poitrine au-dessus des orteils.$wr$
  ]::text[],
  tips_en = array[
    $wr$The most accessible ones are the switch toeside backside 180 rewind and the heelside backside 360 into a frontside 180.$wr$,
    $wr$It all rests on line tension. A gentle edge won't give you enough to rewind: take a medium edge.$wr$,
    $wr$Flatten off ten to fifteen feet before the kicker and go dead straight at it, so you can pull yourself forward and get the handle early.$wr$,
    $wr$Unwind your rotation slightly past the mark, to about 270°, so the line comes tight again.$wr$,
    $wr$The line coming tight again is what makes the rewind possible. Without it there's nothing to reverse you.$wr$,
    $wr$Pause in the air, spot below you, then rip the handle to your lower back at the last second. Chest over your toes.$wr$
  ]::text[]
where slug = 'rewind';

update figures set
  tips    = array[
    $wr$En blocage, pars sur ton back roll habituel : coupe progressive, déclenchement, regard entre la tête et l'épaule.$wr$,
    $wr$En blocage, quand tu vois l'eau, tire le palonnier vers le bas du dos au lieu de la hanche avant.$wr$,
    $wr$En blocage, lâche la main arrière au dernier moment, regarde derrière toi et garde la poitrine et les épaules basses.$wr$,
    $wr$Sur kicker, coupe légère. Lâche la main arrière et aplatis juste avant, puis jette-toi en avant juste avant le sommet.$wr$,
    $wr$Sur kicker, garde-le petit au début : plus tu sautes haut, plus tu dois attendre avant de passer blind, et plus c'est dur à poser.$wr$,
    $wr$Un grab indy pendant le flip aide à rester compact.$wr$
  ]::text[],
  tips_en = array[
    $wr$Off the water, start with your usual back roll: progressive edge, release, look between your head and shoulder.$wr$,
    $wr$Off the water, when you spot the landing, pull the handle to your lower back instead of your front hip.$wr$,
    $wr$Off the water, drop your back hand at the last moment, look behind you and keep your chest and shoulders down.$wr$,
    $wr$Off a kicker, mellow edge. Drop the back hand and flatten off just before, then start throwing yourself forward right before the top.$wr$,
    $wr$Off a kicker, keep it small at first: the bigger you go, the longer you have to wait before going blind, and the harder it is to land.$wr$,
    $wr$An indy grab through the flip helps you stay compact.$wr$
  ]::text[]
where slug = 'roll-to-blind';

update figures set
  tips    = array[
    $wr$En blocage, pars sur ton back roll habituel : coupe progressive et palonnier près du corps.$wr$,
    $wr$À la moitié de la rotation, lâche la main avant au lieu de tirer vers la hanche avant.$wr$,
    $wr$Tire le palonnier vers la hanche arrière avec la main restée dessus.$wr$,
    $wr$Garde cette main le plus près possible du corps, sinon le 180 ne suit pas.$wr$,
    $wr$Poitrine basse à la réception, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$Off the water, start with your usual back roll: progressive edge and handle close to the body.$wr$,
    $wr$Halfway through the rotation, let go with the front hand instead of pulling to your front hip.$wr$,
    $wr$Pull the handle to your rear hip with the hand still on it.$wr$,
    $wr$Keep that hand as close to your body as possible, or the 180 won't come round.$wr$,
    $wr$Chest down on landing, knees bent.$wr$
  ]::text[]
where slug = 'roll-to-revert';

update figures set
  tips    = array[
    $wr$Même approche que le railey, avec une coupe tenue un peu plus longtemps. Déclenche juste au-delà du câble.$wr$,
    $wr$Une fois sorti de l'eau, reste raide comme un bâton. Dès que tu t'ouvres, la figure cale en l'air.$wr$,
    $wr$Regarde entre tes bras et sous l'aisselle arrière : c'est ce regard qui enroule la rotation.$wr$,
    $wr$L'erreur classique est de sortir la tête d'entre les bras à mi-figure. Tu restes bloqué à l'envers et tu te fais arracher sur le dos, la chute est violente.$wr$,
    $wr$Garde la tête sous l'aisselle jusqu'au bout, ça boucle tout seul.$wr$,
    $wr$Dès que tu vois l'eau, tire le palonnier vers la hanche avant pour ramener les pieds sous toi.$wr$
  ]::text[],
  tips_en = array[
    $wr$Same approach as the railey, with the edge held a little longer. Scoop just past the cable.$wr$,
    $wr$Once you're off the water, stay stiff as a board. The moment you flare out, the trick stalls in the air.$wr$,
    $wr$Look between your arms and under your rear armpit: that look is what rolls the rotation over.$wr$,
    $wr$The classic mistake is pulling your head out from between your arms halfway. You get stuck upside down and ripped onto your back — it's a brutal slam.$wr$,
    $wr$Keep your head under that armpit all the way and it comes round on its own.$wr$,
    $wr$As soon as you see the water, pull the handle to your front hip to bring your feet back under you.$wr$
  ]::text[]
where slug = 's-bend';

update figures set
  tips    = array[
    $wr$Approche identique au S-bend. Tu peux couper un peu plus fort pour gagner du temps en l'air, mais ce n'est pas obligatoire.$wr$,
    $wr$Même déclenchement, tête entre les bras et sous l'aisselle arrière pour enrouler la rotation du S-bend.$wr$,
    $wr$En redescendant de la rotation, tu vois l'eau. C'est seulement là que tu lances le 180 backside.$wr$,
    $wr$Sois patient. Partir trop tôt sur le 180 t'envoie sur les fesses.$wr$,
    $wr$Une fois l'eau repérée, tire la main avant vers la taille puis le bas du dos pour finir blind.$wr$
  ]::text[],
  tips_en = array[
    $wr$Same approach as the S-bend. You can edge a bit harder for extra air time, but you don't have to.$wr$,
    $wr$Same release, head between your arms and under your rear armpit to roll it over.$wr$,
    $wr$Coming down out of the barrel roll you'll see the water. Only then do you start the backside 180.$wr$,
    $wr$Be patient. Starting the 180 too early puts you on your bum.$wr$,
    $wr$Once you've spotted the water, pull your front hand to your waist then your lower back to finish blind.$wr$
  ]::text[]
where slug = 's-bend-to-blind';

update figures set
  tips    = array[
    $wr$Sur kicker, coupe moyenne, ni trop forte ni trop lente, deux mains sur le palonnier.$wr$,
    $wr$Sur kicker, aplatis et reste grand jusqu'en haut, à deux mains. Ne pars pas trop tôt.$wr$,
    $wr$Sur kicker, au sommet, pousse et lance la même rotation qu'un front roll en gardant les deux mains.$wr$,
    $wr$En blocage, coupe toeside progressive avec le coude verrouillé sur la hanche avant.$wr$,
    $wr$En blocage, au maximum de tension, envoie les pointes de pied en l'air puis lance tête et épaules par-dessus. Garde la poitrine haute, sinon tu ne sors pas de l'eau.$wr$,
    $wr$À la moitié du flip, tire les mains de la hanche avant vers la hanche arrière : c'est ce transfert qui déclenche le 180.$wr$,
    $wr$En redescendant, spotte comme sur un tantrum switch. Tu peux poser à deux mains ou lâcher la main arrière.$wr$
  ]::text[],
  tips_en = array[
    $wr$Off a kicker, medium edge, not too hard, not too slow, both hands on the handle.$wr$,
    $wr$Off a kicker, flatten off and stay tall all the way up, both hands on. Don't leave early.$wr$,
    $wr$Off a kicker, at the top, push and throw the same rotation as a front roll while keeping both hands.$wr$,
    $wr$Off the water, progressive toeside cut with your elbow locked onto your front hip.$wr$,
    $wr$Off the water, at maximum tension drive your toes up into the air then throw head and shoulders over. Keep your chest up or you won't get the release.$wr$,
    $wr$Halfway through the flip, pull your hands from your front hip across to your back hip: that transfer is what starts the 180.$wr$,
    $wr$Coming down, spot it like a switch tantrum. You can ride away with both hands or drop the back one.$wr$
  ]::text[]
where slug = 'scarecrow';

update figures set
  tips    = array[
    $wr$Coupe légère, aplatis avant le kicker et décolle planche à plat.$wr$,
    $wr$Pousse légèrement la planche vers l'avant en l'air : c'est ce qui rend le grab atteignable.$wr$,
    $wr$Rentre le genou avant, puis le pied arrière, pour amener la planche vers la main.$wr$,
    $wr$Une fois le grab acquis, enchaîne-le avec un 180 backside.$wr$
  ]::text[],
  tips_en = array[
    $wr$Gentle edge, flatten off before the kicker and leave with the board flat.$wr$,
    $wr$Push the board slightly forward in the air: that's what brings the grab within reach.$wr$,
    $wr$Tuck the front knee in, then the back foot, to bring the board up to your hand.$wr$,
    $wr$Once you have the grab, put it into a backside 180.$wr$
  ]::text[]
where slug = 'stalefish';

update figures set
  tips    = array[
    $wr$Coupe légère et aplatis juste avant le kicker.$wr$,
    $wr$Penche-toi légèrement en arrière au moment d'attraper, sinon tu tires le tail vers toi et tu perds l'équilibre.$wr$,
    $wr$Ramène la planche vers la poitrine plutôt que d'aller la chercher en te pliant.$wr$,
    $wr$Une fois acquis, essaie-le sur un 360 backside.$wr$
  ]::text[],
  tips_en = array[
    $wr$Gentle edge and flatten off just before the kicker.$wr$,
    $wr$Lean back slightly as you grab, otherwise you pull the tail up towards you and lose your balance.$wr$,
    $wr$Bring the board up to your chest rather than bending down to reach it.$wr$,
    $wr$Once you have it, try it on a backside 360.$wr$
  ]::text[]
where slug = 'tail-grab';

update figures set
  tips    = array[
    $wr$Coupe moyenne : trop lente tu n'auras pas de pop, trop forte tu surcuis la figure.$wr$,
    $wr$Lâche la main arrière trois mètres avant le kicker et garde le palonnier devant toi.$wr$,
    $wr$Garde les épaules bien face à la ligne, pas déjà tournées vers l'avant. Buste ouvert, la planche accroche la ligne et le flip ne passe pas.$wr$,
    $wr$Pousse au sommet et envoie les pieds par-dessus la tête, regard vers l'arrière, comme un salto sur un trampoline.$wr$,
    $wr$À la moitié du flip, regarde l'eau, ramène les pieds sous toi et fléchis les genoux.$wr$,
    $wr$Sur un kicker mou, fais-toi bas et pousse plus fort pour compenser le manque de pop.$wr$
  ]::text[],
  tips_en = array[
    $wr$Medium edge: too slow and you get no pop, too hard and you overcook it.$wr$,
    $wr$Drop your back hand about ten feet before the kicker and keep the handle in front of you.$wr$,
    $wr$Stay square to the cable. At an angle the board can clip the line and the flip won't come round.$wr$,
    $wr$Push at the top and throw your feet over your head, looking back, exactly like a backflip on a trampoline.$wr$,
    $wr$Halfway through the flip, find the water, bring your feet under you and bend your knees.$wr$,
    $wr$On a mellow kicker, get low and push harder to make up for the lack of pop.$wr$
  ]::text[]
where slug = 'tantrum';

update figures set
  tips    = array[
    $wr$Coupe moyenne, exactement comme sur ton tantrum. Tu peux couper plus fort, mais plus tu montes haut, plus la pose blind est dure.$wr$,
    $wr$Garde une bonne tension pendant toute la figure : c'est elle qui te tire en blind à la fin.$wr$,
    $wr$Sur un tantrum, tu peux être un peu court et t'en sortir. Ici non : un peu court et tu glisses sur les fesses.$wr$,
    $wr$Sur-tourne légèrement ton tantrum, tu poseras davantage sur les orteils et tu pourras repartir en t'éloignant du câble.$wr$,
    $wr$Tu vas avoir l'impression de prendre une carre arrière. Vas-y quand même, ça arrive rarement.$wr$
  ]::text[],
  tips_en = array[
    $wr$Medium edge, exactly like your tantrum. You can go harder, but the higher you go the harder the blind landing gets.$wr$,
    $wr$Hold good tension right through the trick: that tension is what pulls you into blind at the end.$wr$,
    $wr$On a tantrum you can come up short and still ride away. Not here: short and you slip out on your bum.$wr$,
    $wr$Slightly over-rotate the tantrum and you'll land more over your toes and be able to ride away from the cable.$wr$,
    $wr$It'll feel like you're about to catch a back edge. Go anyway, it rarely happens.$wr$
  ]::text[]
where slug = 'tantrum-to-blind';

update figures set
  tips    = array[
    $wr$Approche du côté opposé du câble par rapport au kicker, sur une coupe moyenne et progressive.$wr$,
    $wr$Plus tu coupes fort, plus tu auras de tension à gérer ; plus tu coupes doux, moins tu auras de pop. La moyenne est le bon compromis.$wr$,
    $wr$Aplatis au dernier moment et lâche la main arrière. Reste bien accroupi, comme au décollage d'un front roll.$wr$,
    $wr$Grandis-toi vers le sommet pour pousser, et lance la rotation de front roll.$wr$,
    $wr$En quittant le kicker, envoie la main avant pour passer le palonnier tôt.$wr$,
    $wr$Une fois le palonnier dans la main arrière, le toe back 180 se déroule pendant que tu es à l'envers. Tu vois l'eau quasiment tout du long.$wr$
  ]::text[],
  tips_en = array[
    $wr$Approach from the opposite side of the cable to the kicker, on a medium progressive edge.$wr$,
    $wr$The harder you edge the more tension you'll have to handle; the softer you edge the less pop you get. Medium is the compromise.$wr$,
    $wr$Flatten off at the last second and drop your rear hand. Stay squatted, exactly like a front roll takeoff.$wr$,
    $wr$Stand taller towards the top to give it a solid push, and throw the front roll rotation.$wr$,
    $wr$As you leave the top of the kicker, rip the front hand round to pass the handle early.$wr$,
    $wr$Once the handle is in your rear hand the toeside backside 180 unwinds while you're upside down. You can spot the landing almost the whole way.$wr$
  ]::text[]
where slug = 'tootsie';

update figures set
  tips    = array[
    $wr$Tout se joue sur la trajectoire d'entrée. La plupart des accroches viennent d'une approche trop proche du module.$wr$,
    $wr$Vise du coin bas du module, le plus proche du câble, vers le milieu du kicker d'où tu décolles. Ça te laisse la place de lever la planche sans toucher.$wr$,
    $wr$Garde uniquement la main avant sur le palonnier.$wr$,
    $wr$Lève le nose ou le tail d'abord, et tourne la planche seulement après. Tourner trop tôt est ce qui fait accrocher.$wr$,
    $wr$C'est plus intimidant que difficile : avec la bonne ligne d'approche, ça passe dès les premiers essais.$wr$
  ]::text[],
  tips_en = array[
    $wr$It's all in the line you take in. Most clips come from approaching too close to the feature.$wr$,
    $wr$Aim from the bottom corner nearest the cable up to the middle of the kicker you're taking off. That leaves room for the board to lift without catching.$wr$,
    $wr$Keep only your front hand on the handle.$wr$,
    $wr$Lift the nose or the tail first, and only then turn the board. Turning early is what makes you clip.$wr$,
    $wr$It's more intimidating than hard: with the right line in, it usually goes on the first tries.$wr$
  ]::text[]
where slug = 'transfer';

update figures set
  tips    = array[
    $wr$Sur kicker, le flip le plus facile au câble : coupe minimale, tu peux presque arriver droit. Main arrière lâchée derrière toi, palonnier devant le corps, épaules parallèles au câble.$wr$,
    $wr$Sur kicker, genoux fléchis en montant, pousse à mi-hauteur, et à trois quarts lance la tête en arrière.$wr$,
    $wr$En blocage, place-toi du côté opposé du câble et engage progressivement une coupe toeside moyenne.$wr$,
    $wr$En blocage, envoie les pointes de pied en l'air et lance la tête en arrière en même temps. C'est un seul mouvement, pas l'un puis l'autre.$wr$,
    $wr$En blocage, bras serrés et palonnier à la hanche. Dès que les bras s'écartent, tu perds la tension et la rotation ne passe pas.$wr$,
    $wr$Ne tire jamais sur le palonnier pendant le flip. C'est ce qui fait poser sur le dos ou sur les fesses.$wr$,
    $wr$Dès que tu passes à l'envers, cherche l'eau du regard : elle te dit combien de hauteur il te reste. Prépare-toi à poser sur tes pieds sans compter sur le palonnier.$wr$
  ]::text[],
  tips_en = array[
    $wr$Off a kicker, the easiest flip on cable: minimal edge, you can almost ride straight at it. Back hand off and behind you, handle in front of your body, shoulders parallel to the cable.$wr$,
    $wr$Off a kicker, knees bent on the way up, push halfway, and throw your head back at the three-quarter mark.$wr$,
    $wr$Off the water, set up on the opposite side of the cable and roll progressively onto a medium toeside edge.$wr$,
    $wr$Off the water, drive your toes up into the air and throw your head back at the same time. It's one movement, not one then the other.$wr$,
    $wr$Off the water, arms in tight and handle at your hip. The moment your arms come out you lose the tension and the rotation stalls.$wr$,
    $wr$Never pull on the handle during the flip. That's what makes you land on your back or your bum.$wr$,
    $wr$As soon as you're past inverted, look for the water: it tells you how much height you have left. Be ready to land on your feet without relying on the handle.$wr$
  ]::text[]
where slug = 'ts-back-roll';

update figures set
  tips    = array[
    $wr$Coupe légère, puis relâche-la environ six mètres avant le kicker : tu vas alors un peu plus vite que le câble.$wr$,
    $wr$Cette tension molle est ce qui te permet de te tirer vers l'avant et d'attraper le palonnier très tôt.$wr$,
    $wr$En montant le kicker, tire-toi vers l'avant et va chercher le palonnier derrière le dos avec la main arrière.$wr$,
    $wr$Une fois le palonnier passé, tourne simplement la tête par-dessus l'épaule arrière et laisse-toi dérouler.$wr$,
    $wr$Garde le palonnier aligné devant le corps, spotte sous toi, genoux fléchis.$wr$
  ]::text[],
  tips_en = array[
    $wr$Gentle edge, then back off it about twenty feet before the kicker: you'll be moving slightly faster than the cable.$wr$,
    $wr$That soft tension is what lets you pull yourself forward and get the handle really early.$wr$,
    $wr$Riding up the kicker, pull yourself forward and reach behind your back with the rear hand for the handle.$wr$,
    $wr$Once the handle is passed, just turn your head over your rear shoulder and let yourself unwind.$wr$,
    $wr$Keep the handle lined up in front of your body, spot below you, knees bent.$wr$
  ]::text[]
where slug = 'ts-bs-180';

update figures set
  tips    = array[
    $wr$Sans doute le 360 le plus facile. Coupe moyenne, puis aplatis environ six mètres avant le kicker.$wr$,
    $wr$Cet aplat te fait aller plus vite que le câble : c'est ce qui donne la tension idéale pour attraper le palonnier tôt.$wr$,
    $wr$Au bas du kicker, tire-toi vers l'avant à deux mains, et cale le palonnier dans la main arrière derrière le dos au sommet.$wr$,
    $wr$Regarde par-dessus l'épaule arrière et laisse-toi dérouler. Tu peux voir l'eau tôt.$wr$,
    $wr$L'attraper trop tôt fait pré-tourner : acceptable au début, à corriger avec le temps.$wr$
  ]::text[],
  tips_en = array[
    $wr$Probably the easiest 360 there is. Medium edge, then flatten off about twenty feet before the kicker.$wr$,
    $wr$That flat run makes you faster than the cable: it's what gives you the tension to get the handle early.$wr$,
    $wr$At the bottom of the kicker, pull yourself forward with both hands and set the handle into your rear hand behind your back at the top.$wr$,
    $wr$Look over your rear shoulder and let yourself unwind. You can spot the water early.$wr$,
    $wr$Getting the handle too early makes you pre-spin: fine at first, worth cleaning up over time.$wr$
  ]::text[]
where slug = 'ts-bs-360';

update figures set
  tips    = array[
    $wr$Même coupe que sur ton toe back 360, relâchée six mètres avant le kicker pour attraper le palonnier tôt.$wr$,
    $wr$Pense-le comme un toe back 180 suivi d'un switch frontside 360, pas comme un 360 avec un 180 tardif.$wr$,
    $wr$Une fois le palonnier dans la main arrière, regarde par-dessus l'épaule arrière et déroule jusqu'au point du toe back 180.$wr$,
    $wr$Là, tu vois l'eau : reprends le palonnier et envoie le switch frontside 360.$wr$,
    $wr$Le plus simple est de poser wrapped. Si cette position ne te va pas, fais un passage de palonnier de plus.$wr$
  ]::text[],
  tips_en = array[
    $wr$Same edge as your toeside backside 360, backed off twenty feet before the kicker so you get the handle early.$wr$,
    $wr$Think of it as a toeside backside 180 into a switch frontside 360, not a 360 with a late 180.$wr$,
    $wr$Once the handle is in your rear hand, look over your rear shoulder and unwind to the backside 180 point.$wr$,
    $wr$That's where you see the water: grab back on and rip the switch frontside 360.$wr$,
    $wr$Landing wrapped is the simplest. If that position doesn't suit you, take one more handle pass.$wr$
  ]::text[]
where slug = 'ts-bs-540';

update figures set
  tips    = array[
    $wr$Coupe très légère, mais assez pour t'éloigner du câble.$wr$,
    $wr$Aplatis au dernier moment et monte le kicker bien droit.$wr$,
    $wr$Palonnier à la hanche avant le plus longtemps possible : pré-tourner ici est une mauvaise habitude qui te gênera sur le toe 360 et le toe 540.$wr$,
    $wr$Ne déclenche qu'au sommet du saut, en amenant le palonnier à la hanche arrière.$wr$,
    $wr$Réaligne les épaules dans le sens du déplacement, spotte sous toi, genoux fléchis, et repars sur les talons.$wr$
  ]::text[],
  tips_en = array[
    $wr$Very mellow edge, but enough to keep travelling away from the cable.$wr$,
    $wr$Flatten off at the last second and ride straight up the kicker.$wr$,
    $wr$Handle at your front hip as long as possible: pre-spinning here is a bad habit that will hurt your toe 360 and toe 540.$wr$,
    $wr$Only start the rotation at the peak of the jump, by pulling the handle to your rear hip.$wr$,
    $wr$Square your shoulders to the new direction, spot below you, bend your knees and ride away on your heels.$wr$
  ]::text[]
where slug = 'ts-fs-180';

update figures set
  tips    = array[
    $wr$Plus dur que le toe 540, ne t'étonne pas. Coupe très légère et vise petit : c'est facile de sur-tourner en 540.$wr$,
    $wr$Absorbe le pop plutôt que de sauter grand, et monte le kicker planche bien droite.$wr$,
    $wr$Sors complètement du kicker et attends une demi-seconde avant de tourner. La patience est tout ici.$wr$,
    $wr$Dans la descente, tire le palonnier vers la hanche arrière puis vers le bas du dos pour poser blind.$wr$,
    $wr$Cherche l'eau du regard tôt malgré le blind. Apprends-le en posant blind plutôt qu'en passant le palonnier : ça ouvre le crow mobe et le toe 720.$wr$
  ]::text[],
  tips_en = array[
    $wr$Harder than the toe 540, don't be surprised. Very gentle edge and go small: it's easy to over-rotate into a 540.$wr$,
    $wr$Absorb the pop rather than jumping big, and ride up the kicker with the board dead straight.$wr$,
    $wr$Ride all the way off the kicker and wait half a second before rotating. Patience is everything here.$wr$,
    $wr$On the way down, pull the handle to your rear hip then to your lower back to land blind.$wr$,
    $wr$Find the water early despite the blind landing. Learn it landing blind rather than passing the handle: it opens up the crow mobe and the toe 720.$wr$
  ]::text[]
where slug = 'ts-fs-360';

update figures set
  tips    = array[
    $wr$Plus facile que le toe 360. Coupe légère à moyenne, deux mains sur le palonnier — à une main tu t'ajoutes un passage.$wr$,
    $wr$Aplatis juste avant, et monte le kicker planche parallèle pour ne pas pré-tourner.$wr$,
    $wr$À mi-hauteur du kicker, fléchis puis tends les jambes au sommet pour un pop bien vertical.$wr$,
    $wr$Une fois en l'air, tire à deux mains vers la hanche arrière, puis continue vers le bas du dos et va chercher le palonnier de l'autre main.$wr$,
    $wr$Tu as beaucoup plus de temps que tu crois. Ne précipite rien.$wr$
  ]::text[],
  tips_en = array[
    $wr$Easier than the toe 360. Gentle to medium edge, both hands on the handle — one hand just adds another pass.$wr$,
    $wr$Flatten off just before, and ride up the kicker with the board parallel so you don't pre-spin.$wr$,
    $wr$Halfway up the kicker, bend then extend your legs at the peak for a straight-up, straight-down pop.$wr$,
    $wr$Once in the air, pull to your rear hip with both hands, then keep going to your lower back and reach around for the handle.$wr$,
    $wr$You have far more time than you think. Don't rush it.$wr$
  ]::text[]
where slug = 'ts-fs-540';

update figures set
  tips    = array[
    $wr$Coupe légère, pas besoin de sauter énorme : plus tu vas haut, plus la réception blind est violente.$wr$,
    $wr$Palonnier à la hanche avant jusqu'au pop, sinon tu pré-tournes.$wr$,
    $wr$Déroule comme un toe 540, puis reprends le palonnier tôt pour finir les derniers 180.$wr$,
    $wr$Finis la dernière partie tard et en douceur, c'est ce qui rend la pose blind propre.$wr$,
    $wr$Ne laisse pas la planche partir devant toi : si tu n'es pas au-dessus, tu glisses sur les fesses à chaque fois.$wr$
  ]::text[],
  tips_en = array[
    $wr$Mellow edge, no need to go big: the higher you go, the heavier the blind landing.$wr$,
    $wr$Handle at your front hip until you've got your pop, otherwise you'll pre-spin.$wr$,
    $wr$Unwind it like a toe 540, then get the handle back early to finish the last 180.$wr$,
    $wr$Finish the last part late and light — that's what makes the blind landing clean.$wr$,
    $wr$Don't let the board get out in front of you: if you're not on top of it you'll slip out on your butt every time.$wr$
  ]::text[]
where slug = 'ts-fs-720';

update figures set
  tips    = array[
    $wr$Figure avancée : n'y va pas avant d'avoir une coupe toeside solide et de l'expérience en blocage.$wr$,
    $wr$Place-toi entre le dernier virage et le pylône moteur, là où la tension est la plus forte, et démarre légèrement sous le câble.$wr$,
    $wr$Coupe de 3 secondes sur la carre orteils, en montant progressivement.$wr$,
    $wr$Verrouille le coude arrière contre le ventre, palonnier aligné sur la hanche avant et hanches poussées vers l'avant. C'est ce gainage qui fait descendre la tension jusqu'à la planche.$wr$,
    $wr$Dès que le câble te soulève, ouvre la poitrine et ramène les épaules. Si elles restent de côté, tu finis assis jambes repliées.$wr$,
    $wr$Une fois en extension, ramène les bras vers la hanche avant pour remettre la planche sous toi.$wr$
  ]::text[],
  tips_en = array[
    $wr$Advanced trick: don't go for it before you have a solid toeside edge and some air-trick experience.$wr$,
    $wr$Set up between the last corner and the motor tower, where the tension is highest, and start slightly under the cable.$wr$,
    $wr$Three-second cut on your toeside edge, building progressively.$wr$,
    $wr$Lock your back elbow against your stomach, handle in line with your front hip and hips pushed forward. That tightness is what drives the tension down into the board.$wr$,
    $wr$As soon as the cable lifts you, open your chest and bring your shoulders round. Leave them sideways and you end up sat back with your legs crunched up.$wr$,
    $wr$Once extended, pull your arms back to your leading hip to bring the board underneath you.$wr$
  ]::text[]
where slug = 'ts-railey';

update figures set
  tips    = array[
    $wr$Coupe petite à moyenne selon le kicker. Sur un gros kicker, tu peux presque arriver droit.$wr$,
    $wr$Décolle à deux mains, contrairement au ts back roll classique.$wr$,
    $wr$À deux mains, le câble va vouloir te forcer le 180 tout de suite. Force le palonnier à rester du côté avant du corps le plus longtemps possible.$wr$,
    $wr$Fais d'abord un vrai back roll toeside. Si le 180 part trop tôt, la figure devient sale et incontrôlée.$wr$,
    $wr$Vers la moitié ou les trois quarts du flip, tire le palonnier vers la hanche arrière pour enrouler le 180.$wr$
  ]::text[],
  tips_en = array[
    $wr$Small to medium edge depending on the kicker. On a big one you can almost ride straight at it.$wr$,
    $wr$Take off with both hands, unlike a normal toeside back roll.$wr$,
    $wr$With both hands the cable wants to force the 180 straight away. Force the handle to stay on the front side of your body as long as you can.$wr$,
    $wr$Do the toeside back roll properly first. If the 180 starts too early the trick gets messy and out of control.$wr$,
    $wr$Around halfway to three quarters through the flip, pull the handle across to your rear hip to wind the 180.$wr$
  ]::text[]
where slug = 'ts-roll-to-revert';

update figures set
  tips    = array[
    $wr$Construis-le sur des whirly birds sur kicker avant de le tenter en blocage.$wr$,
    $wr$Pense-le comme un bell air to blind, mais avec le bras qui passe par-dessus la tête au lieu de finir dans le dos.$wr$,
    $wr$Monte d'abord, passe ensuite. Envoyer le bras trop tôt te fait perdre la hauteur.$wr$,
    $wr$Tu as toujours moins de temps en l'air que tu ne le crois : ne traîne pas sur le passage par-dessus la tête.$wr$,
    $wr$Le geste du bras est exactement celui du whirly bird sur kicker, ne le change pas parce que tu es sur l'eau.$wr$
  ]::text[],
  tips_en = array[
    $wr$Build it on kicker whirly birds before trying it off the water.$wr$,
    $wr$Think of it as a bell air to blind, but with the arm going over your head instead of finishing behind your back.$wr$,
    $wr$Go up first, over second. Throwing the arm too early costs you height.$wr$,
    $wr$You always have less air time than you think: don't linger on the pass over your head.$wr$,
    $wr$The arm movement is exactly the kicker whirly bird — don't change it just because you're off the water.$wr$
  ]::text[]
where slug = 'tweetie';

update figures set
  tips    = array[
    $wr$Approche de railey : passe sous le câble après le virage, laisse-toi glisser une seconde pour que la ligne se tende, puis coupe progressive moyenne à forte.$wr$,
    $wr$Déclenche juste au-delà du câble, là où tu as le plus de vitesse. Trop loin et tu perds du pop.$wr$,
    $wr$Le déclenchement est celui du S-bend : pied avant qui part devant, pied arrière qui suit, puis tête sous l'aisselle arrière.$wr$,
    $wr$À la moitié de la rotation, arrête volontairement le S-bend pour repartir dans l'autre sens. C'est ce coup d'arrêt net qui fait le rewind.$wr$,
    $wr$Si tu ajoutes un grab entre les fixations, la figure s'appelle un bee sting.$wr$
  ]::text[],
  tips_en = array[
    $wr$Railey approach: get under the cable after the corner, coast a second to let the line come tight, then a progressive medium-to-hard edge.$wr$,
    $wr$Scoop just past the cable, where you carry the most speed. Too far and you lose pop.$wr$,
    $wr$The release is the S-bend one: front foot out, rear foot following, then head under your rear armpit.$wr$,
    $wr$Halfway through the rotation, deliberately stop the S-bend to reverse direction. That clean stop is what makes the rewind.$wr$,
    $wr$Add a grab between the bindings and the trick becomes a bee sting.$wr$
  ]::text[]
where slug = 'vulcan';

update figures set
  tips    = array[
    $wr$Pas de passage de palonnier dans cette figure, mais elle fait peur. C'est surtout un cap d'engagement.$wr$,
    $wr$Coupe un peu plus forte que moyenne, épaules bien face à la ligne sur le kicker, et attends le sommet pour pousser bien haut.$wr$,
    $wr$Tout est identique au tantrum jusqu'au pop.$wr$,
    $wr$Au lieu de partir droit en arrière, envoie le palonnier en travers du visage et tiens-le au-dessus de la tête.$wr$,
    $wr$C'est ce geste qui crée la rotation. Si tu ne tournes pas, c'est que tu n'envoies pas assez franchement.$wr$,
    $wr$Le premier essai fait un effet machine à laver. Ensuite ramène le palonnier devant toi et spotte comme sur un tantrum.$wr$
  ]::text[],
  tips_en = array[
    $wr$No handle pass in this one, but it's scary. It's mostly a commitment step.$wr$,
    $wr$Slightly harder than a medium edge, shoulders square on the kicker, and wait for the top to pop nice and high.$wr$,
    $wr$Everything is identical to a tantrum up to the pop.$wr$,
    $wr$Instead of going straight back, punch the handle across your face and hold it above your head.$wr$,
    $wr$That punch is what creates the rotation. If you're not spinning, you're not punching hard enough.$wr$,
    $wr$The first one feels like a washing machine. After that, bring the handle back in front of you and spot it like a tantrum.$wr$
  ]::text[]
where slug = 'whirly-bird';

update figures set
  tips    = array[
    $wr$Apprends la version backside en premier, elle est nettement plus facile que la frontside.$wr$,
    $wr$Placement de pieds identique à ton pop shuvit.$wr$,
    $wr$Avance un peu le pied avant sur la planche : ça la fait tourner plus vite.$wr$,
    $wr$Si ton pop shuvit est propre, celui-ci vient assez vite.$wr$,
    $wr$Si tu bloques, reviens travailler le pop shuvit plutôt que d'insister sur le tour complet.$wr$
  ]::text[],
  tips_en = array[
    $wr$Learn the backside version first, it's much easier than the frontside.$wr$,
    $wr$Same foot placement as your pop shuvit.$wr$,
    $wr$Move your front foot a little further down the board: it makes it spin faster.$wr$,
    $wr$If your pop shuvit is clean, this one comes fairly quickly.$wr$,
    $wr$If you're stuck, go back and work the pop shuvit rather than forcing the full rotation.$wr$
  ]::text[]
where slug = 'ws-360-shuvit';

update figures set
  tips    = array[
    $wr$N'y viens pas avant d'avoir tes 360 shuvit, big spins et ollie 180. Les flips demandent une vraie maîtrise de la planche.$wr$,
    $wr$Pied avant proche du milieu de la planche, ouvert à 45° : c'est cette position qui te met en place pour lancer la vrille.$wr$,
    $wr$Coupe, puis aplatis avant de popper. Chercher à faire vriller en pleine coupe est l'erreur la plus fréquente.$wr$,
    $wr$Au pop, laisse d'abord le nose monter bien haut. Ne lance la vrille qu'après, d'un coup de pied à travers la carre.$wr$,
    $wr$Si la planche ne vrille pas du tout, c'est que tu t'y prends trop tôt, avant que le nose soit monté. Si le nose plonge dans l'eau, recule un peu ton pied avant.$wr$,
    $wr$Accompagne le coup de pied au lieu de le stopper net : comme quand tu lances une balle, si tu arrêtes la main, elle tombe devant toi. C'est ce qui laisse à la planche la place de tourner.$wr$,
    $wr$Dès que tu revois le grip, ramène les pieds. Pose pieds écartés, genoux fléchis, menton au-dessus de la planche.$wr$
  ]::text[],
  tips_en = array[
    $wr$Don't come to this before you have your 360 shuvits, big spins and ollie 180s. Flip tricks need real board control.$wr$,
    $wr$Front foot near the middle of the board, ducked out at about 45°: that position is what sets you up for the flick.$wr$,
    $wr$Edge, then flatten off before you pop. Trying to flick off a straight-up edge is the most common mistake.$wr$,
    $wr$On the pop, let the nose come up nice and high first. Only then flick through the side of the board.$wr$,
    $wr$If the board doesn't flip at all, you're flicking too early, before the nose has come up. If the nose dives into the water, move your front foot back a little.$wr$,
    $wr$Follow through on the flick instead of stopping your foot: like throwing a ball, if you stop your hand it drops in front of you. The follow-through is what gives the board room to come round.$wr$,
    $wr$As soon as you see the grip tape again, bring your feet down. Land with your feet wide, knees bent, chin over the board.$wr$
  ]::text[]
where slug = 'ws-kickflip';

update figures set
  tips    = array[
    $wr$Il te faut un ollie solide et quelques 180 frontside avant de commencer à faire tourner la planche.$wr$,
    $wr$Pied avant un peu plus reculé que pour un ollie et légèrement ouvert en canard.$wr$,
    $wr$Pied arrière sur le tail mais décalé vers la carre orteils : c'est ce placement qui donne un scoop propre.$wr$,
    $wr$Tu envoies la planche depuis le côté orteils, donc un peu de poids sur les orteils aide à la lancer devant toi.$wr$,
    $wr$Bien placé, la planche tourne à plat et se rattrape toute seule.$wr$,
    $wr$C'est la base du 360 shuvit, du big spin et des varials : prends le temps de la propreté.$wr$
  ]::text[],
  tips_en = array[
    $wr$You want a solid ollie and a few frontside 180s before you start letting the board spin.$wr$,
    $wr$Front foot slightly further back than for an ollie and turned out a little, ducked.$wr$,
    $wr$Back foot on the tail but shifted towards the toeside edge: that placement is what gives a clean scoop.$wr$,
    $wr$You scoop it from the toeside, so a bit of weight on your toes helps send the board out in front of you.$wr$,
    $wr$Set up right, the board spins level and comes back under you on its own.$wr$,
    $wr$It's the base for the 360 shuvit, the big spin and varials — take the time to make it clean.$wr$
  ]::text[]
where slug = 'ws-pop-shuvit';

-- contrôle : 57 lignes, 4 à 6 conseils par langue, plus aucun terme proscrit
select slug,
       array_length(tips, 1)    as n_fr,
       array_length(tips_en, 1) as n_en,
       array_to_string(tips, ' ') ~* '\mwake\M|vague|\mcorde\M|charg|poignée|figure d''élite|maîtrisé' as vocab_proscrit
from figures
where slug in ('313', '911', 'back-board', 'back-lip', 'back-mobe', 'back-roll', 'bell-air', 'blind', 'blind-judge', 'crow-mobe', 'elephant', 'front-flip', 'front-flip-to-fakie', 'front-roll', 'half-cab-roll', 'hs-bs-360', 'hs-bs-540', 'hs-bs-720', 'hs-fs-180', 'hs-fs-360', 'hs-fs-540', 'hs-fs-720', 'kgb', 'krypt', 'method', 'moby-dick', 'ollie', 'pete-rose', 'railey', 'rewind', 'roll-to-blind', 'roll-to-revert', 's-bend', 's-bend-to-blind', 'scarecrow', 'stalefish', 'tail-grab', 'tantrum', 'tantrum-to-blind', 'tootsie', 'transfer', 'ts-back-roll', 'ts-bs-180', 'ts-bs-360', 'ts-bs-540', 'ts-fs-180', 'ts-fs-360', 'ts-fs-540', 'ts-fs-720', 'ts-railey', 'ts-roll-to-revert', 'tweetie', 'vulcan', 'whirly-bird', 'ws-360-shuvit', 'ws-kickflip', 'ws-pop-shuvit')
order by vocab_proscrit desc nulls last, slug;

commit;  -- ou rollback;
