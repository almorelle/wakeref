import { next } from '@vercel/edge'

const BOT_UA = [
  'facebookexternalhit', 'twitterbot', 'linkedinbot', 'whatsapp',
  'slackbot', 'discordbot', 'telegrambot', 'googlebot', 'bingbot',
  'applebot', 'pinterest', 'redditbot', 'embedly', 'quora',
]

const SITE_URL  = 'https://wakeref.app'
const OG_IMAGE  = `${SITE_URL}/og-image.jpg`
const SITE_NAME = 'WakeRef'

function isBot(userAgent) {
  if (!userAgent) return false
  const ua = userAgent.toLowerCase()
  return BOT_UA.some(bot => ua.includes(bot))
}

function buildMeta({ title, description, url, image = OG_IMAGE }) {
  return `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${SITE_NAME}" />
  `.trim()
}

function injectMeta(html, meta) {
  return html.replace('</head>', `${meta}\n</head>`)
}

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || ''

  // Laisser passer les humains sans traitement
  if (!isBot(ua)) return next()

  const url  = new URL(request.url)
  const path = url.pathname

  // Récupérer le HTML de base
  const response = await next()
  const html = await response.text()

  let meta

  // Page figure individuelle
  const figureMatch = path.match(/^\/figures\/([^/]+)$/)
  if (figureMatch) {
    const slug = figureMatch[1]
    try {
      const supabaseUrl  = process.env.VITE_SUPABASE_URL
      const supabaseKey  = process.env.VITE_SUPABASE_ANON_KEY
      const res = await fetch(
        `${supabaseUrl}/rest/v1/figures_full?slug=eq.${slug}&select=name,description`,
        { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
      )
      const [figure] = await res.json()
      if (figure) {
        meta = buildMeta({
          title:       `${figure.name} | ${SITE_NAME}`,
          description: figure.description?.substring(0, 160) || `Découvre la figure ${figure.name} sur WakeRef.`,
          url:         `${SITE_URL}${path}`,
        })
      }
    } catch {
      // Fallback meta générique si erreur
    }
  }

  // Pages statiques
  if (!meta) {
    const staticMeta = {
      '/':        { title: SITE_NAME,             description: 'Référentiel complet des figures de wakeboard et wakeskate.' },
      '/figures': { title: `Figures | ${SITE_NAME}`, description: 'Liste complète des figures de wakeboard et wakeskate, par catégorie.' },
      '/quiz':    { title: `Quiz | ${SITE_NAME}`,    description: 'Teste tes connaissances sur les figures de wakeboard et wakeskate.' },
      '/contact': { title: `Contact | ${SITE_NAME}`, description: 'Une question ou une suggestion ? Contacte-moi.' },
    }
    const page = staticMeta[path] || staticMeta['/']
    meta = buildMeta({ ...page, url: `${SITE_URL}${path}` })
  }

  const newHtml = injectMeta(html, meta)

  return new Response(newHtml, {
    status:  response.status,
    headers: { ...Object.fromEntries(response.headers), 'content-type': 'text/html; charset=utf-8' },
  })
}

export const config = {
  matcher: ['/', '/figures', '/figures/:slug*', '/quiz', '/contact'],
}