---
title: 'A public page per competition tour'
type: 'feature'
created: '2026-09-10'
status: 'done'
baseline_commit: '63898a4'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A visitor on "Ça Bram pour toi #11 — Le Pro Tour étape 2" can see the competition belongs to a tour, and can leave for the organiser's own site — but cannot see the tour's other rounds without going back to the full agenda and hunting by name.

**Approach:** A page per tour at `/competitions/circuit/<slug>`, showing that tour's **current-year** competitions in the same ribbon as `/competitions`. Reached from the "Fait partie du circuit" block, on its own line, below the existing outbound link. No new entity: a tour stays a text field, and the page is derived from `tour_name`.

## Boundaries & Constraints

**Always:**
- **Current year only** (owner's call). All other years are absent, including the tour's past editions.
- The ribbon is **one component** used by both surfaces. `/competitions` must render pixel-identical to `63898a4` — verify by before/after fingerprint, not by eye.
- Anon reads `published = true` only; verify the new page as anon.
- Outbound links keep `externalUrl`, `_blank`, `rel="noopener noreferrer"`. Nothing on the page is produced by WakeRef — dates, names and links only.
- FR/EN on every new string. `tour_name` is a proper noun and is never translated.

**Ask First:**
- Any change to what `/competitions` displays.
- Adding a column, a table, or an admin field for tours.

**Never:**
- No `tours` table, no FK, no tour picker in the admin — the frozen call of 2026-09-06 ("un simple lien suffit") holds on substance, and the owner confirmed it.
- Do not touch the `/competitions/proposer` before `/competitions/:idSlug` ordering, nor the legacy `/competition*` redirects.
- No second visual language: the tour page reuses the ribbon rather than growing its own list.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Tour with rounds this year | `/competitions/circuit/le-pro-tour` | Ribbon of that tour's current-year comps, newest first; logo + name as heading | N/A |
| Tour with none this year | slug resolves, zero rows in the current year | Named empty state ("aucune étape en {année}") + link to the full agenda — the absence is stated, never a blank page | N/A |
| Unknown slug | `/competitions/circuit/nawak` | `NotFound`, same as an unknown competition id | N/A |
| Slug of an unpublished tour | every comp bearing that name is `published = false` | Indistinguishable from unknown — anon never learns the tour exists | N/A |
| Two names, one slug | "Le Pro Tour" and "le pro-tour" both slugify alike | Both sets shown together; the heading takes the first row's `tour_name` | N/A |
| Comp with no tour | `tour_name` null | No link on its detail page — nothing to point at | N/A |

</frozen-after-approval>

## Code Map

- `src/components/CompetitionRibbon.jsx` -- new; the ribbon lifted verbatim out of `Competitions.jsx` (rows → `<ol>`, year separators, today marker, compact mode, alternation, live tape). Props: `rows`, `anchorToToday`.
- `src/components/CompetitionRibbon.module.css` -- new; receives the ribbon rules moved out of `Competitions.module.css`.
- `src/pages/Competitions.jsx` / `.module.css` -- keep the masthead, the "?" suggest entry, loading/error/empty states and the query; delegate the list. Must not move a pixel.
- `src/pages/TourCompetitions.jsx` / `.module.css` -- new page: heading (logo + tour name + year), outbound `tour_url` when known, ribbon, empty state.
- `src/lib/competitionAssets.js` -- add `tourPath(tourName)` next to `tourLogoPath`, so the URL shape has one definition.
- `src/pages/CompetitionDetail.jsx` -- one internal link under the affiliation block.
- `src/App.jsx` -- lazy route `/competitions/circuit/:slug`, declared with the other `/competitions/*` routes.
- `src/i18n/translations.js` -- new strings, `fr` + `en`.
- `scripts/generate-sitemap.js` -- one URL per distinct published tour; respect `MAX_ROWS`.
- `CLAUDE.md` -- routes table + one line on the derived-tour convention.

## Tasks & Acceptance

**Execution:**
- [ ] `src/components/CompetitionRibbon.jsx` + `.module.css` -- lift the ribbon out, `rows` in, `anchorToToday` optional -- one list rendering, two surfaces
- [ ] `src/pages/Competitions.jsx` + `.module.css` -- consume the component, drop the moved markup and rules -- the page keeps only what is its own
- [ ] `src/lib/competitionAssets.js` -- `tourPath(tourName)` -- the slug already names the logo; it now names the page too
- [ ] `src/pages/TourCompetitions.jsx` + `.module.css` -- fetch published comps of the current year, resolve the slug client-side, render heading + ribbon or the named empty state -- the page itself
- [ ] `src/App.jsx` -- lazy route before `/competitions/:idSlug` is irrelevant (two segments), but keep it grouped and commented -- reachable
- [ ] `src/pages/CompetitionDetail.jsx` -- "Voir les compétitions du circuit" under the block -- the only way in
- [ ] `src/i18n/translations.js` -- `fr` + `en` -- no untranslated label ships
- [ ] `scripts/generate-sitemap.js` -- add the tour URLs -- the pages are indexable landing pages
- [ ] `CLAUDE.md` -- document route + convention -- the next agent must not re-derive them

**Acceptance Criteria:**
- Given `/competitions` before and after, when both render, then the DOM/geometry fingerprint of every ribbon row is identical.
- Given a competition with a `tour_name`, when its detail page renders, then a link leads to that tour's page; given one without, then no link appears.
- Given a tour page, when it renders, then every listed competition belongs to that tour and to the current year.
- Given a slug matching no published tour, when the page loads, then `NotFound` renders — not an empty ribbon.
- Given `npm run lint`, then the 9 errors / 7 warnings baseline is unchanged.

## Spec Change Log

### 2026-09-11 — une seule taille, pas de repère « aujourd'hui » (demande d'Alexis)

Sur la page d'un circuit, toutes les étapes sont désormais à la même taille et la
tape « aujourd'hui » disparaît. Plutôt que d'ajouter deux booléens au ruban, les
deux réglages existants (`anchorToToday`, `showYears`) sont fusionnés en un seul,
`timeline`, qui porte toutes les mécaniques de frise : défilement initial,
millésimes, repère du jour, forme compacte. Le ruban passe de cinq réglages
d'affichage envisagés à trois (`suggest`, `timeline`, `label`).

Le passé reste distingué, par l'encre seulement — la règle qu'Alexis avait posée
sur l'agenda au lot B, avant que la forme compacte n'existe.

Vérifié : empreinte de `/competitions` identique avant/après (15 lignes, zéro
différence) ; sur la page du Pro Tour, quatre étapes de même hauteur, logos
chargés, étapes 1 et 2 à l'encre atténuée, aucune tape.

### 2026-09-10 — vérification en navigateur, et ce qu'elle a trouvé

L'empreinte avant/après est **passée** : commit de référence monté dans un
worktree séparé sur un second serveur, quinze lignes de ruban comparées ligne à
ligne (structure, géométrie absolue, styles calculés, texte). **Zéro différence.**

Deux constats à consigner.

**Le `class="… undefined"` n'existait pas.** Je l'avais annoncé, deux relecteurs
l'avaient signalé : c'est faux. `Array.prototype.join` rend `undefined` comme une
chaîne vide, l'attribut valait donc `"_item_… _right_… "` — une espace finale,
que le navigateur ignore. Mon correctif n'a rien changé au rendu, ce que
l'empreinte identique confirme.

**Un blocage circulaire dans `RemoteLogo`, lui bien réel.** L'emblème du circuit
ne se chargeait JAMAIS : sans dimensions intrinsèques connues et avec
`width: auto`, l'image mesure 0 px de large, et le navigateur ne déclenche pas le
chargement différé d'une image d'aire nulle — qui reste donc d'aire nulle. En
`loading="eager"` elle apparaît instantanément. D'où le nouveau prop `eager`, et
une largeur minimale sur la boîte pour que le titre ne saute pas à l'arrivée de
l'image. Le fil n'était pas concerné : sa pastille impose 64 px.

**Reste ouvert :** `CompetitionDetail` appelle `RemoteLogo` sans largeur réservée
pour le logo du circuit et de la fédération. Le même blocage y est possible sur
un cache froid ; non reproduit ici, l'image étant déjà en cache.

### 2026-09-10 — la requête porte sur TOUTES les années, pas sur l'année en cours

Le spec se contredisait : la matrice exige de distinguer « circuit inconnu » (404)
de « circuit réel sans étape cette année » (dit à l'écran), mais la tâche et les
notes de conception prescrivaient une requête restreinte à l'année en cours — qui
rend les deux cas rigoureusement identiques. La page charge donc le circuit sur
toutes ses années et n'en **affiche** qu'une. Sans ça, un visiteur venu de la
fiche d'une édition précédente tombait sur un 404.

Effet de bord voulu : la requête ne dépend ni du slug ni de l'année, donc elle ne
constitue aucun oracle — deviner un slug de brouillon produit exactement la même
requête qu'un slug valide.

### 2026-09-10 — trois ajouts au Code Map

- `CompetitionRibbon` prend un troisième prop, `suggest`. La ligne « ? » est
  entrée dans le composant au lieu de rester dans la page : c'est ce qui garde le
  DOM de `/competitions` identique, l'ordre des `<li>` étant significatif.
- Un quatrième, `label`, est venu de la revue : la liste s'annonçait
  « Compétitions » même sur la page d'un circuit.
- `src/pages/CompetitionDetail.module.css` reçoit les règles du lien interne.

### 2026-09-10 — suites de la revue adverse (2e passe)

- **`slugify` n'était pas stable par re-slugification.** Le nettoyage des tirets
  s'appliquait AVANT la coupe à 60 caractères, si bien qu'un nom de circuit assez
  long pouvait produire un slug terminé par un tiret — que le retour par
  `slugify` retirait aussitôt. La page rendait donc 404 sur l'URL qu'elle publie
  elle-même dans le sitemap. Reproduit puis vérifié stable sur mille formes.
- **Millésime imprimé deux fois** (en-tête de page et séparateur du ruban), et sur
  une saison terminée le repère « aujourd'hui » passait au-dessus du séparateur,
  ouvrant la page dessus. Nouveau prop `showYears`, faux sur la page de circuit.
- Commentaire recopié et faux : le tri étant décroissant, la troncature de
  PostgREST coupe ici les compétitions les plus ANCIENNES, pas l'à-venir.
- Spinner aligné sur celui de la fiche compétition (`role="status"`).

**Laissé tel quel, à trancher par Alexis :** une étape à cheval sur le Nouvel An
(28 décembre → 2 janvier) est rattachée à l'année de FIN, comme partout dans
l'application. Elle n'apparaît donc pas sur la page du circuit de l'année où elle
commence. Filtrer sur le chevauchement la ferait apparaître, mais sous un
séparateur d'une autre année et en forme compacte — pire à l'écran. Aucune donnée
actuelle n'est concernée.

### 2026-09-10 — suites de la revue adverse

- **Casse de l'URL.** Le routeur compare les chemins sans tenir compte de la
  casse : `/circuit/Le-Pro-Tour` atteignait la route puis échouait à la
  comparaison de slugs, rendant un 404 sur une URL acceptée. Le paramètre repasse
  par `slugify`. Même piège que les redirections `/Compo/x`, déjà consigné.
- **`<Link to={null}>`.** Le garde portait sur `tour_name` alors que `tourPath`
  renvoie `null` quand le nom ne produit aucun slug (« ??? ») : le routeur levait
  et la fiche entière tombait. Le garde porte sur le chemin.
- **`mountedOnce` posé trop tard.** Le drapeau se posait après la sortie sur
  `anchorToToday` ; le ruban n'étant plus monté quand le chargement échoue, il
  restait faux et le retour arrière suivant réancrait — en écrasant la position
  restituée, ce que ce drapeau existe précisément pour empêcher.
- **`class="… undefined"`.** `styles.suggestItem` n'a jamais eu de règle et était
  joint sans filtre. Antérieur au lot, corrigé ici : c'est la **seule** différence
  volontaire dans le DOM de `/competitions` par rapport à `63898a4`.
- **Prédiction retirée de l'état vide.** « les dates arrivent en général au
  printemps » était une affirmation produite par WakeRef, servie pour tous les
  circuits sans rien en savoir — contraire à la règle « aucune donnée produite par
  WakeRef ». Il ne reste que le fait.
- **`tourPath` réutilisée** dans le sitemap et la balise SEO, où je recopiais la
  forme d'URL à la main — précisément ce que cette fonction existe pour empêcher.
  `competitionAssets.js` importe désormais avec l'extension `.js`, sans quoi Node
  ne peut pas charger le module depuis le script de sitemap.

## Design Notes

Filtering to one year makes the ribbon behave *without* new options: `newYear` fires once (a single millésime at the top), `compact` still marks past rounds exactly as on `/competitions`, and `firstPast` still places the "aujourd'hui" marker. The one prop worth having is `anchorToToday` — scrolling a four-row page past its own heading is noise, so the tour page passes `false`.

Slug resolution is client-side and free: the page already fetches the current year's published competitions, so matching `slugify(tour_name)` costs nothing extra and needs no schema. Two distinct names colliding on one slug is possible; the matrix accepts it rather than guarding against a case the data does not have.

## Verification

**Commands:**
- `npm run lint` -- expected: 9 errors / 7 warnings, unchanged
- `npm run build` -- expected: succeeds
- `node scripts/generate-sitemap.js` -- expected: two new `/competitions/circuit/…` URLs

**Manual checks:**
- Fingerprint `/competitions` rows before and after the extraction; diff must be empty.
- `/competitions/circuit/le-pro-tour` and `/exo-tour` in FR and EN, desktop and 390 px.
- As anon in a private window: an unpublished tour's slug must render `NotFound`.
