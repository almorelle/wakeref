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
  rotation: e.rotation, inverted: e.inverted, _seq: e._seq, _key: e._key,
})

const parseArr = (v) => typeof v === 'string' ? JSON.parse(v) : v || []
const parseFigure = (f) => ({
  ...f,
  contexts: parseArr(f.contexts),
  approach: parseArr(f.approach),
  rotation: parseArr(f.rotation),
})

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
  if (pass.press)  entries.push({ ...base, _key: `${pass._key}_press`, slug: 'press',  approach: [pass.approach] })
  if (pass['5050']) entries.push({ ...base, _key: `${pass._key}_5050`, slug: '50-50', approach: [pass.approach] })

  // Rotations (entrée/sortie)
  if (pass.entryRotation) entries.push({ ...base, _key: `${pass._key}_entryrot`, rotation: [pass.entryRotation], approach: [pass.approach] })
  if (pass.exitRotation)  entries.push({ ...base, _key: `${pass._key}_exitrot`,  rotation: [pass.exitRotation],  approach: [pass.approach] })

  return entries
}

function computeScore(entries, jibPasses) {
  // Aplatir les passes jib en pseudo-entrées
  const jibEntries = jibPasses.flatMap(jibPassToEntries)
  const all = [...entries, ...jibEntries]

  const scored = {}

  // AIR TRICKS
  scored['railey_air'] = entries.some(e => e.category_slug === 'railey' && e.contexts.includes('air_trick'))
  scored['backroll_air'] = entries.some(e => e.category_slug === 'backroll' && e.contexts.includes('air_trick'))
  scored['front_sbend_air'] = entries.some(e =>
    e.contexts.includes('air_trick') && (
      (e.category_slug === 'front' && e.approach.includes('hs')) ||
      e.category_slug === 's-bend' || e.category_slug === 'hinterberger'
    )
  )
  scored['ts_air'] = entries.some(e => e.contexts.includes('air_trick') && e.approach.includes('ts'))
  const tsAirLeft  = entries.some(e => e.contexts.includes('air_trick') && e.approach.includes('ts') && e.side === 'left')
  const tsAirRight = entries.some(e => e.contexts.includes('air_trick') && e.approach.includes('ts') && e.side === 'right')
  scored['sw_ts_air'] = tsAirLeft && tsAirRight
  scored['whip'] = entries.some(e => e.category_slug === 'whip')

  // GLISSE (kicker + feature)
  scored['flip'] = all.some(e => e.inverted && (e.contexts.includes('kicker') || e.contexts.includes('feature')))
  scored['spin'] = all.some(e => e.category_slug === 'spin' && (e.contexts.includes('kicker') || e.contexts.includes('feature')))
  scored['fslip_bsboard'] = all.some(e => e.slug === 'front-lip' || e.slug === 'back-board')
  scored['fsboard_bslip'] = all.some(e => e.slug === 'front-board' || e.slug === 'back-lip')

  // ENTRIES (kicker/feature)
  const jibKicker = all.filter(e => e.contexts.includes('kicker') || e.contexts.includes('feature'))
  const tsLeft  = jibKicker.some(e => e.approach.includes('ts') && e.side === 'left')
  const tsRight = jibKicker.some(e => e.approach.includes('ts') && e.side === 'right')
  const hsLeft  = jibKicker.some(e => e.approach.includes('hs') && e.side === 'left')
  const hsRight = jibKicker.some(e => e.approach.includes('hs') && e.side === 'right')
  scored['ts_entry']    = tsLeft || tsRight
  scored['sw_ts_entry'] = tsLeft && tsRight
  scored['hs_entry']    = hsLeft || hsRight
  scored['sw_hs_entry'] = hsLeft && hsRight
  scored['5050']  = all.some(e => e.slug === '50-50')
  scored['press'] = all.some(e => e.slug === 'press')

  // ROTATIONS
  const fsLeft  = all.some(e => e.rotation.includes('fs') && e.side === 'left')
  const fsRight = all.some(e => e.rotation.includes('fs') && e.side === 'right')
  const bsLeft  = all.some(e => e.rotation.includes('bs') && e.side === 'left')
  const bsRight = all.some(e => e.rotation.includes('bs') && e.side === 'right')
  scored['fs_rotation']    = fsLeft || fsRight
  scored['sw_fs_rotation'] = fsLeft && fsRight
  scored['bs_rotation']    = bsLeft || bsRight
  scored['sw_bs_rotation'] = bsLeft && bsRight

  return { scored, total: Object.values(scored).filter(Boolean).length }
}

const SCORE_KEYS = [
  { section: 'compo_sectionAir',     items: ['railey_air','backroll_air','front_sbend_air','ts_air','sw_ts_air','whip'] },
  { section: 'compo_sectionGlisse',  items: ['flip','spin','fslip_bsboard','fsboard_bslip','5050','press'] },
  { section: 'compo_sectionEntries', items: ['ts_entry','sw_ts_entry','hs_entry','sw_hs_entry'] },
  { section: 'compo_sectionRota',    items: ['fs_rotation','sw_fs_rotation','bs_rotation','sw_bs_rotation'] },
]

const JIB_FIGURES = [
  { slug: '50-50',         label: '50-50'          },
  { slug: 'front-board',   label: 'Front Board'    },
  { slug: 'front-lip',     label: 'Front Lip'      },
  { slug: 'back-board',    label: 'Back Board'     },
  { slug: 'back-lip',      label: 'Back Lip'       },
  { slug: 'press',         label: 'Press'          },
  { slug: 'transfer',      label: 'Transfer'       },
  { slug: 'rail-to-rail',  label: 'Rail to Rail'   },
  { slug: 'gap',           label: 'Gap'            },
  { slug: 're-entry',      label: 'Re-entry'       },
  { slug: 'fs-180',        labelKey: 'compoRotFS'  },
  { slug: 'bs-180',        labelKey: 'compoRotBS'  },
]

const ROTATIONS = [
  { value: 'fs', labelKey: 'compoRotFS' },
  { value: 'bs', labelKey: 'compoRotBS' },
]

const OptBtn = ({ active, onClick, children }) => (
  <button
    className={`${styles.optBtn} ${active ? styles.optSelected : ''}`}
    onClick={onClick}
  >{children}</button>
)

// ── Formulaire Passe Jib ─────────────────────────────────────
function JibForm({ tr, onConfirm, onCancel }) {
  const [pass, setPass] = useState({
    side: null,
    approach: null,
    entryRotation: null,
    exitRotation: null,
    figures: [],
  })

  const toggle = (key, val) => setPass(p => ({
    ...p,
    figures: p.figures.includes(val) ? p.figures.filter(x => x !== val) : [...p.figures, val],
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
          <OptBtn active={pass.approach === 'hs'} onClick={() => set('approach', 'hs')}>{tr.compoHeelside}</OptBtn>
          <OptBtn active={pass.approach === 'ts'} onClick={() => set('approach', 'ts')}>{tr.compoToeside}</OptBtn>
        </div>
      </div>

      <div className={styles.questionRow}>
        <span className={styles.questionLabel}>{tr.compoEntryRot}</span>
        <div className={styles.questionOptions}>
          <OptBtn active={pass.entryRotation === null} onClick={() => set('entryRotation', null)}>{tr.compoNone}</OptBtn>
          {ROTATIONS.map(r => (
            <OptBtn key={r.value} active={pass.entryRotation === r.value} onClick={() => set('entryRotation', r.value)}>{tr[r.labelKey]}</OptBtn>
          ))}
        </div>
      </div>

      <div className={styles.questionRow}>
        <span className={styles.questionLabel}>{tr.compoJibFigures}</span>
        <div className={styles.questionOptions}>
          {JIB_FIGURES.map(f => (
            <OptBtn key={f.slug} active={pass.figures.includes(f.slug)} onClick={() => toggle('figures', f.slug)}>
              {f.labelKey ? tr[f.labelKey] : f.label}
            </OptBtn>
          ))}
        </div>
      </div>

      <div className={styles.questionRow}>
        <span className={styles.questionLabel}>{tr.compoExitRot}</span>
        <div className={styles.questionOptions}>
          <OptBtn active={pass.exitRotation === null} onClick={() => set('exitRotation', null)}>{tr.compoNone}</OptBtn>
          {ROTATIONS.map(r => (
            <OptBtn key={r.value} active={pass.exitRotation === r.value} onClick={() => set('exitRotation', r.value)}>{tr[r.labelKey]}</OptBtn>
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
  const [addMode, setAddMode]         = useState(null) // null | 'jib' | 'kicker' | 'air_trick' | 'other'
  const [saving, setSaving]           = useState(false)
  const [savedId, setSavedId]         = useState(null) // id of the run once saved → share link
  const [savedSig, setSavedSig]       = useState(null) // content signature the saved link belongs to
  const [showSave, setShowSave]       = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false) // score breakdown fold (mobile only)

  // Resume the sequence counter past any restored items so ordering stays correct
  const maxStoredSeq = [...(stored?.entries || []), ...(stored?.jibPasses || []), ...(stored?.otherEntries || [])]
    .reduce((m, x) => Math.max(m, x._seq || 0), 0)
  const seqRef = useRef(maxStoredSeq)
  const nextSeq = () => ++seqRef.current

  // Minimal snapshot of the run — persisted to localStorage and used to tell
  // whether a previously generated share link still matches the current content.
  const snapshot = useMemo(
    () => JSON.stringify({ name, entries, jibPasses, otherEntries }),
    [name, entries, jibPasses, otherEntries]
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
      seqRef.current = [...(d.entries || []), ...(d.jibPasses || []), ...(d.otherEntries || [])]
        .reduce((m, x) => Math.max(m, x._seq || 0), 0)
    })()
    return () => { cancelled = true }
  }, [id, toast, tr])

  const resetCompo = () => {
    setName('')
    setEntries([])
    setJibPasses([])
    setOtherEntries([])
    setPendingFigure(null)
    setPendingAnswers({})
    setAddMode(null)
    setShowSave(false)
    setSavedId(null)
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
    if (addMode) results = results.filter(f => f.contexts.includes(addMode))
    setSuggestions(results.slice(0, 8))
    setSearching(false)
  }

  const selectFigure = (fig) => {
    setQuery('')
    setSuggestions([])
    setHighlightIdx(-1)

    const questions = []
    questions.push({ id: 'side', labelKey: 'compoSide', optionKeys: ['compoLeft', 'compoRight'] })

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
  }

  const confirmEntry = () => {
    const { fig } = pendingFigure
    const answers = pendingAnswers
    const side = answers.side === 'compoRight' ? 'right' : 'left'
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
      _key: `${fig.id}-${Date.now()}`,
      _seq: nextSeq(),
    }])
    setPendingFigure(null)
    setPendingAnswers({})
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

  const { scored, total } = computeScore(entries, jibPasses)

  const saveRun = async () => {
    setSaving(true)
    const newId = shortId()
    const { error } = await supabase.from('compositions').insert({
      id: newId,
      name: name.trim() || null,
      score: total,
      data: {
        entries: entries.map(serializeEntry),
        jibPasses,
        otherEntries,
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
  const appLabel  = (a) => a === 'ts' ? tr.compoToeside : tr.compoHeelside

  const jibSummary = (p) => {
    const parts = []
    if (p.entryRotation) parts.push(p.entryRotation.toUpperCase() + ' in')
    if (p.figures.length) parts.push(p.figures.map(f => {
      const fig = JIB_FIGURES.find(x => x.slug === f)
      return fig ? (fig.labelKey ? tr[fig.labelKey] : fig.label) : f
    }).join(', '))
    if (p.exitRotation) parts.push(p.exitRotation.toUpperCase() + ' out')
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
        descriptionFr="Compose ton run de wakeboard et calcule ton score."
        descriptionEn="Build your wakeboard run and compute your score."
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
              <button className={`btn btn-ghost btn-sm ${styles.addBtn}`} onClick={() => setAddMode('jib')}>
                {tr.compoAddJib}
              </button>
              <button className={`btn btn-ghost btn-sm ${styles.addBtn}`} onClick={() => setAddMode('kicker')}>
                {tr.compoAddKicker}
              </button>
              <button className={`btn btn-ghost btn-sm ${styles.addBtn}`} onClick={() => setAddMode('air_trick')}>
                {tr.compoAddAir}
              </button>
              <button className={`btn btn-ghost btn-sm ${styles.addBtn}`} onClick={() => setAddMode('other')}>
                {tr.compoAddOther}
              </button>
            </div>
          )}

          {/* Recherche figure (kicker ou air trick) */}
          {(addMode === 'kicker' || addMode === 'air_trick') && (
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
                            <span className={styles.tag}>{sideLabel(e.side)}</span>
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
            <span className={styles.scoreTotal}>{total}</span>
            <span className={styles.scoreMax}>/20</span>
            <Icon
              name="chevron-right"
              className={`${styles.scoreToggle} ${detailsOpen ? styles.scoreToggleOpen : ''}`}
            />
          </button>
          <div className={`${styles.scoreDetails} ${detailsOpen ? '' : styles.scoreDetailsCollapsed}`}>
            {SCORE_KEYS.map(({ section, items }) => (
              <div key={section} className={styles.scoreSection}>
                <p className={styles.scoreSectionTitle}>{tr[section]}</p>
                {items.map(key => (
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
