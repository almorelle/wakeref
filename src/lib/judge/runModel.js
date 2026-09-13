// Helpers du RUN et du SCORING (saisie du juge). Portés du proto
// proto-assets/competition-module.html (onglets Saisie/Poule). Certaines fonctions
// MUTENT les objets `row`/`rows` qu'on leur passe : le reducer leur fournit toujours
// une COPIE profonde du run courant (rows ~20 items → clone trivial), ce qui permet de
// réutiliser la logique du proto quasi telle quelle tout en gardant des refs neuves
// pour React. Les prédicats et le scoring sont purs.
import { zonesOnly, singleSide, moduleSides } from './model'

export const RATES = ['bad', 'ok', 'top']
export const RLAB = { bad: 'pas terrible', ok: 'ok', top: 'extra' }

// micro SIMULÉ : pioche dans un pool (le vrai pipeline voix se branchera plus tard).
const POOL = {
  kicker: ['Tantrum', 'Pete Rose', 'Scarecrow', 'Moby Dick', 'Backroll', 'S-Bend'],
  air: ['HS FS 360', 'TS BS 540', 'Half Cab Roll', 'Backside 313', 'Roll to Blind'],
}
let pi = 0
export function pickTrick() { return POOL.kicker[pi++ % POOL.kicker.length] }
export function pickAir() { return POOL.air[pi++ % POOL.air.length] }

// id stable de rider (clé React, robuste aux insertions/suppressions).
let ridSeq = 0
export function riderId() { return `r${Date.now().toString(36)}${(ridSeq++).toString(36)}` }

// mapping côté (int/ext) → position visuelle gauche/droite selon le sens du câble.
export function leftSide(cableSpin) { return cableSpin === 'regular' ? 'ext' : 'int' }
export function rightSide(cableSpin) { return cableSpin === 'regular' ? 'int' : 'ext' }
export function visualTag(cableSpin, s) { return leftSide(cableSpin) === s ? '◂ gauche' : 'droite ▸' }

export function secOf(parcours, r) { return parcours.find((s) => s.id === r.secId) }
export function defaultKind(sec) {
  const ks = [sec && sec.int && sec.int.kind, sec && sec.ext && sec.ext.kind].filter(Boolean)
  if (!ks.length) return 'kicker'
  return ks.includes('kicker') ? 'kicker' : 'jib'
}
export function moduleKind(parcours, r) {
  const sec = secOf(parcours, r)
  return r.side ? ((sec[r.side] && sec[r.side].kind) || 'kicker') : defaultKind(sec)
}
// change le côté d'un module en gardant le trick tant que le type de slot ne change pas.
export function setModuleSide(parcours, r, side) {
  const sec = secOf(parcours, r)
  if (!sec || !sec[side]) return // pas de module de ce côté → jamais de kicker inventé
  const oldKind = moduleKind(parcours, r)
  const newKind = sec[side].kind
  r.side = side; r.rien = false
  if (oldKind !== newKind) { r.trick = null; r.chips = null; r.approach = null }
}

// ── structure d'un run ────────────────────────────────────────────────────────
export function blankRows(parcours) {
  return zonesOnly(parcours).map((sec) => (sec.type === 'air'
    ? { kind: 'air', secId: sec.id, airs: [] }
    : { kind: 'module', secId: sec.id, side: singleSide(sec), trick: null, approach: null, chips: null, rate: 'ok', rien: false }))
}
export function blankRider(parcours, runCount, n) {
  const runs = [blankRows(parcours)]
  if (runCount > 1) runs.push(blankRows(parcours))
  return { id: riderId(), name: `Rider ${n}`, saved: [false, false], score: [], snap: [], runs }
}

// ── états d'une ligne / d'un run ──────────────────────────────────────────────
export function rowHasContent(r) {
  return !!(r.kind === 'air' ? (r.airs && r.airs.length)
    : r.kind === 'adhoc' ? (r.text && r.text.trim())
      : (r.trick || r.chips || r.rien || r.fell))
}
export function rowConfirmed(x) {
  return x.kind === 'air' ? (x.airs && x.airs.some((a) => !a.draft)) : (!x.draft && rowHasContent(x))
}
export function rowResolved(r) {
  if (r.kind === 'air') return true
  if (r.kind === 'adhoc') return !!(r.text && r.text.trim())
  if (r.rien) return true
  return !!r.trick
}
export function runTouched(rows) { return !!rows && rows.some(rowConfirmed) }
export function run2Confirmed(rider) { const r2 = rider.runs[1]; return !!r2 && r2.some(rowConfirmed) }
export function anyRun2Touched(riders) { return riders.some((r) => runTouched(r.runs[1])) }
export function runNotes(rows) {
  if (!rows) return 0
  let n = 0
  rows.forEach((x) => {
    if (x.kind === 'air') n += (x.airs ? x.airs.filter((a) => !a.draft).length : 0)
    else if (!x.draft && (x.kind === 'adhoc' ? (x.text && x.text.trim()) : (!x.rien && x.trick))) n += 1
  })
  return n
}
export function riderNotes(rider, runCount) {
  let n = 0
  for (let k = 0; k < runCount; k += 1) n += runNotes(rider.runs[k])
  return n
}

// ── run 2 (brouillon) + validation ────────────────────────────────────────────
export function draftFromRun1(parcours, rows) {
  return rows.map((r) => {
    const c = JSON.parse(JSON.stringify(r))
    delete c.fell
    if (c.fallAuto) {
      delete c.fallAuto
      if (c.kind === 'module') { c.side = singleSide(secOf(parcours, c)); c.trick = null; c.chips = null; c.approach = null; c.rien = false }
    }
    if (c.kind === 'air') (c.airs || []).forEach((a) => { a.draft = true })
    else if (rowHasContent(c)) c.draft = true
    return c
  })
}
export function finalizeRun(rows) {
  if (!rows) return
  rows.forEach((x) => {
    if (x.kind === 'air') { x.airs = (x.airs || []).filter((a) => !a.draft) }
    else if (x.draft) { x.draft = false; if (x.kind === 'adhoc') { x.text = '' } else { x.trick = null; x.chips = null; x.approach = null; x.rien = false } }
  })
}

// ── libellés / résumés ────────────────────────────────────────────────────────
export function jibSummary(c) {
  const p = []
  if (c.appr) p.push(c.appr)
  if (c.in && c.in !== '–') p.push(`${c.in} in`)
  if (c.slide) p.push(c.slide)
  if (c.out && c.out !== '–') p.push(`${c.out} out`)
  return p.join(' · ') || '50-50'
}
export function entrySummary(r) {
  if (r.kind === 'air') return r.airs && r.airs.length ? r.airs.map((a) => a.name).join(', ') : 'blocage (rien)'
  if (r.kind === 'adhoc') return r.text || 'hors parcours'
  if (r.rien) return 'skip'
  if (r.chips) return jibSummary(r.chips)
  return r.trick || '—'
}
export function zoneShortLabel(parcours, r) {
  if (r.kind === 'adhoc') return 'Hors parcours'
  const sec = secOf(parcours, r)
  const pass = sec && sec.passOf != null ? ' · 2e passage' : ''
  if (r.kind === 'air') return `Blocage${pass}`
  const parts = []
  if (sec.int) parts.push(sec.int.kind === 'jib' ? (sec.int.label || 'jib') : 'kicker')
  if (sec.ext) parts.push(sec.ext.kind === 'jib' ? (sec.ext.label || 'jib') : 'kicker')
  return `Module · ${parts.join(' / ') || '—'}${pass}`
}

// ── scoring (/100) ────────────────────────────────────────────────────────────
// FRS (First Run Score) sur un run 2+ = reprend la note du run 1 ; DNS = 0.
export function scoreVal(rider, k, runCount) {
  let s = rider.score && rider.score[k]
  if (s == null) return null
  s = String(s).trim()
  if (!s) return null
  if (/^dns$/i.test(s)) return 0
  if (k > 0 && /^frs$/i.test(s)) return scoreVal(rider, 0, runCount)
  const v = parseFloat(s.replace(',', '.'))
  return Number.isNaN(v) ? null : v
}
export function bestScore(rider, runCount) {
  let b = null
  for (let k = 0; k < runCount; k += 1) { const v = scoreVal(rider, k, runCount); if (v != null) b = (b == null) ? v : Math.max(b, v) }
  return b
}
export function allScored(riders, runCount) {
  return riders.length > 0 && riders.every((r) => {
    for (let k = 0; k < runCount; k += 1) if (scoreVal(r, k, runCount) == null) return false
    return true
  })
}

export { moduleSides }
