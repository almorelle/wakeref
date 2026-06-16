# Revue 3 — Acceptance Auditor

> À lancer dans une **session séparée**. Ce reviewer reçoit le **diff + la spec + accès lecture au projet + les docs de contexte**. Il vérifie la conformité aux critères d'acceptation, aux règles et aux principes — PAS la chasse aux bugs (c'est le rôle des revues 1 & 2).

## Instructions

1. Lis, dans l'ordre :
   - La spec : `_bmad-output/implementation-artifacts/spec-seated-discipline-facets.md` (surtout le bloc `<frozen-after-approval>` : Intent, Boundaries, I/O Matrix).
   - Le contexte projet listé en frontmatter `context:` de la spec : `_bmad-output/project-context.md`.
   - Le diff : `_bmad-output/implementation-artifacts/review-diff.patch`.
2. Tu as accès en **lecture** au repo pour vérifier l'implémentation réelle.
3. Audite la conformité, point par point :

   **Critères d'acceptation (spec § Tasks & Acceptance) :**
   - Une figure `sports={wakeboard,seated}` sans contenu seated apparaît-elle sous le filtre `/figures?sport=seated` ?
   - L'onglet tips sélectionné est-il bien persisté via `wakeref_facet` et présélectionné en naviguant ?
   - L'écriture admin échoue-t-elle (check DB) si `sport ∉ sports`, avec erreur visible ?
   - `npm run lint` = 0/0 ?

   **Boundaries / règles (spec § Boundaries & project-context) :**
   - `sports` est-il bien **curé explicite** et **jamais dérivé du contenu** ?
   - Règle tips respectée : `tips` = défaut, `tips_<d>` = override rempli seulement s'il diverge, jamais un doublon ? Onglets ssi ≥1 override ?
   - Migration mirrorée dans `wakeref_post_restore.sql` ET `wakeref_schema.sql` ? Colonnes appendées en **FIN** de vue ? Vues `security_invoker = true` ?
   - i18n : strings en `fr` ET `en` (ici réutilisation de `sportNames` — vérifier qu'aucune string codée en dur publique n'a été introduite) ?
   - Hors-scope respecté : pas de filtre vidéo par discipline, pas de quiz/compo, pas de nouvelle table/RPC, `v.sport` non exposé ?

   **Principes produit (project-context + thèse) :**
   - Cohérence avec « inclusion par remplissage » / découvrabilité (#6) et « pas de silos » (#28).

## Format de retour attendu

Tableau des points audités : conforme / écart. Pour chaque écart : règle/AC violé(e), preuve (fichier:ligne), gravité, correctif. Classe chaque écart en `intent_gap` / `bad_spec` / `patch` selon qu'il faut renégocier l'intention, corriger la spec, ou juste patcher le code.

Colle ces findings dans la session principale du chantier.

---

# Findings — Acceptance Auditor

Lu : spec (bloc `<frozen-after-approval>`), `project-context.md`, le diff, et vérification de l'implémentation réelle (lint, `translations.js`, `wakeref_post_restore.sql`, `FigureForm.jsx`).

## Tableau d'audit

| # | Point audité | Statut | Preuve |
|---|---|---|---|
| **Critères d'acceptation** | | | |
| AC1 | Figure `sports={wakeboard,seated}` sans contenu seated visible sous `/figures?sport=seated` | ✅ Conforme | `Figures.jsx:168` filtre `.contains('sports', [activeSport])` ; chip Seated `Figures.jsx:187-190` |
| AC2 | Onglet tips persisté via `wakeref_facet` + présélectionné en navigant | ✅ Conforme | `FigureDetail.jsx:60` (init depuis `localStorage`), `:111` (write au clic), `:88` (présélection) |
| AC3 | Écriture admin échoue (check DB) si `sport ∉ sports`, erreur visible | ✅ Conforme | Check DB `figures_sport_in_sports` (migration §3 / schema) ; erreur remontée `FigureForm.jsx:271,274` via `toast(error.message,'error')` |
| AC4 | `npm run lint` = 0/0 | ✅ Conforme | `eslint .` → sortie vide, exit 0 |
| **Boundaries / règles** | | | |
| B1 | `sports` curé explicite, jamais dérivé du contenu | ✅ Conforme | Admin `CheckGroup` + `Set([sport,...sports])` au save (`FigureForm.jsx:271`) ; backfill `array[sport]` ; aucun dérivé vidéo/tips |
| B2 | `sports ⊇ {sport}` garanti | ✅ Conforme | Set force la native en tête (`FigureForm.jsx:271`) + check DB backstop |
| B3 | Règle tips : `tips`=défaut, `tips_<d>`=override, onglets ssi ≥1 override | ✅ Conforme | `FigureDetail.jsx:81-87` filtre `(isNative || hasOwn)`, `showTipTabs = tipTabs.length > 1` |
| B4 | Migration mirrorée post_restore ET schema | ✅ Conforme | Diff sur les 2 fichiers + migration `0004` |
| B5 | Colonnes appendées en FIN de vue | ✅ Conforme | `f.tips_*` + `f.sports` après `base_figure` (post_restore + migration) |
| B6 | Vues `security_invoker = true` | ✅ Conforme | `post_restore:129,142` (les 2 vues) |
| B7 | `sports` ajouté aux DEUX vues | ✅ Conforme | `figures_full` (diff l.19) + `figures_card` (diff l.29) |
| B8 | i18n fr ET en, pas de string publique en dur | ✅ Conforme | `sportNames.seated` = `Wakeboard assis` (fr) / `Seated wakeboard` (en) ; SEO desc bilingue mise à jour ; admin FR-only (autorisé) |
| B9 | Hors-scope : pas de filtre vidéo/quiz/compo/table/RPC, `v.sport` non exposé | ✅ Conforme | `grep v.sport` post_restore = 0 hit dans le json videos ; aucune nouvelle table/RPC |
| **Principes produit** | | | |
| P1 | Inclusion par remplissage / découvrabilité (#6) | ✅ Conforme | Appartenance explicite découplée du contenu : rider seated trouve tout |
| P2 | Pas de silos (#28) | ✅ Conforme | Trick commun = 1 enregistrement multi-discipline, pas de duplication |

**Aucun écart bloquant.** Deux observations mineures (non bloquantes) ci-dessous.

## Observations mineures (severity: low)

### O1 — Fallback d'onglet actif sur « premier onglet » au lieu de « native » explicite
- **Règle concernée :** I/O Matrix — *« défaut = `wakeref_facet` si dans la liste sinon native »*
- **Preuve :** `FigureDetail.jsx:88` → `activeTipSport = tipTabs.some(...) ? tipFacet : tipTabs[0]?.sport`. Le fallback est `tipTabs[0]` (premier élément de `figure.sports`), pas explicitement `figure.sport`.
- **Pourquoi non bloquant :** la native est **toujours en index 0** dans `sports` (backfill `array[sport]` + `Set([form.sport, ...])` au save). Donc `tipTabs[0] === figure.sport` dans toutes les données réelles. Comportement fonctionnellement conforme, mais la logique repose sur l'ordre du tableau plutôt que sur l'identité native.
- **Classement :** `patch` (optionnel) — remplacer le fallback par `figure.sport` rendrait l'invariant explicite et robuste à un éventuel réordonnancement futur de `sports`. Aucune action requise si l'ordre native-first reste garanti.

### O2 — « ≥2 jeux distincts » non dédupliqué par contenu
- **Règle concernée :** Design Notes — *« si `sets` n'a aucun override (tous = tips défaut) → pas d'onglets »* / *« jamais un doublon »*
- **Preuve :** `FigureDetail.jsx:81-87` distingue les onglets par `(isNative || hasOwn)`, pas par égalité de contenu. Si un admin saisit un `tips_seated` **identique** au défaut, deux onglets au contenu identique s'afficheraient.
- **Pourquoi non bloquant :** la Boundary place la charge sur l'admin (*« override rempli uniquement s'il diffère — jamais un doublon »*) ; c'est une règle de process, pas une invariant code. Le cas ne se produit que si l'admin viole sciemment la règle.
- **Classement :** `bad_spec` (mineur) — le mot « distinct » dans les Design Notes suggère une déduplication par contenu qui n'est pas (et n'a pas besoin d'être) implémentée. La spec pourrait clarifier que la distinction est par discipline, la non-duplication étant garantie en amont. Aucun patch code nécessaire.

---

**Verdict :** conformité **complète** sur les 4 critères d'acceptation, les 9 boundaries et les 2 principes produit. Aucun `intent_gap`. Les deux observations sont de gravité `low` et masquées par la construction des données / les règles de process — pas de correctif obligatoire avant merge.

