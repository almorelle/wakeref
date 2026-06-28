// Matcher dictée→tricks, 100 % LOCAL (aucun réseau, réutilisable hors-ligne au
// palier 2). Prend un segment dicté (une utterance Web Speech) et le rapproche
// des figures via leur nom + leurs alias parlés (figures.aliases).
//
// Stratégie sans dépendance, par paliers de confiance décroissante :
//   1. égalité « compacte » (sans accents/espaces) segment ↔ clé          → 1.0
//   2. une clé est sous-chaîne du segment (gère les fillers : « puis un … ») → ~0.85
//   3. recouvrement de tokens (Jaccard) + petite tolérance d'édition        → < 0.8
// On retourne les meilleures figures candidates (pour des chips à valider).

// Minuscule + sans accents. Base commune à compact() et tokens().
const deburr = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// Normalisation phonétique approche/direction. Le STT FR malmène énormément les
// marqueurs anglais — surtout « toe(side) », entendu « 2 / tau / to / toeau side /
// 2 sides »… On ramène tout à la forme courte (« toe », « back », « front »,
// « heel »), des DEUX côtés (segment ET clés d'alias), pour un match cohérent.
const PHRASE = [
  // toeside et ses innombrables transcriptions → « toe »
  [/\b(toe ?au ?side|toeau|toau|2 sides?|to side|tour side|tos ?ide|toe ?side)\b/g, 'toe'],
  [/\b(back ?sides?)\b/g, 'back'],
  [/\b(front ?sides?)\b/g, 'front'],
  [/\b(heel ?sides?)\b/g, 'heel'],
]
const TOKEN_SYN = { tau: 'toe', tos: 'toe', tose: 'toe', toeau: 'toe', toau: 'toe' }
const normalize = (s) => {
  let t = deburr(s)
  // Dé-collage : le STT soude souvent le marqueur toeside à back/front
  // (« tauback », « toback », « 2back » → « toe back »). Tous ces préfixes
  // collés à back/front signifient toeside → on émet « toe ».
  t = t.replace(/\b(?:toe|tau|to|2)(back|front)\b/g, 'toe $1')
  for (const [re, rep] of PHRASE) t = t.replace(re, rep)
  // token-level + « 2 » EN TÊTE = « toe » mal entendu (jamais une rotation, qui
  // sont impaires : 180→1, 360→3…). Mi-segment on n'y touche pas (« double »…).
  return t.split(/\s+/).map((w, i) => (i === 0 && w === '2') ? 'toe' : (TOKEN_SYN[w] || w)).join(' ')
}

// Forme compacte : normalisée, alphanumérique seul. Même esprit que le RPC
// search_figures, pour un comportement cohérent.
export const compact = s => normalize(s).replace(/[^a-z0-9]/g, '')

// Mots vides fréquents à l'oral entre deux tricks — retirés avant tokenisation.
const FILLERS = new Set([
  'puis', 'ensuite', 'apres', 'après', 'et', 'un', 'une', 'le', 'la', 'les',
  'then', 'a', 'to', 'the', 'de', 'du', 'avec', 'enchaine', 'enchaîne',
])

const tokens = s =>
  normalize(s)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t && !FILLERS.has(t))

const jaccard = (a, b) => {
  if (!a.size || !b.size) return 0
  let inter = 0
  for (const x of a) if (b.has(x)) inter++
  return inter / (a.size + b.size - inter)
}

// Distance d'édition (Levenshtein) — pour tolérer les déformations du STT
// (« backmub » → « backmobe », « smob » → « smobe », « skerchrom » → « scarecrow »).
function lev(a, b) {
  const m = a.length, n = b.length
  if (!m) return n
  if (!n) return m
  const d = new Array(n + 1)
  for (let j = 0; j <= n; j++) d[j] = j
  for (let i = 1; i <= m; i++) {
    let prev = d[0]
    d[0] = i
    for (let j = 1; j <= n; j++) {
      const tmp = d[j]
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return d[n]
}
const similarity = (a, b) => (a === b ? 1 : 1 - lev(a, b) / Math.max(a.length, b.length))

// Construit l'index une fois à partir des figures (figures_card : slug, name,
// aliases, sport…). Chaque figure → ses clés (nom + alias) compactées + tokenisées.
export function buildIndex(figures) {
  return (figures || []).map(f => {
    const phrases = [f.name, ...(f.aliases || [])]
    return {
      fig: f,
      keys: phrases.map(p => ({ c: compact(p), t: new Set(tokens(p)) })).filter(k => k.c),
    }
  })
}

// Score d'un segment contre une figure indexée. 0 = aucun rapport.
function scoreFigure(entry, cseg, tseg) {
  let best = 0
  for (const k of entry.keys) {
    if (!k.c) continue
    if (k.c === cseg) return 1                         // égalité exacte
    // On évalue TOUS les tiers et on garde le max (pas de court-circuit : une clé
    // peut être à la fois sous-chaîne faible ET proche en édition — on veut le meilleur).
    // 1) sous-chaîne, score PROPORTIONNEL à la couverture (pas de plancher) —
    //    sinon un mot court (« ole » dans « bacrole », « blind » dans « front to
    //    blind ») obtient un faux score élevé en ne couvrant qu'une fraction.
    if (cseg.includes(k.c) && k.c.length >= 3) {
      best = Math.max(best, 0.92 * (k.c.length / cseg.length))
    } else if (k.c.includes(cseg) && cseg.length >= 3) {
      best = Math.max(best, 0.6 * (cseg.length / k.c.length))
    }
    // 2) recouvrement de tokens (ordre libre, mots manquants)
    const j = jaccard(tseg, k.t)
    if (j > 0) best = Math.max(best, 0.75 * j)
    // 3) tolérance aux fautes STT : similarité d'édition sur la clé entière. Bornée
    //    sous les tiers exacts (sim 0.6→0.4 … sim 1→0.78), et seulement si les
    //    longueurs sont comparables (évite les faux positifs court↔long).
    if (k.c.length >= 4 && Math.min(cseg.length, k.c.length) / Math.max(cseg.length, k.c.length) >= 0.6) {
      const sim = similarity(cseg, k.c)
      if (sim >= 0.6) best = Math.max(best, 0.4 + 0.95 * (sim - 0.6))
    }
  }
  return best
}

// Rapproche un segment dicté du catalogue indexé. Retourne les meilleures
// figures candidates triées (score décroissant), filtrées par sport si fourni.
// `limit` = nb de candidats (pour proposer des alternatives dans un chip).
export function matchSegment(index, segment, { sports = null, limit = 4, min = 0.25 } = {}) {
  const cseg = compact(segment)
  const tseg = new Set(tokens(segment))
  if (!cseg) return []
  const scored = []
  for (const entry of index) {
    if (sports && !(entry.fig.sports || [entry.fig.sport]).some(s => sports.includes(s))) continue
    const score = scoreFigure(entry, cseg, tseg)
    if (score >= min) scored.push({ fig: entry.fig, score })
  }
  scored.sort((a, b) =>
    b.score - a.score ||
    a.fig.name.length - b.fig.name.length ||
    a.fig.name.localeCompare(b.fig.name, undefined, { numeric: true })
  )
  return scored.slice(0, limit)
}
