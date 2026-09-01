#!/usr/bin/env node
// Télécharge toutes les vidéos du bucket Storage `videos` en local, nommées
// d'après la figure à laquelle elles sont rattachées, et écrit un inventaire
// CSV (résolution, durée, poids) pour trier les clips par qualité.
//
//   node scripts/download-videos.mjs [dossier]     # défaut : ./videos-export
//
// Reprend là où il s'est arrêté : un fichier déjà présent et de la bonne taille
// est sauté. `ffprobe` est utilisé s'il est installé (sinon l'inventaire se
// limite au poids).

import { createClient } from '@supabase/supabase-js'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs'
import path from 'node:path'

const execFileP = promisify(execFile)
const OUT = process.argv[2] || 'videos-export'
const CONCURRENCY = 4

// ── env : .env.local du projet
const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

// ── nom de fichier lisible : <slug-figure>__<id-video>.mp4
const slugify = s => (s || 'sans-figure').toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const probe = async file => {
  try {
    const { stdout } = await execFileP('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height,duration', '-of', 'csv=p=0', file])
    const [w, h, d] = stdout.trim().split(',')
    return { w, h, d: d && d !== 'N/A' ? Number(d).toFixed(1) : '' }
  } catch { return { w: '', h: '', d: '' } }
}

const { data: vids, error } = await sb.from('videos')
  .select('id, figure_id, file_path, creator_name, sport')
  .not('file_path', 'is', null).order('id')
if (error) { console.error('Erreur videos :', error.message); process.exit(1) }

const { data: figs } = await sb.from('figures_card').select('id, name, slug').limit(1000)
const byId = new Map((figs || []).map(f => [f.id, f]))

fs.mkdirSync(OUT, { recursive: true })
console.log(`${vids.length} vidéos à récupérer → ${OUT}/\n`)

const rows = []
let done = 0, skipped = 0, failed = 0

const one = async v => {
  const fig = byId.get(v.figure_id)
  const ext = path.extname(v.file_path) || '.mp4'
  const name = `${slugify(fig?.name)}__${v.id}${ext}`
  const dest = path.join(OUT, name)
  const url = sb.storage.from('videos').getPublicUrl(v.file_path).data.publicUrl

  let size = fs.existsSync(dest) ? fs.statSync(dest).size : 0
  if (size > 0) skipped++
  else {
    try {
      const r = await fetch(url)
      if (!r.ok) throw new Error('HTTP ' + r.status)
      fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()))
      size = fs.statSync(dest).size
      done++
    } catch (e) {
      failed++
      console.error('  ✗', name, '—', e.message)
      return
    }
  }
  const { w, h, d } = await probe(dest)
  rows.push({ name, figure: fig?.name || '', slug: fig?.slug || '', sport: v.sport || '',
              creator: v.creator_name || '', w, h, d, ko: Math.round(size / 1024) })
  const n = done + skipped + failed
  if (n % 20 === 0) process.stdout.write(`  ${n}/${vids.length}\r`)
}

// petit pool de téléchargement, pour ne pas ouvrir 200 connexions d'un coup
const queue = [...vids]
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (queue.length) await one(queue.shift())
}))

// ── inventaire, trié du plus défini au moins défini
rows.sort((a, b) => (Number(b.w) * Number(b.h) || 0) - (Number(a.w) * Number(a.h) || 0))
const csv = ['fichier;figure;slug;sport;auteur;largeur;hauteur;duree_s;poids_ko',
  ...rows.map(r => [r.name, r.figure, r.slug, r.sport, r.creator, r.w, r.h, r.d, r.ko].join(';'))].join('\n')
fs.writeFileSync(path.join(OUT, '_inventaire.csv'), csv)

console.log(`\n${done} téléchargées, ${skipped} déjà présentes, ${failed} en échec`)
console.log(`Inventaire : ${OUT}/_inventaire.csv (trié par définition décroissante)`)
// Une couverture plein écran veut au moins 1920 de large (paysage) ou
// 1080 de large (portrait). « Une dimension ≥ 1080 » ne veut rien dire ici :
// ça compte le 1280×720, qui reste du 720p.
const land = rows.filter(r => Number(r.w) >= 1920)
const port = rows.filter(r => Number(r.w) >= 1080 && Number(r.h) > Number(r.w))
console.log(`Candidats couverture — paysage ≥1920 : ${land.length} | portrait ≥1080 : ${port.length}`)
