-- WakeRef — descriptions : vocabulaire câble et nettoyage
-- Généré le 2026-09-04. À relire, puis appliquer dans l'éditeur SQL Supabase.
--
-- Corrige, sur 94 descriptions (FR et/ou EN) :
--   * vocabulaire bateau : « depuis le wake heelside » -> « en approche heelside »,
--     « charge le wake côté talon » -> « prend une coupe côté talons »
--     (EN : « off the heelside wake » -> « on a heelside approach »)
--   * lexique : handle -> palonnier, handle pass -> passage de palonnier,
--     corde -> ligne, board -> planche (EN : rope -> line). L'anglais garde
--     « handle » et « handle pass », conformément à la convention retenue.
--   * scories : retours à la ligne et doubles espaces parasites (rewind, japan),
--     majuscules perdues en début de phrase, tournures redondantes
--   * deux erreurs de contenu au passage : squeezer / squeezer-5 en anglais
--     renvoyaient au Scarecrow et au Crow Mobe au lieu du Crow Mobe et du Crow Mobe 5
--
-- Les `tips` ne sont pas touchés (voir 0011). Ce qui n'est PAS corrigé ici et
-- reste à arbitrer : les mentions « Figure d'élite » / « Figure de compétition »
-- en fin de description, redondantes avec le champ difficulty.

begin;

do $guard$
declare missing text;
begin
  select string_agg(s, ', ') into missing
  from unnest(array[
    '118',
    '313',
    '313-rewind',
    '315',
    '317',
    'back-mobe',
    'back-mobe-5',
    'back-mobe-7',
    'bell-air-moby-dick',
    'big-mac',
    'blind',
    'blind-judge',
    'blind-jury',
    'blind-pete',
    'blind-pete-rose',
    'bs-313',
    'bs-313-rewind',
    'bs-315',
    'bs-317',
    'crow-mobe',
    'crow-mobe-5',
    'crow-mobe-7',
    'double-backroll',
    'double-s-bend',
    'double-tantrum',
    'double-tantrum-to-blind',
    'double-ts-back-roll',
    'dum-dum',
    'dum-dum-5',
    'fat-chance',
    'front-blind-mobe',
    'half-cab-roll',
    'hassle-hoff',
    'heart-attack',
    'heart-attack-5',
    'hinterberger',
    'hs-bs-1080',
    'hs-bs-180',
    'hs-bs-360',
    'hs-bs-540',
    'hs-bs-720',
    'hs-bs-900',
    'hs-fs-1080',
    'hs-fs-180',
    'hs-fs-360',
    'hs-fs-540',
    'hs-fs-720',
    'hs-fs-900',
    'japan',
    'kgb',
    'kgb-5',
    'moby-dick',
    'moby-dick-5',
    'moby-dick-7',
    'ole',
    'pete-rose',
    'pete-rose-5',
    'pete-rose-7',
    'rewind',
    'rubber-chicken',
    's-bend',
    's-mobe',
    's-mobe-5',
    's-mobe-rewind',
    'skeletor',
    'skud',
    'slim-chance',
    'slim-chance-5',
    'squeezer',
    'squeezer-5',
    'tantrum',
    'tootsie',
    'ts-313',
    'ts-315',
    'ts-back-roll',
    'ts-bs-180',
    'ts-bs-313',
    'ts-bs-360',
    'ts-bs-540',
    'ts-bs-720',
    'ts-bs-900',
    'ts-fs-1080',
    'ts-fs-180',
    'ts-fs-360',
    'ts-fs-540',
    'ts-fs-720',
    'ts-fs-900',
    'ts-half-cab-roll',
    'ts-railey',
    'tweetie-dick',
    'underwhirly',
    'whirly-bird',
    'whirly-dick',
    'wrapped'
  ]) as s
  where not exists (select 1 from figures f where f.slug = s);
  if missing is not null then
    raise exception 'slugs introuvables dans figures : %', missing;
  end if;
end
$guard$;

update figures set
  description    = $wr$Double Hinterberger : un railey avec un FS 720° olé. Deux rotations frontside avec le palonnier au-dessus de la tête.$wr$
where slug = '118';

update figures set
  description    = $wr$Un railey avec un FS 360° et un passage de palonnier. Combine l'extension superman du railey avec une rotation complète.$wr$
where slug = '313';

update figures set
  description    = $wr$Un 313 (railey + FS 360° avec passage de palonnier) suivi d'un rewind BS 180° : on inverse le sens de rotation en gardant le palonnier.$wr$
where slug = '313-rewind';

update figures set
  description    = $wr$Un railey avec un FS 540° et un passage de palonnier. Aussi appelé Nickelodeon.$wr$
where slug = '315';

update figures set
  description    = $wr$Un railey avec un FS 720° et un passage de palonnier.$wr$
where slug = '317';

update figures set
  description    = $wr$Un HS Back Roll avec un FS 360° et un passage de palonnier.$wr$
where slug = 'back-mobe';

update figures set
  description    = $wr$Un HS Back Roll avec un FS 540° et un passage de palonnier.$wr$
where slug = 'back-mobe-5';

update figures set
  description    = $wr$Un HS Back Roll avec un FS 720° et un passage de palonnier. Aussi appelé Mobe 7.$wr$
where slug = 'back-mobe-7';

update figures set
  description    = $wr$Un Bell Air avec un BS 360° et un passage de palonnier. Version Bell Air du Moby Dick.$wr$
where slug = 'bell-air-moby-dick';

update figures set
  description    = $wr$Un HS Back Roll avec un BS 360° olé (palonnier au-dessus de la tête). Version olé du KGB.$wr$
where slug = 'big-mac';

update figures set
  description    = $wr$Atterrissage avec le palonnier dans le dos. Le rider complète sa figure en ayant effectué un demi-tour supplémentaire avec le corps, gardant le palonnier derrière le dos à la réception. S'applique principalement aux figures se terminant à 180° de la position de départ (180, wrapped 360, etc.).$wr$
where slug = 'blind';

update figures set
  description    = $wr$Un railey avec un BS 180° pour atterrir blind (palonnier dans le dos).$wr$
where slug = 'blind-judge';

update figures set
  description    = $wr$Version switch du Blind Judge. S'exécute en switch, en approche heelside.$wr$,
  description_en = $wr$Switch version of the Blind Judge. Performed starting switch on a heelside approach.$wr$
where slug = 'blind-jury';

update figures set
  description    = $wr$Un TS Back Roll avec un BS 360° et un passage de palonnier.$wr$
where slug = 'blind-pete';

update figures set
  description    = $wr$Version switch du Pete Rose. S'exécute en switch, en approche toeside.$wr$,
  description_en = $wr$Switch version of Pete Rose. Performed starting switch on a toeside approach.$wr$
where slug = 'blind-pete-rose';

update figures set
  description    = $wr$Un railey avec un BS 360° et un passage de palonnier. Version backside du 313.$wr$
where slug = 'bs-313';

update figures set
  description    = $wr$Un BS 313 (railey + BS 360° avec passage de palonnier) suivi d'un rewind FS 180°.$wr$
where slug = 'bs-313-rewind';

update figures set
  description    = $wr$Un railey avec un BS 540° et un passage de palonnier.$wr$
where slug = 'bs-315';

update figures set
  description    = $wr$Railey avec un BS 720° et un passage de palonnier. Variante backside du 317.$wr$
where slug = 'bs-317';

update figures set
  description    = $wr$Un Front Roll avec un FS 360° et un passage de palonnier.$wr$
where slug = 'crow-mobe';

update figures set
  description    = $wr$Un Front Roll avec un FS 540° et un passage de palonnier.$wr$
where slug = 'crow-mobe-5';

update figures set
  description    = $wr$Un Front Roll avec un FS 720° et un passage de palonnier.$wr$
where slug = 'crow-mobe-7';

update figures set
  description    = $wr$Back roll avec deux rotations complètes nose-over-tail en approche heelside.$wr$
where slug = 'double-backroll';

update figures set
  description    = $wr$Un railey avec un BS 720° olé. Deux rotations BS avec le palonnier au-dessus de la tête.$wr$
where slug = 'double-s-bend';

update figures set
  description    = $wr$Double HS Back Roll (double tantrum) : deux rotations nose-over-tail backflip en approche heelside.$wr$,
  description_en = $wr$A double heelside backflip (double tantrum): two nose-over-tail backflip rotations on a heelside approach.$wr$
where slug = 'double-tantrum';

update figures set
  description    = $wr$Double HS Back Roll (double tantrum) avec un BS 180 : deux rotations nose-over-tail backflip en approche heelside.$wr$,
  description_en = $wr$A double heelside backflip (double tantrum) with a BS 180: two nose-over-tail backflip rotations on a heelside approach.$wr$
where slug = 'double-tantrum-to-blind';

update figures set
  description    = $wr$Double TS backflip (tantrum)$wr$,
  description_en = $wr$Double TS backflip (tantrum)$wr$
where slug = 'double-ts-back-roll';

update figures set
  description    = $wr$Un Front Roll avec un BS 360° et un passage de palonnier.$wr$
where slug = 'dum-dum';

update figures set
  description    = $wr$Un Front Roll avec un BS 540° et un passage de palonnier.$wr$
where slug = 'dum-dum-5';

update figures set
  description    = $wr$Version switch du Slim Chance. S'exécute en switch, en approche heelside.$wr$,
  description_en = $wr$Switch version of Slim Chance. Performed starting switch on a heelside approach.$wr$
where slug = 'fat-chance';

update figures set
  description    = $wr$Un Front Flip avec un BS 360° et un passage de palonnier.$wr$
where slug = 'front-blind-mobe';

update figures set
  description    = $wr$Version switch du Roll to Revert. S'exécute en switch, en approche heelside.$wr$,
  description_en = $wr$Switch version of Roll to Revert. Performed starting switch on a heelside approach.$wr$
where slug = 'half-cab-roll';

update figures set
  description    = $wr$Version switch du Front Flip to Blind. S'exécute en switch, en approche heelside.$wr$,
  description_en = $wr$Switch version of Front Flip to Blind. Performed starting switch on a heelside approach.$wr$
where slug = 'hassle-hoff';

update figures set
  description    = $wr$Un S-Bend avec un BS 360° et un passage de palonnier.$wr$
where slug = 'heart-attack';

update figures set
  description    = $wr$Un S-Bend avec un BS 540° et un passage de palonnier. On exécute l'axe du S-Bend puis un passage backside tardif.$wr$
where slug = 'heart-attack-5';

update figures set
  description    = $wr$Un railey avec un FS 360° et le palonnier au-dessus de la tête (olé frontside). Variante frontside du S-Bend.$wr$
where slug = 'hinterberger';

update figures set
  description    = $wr$Trois rotations backside complètes (1080°) en approche heelside.$wr$,
  description_en = $wr$Three full backside rotations (1080°) on a heelside approach.$wr$
where slug = 'hs-bs-1080';

update figures set
  description    = $wr$Rotation backside de 180° en approche heelside. Le rider tourne en regardant d'abord vers l'extérieur (dos à la ligne) pour atterrir en switch.$wr$,
  description_en = $wr$Backside 180° rotation on a heelside approach. The rider turns first facing away from the line to land switch.$wr$
where slug = 'hs-bs-180';

update figures set
  description    = $wr$Rotation backside de 360° en approche heelside avec passage de palonnier.$wr$,
  description_en = $wr$Backside 360° rotation on a heelside approach with handle pass.$wr$
where slug = 'hs-bs-360';

update figures set
  description    = $wr$Rotation backside de 540° en approche heelside avec passage de palonnier.$wr$,
  description_en = $wr$Backside 540° rotation on a heelside approach with handle pass.$wr$
where slug = 'hs-bs-540';

update figures set
  description    = $wr$Double rotation backside complète (720°) en approche heelside.$wr$,
  description_en = $wr$Double backside full rotation (720°) on a heelside approach.$wr$
where slug = 'hs-bs-720';

update figures set
  description    = $wr$Deux rotations et demie backside (900°) en approche heelside.$wr$,
  description_en = $wr$Two and a half backside rotations (900°) on a heelside approach.$wr$
where slug = 'hs-bs-900';

update figures set
  description    = $wr$Trois rotations frontside complètes (1080°) en approche heelside.$wr$,
  description_en = $wr$Three full frontside rotations (1080°) on a heelside approach.$wr$
where slug = 'hs-fs-1080';

update figures set
  description    = $wr$Rotation frontside de 180° en approche heelside. La plus accessible des rotations : le rider prend une coupe côté talons et effectue un demi-tour en regardant vers la ligne pour atterrir en switch.$wr$,
  description_en = $wr$Frontside 180° rotation on a heelside approach. The most accessible rotation: edge in on your heels and complete a half turn facing the line to land switch.$wr$
where slug = 'hs-fs-180';

update figures set
  description    = $wr$Rotation frontside de 360° en approche heelside avec passage de palonnier. Tour complet en regardant vers la ligne.$wr$,
  description_en = $wr$Frontside 360° rotation on a heelside approach with handle pass. Full rotation facing the line.$wr$
where slug = 'hs-fs-360';

update figures set
  description    = $wr$Rotation frontside de 540° en approche heelside : une rotation et demie avec passage de palonnier. Cap important dans la progression.$wr$,
  description_en = $wr$Frontside 540° rotation on a heelside approach: one and a half rotations with handle pass. A real milestone.$wr$
where slug = 'hs-fs-540';

update figures set
  description    = $wr$Double rotation frontside complète (720°) en approche heelside. Requiert hauteur maximale et double passage de palonnier.$wr$,
  description_en = $wr$Double frontside full rotation (720°) on a heelside approach. Requires maximum height and double handle pass.$wr$
where slug = 'hs-fs-720';

update figures set
  description    = $wr$Deux rotations et demie frontside (900°) en approche heelside.$wr$,
  description_en = $wr$Two and a half frontside rotations (900°) on a heelside approach.$wr$
where slug = 'hs-fs-900';

update figures set
  description    = $wr$Main avant sur la carre toeside près du nose, bras avant passant derrière le genou avant. Le tweaking tire le nose vers l'épaule, donnant une silhouette très stylée.$wr$,
  description_en = $wr$Front hand on the toeside edge near the nose, front arm threading behind the front knee. The tweak pulls the nose toward the shoulder for a very stylish silhouette.$wr$
where slug = 'japan';

update figures set
  description    = $wr$Un HS Back Roll avec un BS 360° et un passage de palonnier.$wr$
where slug = 'kgb';

update figures set
  description    = $wr$Un HS Back Roll avec un BS 540° et un passage de palonnier.$wr$
where slug = 'kgb-5';

update figures set
  description    = $wr$Un Tantrum avec un BS 360° et un passage de palonnier.$wr$
where slug = 'moby-dick';

update figures set
  description    = $wr$Un Tantrum avec un BS 540° et un passage de palonnier.$wr$
where slug = 'moby-dick-5';

update figures set
  description    = $wr$Un Tantrum avec un BS 720° et un passage de palonnier.$wr$
where slug = 'moby-dick-7';

update figures set
  description    = $wr$Passage du palonnier au-dessus de la tête en cours de figure. La main directrice relâche le palonnier, qui passe au-dessus de la tête du rider, puis est rattrapé de l'autre côté. Ce geste permet d'ajouter une rotation supplémentaire sans que la corde ne se tende. Utilisé dans le Whirly Bird, le Moby Dick, le Tweetie…$wr$
where slug = 'ole';

update figures set
  description    = $wr$Un TS Back Roll avec un FS 360° et un passage de palonnier.$wr$
where slug = 'pete-rose';

update figures set
  description    = $wr$Un TS Back Roll avec un FS 540° et un passage de palonnier.$wr$
where slug = 'pete-rose-5';

update figures set
  description    = $wr$Un TS Back Roll avec un FS 720° et un passage de palonnier.$wr$
where slug = 'pete-rose-7';

update figures set
  description    = $wr$Technique de rotation inversée appliquée aux spins : le rider initie une rotation dans un sens, puis renverse le mouvement en sens contraire en plein air. Un Rewind 360 consiste par exemple à amorcer un FS 540 avant de revenir en BS 180, terminant avec un net 360° mais avec un changement de direction spectaculaire. Requiert un excellent timing, de la hauteur et une très bonne maîtrise des spins de base.$wr$,
  description_en = $wr$Reverse rotation technique applied to spins: the rider initiates a rotation in one direction, then reverses mid-air. A Rewind 360, for example, starts as a FS 540 before reversing BS 180, resulting in a net 360° but with a dramatic direction change. Requires excellent timing, height, and strong mastery of base spins.$wr$
where slug = 'rewind';

update figures set
  description    = $wr$Un railey avec un BS 360° olé (palonnier au-dessus de la tête en rotation backside).$wr$
where slug = 'rubber-chicken';

update figures set
  description    = $wr$Un railey où le rider effectue un BS 360° avec le palonnier au-dessus de la tête (olé). Figure emblématique du wakeboard.$wr$,
  description_en = $wr$A railey where the rider does a BS 360° with the handle above their head (ole). Iconic wakeboard trick.$wr$
where slug = 's-bend';

update figures set
  description    = $wr$Un S-Bend avec un FS 360° et un passage de palonnier.$wr$
where slug = 's-mobe';

update figures set
  description    = $wr$Un S-Bend avec un FS 540° et un passage de palonnier.$wr$
where slug = 's-mobe-5';

update figures set
  description    = $wr$Un S-Mobe (S-Bend + FS 360° avec passage de palonnier) suivi d'un rewind BS 180°.$wr$
where slug = 's-mobe-rewind';

update figures set
  description    = $wr$Version switch du Roll to Blind. S'exécute en switch, en approche heelside.$wr$,
  description_en = $wr$Switch version of Roll to Blind. Performed starting switch on a heelside approach.$wr$
where slug = 'skeletor';

update figures set
  description    = $wr$Version switch du 90210 (TS Railey FS 360°). S'exécute en switch, en approche toeside.$wr$,
  description_en = $wr$Switch version of the 90210 (TS Railey FS 360°). Performed starting switch on a toeside approach.$wr$
where slug = 'skud';

update figures set
  description    = $wr$Un Front Flip avec un FS 360° et un passage de palonnier. Aussi appelé Phat Chance.$wr$
where slug = 'slim-chance';

update figures set
  description    = $wr$Un Front Flip avec un FS 540° et un passage de palonnier. Aussi appelé Front Mobe 5.$wr$
where slug = 'slim-chance-5';

update figures set
  description    = $wr$Version switch du Crow Mobe. Un Front Roll avec un FS 360° et un passage de palonnier. S'exécute en switch, en approche toeside.$wr$,
  description_en = $wr$Switch version of the Crow Mobe. A Front Roll with a FS 360° handle pass. Performed starting switch on a toeside approach.$wr$
where slug = 'squeezer';

update figures set
  description    = $wr$Version switch du Crow Mobe 5. S'exécute en switch, en approche toeside.$wr$,
  description_en = $wr$Switch version of the Crow Mobe 5. Performed starting switch on a toeside approach.$wr$
where slug = 'squeezer-5';

update figures set
  description    = $wr$Heelside backflip : saut périlleux arrière en approche HS. Le rider prend une coupe côté talons et bascule en arrière. L'une des premières inverts apprises.$wr$,
  description_en = $wr$Heelside backflip: backward flip on HS approach. The rider edges in on their heels and falls back. One of the first inverts to learn.$wr$
where slug = 'tantrum';

update figures set
  description    = $wr$Un Front Roll avec un BS 180° et un passage de palonnier.$wr$
where slug = 'tootsie';

update figures set
  description    = $wr$Un railey en toeside avec un FS 360° et un passage de palonnier, aussi appelé 90210 (90 to 10). Version toeside du 313 : décollage toeside, extension superman et rotation complète. Aussi appelé Skud en switch.$wr$
where slug = 'ts-313';

update figures set
  description    = $wr$Un railey en toeside avec un FS 540° et un passage de palonnier. Version toeside du 315 : décollage toeside et rotation complète.$wr$
where slug = 'ts-315';

update figures set
  description    = $wr$Backflip en approche toeside (saut périlleux arrière, principalement sur kicker). Roue inverse depuis la carre orteils.$wr$,
  description_en = $wr$Backflip on a toeside approach (backward flip, mainly off a kicker). Reverse wheel off the toeside edge.$wr$
where slug = 'ts-back-roll';

update figures set
  description    = $wr$Rotation backside de 180° en approche toeside. Le rider prend une coupe côté orteils et tourne backside pour atterrir en switch.$wr$,
  description_en = $wr$Backside 180° rotation on a toeside approach. The rider edges in on their toes and turns backside to land switch.$wr$
where slug = 'ts-bs-180';

update figures set
  description    = $wr$Un railey en toeside avec un BS 360° et un passage de palonnier. Version toeside du BS 313 : décollage toeside et rotation complète.$wr$
where slug = 'ts-bs-313';

update figures set
  description    = $wr$Rotation backside de 360° en approche toeside avec passage de palonnier.$wr$,
  description_en = $wr$Backside 360° rotation on a toeside approach with handle pass.$wr$
where slug = 'ts-bs-360';

update figures set
  description    = $wr$Rotation backside de 540° en approche toeside avec passage de palonnier.$wr$,
  description_en = $wr$Backside 540° rotation on a toeside approach with handle pass.$wr$
where slug = 'ts-bs-540';

update figures set
  description    = $wr$Double rotation backside complète (720°) en approche toeside. Requiert hauteur maximale et double passage de palonnier.$wr$,
  description_en = $wr$Double backside full rotation (720°) on a toeside approach. Requires maximum height and double handle pass.$wr$
where slug = 'ts-bs-720';

update figures set
  description    = $wr$Deux rotations et demie backside (900°) en approche toeside.$wr$,
  description_en = $wr$Two and a half backside rotations (900°) on a toeside approach.$wr$
where slug = 'ts-bs-900';

update figures set
  description    = $wr$Trois rotations frontside complètes (1080°) en approche toeside.$wr$,
  description_en = $wr$Three full frontside rotations (1080°) on a toeside approach.$wr$
where slug = 'ts-fs-1080';

update figures set
  description    = $wr$Rotation frontside de 180° en approche toeside. Le rider prend une coupe côté orteils et tourne frontside pour atterrir en switch.$wr$,
  description_en = $wr$Frontside 180° rotation on a toeside approach. The rider edges in on their toes and turns frontside to land switch.$wr$
where slug = 'ts-fs-180';

update figures set
  description    = $wr$Rotation frontside de 360° en approche toeside avec passage de palonnier.$wr$,
  description_en = $wr$Frontside 360° rotation on a toeside approach with handle pass.$wr$
where slug = 'ts-fs-360';

update figures set
  description    = $wr$Rotation frontside de 540° en approche toeside avec passage de palonnier.$wr$,
  description_en = $wr$Frontside 540° rotation on a toeside approach with handle pass.$wr$
where slug = 'ts-fs-540';

update figures set
  description    = $wr$Rotation frontside de 720° en approche toeside avec passage de palonnier.$wr$,
  description_en = $wr$Frontside 720° rotation on a toeside approach with handle pass.$wr$
where slug = 'ts-fs-720';

update figures set
  description    = $wr$Deux rotations et demie frontside (900°) en approche toeside.$wr$,
  description_en = $wr$Two and a half frontside rotations (900°) on a toeside approach.$wr$
where slug = 'ts-fs-900';

update figures set
  description    = $wr$Version switch du TS Roll to Revert. S'exécute en switch, en approche toeside.$wr$,
  description_en = $wr$Switch version of TS Roll to Revert. Performed starting switch on a toeside approach.$wr$
where slug = 'ts-half-cab-roll';

update figures set
  description    = $wr$Railey effectué en approche toeside. Plus difficile que le railey heelside.$wr$,
  description_en = $wr$Railey performed on a toeside approach. Harder than the heelside railey.$wr$
where slug = 'ts-railey';

update figures set
  description    = $wr$Un Tweetie avec un BS 360° et un passage de palonnier$wr$
where slug = 'tweetie-dick';

update figures set
  description    = $wr$Un HS Back Roll avec un FS 360° olé (palonnier au-dessus de la tête). Version olé du Back Mobe mais avec la rotation d'un whirlybird : on amorce la rotation du half cab roll, puis on envoie le palonnier en travers du visage jusque derrière la tête (l'olé du whirly), ce qui fait fouetter la corde sur toute la rotation, réception toeside. Version « under » du whirly, sur base de roll plutôt que de tantrum.$wr$
where slug = 'underwhirly';

update figures set
  description    = $wr$Un Tantrum avec un BS 360° olé (palonnier au-dessus de la tête). Version olé du Moby Dick.$wr$
where slug = 'whirly-bird';

update figures set
  description    = $wr$Un Whirly Bird avec un BS 360° et un passage de palonnier.$wr$
where slug = 'whirly-dick';

update figures set
  description    = $wr$Position dans laquelle le rider passe le palonnier dans le dos avant de déclencher une figure ou d'aborder une feature. Le bras arrière passe derrière le dos pour saisir le palonnier côté opposé, enroulant la corde autour du corps. Cette position facilite certaines rotations et est la base de l'osmosis.$wr$
where slug = 'wrapped';

-- contrôle : plus aucun terme bateau ni scorie de formatage
select slug,
       description    ~* '\mwake\M(?!\s*park)|vague|\mcorde\M|\mhandle\M|\mboard\M' as fr_ko,
       description_en ~* '\mwake\M(?!\s*park)|\mrope\M'                                as en_ko,
       (description like '%  %' or description like E'%\n%')                              as fr_format_ko
from figures
where slug in ('118', '313', '313-rewind', '315', '317', 'back-mobe', 'back-mobe-5', 'back-mobe-7', 'bell-air-moby-dick', 'big-mac', 'blind', 'blind-judge', 'blind-jury', 'blind-pete', 'blind-pete-rose', 'bs-313', 'bs-313-rewind', 'bs-315', 'bs-317', 'crow-mobe', 'crow-mobe-5', 'crow-mobe-7', 'double-backroll', 'double-s-bend', 'double-tantrum', 'double-tantrum-to-blind', 'double-ts-back-roll', 'dum-dum', 'dum-dum-5', 'fat-chance', 'front-blind-mobe', 'half-cab-roll', 'hassle-hoff', 'heart-attack', 'heart-attack-5', 'hinterberger', 'hs-bs-1080', 'hs-bs-180', 'hs-bs-360', 'hs-bs-540', 'hs-bs-720', 'hs-bs-900', 'hs-fs-1080', 'hs-fs-180', 'hs-fs-360', 'hs-fs-540', 'hs-fs-720', 'hs-fs-900', 'japan', 'kgb', 'kgb-5', 'moby-dick', 'moby-dick-5', 'moby-dick-7', 'ole', 'pete-rose', 'pete-rose-5', 'pete-rose-7', 'rewind', 'rubber-chicken', 's-bend', 's-mobe', 's-mobe-5', 's-mobe-rewind', 'skeletor', 'skud', 'slim-chance', 'slim-chance-5', 'squeezer', 'squeezer-5', 'tantrum', 'tootsie', 'ts-313', 'ts-315', 'ts-back-roll', 'ts-bs-180', 'ts-bs-313', 'ts-bs-360', 'ts-bs-540', 'ts-bs-720', 'ts-bs-900', 'ts-fs-1080', 'ts-fs-180', 'ts-fs-360', 'ts-fs-540', 'ts-fs-720', 'ts-fs-900', 'ts-half-cab-roll', 'ts-railey', 'tweetie-dick', 'underwhirly', 'whirly-bird', 'whirly-dick', 'wrapped')
order by fr_ko desc, en_ko desc, slug;

commit;  -- ou rollback;
