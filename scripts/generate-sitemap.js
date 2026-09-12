import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
// Une seule implémentation de la forme d'URL, partagée avec les pages : deux
// copies divergentes produiraient des URLs de sitemap différentes des canonical.
import { competitionPath, slugify } from '../src/lib/competitionDates.js'
import { tourPath, FEDERAL_PATH } from '../src/lib/competitionAssets.js'
import { writeFileSync, mkdirSync, existsSync } from 'fs'

dotenv.config({ path: '.env.local' })

const hostname = 'https://wakeref.app'
// Plafond explicite sur les requêtes, même convention que le ruban des
// compétitions (`Competitions.jsx`). Sans lui, PostgREST tronque au-delà de son
// seuil par défaut SANS RIEN SIGNALER : le script sortirait en code 0, le build
// passerait, et le sitemap serait simplement amputé — Google cesserait d'être
// informé des pages manquantes sans que rien ne l'indique. Franc et lointain :
// à 221 figures publiées, on a de la marge, et l'avertissement ci-dessous
// préviendra bien avant qu'il ne morde.
const MAX_ROWS = 5000
const date = new Date().toISOString()

// Routes statiques : toujours présentes, indépendantes de la base.
const staticRoutes = [
  { url: '/',        priority: 1.0, changefreq: 'daily'  },
  { url: '/figures', priority: 0.6, changefreq: 'weekly' },
  { url: '/quiz',    priority: 0.6, changefreq: 'weekly' },
  { url: '/contact', priority: 0.6, changefreq: 'weekly' },
  { url: '/competitions', priority: 0.7, changefreq: 'weekly' },
  // Statique, contrairement aux circuits : la page existe même sans compétition
  // fédérale publiée — elle dit alors qu'aucune n'est annoncée.
  { url: FEDERAL_PATH,    priority: 0.5, changefreq: 'weekly' },
  // Les deux outils : dans le menu et le pied de page, avec titre, description
  // et canonical propres — donc faits pour être trouvés. Ils manquaient ici
  // depuis l'origine du script, sans que rien ne l'ait décidé.
  { url: '/composition',       priority: 0.6, changefreq: 'weekly' },
  { url: '/entrainement-juge', priority: 0.6, changefreq: 'weekly' },
]

// Volontairement ABSENTES de la liste ci-dessus, pour que l'omission se
// distingue de l'oubli :
//
// - `/submit` et `/competitions/proposer` : des formulaires. On veut qu'ils
//   soient atteints depuis le site, pas depuis une recherche — un formulaire
//   n'est pas une réponse à une question posée à un moteur.
// - `/legal`, `/terms`, `/privacy` : obligations légales, à lire depuis le pied
//   de page. Rien à y gagner en visibilité, et les déclarer diluerait un
//   sitemap dont tout le reste est du contenu wake.
//
// Aucune n'est pour autant `noindex` : elles restent liées depuis chaque page,
// donc explorables — les omettre ici ne les cache pas, ça dit seulement qu'on
// ne les met pas en avant. Une page qu'on voudrait vraiment invisible demande
// la balise robots, pas une absence.
//
// Pas déclarées non plus, mais pour une autre raison : les quatre pages hors
// navigation (`/grille-composition`, `/juge`, `/entrainement-juge/voix`,
// `/grille-composition-old`), qu'on ne veut pas voir circuler — elles sont
// recensées dans /admin/special. Et `/composition/:id`, les runs partagés :
// `Compo` pose une canonical en dur vers `/composition`, ils s'y consolident
// déjà.

// Un plafond atteint est indiscernable d'un jeu complet : on le dit, sinon la
// troncature resterait aussi muette qu'avant, juste déplacée.
function avertirSiPlafondAtteint(rows, table) {
  if ((rows || []).length >= MAX_ROWS) {
    console.warn(
      `⚠ Sitemap : ${table} a atteint le plafond de ${MAX_ROWS} lignes — ` +
      'le sitemap est probablement incomplet. Relever MAX_ROWS ou paginer.',
    )
  }
}

// Récupère les routes dynamiques depuis Supabase. Lève en cas de variables
// d'env manquantes ou d'erreur de requête — l'appelant gère le repli.
async function fetchDynamicRoutes() {
  const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = process.env
  if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY) {
    throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY absentes')
  }

  const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)

  const { data: figures, error: figErr } = await supabase
    .from('figures')
    .select('slug')
    .eq('published', true)
    .limit(MAX_ROWS)
  if (figErr) throw figErr
  avertirSiPlafondAtteint(figures, 'figures')

  // NB : on n'ajoute PAS les vues filtrées /figures?cat=… au sitemap. Le filtre
  // est appliqué côté client : au crawl, /figures?cat=spin sert le même HTML que
  // /figures, et sa canonical pointe vers /figures. Les lister ici demanderait à
  // Google d'indexer des doublons (cause « page en double sans URL canonique »).
  const figureRoutes = (figures || [])
    .filter(f => f.slug)
    .map(f => ({ url: `/figures/${f.slug}`, priority: 0.8, changefreq: 'weekly' }))

  // Compétitions publiées. Le slug de l'URL est décoratif (seul l'id est lu au
  // routage) mais il doit figurer ici : c'est la forme que les gens partagent.
  const { data: comps, error: compErr } = await supabase
    .from('competitions')
    .select('id, name, tour_name')
    .eq('published', true)
    .limit(MAX_ROWS)
  if (compErr) throw compErr
  avertirSiPlafondAtteint(comps, 'competitions')

  const competitionRoutes = (comps || []).map(c => ({
    url: competitionPath(c),
    priority: 0.6,
    changefreq: 'weekly',
  }))

  // Une page par circuit, déduite des `tour_name` distincts — il n'existe pas
  // d'entité « circuit », donc pas de table à lire. Ces pages ne montrent que
  // l'année en cours : leur contenu ne bouge qu'au rythme des étapes annoncées,
  // d'où `weekly` — comme les compétitions qu'elles listent.
  const tourSlugs = new Set()
  const tourNames = []
  for (const c of comps || []) {
    const slug = slugify(c.tour_name)
    if (slug && !tourSlugs.has(slug)) { tourSlugs.add(slug); tourNames.push(c.tour_name) }
  }
  // `tourPath` plutôt qu'une chaîne recopiée : l'URL d'un circuit n'a qu'une
  // définition, partagée avec les pages — deux copies divergeraient un jour.
  const tourRoutes = tourNames.map(name => ({
    url: tourPath(name),
    priority: 0.5,
    changefreq: 'weekly',
  }))

  return [...figureRoutes, ...competitionRoutes, ...tourRoutes]
}

function renderSitemap(routes) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(r => `  <url>
    <loc>${hostname}${r.url}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join('\n')}
</urlset>`
}

// Le sitemap est un artefact best-effort : une base injoignable ou des env vars
// absentes ne doivent JAMAIS casser le build (sortie code 0 dans tous ces cas).
let dynamicRoutes = []
try {
  dynamicRoutes = await fetchDynamicRoutes()
} catch (err) {
  console.warn(`⚠ Sitemap : routes dynamiques ignorées (${err.message}).`)
  // On préserve le dernier sitemap connu plutôt que de le dégrader.
  if (existsSync('public/sitemap.xml')) {
    console.warn('⚠ Sitemap : public/sitemap.xml existant conservé ; build poursuivi.')
    process.exit(0)
  }
  console.warn('⚠ Sitemap : écriture d\'un sitemap statique minimal ; build poursuivi.')
}

const allRoutes = [...staticRoutes, ...dynamicRoutes]
mkdirSync('public', { recursive: true })
writeFileSync('public/sitemap.xml', renderSitemap(allRoutes))
console.log(`Sitemap généré : ${allRoutes.length} URLs`)
