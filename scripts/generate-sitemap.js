import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
// Une seule implémentation de la forme d'URL, partagée avec les pages : deux
// copies divergentes produiraient des URLs de sitemap différentes des canonical.
import { competitionPath } from '../src/lib/competitionDates.js'
import { writeFileSync, mkdirSync, existsSync } from 'fs'

dotenv.config({ path: '.env.local' })

const hostname = 'https://wakeref.app'
const date = new Date().toISOString()

// Routes statiques : toujours présentes, indépendantes de la base.
const staticRoutes = [
  { url: '/',        priority: 1.0, changefreq: 'daily'  },
  { url: '/figures', priority: 0.6, changefreq: 'weekly' },
  { url: '/quiz',    priority: 0.6, changefreq: 'weekly' },
  { url: '/contact', priority: 0.6, changefreq: 'weekly' },
  { url: '/competitions', priority: 0.7, changefreq: 'weekly' },
]

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
  if (figErr) throw figErr

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
    .select('id, name')
    .eq('published', true)
  if (compErr) throw compErr

  const competitionRoutes = (comps || []).map(c => ({
    url: competitionPath(c),
    priority: 0.6,
    changefreq: 'weekly',
  }))

  return [...figureRoutes, ...competitionRoutes]
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
