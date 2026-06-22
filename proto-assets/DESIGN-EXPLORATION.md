# WakeRef — exploration redesign (parquée)

> **Statut : en pause.** Ce n'est pas la priorité du site pour l'instant. Ce document
> consigne où on en est pour reprendre plus tard sans tout rerefaire.
> Tous les fichiers cités sont dans `proto-assets/` (maquettes HTML autonomes, hors app React).

## Pourquoi ce chantier
Le site actuel (dark `#0a0a0f` + Syne + accent bleu) « sent le vibe-codé » : il tombe dans
un des looks IA par défaut. Objectif : une identité **non générique, mobile-first (80 % des
users sont sur mobile), vivante mais pas gadget**, ancrée dans le monde du wake câble.

## Direction retenue → `home-immersive.html`
Home immersive façon *Red Bulletin* :
1. **Hero plein écran vidéo** (clips enchaînés) + logo + barre, **titre + standfirst** en overlay
   (le titre/desc suivent le clip en cours, ex. « Blind Judge — HS · railey · BS 180 »).
2. **Fondu** du bas de la vidéo vers la section suivante (pas de coupe nette).
3. **Zone plan d'eau** : le parc vu du ciel (polygone + circuit câble) avec les **4 modules**
   (Catalogue / Quiz / Compo / Contribuer) disséminés dessus. Version **ovale verticale** dédiée mobile.
4. **Les plus consultées** + **Dernières vidéos** : cartes **portrait en scroll horizontal**
   (hover-play sur les vrais clips, posters sinon).
5. **Parcours « produit »** : 4 sections plein écran (une par module), gros titre + visuel
   alterné + CTA, qui apparaissent au scroll — « on descend sur le câble, chaque module est un produit ».
6. **Browse by sport** (Wakeboard / Wakeskate / Assis) + **Browse by category** (cartes couleur + description).
7. **Footer** = crédits / attribution du contenu réutilisé.
8. **Câble + nacelle** : le câble part du plan d'eau puis descend en **rail à gauche** sur toute
   la page (avec **modules jalonnés**) ; la **nacelle suit le scroll**, calée sur la hauteur de
   page (bas de page → nacelle en bas), cachée tant que le hero est visible.
9. **Barre fixe** : logo + **loupe** (recherche) + **menu** (icône seule). Devient opaque au scroll.
10. **Menu plein écran** en **fondu** : nav (features) à gauche, most-viewed + dernières vidéos
    (scroll horizontal) à droite. Reprend la recherche en haut.
11. **Recherche plein écran** (overlay) : gros champ + recherches populaires, raccourci `/` et `Échap`.
12. **Apparition au scroll** du contenu (IntersectionObserver → tous navigateurs).

## Système visuel (tokens du proto)
- **Palette (dark, retenue)** : `--bg:#07171b` `--bg2:#0e2228` `--bg3:#16303a`,
  texte `--ink:#e8efe9` `--soft:#8fa9aa` `--faint:#46606a`, accent **`--signal:#ff5a36`** (orange).
  → *Le violet a été testé puis abandonné : on garde l'orange/teal.* Prévoir **light + dark**.
- **Couleurs d'axe (sémantiques notation)** : hs `#f0a32a` (ambre), ts `#a96bf0` (violet),
  regular `#1fb6cb` (cyan), fakie `#ff4d86` (rose).
- **Typo** : display **Bricolage Grotesque**, corps **Inter**, mono **JetBrains Mono**.
  (≠ Syne/DM Sans actuels — la thèse 1 « dossier technique / notation » plaisait.)
- **Détails** : bordures franches, coins légers, grille de fond ténue, ombres dures côté light.

## Spécifications vidéo hero
- **Master 16:9, 1920×1080, action centrée** (zone de sécurité verticale) ; idéalement **aussi un
  export portrait 9:16 (1080×1920)** pour le mobile.
- **MP4 H.264**, `yuv420p`, **faststart**, **sans audio** (muet), **12–20 s**, boucle propre,
  **2–4 Mo**. Poster (1re frame) pour affichage instantané + fallback `reduced-motion`.
- Encodage type :
  `ffmpeg -i montage.mov -vf "scale=1920:-2" -c:v libx264 -profile:v main -pix_fmt yuv420p -crf 24 -preset slow -an -movflags +faststart hero.mp4`

## Décidé en cours de route
- Pas de **télestration animée par vidéo** (timecodes/keyframes à la main → ne scale pas).
  La version scalable de « notation sur l'image » = **légende statique générée depuis les champs
  figure** (nom + approche + décompo). Voir `telestration-*.html` (abandonné) et `home-hero-footage.html`.
- Pas d'**animation vectorielle fabriquée** (rider stylisé qui tourne = cheap). Voir `design-proto-hero-live.html` / `design-proto-figure.html` (abandonnés).
- **Wordmark** : si rempli par la vidéo, **stacké WAKE / REF** (lettres plus grandes = vidéo plus
  lisible). Technique : vidéo masquée à la forme des lettres (`foreignObject` + `mask`) pour que le
  fond reste transparent. Voir `home-wakeref.html`.

## Détails encore à traiter (quand on reprend)
- Parcours « produit » : tester un rendu plus ciné (sticky / scroll-snap / parallax) — actuellement reveal simple.
- Nacelle : affiner vitesse/position si besoin.
- Plan d'eau mobile : valider les positions des modules sur l'ovale vertical.
- Browse by category : prévoir **image OU description par catégorie** (champ à ajouter en base).
- Recherche : brancher la vraie recherche rapide (comme l'actuelle).
- Light + dark : décliner les tokens.
- i18n FR/EN.

## Plan de portage vers l'app React (pour plus tard)
Le proto est une **maquette de référence**, pas le produit. Ne pas peaufiner le pixel sur le HTML.
1. **Tokens** dans `src/index.css` : remplacer la palette actuelle + ajouter Bricolage/JetBrains/Inter
   (self-host woff2 comme l'existant), en **light + dark**.
2. **Navbar → barre + menu plein écran** : refondre `src/components/Navbar.jsx` (+ overlay menu + recherche).
3. **`src/pages/Home.jsx`** : reconstruire avec hero vidéo enchaînée, fondu, plan d'eau, rangées
   most-viewed/latest — **réutiliser les RPC existantes** `home_stats`, `most_viewed_figures`,
   `recent_video_figures` —, parcours produit, browse sport/category, footer crédits.
4. **Nouveaux composants** : carte portrait (poster + hover-play), carte catégorie/sport, carte module, câble+nacelle.
5. **Données** : clip « en vedette » (sélection), **image/description par catégorie** (schéma),
   liens browse → `/figures` pré-filtré (sport + catégorie).
6. **Tranche verticale d'abord** : implémenter la Home en vrai (valide tokens + composants + données +
   dark mode), peaufiner là, puis dérouler le système sur les autres pages (Figures, FigureDetail, Quiz, Compo…).

## Inventaire des maquettes (`proto-assets/`)
| Fichier | Rôle | Verdict |
|---|---|---|
| **`home-immersive.html`** | **Home immersive complète (Red Bulletin + câble + plan d'eau + produits)** | **RETENU** |
| `home-wakeref.html` | Home thèse 1 + hero wordmark-vidéo WAKE/REF + câble | étape intermédiaire |
| `home-hero-fullvideo.html` | 2 façons « hero = la vidéo » dans le thème (duotone+chrome / wordmark) | référence |
| `home-hero-footage.html` | Hero footage traitée + légende auto (scalable) | référence |
| `design-proto-home.html` | Thèse 1 « dossier technique / notation » (light) | base appréciée |
| `design-proto-home-dark.html` | Thèse 1 en sombre | référence |
| `design-proto-home-parcours.html` | Thèse 2 « plan d'eau / carte du parc » | repris dans la home |
| `design-proto-home-cable.html` | Thèse 3 « fil de l'eau / câble + nacelle » mobile-first | repris dans la home |
| `design-proto-hero.html` | Hero footage brut vs traité | référence |
| `design-proto-hero-live.html` | Hero diagramme animé (trick auto-annoté) | abandonné (cheap) |
| `design-proto-figure.html` | Fiche figure animée (schéma ⇄ vidéo) | abandonné |
| `telestration-2-minimal.html` | Télestration minimale sur vraie vidéo | abandonné (ne scale pas) |
| `telestration-3-coach.html` | Télestration « stylo coach » | abandonné (ne scale pas) |

Clips de test : `1779789499255.mp4` (Back Mobe, 9:16), `1779789817819.mp4` (Blind Judge, 3:4).
