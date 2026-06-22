// Moteur de grilles de score partagé entre la page Compo (calcul + panneau de
// score) et le composant de saisie <RunSaisie> (modes d'ajout, axe d'approche,
// dispo du toggle rewind, listes jib). Module neutre (pas de React) pour éviter
// tout cycle d'import entre Compo et RunSaisie.

// Slugs de figures référencés par la grille de score. Le slug étant un champ
// éditable en admin, ces valeurs doivent correspondre exactement aux slugs en
// base — sinon l'item ne se déclenche jamais, silencieusement. Source de vérité
// unique (grille + JIB_FIGURES) ; le garde-fou dans <Compo> alerte en dev si
// l'un d'eux a disparu de la table figures.
export const SCORING_SLUGS = {
  frontLip:   'front-lip',
  backBoard:  'back-board',
  frontBoard: 'front-board',
  backLip:    'back-lip',
  fiftyFifty: '50-50',
  press:      'press',
  // wakeskate
  wsOllie:       'ollie',
  // body varials : tricks où le corps tourne indépendamment de la planche
  wsBodyVarial:  'ws-body-varial',
  wsBigSpin:     'ws-big-spin',
  wsBiggerSpin:  'ws-bigger-spin',
  wsGazelle:     'ws-gazelle',
  wsSexchange:   'ws-sexchange',
  wsBigflip:     'ws-bigflip',
  // seated
  seatedFsBoardslide: 'seated-fs-boardslide',
  seatedBsBoardslide: 'seated-bs-boardslide',
  seatedFsShifty:     'seated-fs-shifty',
  seatedBsShifty:     'seated-bs-shifty',
  seatedOllie180:     'ollie-180',
  seatedOllie360:     'ollie-360',
}

// Tricks d'entrée/sortie de module proposés en wakeskate (en plus de la rotation).
// `entry` = ce qu'il faut sur la pseudo-entrée pour allumer la bonne case de la
// grille (shove-it → catégorie shoveit, kickflip → fliptricks, body varial → slug).
export const WS_JIB_TRICKS = [
  { id: 'shoveit',    label: 'Shove-it',    entry: { category_slug: 'shoveit' } },
  { id: 'kickflip',   label: 'Kickflip',    entry: { category_slug: 'fliptricks' } },
  { id: 'bodyvarial', label: 'Body Varial', entry: { slug: SCORING_SLUGS.wsBodyVarial } },
]

// Libellés des figures jib (slug → label fixe ou clé i18n), tous jeux confondus.
// Source unique partagée par la saisie (RunSaisie) et la correction (JudgeTraining).
export const JIB_FIGURE_LABELS = {
  [SCORING_SLUGS.fiftyFifty]:         { label: '50-50'         },
  [SCORING_SLUGS.frontBoard]:         { label: 'Front Board'   },
  [SCORING_SLUGS.frontLip]:           { label: 'Front Lip'     },
  [SCORING_SLUGS.backBoard]:          { label: 'Back Board'    },
  [SCORING_SLUGS.backLip]:            { label: 'Back Lip'      },
  [SCORING_SLUGS.press]:              { label: 'Press'         },
  [SCORING_SLUGS.seatedFsBoardslide]: { label: 'FS Boardslide' },
  [SCORING_SLUGS.seatedBsBoardslide]: { label: 'BS Boardslide' },
  'transfer':     { label: 'Transfer'     },
  'rail-to-rail': { label: 'Rail to Rail' },
  'gap':          { label: 'Gap'          },
  're-entry':     { label: 'Re-entry'     },
  'fs-180':       { labelKey: 'compoRotFS' },
  'bs-180':       { labelKey: 'compoRotBS' },
}

// Slugs proposés dans le formulaire jib, dans l'ordre, selon la discipline.
export const JIB_SLUGS = [
  SCORING_SLUGS.fiftyFifty, SCORING_SLUGS.frontBoard, SCORING_SLUGS.frontLip,
  SCORING_SLUGS.backBoard, SCORING_SLUGS.backLip, SCORING_SLUGS.press,
  'transfer', 'rail-to-rail', 'gap', 're-entry', 'fs-180', 'bs-180',
]
// Jib seated : pas de board/lip/press ; à la place les deux boardslides assis.
export const JIB_SLUGS_SEATED = [
  SCORING_SLUGS.fiftyFifty, SCORING_SLUGS.seatedFsBoardslide, SCORING_SLUGS.seatedBsBoardslide,
  'transfer', 'rail-to-rail', 'gap', 're-entry', 'fs-180', 'bs-180',
]

// Résout le libellé d'une figure jib (clé i18n résolue via `tr` si besoin).
export const jibFigureLabel = (slug, tr) => {
  const f = JIB_FIGURE_LABELS[slug]
  if (!f) return slug
  return f.labelKey ? tr[f.labelKey] : f.label
}

// Une passe jib génère des pseudo-entrées pour le moteur de score
export function jibPassToEntries(pass) {
  const entries = []
  const base = { _jib: true, side: pass.side, contexts: ['feature'], slug: null, category_slug: null, inverted: false, rotation: [] }

  // Entrée — approche
  entries.push({ ...base, _key: `${pass._key}_entry`, approach: [pass.approach] })

  // Figures sur le module
  for (const fig of pass.figures) {
    if (fig === 'fs-180') {
      entries.push({ ...base, _key: `${pass._key}_fs180`, rotation: ['fs'], approach: [pass.approach] })
    } else if (fig === 'bs-180') {
      entries.push({ ...base, _key: `${pass._key}_bs180`, rotation: ['bs'], approach: [pass.approach] })
    } else {
      entries.push({
        ...base,
        _key: `${pass._key}_${fig}`,
        slug: fig,
        approach: [pass.approach],
        inverted: false,
      })
    }
  }

  // Press / 50-50
  if (pass.press)  entries.push({ ...base, _key: `${pass._key}_press`, slug: SCORING_SLUGS.press,      approach: [pass.approach] })
  if (pass['5050']) entries.push({ ...base, _key: `${pass._key}_5050`, slug: SCORING_SLUGS.fiftyFifty, approach: [pass.approach] })

  // Rotations (entrée/sortie)
  if (pass.entryRotation) entries.push({ ...base, _key: `${pass._key}_entryrot`, rotation: [pass.entryRotation], approach: [pass.approach] })
  if (pass.exitRotation)  entries.push({ ...base, _key: `${pass._key}_exitrot`,  rotation: [pass.exitRotation],  approach: [pass.approach] })

  // Tricks d'entrée / sortie (wakeskate) : shove-it / kickflip / body varial
  for (const [phase, ids] of [['entry', pass.entryTricks], ['exit', pass.exitTricks]]) {
    for (const tid of ids || []) {
      const t = WS_JIB_TRICKS.find(x => x.id === tid)
      if (t) entries.push({ ...base, _key: `${pass._key}_${phase}_${tid}`, approach: [pass.approach], ...t.entry })
    }
  }

  return entries
}

// ── Grilles de score ─────────────────────────────────────────
//
// GRIDS est indexé par identifiant de grille (≠ discipline : seated a deux
// grilles distinctes selon le niveau de handicap, MP1→MP3 et MP3→MP5). Chaque
// grille = { discipline, modes, sections }. Une section = { section, items } ;
// un item = { key, test(ctx) } renvoyant un booléen.
// `ctx` expose :
//   - `entries` : les figures saisies individuellement (air / kicker / flat…)
//   - `all`     : `entries` + les pseudo-entrées issues des passes jib
//
// Le score est volontairement binaire et sans seuil de degrés : référentiel de
// jugement, pas barème de performance (invariant anti-perf). `discipline` pilote
// le filtre sport de la recherche de figures. Ajouter une grille = une entrée ici.

// Prédicats élémentaires partagés par les tests
const isAir     = e => e.contexts.includes('air_trick')
const onModule  = e => e.contexts.includes('kicker') || e.contexts.includes('feature')
const hasTs     = e => e.approach.includes('ts')
const hasHs     = e => e.approach.includes('hs')
const hasFakie  = e => e.approach.includes('fakie')
const handlePass = e => (e.rotation_type || []).includes('handle_pass')
const rotInDir  = (e, dir) => e.rotation.includes(dir)

// Vrai si `pred` est satisfait des deux côtés (gauche ET droite) → switch
const onBoth = (list, pred) =>
  list.some(e => pred(e) && e.side === 'left') &&
  list.some(e => pred(e) && e.side === 'right')

// Rotations seated : une case par côté × sens. Pas de notion de switch ici — le
// handicap rend chaque côté significatif individuellement.
const ROT_BY_SIDE = [
  { key: 'rot_left_fs',  test: ({ all }) => all.some(e => rotInDir(e, 'fs') && e.side === 'left') },
  { key: 'rot_left_bs',  test: ({ all }) => all.some(e => rotInDir(e, 'bs') && e.side === 'left') },
  { key: 'rot_right_fs', test: ({ all }) => all.some(e => rotInDir(e, 'fs') && e.side === 'right') },
  { key: 'rot_right_bs', test: ({ all }) => all.some(e => rotInDir(e, 'bs') && e.side === 'right') },
]

const SEATED_BOARDSLIDES = [SCORING_SLUGS.seatedFsBoardslide, SCORING_SLUGS.seatedBsBoardslide]
const SEATED_SHIFTIES    = [SCORING_SLUGS.seatedFsShifty, SCORING_SLUGS.seatedBsShifty]
const SEATED_OLLIES      = [SCORING_SLUGS.seatedOllie180, SCORING_SLUGS.seatedOllie360]
// Tricks wakeskate contenant un body varial (corps tournant indépendamment de
// la planche). Pas dérivable d'un champ → liste explicite.
const WS_BODY_VARIALS    = [
  SCORING_SLUGS.wsBodyVarial, SCORING_SLUGS.wsBigSpin, SCORING_SLUGS.wsBiggerSpin,
  SCORING_SLUGS.wsGazelle, SCORING_SLUGS.wsSexchange, SCORING_SLUGS.wsBigflip,
]

export const GRIDS = {
  wakeboard: { discipline: 'wakeboard', modes: ['jib', 'kicker', 'air_trick'], sections: [
    { section: 'compo_sectionAir', items: [
      { key: 'railey_air',      test: ({ entries }) => entries.some(e => isAir(e) && e.category_slug === 'railey') },
      { key: 'backroll_air',    test: ({ entries }) => entries.some(e => isAir(e) && e.category_slug === 'backroll') },
      { key: 'front_sbend_air', test: ({ entries }) => entries.some(e => isAir(e) && (
        (e.category_slug === 'front' && hasHs(e)) || e.category_slug === 's-bend' || e.category_slug === 'hinterberger')) },
      { key: 'ts_air',          test: ({ entries }) => entries.some(e => isAir(e) && hasTs(e)) },
      { key: 'sw_ts_air',       test: ({ entries }) => onBoth(entries, e => isAir(e) && hasTs(e)) },
      { key: 'whip',            test: ({ entries }) => entries.some(e => e.category_slug === 'whip') },
    ] },
    { section: 'compo_sectionGlisse', items: [
      { key: 'flip',          test: ({ all }) => all.some(e => e.inverted && onModule(e)) },
      { key: 'spin',          test: ({ all }) => all.some(e => e.category_slug === 'spin' && onModule(e)) },
      { key: 'fslip_bsboard', test: ({ all }) => all.some(e => e.slug === SCORING_SLUGS.frontLip || e.slug === SCORING_SLUGS.backBoard) },
      { key: 'fsboard_bslip', test: ({ all }) => all.some(e => e.slug === SCORING_SLUGS.frontBoard || e.slug === SCORING_SLUGS.backLip) },
      { key: '5050',          test: ({ all }) => all.some(e => e.slug === SCORING_SLUGS.fiftyFifty) },
      { key: 'press',         test: ({ all }) => all.some(e => e.slug === SCORING_SLUGS.press) },
    ] },
    { section: 'compo_sectionEntries', items: [
      { key: 'ts_entry',    test: ({ all }) => all.some(e => onModule(e) && hasTs(e)) },
      { key: 'sw_ts_entry', test: ({ all }) => onBoth(all.filter(onModule), hasTs) },
      { key: 'hs_entry',    test: ({ all }) => all.some(e => onModule(e) && hasHs(e)) },
      { key: 'sw_hs_entry', test: ({ all }) => onBoth(all.filter(onModule), hasHs) },
    ] },
    { section: 'compo_sectionRota', items: [
      { key: 'fs_rotation',    test: ({ all }) => all.some(e => rotInDir(e, 'fs')) },
      { key: 'sw_fs_rotation', test: ({ all }) => onBoth(all, e => rotInDir(e, 'fs')) },
      { key: 'bs_rotation',    test: ({ all }) => all.some(e => rotInDir(e, 'bs')) },
      { key: 'sw_bs_rotation', test: ({ all }) => onBoth(all, e => rotInDir(e, 'bs')) },
    ] },
  ] },

  wakeskate: { discipline: 'wakeskate', modes: ['jib', 'kicker', 'flat'], sections: [
    { section: 'compo_sectionFlat', items: [
      { key: 'ws_ollie',   test: ({ all }) => all.some(e => e.slug === SCORING_SLUGS.wsOllie) },
      { key: 'ws_body_varial', test: ({ all }) => all.some(e => WS_BODY_VARIALS.includes(e.slug)) },
      { key: 'ws_flip',    test: ({ all }) => all.some(e => e.category_slug === 'fliptricks') },
      // Shove-it = catégorie shoveit, hors ollie et varials (qui ont leur propre case).
      { key: 'ws_shoveit', test: ({ all }) => all.some(e => e.category_slug === 'shoveit'
          && e.slug !== SCORING_SLUGS.wsOllie && !(e.slug || '').includes('varial')) },
    ] },
    { section: 'compo_sectionFeature', items: [
      { key: 'fsboard_bslip', test: ({ all }) => all.some(e => e.slug === SCORING_SLUGS.frontBoard || e.slug === SCORING_SLUGS.backLip) },
      { key: 'fslip_bsboard', test: ({ all }) => all.some(e => e.slug === SCORING_SLUGS.frontLip || e.slug === SCORING_SLUGS.backBoard) },
    ] },
    { section: 'compo_sectionEntries', items: [
      { key: 'ts_entry',    test: ({ all }) => all.some(e => onModule(e) && hasTs(e)) },
      { key: 'sw_ts_entry', test: ({ all }) => onBoth(all.filter(onModule), hasTs) },
      { key: 'hs_entry',    test: ({ all }) => all.some(e => onModule(e) && hasHs(e)) },
      { key: 'sw_hs_entry', test: ({ all }) => onBoth(all.filter(onModule), hasHs) },
    ] },
    { section: 'compo_sectionRota', items: [
      { key: 'fs_rotation',    test: ({ all }) => all.some(e => rotInDir(e, 'fs')) },
      { key: 'sw_fs_rotation', test: ({ all }) => onBoth(all, e => rotInDir(e, 'fs')) },
      { key: 'bs_rotation',    test: ({ all }) => all.some(e => rotInDir(e, 'bs')) },
      { key: 'sw_bs_rotation', test: ({ all }) => onBoth(all, e => rotInDir(e, 'bs')) },
    ] },
  ] },

  // Seated MP1→MP3 : jib, kicker et flat (pas d'air trick).
  seated_mp1: { discipline: 'seated', modes: ['jib', 'kicker', 'flat'], sections: [
    { section: 'compo_sectionFeatureFlat', items: [
      { key: '5050',              test: ({ all }) => all.some(e => e.slug === SCORING_SLUGS.fiftyFifty) },
      { key: 'seated_ollie',      test: ({ all }) => all.some(e => SEATED_OLLIES.includes(e.slug)) },
      { key: 'seated_boardslide', test: ({ all }) => all.some(e => SEATED_BOARDSLIDES.includes(e.slug)) },
      { key: 'seated_fakie',      test: ({ all }) => all.some(hasFakie) },
    ] },
    { section: 'compo_sectionRota', items: [
      { key: 'seated_shifty',     test: ({ all }) => all.some(e => SEATED_SHIFTIES.includes(e.slug)) },
      { key: 'seated_handlepass', test: ({ all }) => all.some(handlePass) },
      ...ROT_BY_SIDE,
    ] },
  ] },

  // Seated MP3→MP5 : ajoute air trick (railey), invert et rewind.
  seated_mp5: { discipline: 'seated', modes: ['jib', 'kicker', 'flat', 'air_trick'], sections: [
    { section: 'compo_sectionAir', items: [
      { key: 'railey_air', test: ({ entries }) => entries.some(e => isAir(e) && e.category_slug === 'railey') },
    ] },
    { section: 'compo_sectionFeatureFlat', items: [
      { key: '5050',              test: ({ all }) => all.some(e => e.slug === SCORING_SLUGS.fiftyFifty) },
      { key: 'seated_ollie',      test: ({ all }) => all.some(e => SEATED_OLLIES.includes(e.slug)) },
      { key: 'seated_boardslide', test: ({ all }) => all.some(e => SEATED_BOARDSLIDES.includes(e.slug)) },
      { key: 'seated_fakie',      test: ({ all }) => all.some(hasFakie) },
      { key: 'seated_invert',     test: ({ all }) => all.some(e => e.inverted) },
    ] },
    { section: 'compo_sectionRota', items: [
      { key: 'seated_shifty',     test: ({ all }) => all.some(e => SEATED_SHIFTIES.includes(e.slug)) },
      { key: 'seated_handlepass', test: ({ all }) => all.some(handlePass) },
      { key: 'seated_rewind',     test: ({ all }) => all.some(e => e.rewind === true) },
      ...ROT_BY_SIDE,
    ] },
  ] },
}

// Ordre d'affichage des grilles dans le sélecteur (libellés via tr.compoGrids).
export const GRID_OPTIONS = ['wakeboard', 'wakeskate', 'seated_mp1', 'seated_mp5']

// Snapshot minimal d'une figure saisie — ne garde que ce qui sert à scorer et
// afficher un run (drop les grosses lignes figure). Partagé par la sauvegarde de
// Compo (compositions.data) ET l'authoring de runs de référence (judge_runs.solution)
// pour que les deux snapshots aient EXACTEMENT la même forme.
export const serializeEntry = (e) => ({
  slug: e.slug, name: e.name, category_slug: e.category_slug,
  side: e.side, contexts: e.contexts, approach: e.approach,
  rotation: e.rotation, inverted: e.inverted,
  // Champs de décompo nécessaires aux grilles seated/wakeskate (handle pass,
  // rewind, ollie 180). Absents sur les vieux runs sauvegardés → traités falsy.
  rotation_type: e.rotation_type, rewind: e.rewind, spin: e.spin,
  _seq: e._seq, _key: e._key,
})

export function computeScore(entries, jibPasses, gridKey = 'wakeboard') {
  // Aplatir les passes jib en pseudo-entrées
  const all = [...entries, ...jibPasses.flatMap(jibPassToEntries)]
  const ctx = { entries, all }
  const sections = (GRIDS[gridKey] || GRIDS.wakeboard).sections

  const scored = {}
  for (const { items } of sections)
    for (const { key, test } of items)
      scored[key] = test(ctx)

  const max = sections.reduce((n, s) => n + s.items.length, 0)
  const total = Object.values(scored).filter(Boolean).length
  // Score normalisé sur 20 pour comparer les grilles entre elles (nombre d'items
  // variable). Le wakeboard a 20 items → score20 == total, inchangé.
  const score20 = max ? Math.round((total / max) * 20) : 0
  return { scored, total, max, score20, grid: sections }
}
