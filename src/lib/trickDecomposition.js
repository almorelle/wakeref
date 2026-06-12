// Décompose un trick en ses composantes élémentaires, dans l'ordre :
//   1. trick de base (le plus haut parent), étiqueté par l'approche (ts / hs)
//   2. un invert par flip (champ `inverts`)
//   3. les rotations : le spin découpé en 360° (+ un éventuel 180° restant),
//      puis chaque rewind selon la même logique.
//
// Conventions de direction :
//   - `fs` (frontside) → sens horaire,  `bs` (backside) → sens anti-horaire.
//   - un rewind inverse le sens : il porte donc la direction opposée à la
//     rotation principale (et l'icône bascule horaire ↔ anti-horaire en
//     conséquence, puisqu'elle est dérivée de la direction).
//
// L'ordre de consommation de `rotation_type` reproduit exactement celui de
// `rotationSlots` (admin/FigureForm) : tours complets du spin, puis tours
// complets des rewinds, puis l'éventuel slot « forcé » (spin BS impair +
// rewind de 180° ⇒ passe de poignée imposée).

const opposite = dir => (dir === 'fs' ? 'bs' : dir === 'bs' ? 'fs' : null)

// Icône d'une rotation selon son amplitude (180 / 360) et son sens physique
// (cw = horaire). Le sens physique est indépendant du label fs/bs : un rewind
// inverse toujours le sens, même quand son label fs/bs ne change pas.
export function rotationIcon(degs, cw) {
  if (degs === 180) return cw ? 'rotate-2-clockwise' : 'rotate-2'
  return cw ? 'rotate-clockwise' : 'rotate'
}

// Liste les unités de rotation { degs, dir, cw, type, rewind } d'un trick.
//
// Label fs/bs du rewind (règle physique) : après un nombre IMPAIR de demi-tours
// (180, 540, 900…) le rider est en stance inversée (switch/blind), donc le sens
// inverse du rewind porte le MÊME label que le spin ; après un nombre PAIR
// (360, 720…) la stance est normale, donc le rewind porte le label OPPOSÉ.
// Le sens physique (icône), lui, est toujours inversé sur un rewind.
export function rotationUnits({ spin = 0, rewind_degs = [], rotation = [], rotation_type = [] }) {
  const units = []
  const rw = (rewind_degs || []).filter(d => d > 0)
  const types = rotation_type || []
  const mainDir = (rotation || []).includes('fs') ? 'fs'
    : (rotation || []).includes('bs') ? 'bs' : null
  const isBS = (rotation || []).includes('bs')
  const mainCW = mainDir === 'fs'               // convention : fs = horaire
  const rewindCW = !mainCW                       // un rewind inverse le sens physique
  const spinHalfTurns = Math.round(spin / 180)
  const rewindDir = spinHalfTurns % 2 === 1 ? mainDir : opposite(mainDir)
  let ti = 0 // index dans rotation_type

  // ── Spin : tours complets ──
  const spinFulls = Math.floor(spin / 360)
  for (let i = 0; i < spinFulls; i++) {
    units.push({ degs: 360, dir: mainDir, cw: mainCW, type: types[ti++] || null, rewind: false })
  }

  // ── Rewinds : tours complets (consommés avant le slot forcé) ──
  const rewindFullUnits = []
  rw.filter(d => d >= 360).forEach(d => {
    const n = Math.floor(d / 360)
    for (let i = 0; i < n; i++) {
      rewindFullUnits.push({ degs: 360, dir: rewindDir, cw: rewindCW, type: types[ti++] || null, rewind: true })
    }
  })

  // ── Slot forcé : spin BS impair + rewind de 180° ⇒ passe de poignée ──
  const hasForced = spin % 360 === 180 && isBS && rw.includes(180)
  const forcedType = hasForced ? (types[ti++] || 'handle_pass') : null

  // ── Spin : 180° restant ──
  if (spin % 360 === 180) {
    units.push({ degs: 180, dir: mainDir, cw: mainCW, type: null, rewind: false })
  }

  // ── Rewinds : tours complets (affichés après le spin) ──
  units.push(...rewindFullUnits)

  // ── Rewinds : 180° restant (le 1er hérite du type forcé le cas échéant) ──
  let forcedUsed = false
  rw.filter(d => d % 360 === 180).forEach(() => {
    let type = null
    if (hasForced && !forcedUsed) { type = forcedType; forcedUsed = true }
    units.push({ degs: 180, dir: rewindDir, cw: rewindCW, type, rewind: true })
  })

  return units
}

// Construit la liste complète des composantes affichables d'un trick.
// Renvoie { base, inverts, rotations } — `base` peut être null si aucune approche.
export function decomposeTrick(figure) {
  const approach = figure.approach || []
  const inverts = figure.inverts || 0

  return {
    approach,
    inverts,
    rotations: rotationUnits(figure),
  }
}
