# Module compétition — passation (état figé du proto → port React)

> **But.** Point d'entrée d'un **contexte neuf** qui reprend le module compétition.
> Il gèle les partis pris validés sur le proto (3 onglets) et cadre le port React.
> On ne juge plus l'UX ici : elle est validée. On code.
>
> **Références vivantes**
> - Proto standalone : `proto-assets/competition-module.html` (untracked, jetable, la vérité de l'UX).
> - Artifact publié : https://claude.ai/code/artifact/c00b62ce-67ca-4815-aa79-71d1227eb37f (favicon 🏁).
> - Parcours du juge (Saisie, détaillé) : `proto-assets/judge-saisie-ux-brief.md`.
> - Voix / compositeur jib : mémoire `judging-input-ux-design` + `scripts/jib-atoms.md` + `src/lib/normalizeJib.js`.
> - Vue d'ensemble/diagrammes : `proto-assets/architecture.md`.
>
> Statut à la clôture (2026-07-09) : **UX des 3 onglets validée par Alexis après re-test à froid**
> (deux batches de retours intégrés). Prochaine étape = **port React sous `/competition`**.

---

## 0. Invariants (non négociables — cf. brief §0)

- **Câble uniquement** (wakeboard / wakeskate / assis, téléski). Jamais de vocabulaire bateau.
  Obstacles = kickers / modules / features.
- **Le parcours est un échafaudage, jamais une cage** : il pré-structure la saisie mais ne bloque
  jamais une saisie hors-parcours.
- **Inclusion par remplissage, pas par étiquetage** : la discipline vient du contexte (heat), pas d'un label sur chaque trick.
- **Axe latéral unique = intérieur / extérieur du câble.** JAMAIS gauche/droite absolu (ça s'inverse
  entre brin aller et retour). Le sens du câble mappe int/ext vers la gauche/droite **physique** de l'écran.
- **Note binaire** (rien / tenté / réussi), pas de qualité graduée.

## 0 bis. Terminologie + répartition admin / public (⚠ figée — respecter au port)

- **Onglets = Setup · Heat · Run** (et non Parcours / Poule / Saisie). Le nom du groupe de riders est un
  **heat** (« Nom du heat », « Sauvegarder le heat »).
- **RÉPARTITION DES SURFACES (≠ proto).** Le proto réunit les 3 onglets pour l'itération UX, mais le port
  les **sépare** :
  - **Setup = côté ADMIN** (création/édition d'un parcours par l'organisateur, auth-guardé, sous
    `/admin/...`). Un parcours est un objet persistant + partageable (short-code).
  - **Heat + Run = côté `/competition`** (le juge charge un parcours existant via son code et juge en
    local). Public, lazy, hors Navbar.
  - Cohérent avec l'invariant « **seul le parcours voyage** » : l'admin le définit, les juges le consomment.
- **« Blocage »** = ce qu'on appelait « zone air » : un seau ouvert de tricks, chacun noté int/ext.
  Le libellé UI est **blocage** partout ; l'**identifiant interne reste `type:'air'`** (non renommé dans le code).
- **Module** = kicker ou jib. Un **module** dans le récap = un slot rempli (int et/ou ext).

---

## 1. Modèle de données (le pont vers React + Supabase)

Trois globals de setup + un tableau `parcours` + les runs. C'est ce qu'il faut porter en état React
(store) puis persister (Supabase, pattern `compositions`/`get_composition` : short-code, insert + load public).

### Setup (le « parc »)
- `cableSpin` : `'regular'` (horaire, moteur bas-**gauche**) | `'goofy'` (anti-horaire, moteur bas-**droite**).
- `nbPoulies` : 3–8 (défaut 6). Nombre de poulies **physiques** du câble.
- `poulieStart` : 1..n. Numéro de la **1re poulie du parcours** (rotation des labels).

### `parcours` — suite **ordonnée** de poulies ET de zones (= le chemin tracé sur la boucle)
```
pulley   : { id, type:'pulley', p }              // p auto-calculé, jamais saisi à la main
module   : { id, type:'modules', int, ext }      // int/ext = { kind:'kicker'|'jib', label } | null
air      : { id, type:'air', span }              // « blocage » ; span 1..4 → franchit span+1 poulies
twin     : { id, type:…, passOf:<idParent>, redundant:true, …contenu miroir }  // copie 2e passage
```
- `zonesOnly()` = `parcours` sans les poulies. C'est l'index des lignes de la matrice de heat et la
  source des rows de saisie.
- **Un run = une marche arbitraire sur la boucle** : départ n'importe où (même entre deux poulies),
  arrivée n'importe où, parcours partiel ou > 1 tour. Ce n'est **pas** forcément un tour complet.

### Runs (par rider, par run) — `blankRows()` mappe `zonesOnly()` → rows, clés par `secId`
```
module : { kind:'module', secId, side:'int'|'ext'|null, trick, approach, chips, rate:'ok'|'top'|'bad', rien, draft?, fell?, fallAuto? }
air    : { kind:'air',    secId, airs:[ { name, side, rate, draft? } ] }   // « blocage »
adhoc  : { kind:'adhoc',  side, text, rate, draft? }   // zone hors-parcours insérée en saisie (pas de secId)
```
- `savedRuns` : `[ { name, saved:[bool,bool], score:[…], snap:[…], runs:[rows, rows] } ]`.
- **`side` par défaut** = `singleSide(sec)` : si la zone n'a **qu'un** côté équipé, le côté est **fixé** dès
  `blankRows()` (pas de choix, pas de module inventé de l'autre côté). Deux côtés → `side:null` (choix à la saisie).
- **`draft` (brouillon run 2)** : deux granularités, à respecter :
  - **module / hors-parcours = draft AU NIVEAU DE LA ZONE** (une entrée `draft:true`).
  - **blocage = draft PAR TRICK** (chaque `air` porte son `draft`), pour garder/retirer chacun.
- **`snap`** = `JSON.stringify(runs[ru])` figé à la validation → sert à **dé-valider** (voir §5).
- **Notes** : chaîne libre par run. Conventions spéciales : **`FRS`** (run 2 non amélioré → reprend note
  du run 1), **`DNS`** (Did Not Start → run entier en skip, vaut **0**). `scoreVal()` résout les deux.

---

## 2. Onglet SETUP — décisions figées

- **Layout** : éditeur à gauche, **aperçu live du câble à droite** (encadré « Aperçu du câble », la
  minimap se redessine à chaque édition), + **récap descriptif** dessous : `N zones · M modules ·
  1re poulie Px (si ≠1) · 2e passage ×k`. Sur < 820 px l'aperçu passe sous l'éditeur.
- **Poulies = squelette fixe.** Exactement `nbPoulies` marqueurs, **ni ajout ni suppression manuelle**
  (`syncPoulies()` cale le compte sur `nbPoulies`). Pas de bouton « + Poulie ».
- **Numérotation auto.** Seule la **1re poulie** est éditable (sélecteur → `poulieStart`) ; les autres
  s'enchaînent en cascade avec **wrap après n** (`renumberPoulies()`). **Invariant : poulie n = moteur**,
  où qu'elle tombe dans l'ordre. (Ex. 1re = P3, n=6 → P3, P4, P5, **P6 ⚓**, P1, P2.)
- **Zones** : l'utilisateur les place librement (flèches ▲▼, qui traversent les poulies). Types :
  Section module (int/ext, chaque slot **Kicker | Jib** + label), Blocage (span = « s'étend sur N poulies »).
- **Insertion contextuelle** : une **barre « ＋ Section module · ＋ Blocage » au-dessus de chaque poulie**
  insère la zone **juste avant** cette poulie (`insertZoneAt(idx,type)`). La même barre **après la dernière
  poulie** (`.addSection`, ajoute en fin) — **même format visuel** que les barres inter-poulies.
- **Vider le parcours** : bouton en bas, **confirmation double-clic** (pas de `confirm()` en sandbox) →
  retire **toutes les zones**, garde le squelette de poulies.
- **2e passage = copie liée (automatisme clé).** Cocher « ↺ 2e passage » sur une zone **crée
  automatiquement une copie** (`passOf = idParent`) **tout au bas du parcours**, contenu **miroir**
  (resynchronisé au parent à chaque rendu via `syncTwins()`/`copyZoneContent()`). Décocher / supprimer
  la copie la retire. La copie est une **carte en lecture seule** (déplaçable/supprimable), pas éditable
  directement. Buts : (a) le juge a une **vraie zone à noter** au 2e passage ; (b) la minimap **replie par
  lien** (fiable), plus par correspondance de contenu.

---

## 3. Minimap (la partie géométrique **fine à réutiliser telle quelle**)

`renderMinimap(opt)` — `opt = { el, hdr, cur }`. À porter en composant React (SVG), **ne pas
re-designer** (géométrie validée après plusieurs itérations).

- **Câble** = polygone inscrit dans une **ellipse étirée verticalement** (N=5 → maison, N=6 → hexagone),
  **lignes droites uniquement** (le câble ne fait jamais de courbes). Moteur au **bas**.
- **Sens** : `regular` = horaire (monte à gauche) ; `goofy` = miroir (anti-horaire, monte à droite).
- **Élastique doux** : chaque arête reçoit un secteur d'angle ∝ (BASE + nb de zones) → une ligne chargée
  est un peu plus longue. Sommets sur l'ellipse ⇒ polygone propre, convexe, fermé.
- **Module** = segment coloré sur la corde + **rectangles colorés par TYPE de module**
  (**kicker ambre `#f59e0b` / jib vert `#22c55e`**) ; l'axe **int/ext se lit par la position**
  (rectangle **dedans** la boucle = int, **dehors** = ext). Une zone mixte affiche un rectangle de chaque couleur.
- **Blocage** = bande droite passant par les poulies franchies (span, léger débord).
- **Départ (vert `#34d399`) / arrivée (rouge `#f87171`)** = petits traits perpendiculaires hors boucle,
  avec **anti-collision** (labels séparés si même point). Une **copie 2e passage** n'a pas de géométrie
  propre → on la **résout vers son parent** (`rep()`) pour placer l'arrivée.
- **Repli 2e passage** : les zones `passOf` **ne se dessinent pas**, elles se replient sur leur parent
  (même lieu) → `×N` fiable ; `twinIds` porte aussi les ids pour le highlight « zone courante ».
- **Glow zone courante** (Run) : la zone en cours (`curTop`) est floutée en dessous (`<filter id="curGlow">`).
- Pas de pied de carte texte (retiré).

---

## 4. Onglet RUN (saisie) — cf. brief + deltas session

Le **parcours détaillé** est dans `judge-saisie-ux-brief.md` (à lire en entier). Deltas figés :

- **Nom du rider en LECTURE SEULE** dans Run (édition dans le Heat, cf. §5). Minimap dans un **encadré
  titré « Aperçu du câble »** ; **paire aperçu+cartes centrée ensemble**.
- **Carte de zone** : axe int/ext = liseré coloré + rail physique ; **côté** = 2 gros boutons placés
  gauche/droite selon `cableSpin`. **Côté verrouillé si un seul module** : le côté sans module est
  **désactivé** (rail + flèches ← →), jamais de kicker inventé ; « ← → pour changer de côté » n'apparaît
  que si les deux côtés portent un module.
- **Skip → avance à la zone suivante** automatiquement. Trick dicté **éditable** (textarea autogrow) ;
  **note ancrée en bas** ; blocage **scrollable** ; **insertion hors-parcours** via la barre d'actions.
- **Chute** = fin de run (zones suivantes auto-« rien » via `fallAuto`, annulable).
- **Validation d'un run** → `finalizeRun()` (retire tout brouillon non confirmé) + `snapRun()` +
  **retour automatique au Heat**. `finalizeRun` : blocage → tricks `draft` retirés ; module/hors-parcours
  `draft` → vidé (case non saisie).
- **Run 2 = brouillon repris du run 1**, avec **UI de confirmation UNIFORME** (cohérence exigée) :
  - **module / hors-parcours** : une **carte « ↩ repris du run 1 »** (liseré pointillé violet) avec le
    contenu + **bouton vert « ✓ Valider (idem run 1) »** et ghost **« ✎ Saisir autre chose »** (garde le
    contenu éditable, ne réinitialise pas).
  - **blocage** : confirmation **trick par trick** — chaque trick faded/pointillé + **« ✓ idem »** vert ;
    régler côté/note vaut confirmation ; ✕ retire. Même langage visuel (vert = valider, faded = à confirmer).
- **2e passage** : la copie est une vraie zone en saisie, badgée « ↺ 2e passage ».

---

## 5. Onglet HEAT (résultats) — décisions figées

- **Nom du rider éditable ICI** (input par colonne, se répercute dans les deux tableaux en vue 2 tableaux
  sans re-render). **Ajouter un rider → focus auto** sur son champ nom.
- **Classement live** (chips triés desc, leader doré), **best-of**, **notes /100**.
- **Boutons de note par run** : **FRS** (run 2+) et **DNS** à côté du champ note. Un bouton **« ⚖ Juger ce
  run »** par run ouvre le Run correspondant (en vue compacte, **un bouton par run** : « Juger run 1/2 »,
  pas d'ambiguïté).
- **Matrice** lignes = sections / colonnes = riders. **En-tête gauche** = modules alignés int (haut) /
  ext (bas), slot vide réservé, **pas de numéro de zone** ; labels int/ext **colorés**. **Ligne 2e passage**
  badgée. **Case de la zone de chute = fond rouge léger** + « ⚠ chute » centré.
- **Suppression rider** = **double-clic** (arme puis confirme) + **toast**.
- **Dé-validation** : modifier un run déjà validé le repasse « à valider » (contenu ≠ `snap` → `saved=false`).
- **Sauvegarder le heat** : bouton **désactivé tant que tous les runs ne sont pas notés** (`allScored()` :
  chiffre, FRS ou DNS partout). Action = **placeholder** (persistance à venir, cf. §6).
- Séparateurs de colonnes ; **natural / reverse order** (les deux présents, actif surligné) ; **une seule
  bascule « vue compacte »** (défaut = 2 tableaux) ; « nombre de runs ».

---

## 6. Plan de port React (prochaine étape)

- **Répartition des surfaces (cf. §0 bis)** :
  - **Setup côté ADMIN** — sous `/admin/*` (auth-guardé par `AdminLayout`). C'est là qu'on **crée/édite**
    un parcours (l'éditeur + l'aperçu minimap live). Inclut la **couche gestion des compétitions/parcours**
    (liste / créer / **nom unique** / dupliquer). Le parcours porte un short-code partageable.
  - **Heat + Run côté `/competition`** (+ `/competition/<code>` pour charger un parcours partagé).
    **Lazy, hors Navbar** (comme le labo). Le juge charge un parcours par son code et juge en local.
- Ne pas réutiliser `RunSaisie`/`JibForm` (ceux-là servent Compo/entraînement).
- Cycle de vie `Parcours → Heats → Runs` (voir mémoire `judging-input-ux-design` pt « cycle de vie »).
- **Réutiliser la géométrie minimap** (§3) telle quelle en composant SVG. C'est le morceau à ne pas casser.
- **Persistance** : short-code + autosave local d'abord (IndexedDB), push DB « plus tard » ; pattern
  `compositions` (`get_composition`, RLS public insert + load-by-id, admin list/delete). Seul le
  **parcours** voyage entre devices (pas de sync de saisie multi-juges en v1). Câbler le bouton
  « Sauvegarder le heat » ici.
- **Voix** : brancher le **compositeur `normalizeJib`/`composeJib`** (déjà lib réutilisable) sur le champ
  jib texte-libre de la saisie ; air-tricks = flux modèle maison + matcher (cf. mémoire voix). La
  **grammaire contrainte = structure + rotations seulement** (tricks exclus tant que pas de fine-tune jib).
- **Schéma Supabase** à concevoir : `competitions` / `parcours` (JSONB du tableau + globals) / `heats` /
  `runs` (rows JSONB, scores). S'inspirer de `compositions` (short-code, snapshot JSONB, score dénormalisé).

---

## 7. Limites connues du proto (à traiter au port, pas des bugs à corriger dans le HTML)

- Les runs **déjà saisis** ne se reconstruisent pas quand on ajoute une zone/copie après coup → la case
  reste vide (en réel le parcours se fige avant les runs ; sinon « ajoutée après » = grisé, cf. mémoire).
- Réduire `nbPoulies` retire les poulies **par la fin** → peut ré-accrocher des zones à une autre arête
  (réglage rare, fait une fois).
- Confirmations sandbox-safe (double-clic + toast, pas de `confirm()`/`alert()`).
- Le micro est **simulé** (pioche dans un pool de tricks) ; à remplacer par le vrai pipeline voix au port.
