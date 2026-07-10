Je veux implémenter le module compétition de WakeRef en React.

Il a été entièrement prototypé et validé (UX) dans un proto HTML standalone. Ne
re-conçois pas l'UX : elle est figée. Ta source de vérité, à lire EN PREMIER et en
entier :

1. proto-assets/competition-module-handoff.md  ← point d'entrée, gèle tous les
   partis pris (modèle de données, plan de port, schéma Supabase, limites connues)
2. proto-assets/judge-saisie-ux-brief.md        ← le parcours du juge (onglet Run) en détail
3. proto-assets/competition-module.html         ← le proto vivant : la référence
   visuelle et comportementale exacte (ouvre-le pour voir/reproduire le rendu)
4. CLAUDE.md                                     ← conventions du repo (Supabase
   singleton, i18n fr/en, routing, RLS, AdminLayout, invariants produit cable-only)

Contexte technique : React 19 + Vite + Supabase (PostgreSQL + Auth + Storage),
déployé Vercel. Data via le singleton src/lib/supabase.js (pas de couche API).

RÉPARTITION DES SURFACES (importante, ≠ proto qui réunit les 3 onglets) :
- SETUP = côté ADMIN, sous /admin/* (auth-guardé par AdminLayout) : création/édition
  d'un parcours par l'organisateur + gestion des parcours (liste / créer / nom unique
  / dupliquer). Un parcours est persistant et partageable par short-code.
- HEAT + RUN = côté /competition (+ /competition/<code> pour charger un parcours
  partagé). LAZY, HORS Navbar (comme le labo /judge). Le juge charge un parcours par
  son code et juge en local.
- Invariant : seul le PARCOURS voyage entre devices (pas de sync de saisie multi-juges v1).
NE réutilise PAS RunSaisie/JibForm (ils servent Compo/entraînement, pas la compèt).

Points durs à respecter (détaillés dans le handoff) :
- La géométrie de la minimap (renderMinimap) est validée après de nombreuses
  itérations → à porter en composant SVG TELLE QUELLE, sans re-designer.
- Axe latéral = intérieur/extérieur du câble uniquement (jamais gauche/droite absolu).
- Terminologie figée : onglets Setup/Heat/Run ; « blocage » en UI (id interne type:'air').
- 2e passage = copie liée (passOf). Côté verrouillé si un seul module. Brouillon
  run 2 = par-zone (module) / par-trick (blocage). Conventions FRS/DNS. Dé-validation
  via snapshot.

Périmètre de CE premier incrément (on ne fait pas tout d'un coup) :
- Commencer par le SETUP côté admin : le modèle de données du parcours (handoff §1),
  l'éditeur de parcours + l'aperçu minimap live, en local d'abord.
- La minimap (composant SVG) est la fondation partagée avec /competition → la porter ici.
- La persistance Supabase (short-code, pattern compositions/get_composition) et le côté
  /competition (Heat + Run) viennent APRÈS, une fois le Setup et la minimap posés.

La voix (compositeur normalizeJib/composeJib) reste branchée PLUS TARD ; le micro est
simulé pour l'instant.

Commence par explorer ces fichiers, puis propose-moi un PLAN de découpage en plan
mode (étapes, fichiers créés, ordre) AVANT d'écrire du code. Ne code rien tant que
je n'ai pas validé le plan.
