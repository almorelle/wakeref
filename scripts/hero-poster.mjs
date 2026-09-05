// Régénère `public/hero-poster.jpg` — la première image du premier clip de la
// couverture, celle que le hero affiche pendant que la vidéo se charge.
//
// À relancer chaque fois que `HERO_FIRST` change dans src/data/heroClips.js :
//   node scripts/hero-poster.mjs
//
// Dépend de ffmpeg (brew install ffmpeg) et de VITE_SUPABASE_URL dans .env.local.
// Le poster reste dans public/ et pas dans le bucket : servi depuis l'origine
// du HTML, il évite une résolution DNS + poignée de main TLS sur le chemin du
// LCP, et le service worker le précache avec le reste du build.

import { execFileSync } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')

// .env.local, lu à la main : le script tourne hors de Vite.
const env = Object.fromEntries(
  readFileSync(join(racine, '.env.local'), 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
    .map(l => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
    }),
)
const base = env.VITE_SUPABASE_URL
if (!base) throw new Error('VITE_SUPABASE_URL absent de .env.local')

const { HERO_FIRST, HERO_CLIP_IDS } = await import(
  new URL('../src/data/heroClips.js', import.meta.url)
)
if (HERO_FIRST.id !== HERO_CLIP_IDS[0]) {
  throw new Error(
    `HERO_FIRST.id (${HERO_FIRST.id}) ne correspond plus à HERO_CLIP_IDS[0] (${HERO_CLIP_IDS[0]})`,
  )
}

const src = `${base}/storage/v1/object/public/videos/${HERO_FIRST.path}`
const dest = join(racine, 'public', HERO_FIRST.poster.replace(/^\//, ''))

console.log(`→ ${src}`)
execFileSync(
  'ffmpeg',
  [
    '-v', 'error', '-y',
    '-i', src,
    '-frames:v', '1',
    // 720 px : la résolution native des clips de couverture. Au-delà on
    // n'ajoute que du poids, la vidéo qui prend le relais n'est pas plus fine.
    '-vf', 'scale=720:-2:flags=lanczos',
    '-q:v', '6',
    dest,
  ],
  { stdio: 'inherit' },
)
console.log(`✓ ${dest} — ${(statSync(dest).size / 1024).toFixed(1)} ko`)
