# Vocabulaire d'atomes JIB — à valider

But : la liste canonique des « atomes » d'une passe jib. Sert au **compositeur**
(`src/lib/normalizeJib.js`) et, plus tard, à la **grammaire** du recognizer contraint.

**Comment corriger** : garder / virer / corriger chaque ligne, et surtout **ajouter
ce qui manque**. Une ligne = un atome. Les `(…)` sont juste des variantes STT vues
(indicatif, pas à maintenir).

**Conventions tranchées** : approches/directions en abréviations `HS/TS/FS/BS` ·
slides **collés** (`backlip`, `boardslide`) · presses **séparées** (`nose press`) ·
tricks nommés **capitalisés** (`Tantrum`).

---

## 1. Structure (mots de slot)

- entrée
- sortie
- in
- out
- re-entry
- transfert
- to
- over
- gap
- par-dessus

## 2. Approches / sens de rotation

- HS  (heelside)
- TS  (toeside)
- FS  (frontside)
- BS  (backside)

## 3. Rotations

- 90
- 180
- 270
- 360
- 450
- 540
- 630
- 720
- 900
- 1080

Convention parlée (chiffres → degrés) :
- 1 → 180
- 2-7 → 270
- 3-6 → 360
- 3 → 360
- 4-5 → 450
- 5-4 → 540
- 5 → 540
- 6-3 → 630
- 7-20 → 720
- 7 → 720
- 9 → 900

## 4. Slides (le cœur)

- 50-50
- frontboard
- boardslide
- frontlip
- backlip
- nose press
- tail press
- press
- FS boardslide    (seated)
- BS boardslide    (seated)

Convention parlée :
- backside boardslide → boardslide
- backside board → boardslide
- frontside boardslide → frontboard
- frontside board → frontboard
- backside lipslide → backlip
- backside lip → backlip
- frontside lipslide → frontlip
- frontside lip → frontlip

## 5. Modifiers de slide

- rail to rail
- rail to rail to rail
- to rail
- hardway
- wrapped
- pretzel
- blind
- tap
- switch
- fakie

## 6. Famille ollie

- ollie on
- to ollie
- ollie

## 7. Grabs

Grammaire : `<nom>` seul, `<nom> grab`, ou `grab <nom>` → canonique **`<nom> grab`**.
(nose/tail : le mot « grab » est exigé, sinon collision avec nose press / tail press.)
Liste tirée de la base `figures` (catégorie grabs) :

- melon
- indy
- mute
- method
- stalefish
- slob
- crail
- japan
- tindy
- tailfish
- nuclear
- chicken salad
- roast beef
- seat belt
- nose grab
- tail grab

## 8. Tricks nommés (sur transfert / gap)

- Tantrum
- Mexican Roll
- Shove-it       (wakeskate)
- Kickflip       (wakeskate)
- Body Varial    (wakeskate)

---

## Questions à trancher (réponds en clair)

**1. Slides manquants ?** (noseslide / tailslide / lipslide / bluntslide / board to blunt / disaster / noseblunt …)
> non c'est bon j'ai complété déjà

**2. Grabs sur jib** : on liste plusieurs grabs, ou c'est marginal et on garde juste melon grab ?
> tous les grabs

**3. Après un `transfert` / `gap`, le rider peut-il faire N'IMPORTE QUEL air-trick ?** (« transfert tantrum », « transfert moby dick »…)
Si oui → le slot « trick » du jib réutilise tout le vocabulaire air (rien à re-lister).
> oui, c'est possible qu'il y ai un kicker en entrée d'un module ou sur le côté donc potentiellement tous les tricks de kicker permettent de retomber sur/dans le module ou de passer par-dessus. A ce jour en compétition les figures de air tricks sont interdites en entrées de module donc pour l'instant pas possible, mais peut être un jour, on modifiera assez simplement à ce moment là

**4. Rotations** : plafond réaliste en jib (630 ? plus ?) et `180` se dit-il toujours « 1 » à l'oral ?
> non, j'ai mis à jour mais c'est possible qu'il y ai un kicker en entrée d'un module donc potentiellement tous les tricks de kicker permettent de retomber sur/dans le module ou de passer par-dessus, pareil que la question précédente, et donc toutes les rotations (même si plus de 720 en jib c'est très rare)
> Le 180 généralement se dit 180 ("cent quatre vingt") ou 1 ("un"), le 1 la plupart du temps c'est quand c'est en rotation backside. Le "back 1" est le plus courant.

**5. Modifiers manquants ?** (switch / fakie / to fakie / pop out / tap …)
> j'ai corrigé la liste

**6. `press` générique** : on le garde comme atome distinct de `nose press` / `tail press`, ou il disparaît ?
> je l'ai gardé, possible que certain.e.s juges ne précisent pas donc ne pas l'exclure