# Deferred Work

Issues surfaced during quick-dev reviews, deferred for later focused attention.

## from spec-most-viewed-tricks (review 2026-06-14)
- ~~**Purge des vieux buckets `figure_views`.**~~ **Abandonné (2026-06-16).** Volume négligeable (≈73k lignes/an) et la donnée historique a de la valeur analytics : top sur 1 an (`most_viewed_figures(365, …)`, déjà supporté), figures jamais consultées, saisonnalité. On garde donc tout l'historique — pas de purge. Si un jour le volume devenait gênant, purger très large (`day < current_date - interval '2 years'`) plutôt que 90 j.
- ~~**(Optionnel) Page admin de stats vues.**~~ — **traité le 2026-09-12** : `/admin/vues`, servie par les quatre RPC de `scripts/migrations/0022-view-stats.sql` (`view_stats_totals`, `views_by_month`, `top_viewed_figures`, `never_viewed_figures`). La décision de 2026-06-16 de ne pas purger prend ici tout son sens : l'écran lit un historique déjà accumulé, bien plus profond que les 30 jours de l'hébergeur. ~~**Reste ouvert** : seules les pages de figures sont comptées~~ — **fait le 2026-09-12** : `page_views` + `page_routes` (`scripts/migrations/0023-page-views.sql`), comptage branché dans `PublicLayout`, section « Pages du site » dans l'écran. Ce qui reste hors mesure, volontairement : les surfaces chromeless (`/grille-composition`, `/juge`) et l'admin.

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
- ~~**`/grille-composition-old` is an indexable near-duplicate of `/grille-composition`.**~~ — **traité le 2026-09-13** : `<SEO noindex>` sur `CompositionSimple`, et `AdminSpecial` le dit.
- ~~**`CompetitionView.jsx:43` does not encode the parcours code.**~~ — **traité le 2026-09-13** : `encodeURIComponent` dans `JudgeView.jsx`.
- ~~**Lot A file naming.**~~ — **traité le 2026-09-13** : le module de jugement vit dans `pages/judge/`, `lib/judge/`, `components/judge/` ; `CompetitionView` → `JudgeView`, `useCompetitionVoice` → `useJudgeVoice`. Clé `wakeref_heat_<code>` inchangée. Les docs de `docs/` gardent les anciens chemins (même rescan que ci-dessus).
- ~~**The legacy redirects have no removal date.**~~ — **retirées le 2026-09-13** (`vercel.json` et `App.jsx`), décision du propriétaire : les anciens chemins sont des 404.

## from spec-competitions-admin (review 2026-09-07)
- ~~**Le logo d'une compétition non publiée est servi par URL.**~~ — **traité le 2026-09-13**, et c'était pire que noté : la policy SELECT de `storage.objects` était ouverte à anon, donc `list('competitions')` avec la clé anon rendait le nom de chaque fichier (38 constatés), brouillons compris. Migration `0025-storage-list-admin-only.sql` (listing réservé à l'admin ; les URL publiques restent servies) + noms de fichiers en UUID dans `CompetitionForm`. **À appliquer sur la base live.** Reste vrai : qui a l'URL exacte a le fichier — nature d'un bucket public.
- **Remplacement des vidéos en delete-puis-insert, sans transaction.** Le formulaire valide désormais longueur et schéma avant d'y toucher, ce qui supprime la cause connue de rejet, mais une coupure réseau entre les deux instructions laisse la table enfant vide. Le fix propre est une RPC `security definer` qui fait les deux dans une transaction ; pas rentable tant qu'un seul admin saisit.
- ~~**Upload du logo sans plafond de taille**~~ — **traité le 2026-09-09** : `src/lib/uploadLimits.js` (25 Mo vidéo, 5 Mo image) branché sur `AdminVideos`, `JudgeRunForm` et `CompetitionForm`, plus `file_size_limit` sur le bucket (`scripts/migrations/0020-bucket-file-size.sql`). **Reste ouvert : la vérification du type RÉEL du fichier.** Rien ne lit les octets d'en-tête — un `.mp4` renommé depuis un `.exe` est accepté. Le bucket est public, donc c'est un vecteur de distribution ; l'écriture y est réservée à l'admin authentifié, ce qui borne le risque à une erreur de manipulation.
- ~~**Toast de succès perdu à la navigation.**~~ — **traité le 2026-09-13** : un seul `useToast` dans `AdminLayout`, transmis aux pages par `useOutletContext()` ; le layout ne se démonte pas, le toast survit au `navigate()`.

## from spec-competitions-public (review 2026-09-08)
- ~~**Unify the video cards with `FigureDetail`.**~~ — **traité le 2026-09-12**
  (`f0d6f04` puis `aef3b21`). `src/components/VideoCards.jsx` est désormais la
  carte unique des deux surfaces (`variant` `figure` / `competition`), la
  détection de plateforme vit dans `lib/videoSource.js`, et `FigureDetail`
  n'héberge plus en propre que le lecteur des fichiers uploadés — il importe
  `VideoCards.module.css` pour lui.
- ~~**Storage orphans when an image is removed without replacement.**~~ — **traité le 2026-09-13** : `CompetitionForm` compare les chemins à ceux chargés depuis la base (`stored`), plus à l'état du formulaire que « Retirer » vidait. Les orphelins créés avant le correctif restent dans le bucket.
- **`RemoteLogo` per-instance failure state.** Fine today (one instance per page), but a list of N federal rows with a missing `competitions/ffsnw.png` would issue N independent 404s.
- **Tour logos are locked to `.png`.** Accepté (2026-09-13) : convention tenue par l'admin, qui dépose des PNG. Essayer plusieurs extensions coûterait une requête 404 par essai.
- ~~**`generate-sitemap.js` fetches competitions with no `.limit()`**~~ —
  **traité le 2026-09-09** (`3f7cb2f`) : la requête porte `.limit(MAX_ROWS)` et
  passe par `avertirSiPlafondAtteint`, comme celle des figures.
- ~~**The in-page "← Compétitions" link is a PUSH**~~ — **traité le 2026-09-13** : le ruban passe `state.from` à la fiche ; venu de `/competitions`, le lien fait `navigate(-1)` et retrouve la position.

## ~~Boîtes publiques sans plafond (antérieur au lot C)~~ — traité le 2026-09-13

Migration `0026-submissions-takedowns-rate-limit.sql` : même trigger que `competition_submissions` (10/min, 60/jour, PT429) sur `video_submissions` et `takedown_requests`, grants anon par colonne, et les deux formulaires affichent enfin l'échec (la modale de retrait annonçait « envoyée » sans rien vérifier). **À appliquer sur la base live.** Reste vrai ci-dessous : le plafond est global. Contexte d'origine :

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

~~**Reste exposé** : `CompetitionDetail.jsx`~~ — **traité le 2026-09-13** :
`RemoteLogo` réserve désormais une largeur minimale égale à `height`, ce qui
couvre le bloc d'affiliation ; l'affiche de la fiche, en tête de page, passe en
`eager`.

## ~~Clés `localStorage` du dédoublonnage de `figure_views` (2026-09-12)~~ — traité le 2026-09-13

`hooks/useTrackFigureView.js` passe par `vuDuJour.js` et purge les anciennes clés `wakeref_viewed_*`. Contexte d'origine :

`FigureDetail.jsx` pose une clé par figure et par jour (`wakeref_viewed_<id>_<date>`)
pour ne pas compter deux fois la même visite. Ces clés ne sont jamais relues
au-delà de la journée, ni nettoyées : un visiteur assidu en accumule autant que
de (figure, jour) consultés — plusieurs milliers sur une saison, pour quelques
centaines de Ko dans un quota de ~5 Mo. Aucun symptôme constaté, mais la courbe
ne redescend jamais.

Les compteurs `page_views` et `competition_views` (migrations 0023 et 0024) ne
reproduisent pas le motif : ils passent par `src/lib/vuDuJour.js`, qui tient la
journée entière dans **une** clé par compteur, remplacée au premier passage du
lendemain. Brancher `FigureDetail` sur ce même helper est l'essentiel du
correctif, si un jour il en faut un.
