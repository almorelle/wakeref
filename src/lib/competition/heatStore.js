// Store LOCAL d'un heat (état du juge sur un device). Reducer tenant l'état du heat
// (riders, notes, runs) + les curseurs de l'onglet Run, avec autosave localStorage par
// code. Rien ne part en DB : seul le parcours voyage (pas de sync multi-juges v1).
// Logique portée du proto proto-assets/competition-module.html (onglets Saisie/Poule).
import { useEffect, useReducer } from 'react'
import { singleSide } from './model'
import {
  blankRows, blankRider, secOf, setModuleSide,
  run2Confirmed, draftFromRun1, finalizeRun, scoreVal,
  pickTrick, pickAir,
} from './runModel'

const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi))
const cloneRows = (rows) => JSON.parse(JSON.stringify(rows || []))

export function initHeat({ code, name, snapshot }) {
  const snap = snapshot || {}
  return {
    code,
    name,
    heatName: '',
    cableSpin: snap.cableSpin || 'goofy',
    nbPoulies: snap.nbPoulies || 6,
    poulieStart: snap.poulieStart || 1,
    parcours: snap.parcours || [],
    runCount: 1,
    matrixMode: 'split',
    run2Order: null, // null | array of rider ids
    riders: [],
    riderCursor: 0,
    runCursor: 0,
    curIdx: 0,
    activeSide: null,
    navDir: 0, // 1 = vers le futur, -1 = vers le passé (anim CSS)
    tab: 'heat',
  }
}

// ── ordre de passage du run 2 (souvent reverse) — stocké en IDS de riders ──
export function order2(state) {
  const all = state.riders
  if (!state.run2Order) return all.map((_, i) => i)
  const byId = new Map(all.map((r, i) => [r.id, i]))
  const seen = new Set(); const out = []
  state.run2Order.forEach((id) => { const i = byId.get(id); if (i != null && !seen.has(i)) { seen.add(i); out.push(i) } })
  all.forEach((r, i) => { if (!seen.has(i)) out.push(i) })
  return out
}
export function orderFor(state, ru) { return ru === 1 ? order2(state) : state.riders.map((_, i) => i) }

export function linearPos(state) {
  const N = state.riders.length
  const pos = state.runCursor === 1 ? order2(state).indexOf(state.riderCursor) : state.riderCursor
  return state.runCursor * N + (pos < 0 ? 0 : pos)
}

// charge un run (rider ri, run ru) dans les curseurs ; crée le run si absent.
function loadRunInto(state, ri, ru) {
  if (!state.riders.length) return { ...state, curIdx: 0 }
  const riderCursor = clamp(ri, 0, state.riders.length - 1)
  const runCursor = clamp(ru, 0, state.runCount - 1)
  const riders = state.riders.slice()
  const rider = { ...riders[riderCursor] }
  const runs = rider.runs.slice()
  if (!runs[runCursor]) runs[runCursor] = blankRows(state.parcours)
  rider.runs = runs; riders[riderCursor] = rider
  return { ...state, riders, riderCursor, runCursor, curIdx: 0, activeSide: null, navDir: 0 }
}

// applique une mutation sur une COPIE du run courant + dé-validation par snapshot.
// mutate(rows) peut muter rows et renvoyer un patch d'état (curIdx, activeSide, navDir…).
function editCurrent(state, mutate) {
  const riders = state.riders.slice()
  const rider = { ...riders[state.riderCursor] }
  const runs = rider.runs.slice()
  const rows = cloneRows(runs[state.runCursor])
  const patch = mutate(rows) || {}
  runs[state.runCursor] = rows
  rider.runs = runs
  // dé-validation : un run validé re-modifié repasse « à valider » (contenu ≠ snapshot).
  if (rider.saved && rider.saved[state.runCursor] && rider.snap && rider.snap[state.runCursor] != null
      && JSON.stringify(rows) !== rider.snap[state.runCursor]) {
    rider.saved = rider.saved.slice(); rider.saved[state.runCursor] = false
  }
  riders[state.riderCursor] = rider
  return { ...state, riders, ...patch }
}

// « skip → zone suivante » : avance si possible, sinon reste.
function advance(state, rows) {
  return state.curIdx < rows.length - 1 ? { curIdx: state.curIdx + 1, navDir: 1, activeSide: null } : {}
}

export function heatReducer(state, action) {
  switch (action.type) {
    // ───── navigation d'onglet + de zone ─────
    case 'setTab':
      return { ...state, tab: action.tab }
    case 'goTo': {
      const idx = clamp(action.idx, 0, currentRows(state).length - 1)
      if (idx === state.curIdx) return state
      return { ...state, curIdx: idx, navDir: Math.sign(idx - state.curIdx), activeSide: null }
    }
    case 'navigate': {
      const idx = clamp(state.curIdx + action.dir, 0, currentRows(state).length - 1)
      if (idx === state.curIdx) return state
      return { ...state, curIdx: idx, navDir: action.dir, activeSide: null }
    }
    case 'loadRun':
      return { ...loadRunInto(state, action.index, action.ru), tab: 'run' }
    case 'riderNav': {
      const N = state.riders.length; if (!N) return state
      const idx = clamp(linearPos(state) + action.dir, 0, N * state.runCount - 1)
      const run = Math.floor(idx / N); const pos = idx % N
      const ri = run === 1 ? order2(state)[pos] : pos
      return loadRunInto(state, ri, run)
    }

    // ───── choix du côté ─────
    case 'pickSideLR': {
      const side = action.vis === 'l'
        ? (state.cableSpin === 'regular' ? 'ext' : 'int')
        : (state.cableSpin === 'regular' ? 'int' : 'ext')
      return editCurrent(state, (rows) => {
        const r = rows[state.curIdx]; if (!r) return {}
        if (r.kind === 'module') { const sec = secOf(state.parcours, r); if (!sec || !sec[side]) return {}; setModuleSide(state.parcours, r, side); return { activeSide: r.side } }
        if (r.kind === 'adhoc') { r.side = side; return { activeSide: r.side } }
        return { activeSide: side }
      })
    }
    case 'setSide':
      return editCurrent(state, (rows) => {
        const r = rows[state.curIdx]
        if (r.kind === 'module') setModuleSide(state.parcours, r, action.side)
        else r.side = action.side
        return { activeSide: r.side }
      })

    // ───── saisie module / jib ─────
    case 'dictTrick':
      return editCurrent(state, (rows) => { rows[state.curIdx].trick = pickTrick() })
    case 'editTrick':
      return editCurrent(state, (rows) => { rows[state.curIdx].trick = action.value })
    case 'setRate':
      return editCurrent(state, (rows) => { rows[state.curIdx].rate = action.v })
    case 'setRien':
      return editCurrent(state, (rows) => { rows[state.curIdx].rien = true; return advance(state, rows) })
    case 'skipMod':
      return editCurrent(state, (rows) => { const r = rows[state.curIdx]; r.rien = true; r.side = null; return { ...advance(state, rows), activeSide: null } })
    case 'undoRien':
      return editCurrent(state, (rows) => { rows[state.curIdx].rien = false })

    // ───── blocage (airs) ─────
    case 'addAir':
      return editCurrent(state, (rows) => { rows[state.curIdx].airs.push({ name: pickAir(), side: state.activeSide, rate: 'ok' }) })
    case 'editAir':
      return editCurrent(state, (rows) => { rows[state.curIdx].airs[action.i].name = action.value })
    case 'setAirSide':
      return editCurrent(state, (rows) => { const a = rows[state.curIdx].airs[action.i]; a.side = action.side; a.draft = false })
    case 'setAirRate':
      return editCurrent(state, (rows) => { const a = rows[state.curIdx].airs[action.i]; a.rate = action.v; a.draft = false })
    case 'removeAir':
      return editCurrent(state, (rows) => { rows[state.curIdx].airs.splice(action.i, 1) })
    case 'confirmAir':
      return editCurrent(state, (rows) => { rows[state.curIdx].airs[action.i].draft = false })

    // ───── hors-parcours ─────
    case 'insertAdhoc':
      return editCurrent(state, (rows) => { rows.splice(action.k, 0, { kind: 'adhoc', side: null, text: '', rate: 'ok' }); return { curIdx: action.k, navDir: 1, activeSide: null } })
    case 'editAdhoc':
      return editCurrent(state, (rows) => { rows[state.curIdx].text = action.value })
    case 'moveAdhoc': {
      const j = state.curIdx + action.delta
      if (j < 0 || j >= currentRows(state).length) return state
      return editCurrent(state, (rows) => { [rows[state.curIdx], rows[j]] = [rows[j], rows[state.curIdx]]; return { curIdx: j, navDir: Math.sign(action.delta) } })
    }
    case 'delAdhoc':
      return editCurrent(state, (rows) => { rows.splice(action.idx, 1); return { curIdx: clamp(state.curIdx, 0, Math.max(0, rows.length - 1)) } })

    // ───── chute / vider / brouillon ─────
    case 'markFall':
      return editCurrent(state, (rows) => {
        const r0 = rows[state.curIdx]; if (!r0) return {}
        r0.fell = true
        for (let i = state.curIdx + 1; i < rows.length; i += 1) { const r = rows[i]; if (r.kind === 'module' && !r.rien) { r.rien = true; r.fallAuto = true } }
      })
    case 'undoFall':
      return editCurrent(state, (rows) => { rows.forEach((r) => { if (r.fell) delete r.fell; if (r.fallAuto) { r.rien = false; delete r.fallAuto } }) })
    case 'clearZone':
      return editCurrent(state, (rows) => {
        const r = rows[state.curIdx]
        if (r.kind === 'module') { r.trick = null; r.chips = null; r.approach = null; r.rien = false; r.fell = false; r.side = singleSide(secOf(state.parcours, r)) }
        else if (r.kind === 'air') { r.airs = [] }
        else if (r.kind === 'adhoc') { r.text = ''; r.side = null; r.rate = 'ok' }
        r.draft = false
        return { activeSide: null }
      })
    case 'confirmDraft':
      return editCurrent(state, (rows) => { rows[state.curIdx].draft = false; return advance(state, rows) })
    case 'changeDraft':
      return editCurrent(state, (rows) => { rows[state.curIdx].draft = false })

    // ───── validation / reset d'un run ─────
    case 'resetRun': {
      const riders = state.riders.slice()
      const rider = { ...riders[state.riderCursor] }
      const runs = rider.runs.slice()
      runs[state.runCursor] = blankRows(state.parcours)
      if (state.runCursor === 0) {
        rider.saved = (rider.saved || [false, false]).slice(); rider.saved[0] = false
        if (state.runCount > 1 && !run2Confirmed(rider)) runs[1] = blankRows(state.parcours)
      }
      rider.runs = runs; riders[state.riderCursor] = rider
      return { ...state, riders, curIdx: 0, activeSide: null }
    }
    case 'saveRun': {
      const ru = state.runCursor
      const riders = state.riders.slice()
      const rider = { ...riders[state.riderCursor] }
      const runs = rider.runs.map(cloneRows)
      finalizeRun(runs[ru])
      rider.saved = (rider.saved || [false, false]).slice(); rider.saved[ru] = true
      if (ru === 0 && state.runCount > 1 && !run2Confirmed({ ...rider, runs })) runs[1] = draftFromRun1(state.parcours, runs[0])
      rider.snap = (rider.snap || []).slice(); rider.snap[ru] = JSON.stringify(runs[ru])
      rider.runs = runs; riders[state.riderCursor] = rider
      return { ...state, riders, tab: 'heat' }
    }

    // ───── heat : riders / notes / réglages ─────
    case 'addRider': {
      const riders = state.riders.concat(blankRider(state.parcours, state.runCount, state.riders.length + 1))
      return { ...state, riders, riderCursor: riders.length - 1 }
    }
    case 'removeRider': {
      const riders = state.riders.slice(); riders.splice(action.index, 1)
      const riderCursor = state.riderCursor >= riders.length ? Math.max(0, riders.length - 1) : state.riderCursor
      return { ...state, riders, riderCursor }
    }
    case 'renameRider': {
      const riders = state.riders.slice(); riders[action.index] = { ...riders[action.index], name: action.name }
      return { ...state, riders }
    }
    case 'setScore': {
      const riders = state.riders.slice(); const r = { ...riders[action.index] }
      r.score = (r.score || []).slice(); r.score[action.k] = action.value; riders[action.index] = r
      return { ...state, riders }
    }
    case 'setFRS': {
      const riders = state.riders.slice(); const r = { ...riders[action.index] }
      r.score = (r.score || []).slice(); r.score[action.k] = 'FRS'; riders[action.index] = r
      return { ...state, riders }
    }
    case 'markDNS': {
      const { index, k } = action
      const riders = state.riders.slice(); const rider = { ...riders[index] }
      const runs = rider.runs.slice()
      const rows = runs[k] ? cloneRows(runs[k]) : blankRows(state.parcours)
      rows.forEach((x) => {
        x.draft = false; x.fell = false; delete x.fallAuto
        if (x.kind === 'air') x.airs = []
        else if (x.kind === 'adhoc') x.text = ''
        else { x.rien = true; x.trick = null; x.chips = null; x.approach = null }
      })
      runs[k] = rows; rider.runs = runs
      rider.score = (rider.score || []).slice(); rider.score[k] = 'DNS'
      rider.saved = (rider.saved || [false, false]).slice(); rider.saved[k] = true
      riders[index] = rider
      return { ...state, riders }
    }
    case 'setRunCount': {
      if (action.n === state.runCount) return state
      const runCursor = state.runCursor >= action.n ? 0 : state.runCursor
      return { ...state, runCount: action.n, runCursor }
    }
    case 'setMatrixMode':
      return { ...state, matrixMode: state.matrixMode === 'stacked' ? 'split' : 'stacked' }
    case 'setHeatName':
      return { ...state, heatName: action.value }
    case 'reverseRun2': {
      const idx = state.riders.map((_, i) => i).sort((a, b) => (scoreVal(state.riders[a], 0, state.runCount) || 0) - (scoreVal(state.riders[b], 0, state.runCount) || 0))
      return { ...state, run2Order: idx.map((i) => state.riders[i].id) }
    }
    case 'resetRun2Order':
      return { ...state, run2Order: null }
    case 'moveRun2': {
      const ord = order2(state); const j = action.pos + action.delta
      if (j < 0 || j >= ord.length) return state
      ;[ord[action.pos], ord[j]] = [ord[j], ord[action.pos]]
      return { ...state, run2Order: ord.map((i) => state.riders[i].id) }
    }
    case 'moveRunToRider': {
      const src = state.riderCursor; const ru = state.runCursor; const ti = action.targetIndex
      if (ti === src) return state
      const riders = state.riders.slice()
      const from = { ...riders[src] }; const to = { ...riders[ti] }
      from.saved = (from.saved || []).slice(); to.saved = (to.saved || []).slice()
      from.score = (from.score || []).slice(); to.score = (to.score || []).slice()
      from.runs = from.runs.slice(); to.runs = to.runs.slice()
      to.runs[ru] = from.runs[ru]; to.saved[ru] = from.saved[ru]; to.score[ru] = from.score[ru]
      from.runs[ru] = blankRows(state.parcours); from.saved[ru] = false; from.score[ru] = ''
      if (ru === 0 && state.runCount > 1) {
        if (!run2Confirmed(from)) from.runs[1] = blankRows(state.parcours)
        if (to.saved[0] && !run2Confirmed(to)) to.runs[1] = draftFromRun1(state.parcours, to.runs[0])
      }
      riders[src] = from; riders[ti] = to
      return { ...loadRunInto({ ...state, riders }, ti, ru) }
    }
    default:
      return state
  }
}

function currentRows(state) {
  const rider = state.riders[state.riderCursor]
  return (rider && rider.runs[state.runCursor]) || []
}

// ── hook : reducer + autosave localStorage par code ───────────────────────────
const heatKey = (code) => `wakeref_heat_${code}`

function loadPersisted(code) {
  try { const raw = localStorage.getItem(heatKey(code)); return raw ? JSON.parse(raw) : null } catch { return null }
}

export function useHeatStore(code, row) {
  const [state, dispatch] = useReducer(heatReducer, { code, row }, ({ code: c, row: r }) => {
    const saved = loadPersisted(c)
    if (saved && Array.isArray(saved.parcours)) return { ...saved, navDir: 0 }
    return initHeat({ code: c, name: r.name, snapshot: r.data })
  })
  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(heatKey(state.code), JSON.stringify({ ...state, navDir: 0 })) } catch { /* quota */ }
    }, 400)
    return () => clearTimeout(t)
  }, [state])
  return [state, dispatch]
}

export { currentRows }
