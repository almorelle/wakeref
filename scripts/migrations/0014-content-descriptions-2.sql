-- WakeRef — descriptions : correctifs restants
-- Généré le 2026-09-04. À relire, puis appliquer dans l'éditeur SQL Supabase.
--
-- Complète le 0013, qui n'avait touché que les descriptions porteuses de
-- vocabulaire bateau. Corrige ici, sur les fiches restantes :
--   * « cable » sans accent circonflexe (fiches seated)
--   * « charger » impropre : bell-air, press
--   * « appel », terme ambigu jamais défini dans l'app : hardway
--   * orthographe et casse : Frontroll, approche Heelside, wrapé, rotaté
--   * « Jump » laissé en anglais : gap, transfer
--   * points finaux manquants et une rotation à la formulation isolée
--   * deux erreurs de traduction : bell-air (« loads heelside ») et
--     ben-air-tootsie-rewind, dont l'anglais avait perdu le mot « rewind »
--
-- Non corrigés volontairement, à arbitrer : « front binding » / « back binding »
-- (crail, method, nuclear, seat-belt, tailfish) coexistent avec « pied avant »
-- ailleurs ; « la board » reste en français comme convenu.

begin;

do $guard$
declare missing text;
begin
  select string_agg(s, ', ') into missing
  from unnest(array[
    'back-roll',
    'bell-air',
    'ben-air-tootsie-rewind',
    'double-ts-back-roll',
    'gap',
    'hardway',
    'krypt',
    'mexican-roll',
    'mexican-roll-to-revert',
    'press',
    'railey',
    'roast-beef',
    'seated-bs-180',
    'seated-bs-360',
    'seated-bs-540',
    'seated-bs-shifty',
    'seated-fakie-bs-180',
    'seated-fakie-fs-180',
    'seated-fs-180',
    'seated-fs-360',
    'seated-fs-540',
    'seated-fs-shifty',
    'transfer',
    'ts-bs-1080',
    'ts-krypt',
    'tweetie-dick',
    'underflip',
    'underflip-rewind',
    'ws-pop-shuvit'
  ]) as s
  where not exists (select 1 from figures f where f.slug = s);
  if missing is not null then
    raise exception 'slugs introuvables dans figures : %', missing;
  end if;
end
$guard$;

update figures set
  description    = $wr$Approche heelside où la planche tourne nose over tail en cartwheel latéral (roue inverse, axe de rotation perpendiculaire aux épaules). Différent du tantrum car la rotation est plus latérale.$wr$,
  description_en = $wr$Heelside approach where the board rotates nose over tail in a lateral cartwheel (reverse wheel, rotation axis perpendicular to shoulders). Different from tantrum as rotation is more lateral.$wr$
where slug = 'back-roll';

update figures set
  description    = $wr$Backflip heelside effectué en quittant l'eau sur la carre toeside (contre-carre). Variante du Tantrum où le rider appuie côté talons mais décolle sur la carre opposée, créant une rotation différente.$wr$,
  description_en = $wr$Heelside backflip performed by leaving the water on the toeside edge (opposite edge). Tantrum variant where the rider edges in on their heels but takes off on the opposite edge, creating a different rotation.$wr$
where slug = 'bell-air';

update figures set
  description    = $wr$Un Ben Air avec un BS 180° suivi d'un rewind BS 180°.$wr$,
  description_en = $wr$A Ben Air with a BS 180° followed by a BS 180° rewind.$wr$
where slug = 'ben-air-tootsie-rewind';

update figures set
  description    = $wr$Double TS backflip (tantrum).$wr$,
  description_en = $wr$Double TS backflip (tantrum).$wr$
where slug = 'double-ts-back-roll';

update figures set
  description    = $wr$Saut depuis un rail vers le même rail en sautant par-dessus un espace vide.$wr$,
  description_en = $wr$A jump from a rail back onto the same rail, clearing a gap.$wr$
where slug = 'gap';

update figures set
  description    = $wr$Approche d'un slide dans le sens le moins naturel pour la rotation. Là où un BS Boardslide s'effectue côté heelside, le hardway l'aborde côté toeside — et inversement pour les autres slides. Le déclenchement de la rotation est inversé, ce qui demande plus d'engagement et un timing précis.$wr$
where slug = 'hardway';

update figures set
  description    = $wr$Un railey avec un FS 180° pour atterrir en switch. Figure très stylée combinant la puissance du railey avec une rotation frontside.$wr$
where slug = 'krypt';

update figures set
  description    = $wr$Front roll sur kicker en approche heelside avec une rotation heel edge over toe edge.$wr$,
  description_en = $wr$A heelside front roll off the kicker with heel-edge-over-toe-edge rotation.$wr$
where slug = 'mexican-roll';

update figures set
  description    = $wr$Front roll sur kicker en approche heelside avec une rotation heel edge over toe edge et un FS 180°.$wr$,
  description_en = $wr$A heelside front roll off the kicker with heel-edge-over-toe-edge rotation and a FS 180°. Can easily be mistaken for a Half Cab Roll.$wr$
where slug = 'mexican-roll-to-revert';

update figures set
  description    = $wr$Figure de jib où le rider met le poids sur le nose (nose press) ou le tail (tail press) de la planche pour faire pivoter l'autre extrémité vers le haut. Se fait sur rail ou box, souvent en combinaison avec d'autres slides.$wr$
where slug = 'press';

update figures set
  description    = $wr$Approche heelside où la planche est projetée derrière le rider au-dessus de la tête dans un style superman. La corde tire le rider en extension complète. Figure fondamentale pour toute la famille railey.$wr$,
  description_en = $wr$Heelside approach where the board is thrown behind the rider above the head in superman style. The rope pulls the rider into full extension. Foundation for the entire railey family.$wr$
where slug = 'railey';

update figures set
  description    = $wr$Main arrière sur la carre heelside entre les deux pieds, coude pointant vers la carre heelside.$wr$,
  description_en = $wr$Back hand on the heelside edge between both feet, elbow pointing toward the heelside edge.$wr$
where slug = 'roast-beef';

update figures set
  description    = $wr$Demi-tour backside : la rotation s'amorce en tournant le dos au câble. Entrée de face, sortie en fakie (blind).$wr$
where slug = 'seated-bs-180';

update figures set
  description    = $wr$Tour complet backside, rotation amorcée dos au câble. Entrée et sortie de face.$wr$
where slug = 'seated-bs-360';

update figures set
  description    = $wr$Tour et demi backside, rotation amorcée dos au câble. Entrée de face, sortie en fakie (blind).$wr$
where slug = 'seated-bs-540';

update figures set
  description    = $wr$Au-dessus du kicker, rotation de 90° backside du bas du corps puis retour de face avant la réception. Les épaules restent face au câble.$wr$
where slug = 'seated-bs-shifty';

update figures set
  description    = $wr$Demi-tour backside démarré en fakie (entrée de dos), rotation amorcée dos au câble. Sortie de face.$wr$
where slug = 'seated-fakie-bs-180';

update figures set
  description    = $wr$Demi-tour frontside démarré en fakie (entrée de dos sur l'appui), rotation amorcée face au câble. Sortie de face.$wr$
where slug = 'seated-fakie-fs-180';

update figures set
  description    = $wr$Demi-tour frontside : la rotation s'amorce en tournant face au câble. Entrée de face, sortie en fakie.$wr$
where slug = 'seated-fs-180';

update figures set
  description    = $wr$Tour complet frontside, rotation amorcée face au câble. Entrée et sortie de face.$wr$
where slug = 'seated-fs-360';

update figures set
  description    = $wr$Tour et demi frontside, rotation amorcée face au câble. Entrée de face, sortie en fakie.$wr$
where slug = 'seated-fs-540';

update figures set
  description    = $wr$Au-dessus du kicker, rotation de 90° frontside du bas du corps puis retour de face avant la réception. Les épaules restent face au câble.$wr$
where slug = 'seated-fs-shifty';

update figures set
  description    = $wr$Saut d'une feature à une autre ou d'une partie d'un rail à l'autre.$wr$,
  description_en = $wr$A jump from one feature to another, or from one part of a rail to another.$wr$
where slug = 'transfer';

update figures set
  description    = $wr$Trois rotations backside complètes (1080°) en approche toeside.$wr$,
  description_en = $wr$Three full backside rotations (1080°) on a toeside approach.$wr$
where slug = 'ts-bs-1080';

update figures set
  description    = $wr$Un TS Railey avec un FS 180° pour atterrir en switch. Version toeside du krypt.$wr$
where slug = 'ts-krypt';

update figures set
  description    = $wr$Un Tweetie avec un BS 360° et un passage de palonnier.$wr$
where slug = 'tweetie-dick';

update figures set
  description    = $wr$Front flip wrapped sur kicker : un toeside backside 180 amorcé palonnier déjà passé dans le dos, qui s'enchaîne directement en Mexican roll. Le rider déroule le 180 puis bascule la tête sous l'aisselle pour faire passer la planche par-dessus et réceptionne sur les talons.$wr$
where slug = 'underflip';

update figures set
  description    = $wr$Underflip avec un rewind 180.$wr$,
  description_en = $wr$Underflip with a rewind 180.$wr$
where slug = 'underflip-rewind';

update figures set
  description    = $wr$Ollie avec un shove-it lancé en l'air. Peut être FS ou BS.$wr$
where slug = 'ws-pop-shuvit';

-- contrôle : plus de scorie sur ces fiches
select slug, description, description_en
from figures
where slug in ('back-roll', 'bell-air', 'ben-air-tootsie-rewind', 'double-ts-back-roll', 'gap', 'hardway', 'krypt', 'mexican-roll', 'mexican-roll-to-revert', 'press', 'railey', 'roast-beef', 'seated-bs-180', 'seated-bs-360', 'seated-bs-540', 'seated-bs-shifty', 'seated-fakie-bs-180', 'seated-fakie-fs-180', 'seated-fs-180', 'seated-fs-360', 'seated-fs-540', 'seated-fs-shifty', 'transfer', 'ts-bs-1080', 'ts-krypt', 'tweetie-dick', 'underflip', 'underflip-rewind', 'ws-pop-shuvit')
order by slug;

commit;  -- ou rollback;
