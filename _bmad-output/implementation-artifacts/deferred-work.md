# Deferred Work

Issues surfaced during quick-dev reviews, deferred for later focused attention.

## from spec-most-viewed-tricks (review 2026-06-14)
- ~~**Purge des vieux buckets `figure_views`.**~~ **Abandonné (2026-06-16).** Volume négligeable (≈73k lignes/an) et la donnée historique a de la valeur analytics : top sur 1 an (`most_viewed_figures(365, …)`, déjà supporté), figures jamais consultées, saisonnalité. On garde donc tout l'historique — pas de purge. Si un jour le volume devenait gênant, purger très large (`day < current_date - interval '2 years'`) plutôt que 90 j.
- **(Optionnel) Page admin de stats vues.** Non démarré. Exposerait : top 30 j vs top 1 an + liste des figures jamais vues sur la fenêtre. Ne manque qu'un RPC `never_viewed_figures(days)` ; le top par fenêtre existe déjà.

## QW3 — Ordre par défaut des vidéos (#24)
**Clos côté technique (2026-06-16).** Le mécanisme existe déjà : colonne `videos.sort_order` + la vue `figures_full` agrège les vidéos `order by v.sort_order`. Aucun dev à faire — le reste est de la curation de contenu (remonter les rideuses via l'admin vidéos). Suivi global dans `../BACKLOG.md`.

## Competitions agenda feature — split out of the route-rename preamble (2026-09-07)

Design is frozen in `_bmad-output/brainstorming/brainstorming-session-2026-09-06-19-13.md` (see "Idea Organization and Prioritization" + "Action plan"). Do not reopen the calls recorded there. Sequenced after `spec-rename-routes` (which frees the paths).

- **A — Data foundation + admin (next).** `competitions` table + RLS/grants + admin CRUD + "cancel" button. Fields: name · date_start / date_end · date_precision (day|season|year) · wakepark · affiliation (federal|independent) · tour (name + link) · cancelled · links (info, entry, live video, live scoring, organiser Instagram, wakepark) · logo (Supabase Storage, like videos and Instagram thumbnails) · videos (link-only, `videos` is not reusable as-is: `figure_id` is NOT NULL) · published. **No status column** (derived from the date), no source column, no discipline column, no series/recurrence notion. **No free-text field, therefore no `_en` columns** — bilingualism is UI labels only. Shippable alone: it unblocks the hand-entry of the 2026 season, the longest lot in human time.
- **B — Public surface (after A).** Ribbon anchored on today (bidirectional scroll), comps without a precise date pushed to the tail in indifferent order, day-granularity "live" sticker (today ∈ [date_start, date_end]), cancelled comps greyed/struck through, no "smart" sorting. Empty fields render in three declared states: filled / "coming" / "there won't be one". Autonomous detail page (reachable by direct link without the feed). Related content suggested by typology + year; edition links only for tours. Menu + home entry, like the other sub-sections. FR/EN.
- **C — Public submission form (later).** Lightweight dedicated form (name, date, link) feeding the `/admin` queue, exactly like video submissions. The contact form handles *completing* an existing listing.

## from spec-rename-routes (review 2026-09-07)
- **Route-name drift in the deeper docs.** `docs/component-inventory.md:94-97`, `docs/api-contracts.md:107`, `docs/source-tree-analysis.md:71-92`, `docs/architecture.md:142`, `docs/development-guide.md:92-103` and `README.md:43` still name the old routes. `CLAUDE.md` and `project-context.md` were fixed in the change itself (they are the normative agent files); these are the "deeper docs" project-context tells agents to cross-reference. Cheapest fix is a `bmad-document-project` rescan rather than hand-editing six files.
- **`/grille-composition-old` is an indexable near-duplicate of `/grille-composition`.** `CompositionSimple` ships a title/description with no `noindex` and its description string is *verbatim* identical to `France2026`'s. Pre-existing, but the rename made the two URLs siblings, which sharpens the duplicate-content signal. Either mark the legacy page `noindex` or delete it — it is reachable from nothing.
- **`CompetitionView.jsx:43` does not encode the parcours code.** `navigate(`/juge/${c}`)` with raw trimmed input: a pasted value containing `#` yields an empty code and a silent re-render, one containing `/` produces `/juge/a/b`, which matches nothing and lands on the chromeless 404 with no way back to the gate. `encodeURIComponent(c)` fixes both. Pre-existing; left alone because the spec mandated "rename only, no behaviour change".
- **Lot A file naming.** The judging module keeps `pages/competition/`, `lib/competition/`, `components/competition/` and the `CompetitionView` component, while `competitions` is about to mean the public agenda. When lot A lands, give it a distinct file namespace (not `competition/`) so the two never blur — the *routes* are already unambiguous (`/juge*` vs `/competitions`), only the file tree is.
- **The legacy redirects have no removal date.** `/compo*`, `/judge*`, `/competition*` redirect indefinitely. They cost nothing and protect shared links, but revisit at lot B: `/competition` (singular) is not needed by the agenda (`/competitions` is), so there is no conflict — just dead weight to reconsider once the old links have aged out.

## from spec-competitions-admin (review 2026-09-07)
- **Le logo d'une compétition non publiée est servi par URL.** Le bucket `videos` est public et sa policy select accepte tout objet ayant un segment de dossier ; la RLS de la table ne s'étend pas au Storage. Le chemin n'est pas devinable (`logo_path` n'existe que dans la ligne protégée), donc c'est de l'obscurité, pas une fuite — mais à trancher au lot B si un brouillon doit être vraiment invisible. Même situation que les vidéos de figures non publiées.
- **Remplacement des vidéos en delete-puis-insert, sans transaction.** Le formulaire valide désormais longueur et schéma avant d'y toucher, ce qui supprime la cause connue de rejet, mais une coupure réseau entre les deux instructions laisse la table enfant vide. Le fix propre est une RPC `security definer` qui fait les deux dans une transaction ; pas rentable tant qu'un seul admin saisit.
- ~~**Upload du logo sans plafond de taille**~~ — **traité le 2026-09-09** : `src/lib/uploadLimits.js` (25 Mo vidéo, 5 Mo image) branché sur `AdminVideos`, `JudgeRunForm` et `CompetitionForm`, plus `file_size_limit` sur le bucket (`scripts/migrations/0020-bucket-file-size.sql`). **Reste ouvert : la vérification du type RÉEL du fichier.** Rien ne lit les octets d'en-tête — un `.mp4` renommé depuis un `.exe` est accepté. Le bucket est public, donc c'est un vecteur de distribution ; l'écriture y est réservée à l'admin authentifié, ce qui borne le risque à une erreur de manipulation.
- **Toast de succès perdu à la navigation.** `toast(...)` suivi de `navigate(...)` démonte le `ToastContainer` local avant l'affichage. Pattern hérité de `JudgeRunForm.jsx:145` ; se corrigerait avec un toast au niveau de l'`AdminLayout`.

## from spec-competitions-public (review 2026-09-08)
- **Unify the video cards with `FigureDetail`.** *(2026-09-08: the owner also removed the embed from the tricks pages, so both sides now behave identically — a thumbnail linking out. The unification is therefore cheaper and lower-risk than when it was deferred: what remains is one visual decision, since the two cards still carry their own CSS.)* `src/components/VideoCards.jsx` duplicates the Instagram-thumbnail and YouTube-façade logic that still lives inline in `FigureDetail.jsx`. Deliberate: refactoring a 646-line page that is the site's most visited, inside a competitions lot, was the wrong risk. Do it right after the merge, as its own lot, with `FigureDetail` as the subject — the extraction is already done, what remains is unplugging the old code and moving its CSS classes.
- **Storage orphans when an image is removed without replacement.** In `CompetitionForm`, the orphan cleanup requires `files[k]` to be set, so clearing an image nulls the column and leaves the object in a bucket no screen lists. Pre-existing, now applying to two images instead of one.
- **`RemoteLogo` per-instance failure state.** Fine today (one instance per page), but a list of N federal rows with a missing `competitions/ffsnw.png` would issue N independent 404s.
- **Tour logos are locked to `.png`.** A `.svg` or `.jpg` upload silently never appears. Consider trying a small extension list, or storing the extension.
- **`generate-sitemap.js` fetches competitions with no `.limit()`**, while the ribbon query carries an explicit ceiling with a comment about PostgREST's silent truncation. Same hazard, unguarded.
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

