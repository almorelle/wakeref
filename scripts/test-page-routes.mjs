// Vérifie `src/lib/pageViews.js` et, surtout, qu'il n'a pas dérivé du seed SQL
// de `page_routes` : la liste blanche vit des deux côtés (le SQL refuse ce qui
// n'y est pas, le JS évite d'envoyer ce qui serait refusé), et deux listes qui
// divergent donnent une page silencieusement non comptée.
//
//   node scripts/test-page-routes.mjs

import { readFileSync, readdirSync } from 'fs'
import { PAGE_ROUTES, routePattern } from '../src/lib/pageViews.js'

let echecs = 0
const verifie = (nom, obtenu, attendu) => {
  const ok = obtenu === attendu
  if (!ok) { echecs++; console.error(`✗ ${nom}\n    attendu : ${attendu}\n    obtenu  : ${obtenu}`) }
}

// 1. Chaque motif fixe se reconnaît lui-même, et tolère casse et slash final.
for (const { path } of PAGE_ROUTES.filter(r => !r.path.includes(':'))) {
  verifie(`fixe ${path}`, routePattern(path), path)
  if (path !== '/') {
    verifie(`fixe ${path} (slash final)`, routePattern(`${path}/`), path)
    verifie(`fixe ${path} (majuscules)`, routePattern(path.toUpperCase()), path)
  }
}

// 2. Les routes paramétrées, y compris les collisions que l'ordre doit trancher.
const cas = [
  // Fiches de compétition : compteur par id depuis 0024, plus de motif ici.
  ['/competitions/12-wake-open',        null],
  ['/competitions/circuit/le-pro-tour', '/competitions/circuit/:slug'],
  ['/competitions/proposer',            '/competitions/proposer'],
  ['/competitions/federales',           '/competitions/federales'],
  ['/composition/a1b2c3',               '/composition/:id'],
  ['/composition',                      '/composition'],
  // Non comptées : figures (déjà dans figure_views), chromeless, admin, 404.
  ['/figures/tantrum',                  null],
  ['/grille-composition',               null],
  ['/juge/ABCD1234',                    null],
  ['/admin/vues',                       null],
  ['/nawak',                            null],
  ['/competitions/circuit/a/b',         null],
  ['',                                  null],
]
for (const [entree, attendu] of cas) verifie(`route ${entree || '(vide)'}`, routePattern(entree), attendu)

// 3. La liste JS et la table `page_routes` telle que les migrations la laissent :
//    on rejoue, dans l'ordre, chaque `insert into public.page_routes` et chaque
//    `delete from public.page_routes` — un motif retiré par une migration
//    ultérieure (ex. `/competitions/:id` en 0024) ne doit plus figurer côté JS.
const dossier = new URL('./migrations/', import.meta.url)
const seed = new Set()
for (const nom of readdirSync(dossier).filter(f => f.endsWith('.sql')).sort()) {
  const sql = readFileSync(new URL(nom, dossier), 'utf8')
  for (const ins of sql.matchAll(/insert into public\.page_routes[\s\S]*?;/g)) {
    for (const m of ins[0].matchAll(/\(\s*'([^']+)'\s*,/g)) seed.add(m[1])
  }
  for (const del of sql.matchAll(/delete from public\.page_routes where path\s*(?:=|in)\s*\(?([^;]*?)\)?\s*;/g)) {
    for (const m of del[1].matchAll(/'([^']+)'/g)) seed.delete(m[1])
  }
}
const js = new Set(PAGE_ROUTES.map(r => r.path))
for (const p of js) if (!seed.has(p)) { echecs++; console.error(`✗ ${p} est dans pageViews.js mais absent du seed SQL`) }
for (const p of seed) if (!js.has(p)) { echecs++; console.error(`✗ ${p} est dans le seed SQL mais absent de pageViews.js`) }

console.log(echecs === 0 ? `✓ ${PAGE_ROUTES.length} motifs, JS et SQL d'accord` : `${echecs} échec(s)`)
process.exit(echecs === 0 ? 0 : 1)
