# Deferred Work

Issues surfaced during quick-dev reviews, deferred for later focused attention.

## from spec-most-viewed-tricks (review 2026-06-14)
- ~~**Purge des vieux buckets `figure_views`.**~~ **Abandonné (2026-06-16).** Volume négligeable (≈73k lignes/an) et la donnée historique a de la valeur analytics : top sur 1 an (`most_viewed_figures(365, …)`, déjà supporté), figures jamais consultées, saisonnalité. On garde donc tout l'historique — pas de purge. Si un jour le volume devenait gênant, purger très large (`day < current_date - interval '2 years'`) plutôt que 90 j.
- **(Optionnel) Page admin de stats vues.** Non démarré. Exposerait : top 30 j vs top 1 an + liste des figures jamais vues sur la fenêtre. Ne manque qu'un RPC `never_viewed_figures(days)` ; le top par fenêtre existe déjà.

## QW3 — Ordre par défaut des vidéos (#24)
**Clos côté technique (2026-06-16).** Le mécanisme existe déjà : colonne `videos.sort_order` + la vue `figures_full` agrège les vidéos `order by v.sort_order`. Aucun dev à faire — le reste est de la curation de contenu (remonter les rideuses via l'admin vidéos). Suivi global dans `../BACKLOG.md`.

## ~~Competitions agenda feature — lots A/B/C~~ — **livré (2026-09-12)**

Les trois lots (données + admin, surface publique, formulaire de proposition) sont
en production, ainsi que les pages circuit et fédérale qui n'étaient pas au plan
initial. Le découpage détaillé qui vivait ici n'a plus d'objet : le design reste
figé dans `../brainstorming/brainstorming-session-2026-09-06-19-13.md` (ne pas
rouvrir les arbitrages), les specs livrées sont `spec-competitions-admin`,
`spec-competitions-public`, `spec-competitions-submission` et `spec-tour-page`,
et le suivi de chantier est dans `../BACKLOG.md`. Les points restés ouverts au fil
de ces lots sont listés dans les sections ci-dessous, chacune sous sa revue.

## from spec-rename-routes (review 2026-09-07)
- **Route-name drift in the deeper docs.** `docs/component-inventory.md:94-97`, `docs/api-contracts.md:107`, `docs/source-tree-analysis.md:71-92`, `docs/architecture.md:142`, `docs/development-guide.md:92-103` and `README.md:43` still name the old routes. `CLAUDE.md` and `project-context.md` were fixed in the change itself (they are the normative agent files); these are the "deeper docs" project-context tells agents to cross-reference. Cheapest fix is a `bmad-document-project` rescan rather than hand-editing six files.
- **`/grille-composition-old` is an indexable near-duplicate of `/grille-composition`.** `CompositionSimple` ships a title/description with no `noindex` and its description string is *verbatim* identical to `France2026`'s. Pre-existing, but the rename made the two URLs siblings, which sharpens the duplicate-content signal. Either mark the legacy page `noindex` or delete it — it is reachable from nothing.
- **`CompetitionView.jsx:43` does not encode the parcours code.** `navigate(`/juge/${c}`)` with raw trimmed input: a pasted value containing `#` yields an empty code and a silent re-render, one containing `/` produces `/juge/a/b`, which matches nothing and lands on the chromeless 404 with no way back to the gate. `encodeURIComponent(c)` fixes both. Pre-existing; left alone because the spec mandated "rename only, no behaviour change".
- **Lot A file naming.** The judging module keeps `pages/competition/`, `lib/competition/`, `components/competition/` and the `CompetitionView` component, while `competitions` is about to mean the public agenda. Lot A a été livré sans ce renommage : les deux sens de « competition » cohabitent donc bel et bien dans l'arborescence. Donner au module de jugement un espace de noms distinct (pas `competition/`) — les *routes*, elles, sont déjà sans ambiguïté (`/juge*` vs `/competitions`), seul le dossier ne l'est pas.
- **The legacy redirects have no removal date.** `/compo*`, `/judge*`, `/competition*` redirect indefinitely. They cost nothing and protect shared links, and the agenda has since shipped without conflict: `/competition` (singular) is not needed by it (`/competitions` is). Reste du poids mort à reconsidérer une fois les anciens liens périmés — pas de jalon pour ça, donc à décider à froid.

## from spec-competitions-admin (review 2026-09-07)
- **Le logo d'une compétition non publiée est servi par URL.** Le bucket `videos` est public et sa policy select accepte tout objet ayant un segment de dossier ; la RLS de la table ne s'étend pas au Storage. Le chemin n'est pas devinable (`logo_path` n'existe que dans la ligne protégée), donc c'est de l'obscurité, pas une fuite — mais à trancher si un brouillon doit être vraiment invisible (les lots publics sont livrés, la question n'a jamais été tranchée). Même situation que les vidéos de figures non publiées.
- **Remplacement des vidéos en delete-puis-insert, sans transaction.** Le formulaire valide désormais longueur et schéma avant d'y toucher, ce qui supprime la cause connue de rejet, mais une coupure réseau entre les deux instructions laisse la table enfant vide. Le fix propre est une RPC `security definer` qui fait les deux dans une transaction ; pas rentable tant qu'un seul admin saisit.
- ~~**Upload du logo sans plafond de taille**~~ — **traité le 2026-09-09** : `src/lib/uploadLimits.js` (25 Mo vidéo, 5 Mo image) branché sur `AdminVideos`, `JudgeRunForm` et `CompetitionForm`, plus `file_size_limit` sur le bucket (`scripts/migrations/0020-bucket-file-size.sql`). **Reste ouvert : la vérification du type RÉEL du fichier.** Rien ne lit les octets d'en-tête — un `.mp4` renommé depuis un `.exe` est accepté. Le bucket est public, donc c'est un vecteur de distribution ; l'écriture y est réservée à l'admin authentifié, ce qui borne le risque à une erreur de manipulation.
- **Toast de succès perdu à la navigation.** `toast(...)` suivi de `navigate(...)` démonte le `ToastContainer` local avant l'affichage. Pattern hérité de `JudgeRunForm.jsx:145` ; se corrigerait avec un toast au niveau de l'`AdminLayout`.

## from spec-competitions-public (review 2026-09-08)
- ~~**Unify the video cards with `FigureDetail`.**~~ — **traité le 2026-09-12**
  (`f0d6f04` puis `aef3b21`). `src/components/VideoCards.jsx` est désormais la
  carte unique des deux surfaces (`variant` `figure` / `competition`), la
  détection de plateforme vit dans `lib/videoSource.js`, et `FigureDetail`
  n'héberge plus en propre que le lecteur des fichiers uploadés — il importe
  `VideoCards.module.css` pour lui.
- **Storage orphans when an image is removed without replacement.** In `CompetitionForm`, the orphan cleanup requires `files[k]` to be set, so clearing an image nulls the column and leaves the object in a bucket no screen lists. Pre-existing, now applying to two images instead of one.
- **`RemoteLogo` per-instance failure state.** Fine today (one instance per page), but a list of N federal rows with a missing `competitions/ffsnw.png` would issue N independent 404s.
- **Tour logos are locked to `.png`.** A `.svg` or `.jpg` upload silently never appears. Consider trying a small extension list, or storing the extension.
- ~~**`generate-sitemap.js` fetches competitions with no `.limit()`**~~ —
  **traité le 2026-09-09** (`3f7cb2f`) : la requête porte `.limit(MAX_ROWS)` et
  passe par `avertirSiPlafondAtteint`, comme celle des figures.
- **The in-page "← Compétitions" link is a PUSH**, so it re-triggers the ribbon anchor and discards the scroll position, while the browser's Back correctly preserves it. Two behaviours for what reads as one action.

## Boîtes publiques sans plafond (antérieur au lot C)

`video_submissions` et `takedown_requests` acceptent des insertions anonymes sans
limitation de débit, et la première déclenche un e-mail à chaque ligne. Le
plafond existe sur `compositions` (20/min) et, depuis le lot C, sur
`competition_submissions` (10/min) — ces deux-là suivent le même patron de
trigger `security definer`, transposable tel quel.

Le plafond est **global**, pas par soumetteur : Postgres ne voit pas l'IP. Il
protège la boîte de réception, pas la disponibilité du formulaire — dix
insertions par minute suffisent à en fermer l'accès à tout le monde. Le corriger
demanderait de faire passer l'insertion par une Edge Function (qui, elle, voit
l'en-tête) ou d'ajouter un captcha : les deux sortent du cadre « aucune brique
d'infrastructure nouvelle ».

## `RemoteLogo` : chargement différé sur une image sans largeur réservée (2026-09-10)

`loading="lazy"` se retourne contre lui-même quand l'image n'a ni dimensions
intrinsèques connues ni largeur imposée par le CSS : elle mesure 0 px, et le
navigateur ne déclenche pas le chargement différé d'une image d'aire nulle. Elle
reste invisible indéfiniment. Constaté sur l'emblème des pages de circuit,
corrigé là par le prop `eager` + une largeur minimale.

**Reste exposé** : `CompetitionDetail.jsx` (logo de circuit et logo FFSNW dans le
bloc d'affiliation) appelle `RemoteLogo` sans réserver de largeur. Non reproduit
sur un cache chaud. À traiter en réservant la place plutôt qu'en passant tout en
`eager` — ces logos-là ne sont pas en haut de page.
