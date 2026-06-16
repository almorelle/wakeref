# Revue 2 — Edge Case Hunter

> À lancer dans une **session séparée** (idéalement un autre LLM). Ce reviewer reçoit le **diff + accès lecture au projet**. Méthode orientée chemins/bornes, pas attitude.

## Instructions

1. Lis le diff : `_bmad-output/implementation-artifacts/review-diff.patch`.
2. Tu as accès en **lecture** à tout le repo `wakeref` pour comprendre le contexte (vues, composants appelants, données PostgREST).
3. Invoque la skill **`bmad-review-edge-case-hunter`** : parcours chaque branche et condition de bord du changement et ne rapporte que les **cas non gérés**.
4. Axes de vigilance spécifiques à ce chantier :
   - **`figures.sports` via PostgREST** : est-il bien renvoyé comme tableau JS (et non string) par `figures_card` / `figures_full` ? Le code (`Figures.jsx`, `FigureDetail.jsx`) gère-t-il le cas `sports` vide / null / string ?
   - **Onglets tips (`FigureDetail.jsx`)** : figure sans aucun tips ; native = wakeskate/seated ; override présent mais native vide ; `wakeref_facet` pointant une discipline absente des onglets ; dédup des disciplines ; ordre des onglets.
   - **Filtre catalogue** : `.contains('sports', [activeSport])` pour wakeboard/wakeskate (comportement désormais membership, plus `eq`) — figures avec une seule discipline, figures multi-disciplines.
   - **Admin `FigureForm.jsx`** : changer la discipline native après avoir coché des « aussi praticable en » ; native qui disparaît/réapparaît des cases ; override saisi pour une discipline puis décochée (donnée orpheline en base) ; insert vs update ; contrainte DB `sport = any(sports)`.
   - **SQL** : `create or replace view` avec fonctions `setof figures_card/figures_full` dépendantes ; backfill avant le `check` ; visibilité **anon** (RLS) inchangée.

## Format de retour attendu

Liste des edge cases **non gérés** uniquement : fichier:ligne, scénario déclencheur, conséquence, correctif. Si tout est couvert : « RAS ».

Colle ces findings dans la session principale du chantier.

---

## Findings — Edge Case Hunter

Uniquement les cas de bord **non gérés**, atteignables depuis les lignes modifiées.

### EC-1 — `FigureForm.jsx:261` (+ défaut `:103`) · changement de discipline native
**Déclencheur :** créer/éditer une figure, changer la discipline native via le `<select>` (ligne 339) sans toucher les cases « Aussi praticable en ». `form.sports` reste figé sur l'ancienne valeur (défaut `['wakeboard']`, ou l'ancienne native).
**Conséquence :** `sports = Set([form.sport, ...form.sports])` **conserve l'ancienne native**. Ex. nouvelle figure seated → tagée aussi `wakeboard` à l'insu de l'admin → apparaît à tort sous le filtre Wakeboard. La case « wakeboard » s'affiche cochée sans que l'admin l'ait voulu.
**Correctif :** synchroniser `sports` au `onChange` du sport natif — `set('sport', v)` devrait retirer l'ancienne native de `sports` (ne garder que les memberships explicitement cochés + la nouvelle native).

### EC-2 — `FigureForm.jsx:262-265` · override orphelin en base
**Déclencheur :** saisir un override (ex. `tips_seated`), puis décocher `seated` dans « Aussi praticable en ». Le champ disparaît de l'UI (filtre `(form.sports).includes(d)` lignes 387/419), mais `form.tips_seated` garde sa valeur.
**Conséquence :** le `save` persiste **inconditionnellement** `tips_seated: form.tips_seated.filter(...)` → donnée orpheline en base (discipline absente de `sports`). Resurgit si la discipline est recochée plus tard, ou via EC-3.
**Correctif :** au moment du payload, vider les overrides hors `sports` — `tips_seated: payload.sports.includes('seated') ? form.tips_seated.filter(...) : []` (idem `_en`, `wakeskate`).

### EC-3 — `FigureDetail.jsx:218` · native avec override résiduel
**Déclencheur :** une figure dont la native est `seated`/`wakeskate` possède un `tips_<native>` non vide (laissé par EC-1/EC-2, ou une bascule de native).
**Conséquence :** `tips = ov.length ? ov : defaultTips` → pour l'onglet **natif**, l'override prend le pas sur `tips`. Contredit le commentaire (« la native utilise `tips` ») : la fiche affiche l'override au lieu des tips canoniques de la discipline native.
**Correctif :** ignorer l'override pour la native — `const ov = d === figure.sport ? [] : tipsOverride(d)` (ou ne calculer `tipsOverride` que pour les non-natives).

### EC-4 — `FigureDetail.jsx:220-224` · facette unique override-only non étiquetée
**Déclencheur :** native sans tips (`tips`/`tips_en` vides) mais override d'une autre discipline présent (ex. wakeboard natif sans tips + `tips_seated`). Le natif est filtré (`t.tips.length > 0` faux), il reste **un seul** onglet override.
**Conséquence :** `showTipTabs` = false → `tipsToShow` = override seated, affiché sous le titre générique « Conseils » **sans aucun onglet/label**. Le lecteur croit lire les conseils de la figure alors qu'ils sont spécifiques seated.
**Correctif :** afficher l'étiquette de discipline dès qu'`activeTipSport !== figure.sport`, même à un seul jeu (forcer l'affichage de la pastille, ou n'autoriser le mode mono-jeu que pour la native).

### EC-5 — `FigureDetail.jsx:209` · `sports` reçu en string (faible confiance)
**Déclencheur :** `figure.sports` arrivant sérialisé en string (les champs frères `prerequisites`/`videos`/… lignes 194-200 ont tous un garde `typeof === 'string' ? JSON.parse`, pas `sports`).
**Conséquence :** `Array.isArray(figure.sports)` faux → repli silencieux sur `[figure.sport]` → multi-discipline perdu (pas d'onglets). En pratique improbable : `sport_type[]` natif est renvoyé par PostgREST comme tableau JS (≠ colonnes `json_agg`), donc probablement non déclenché. À surveiller si la vue change.
**Correctif (si confirmé) :** aligner sur les frères — parser/normaliser `sports` avant `Array.isArray`.

---

### RAS sur les axes suivants
- **SQL** : `alter type sport_type add value 'seated'` est bien dans la migration **0003**, dont 0004 dépend explicitement (en-tête « APRÈS la migration 0003 ») ; backfill (étape 2) avant `check` (étape 3) ; colonnes appendées en fin → `create or replace view` compatible avec les fonctions `setof figures_card/full` ; `security_invoker` réappliqué → visibilité **anon**/RLS inchangée.
- **Filtre catalogue** : `.contains('sports', [activeSport])` correct pour mono- et multi-discipline ; colonne `NOT NULL` post-backfill → pas de ligne à `sports` null.
- **Dédup / ordre onglets** : `Set` dédoublonne ; `tipFacet` pointant une discipline absente → repli `tipTabs[0]` (ligne 222) géré.
- **`padTips(null)`** → 4 lignes vides, OK.

> Cas le plus actionnable : **EC-1** (membership wakeboard fantôme sur les figures seated, silencieux côté admin), couplé à **EC-2/EC-3** qui forment la même chaîne « override orphelin ».

