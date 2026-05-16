import { createClient } from '@supabase/supabase-js'
import { writeFileSync, mkdirSync } from 'fs'

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

const staticRoutes = ['/', '/figures', '/quiz', '/contact']

const { data } = await supabase.from('figures').select('slug').eq('published', true)
const figureRoutes = (data || []).map(f => `/figures/${f.slug}`)

const allRoutes = [...staticRoutes, ...figureRoutes]
const hostname = 'https://wakeref.app'
const date = new Date().toISOString()

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(r => `  <url>
    <loc>${hostname}${r}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>${r === '/' ? 'daily' : 'weekly'}</changefreq>
    <priority>${r === '/' ? '1.0' : r.startsWith('/figures/') ? '0.8' : '0.6'}</priority>
  </url>`).join('\n')}
</urlset>`

mkdirSync('public', { recursive: true })
writeFileSync('public/sitemap.xml', xml)
console.log(`Sitemap généré : ${allRoutes.length} URLs`)