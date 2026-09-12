/* Motifs de page comptés par `page_views`, et normalisation d'un pathname vers
   l'un d'eux. Module sans React : le script `scripts/test-page-routes.mjs`
   l'importe pour vérifier qu'il ne dérive pas du seed SQL.

   POURQUOI DES MOTIFS ET PAS DES URLS. Une ligne par adresse ferait enfler la
   table au rythme du contenu. On compte donc la ROUTE, pas l'adresse — sauf là
   où le détail par page a une valeur ET un identifiant stable pour le porter :

   - `/figures/:slug` est absent : `figure_views` compte ces pages une par une,
     par id de figure, depuis la migration 0001.
   - `/competitions/:id` est absent, pour la même raison, depuis la migration
     0024 : `competition_views` compte chaque fiche par id de compétition. On
     l'avait d'abord agrégé ici, au motif que le slug est décoratif — mais l'URL
     porte aussi l'id, qui lui est stable.

   Dans les deux cas, garder le motif ferait doublon avec un total déjà
   calculable, et deux chiffres du même nom qui ne coïncident pas est la pire
   chose qu'on puisse mettre dans un écran de stats.

   `/competitions/circuit/:slug` reste agrégé : trois circuits, et un slug
   dérivé d'un nom en texte libre, sans id pour résister à un renommage.

   Les surfaces chromeless (`/grille-composition`, `/juge`) ne passent pas par
   `PublicLayout` et ne sont donc pas comptées — cohérent avec leur absence du
   sitemap et de la navigation (cf. /admin/special). */

// La casse est celle du motif ; le pathname entrant est minusculé avant
// comparaison, parce que React Router matche sans tenir compte de la casse et
// que `/Quiz` est la même page que `/quiz`.
export const PAGE_ROUTES = [
  { path: '/',                          label: 'Accueil'                   },
  { path: '/figures',                   label: 'Catalogue'                 },
  { path: '/quiz',                      label: 'Quiz'                      },
  { path: '/competitions',              label: 'Agenda des compétitions'   },
  { path: '/competitions/proposer',     label: 'Proposer une compétition'  },
  { path: '/competitions/federales',    label: 'Compétitions fédérales'    },
  { path: '/competitions/circuit/:slug', label: 'Page de circuit'          },
  { path: '/composition',               label: 'Compo'                     },
  { path: '/composition/:id',           label: 'Run partagé'               },
  { path: '/entrainement-juge',         label: 'Entraînement juge'         },
  { path: '/entrainement-juge/voix',    label: 'Saisie vocale'             },
  { path: '/grille-composition-old',    label: 'Grille de composition (héritée)' },
  { path: '/contact',                   label: 'Contact'                   },
  { path: '/submit',                    label: 'Proposer une vidéo'        },
  { path: '/legal',                     label: 'Mentions légales'          },
  { path: '/terms',                     label: 'Conditions d’utilisation'  },
  { path: '/privacy',                   label: 'Confidentialité'           },
]

export const LABELS = Object.fromEntries(PAGE_ROUTES.map(r => [r.path, r.label]))

// Les motifs paramétrés, dans l'ordre où ils doivent être essayés : le plus
// spécifique d'abord, exactement comme les routes d'`App.jsx`. Les chemins fixes
// (`/competitions/proposer`, `/competitions/federales`) sont reconnus avant.
const PARAMETRES = [
  { re: /^\/competitions\/circuit\/[^/]+$/, path: '/competitions/circuit/:slug' },
  { re: /^\/composition\/[^/]+$/,           path: '/composition/:id'            },
]

const FIXES = new Set(PAGE_ROUTES.map(r => r.path).filter(p => !p.includes(':')))

/**
 * pathname → motif compté, ou `null` quand la page n'est pas suivie ici (404,
 * /admin, surfaces chromeless, fiches de tricks et de compétitions — ces deux
 * dernières ont leur propre compteur). `null` veut dire « ne rien
 * écrire » : le RPC refuserait de toute façon un chemin hors liste, mais autant
 * ne pas faire l'aller-retour.
 */
export function routePattern(pathname) {
  if (typeof pathname !== 'string' || !pathname) return null
  // Slash final retiré (`/quiz/` === `/quiz`), sauf pour la racine.
  const p = pathname.toLowerCase().replace(/\/+$/, '') || '/'
  if (FIXES.has(p)) return p
  for (const { re, path } of PARAMETRES) if (re.test(p)) return path
  return null
}
