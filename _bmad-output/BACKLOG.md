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

## 🔨 À développer
- **QW2 — Parcours curatés** (#44/#45/#46) — non démarré. Schéma `collections` + `collection_figures`, page liste + page collection (réutilise les cartes), CRUD admin. Contenu de départ : « Tes premières figures », « Découvrir le wake adulte », « Essentiels sit-wake », « Belles figures propres » (rempli de rideuses, non labellisé).

## 🌅 Horizon
- **Mode juge complet** — capture vocale live (#35), jugement deux phases (#36), feuille de notation numérique (#39). Ambitieux (vocal + UX terrain).

## 🔧 Optionnel
- **Page admin stats vues** — top 30 j vs 1 an + figures jamais vues. Ne manque qu'un RPC `never_viewed_figures(days)` (cf. `deferred-work.md`).

## 🚫 Hors scope (décidés)
- Gamification perf (#43), moteur pédagogique (#48), gestion de notes (#37), adoption fédé (#41), projet/figure cible perso (#42).
