// Génère scripts/migrations/0009-seed-aliases.sql — surnoms parlés (figures.aliases)
// pour la saisie de run à la voix (juges). Lecture seule de la base (figures
// publiées via l'API REST, clé anon de .env.local). Rejouable : ré-exécuter quand
// le catalogue change. Le SQL produit ÉCRASE figures.aliases des figures couvertes.
//
//   node scripts/gen-aliases.mjs
//
// Périmètre : kicker / air tricks (toutes catégories SAUF `jib`, traité plus tard —
// le jib a des rotations multiples de 90° absentes de la base). Deux régimes :
//   1. catégorie `spin` → combinatoire systématique (approche + sens + nombre parlé)
//   2. tricks nommés    → dictionnaire de surnoms colloquiaux + suffixe de rotation
//
// Règles orales (données par l'expert) :
//   - approche omise = heelside (hs) ; toeside dit « toe » / « toeside »
//   - sens omis = frontside (fs) ; backside dit « back » / « backside »
//   - le nombre = la centaine parlée : 180→« un », 360→« trois », 540→« cinq »,
//     720→« sept », 900→« neuf », 1080→« dix » / « mille », etc. ; FR + EN mêlés.
//   - ordre libre : « toe trois back » / « toe back trois » / « back trois » …

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const env = Object.fromEntries(
  readFileSync(join(ROOT, '.env.local'), 'utf8')
    .split('\n').filter(l => l.includes('=')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const URL = env.VITE_SUPABASE_URL, KEY = env.VITE_SUPABASE_ANON_KEY

async function rest(path) {
  const r = await fetch(`${URL}/rest/v1/${path}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } })
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`)
  return r.json()
}

// ── Nombre parlé (centaine), FR + EN ────────────────────────────────────────
const NUM = {
  180:  ['un', 'one'],
  360:  ['trois', 'three'],
  540:  ['cinq', 'five'],
  720:  ['sept', 'seven'],
  900:  ['neuf', 'nine'],
  1080: ['dix', 'mille', 'ten'],
  1260: ['douze', 'twelve'],
  1440: ['quatorze', 'fourteen'],
}

// ── Régime 1 : catégorie spin (combinatoire) ────────────────────────────────
const approachForms = (f) => {
  if (/ollie/i.test(f.name)) return ['ollie']
  const ap = f.approach || []
  if (ap.includes('ts')) return ['toe', 'toeside']
  if (ap.includes('fakie')) return ['fakie']
  return ['']                                  // hs / regular / aucune → omise
}
const dirForms = (f) => {
  const rot = f.rotation || []
  if (rot.includes('bs')) return ['back']        // « backside » quasi jamais dit à l'oral
  if (rot.includes('fs')) return ['', 'front']   // fs omis par défaut, mais SOUVENT dit « front »
  return ['']                                    // aucune rotation → omis
}
const clean = s => s.replace(/\s+/g, ' ').trim()
function spinAliases(f) {
  const nums = NUM[f.spin]
  if (!nums) return []                          // sp0 (Rewind) → géré en NICK
  const out = new Set()
  for (const a of approachForms(f)) for (const d of dirForms(f)) for (const n of nums) {
    out.add(clean(`${a} ${n} ${d}`))            // toe trois back / trois back / trois
    out.add(clean(`${a} ${d} ${n}`))            // toe back trois / back trois
  }
  return [...out]
}

// ── Régime 2 : tricks nommés (surnoms colloquiaux + suffixe rotation) ────────
// Clé = slug. Le nom canonique reste cherché par ailleurs ; on n'ajoute QUE les
// formes parlées qui en diffèrent (mot collé, abréviation, nombre parlé, « blind »).
const NICK = {
  // — railey —
  '911': ['nine eleven', 'neuf onze'],
  'hoochie-glide': ['hoochie'],
  'indy-glide': ['indy glide'],
  'ohh': ['o h h'],
  // Railey : le STT francophone l'entend « really / rallye / raleigh » → phonétiques.
  'railey': ['railey', 'really', 'rallye', 'raleigh', 'rayleigh'],
  'ts-railey': ['toe railey', 'toeside railey', 'toe rallye', 'toe really', 'toe raleigh', 'toe rayleigh'],
  // Blind Judge = railey-to-blind → souvent dicté « railey blind » (et le STT
  // l'entend « riley/ready/raelé blind »). On couvre les formes colloquiales.
  'blind-judge': ['blind judge', 'railey blind', 'rallye blind', 'really blind', 'rae blind', 'ready blind', 'railey to blind'],
  'ts-blind-judge': ['toe blind judge', 'toe railey blind', 'toe rallye blind'],
  'butter-fuko': ['butter'],
  // Krypt : le STT déforme en « crypt/egypt/écript » → on tune sur ses erreurs.
  'krypt': ['railey krypt', 'krypt', 'crypt', 'egypt', 'railey egypt', 'railey crypt', 'rayleigh crypt', 'rayleigh krypt'],
  'ts-krypt': ['toe krypt', 'toe crypt', 'toe egypt'],
  // Famille 31x (railey) : le STT écrit le NOMBRE en chiffres (« 313 », « 3 13 »,
  // « 315 »). On ajoute les formes chiffrées + brut + back/toe.
  '313': ['trois treize', 'three thirteen', '313', '3 13'],
  '313-rewind': ['trois treize rewind', '313 rewind'],
  'bs-313': ['back trois treize', 'trois treize back', '313 back', 'back 313'],
  'bs-313-rewind': ['back trois treize rewind', '313 back rewind'],
  'ts-313': ['toe trois treize', 'ninety two ten', 'nine o two ten', 'toe 313', '313 toe', '90210'],
  'ts-bs-313': ['toe back trois treize', 'toe trois treize back', 'toe 313 back'],
  'rubber-chicken': ['rubber chicken'],
  '315': ['trois quinze', 'three fifteen', 'nickelodeon', '315', '3 15'],
  'bs-315': ['back trois quinze', 'trois quinze back', '315 back', 'back 315'],
  'ts-315': ['toe trois quinze', 'toe 315', '315 toe'],
  '317': ['trois dix-sept', 'three seventeen', '317', '3 17'],
  'bs-317': ['back trois dix-sept', 'trois dix-sept back', '317 back', 'back 317'],

  // — s-bend —
  's-bend': ['sbend', 's bend'],
  'ts-s-bend': ['toe sbend', 'toe s bend', 'toeside s bend'],
  's-bend-to-blind': ['sbend blind', 's bend blind'],
  'ts-s-bend-to-blind': ['toe s bend blind', 'toe sbend blind'],
  's-mobe': ['smobe', 's mobe'],
  's-mobe-5': ['smobe cinq', 's mobe cinq', 's mobe five'],
  's-mobe-rewind': ['s mobe rewind', 'smobe rewind'],
  'double-s-bend': ['double sbend', 'double s bend'],
  'double-s-bend-to-blind': ['double s bend blind', 'double sbend blind'],
  'heart-attack-5': ['heart attack cinq', 'heart attack five'],

  // — hinterberger —
  'hinterberger': ['hinter'],
  'hinterberger-to-blind': ['hinter blind', 'hinterberger blind'],
  'hinterberger-5': ['hinter cinq', 'hinterberger five'],
  '118': ['cent dix-huit', 'one eighteen', 'double hinterberger'],
  '118-900': ['cent dix-huit neuf', '118 neuf', 'double hinterberger neuf'],

  // — backroll —
  'back-roll': ['backroll'],
  'ts-back-roll': ['toe backroll', 'toeside backroll', 'ts backroll'],
  'double-backroll': ['double backroll'],
  'double-ts-back-roll': ['double toe backroll', 'double ts backroll'],
  'roll-to-blind': ['back blind', 'backroll blind', 'roll blind'],
  'roll-to-revert': ['back revert', 'backroll revert', 'roll revert'],
  'ts-roll-to-blind': ['toe back blind', 'toe roll to blind'],
  'ts-roll-to-revert': ['toe back revert', 'toe roll to revert'],
  'double-backroll-to-revert': ['double backroll revert', 'double back revert'],
  'back-mobe': ['backmobe'],
  'back-mobe-5': ['back mobe cinq', 'back mobe five'],
  'back-mobe-7': ['back mobe sept', 'back mobe seven'],
  'big-mac': ['big mac'],
  'blind-pete': ['blind pete'],
  'pete-rose': ['pete rose'],
  'pete-rose-5': ['pete rose cinq', 'pete rose five'],
  'pete-rose-7': ['pete rose sept', 'pete rose seven'],
  'kgb-5': ['kgb cinq', 'kgb five'],
  // switchs nommés (slugs propres, pas de combinatoire)
  'half-cab-roll': ['half cab', 'halfcab', 'half cab roll'],
  'ts-half-cab-roll': ['toe half cab', 'toe halfcab', 'ts half cab'],
  'double-half-cab-roll': ['double half cab', 'double halfcab'],
  'blind-pete-rose': ['blind pete rose'],

  // — front —
  // NB : ne PAS ajouter « front » nu ici — « front » est sous-chaîne de « frontes »
  // (rendu STT de « frontside »), ça volerait les spins « 3 6 frontes » → HS FS 360.
  // « front » seul reste ambigu (Front Flip vs spin frontside) → laissé au chip.
  'front-flip': ['frontflip'],
  'front-roll': ['frontroll'],
  'front-flip-to-blind': ['front blind', 'frontflip blind', 'front flip blind'],
  'front-flip-to-fakie': ['front fakie', 'frontflip fakie'],
  'mexican-roll': ['mexican'],
  'mexican-roll-to-revert': ['mexican revert', 'mexican roll revert'],
  // Crow Mobe : le STT FR l'entend très mal → « chrome … / col mab ». Phonétiques.
  'crow-mobe': ['crowmobe', 'crow mob', 'chrome mob', 'chrome mobe', 'chrome', 'chrome hub', 'col mab', 'gros mob', 'gross mob'],
  'crow-mobe-5': ['crow mobe cinq', 'crow mobe five', 'crowmobe cinq'],
  'crow-mobe-7': ['crow mobe sept', 'crow mobe seven'],
  'dum-dum': ['dumdum'],
  'dum-dum-5': ['dum dum cinq', 'dumdum cinq', 'dum dum five'],
  'slim-chance': ['slim chance'],
  'slim-chance-5': ['slim chance cinq', 'slim chance five'],
  'front-blind-mobe': ['front blind mobe'],
  'east-mobe': ['east mobe', 'eastmobe'],

  // — tantrum —
  'tantrum': ['tan'],
  'double-tantrum': ['double tan'],
  'tantrum-to-blind': ['tantrum blind', 'tan blind', 'tan to blind'],
  'tantrum-to-fakie': ['tantrum fakie', 'tan fakie'],
  'double-tantrum-to-blind': ['double tantrum blind', 'double tan blind'],
  'moby-dick': ['moby', 'md'],
  'moby-dick-5': ['moby dick cinq', 'moby cinq', 'moby five', 'md cinq'],
  'moby-dick-7': ['moby dick sept', 'moby sept', 'moby seven', 'md sept'],
  'whirly-bird': ['whirly'],
  'whirly-5': ['whirly cinq', 'whirly five'],
  'whirly-7': ['whirly sept', 'whirly seven'],
  'whirly-dick': ['whirly dick'],

  // — whip —
  'bell-air': ['bellair'],
  'ben-air': ['benair'],
  'bell-air-to-blind': ['bell air blind', 'bellair blind'],
  'bell-air-to-fakie': ['bell air fakie', 'bellair fakie'],
  'ben-air-tootsie': ['ben air tootsie'],
  'ben-air-tootsie-rewind': ['ben air tootsie rewind'],
  'egg-roll': ['eggroll'],
  'egg-mobe': ['eggmobe'],
  'bell-air-moby-dick': ['bell air moby', 'bellair moby dick'],
  'tweetie-5': ['tweetie cinq', 'tweetie five'],
  'tweetie-dick': ['tweetie dick'],

  // — grabs (formes collées / abrégées seulement) —
  'chicken-salad': ['chickensalad'],
  'nose-grab': ['nose', 'nosegrab'],
  'tail-grab': ['tail', 'tailgrab'],
  'roast-beef': ['roastbeef'],
  'seat-belt': ['seatbelt'],
  'stalefish': ['stale fish'],

  // — variations —
  'ole': ['ola'],
  'blind': ['blind air'],
  'seated-bs-shifty': ['back shifty', 'shifty back'],
  'seated-fs-shifty': ['shifty', 'front shifty'],

  // — wakeskate : shove-it —
  'ws-shuvit': ['shuvit', 'shove', 'shove it'],
  'ws-pop-shuvit': ['pop shuvit', 'pop shove it', 'pop shove'],
  'ws-360-shuvit': ['three sixty shuvit', '360 shuvit', 'trois six shuvit'],
  'ws-big-spin': ['big spin', 'bigspin'],
  'ws-bigger-spin': ['bigger spin', 'biggerspin'],
  'ws-gazelle': ['gazelle'],
  // — wakeskate : flip tricks —
  'ws-kickflip': ['kick flip'],
  'ws-heelflip': ['heel flip'],
  'ws-fingerflip': ['finger flip'],
  'ws-bigflip': ['big flip'],
  'ws-hardflip': ['hard flip'],
  'ws-sexchange': ['sex change'],
  'ws-varial-kickflip': ['varial kickflip', 'varial flip', 'varial kick'],
  'ws-360-kickflip': ['360 kickflip', 'three sixty kickflip', 'trois six kickflip'],
  'ws-bs-kickflip': ['backside kickflip', 'back kickflip', 'bs kickflip'],
  'ws-fs-kickflip': ['frontside kickflip', 'front kickflip', 'fs kickflip'],
  // — wakeskate : specials —
  'ws-mute-special': ['mute'],
  // — variations wakeskate —
  'ws-body-varial': ['body varial', 'bodyvarial'],
}

// ── Passe finale : équivalence de langue des mots-nombres ───────────────────
// Le nombre PARLÉ (centaine de rotation) se dit en FR, en EN, ou s'écrit en
// CHIFFRES par le STT : « moby dick cinq » ≡ « moby dick five » ≡ « moby dick 5 ».
// On génère systématiquement TOUTES ces formes pour chaque mot-nombre, sur l'alias
// entier (spin combos ET surnoms). Le chiffre est crucial : Whisper transcrit
// quasi toujours « back 3 », « front 3 », « 315 » — pas « back trois ».
const NUM_GROUPS = [
  ['un', 'one', '1', '180'], ['trois', 'three', '3', '360'], ['cinq', 'five', '5', '540'], ['sept', 'seven', '7', '720'],
  ['neuf', 'nine', '9', '900'], ['dix', 'mille', 'ten', '10', '1080'], ['douze', 'twelve', '12', '1260'], ['quatorze', 'fourteen', '14', '1440'],
]
const NUM_SYN = {}
for (const g of NUM_GROUPS) for (const w of g) NUM_SYN[w] = g
// Tricks où le nombre fait partie du NOM (313, 315, 317, 911…), pas une rotation
// à traduire → on ne touche pas (« trois treize » ne devient pas « three treize »).
const SKIP_EXPAND = /treize|quinze|dix-sept|onze|thirteen|fifteen|seventeen|eleven/

function expandNumbers(aliases) {
  const out = new Set()
  for (const al of aliases) {
    out.add(al)
    if (SKIP_EXPAND.test(al)) continue
    const toks = al.split(' ')
    const idxs = toks.map((t, i) => (NUM_SYN[t] ? i : -1)).filter(i => i >= 0)
    if (!idxs.length) continue
    let variants = [toks]
    for (const i of idxs) {
      const next = []
      for (const v of variants) for (const syn of NUM_SYN[v[i]]) { const c = [...v]; c[i] = syn; next.push(c) }
      variants = next
    }
    for (const v of variants) out.add(v.join(' '))
  }
  return [...out]
}

// ── Assemblage ──────────────────────────────────────────────────────────────
const sqlArray = arr =>
  '{' + arr.map(a => '"' + a.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',') + '}'

const figs = await rest('figures?select=id,slug,name,sport,sports,is_switch,approach,rotation,spin,inverts,category_id&order=category_id,spin,name&limit=600')
const cats = Object.fromEntries((await rest('categories?select=id,slug')).map(c => [c.id, c.slug]))

const rows = []
let spinCount = 0, nickCount = 0
for (const f of figs) {
  if (cats[f.category_id] === 'jib') continue          // jib traité au palier suivant
  const set = new Set()
  if (cats[f.category_id] === 'spin') { spinAliases(f).forEach(a => set.add(a)); if (set.size) spinCount++ }
  if (NICK[f.slug]) { NICK[f.slug].forEach(a => set.add(a)); nickCount++ }
  const aliases = expandNumbers([...set].filter(Boolean))
  if (aliases.length) rows.push({ slug: f.slug, name: f.name, aliases })
}

const lines = [
  '-- Migration 0009 — seed des alias parlés (figures.aliases)',
  '--',
  '-- GÉNÉRÉ par scripts/gen-aliases.mjs — NE PAS éditer à la main (rejouer le script).',
  '-- Périmètre : kicker / air tricks (hors jib). ÉCRASE aliases des figures listées.',
  '-- À exécuter dans l\'éditeur SQL Supabase, APRÈS la migration 0008.',
  '--',
  `-- ${rows.length} figures couvertes (${spinCount} via combinatoire spin, ${nickCount} via surnoms nommés).`,
  '',
]
for (const r of rows) {
  lines.push(`-- ${r.name}`)
  lines.push(`update public.figures set aliases = '${sqlArray(r.aliases)}'::text[] where slug = '${r.slug.replace(/'/g, "''")}';`)
}
lines.push('')

const outPath = join(ROOT, 'scripts/migrations/0009-seed-aliases.sql')
writeFileSync(outPath, lines.join('\n'))
console.log(`✓ ${rows.length} figures, ${rows.reduce((n, r) => n + r.aliases.length, 0)} alias → ${outPath}`)
console.log('\nÉchantillon :')
for (const r of rows.filter(r => ['ts-bs-360', 'hs-bs-180', 'hs-fs-1080', 'roll-to-blind', '313', 'moby-dick-5', 'ws-bs-kickflip'].includes(r.slug)))
  console.log(`  ${r.slug.padEnd(20)} ${JSON.stringify(r.aliases)}`)

// Sidecar JSON (dev) : tout le catalogue + aliases générés, pour tester le matcher
// hors-ligne avant d'appliquer le SQL. Non versionné (scratchpad).
const PREVIEW = process.env.PREVIEW_JSON
if (PREVIEW) {
  const bySlug = Object.fromEntries(rows.map(r => [r.slug, r.aliases]))
  const preview = figs.map(f => ({ slug: f.slug, name: f.name, sport: f.sport, sports: f.sports, aliases: bySlug[f.slug] || [] }))
  writeFileSync(PREVIEW, JSON.stringify(preview))
  console.log(`\n(sidecar test → ${PREVIEW})`)
}
