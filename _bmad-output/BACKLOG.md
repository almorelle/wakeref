# Backlog WakeRef

Source de vérité du suivi. Dérivé de la priorisation du brainstorming
(`brainstorming/brainstorming-session-2026-06-13-22-43.md`) — mais c'est **ce
fichier** qui fait foi pour le statut, pas la table du brainstorming.

Légende : ✅ clos · 🔨 à faire · 🌅 horizon · 🔧 optionnel · 🚫 hors scope.

## ✅ Clos
- **QW1 — Parité genre par session de quiz** (#25/#27) — `feat: quiz ratio` + flag `performer_gender` sur `videos`.
- **QW3 — Ordre par défaut des vidéos** (#24) — clos côté technique : `videos.sort_order` existe et `figures_full` trie déjà l'agrégat vidéo `order by v.sort_order`. Le reste = curation de contenu (remonter les rideuses via l'admin), pas du dev.
- **Chantier — Seated/handiwake = 3ᵉ discipline + facets localisées** (#26/#34/#30/#32) — `feat: seated as 3rd discipline`.
- **Most-viewed tricks (30 j)** + **home launchpad**.
- **Refonte home** (#23, délégué `bmad-ux`) — clos (2026-06-16). Design dans `planning-artifacts/ux-designs/`.
- **Compo discipline-aware** (#32/#33) — clos (2026-06-19). `GRIDS` dans `Compo.jsx` indexé par grille (`wakeboard`, `wakeskate`, `seated_mp1` MP1→MP3, `seated_mp5` MP3→MP5), tests déclaratifs ; sélecteur de grille (verrou cross-discipline dès qu'une figure est saisie, switch de niveau intra-seated permis) ; modes d'ajout par grille (+ mode Flat) ; approche regular/fakie au jib seated ; toggle rewind (spin sur kicker) ; **scores normalisés /20** (`score20`) pour comparer les grilles ; `gridKey` persisté (localStorage + `compositions.data`). Slugs de scoring centralisés (`SCORING_SLUGS`) + garde-fou dev. Données figures (famille Ollie + reclassements wakeskate) tracées dans `implementation-artifacts/compo-figures-data.md`. Reste : adapter éventuellement le contenu du jib seated.

## 🔨 À développer
- **CF1 — Compo : capturer le run réel sans ralentir la saisie** — non démarré. La compo sert *deux* artefacts : la feuille de score (grille à 20 cases, volontairement grossière — anti-perf) et le run réel (séquence fidèle de ce que le rider a posé). Les saisies actuelles (boutons tout faits, « 180 ou + ») sont optimisées pour le score et écrasent la fidélité. Piste retenue : **fidélité progressive sur un seul objet** — tap par défaut = grossier + scoré tout de suite ; tap(s) en plus = précision optionnelle jamais requise (rotation `fs` → `fs 180` → `360`…) ; le score reste dérivé de la donnée riche (`spin`/`rotation`/`inverted`/`contexts`), donc précision et rapidité ne se gênent jamais. **Point dur = la passe jib** (micro-séquence in→slides→out, pas une figure unique) : garder la structure du formulaire mais la rendre incrémentale (rotations à degrés optionnels, slides choisis dans la liste réelle vs 4 boutons figés). **Garde-fou thèse** : le run fidèle = documentation/partage, jamais un classement ni une feuille officielle (gestion de notes = hors scope, outil de la fédé). Décision de direction à trancher (in-situ vs raffiner en review vs les deux).
- **QW2 — Parcours curatés** (#44/#45/#46) — non démarré. Schéma `collections` + `collection_figures`, page liste + page collection (réutilise les cartes), CRUD admin. Contenu de départ : « Tes premières figures », « Découvrir le wake adulte », « Essentiels sit-wake », « Belles figures propres » (rempli de rideuses, non labellisé).

## 🌅 Horizon
- **Mode juge complet** — capture vocale live (#35), jugement deux phases (#36), feuille de notation numérique (#39). Ambitieux (vocal + UX terrain).

## 🔧 Optionnel
- **Page admin stats vues** — top 30 j vs 1 an + figures jamais vues. Ne manque qu'un RPC `never_viewed_figures(days)` (cf. `deferred-work.md`).

## 🚫 Hors scope (décidés)
- Gamification perf (#43), moteur pédagogique (#48), gestion de notes (#37), adoption fédé (#41), projet/figure cible perso (#42).
