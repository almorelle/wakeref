---
title: 'Trois disciplines : appartenance figures.sports[], catalogue & tips dédiés'
type: 'feature'
created: '2026-06-16'
status: 'done'
baseline_commit: '7cdeb906d9f5fe484e3bb86948c721615e2ee6b8'
context: ['{project-root}/_bmad-output/project-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `seated` existe dans l'enum `sport_type` mais n'est pas une discipline de premier rang : absente du filtre `/figures`, et une figure n'a qu'UNE discipline (`figures.sport`) — impossible d'exprimer qu'un trick est faisable dans plusieurs disciplines, ni de donner des tips par discipline. Le contenu (vidéos/tips) n'étant pas exhaustif, on ne peut PAS dériver l'appartenance du contenu : un rider seated doit trouver toutes les figures possibles même sans vidéo/tips encore.

**Approach:** Ajouter une **appartenance multi-discipline explicite et curée** `figures.sports sport_type[]` (⊇ `{sport}`) qui pilote le filtre catalogue, en gardant `figures.sport` comme discipline native (badge, SEO, défaut vidéo). Ajouter des **tips override par discipline** (`tips`/`tips_en` = défaut ; `tips_seated`, `tips_wakeskate` + `_en` = overrides remplis seulement s'ils divergent) rendus en **onglets data-driven** sur la fiche.

## Boundaries & Constraints

**Always:**
- `figures.sports` est curé en admin, jamais dérivé du contenu ; toujours ⊇ `{sport}` (contrainte DB `check (sport = any(sports))`). Backfill = `ARRAY[sport]`.
- `figures.sport` (singulier) inchangé : badge, SEO, sport par défaut des vidéos.
- Règle tips : `tips`/`tips_en` = jeu par défaut (discipline native). `tips_<d>` = OVERRIDE rempli uniquement s'il diffère du défaut — jamais un doublon. Affichage discipline d = `tips_<d>` si non vide, sinon `tips`.
- Onglets tips affichés seulement si ≥1 override non vide ; sinon rendu tips actuel inchangé. Onglet = disciplines de `sports` qui sont natives OU ont un override ; label via `sportNames`.
- Tout nouveau champ texte en paire `field`/`field_en` ; toute string i18n en `fr` ET `en`.
- Schéma à la main : appliquer dans l'éditeur SQL Supabase puis mirrorer dans `wakeref_post_restore.sql` (exécutable) ET `wakeref_schema.sql` (dump) + migration `scripts/migrations/0004-*.sql`. Nouvelles colonnes appendées en FIN de vue (compat create-or-replace). Garder les vues `security_invoker = true`. `sports` ajouté aux DEUX vues (`figures_full` + `figures_card`).
- `npm run lint` à 0/0 (règles react-hooks strictes).

**Ask First:**
- Toute extension hors triade (filtre vidéo par discipline sur la fiche, quiz/compo discipline-aware) — rester hors scope sans accord.

**Never:**
- Pas de dérivation de l'appartenance depuis le contenu (vidéos/tips) ; `sports` est la source de vérité.
- Pas de duplication d'un trick commun en plusieurs enregistrements.
- Hors scope : filtre vidéo par discipline, quiz & compo discipline-aware, refonte home, nouvelle table/RPC.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Filtre Seated | `/figures?sport=seated` | Liste = figures où `sports @> {seated}`, vidéo/tips ou non | liste vide si aucune |
| Figure multi-disc sans contenu seated | `sport=wakeboard`, `sports={wakeboard,seated}` | apparaît sous Wakeboard ET Seated | — |
| Fiche sans override | tous `tips_<d>` vides | aucun onglet ; rendu tips actuel | — |
| Fiche avec override seated | `tips_seated` non vide, `sports={wakeboard,seated}` | onglets Wakeboard(→`tips`)/Seated(→`tips_seated`) ; défaut = `wakeref_facet` si dans la liste sinon native | fallback native |
| Discipline membre sans override ni native | `sports={…,wakeskate}`, pas de `tips_wakeskate` | pas d'onglet wakeskate, mais figure listée sous filtre Wakeskate | — |
| Insert sans native dans sports | `sport` ∉ `sports` | rejet DB (`check`) | erreur remontée à l'admin |

</frozen-after-approval>

## Code Map

- `scripts/migrations/0004-figure-sports-tips.sql` -- NOUVEAU : colonne `sports` (+check, backfill), 4 colonnes tips override, recreate des 2 vues
- `scripts/wakeref_post_restore.sql` -- mirror exécutable : 2 vues + (colonnes héritées, RLS/grant inchangés)
- `scripts/wakeref_schema.sql` -- mirror dump : colonnes `sports`, `tips_seated`/`_en`, `tips_wakeskate`/`_en` sur `figures`
- `src/pages/Figures.jsx` -- chip « Seated » + filtre `.contains('sports', [activeSport])` au lieu de `.eq('sport', …)`
- `src/pages/FigureDetail.jsx` -- onglets tips data-driven + persistance `wakeref_facet`
- `src/pages/admin/FigureForm.jsx` -- contrôle multi-discipline `sports` + 4 éditeurs tips override
- `src/i18n/translations.js` -- labels (chip Seated réutilise `sportNames.seated`) en `fr` + `en`

## Tasks & Acceptance

**Execution:**
- [x] `scripts/migrations/0004-figure-sports-tips.sql` -- `alter table figures add sports sport_type[]` (backfill `array[sport]`, puis `not null` + `check (sport = any(sports))`) + `tips_seated/_en`, `tips_wakeskate/_en` ; `create or replace` des 2 vues : ajouter `f.sports` (les 2) + les 4 colonnes tips (figures_full) en FIN -- fonde le modèle
- [x] `scripts/wakeref_post_restore.sql` + `scripts/wakeref_schema.sql` -- mirrorer vues + colonnes -- source de vérité à jour
- [x] `src/pages/Figures.jsx` -- chip Seated (`tr.sportNames.seated`) + filtre `.contains('sports', [activeSport])` ; + description SEO mentionne les 3 disciplines -- surfacer la discipline + figures communes
- [x] `src/pages/FigureDetail.jsx` -- liste d'onglets (native + disciplines de `sports` avec override) ; contenu = `localize(tips_<d>)` || `localize(tips)` ; onglets ssi ≥2 jeux distincts ; défaut depuis `localStorage.wakeref_facet`, toute sélection l'écrit ; + styles `.tipTabs` (FigureDetail.module.css) -- tips facettés #34/#30
- [x] `src/pages/admin/FigureForm.jsx` -- select `sport` (native) conservé + `CheckGroup` « aussi praticable en » → `sports = [sport] ∪ cochées` (Set au save) ; 4 éditeurs tips override (helpers `padTips`/`setTipList`) affichés ssi discipline ∈ sports & ≠ native -- saisie admin
- [x] `src/i18n/translations.js` -- AUCUN ajout requis : onglets/chip réutilisent `sportNames` (déjà bilingue fr/en) ; admin FR-only. (Description SEO bilingue mise à jour dans `Figures.jsx`.)

**Acceptance Criteria:**
- Given une figure `sports={wakeboard,seated}` sans aucune vidéo/tips seated, when je filtre `/figures` par Seated, then elle apparaît.
- Given une fiche avec `tips_seated` rempli, when j'ouvre l'onglet Seated puis je navigue vers une autre fiche multi-disc, then l'onglet Seated est présélectionné (`wakeref_facet`).
- Given un admin tente d'enregistrer une figure dont `sport` n'est pas dans `sports`, then l'écriture échoue (check DB) et l'erreur est visible.
- Given `npm run lint`, then 0 erreur / 0 warning.

## Spec Change Log

- **2026-06-16 — revue adverse (3 reviewers), itération 1.** Tous les findings actionnables classés `patch` (aucun `intent_gap`, aucun `bad_spec` bloquant ; acceptance auditor = conformité complète). Patches appliqués : overrides tips non persistés hors `sports`/native (F2/EC-2) ; nettoyage de `sports` au changement de native (F12/EC-1) ; override ignoré sur la native à l'affichage (EC-3) ; étiquetage d'un onglet override unique (F9/EC-4) ; fallback d'onglet actif explicitement natif (F8/O1) ; contrainte de migration idempotente (F3) ; ARIA simplifié en boutons `aria-pressed` (F7) ; note d'ordre de déploiement (F5). Rejetés : F1 (enum `seated` déjà posé en 0003), F4 (replace de vue vérifié sûr), F6/F10/F11/EC-5 (chemins morts/intentionnels). O2 (bad_spec mineur) → clarification de wording Design Notes ci-dessous, sans impact code.

## Design Notes

Onglets tips (FigureDetail) — pseudo :
```
const sets = sports
  .filter(d => d === figure.sport || nonEmpty(localize(figure, `tips_${d}`)))
  .map(d => ({ d, tips: nonEmpty(localize(figure,`tips_${d}`)) ? localize(figure,`tips_${d}`) : localize(figure,'tips') }))
// si sets n'a aucun override (tous = tips défaut) → pas d'onglets, afficher localize(figure,'tips')
// défaut actif = wakeref_facet ∈ sets ? wakeref_facet : figure.sport
```
`wakeref_facet` ∈ {wakeboard,wakeskate,seated} — même esprit que `wakeref_lang`. Pas de filtre vidéo par discipline dans ce chantier (différé) ; ne PAS exposer `v.sport` tant que le filtre n'est pas fait, pour éviter du code mort.

La distinction des onglets est **par discipline** (un onglet par discipline native/override), pas par égalité de contenu : la non-duplication (un override identique au défaut) est une **règle de process admin** (« override rempli seulement s'il diverge »), pas un invariant code. Un override sur la discipline native est ignoré à l'affichage et n'est pas persisté à la sauvegarde (la native utilise toujours `tips`). Un unique jeu non-natif EST étiqueté (onglet affiché) pour ne pas faire passer des conseils spécifiques pour les conseils par défaut.

## Verification

**Commands:**
- `npm run lint` -- expected: 0 erreur / 0 warning
- `npm run dev` -- expected: démarre sans erreur console

**Manual checks:**
- Appliquer la migration 0004 dans l'éditeur SQL Supabase (étapes ordonnées : add colonnes → backfill → not null + check → recreate vues) AVANT de tester le front.
- `/figures?sport=seated` liste les figures taguées seated même sans contenu ; onglets tips n'apparaissent qu'avec ≥1 override et respectent `wakeref_facet` après navigation.
- Visibilité **en tant qu'anon** (RLS) : aucune figure non publiée ni vidéo en takedown ne fuit.

## Suggested Review Order

**Schéma & modèle (point d'entrée)**

- Le cœur : colonne d'appartenance explicite + colonnes tips override, contrainte d'intégrité
  [`0004-figure-sports-tips.sql:25`](../../scripts/migrations/0004-figure-sports-tips.sql#L25)
- `sports` + tips appendés en fin des 2 vues (mirror exécutable)
  [`wakeref_post_restore.sql:125`](../../scripts/wakeref_post_restore.sql#L125)

**Appartenance & catalogue**

- Le filtre passe de `eq('sport')` à membership `contains('sports', …)` — figures communes
  [`Figures.jsx:35`](../../src/pages/Figures.jsx#L35)
- Chip Seated surfacé dans le filtre public
  [`Figures.jsx:150`](../../src/pages/Figures.jsx#L150)

**Tips facettés (fiche)**

- Construction des onglets : override ignoré sur la native, étiquetage du jeu non-natif unique
  [`FigureDetail.jsx:213`](../../src/pages/FigureDetail.jsx#L213)
- Rendu : boutons segmentés `aria-pressed`, défaut via `wakeref_facet`
  [`FigureDetail.jsx:378`](../../src/pages/FigureDetail.jsx#L378)

**Saisie admin**

- `setSport` nettoie `sports` au changement de native (anti-membership fantôme)
  [`FigureForm.jsx:224`](../../src/pages/admin/FigureForm.jsx#L224)
- Payload : overrides persistés seulement pour disciplines membres non-natives
  [`FigureForm.jsx:248`](../../src/pages/admin/FigureForm.jsx#L248)
- UI : cases « aussi praticable en » + éditeurs tips override data-driven
  [`FigureForm.jsx:365`](../../src/pages/admin/FigureForm.jsx#L365)
