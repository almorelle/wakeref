import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useT } from '../i18n/useT'
import styles from './Compo.module.css'

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
  const base = { _jib: true, side: pass.side, contexts: ['jib'], slug: null, category_slug: null, inverted: false, rotation: [] }

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

  // GLISSE (kicker + jib)
  scored['flip'] = all.some(e => e.inverted && (e.contexts.includes('kicker') || e.contexts.includes('jib')))
  scored['spin'] = all.some(e => e.category_slug === 'spin' && (e.contexts.includes('kicker') || e.contexts.includes('jib')))
  scored['fslip_bsboard'] = all.some(e => e.slug === 'front-lip' || e.slug === 'bs-boardslide')
  scored['fsboard_bslip'] = all.some(e => e.slug === 'front-board' || e.slug === 'back-lip')

  // ENTRIES (kicker/jib)
  const jibKicker = all.filter(e => e.contexts.includes('kicker') || e.contexts.includes('jib'))
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
  { slug: 'front-lip',     label: 'Front Lip'      },
  { slug: 'bs-boardslide', label: 'BS Boardslide'  },
  { slug: 'front-board',   label: 'Front Board'    },
  { slug: 'back-lip',      label: 'Back Lip'       },
  { slug: '50-50',         label: '50-50'          },
  { slug: 'press',         label: 'Press'          },
  { slug: 'transfer',      label: 'Transfer'       },
  { slug: 'gap',           label: 'Gap'            },
  { slug: 'fs-180',        labelKey: 'compoRotFS'  },
  { slug: 'bs-180',        labelKey: 'compoRotBS'  },
]

const ROTATIONS = [
  { value: 'fs', labelKey: 'compoRotFS' },
  { value: 'bs', labelKey: 'compoRotBS' },
]

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

  const OptBtn = ({ active, onClick, children }) => (
    <button
      className={`${styles.optBtn} ${active ? styles.optSelected : ''}`}
      onClick={onClick}
    >{children}</button>
  )

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
        <div className={styles.questionOptions} style={{ flexWrap: 'wrap' }}>
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

// ── Main ─────────────────────────────────────────────────────
export default function Compo() {
  const tr = useT()
  const [query, setQuery]             = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching]     = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const [entries, setEntries]         = useState([])
  const [jibPasses, setJibPasses]     = useState([])
  const [pendingFigure, setPendingFigure]   = useState(null)
  const [pendingAnswers, setPendingAnswers] = useState({})
  const [addMode, setAddMode]         = useState(null) // null | 'jib' | 'kicker' | 'air_trick'

  const search = async (q) => {
    setHighlightIdx(-1)
    setQuery(q)
    if (!q.trim()) { setSuggestions([]); return }
    setSearching(true)
    const { data } = await supabase.rpc('search_figures', { query: q.trim() })
    let results = (data || []).map(parseFigure)
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
      const hasAir    = fig.contexts.includes('air_trick')
      const hasKicker = fig.contexts.includes('kicker')
      const hasJib    = fig.contexts.includes('jib')
      if (hasAir && (hasKicker || hasJib)) {
        const opts = []
        if (hasAir)    opts.push('Air Trick')
        if (hasKicker) opts.push('Kicker')
        if (hasJib)    opts.push('Jib')
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
      const map = { 'Air Trick': 'air_trick', 'Kicker': 'kicker', 'Jib': 'jib' }
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
    }])
    setPendingFigure(null)
    setPendingAnswers({})
    setAddMode(null)
  }

  const confirmJib = (pass) => {
    setJibPasses(prev => [...prev, { ...pass, _key: `jib-${Date.now()}` }])
    setAddMode(null)
  }

  const allQuestionsAnswered = pendingFigure
    ? pendingFigure.questions.every(q => pendingAnswers[q.id])
    : false

  const { scored, total } = computeScore(entries, jibPasses)

  const sideLabel = (s) => s === 'left' ? tr.compoLeft : tr.compoRight
  const ctxLabel  = (c) => ({ air_trick: 'Air Trick', kicker: 'Kicker', jib: 'Jib', flat: 'Flat' })[c] || c
  const appLabel  = (a) => a === 'ts' ? tr.compoToeside : tr.compoHeelside

  const jibSummary = (p) => {
    const parts = []
    if (p.entryRotation) parts.push(p.entryRotation.toUpperCase())
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
  ]

  return (
    <div className={styles.page}>
      <div className={styles.layout}>

        <div className={styles.left}>
          <h2 className={styles.sectionTitle}>{tr.compoTitle}</h2>

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
                {entries.map(e => (
                  <div key={e._key} className={styles.entryRow}>
                    <div className={styles.entryInfo}>
                      <span className={styles.entryName}>{e.name}</span>
                      <div className={styles.entryTags}>
                        <span className={styles.tag}>{sideLabel(e.side)}</span>
                        {e.contexts.map(c => <span key={c} className={styles.tag}>{ctxLabel(c)}</span>)}
                        {e.approach.map(a => <span key={a} className={styles.tag}>{appLabel(a)}</span>)}
                      </div>
                    </div>
                    <button className={styles.removeBtn} onClick={() => setEntries(prev => prev.filter(x => x._key !== e._key))}>✕</button>
                  </div>
                ))}
                {jibPasses.map(p => (
                  <div key={p._key} className={`${styles.entryRow} ${styles.entryRowJib}`}>
                    <div className={styles.entryInfo}>
                      <span className={styles.entryName}>{tr.compoJibPass}</span>
                      <div className={styles.entryTags}>
                        <span className={styles.tag}>{sideLabel(p.side)}</span>
                        <span className={styles.tag}>{appLabel(p.approach)}</span>
                        <span className={`${styles.tag} ${styles.tagJib}`}>{jibSummary(p)}</span>
                      </div>
                    </div>
                    <button className={styles.removeBtn} onClick={() => setJibPasses(prev => prev.filter(x => x._key !== p._key))}>✕</button>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        {/* Score */}
        <div className={styles.right}>
          <div className={styles.scoreHeader}>
            <span className={styles.scoreTotal}>{total}</span>
            <span className={styles.scoreMax}>/20</span>
          </div>
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
  )
}
