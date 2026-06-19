# Données figures pour les grilles de compo (record)

Opérations de données one-time appliquées à Supabase pour câbler les grilles de
compo discipline-aware (cf. backlog « Compo discipline-aware », 2026-06-19). Les
scripts SQL d'origine (`scripts/seed-ollie-figures.sql`, `scripts/update-ollie-bodyvarial.sql`)
étaient jetables une fois appliqués — la donnée vit désormais en base (et dans
les backups). Ce fichier en garde la trace structurante.

Les tips/descriptions (bilingues, + override `tips_seated` sur les deux ollie fs)
ne sont pas reproduits ici : ils vivent en base et s'éditent via l'admin.

## Figures ajoutées — famille Ollie (catégorie `spin`, context `flat`)

| slug | nom | sport | sports | approach | rotation | spin | rotation_type | scoré par |
|---|---|---|---|---|---|---|---|---|
| `ollie-180` | Ollie 180 | wakeboard | wakeboard, wakeskate, seated | regular | fs | 180 | — | seated `seated_ollie` |
| `ollie-360` | Ollie 360 | wakeboard | wakeboard, wakeskate, seated | regular | fs | 360 | `handle_pass` | seated `seated_ollie`, `seated_handlepass` |
| `ollie-bs-180` | Ollie BS 180 | wakeboard | wakeboard, wakeskate | — | bs | 180 | — | (ajout catalogue, pas de case dédiée) |
| `ollie-bs-360` | Ollie BS 360 | wakeboard | wakeboard, wakeskate | — | bs | 360 | `handle_pass` | (ajout catalogue) |

- Les deux non-BS (`ollie-180/360`) portent un override `tips_seated` (le tips
  principal est orienté wakeboard) ; les BS n'ont pas de `tips_seated`.
- `handle_pass` sur les 360 = ce qui allume la case `seated_handlepass`.
- `rotation` vide laissée sur les BS volontairement ? Non : les BS ont `rotation = {bs}`.
  Les non-BS ont `rotation = {fs}` → ils allument aussi les cases Frontside des grilles.

## Reclassements de figures existantes (wakeskate)

| slug (avant → après) | changement |
|---|---|
| `ws-ollie` → `ollie` | catégorie `shoveit` → `jib` ; sport `wakeskate` → `wakeboard` ; sports → wakeboard, wakeskate, seated |
| `ws-body-varial` | catégorie `shoveit` → `variations` (le scoring `ws_body_varial` reste slug-based, indépendant de la catégorie) |

## Couplage grille ↔ slugs

Les slugs ci-dessus sont référencés par les tests de `GRIDS` dans `src/pages/Compo.jsx`
via `SCORING_SLUGS` (case `ws_ollie` → `ollie`, `seated_ollie` → `ollie-180`/`ollie-360`)
et `WS_BODY_VARIALS` (6 slugs body varial). Un garde-fou dev (`import.meta.env.DEV`)
alerte en console si l'un de ces slugs disparaît de la table `figures` — le slug
étant éditable en admin, c'est la protection contre la dérive silencieuse.
