import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { writeFileSync, mkdirSync } from 'fs'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

const hostname = 'https://wakeref.app'
const date = new Date().toISOString()

// Figures
const { data: figures } = await supabase
  .from('figures')
  .select('slug')
  .eq('published', true)
const figureRoutes = (figures || []).map(f => f.slug ? `/figures/${f.slug}` : null).filter(Boolean)

// Catégories
const { data: categories } = await supabase
  .from('categories')
  .select('slug')
const categoryRoutes = (categories || []).map(c => `/figures?cat=${c.slug}`)

const allRoutes = [
  { url: '/',        priority: 1.0, changefreq: 'daily'  },
  { url: '/figures', priority: 0.6, changefreq: 'weekly' },
  { url: '/quiz',    priority: 0.6, changefreq: 'weekly' },
  { url: '/contact', priority: 0.6, changefreq: 'weekly' },
  ...categoryRoutes.map(r => ({ url: r, priority: 0.5, changefreq: 'weekly' })),
  ...figureRoutes.map(r => ({ url: r, priority: 0.8, changefreq: 'weekly' })),
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(r => `  <url>
    <loc>${hostname}${r.url}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join('\n')}
</urlset>`

mkdirSync('public', { recursive: true })
writeFileSync('public/sitemap.xml', xml)
console.log(`Sitemap généré : ${allRoutes.length} URLs`)