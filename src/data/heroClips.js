// Clips de la couverture de la home, référencés par `videos.id`.
//
// Pourquoi des ids et pas un dossier Storage dédié : l'id donne accès à la
// ligne `videos` complète — auteur·ice, lien de profil — et à la figure liée
// (nom + slug). La couverture peut donc légender chaque clip et renvoyer vers
// sa fiche, ce qu'un simple fichier posé dans un dossier ne permettrait pas.
// Corollaire : corriger un nom de créateur·ice dans l'admin met à jour la home
// sans redéploiement.
//
// L'ordre ci-dessous est celui de la rotation. Le premier clip est celui qui
// s'affiche à l'ouverture : y mettre le plus démonstratif, et le plus léger.
//
// Pour changer la sélection : éditer ce tableau. Si ça devient fréquent, l'étape
// suivante est une colonne `hero_order` sur `videos` pilotée depuis l'admin.
export const HERO_CLIP_IDS = [
  175, // Blind Judge — Andrea Smolinska         720×960    9.0s
  385, // TS FS 360 — Ile Vegni                  720×720    4.1s
  220, // Back Mobe — Parker Wasson              720×720    6.7s
  179, // Kickflip — Telma Cester                360×640    4.1s
  162, // Nose Press / Tail Press — Yohan Camps  720×1280  10.0s
  357, // Tantrum to Blind — Claudia Pagnini     720×720    9.7s
  210, // S-Bend — Janek Jaromin                 720×1280   5.4s
  233, // Back Roll — The Peacock Brothers      1280×720   5.9s
  226, // Back Lip — Sebastian « Busty » Dunn    360×640    7.6s
  173, // Back Mobe — Andrea Smolinska           720×960   11.5s
  225, // KGB 5 — Sebastian « Busty » Dunn       720×1280   7.8s
  209, // East Mobe — Janek Jaromin              716×720    4.1s
  313, // 360 Kickflip — The Wakeskate Channel  1080×720    3.7s
  190, // Crow Mobe — Olaf Sypień                720×960    5.6s
  379, // Double Tantrum to Blind — Liam Peacock 720×720   12.1s
  376, // Underflip Rewind — Dominik Guehrs      720×720   13.3s
]

// Dossier Storage des illustrations de rubrique, dans le bucket `videos`.
// Un fichier par module, nommé d'après lui : Catalogue.jpg, Quiz.jpg…
export const MODULE_IMAGE_DIR = 'illustrations/photos'