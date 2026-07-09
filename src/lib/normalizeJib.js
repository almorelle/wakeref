// ─────────────────────────────────────────────────────────────────────────────
// Compositeur JIB « vocab-driven ». Transforme le STT brut d'une passe jib dictée
// librement en texte canonique (sans virgule). Remplace l'ancien tas de regex par :
//   1. une normalisation des ROTATIONS (vraie règle : convention wake chiffres→degrés)
//   2. un VOCABULAIRE d'atomes (data : canon + variantes) + matching gloutonné
//      (le plus long d'abord → « back lip » bat « back ») + fuzzy de secours
//   3. un ASSEMBLAGE par adjacence (direction collée à sa rotation : « back 180 » →
//      « BS 180 », « 180 front » → « FS 180 »)
// Ajouter un trick = ajouter une ligne dans VOCAB (pas une regex). Atome inconnu =
// passthrough (le mot reste, éditable) → dégradation douce.
// Source du vocabulaire : scripts/jib-atoms.md (+ base figures pour les grabs).
// ─────────────────────────────────────────────────────────────────────────────

// Rotations valides (degrés) — un token qui en fait partie = catégorie 'rot'.
const DEG = new Set(['90', '180', '270', '360', '450', '540', '630', '720', '900', '1080', '1260', '1440'])

// 1. Convention de rotation (algorithmique). Phrases parlées / paires / chiffres
//    seuls → degrés. L'ordre compte (multi-mots avant paires avant chiffres seuls).
function applyRotations(t) {
  return t
    .replace(/\b(?:de\s|2\s)?sets?\s?back\b/g, '270 back')
    .replace(/\b2\s?sets?\b/g, '270')
    .replace(/\b(?:deux\s?sept|de\s?sept|de\s?set|de\s?7|the\s?set|de\s?cette|two\s?seven)\b/g, '270')
    .replace(/\b(?:quatre\s?cinq|four\s?five)\b/g, '450')
    .replace(/\bsix\s?trois\b/g, '630')
    .replace(/\b(?:trois\s?six|three\s?six)\b/g, '360')
    .replace(/\bcinq\s?quatre\b/g, '540')
    .replace(/\b7\s?20\b/g, '720')
    .replace(/\b2\s?7\b/g, '270').replace(/\b4\s?5\b/g, '450').replace(/\b6\s?3\b/g, '630')
    .replace(/\b3\s?6\b/g, '360').replace(/\b5\s?4\b/g, '540').replace(/\b7\s?2\b/g, '720')
    .replace(/\b1\s?8\b/g, '180').replace(/\b9\s?0\b/g, '90')
    .replace(/\b1\b/g, '180').replace(/\b3\b/g, '360').replace(/\b5\b/g, '540')
    .replace(/\b7\b/g, '720').replace(/\b9\b/g, '900')
    .replace(/\bback\s?end\b/g, 'back 180')                            // « back end » = back-un = BS 180
    .replace(/\b(?:bakin|bacain|bakan|bacin|baquin)\b/g, 'back 180')   // garbles « back-un » → BS 180
    .replace(/de\s?l['']autre\s?côté/g, '180')                         // « de l'autre côté » = 180
    .replace(/\btowards\s?line\b/g, 'to board slide')                  // garble de « to board slide »
    .replace(/\b2\b/g, 'to')                  // « 2 » résiduel = « to » (deux-sept déjà consommé)
    .replace(/\bthe\b/g, ' ')                 // filler STT
}

// 2. Vocabulaire : [canon, catégorie, [variantes STT minuscules, multi-mots ok]].
//    cat : struct | appr | dir | slide | mod | ollie | trick | grab
const VOCAB = [
  // structure
  ['entrée',    'struct', ['entrée', 'entre', 'entrez', 'entré', 'entree']],
  ['sortie',    'struct', ['sortie', 'sorti', 'sortit', 'sorty']],
  ['re-entry',  'struct', ['re entry', 'reentry', 'réentrée', 'reentrée', 're entrée', 'réentré']],
  ['transfert', 'struct', ['transfert', 'transfer', 'transfaire', 'transfère', 'transfere', 'transferse']],
  ['to',        'struct', ['to', 'tout', 'tour', 'au']],
  ['over',      'struct', ['over', 'par dessus']],
  ['gap',       'struct', ['gap']],
  ['bank',      'struct', ['bank', 'banks', 'dans le bank', 'in the bank']],
  ['curb',      'struct', ['curb', 'curbs', 'kerb', 'dans la curb', 'dans le curb']],
  ['street',    'struct', ['street', 'est street', 'e street']],
  ['out',       'struct', ['out']],
  ['in',        'struct', ['in']],
  // approches (sens d'entrée) — jamais collées à une rotation
  ['HS', 'appr', ['hs', 'heelside', 'heel side', 'hillside', 'hill side', 'illside', 'healside', 'inside']],
  ['TS', 'appr', ['ts', 'toeside', 'toe side', 'toside', 'tos', 'tau side', 'trop side', 'to side', 'toss side', 'au side']],
  // directions de rotation — collées à leur degré à l'assemblage
  ['FS',    'dir', ['fs', 'frontside', 'front side', 'frontes', 'fronte', 'front']],
  ['BS',    'dir', ['bs', 'backside', 'back side', 'back', 'bac']],
  ['HS BS', 'dir', ['hillback', 'hill back']],
  // slides — boardslide/lipslide NU = backside par défaut (→ backboard/backlip)
  ['frontboard', 'slide', ['frontboard', 'frontside boardslide', 'frontside board slide', 'frontside board', 'front board', 'front de bord', 'fs boardslide', 'fs board']],
  ['boardslide', 'slide', ['boardslide', 'board slide', 'bord slide', 'bandslide', 'boards slide', 'bornes slide', 'bord de slide', 'à bord de slide', 'bonne slide', 'bore slide', 'backboard', 'backside boardslide', 'backside board slide', 'backside board', 'back board', 'backbend', 'bs boardslide', 'bs board']],
  ['frontlip',   'slide', ['frontlip', 'frontside lipslide', 'frontside lip', 'front lip', 'front clip']],
  ['backlip',    'slide', ['backlip', 'backside lipslide', 'backside lip', 'back lip', 'baclip', 'back clip', 'lipslide', 'lip slide']],
  ['nose press', 'slide', ['nose press', 'nospress', 'nosepress', 'nose presse', 'nos presses', 'nos press', 'no spress', 'no press', 'no express']],
  ['tail press', 'slide', ['tail press', 'tailpress', 'tail presse']],
  ['press',      'slide', ['press']],
  ['50-50',      'slide', ['50 50', '5050', 'fifty fifty']],
  // modifiers
  ['rail to rail', 'mod', ['rail to rail', 'rail tour rail', 'rail tout rail']],
  ['to rail',      'mod', ['to rail']],
  ['hardway',      'mod', ['hardway', 'hard way', 'hardware']],
  ['wrapped',      'mod', ['wrapped', 'wrap', 'vrap', 'vrapt', 'frappe', 'frap']],
  ['Pretzel',      'mod', ['pretzel', 'bretzel', 'pred cell', 'predcell']],
  ['blind',        'mod', ['blind', 'blinde', 'blindes', 'blindé']],
  ['tap',          'mod', ['tap']],
  ['switch',       'mod', ['switch']],
  ['fakie',        'mod', ['fakie']],
  // ollie
  ['ollie on', 'ollie', ['ollie on', 'ollion', 'olion', 'olyon', 'oli en', 'odeon', 'au lionne', 'all in', 'all yone', 'oulion', 'oulon', 'allon', 'all ion', 'on lyon']],
  ['to ollie', 'ollie', ['to ollie', 'tout ollie', 'tout olli', 'tout au lit', 'tout allie', 'to olly', 'to olli']],
  ['ollie',    'ollie', ['ollie', 'olly', 'oli', 'all e', 'alle']],
  // tricks nommés (capitalisés)
  ['Tantrum',      'trick', ['tantrum', 'tentrum']],
  ['Mexican Roll', 'trick', ['mexican roll', 'mexican role', 'mexicain roll', 'mexicain', 'mexican']],
  ['Scarecrow',    'trick', ['scarecrow', 'scare crow', 'scare call', 'scarecro']],
]

// Grabs (base figures, catégorie grabs) → « <nom> grab ». nose/tail exigent « grab »
// (sinon collision nose press / tail press).
const GRAB_NAMES = ['melon', 'indy', 'mute', 'method', 'stalefish', 'slob', 'crail', 'japan', 'tindy', 'tailfish', 'nuclear', 'chicken salad', 'roast beef']
for (const g of GRAB_NAMES) {
  const vs = [g, `${g} grab`, `grab ${g}`]
  if (g === 'melon') vs.push('mellon', 'mellon grabe', 'melons de grabe', 'melon de grabe', 'grave melon', 'grave melone', 'melon grave', 'melone grave')
  VOCAB.push([`${g} grab`, 'grab', vs])
}
VOCAB.push(['nose grab', 'grab', ['nose grab', 'grab nose']])
VOCAB.push(['tail grab', 'grab', ['tail grab', 'grab tail']])

// Rotations telles que whisper peut les émettre en BRUT (la grammaire les autorise ;
// applyRotations/le composeur normalisent ensuite en degrés).
const ROTATION_PHRASES = [
  '90', '180', '270', '360', '450', '540', '630', '720', '900', '1080',
  '1', '2', '3', '5', '7', '9',
  '2 7', '3 6', '4 5', '5 4', '6 3', '7 2', '1 8', '9 0', '7 20',
  'deux sept', 'de cette', 'the set', 'de 7', 'de set', 'set back', 'setback',
]

// Phrases autorisées de la grammaire (dictée jib contrainte) = variantes du VOCAB +
// rotations + tricks kicker injectés. Réutilise EXACTEMENT la data du composeur.
export function grammarPhrases(tricks = []) {
  const out = []
  for (const [, , variants] of VOCAB) for (const v of variants) out.push(v)
  out.push(...ROTATION_PHRASES)
  for (const t of (tricks || [])) for (const v of (t.variants || [])) out.push(v)
  return out
}

// Index de base : phrase-variante → { canon, cat }. Et liste des variantes mono-mot
// (≥5 lettres) pour le fuzzy de secours. MAXLEN = plus long phrase du vocab.
const BASE_LOOKUP = new Map()
const BASE_SINGLE = []
let BASE_MAXLEN = 1
for (const [canon, cat, variants] of VOCAB) {
  for (const v of variants) {
    BASE_LOOKUP.set(v, { canon, cat })
    const w = v.split(' ').length
    if (w > BASE_MAXLEN) BASE_MAXLEN = w
    if (w === 1 && v.length >= 5) BASE_SINGLE.push([v, { canon, cat }])
  }
}
const BASE_CTX = { lookup: BASE_LOOKUP, single: BASE_SINGLE, maxlen: BASE_MAXLEN }

// Contexte de matching = vocab de base + tricks injectés (slot trick du jib, alimenté
// par les figures `kicker` non-spin non-grab + leurs `aliases`). Caché par identité de
// la liste `tricks` (stable entre rendus). Chaque variante passe par applyRotations pour
// vivre dans le même espace normalisé que le texte (« moby dick 5 » → « moby dick 540 »).
let _cacheKey = null, _cacheCtx = BASE_CTX
function ctxFor(tricks) {
  if (!tricks || !tricks.length) return BASE_CTX
  if (tricks === _cacheKey) return _cacheCtx
  const lookup = new Map(BASE_LOOKUP)
  const single = BASE_SINGLE.slice()
  let maxlen = BASE_MAXLEN
  for (const t of tricks) {
    if (!t || !t.canon) continue
    for (const v0 of (t.variants || [])) {
      const v = applyRotations(String(v0).toLowerCase()).replace(/\s+/g, ' ').trim()
      if (!v || lookup.has(v)) continue        // ne jamais écraser un atome existant
      const atom = { canon: t.canon, cat: 'trick' }
      lookup.set(v, atom)
      const w = v.split(' ').length
      if (w > maxlen) maxlen = w
      if (w === 1 && v.length >= 5) single.push([v, atom])
    }
  }
  _cacheKey = tricks; _cacheCtx = { lookup, single, maxlen }
  return _cacheCtx
}

// Distance de Levenshtein (bornée — early-out si écart de longueur > 2).
function lev(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 9
  const dp = Array.from({ length: a.length + 1 }, (_, i) => i)
  for (let j = 1; j <= b.length; j++) {
    let prev = dp[0]; dp[0] = j
    for (let i = 1; i <= a.length; i++) {
      const tmp = dp[i]
      dp[i] = Math.min(dp[i] + 1, dp[i - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return dp[a.length]
}

// Fuzzy mono-mot : ne retient qu'un match NON ambigu (strictement le plus proche)
// et proche (distance ≤ 2). Conservateur pour ne pas mal-attribuer.
function fuzzy(tok, single) {
  if (tok.length < 5) return null
  let best = null, bd = 99, sd = 99
  for (const [v, atom] of single) {
    const d = lev(tok, v)
    if (d < bd) { sd = bd; bd = d; best = atom } else if (d < sd) { sd = d }
  }
  return (bd <= 1 && bd < sd) ? best : null
}

// Matching gloutonné : à chaque position, le plus long groupe de tokens qui est dans
// le vocabulaire ; sinon degré → 'rot' ; sinon fuzzy ; sinon passthrough 'raw'.
function matchTokens(tokens, ctx) {
  const items = []
  let i = 0
  while (i < tokens.length) {
    let hit = null, hlen = 0
    for (let len = Math.min(ctx.maxlen, tokens.length - i); len >= 1; len--) {
      const phrase = tokens.slice(i, i + len).join(' ')
      const m = ctx.lookup.get(phrase)
      if (m) { hit = m; hlen = len; break }
    }
    if (hit) { items.push({ cat: hit.cat, text: hit.canon }); i += hlen; continue }
    const tok = tokens[i]
    // « slide » orphelin = résidu d'une phrase slide déjà consommée (board/lip slide,
    // les canons sont « boardslide »/« backlip » sans « slide » suffixe). On le jette,
    // sinon « backlip » ressort « backlip slide ». (Les vraies phrases slide sont
    // matchées AVANT, en groupe → seul un slide danglant arrive ici.)
    if (tok === 'slide' || tok === 'slides') { i++; continue }
    if (DEG.has(tok)) { items.push({ cat: 'rot', text: tok }); i++; continue }
    const fz = fuzzy(tok, ctx.single)
    if (fz) { items.push({ cat: fz.cat, text: fz.canon }); i++; continue }
    items.push({ cat: 'raw', text: tok }); i++
  }
  return items
}

// Assemblage : une direction (FS/BS/« HS BS ») collée à une rotation, dans les deux
// ordres, devient « DIR deg ». Le reste est émis tel quel.
function assemble(items) {
  const out = []
  for (let i = 0; i < items.length; i++) {
    const a = items[i], b = items[i + 1]
    if (a.cat === 'dir' && b && b.cat === 'rot') { out.push(`${a.text} ${b.text}`); i++; continue }
    if (a.cat === 'rot' && b && b.cat === 'dir') { out.push(`${b.text} ${a.text}`); i++; continue }
    out.push(a.text)
  }
  return out.join(' ')
}

// `tricks` (optionnel) : [{ canon, variants[] }] — tricks nommés autorisés en jib
// (figures contexts⊇'kicker', hors spin/grab), avec leurs aliases comme variantes.
export function composeJib(input, { tricks } = {}) {
  if (!input) return ''
  let t = input.toLowerCase()
  t = t.replace(/[.,;:!?\-]+/g, ' ')        // ponctuation & tirets → espace
  t = t.replace(/(\d)\s?mm\b/g, '$1')        // unités parasites : 90mm→90, 2.7mm→2 7
  t = t.replace(/transferto\b/g, 'transfert to')
  t = applyRotations(t)
  t = t.replace(/\s+/g, ' ').trim()
  if (!t) return ''
  const out = assemble(matchTokens(t.split(' '), ctxFor(tricks)))
  return out.charAt(0).toUpperCase() + out.slice(1)
}

// Alias rétro-compatible (imports existants : JudgeVoice, harnais).
export const normalizeJib = composeJib
