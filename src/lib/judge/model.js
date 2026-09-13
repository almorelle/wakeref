// Modèle de données d'un parcours de compétition (câble uniquement).
// Porté du proto `proto-assets/competition-module.html` (helpers de renderSetup).
// Toutes les fonctions sont PURES : elles prennent l'état et renvoient un nouvel
// objet/tableau (pas de mutation en place) → collent à un reducer React.
//
// parcours = suite ORDONNÉE de zones ET de poulies :
//   pulley  : { id, type:'pulley', p }                        p auto-calculé (jamais saisi)
//   modules : { id, type:'modules', int, ext }                int/ext = { kind:'kicker'|'jib', label } | null
//   air     : { id, type:'air', span }                        « blocage » en UI, type:'air' en interne
//   copie   : { id, type, passOf:<idParent>, redundant:true, ...contenu miroir }   2e passage

export const DEFAULT_CABLE_SPIN = 'goofy' // 'regular' (horaire) | 'goofy' (anti-horaire)
export const DEFAULT_NB_POULIES = 6
export const DEFAULT_POULIE_START = 1
export const DEFAULT_NEXT_ID = 17

// Parcours d'exemple (6 poulies, goofy) — même contenu que le proto.
export function defaultParcours() {
  return [
    { id: 1, type: 'modules', int: { kind: 'jib', label: 'rail' }, ext: { kind: 'jib', label: 'box' } },
    { id: 2, type: 'modules', int: null, ext: { kind: 'jib', label: 'rail' } },
    { id: 11, type: 'pulley', p: 1 },
    { id: 3, type: 'modules', int: { kind: 'jib', label: 'rail' }, ext: { kind: 'jib', label: 'box' } },
    { id: 12, type: 'pulley', p: 2 },
    { id: 4, type: 'air', span: 1 },
    { id: 13, type: 'pulley', p: 3 },
    { id: 5, type: 'modules', int: null, ext: { kind: 'jib', label: 'box' } },
    { id: 6, type: 'modules', int: { kind: 'jib', label: 'rail' }, ext: { kind: 'jib', label: 'box' } },
    { id: 14, type: 'pulley', p: 4 },
    { id: 7, type: 'modules', int: { kind: 'jib', label: 'rail' }, ext: { kind: 'jib', label: 'box' } },
    { id: 15, type: 'pulley', p: 5 },
    { id: 8, type: 'air', span: 1 },
    { id: 16, type: 'pulley', p: 6 },
    { id: 9, type: 'modules', int: { kind: 'kicker', label: '' }, ext: { kind: 'kicker', label: '' } },
  ]
}

export const zonesOnly = (parcours) => parcours.filter((s) => s.type !== 'pulley')

// Côtés d'une section portant réellement un module (int/ext). Un seul → côté fixé.
export function moduleSides(sec) { return ['int', 'ext'].filter((s) => sec && sec[s]) }
export function singleSide(sec) { const s = moduleSides(sec); return s.length === 1 ? s[0] : null }

export function sideLabel(s) { return s === 'int' ? 'intérieur' : 'extérieur' }

// Recalcule le numéro des poulies dans l'ordre de parcours à partir de poulieStart
// (wrap après n) ; moteur = poulie n, toujours. Immutable.
export function renumberPoulies(parcours, nbPoulies, poulieStart) {
  const N = nbPoulies
  let k = 0
  return parcours.map((s) => {
    if (s.type !== 'pulley') return s
    const p = ((((poulieStart - 1 + k) % N) + N) % N) + 1
    k += 1
    return { ...s, p }
  })
}

// Cale le nombre de marqueurs poulie sur nbPoulies (retrait par la fin, ajout en fin).
// Structural → renvoie { parcours, nextId }.
export function syncPoulies(parcours, nbPoulies, poulieStart, nextId) {
  const out = parcours.slice()
  let id = nextId
  let count = out.filter((s) => s.type === 'pulley').length
  while (count > nbPoulies) {
    for (let i = out.length - 1; i >= 0; i -= 1) {
      if (out[i].type === 'pulley') { out.splice(i, 1); break }
    }
    count -= 1
  }
  while (count < nbPoulies) {
    out.push({ id: id, type: 'pulley', p: 1 })
    id += 1
    count += 1
  }
  return { parcours: renumberPoulies(out, nbPoulies, poulieStart), nextId: id }
}

// Contenu (type + int/ext ou span) d'une zone source, à recopier dans une copie 2e passage.
export function copyZoneContent(src) {
  if (src.type === 'air') return { type: 'air', span: src.span || 1 }
  return {
    type: src.type,
    int: src.int ? { kind: src.int.kind, label: src.int.label } : null,
    ext: src.ext ? { kind: src.ext.kind, label: src.ext.label } : null,
  }
}

// Retire les copies orphelines (parent supprimé) + remiroir le contenu des copies sur leur
// parent (la copie n'a pas de contenu propre → toujours identique au parent). Immutable.
export function syncTwins(parcours) {
  const alive = parcours.filter((z) => z.passOf == null || parcours.some((p) => p.id === z.passOf))
  return alive.map((z) => {
    if (z.passOf == null) return z
    const parent = alive.find((o) => o.id === z.passOf)
    if (!parent) return z
    return { id: z.id, passOf: z.passOf, redundant: true, ...copyZoneContent(parent) }
  })
}

// Cocher « 2e passage » sur une zone crée une copie liée en bas du parcours ; décocher la retire.
// Structural → renvoie { parcours, nextId }.
export function toggleSecondPass(parcours, secId, nextId) {
  const twin = parcours.find((z) => z.passOf === secId)
  if (twin) return { parcours: parcours.filter((z) => z !== twin), nextId }
  const sec = parcours.find((z) => z.id === secId)
  if (!sec) return { parcours, nextId }
  const t = { id: nextId, passOf: secId, redundant: true, ...copyZoneContent(sec) }
  return { parcours: [...parcours, t], nextId: nextId + 1 }
}

// Insère une zone (module / blocage) à la position idx (avant la poulie qui suit).
// Structural → renvoie { parcours, nextId }.
export function insertZoneAt(parcours, idx, type, nextId) {
  const z = type === 'air'
    ? { id: nextId, type: 'air', span: 1 }
    : { id: nextId, type: 'modules', int: { kind: 'kicker', label: '' }, ext: null }
  const out = parcours.slice()
  out.splice(idx, 0, z)
  return { parcours: out, nextId: nextId + 1 }
}

// Snapshot persistable d'un parcours (colonne data jsonb de la table `parcours`).
export function snapshotFrom(state) {
  return {
    cableSpin: state.cableSpin,
    nbPoulies: state.nbPoulies,
    poulieStart: state.poulieStart,
    parcours: state.parcours,
  }
}

// Reconstruit un état reducer à partir d'un snapshot chargé (nextId = max id + 1).
// Les valeurs manquantes retombent sur les défauts (robustesse aux snapshots partiels).
export function initFromSnapshot(snap) {
  const s = snap || {}
  const parcours = Array.isArray(s.parcours) ? s.parcours : defaultParcours()
  const maxId = parcours.reduce((m, z) => Math.max(m, z.id || 0), 0)
  return {
    cableSpin: s.cableSpin || DEFAULT_CABLE_SPIN,
    nbPoulies: s.nbPoulies || DEFAULT_NB_POULIES,
    poulieStart: s.poulieStart || DEFAULT_POULIE_START,
    parcours,
    nextId: maxId + 1,
  }
}

// Récap descriptif : nb de zones, nb de modules, 1re poulie, nb de copies 2e passage.
export function setupSummary(parcours, poulieStart) {
  const zones = zonesOnly(parcours)
  const twins = zones.filter((z) => z.passOf != null).length
  const modules = parcours
    .filter((s) => s.type === 'modules')
    .reduce((n, s) => n + (s.int ? 1 : 0) + (s.ext ? 1 : 0), 0)
  return { zones: zones.length, modules, poulieStart, twins }
}
