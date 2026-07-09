# La saisie d'une section jib à la voix — comment ça marche (et pourquoi)

Document pédagogique. Objectif : comprendre de bout en bout la reconnaissance
vocale d'une passe de jib, le rôle de chaque brique, et pourquoi le prochain
chantier (fine-tune jib) est la bonne réponse au dernier problème qui reste.

---

## 0. Le problème

En compétition, un juge dicte à voix haute une **passe de jib** — par exemple :

> « ollie backlip to boardslide 270 out »

Une passe de jib est **compositionnelle** : elle enchaîne librement des *atomes*
de plusieurs familles.

| Famille | Exemples d'atomes |
|---|---|
| structure | `entrée`, `sortie`, `transfert`, `re-entry`, `rail to rail`, `bank`, `curb` |
| approche | `HS`, `TS`, `regular`, `fakie`, `blind` |
| rotation | `180`, `270`, `450`, `630`, `900` (par pas de 90°) |
| slide | `boardslide`, `backlip`, `nose press`, `tail press`, `lip` |
| trick | `ollie`, `scarecrow`, `tantrum`, `mexican roll`, `pretzel`… |
| grab | `melon`, `indy`, `mute`, `method`, `stalefish`… |
| modifier | `to`, `out`, `switch`… |

**On ne peut pas énumérer toutes les combinaisons** (contrairement à la
bibliothèque de tricks du site, qui est une liste finie). Le nombre de passes
possibles est quasi infini. Toute la difficulté est là.

---

## 1. Le pipeline actuel, couche par couche

```
🎤 audio
   │
   ▼
┌─────────────────────────────────────────────┐
│ whisper-small  (+ grammaire contrainte)      │   ← une seule boîte
│ transcrit l'audio en texte, token par token, │
│ en ne pouvant émettre QUE du vocabulaire      │
│ autorisé (structure du jib)                  │
└─────────────────────────────────────────────┘
   │  texte brut (ex: "all e backlip 2 boardslide de set out")
   ▼
┌─────────────────────────────────────────────┐
│ composeur normalizeJib  (+ fuzzy)            │
│ remplace, normalise, réordonne, tolère les   │
│ approximations                               │
└─────────────────────────────────────────────┘
   │
   ▼
texte propre  ("ollie backlip to boardslide 270 out")
```

### 1.1 whisper-small — le transcripteur générique

C'est un modèle de **speech-to-text** (STT) grand public. Il transcrit du
français correctement, mais il **ne connaît pas notre jargon** : « boardslide »,
« deux sept » (= 270), « backlip » lui sont étrangers. Seul, il écorche presque
tout.

### 1.2 La grammaire contrainte — un garde-fou *pendant* le décodage

**Ce n'est pas une étape séparée après whisper.** Elle agit *à l'intérieur* de
whisper, à chaque token généré : elle met à `−∞` la probabilité de tout ce qui
n'est pas un chemin valide du vocabulaire. Résultat : le modèle **ne peut pas
sortir un mot hors-liste**.

Deux points souvent mal compris :

- **Elle est STRICTE, pas « permissive ».** La seule souplesse, c'est qu'une
  passe = `atome*` (n'importe quelle suite d'atomes autorisés, dans n'importe
  quel ordre). Mais chaque atome doit exister dans la grammaire. Elle ne laisse
  jamais passer un intrus.
- **Elle ne contient QUE la structure, PAS les noms de tricks.** On avait
  essayé d'y mettre les 74 tricks kicker → ça a *empoisonné* whisper-small
  (`scarecrow → slob`, `toeside → skeletor`). Donc aujourd'hui la grammaire =
  rotations + structure + approches + slides + grabs. Les noms de tricks en sont
  **volontairement absents**. → c'est le « trou », voir §3.

> ⚠️ Ce que la grammaire garantit : la sortie est *dans* le vocabulaire.
> Ce qu'elle ne garantit pas : que ce soit le *bon* mot du vocabulaire. Si
> l'acoustique de whisper est mauvaise, il choisira le mauvais mot valide (le
> plus proche *pour lui*). D'où `scarecrow → slob` : les deux sont dans le
> vocab, il prend le plus proche acoustiquement.

### 1.3 Le composeur `normalizeJib` — nettoyage et normalisation

Il agit **sur le texte** (après whisper). Trois rôles :

1. **Remplacements** (façon `sed`) : `all e → ollie`, `de set → 270`,
   `2 → to`…
2. **Normalisation canonique** : quelle que soit la prononciation ou l'ordre,
   `270 frontside` = `front 270` = `deux sept devant` → toujours **`FS 270`**.
3. **Assemblage par slots** : recolle direction + rotation adjacentes.

### 1.4 Le fuzzy — la tolérance

Par-dessus les remplacements, une recherche approchante (distance de Levenshtein
≤ 1) : un mot légèrement déformé est rattaché à l'atome le plus proche. C'est ce
qui absorbe les petites variations de transcription.

### 1.5 Le VOCAB — la colonne vertébrale

Tout ça est piloté par **une seule table `VOCAB`** (atomes + variantes +
aliases). Le même VOCAB nourrit le composeur, la grammaire, le matcher des
tricks isolés, et bientôt les labels du fine-tune jib. **Ajouter un atome =
une ligne**, et toutes les briques en profitent.

---

## 2. Les deux modèles maison — même technique, datasets différents

C'est le point qui prête le plus à confusion. Il y a (ou aura) **deux modèles
fine-tunés distincts** :

| | Fine-tune **tricks** (existe) | Fine-tune **jib** (à venir) |
|---|---|---|
| Socle | whisper-**base** | whisper-**small** |
| Dataset | tricks **isolés** (`audio → 1 nom de trick`) | **passes entières** (`audio → texte de la passe`) |
| Comportement | *de facto* classifieur mono-trick | transcripteur compositionnel |
| Usage | saisie unitaire air / kicker / flat | saisie d'une passe jib |

### 2.1 Deux modèles séparés, pas un modèle à deux réglages

Fine-tuner, c'est **produire de nouveaux poids**. On se retrouve avec **deux
fichiers de modèle indépendants**. Ce n'est *pas* un seul modèle qu'on
appellerait avec des paramètres différents. Les paramètres d'inférence
(grammaire, biais de prompt) sont des boutons *orthogonaux* : ils modulent le
décodage mais ne transforment jamais un modèle en l'autre. **La différence de
fond est cuite dans les poids, à l'entraînement.**

### 2.2 Même technique, seul le dataset change

Les deux fine-tunes utilisent :

- la **même architecture** : whisper, encodeur-décodeur **séquence-à-séquence** ;
- le **même objectif** : *supervised fine-tuning* (minimiser l'erreur de
  prédiction du prochain token sur des paires `audio → texte`) ;
- la **même procédure**.

**La seule chose qui diffère, c'est le contenu du dataset.** Même moule,
garniture différente.

> **Correction d'une simplification courante.** On dit parfois du modèle tricks
> que c'est « un classifieur / un QCM à 221 cases ». C'est faux au sens
> architectural : il n'a **pas** de tête de classification, c'est un whisper
> séquence-à-séquence comme l'autre. Son comportement de classifieur est
> **émergent** : on ne lui a *jamais* montré autre chose que des tricks isolés,
> alors il a « collapsé » vers « sortir un seul nom de trick ». Ré-entraîné sur
> des passes, la **même architecture** apprendrait à composer. Ce n'est donc ni
> le modèle ni la technique qui font la différence classifieur/transcripteur —
> **c'est le régime de données.**

---

## 3. Le seul problème qui reste : les noms de tricks *dans* une passe

Récapitulatif de l'état :

- La **structure** d'une passe est bien captée (whisper-small + grammaire +
  composeur).
- Les **noms de tricks** ne le sont pas : whisper-small a une acoustique trop
  faible sur le jargon, et on ne peut pas les mettre dans la grammaire sans
  empoisonner le reste (§1.2).

### 3.1 Pourquoi on ne réutilise pas le modèle tricks ici

Idée abandonnée, pour **une raison géométrique** : dans une passe, le trick peut
être **n'importe où** (kicker en sortie, transfert au milieu, trick en entrée).
Impossible de découper « entrée = modèle-tricks / reste = whisper » puisqu'on ne
connaît pas les frontières. Et de toute façon le modèle tricks attend *un trick
seul* comme entrée entière — lui donner une passe le ferait juste mal classer.

> On abandonne **le modèle** pour le jib, mais **le VOCAB reste réutilisé**
> (grammaire, composeur, matcher). Et le modèle tricks **reste vivant** pour son
> usage d'origine : les tricks isolés.

### 3.2 La solution : fine-tuner un modèle sur des passes entières

Et là, l'intuition piège : « il ne saura reconnaître que les combinaisons que
je lui ai dictées ». **Faux — et c'est tout l'intérêt.**

Un whisper séquence-à-séquence génère **token par token**, de façon
autorégressive. Ce qu'il apprend n'est **pas** « telle passe entière = tel
texte », mais **deux choses séparément** :

1. **l'acoustique de chaque atome** — à quoi ressemble le son de `boardslide`,
   de `270`, de `backlip`, de `transfert`… ;
2. **la micro-grammaire** — comment les atomes s'enchaînent.

Comme il a intériorisé les atomes + leurs transitions, **il généralise à des
combinaisons jamais entendues**. Un `backlip to boardslide` absent du dataset,
il sait le produire s'il a entendu `backlip` et `boardslide` ailleurs, dans des
contextes variés. C'est de l'**interpolation compositionnelle** — exactement
comme un modèle de langue écrit des phrases neuves avec des mots connus.

**Conséquences concrètes pour le dataset :**

- ❌ **Pas besoin** d'enregistrer toutes les combinaisons (impossible).
- ❌ **Pas** un entraînement sur des atomes isolés (ça, ce serait refaire le
  classifieur mono-trick, qui justement ne compose pas).
- ✅ Un **échantillon représentatif de vraies passes**, assez varié pour que
  **chaque atome apparaisse plusieurs fois, à des positions différentes**. Le
  modèle interpole le reste.

**Pas de « slicer ».** On ne segmente rien. Whisper avale la passe entière et
sort le texte entier ; le découpage en atomes, il le fait *implicitement*. Le
composeur intervient seulement *après*, sur le texte.

### 3.3 Grammaire + fine-tune : complémentaires, pas concurrents

- La **grammaire** garantit que la sortie est *dans* le vocabulaire (jamais
  d'hallucination hors-liste).
- Le **fine-tune** garantit qu'il choisit le *bon* mot du vocabulaire (bonne
  acoustique).
- Aujourd'hui : mauvaise acoustique → même bridé, il choisit le mauvais mot
  valide (`scarecrow → slob`).
- **Après fine-tune** : bonne acoustique → il vise le bon. **Et là on peut
  remettre les noms de tricks dans la grammaire** pour verrouiller. **Le trou se
  referme.**

---

## 4. Le dataset — comment on le construit

Le fine-tune jib a besoin de paires `audio de passe → texte correct`. On les
récolte en **dictée libre** : le juge dicte des passes, whisper-small +
grammaire + composeur proposent une transcription, l'humain **corrige** le
texte. On stocke `(blob audio, texte corrigé)`.

- La grammaire-structure **amorce** la collecte : elle donne déjà une base
  propre côté structure, donc peu à corriger là-dessus.
- Les corrections humaines portent surtout sur les **noms de tricks** — pile ce
  qui manque au modèle.
- Chaque passe corrigée = un exemple d'entraînement. Cible : couvrir chaque
  atome dans des contextes variés (voir §3.2), pas l'exhaustivité.

---

## 5. Résumé en une phrase

> Le fine-tune jib **n'est pas un plus gros QCM** : c'est un transcripteur qui
> apprend les **atomes** et **improvise les combinaisons** — la même technique
> que le modèle tricks, mais nourri de passes entières au lieu de tricks isolés.
> C'est précisément ce que ni le modèle tricks (ne compose pas) ni whisper-small
> (mauvaise acoustique du jargon) ne savent faire. Seul prérequis : un dataset
> de passes **variées couvrant chaque atome** — représentatif, pas exhaustif.
