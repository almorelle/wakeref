# Note de parcours juge — saisie de run (proto compétition)

> **But de ce document.** Servir de *content* à une review UX (adversariale ou
> dialogue). On ne juge pas le code : on juge l'**expérience du juge** en situation
> réelle. La référence vivante est `proto-assets/competition-module.html`, onglet
> **Saisie**. Ce texte en est le résumé opérable.

---

## 0. Le contexte produit (invariants à ne PAS remettre en cause)

Ce ne sont pas des choix ouverts au débat dans cette review — ce sont les rails.
Un bon reviewer challenge *à l'intérieur* de ces contraintes.

- **Câble uniquement.** Wakeboard / wakeskate / assis, tous en téléski. Jamais de
  vocabulaire bateau (pas de « wake-to-wake », « vague », « transfert de vague »).
  Les obstacles sont des **kickers / modules / features**.
- **Le parcours est un échafaudage, jamais une cage.** Il pré-structure la saisie
  (les zones attendues) mais le juge doit pouvoir saisir **hors parcours** à tout
  moment (un rider improvise). L'app ne doit jamais bloquer une saisie parce
  qu'« elle n'était pas prévue ».
- **Inclusion par remplissage, pas par étiquetage.** On ne nomme pas les
  handicaps / disciplines dans l'interface de saisie ; la discipline est portée
  par le contexte (poule), pas par un label collé sur chaque trick.
- **Axe latéral unique : intérieur / extérieur du câble.** JAMAIS gauche/droite
  absolu (ça s'inverse entre le brin aller et le brin retour d'un run → le juge
  s'emmêle). Le sens du câble (`regular` horaire / `goofy` anti-horaire) mappe
  int/ext vers la gauche/droite **physique** de l'écran, réglé une fois dans le
  Parcours.
- **Note binaire, pas de degrés.** On note qu'un élément est réussi/tenté/raté,
  pas une qualité graduée (anti-perf).

## 1. Le protagoniste et sa situation

**Karim**, juge sur une manche de coupe régionale. Tablette posée sur les genoux,
soleil rasant sur l'écran, vent. Un rider **toutes les ~90 secondes**, deux runs
par rider dans la plupart des poules (un seul en Last Chance Qualifier). Il ne
peut pas quitter le plan d'eau des yeux plus d'une seconde à la fois : **la
saisie doit se faire quasi à l'aveugle, au geste et à la voix**. S'il rate une
zone, le rider est déjà trois modules plus loin. Le coût d'une erreur de saisie
= une réclamation d'un coach en fin de manche.

## 2. Le parcours de saisie (journey, zone par zone)

Karim est sur l'onglet **Saisie**, rider courant sélectionné (il navigue entre
riders ici ; il les **ajoute/retire** dans l'onglet Poule, pas ici).

1. **Vue « point de vue rider ».** La **zone courante** est une grande carte au
   centre. Les zones **à venir** sont des cartes *pleine taille* empilées
   derrière, dont seuls les bords hauts dépassent (métaphore paquet de cartes —
   « il reste ça devant »). Les zones **déjà saisies** forment une pile compacte
   en dessous (départ du run tout en bas). Sens de lecture : on **avance vers le
   haut**, le fait accompli **tombe dans la pile du bas**.

2. **Naviguer.** Flèches **↑/↓** = changer de zone (haut = suivante/futur, bas =
   précédente/passé). Tap sur une carte à venir ou un item de la pile = y sauter.
   Transition animée : la courante file se ranger en bas pendant que la suivante
   s'ouvre au centre.

3. **Saisir un module (kicker/rail).** Deux gros boutons de choix de **côté**
   placés physiquement à gauche/droite selon le sens câble (« ▲ sens de
   progression »). Le côté est **optionnel** : par défaut **centré**, la saisie du
   trick n'est PAS bloquée avant d'avoir choisi. **Une fois un côté choisi, on ne
   peut plus revenir au centre — seulement basculer d'un côté à l'autre.** Changer
   de côté **ne réinitialise pas** le trick (seul un changement de type de slot,
   kicker↔jib, le remet à zéro).

4. **Saisir une zone d'air tricks.** Bouton **🎤 dicter** positionné selon le côté
   actif (centré par défaut). Chaque air dicté devient un item ; on peut lui
   affecter un côté et une note. Plusieurs airs par zone.

5. **Saisir une passe de jib.** Dictée libre (texte compositionnel normalisé),
   axe d'approche adapté (hs/ts vs regular/fakie selon discipline).

6. **Insérer une zone hors-parcours.** Deux **barres pleine largeur** dans la zone
   courante : celle du **haut** insère une zone *après*, celle du **bas** insère
   *avant*. Un clic crée la zone ad-hoc et y place le curseur pour saisir tout de
   suite.

7. **Le climax — la chute.** Le rider tombe au module 4. Karim tape **« ⚠ chute
   ici · fin du run »** sur la zone courante. Toutes les zones suivantes passent
   auto en « rien », un bandeau rouge s'affiche, « annuler la chute » reste
   possible. Le run est terminé ; il passe au rider suivant ou au run 2.

8. **Le run 2 (le point le plus délicat).** On **ne peut pas** aller sur le run 2
   tant que le run 1 n'est pas **enregistré**. À l'enregistrement, le run 2 est
   **pré-rempli en brouillon grisé** avec les mêmes séquences que le run 1, **chute
   retirée**. Pour chaque zone, Karim peut **« ✓ Valider (idem run 1) »** — sur
   kicker/hors-parcours/jib ça **avance automatiquement** à la zone suivante ; sur
   une zone d'air chaque air a son propre **« ✓ idem »** — ou **« ✎ Saisir autre
   chose »**. Un bouton **« Valider le run 2 »** clôt le run sans empêcher une
   correction ultérieure des run 1 ou 2.

## 3. Les états à challenger

- Côté : **centre (défaut) → gauche/exté OU droite/inté → bascule seule** (pas de
  retour centre). Dans la poule, si aucun côté choisi → int/ext **non mentionné**.
- Note : **rien / tenté / réussi** (binaire, pas de curseur de qualité).
- Run 1 : **en cours → enregistré** (débloque le run 2).
- Run 2, par item : **brouillon (grisé) → validé idem OU ressaisi**.
- Chute : **absente → posée (fin de run, zones suivantes auto-rien) → annulable**.

## 4. Questions ouvertes (là où je VEUX qu'on tape)

1. **La métaphore de pile** (avenir derrière/au-dessus, passé empilé en bas) est-elle
   lisible d'un coup d'œil sous stress, ou demande-t-elle un temps d'apprentissage
   incompatible avec 90 s/rider ?
2. **Saisie quasi-aveugle** : combien d'actions un juge peut-il faire sans regarder
   l'écran ? Le combo flèches + voix suffit-il, ou faut-il un retour
   audio/haptique ?
3. **Le brouillon du run 2** : le gris « idem run 1 » aide-t-il ou crée-t-il un
   faux sentiment de « déjà fait » qui pousse à ne pas vérifier ce que le rider a
   *réellement* fait au run 2 (risque de sur-report du run 1) ?
4. **Côté optionnel + verrou anti-retour-centre** : ergonomique, ou piège quand le
   juge tape un côté par erreur et ne peut plus l'annuler ?
5. **Insertion hors-parcours** : deux barres pleine largeur haut/bas — assez
   découvrable ? Assez rapide en pleine action ?
6. **Chute = fin de run** : et les compétitions où un rider se relève et continue
   après une chute ? L'hypothèse « chute = fin » est-elle trop rigide ?
7. **Charge de navigation** : ↑/↓ zone, ←/→ côté, tap pour sauter, dictée voix,
   barres d'insertion, boutons de note, bascule run 1/2 — la surface de commande
   n'est-elle pas déjà trop large pour un usage à une main sous soleil rasant ?

## 5. Ce qui est HORS périmètre de la review

Fidélité visuelle exacte, tokens de design, composants réutilisables, i18n
FR/EN, persistance/sync multi-juge, port React. Tout ça vient **après** que les
partis pris d'interaction ci-dessus soient validés. Ici on ne juge que **le flux
et l'ergonomie de saisie**.
