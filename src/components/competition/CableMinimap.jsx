import { useMemo } from 'react'
import { zonesOnly } from '../../lib/competition/model'
import styles from './CableMinimap.module.css'

// Aperçu SVG du câble et du parcours. Géométrie PORTÉE TELLE QUELLE depuis
// `renderMinimap` du proto (proto-assets/competition-module.html) — validée après
// de nombreuses itérations, à ne pas re-designer. Les globals du proto deviennent
// des props ; le rendu SVG est injecté verbatim (dangerouslySetInnerHTML) pour
// garantir une sortie identique.
//
// Props :
//   parcours    : suite ordonnée zones + poulies (déjà renumérotée + twins remiroirés)
//   cableSpin   : 'regular' (moteur bas-gauche) | 'goofy' (miroir, bas-droite)
//   nbPoulies   : nombre de poulies du câble
//   curSecId    : id de la zone courante à surligner (saisie) ; null = aucun glow
//   header      : JSX optionnel au-dessus de la carte (nom rider / run)
export default function CableMinimap({ parcours, cableSpin, nbPoulies, curSecId = null, header = null }) {
  const built = useMemo(
    () => buildMinimap(parcours, cableSpin, nbPoulies, curSecId),
    [parcours, cableSpin, nbPoulies, curSecId],
  )
  return (
    <div className={styles.mmWrap}>
      {header}
      {built.empty
        ? <div className={styles.mmEmpty}>{built.empty}</div>
        : (
          <svg
            className={styles.mmSvg}
            viewBox={built.vb}
            preserveAspectRatio="xMidYMid meet"
            dangerouslySetInnerHTML={{ __html: built.inner }}
          />
        )}
    </div>
  )
}

// ── géométrie (portage verbatim de renderMinimap) ──────────────────────────────
// On travaille sur une COPIE des objets du parcours (P) : le tracé attache des
// propriétés temporaires (_edge, _pt, _tg…) sur les zones ; les cloner évite de
// polluer l'état React (les zones non-twin sont passées par référence).
function buildMinimap(parcoursIn, cableSpin, nbPoulies, curSecId) {
  const P = (parcoursIn || []).map((s) => ({ ...s }))
  const zones = zonesOnly(P)
  const pulleys = P.filter((s) => s.type === 'pulley')
  if (!pulleys.length) {
    return { empty: 'Ajoute des poulies dans le parcours pour afficher la carte du câble.' }
  }
  const N = nbPoulies
  const dir = cableSpin === 'regular' ? 1 : -1 // regular → moteur bas-GAUCHE ; goofy → miroir (bas-DROITE)
  // CÂBLE = polygone inscrit dans une ellipse étirée verticalement, lignes droites.
  // Moteur en bas ; regular = horaire (monte à gauche), goofy = miroir.
  // ÉLASTIQUE DOUX : chaque arête reçoit un secteur d'angle ∝ (BASE + nb de zones).
  const cx = 60; const cy = 100; const Rx = 34; const Ry = 84
  const wrap = (p) => ((((p - 1) % N) + N) % N) + 1
  const travel = [N]; for (let p = 1; p <= N - 1; p += 1) travel.push(p) // moteur, P1..P(n-1)
  const pI = P.map((s, i) => (s.type === 'pulley' ? { i, p: s.p } : null)).filter(Boolean)
  // phase = position physique le long de l'arête (0 = côté moteur, 1 = entre poulies, 2 = avant 1re poulie).
  const zoneEdge = (sec) => {
    const i = P.indexOf(sec); let prev = null; let next = null
    for (const q of pI) { if (q.i < i) prev = q; if (q.i > i && next === null) next = q }
    if (prev && next) return { fromP: prev.p, toP: next.p, phase: 1 }
    if (!prev && next) return { fromP: wrap(next.p - 1), toP: next.p, phase: 2 }
    if (prev && !next) return { fromP: prev.p, toP: wrap(prev.p + 1), phase: 0 }
    return { fromP: N, toP: 1, phase: 1 }
  }
  zones.forEach((z) => { z._edge = zoneEdge(z); z._pi = P.indexOf(z); z._ek = travel.indexOf(z._edge.fromP) })
  // contenu par arête de parcours (travel edge k = travel[k]→travel[k+1])
  const cnt = new Array(N).fill(0); zones.forEach((z) => { if (z.passOf != null) return; cnt[z._ek] += (z.type === 'air' ? (z.span || 1) : 1) })
  // secteur angulaire par arête géométrique g ; travel edge k ↔ geom edge g=N-1-k
  const BASE = 2.2; const wg = []; for (let g = 0; g < N; g += 1) wg.push(BASE + cnt[(((N - 1 - g) % N) + N) % N])
  const Wg = wg.reduce((a, b) => a + b, 0); const step = wg.map((x) => (2 * Math.PI * x) / Wg)
  // angles cumulés : arête géométrique 0 (le fond) centrée en bas (-90°)
  const phi = new Array(N); phi[0] = -Math.PI / 2 - step[0] / 2
  for (let m = 1; m < N; m += 1) phi[m] = (m === 1) ? (-Math.PI / 2 + step[0] / 2) : phi[m - 1] + step[m - 1]
  const poly = (m) => ({ x: cx + dir * Rx * Math.cos(phi[m]), y: cy - Ry * Math.sin(phi[m]) })
  // sommets en ORDRE DE PARCOURS : moteur = coin du fond (m=0), puis on remonte le côté
  const V = []; for (let k = 0; k < N; k += 1) V.push(poly((N - k) % N))
  const Vp = (k) => V[(((k % N) + N) % N)]
  const cen = { x: 0, y: 0 }; V.forEach((v) => { cen.x += v.x; cen.y += v.y }); cen.x /= N; cen.y /= N
  const lerp = (A, B, t) => ({ x: A.x + (B.x - A.x) * t, y: A.y + (B.y - A.y) * t })
  // câble : une ligne droite par arête (poulie → poulie)
  let edges = ''
  for (let k = 0; k < N; k += 1) { const a = Vp(k); const b = Vp(k + 1); edges += `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="#565d70" stroke-width="1" stroke-linejoin="round"/>` }
  // poulies : points + nom, label décalé vers l'EXTÉRIEUR
  let pnodes = ''
  for (let k = 0; k < N; k += 1) {
    const a = Vp(k); const motor = travel[k] === N
    let ox = a.x - cen.x; let oy = a.y - cen.y; const ol = Math.hypot(ox, oy) || 1; ox /= ol; oy /= ol
    pnodes += `<circle cx="${a.x.toFixed(1)}" cy="${a.y.toFixed(1)}" r="${motor ? 3 : 2}" fill="${motor ? '#06b6d4' : '#8891a6'}"/>`
    pnodes += `<text x="${(a.x + ox * 7).toFixed(1)}" y="${(a.y + oy * 7 + 2.2).toFixed(1)}" fill="${motor ? '#06b6d4' : '#9aa3b8'}" font-size="6.5" font-weight="800" text-anchor="middle">P${travel[k]}${motor ? ' ⚓' : ''}</text>`
  }
  // copies 2e passage : ne se dessinent pas, se replient sur leur parent → ×N fiable
  const twinIds = {}; zones.forEach((z) => { if (z.passOf != null) (twinIds[z.passOf] = twinIds[z.passOf] || []).push(z.id) })
  const groups = {}
  zones.forEach((z) => { if (z.passOf != null) return; (groups[z._ek] = groups[z._ek] || []).push(z) })
  const kindColor = (z) => (z.type === 'air' ? '#06b6d4' : (((z.int && z.int.kind === 'jib') || (z.ext && z.ext.kind === 'jib')) ? '#22c55e' : '#f59e0b'))
  const mult = (q, col, n) => `<text x="${(q.x + 3.5).toFixed(1)}" y="${(q.y - 3).toFixed(1)}" fill="${col}" font-size="7" font-weight="800">×${n}</text>`
  const OVER = 0.14 // débord air = fraction de l'arête voisine
  let znodes = ''; let curTop = ''
  Object.keys(groups).forEach((kk) => {
    const k = +kk; const A = Vp(k); const B = Vp(k + 1)
    const dx = B.x - A.x; const dy = B.y - A.y; const dl = Math.hypot(dx, dy) || 1; const tg = { x: dx / dl, y: dy / dl }
    let perp = { x: -tg.y, y: tg.x }; const mid = lerp(A, B, 0.5)
    if ((cen.x - mid.x) * perp.x + (cen.y - mid.y) * perp.y < 0) perp = { x: -perp.x, y: -perp.y } // perp vers l'INTÉRIEUR
    const arr = groups[k].slice().sort((a, b) => (a._edge.phase - b._edge.phase) || (a._pi - b._pi))
    const entries = arr.map((z) => { const tw = twinIds[z.id] || []; return { z, n: 1 + tw.length, ids: [z.id, ...tw] } })
    const len = entries.length
    entries.forEach((ent, j) => {
      const z = ent.z; const e = z._edge; const col = kindColor(z); const cur = ent.ids.includes(curSecId)
      if (z.type === 'air') { // AIR : bande DROITE passant par les poulies franchies
        const span = z.span || 1; const k0 = travel.indexOf(e.fromP); const verts = []; for (let ss = 0; ss <= span; ss += 1) verts.push(Vp(k0 + ss))
        const pre = lerp(verts[0], Vp(k0 - 1), OVER); const post = lerp(verts[span], Vp(k0 + span + 1), OVER)
        z._pt = lerp(verts[0], verts[span], 0.5); z._start = pre; z._end = post; { const ex = verts[span].x - verts[0].x; const ey = verts[span].y - verts[0].y; const el2 = Math.hypot(ex, ey) || 1; z._tg = { x: ex / el2, y: ey / el2 } }
        const band = `<polyline points="${[pre, ...verts, post].map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ')}" fill="none" stroke="${col}" stroke-width="${cur ? 4 : 2.2}" stroke-linecap="round" stroke-linejoin="round" opacity="${cur ? 1 : 0.75}"/>`
        if (cur) curTop += band; else znodes += band
        if (ent.n > 1) znodes += mult(verts[Math.round(span / 2)], col, ent.n)
      } else { // MODULE : segment DROIT sur l'arête + rectangle(s) int (dedans) / ext (dehors)
        const f0 = (j + 0.5) / len; const spanF = Math.min(0.32 / len, 0.15)
        const mc = lerp(A, B, f0); const p0 = lerp(A, B, f0 - spanF); const p1 = lerp(A, B, f0 + spanF)
        z._pt = mc; z._start = p0; z._end = p1; z._tg = { x: tg.x, y: tg.y }
        const rectAt = (c, rc) => { const Lh = 2.6; const Hh = 1.6
          const Q = (sa, sb) => `${(c.x + sa * tg.x * Lh + sb * perp.x * Hh).toFixed(1)},${(c.y + sa * tg.y * Lh + sb * perp.y * Hh).toFixed(1)}`
          return `<polygon points="${Q(-1, -1)} ${Q(1, -1)} ${Q(1, 1)} ${Q(-1, 1)}" fill="none" stroke="${rc}" stroke-width="1.1"/>` }
        const seg = `<line x1="${p0.x.toFixed(1)}" y1="${p0.y.toFixed(1)}" x2="${p1.x.toFixed(1)}" y2="${p1.y.toFixed(1)}" stroke="${col}" stroke-width="${cur ? 4 : 2.2}" stroke-linecap="round" opacity="${cur ? 1 : 0.85}"/>`
        const modCol = (s) => (s && s.kind === 'jib' ? '#22c55e' : '#f59e0b')
        let rects = ''
        if (z.int) rects += rectAt({ x: mc.x + perp.x * 3.6, y: mc.y + perp.y * 3.6 }, modCol(z.int))
        if (z.ext) rects += rectAt({ x: mc.x - perp.x * 3.6, y: mc.y - perp.y * 3.6 }, modCol(z.ext))
        if (cur) curTop += seg + rects; else znodes += seg + rects
        if (ent.n > 1) znodes += mult(mc, col, ent.n)
      }
    })
  })
  // marqueurs DÉPART / ARRIVÉE : petits traits perpendiculaires hors boucle
  let marks = ''
  if (zones.length) {
    const rep = (z) => (z.passOf != null && zones.find((o) => o.id === z.passOf)) || z
    const zf = rep(zones[0]); const zl = rep(zones[zones.length - 1]); const GAP = 4.5
    const mk = (pt, tgv, col, lab) => { let pp = { x: -tgv.y, y: tgv.x }
      if ((cen.x - pt.x) * pp.x + (cen.y - pt.y) * pp.y > 0) pp = { x: -pp.x, y: -pp.y } // pp vers l'EXTÉRIEUR
      return { pt, pp, tg: tgv, col, lab } }
    const items = []
    if (zf._start) items.push(mk({ x: zf._start.x - zf._tg.x * GAP, y: zf._start.y - zf._tg.y * GAP }, zf._tg, '#34d399', 'départ'))
    if (zl._end) items.push(mk({ x: zl._end.x + zl._tg.x * GAP, y: zl._end.y + zl._tg.y * GAP }, zl._tg, '#f87171', 'arrivée'))
    const side = items.map(() => 1)
    if (items.length === 2 && Math.hypot(items[0].pt.x - items[1].pt.x, items[0].pt.y - items[1].pt.y) < 22) {
      side[1] = -1; const SEP = 3
      items[0].pt = { x: items[0].pt.x + items[0].tg.x * SEP, y: items[0].pt.y + items[0].tg.y * SEP }
      items[1].pt = { x: items[1].pt.x - items[1].tg.x * SEP, y: items[1].pt.y - items[1].tg.y * SEP }
    }
    items.forEach((it, i) => { const { pt, pp, col, lab } = it; const s = side[i]
      const a = { x: pt.x + pp.x * 5.5, y: pt.y + pp.y * 5.5 }; const b = { x: pt.x - pp.x * 5.5, y: pt.y - pp.y * 5.5 }
      marks += `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="${col}" stroke-width="1.6" stroke-linecap="round"/>`
        + `<text x="${(pt.x + pp.x * 15 * s).toFixed(1)}" y="${(pt.y + pp.y * 15 * s + 2).toFixed(1)}" fill="${col}" stroke="#0a0a0f" stroke-width="2.2" paint-order="stroke" stroke-linejoin="round" font-size="6.3" font-weight="800" text-anchor="middle">${lab}</text>`
    })
  }
  // viewBox calé au plus près de la forme ; marge basse pour départ/arrivée
  let minx = 1e9; let maxx = -1e9; let miny = 1e9; let maxy = -1e9
  V.forEach((v) => { minx = Math.min(minx, v.x); maxx = Math.max(maxx, v.x); miny = Math.min(miny, v.y); maxy = Math.max(maxy, v.y) })
  const vb = `${(minx - 14).toFixed(1)} ${(miny - 12).toFixed(1)} ${(maxx - minx + 28).toFixed(1)} ${(maxy - miny + 34).toFixed(1)}`
  // glow autour de la zone en cours (saisie)
  const defs = curTop ? '<defs><filter id="curGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' : ''
  const cur = curTop ? `<g filter="url(#curGlow)">${curTop}</g>` : ''
  return { vb, inner: `${defs}${edges}${pnodes}${znodes}${cur}${marks}` }
}
