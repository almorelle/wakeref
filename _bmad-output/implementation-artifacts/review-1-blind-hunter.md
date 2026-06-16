# Revue 1 — Blind Hunter (adversarial général)

> À lancer dans une **session séparée** (idéalement un autre LLM). Ce reviewer ne reçoit **QUE le diff** — pas la spec, pas le reste du projet. Le but : repérer les bugs visibles dans le changement seul, sans se laisser influencer par l'intention déclarée.

## Instructions

1. Ouvre et lis **uniquement** le diff : `_bmad-output/implementation-artifacts/review-diff.patch`.
   - N'ouvre **aucun** autre fichier du projet. Ne lis ni la spec, ni `project-context.md`.
2. Invoque la skill **`bmad-review-adversarial-general`** sur ce diff.
3. Traque en particulier :
   - Bugs de logique JS (conditions de bord, `undefined`/`null`, valeurs par défaut).
   - Incohérences SQL (ordre des migrations, contrainte `check`, `create or replace view` qui change/retire des colonnes existantes, types `sport_type[]` vs `text[]`).
   - États React incohérents (valeurs persistées localStorage non réconciliées, hooks).
   - Tout ce qui « se contredit » à l'intérieur du diff.

## Format de retour attendu

Liste de findings, chacun avec : fichier:ligne (si possible), description du problème, gravité (bloquant / majeur / mineur), et correctif suggéré. Si rien : « RAS ».

Colle ces findings dans la session principale du chantier.

---

## Findings

Analyse du diff seul, sans la spec ni le reste du projet. Triés par gravité.

### Bloquant

**F1 — `sport_type` enum : valeur `'seated'` jamais ajoutée dans ce diff** (`scripts/migrations/0004-figure-sports-tips.sql:357-365`, `src/pages/Figures.jsx:168/188`, `src/pages/admin/FigureForm.jsx:218/271`)
Tout le changement repose sur `'seated'` comme valeur de discipline : backfill `update … set sports = array[sport]`, `sports sport_type[]`, contrainte `sport = any(sports)`, chip de filtre `.contains('sports', ['seated'])`, et `form.sports = ['…','seated']`. Or **aucun `ALTER TYPE sport_type ADD VALUE 'seated'`** n'apparaît dans le diff. Si l'enum ne contient pas déjà `seated`, l'insertion d'une figure seated et le filtre catalogue échouent (`invalid input value for enum`).
*Correctif :* soit ajouter explicitement la valeur d'enum dans 0004 (avant le backfill — et attention, `ADD VALUE` ne peut pas tourner dans la même transaction que son usage), soit documenter dans l'entête de 0004 qu'elle est un prérequis posé par 0003.

### Majeur

**F2 — `tips_<d>` toujours persistés, même pour la discipline native ou une discipline retirée** (`src/pages/admin/FigureForm.jsx:272-275`)
Le submit envoie inconditionnellement `tips_seated`, `tips_seated_en`, `tips_wakeskate`, `tips_wakeskate_en` (filtrés mais pas conditionnés à l'appartenance ni à la discipline native). Si l'admin passe `form.sport` de `wakeboard` à `seated`, ou décoche `seated` de `sports`, les valeurs `form.tips_seated` déjà saisies restent en state et sont écrites en base. En lecture, `FigureDetail` fait `tipsOverride('seated')` → l'override fantôme s'affiche **à la place** du jeu par défaut `tips`, ce qui contredit l'invariant déclaré « la native utilise `tips` ».
*Correctif :* ne sérialiser `tips_<d>` que si `d !== form.sport && form.sports.includes(d)`, mettre les autres à `[]`/`null`.

**F3 — Contrainte de migration non idempotente** (`scripts/migrations/0004-figure-sports-tips.sql:368-370`)
Les colonnes utilisent `add column if not exists` (ré-exécutables), mais `add constraint figures_sport_in_sports check (...)` et `alter column sports set not null` ne le sont pas pour la contrainte : un second passage lève `constraint "figures_sport_in_sports" already exists`. Cela contredit la consigne d'entête « à exécuter section par section en autocommit » qui invite implicitement à rejouer.
*Correctif :* envelopper l'`add constraint` dans un `do $$ … if not exists (select … pg_constraint) … $$;` ou `drop constraint if exists` préalable.

**F4 — Affirmation non vérifiée : `CREATE OR REPLACE VIEW` + colonnes en fin = sûr malgré les fonctions `setof figures_card/figures_full`** (`scripts/migrations/0004-figure-sports-tips.sql:372-375`, `scripts/wakeref_post_restore.sql:115-119`)
Le commentaire pose comme un fait que l'ajout de colonnes en fin de vue est « compatible » avec des fonctions retournant `setof figures_card` / `setof figures_full`. C'est présenté comme acquis sans preuve dans le diff : modifier le rowtype composite d'une vue dont dépend le type de retour d'une fonction peut être refusé par Postgres (`cannot change return type of existing function` / dépendance).
*Correctif :* vérifier réellement (les deux vues + toute fonction dépendante existent) ; sinon `drop function`/recréer, ou retirer l'affirmation du commentaire.

### Mineur

**F5 — Couplage d'ordre de déploiement non documenté** (`src/pages/Figures.jsx:168`)
`.contains('sports', [activeSport])` exige la colonne `sports` dans `figures_card`. Déployer le front avant la migration des vues casse silencieusement le filtre catalogue (résultats vides / erreur PostgREST). Rien ne signale cette dépendance d'ordre.

**F6 — Fallbacks de libellé `seated` incohérents** (`src/pages/Figures.jsx:190` vs `src/pages/FigureDetail.jsx:112`)
Le chip de filtre retombe sur `'Seated'` (capitalisé) si `tr.sportNames.seated` manque ; l'onglet tips retombe sur `t.sport` brut (`'seated'` minuscule). Deux libellés divergents pour la même discipline en cas de trou de traduction.

**F7 — Pattern ARIA « tabs » incomplet** (`src/pages/FigureDetail.jsx:103-119`)
`role="tablist"`/`role="tab"`/`aria-selected` présents, mais : pas de `tabpanel`, pas d'`aria-controls`/`aria-labelledby`, pas d'ids, pas de focus roving au clavier (flèches). Le `<ul>` des tips n'est pas marqué comme panneau. Pattern à moitié implémenté → confus pour les lecteurs d'écran.

**F8 — L'onglet actif par défaut n'est pas garanti d'être la discipline native** (`src/pages/FigureDetail.jsx:88-89`)
`activeTipSport` retombe sur `tipTabs[0]`, dont l'ordre suit `figure.sports` (ordre du tableau en base, alimenté par backfill puis ajouts admin). Rien ne force la native en tête → un onglet non-natif peut être sélectionné par défaut.

**F9 — `tips_<d>` fantôme + jeu par défaut vide = override affiché sans indication** (`src/pages/FigureDetail.jsx:81-90`)
Si `tips` par défaut est vide mais qu'un override existe pour une seule discipline membre, `tipTabs.length === 1` → pas d'onglets (`showTipTabs` faux), et `tipsToShow` affiche l'override sans aucune mention de la discipline concernée. Combiné à F2, un override fantôme peut s'afficher silencieusement.

**F10 — `sports` `NOT NULL` sans `DEFAULT`, contrairement aux colonnes-tableaux voisines** (`scripts/wakeref_schema.sql:41`)
Les autres colonnes `ARRAY` ont `DEFAULT '{}'` ; `sports` est `NOT NULL` sans défaut. Tout chemin d'insertion ne fournissant pas explicitement `sports` (autre que le formulaire) lève une violation `NOT NULL`. Un `DEFAULT` ne marche pas ici (doit contenir `sport`) — à défaut, le documenter comme contrainte d'insertion.

**F11 — `wakeref_facet` global, jamais réinitialisé** (`src/pages/FigureDetail.jsx:60/111`)
La facette choisie est persistée globalement pour toutes les figures. Comportement bénin (réconcilié au render via `tipTabs.some(...)`), mais une valeur comme `'wakeboard'` peut rester indéfiniment et n'est jamais purgée si la discipline disparaît du référentiel.

**F12 — Changement de `form.sport` ne nettoie pas l'UI `sports`/overrides** (`src/pages/admin/FigureForm.jsx:283-291`)
Le `CheckGroup` filtre les options sur `form.sport` courant, mais `form.sports` peut encore contenir l'ancienne native ; la réconciliation ne se fait qu'au submit via `Set`. Combiné à F2, source de données contradictoires (membership + override fantômes).

### Note transverse

`schema.sql` déclare `sports ARRAY` (type d'élément perdu dans le dump Supabase) tandis que la migration précise `sport_type[]` et les `tips_*` sont `text[]` — cohérent avec l'intention, donc pas un finding, mais à garder à l'œil si quelqu'un lit `schema.sql` comme source de vérité du type.

