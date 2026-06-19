import { useState, useRef, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { searchFigures } from '../lib/searchFigures'
import { useT } from '../i18n/useT'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/Toast'
import Icon from '../components/Icon'
import SEO from '../components/SEO'
import styles from './Compo.module.css'

const STORAGE_KEY = 'wakeref_compo'

const loadStored = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    return {
      name: data.name || '',
      entries: data.entries || [],
      jibPasses: data.jibPasses || [],
      otherEntries: data.otherEntries || [],
      gridKey: data.gridKey || 'wakeboard',
    }
  } catch {
    return null
  }
}

// Short id for shareable run links (8 chars, base36).
const shortId = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes, b => (b % 36).toString(36)).join('')
}

// Keep only the fields needed to score and display a run — drops the heavy
// figure rows so the stored snapshot stays tiny.
const serializeEntry = (e) => ({
  slug: e.slug, name: e.name, category_slug: e.category_slug,
  side: e.side, contexts: e.contexts, approach: e.approach,
  rotation: e.rotation, inverted: e.inverted,
  // Champs de décompo nécessaires aux grilles seated/wakeskate (handle pass,
  // rewind, ollie 180). Absents sur les vieux runs sauvegardés → traités falsy.
  rotation_type: e.rotation_type, rewind: e.rewind, spin: e.spin,
  _seq: e._seq, _key: e._key,
})

const parseArr = (v) => typeof v === 'string' ? JSON.parse(v) : v || []
const parseFigure = (f) => ({
  ...f,
  contexts: parseArr(f.contexts),
  approach: parseArr(f.approach),
  rotation: parseArr(f.rotation),
  rotation_type: parseArr(f.rotation_type),
})

// Slugs de figures référencés par la grille de score. Le slug étant un champ
// éditable en admin, ces valeurs doivent correspondre exactement aux slugs en
// base — sinon l'item ne se déclenche jamais, silencieusement. Source de vérité
// unique (grille + JIB_FIGURES) ; le garde-fou dans <Compo> alerte en dev si
// l'un d'eux a disparu de la table figures.
const SCORING_SLUGS = {
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
const WS_JIB_TRICKS = [
  { id: 'shoveit',    label: 'Shove-it',    entry: { category_slug: 'shoveit' } },
  { id: 'kickflip',   label: 'Kickflip',    entry: { category_slug: 'fliptricks' } },
  { id: 'bodyvarial', label: 'Body Varial', entry: { slug: SCORING_SLUGS.wsBodyVarial } },
]

// Une passe jib génère des pseudo-entrées pour le moteur de score
function jibPassToEntries(pass) {
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
// grille = { discipline, sections }. Une section = { section, items } ; un item
// = { key, test(ctx) } renvoyant un booléen (« le run contient-il cet élément ? »).
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

const GRIDS = {
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

function computeScore(entries, jibPasses, gridKey = 'wakeboard') {
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

const JIB_FIGURES = [
  { slug: SCORING_SLUGS.fiftyFifty, label: '50-50'        },
  { slug: SCORING_SLUGS.frontBoard, label: 'Front Board'  },
  { slug: SCORING_SLUGS.frontLip,   label: 'Front Lip'    },
  { slug: SCORING_SLUGS.backBoard,  label: 'Back Board'   },
  { slug: SCORING_SLUGS.backLip,    label: 'Back Lip'     },
  { slug: SCORING_SLUGS.press,      label: 'Press'        },
  { slug: 'transfer',      label: 'Transfer'       },
  { slug: 'rail-to-rail',  label: 'Rail to Rail'   },
  { slug: 'gap',           label: 'Gap'            },
  { slug: 're-entry',      label: 'Re-entry'       },
  { slug: 'fs-180',        labelKey: 'compoRotFS'  },
  { slug: 'bs-180',        labelKey: 'compoRotBS'  },
]

// Jib seated : pas de board/lip/press ; à la place les deux boardslides assis.
const JIB_FIGURES_SEATED = [
  { slug: SCORING_SLUGS.fiftyFifty,         label: '50-50'         },
  { slug: SCORING_SLUGS.seatedFsBoardslide, label: 'FS Boardslide' },
  { slug: SCORING_SLUGS.seatedBsBoardslide, label: 'BS Boardslide' },
  { slug: 'transfer',      label: 'Transfer'       },
  { slug: 'rail-to-rail',  label: 'Rail to Rail'   },
  { slug: 'gap',           label: 'Gap'            },
  { slug: 're-entry',      label: 'Re-entry'       },
  { slug: 'fs-180',        labelKey: 'compoRotFS'  },
  { slug: 'bs-180',        labelKey: 'compoRotBS'  },
]

// Lookup combiné pour résoudre le libellé d'une figure jib quel que soit le jeu.
const JIB_FIGURE_BY_SLUG = new Map(
  [...JIB_FIGURES_SEATED, ...JIB_FIGURES].map(f => [f.slug, f])
)

const ROTATIONS = [
  { value: 'fs', labelKey: 'compoRotFS' },
  { value: 'bs', labelKey: 'compoRotBS' },
]

// Ordre d'affichage des grilles dans le sélecteur (libellés via tr.compoGrids).
const GRID_OPTIONS = ['wakeboard', 'wakeskate', 'seated_mp1', 'seated_mp5']

// Libellé du bouton d'ajout par mode (les modes dispo viennent de la grille).
const MODE_LABEL = {
  jib:       'compoAddJib',
  kicker:    'compoAddKicker',
  air_trick: 'compoAddAir',
  flat:      'compoAddFlat',
}

// Axe d'approche du formulaire jib selon la discipline.
const STANDING_APPROACH = [{ value: 'hs', labelKey: 'compoHeelside' }, { value: 'ts', labelKey: 'compoToeside' }]
const SEATED_APPROACH   = [{ value: 'regular', labelKey: 'compoRegular' }, { value: 'fakie', labelKey: 'compoFakie' }]

const OptBtn = ({ active, onClick, children }) => (
  <button
    className={`${styles.optBtn} ${active ? styles.optSelected : ''}`}
    onClick={onClick}
  >{children}</button>
)

// ── Formulaire Passe Jib ─────────────────────────────────────
function JibForm({ tr, approachOptions, figures, tricks, onConfirm, onCancel }) {
  const [pass, setPass] = useState({
    side: null,
    approach: null,
    entryRotation: null,
    exitRotation: null,
    figures: [],
    entryTricks: [],
    exitTricks: [],
  })

  const toggle = (key, val) => setPass(p => ({
    ...p,
    [key]: p[key].includes(val) ? p[key].filter(x => x !== val) : [...p[key], val],
  }))

  const set = (key, val) => setPass(p => ({ ...p, [key]: p[key] === val ? null : val }))

  const valid = pass.side && pass.approach

  return (
    <div className={styles.pending}>
      <p className={styles.pendingTitle}>{tr.compoJibPass}</p>

      <div className={styles.questionRow}>
        <span className={styles.questionLabel}>{tr.compoSide}</span>
        <div className={styles.questionOptions}>
          <OptBtn active={pass.side === 'left'}  onClick={() => set('side', 'left')}>{tr.compoLeft}</OptBtn>
          <OptBtn active={pass.side === 'right'} onClick={() => set('side', 'right')}>{tr.compoRight}</OptBtn>
        </div>
      </div>

      <div className={styles.questionRow}>
        <span className={styles.questionLabel}>{tr.compoApproach}</span>
        <div className={styles.questionOptions}>
          {approachOptions.map(o => (
            <OptBtn key={o.value} active={pass.approach === o.value} onClick={() => set('approach', o.value)}>{tr[o.labelKey]}</OptBtn>
          ))}
        </div>
      </div>

      <div className={styles.questionRow}>
        <span className={styles.questionLabel}>{tr.compoEntryTricks}</span>
        <div className={styles.questionOptions}>
          <OptBtn active={pass.entryRotation === null} onClick={() => set('entryRotation', null)}>{tr.compoNone}</OptBtn>
          {ROTATIONS.map(r => (
            <OptBtn key={r.value} active={pass.entryRotation === r.value} onClick={() => set('entryRotation', r.value)}>{tr[r.labelKey]}</OptBtn>
          ))}
          {tricks && tricks.map(t => (
            <OptBtn key={t.id} active={pass.entryTricks.includes(t.id)} onClick={() => toggle('entryTricks', t.id)}>
              {t.label}
            </OptBtn>
          ))}
        </div>
      </div>

      <div className={styles.questionRow}>
        <span className={styles.questionLabel}>{tr.compoJibFigures}</span>
        <div className={styles.questionOptions}>
          {figures.map(f => (
            <OptBtn key={f.slug} active={pass.figures.includes(f.slug)} onClick={() => toggle('figures', f.slug)}>
              {f.labelKey ? tr[f.labelKey] : f.label}
            </OptBtn>
          ))}
        </div>
      </div>

      <div className={styles.questionRow}>
        <span className={styles.questionLabel}>{tr.compoExitTricks}</span>
        <div className={styles.questionOptions}>
          <OptBtn active={pass.exitRotation === null} onClick={() => set('exitRotation', null)}>{tr.compoNone}</OptBtn>
          {ROTATIONS.map(r => (
            <OptBtn key={r.value} active={pass.exitRotation === r.value} onClick={() => set('exitRotation', r.value)}>{tr[r.labelKey]}</OptBtn>
          ))}
          {tricks && tricks.map(t => (
            <OptBtn key={t.id} active={pass.exitTricks.includes(t.id)} onClick={() => toggle('exitTricks', t.id)}>
              {t.label}
            </OptBtn>
          ))}
        </div>
      </div>

      <div className={styles.pendingActions}>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>{tr.cancel}</button>
        <button className="btn btn-primary btn-sm" disabled={!valid} onClick={() => onConfirm(pass)}>
          {tr.compoConfirm}
        </button>
      </div>
    </div>
  )
}

// ── Formulaire Autre figure (texte libre) ────────────────────
function OtherForm({ tr, onConfirm, onCancel }) {
  const [name, setName] = useState('')
  const valid = name.trim().length > 0
  const confirm = () => { if (valid) onConfirm(name.trim()) }

  return (
    <div className={styles.pending}>
      <p className={styles.pendingTitle}>{tr.compoOther}</p>
      <div className={styles.questionRow}>
        <span className={styles.questionLabel}>{tr.compoOtherLabel}</span>
        <input
          className="input"
          type="text"
          placeholder={tr.compoOtherPlaceholder}
          value={name}
          onChange={e => setName(e.target.value)}
          autoComplete="off"
          autoFocus
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); confirm() }
            else if (e.key === 'Escape') onCancel()
          }}
        />
      </div>
      <div className={styles.pendingActions}>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>{tr.cancel}</button>
        <button className="btn btn-primary btn-sm" disabled={!valid} onClick={confirm}>
          {tr.compoConfirm}
        </button>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────
export default function Compo() {
  const tr = useT()
  const { id } = useParams()
  const { toasts, toast } = useToast()
  const [query, setQuery]             = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching]     = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const [stored] = useState(loadStored)
  const [name, setName]               = useState(stored?.name || '')
  const [entries, setEntries]         = useState(stored?.entries || [])
  const [jibPasses, setJibPasses]     = useState(stored?.jibPasses || [])
  const [otherEntries, setOtherEntries] = useState(stored?.otherEntries || [])
  const [pendingFigure, setPendingFigure]   = useState(null)
  const [pendingAnswers, setPendingAnswers] = useState({})
  const [pendingRewind, setPendingRewind]   = useState(false) // toggle rewind (spin sur kicker)
  const [gridKey, setGridKey]         = useState(stored?.gridKey || 'wakeboard')
  const [addMode, setAddMode]         = useState(null) // null | 'jib' | 'kicker' | 'air_trick' | 'flat' | 'other'
  const [saving, setSaving]           = useState(false)
  const [savedId, setSavedId]         = useState(null) // id of the run once saved → share link
  const [savedSig, setSavedSig]       = useState(null) // content signature the saved link belongs to
  const [showSave, setShowSave]       = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false) // score breakdown fold (mobile only)

  // Grille active : pilote les modes d'ajout, le filtre sport de la recherche,
  // l'axe d'approche du jib et la dispo du toggle rewind.
  const activeGrid = GRIDS[gridKey] || GRIDS.wakeboard
  const gridModes  = activeGrid.modes
  const seatedApproach = activeGrid.discipline === 'seated'
  const gridSupportsRewind = activeGrid.sections.some(s => s.items.some(i => i.key === 'seated_rewind'))

  // Resume the sequence counter past any restored items so ordering stays correct
  const maxStoredSeq = [...(stored?.entries || []), ...(stored?.jibPasses || []), ...(stored?.otherEntries || [])]
    .reduce((m, x) => Math.max(m, x._seq || 0), 0)
  const seqRef = useRef(maxStoredSeq)
  const nextSeq = () => ++seqRef.current

  // Minimal snapshot of the run — persisted to localStorage and used to tell
  // whether a previously generated share link still matches the current content.
  const snapshot = useMemo(
    () => JSON.stringify({ name, entries, jibPasses, otherEntries, gridKey }),
    [name, entries, jibPasses, otherEntries, gridKey]
  )

  // Persist the composition so an accidental refresh doesn't lose it
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, snapshot)
  }, [snapshot])

  // The share link is stale as soon as the content drifts from what was saved,
  // so it's derived (not reset via an effect).
  const linkValid = savedId !== null && savedSig === snapshot

  // Load a saved run when the URL carries an id (/compo/:id)
  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .rpc('get_composition', { cid: id })
        .single()
      if (cancelled) return
      if (error || !data) { toast(tr.compoLoadError, 'error'); return }
      const d = data.data || {}
      setName(data.name || '')
      setEntries(d.entries || [])
      setJibPasses(d.jibPasses || [])
      setOtherEntries(d.otherEntries || [])
      setGridKey(d.gridKey || 'wakeboard')
      seqRef.current = [...(d.entries || []), ...(d.jibPasses || []), ...(d.otherEntries || [])]
        .reduce((m, x) => Math.max(m, x._seq || 0), 0)
    })()
    return () => { cancelled = true }
  }, [id, toast, tr])

  // Garde-fou dev : alerte si un slug référencé par la grille a dérivé en base
  // (renommage admin) — l'item de score deviendrait sinon muet sans erreur.
  // Réservé au dev : ne rentre pas dans le bundle de prod.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const slugs = Object.values(SCORING_SLUGS)
    ;(async () => {
      const { data } = await supabase.from('figures').select('slug').in('slug', slugs)
      const present = new Set((data || []).map(f => f.slug))
      const missing = slugs.filter(s => !present.has(s))
      if (missing.length) console.warn('[compo] slugs de scoring absents en base:', missing)
    })()
  }, [])

  const resetCompo = () => {
    setName('')
    setEntries([])
    setJibPasses([])
    setOtherEntries([])
    setPendingFigure(null)
    setPendingAnswers({})
    setPendingRewind(false)
    setAddMode(null)
    setShowSave(false)
    setSavedId(null)
    setQuery('')
    setSuggestions([])
  }

  // Changement de grille : on garde les figures saisies (donnée agnostique) mais
  // on annule toute saisie en cours, car les modes d'ajout peuvent différer.
  // Garde-fou : on n'autorise pas de changer de discipline avec des figures déjà
  // saisies (un run ne mélange pas les disciplines) ; le switch de niveau au sein
  // d'une même discipline (seated MP1↔MP5) reste permis.
  const changeGrid = (key) => {
    const hasItems = entries.length || jibPasses.length || otherEntries.length
    if (hasItems && (GRIDS[key]?.discipline || 'wakeboard') !== activeGrid.discipline) return
    setGridKey(key)
    setAddMode(null)
    setPendingFigure(null)
    setPendingAnswers({})
    setPendingRewind(false)
    setQuery('')
    setSuggestions([])
  }

  const search = async (q) => {
    setHighlightIdx(-1)
    setQuery(q)
    if (!q.trim()) { setSuggestions([]); return }
    setSearching(true)
    const data = await searchFigures(q.trim())
    let results = data.map(parseFigure)
    // Restreint à la discipline de la grille active, en plus du filtre de contexte.
    if (addMode) {
      results = results.filter(f =>
        f.contexts.includes(addMode) && parseArr(f.sports).includes(activeGrid.discipline)
      )
    }
    setSuggestions(results.slice(0, 8))
    setSearching(false)
  }

  const selectFigure = (fig) => {
    setQuery('')
    setSuggestions([])
    setHighlightIdx(-1)

    const questions = []
    // Un trick à plat n'a pas de côté de câble pertinent → on ne demande pas
    // le côté (le mode 'flat' n'existe qu'en wakeskate et seated).
    if (addMode !== 'flat') {
      questions.push({ id: 'side', labelKey: 'compoSide', optionKeys: ['compoLeft', 'compoRight'] })
    }

    if (!addMode) {
      const hasAir     = fig.contexts.includes('air_trick')
      const hasKicker  = fig.contexts.includes('kicker')
      const hasFeature = fig.contexts.includes('feature')
      if (hasAir && (hasKicker || hasFeature)) {
        const opts = []
        if (hasAir)     opts.push('Air Trick')
        if (hasKicker)  opts.push('Kicker')
        if (hasFeature) opts.push(tr.ctxNames?.feature || 'Feature')
        questions.push({ id: 'context', labelKey: 'compoContext', options: opts })
      }
    }
    if (fig.approach.includes('hs') && fig.approach.includes('ts')) {
      questions.push({ id: 'approach', labelKey: 'compoApproach', optionKeys: ['compoHeelside', 'compoToeside'] })
    }

    setPendingFigure({ fig, questions })
    setPendingAnswers({})
    setPendingRewind(false)
  }

  const confirmEntry = () => {
    const { fig } = pendingFigure
    const answers = pendingAnswers
    // null pour un trick à plat (côté non demandé) → n'entre pas dans les cases
    // de rotation par côté.
    const side = answers.side ? (answers.side === 'compoRight' ? 'right' : 'left') : null
    let resolvedContexts = [...fig.contexts]
    if (answers.context) {
      const map = { 'Air Trick': 'air_trick', 'Kicker': 'kicker', [tr.ctxNames?.feature || 'Feature']: 'feature' }
      resolvedContexts = [map[answers.context]]
    } else if (addMode) {
      resolvedContexts = [addMode]
    }
    let resolvedApproach = [...fig.approach]
    if (answers.approach) {
      resolvedApproach = [answers.approach === 'compoToeside' ? 'ts' : 'hs']
    }
    setEntries(prev => [...prev, {
      ...fig,
      contexts: resolvedContexts,
      approach: resolvedApproach,
      side,
      rewind: pendingRewind || !!fig.rewind,
      _key: `${fig.id}-${Date.now()}`,
      _seq: nextSeq(),
    }])
    setPendingFigure(null)
    setPendingAnswers({})
    setPendingRewind(false)
    setAddMode(null)
  }

  const confirmJib = (pass) => {
    setJibPasses(prev => [...prev, { ...pass, _key: `jib-${Date.now()}`, _seq: nextSeq() }])
    setAddMode(null)
  }

  const confirmOther = (name) => {
    setOtherEntries(prev => [...prev, { name, _key: `other-${Date.now()}`, _seq: nextSeq() }])
    setAddMode(null)
  }

  const allQuestionsAnswered = pendingFigure
    ? pendingFigure.questions.every(q => pendingAnswers[q.id])
    : false

  const { scored, score20, grid } = computeScore(entries, jibPasses, gridKey)

  const saveRun = async () => {
    setSaving(true)
    const newId = shortId()
    const { error } = await supabase.from('compositions').insert({
      id: newId,
      name: name.trim() || null,
      score: score20,
      data: {
        entries: entries.map(serializeEntry),
        jibPasses,
        otherEntries,
        gridKey,
      },
    })
    setSaving(false)
    if (error) { toast(tr.compoSaveError, 'error'); return }
    setSavedId(newId)
    setSavedSig(snapshot)
    setShowSave(false)
  }

  const shareUrl = savedId ? `${window.location.origin}/compo/${savedId}` : ''
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast(tr.copied, 'success')
    } catch { /* ignore */ }
  }

  const sideLabel = (s) => s === 'left' ? tr.compoLeft : tr.compoRight
  const ctxLabel  = (c) => tr.ctxNames?.[c] || c
  const appLabel  = (a) => ({ ts: tr.compoToeside, hs: tr.compoHeelside, regular: tr.compoRegular, fakie: tr.compoFakie }[a] || a)

  const jibSummary = (p) => {
    const parts = []
    if (p.entryRotation) parts.push(p.entryRotation.toUpperCase() + ' in')
    if (p.entryTricks?.length) parts.push(p.entryTricks.map(id => WS_JIB_TRICKS.find(x => x.id === id)?.label || id).join(', '))
    if (p.figures.length) parts.push(p.figures.map(f => {
      const fig = JIB_FIGURE_BY_SLUG.get(f)
      return fig ? (fig.labelKey ? tr[fig.labelKey] : fig.label) : f
    }).join(', '))
    if (p.exitRotation) parts.push(p.exitRotation.toUpperCase() + ' out')
    if (p.exitTricks?.length) parts.push(p.exitTricks.map(id => WS_JIB_TRICKS.find(x => x.id === id)?.label || id).join(', '))
    return parts.join(' · ') || '50-50'
  }

  const allItems = [
    ...entries.map(e => ({ type: 'figure', data: e })),
    ...jibPasses.map(p => ({ type: 'jib', data: p })),
    ...otherEntries.map(o => ({ type: 'other', data: o })),
  ].sort((a, b) => (a.data._seq ?? 0) - (b.data._seq ?? 0))

  // Glow the save button once the run is worth keeping (3+ tricks), but not when
  // it's already saved/unchanged or the save panel is already open.
  const showSaveHint = allItems.length >= 3 && !linkValid && !showSave

  // Swap an item with its neighbour, then renumber _seq 1..N across all three
  // arrays so the order survives across types (a jib can move above a figure).
  const moveItem = (index, dir) => {
    const target = index + dir
    if (target < 0 || target >= allItems.length) return
    const reordered = [...allItems]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    const seqByKey = new Map(reordered.map((it, i) => [it.data._key, i + 1]))
    const reseq = (x) => ({ ...x, _seq: seqByKey.get(x._key) ?? x._seq })
    setEntries(prev => prev.map(reseq))
    setJibPasses(prev => prev.map(reseq))
    setOtherEntries(prev => prev.map(reseq))
    seqRef.current = reordered.length
  }

  const setterFor = (type) =>
    type === 'figure' ? setEntries : type === 'jib' ? setJibPasses : setOtherEntries

  // Remove a trick but keep it restorable via an Undo toast. The removed item
  // keeps its _seq, so undo drops it back into its original position.
  const removeItem = (type, item) => {
    const setter = setterFor(type)
    setter(prev => prev.filter(x => x._key !== item._key))
    toast(tr.compoRemoved, 'info', {
      actionLabel: tr.undo,
      onAction: () => setter(prev => [...prev, item]),
      duration: 6000,
    })
  }

  const rowControls = (index, type, item) => (
    <div className={styles.rowActions}>
      <div className={styles.moveGroup}>
        <button className={styles.moveBtn} disabled={index === 0}
          onClick={() => moveItem(index, -1)} aria-label={tr.compoMoveUp}>
          <Icon name="chevron-right" size={16} className={styles.moveUp} />
        </button>
        <button className={styles.moveBtn} disabled={index === allItems.length - 1}
          onClick={() => moveItem(index, 1)} aria-label={tr.compoMoveDown}>
          <Icon name="chevron-right" size={16} className={styles.moveDown} />
        </button>
      </div>
      <button className={styles.removeBtn} onClick={() => removeItem(type, item)} aria-label={tr.compoRemove}>
        <Icon name="x" size={16} />
      </button>
    </div>
  )

  return (
    <div className={styles.page}>
      <SEO
        titleFr="Composition de run"
        titleEn="Run composition"
        descriptionFr="Compose ton run (wakeboard, wakeskate, wakeboard assis) et calcule ton score."
        descriptionEn="Build your run (wakeboard, wakeskate, seated) and compute your score."
        path="/compo"
      />
      <ToastContainer toasts={toasts} />
      <div className={styles.layout}>

        <div className={styles.left}>
          <div className={styles.headerRow}>
            <h2 className={styles.sectionTitle}>{tr.compoTitle}</h2>
            {allItems.length > 0 && (
              <div className={styles.headerActions}>
                <button
                  className={`btn btn-primary btn-sm ${showSaveHint ? styles.savePulse : ''}`}
                  onClick={() => { setShowSave(true); setSavedId(null) }}
                >
                  {tr.compoSave}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={resetCompo}
                >
                  {tr.compoReset}
                </button>
              </div>
            )}
          </div>

          {/* Sélecteur de grille (discipline / niveau) — les autres disciplines
              sont verrouillées dès qu'une figure est saisie. */}
          <div className={styles.gridSelect}>
            {GRID_OPTIONS.map(key => {
              const locked = allItems.length > 0 && GRIDS[key].discipline !== activeGrid.discipline
              return (
                <button
                  key={key}
                  className={`${styles.gridTab} ${gridKey === key ? styles.gridTabActive : ''}`}
                  onClick={() => changeGrid(key)}
                  disabled={locked}
                  title={locked ? tr.compoGridLocked : undefined}
                >
                  {tr.compoGrids?.[key] || key}
                </button>
              )
            })}
          </div>

          {showSaveHint && (
            <p className={styles.saveHintLine}>{tr.compoSaveHint}</p>
          )}

          {/* Panneau de sauvegarde */}
          {showSave && (
            <div className={styles.savePanel}>
              <label className={styles.saveLabel} htmlFor="compo-name">{tr.compoNameLabel}</label>
              <input
                id="compo-name"
                className="input"
                type="text"
                maxLength={80}
                placeholder={tr.compoNamePlaceholder}
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="off"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter' && !saving) saveRun() }}
              />
              <div className={styles.saveActions}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowSave(false)}>{tr.cancel}</button>
                <button className="btn btn-primary btn-sm" disabled={saving} onClick={saveRun}>
                  {saving ? <span className={styles.spinner} /> : tr.compoSaveConfirm}
                </button>
              </div>
            </div>
          )}

          {/* Lien de partage après sauvegarde */}
          {linkValid && (
            <div className={styles.sharePanel}>
              <p className={styles.shareTitle}>{tr.compoSavedTitle}</p>
              <div className={styles.shareRow}>
                <input className="input" type="text" value={shareUrl} readOnly onFocus={e => e.target.select()} />
                <button className="btn btn-primary btn-sm" onClick={copyLink}>{tr.compoCopyLink}</button>
              </div>
            </div>
          )}

          {/* Boutons d'ajout */}
          {!addMode && !pendingFigure && (
            <div className={styles.addBtns}>
              {gridModes.map(m => (
                <button key={m} className={`btn btn-ghost btn-sm ${styles.addBtn}`} onClick={() => setAddMode(m)}>
                  {tr[MODE_LABEL[m]]}
                </button>
              ))}
              <button className={`btn btn-ghost btn-sm ${styles.addBtn}`} onClick={() => setAddMode('other')}>
                {tr.compoAddOther}
              </button>
            </div>
          )}

          {/* Recherche figure (kicker, air trick ou flat) */}
          {(addMode === 'kicker' || addMode === 'air_trick' || addMode === 'flat') && (
            <div className={styles.searchSection}>
              <div className={styles.searchWrap}>
                <input
                  className="input"
                  type="text"
                  placeholder={tr.compoAdd}
                  value={query}
                  onChange={e => search(e.target.value)}
                  autoComplete="off"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIdx(i => Math.min(i + 1, suggestions.length - 1)) }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightIdx(i => Math.max(i - 1, 0)) }
                    else if (e.key === 'Enter' && highlightIdx >= 0) { e.preventDefault(); selectFigure(suggestions[highlightIdx]) }
                    else if (e.key === 'Escape') { setAddMode(null); setQuery(''); setSuggestions([]) }
                  }}
                />
                {searching && <span className={styles.spinner} />}
                {suggestions.length > 0 && (
                  <div className={styles.suggestions}>
                    {suggestions.map((f, idx) => (
                      <button
                        key={f.id}
                        className={`${styles.suggestion} ${highlightIdx === idx ? styles.suggestionHighlight : ''}`}
                        onClick={() => selectFigure(f)}
                      >
                        <span className={styles.suggName}>{f.name}</span>
                        <span className={styles.suggCat}>{f.category_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => { setAddMode(null); setQuery(''); setSuggestions([]) }}>
                {tr.cancel}
              </button>
            </div>
          )}

          {/* Formulaire passe jib */}
          {addMode === 'jib' && (
            <JibForm
              tr={tr}
              approachOptions={seatedApproach ? SEATED_APPROACH : STANDING_APPROACH}
              figures={seatedApproach ? JIB_FIGURES_SEATED : JIB_FIGURES}
              tricks={activeGrid.discipline === 'wakeskate' ? WS_JIB_TRICKS : null}
              onConfirm={confirmJib}
              onCancel={() => setAddMode(null)}
            />
          )}

          {/* Formulaire autre figure */}
          {addMode === 'other' && (
            <OtherForm
              tr={tr}
              onConfirm={confirmOther}
              onCancel={() => setAddMode(null)}
            />
          )}

          {/* Questions figure en attente */}
          {pendingFigure && (
            <div className={styles.pending}>
              <p className={styles.pendingTitle}>{pendingFigure.fig.name}</p>
              {pendingFigure.questions.map(q => (
                <div key={q.id} className={styles.questionRow}>
                  <span className={styles.questionLabel}>{tr[q.labelKey]}</span>
                  <div className={styles.questionOptions}>
                    {(q.optionKeys || q.options).map(opt => (
                      <button
                        key={opt}
                        className={`${styles.optBtn} ${pendingAnswers[q.id] === opt ? styles.optSelected : ''}`}
                        onClick={() => setPendingAnswers(a => ({ ...a, [q.id]: opt }))}
                      >{q.optionKeys ? tr[opt] : opt}</button>
                    ))}
                  </div>
                </div>
              ))}
              {/* Toggle rewind : figure spin ajoutée sur kicker, grilles qui le scorent */}
              {addMode === 'kicker' && pendingFigure.fig.category_slug === 'spin' && gridSupportsRewind && (
                <div className={styles.questionRow}>
                  <span className={styles.questionLabel}>{tr.compoRewindLabel}</span>
                  <div className={styles.questionOptions}>
                    <button
                      className={`${styles.optBtn} ${pendingRewind ? styles.optSelected : ''}`}
                      onClick={() => setPendingRewind(r => !r)}
                    >{tr.compoRewind}</button>
                  </div>
                </div>
              )}
              <div className={styles.pendingActions}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setPendingFigure(null); setAddMode(null); }}>{tr.cancel}</button>
                <button className="btn btn-primary btn-sm" disabled={!allQuestionsAnswered} onClick={confirmEntry}>
                  {tr.compoConfirm}
                </button>
              </div>
            </div>
          )}

          {/* Liste des entrées */}
          {allItems.length === 0 && !pendingFigure && !addMode
            ? <p className={styles.empty}>{tr.compoEmpty}</p>
            : (
              <div className={styles.entryList}>
                {allItems.map(({ type, data }, index) => {
                  if (type === 'figure') {
                    const e = data
                    const accent = e.contexts.includes('air_trick') ? styles.entryRowAir
                      : e.contexts.includes('kicker') ? styles.entryRowKicker
                      : ''
                    return (
                      <div key={e._key} className={`${styles.entryRow} ${accent}`}>
                        <div className={styles.entryInfo}>
                          <span className={styles.entryName}>{e.name}</span>
                          <div className={styles.entryTags}>
                            {e.side && <span className={styles.tag}>{sideLabel(e.side)}</span>}
                            {e.contexts.map(c => <span key={c} className={styles.tag}>{ctxLabel(c)}</span>)}
                            {e.approach.map(a => <span key={a} className={styles.tag}>{appLabel(a)}</span>)}
                          </div>
                        </div>
                        {rowControls(index, 'figure', e)}
                      </div>
                    )
                  }
                  if (type === 'jib') {
                    const p = data
                    return (
                      <div key={p._key} className={`${styles.entryRow} ${styles.entryRowJib}`}>
                        <div className={styles.entryInfo}>
                          <span className={styles.entryName}>{tr.compoJibPass}</span>
                          <div className={styles.entryTags}>
                            <span className={styles.tag}>{sideLabel(p.side)}</span>
                            <span className={styles.tag}>{appLabel(p.approach)}</span>
                            <span className={`${styles.tag} ${styles.tagJib}`}>{jibSummary(p)}</span>
                          </div>
                        </div>
                        {rowControls(index, 'jib', p)}
                      </div>
                    )
                  }
                  const o = data
                  return (
                    <div key={o._key} className={`${styles.entryRow} ${styles.entryRowOther}`}>
                      <div className={styles.entryInfo}>
                        <span className={styles.entryName}>{o.name}</span>
                        <div className={styles.entryTags}>
                          <span className={styles.tag}>{tr.compoOther}</span>
                        </div>
                      </div>
                      {rowControls(index, 'other', o)}
                    </div>
                  )
                })}
              </div>
            )
          }
        </div>

        {/* Score */}
        <div className={styles.right}>
          <button
            className={styles.scoreHeader}
            onClick={() => setDetailsOpen(o => !o)}
            aria-expanded={detailsOpen}
          >
            <span className={styles.scoreTotal}>{score20}</span>
            <span className={styles.scoreMax}>/20</span>
            <Icon
              name="chevron-right"
              className={`${styles.scoreToggle} ${detailsOpen ? styles.scoreToggleOpen : ''}`}
            />
          </button>
          <div className={`${styles.scoreDetails} ${detailsOpen ? '' : styles.scoreDetailsCollapsed}`}>
            {grid.map(({ section, items }) => (
              <div key={section} className={styles.scoreSection}>
                <p className={styles.scoreSectionTitle}>{tr[section]}</p>
                {items.map(({ key }) => (
                  <div key={key} className={`${styles.scoreItem} ${scored[key] ? styles.scoreItemOn : ''}`}>
                    <span className={styles.scoreItemDot} />
                    <span className={styles.scoreItemLabel}>{tr.compoItems?.[key] || key}</span>
                    <span className={styles.scoreItemPt}>{scored[key] ? '1' : '0'}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
