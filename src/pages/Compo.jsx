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

function computeScore(entries) {
  const scored = {}

  // AIR TRICKS
  scored['railey_air'] = entries.some(e =>
    e.category_slug === 'railey' && e.contexts.includes('air_trick')
  )
  scored['backroll_air'] = entries.some(e =>
    e.category_slug === 'backroll' && e.contexts.includes('air_trick')
  )
  scored['front_sbend_air'] = entries.some(e =>
    e.contexts.includes('air_trick') && (
      (e.category_slug === 'front' && e.approach.includes('hs')) ||
      e.category_slug === 's-bend' ||
      e.category_slug === 'hinterberger'
    )
  )
  scored['ts_air'] = entries.some(e =>
    e.contexts.includes('air_trick') && e.approach.includes('ts')
  )
  const tsAirLeft  = entries.some(e => e.contexts.includes('air_trick') && e.approach.includes('ts') && e.side === 'left')
  const tsAirRight = entries.some(e => e.contexts.includes('air_trick') && e.approach.includes('ts') && e.side === 'right')
  scored['sw_ts_air'] = tsAirLeft && tsAirRight
  scored['whip'] = entries.some(e => e.category_slug === 'whip')

  // GLISSE
  scored['flip'] = entries.some(e =>
    e.inverted && (e.contexts.includes('kicker') || e.contexts.includes('jib'))
  )
  scored['spin'] = entries.some(e =>
    e.category_slug === 'spin' && (e.contexts.includes('kicker') || e.contexts.includes('jib'))
  )
  scored['fslip_bsboard'] = entries.some(e =>
    e.slug === 'front-lip' || e.slug === 'bs-boardslide'
  )
  scored['fsboard_bslip'] = entries.some(e =>
    e.slug === 'front-board' || e.slug === 'back-lip'
  )

  // ENTRIES (kicker/jib uniquement)
  const jibKicker = entries.filter(e => e.contexts.includes('kicker') || e.contexts.includes('jib'))
  const tsLeft  = jibKicker.some(e => e.approach.includes('ts') && e.side === 'left')
  const tsRight = jibKicker.some(e => e.approach.includes('ts') && e.side === 'right')
  const hsLeft  = jibKicker.some(e => e.approach.includes('hs') && e.side === 'left')
  const hsRight = jibKicker.some(e => e.approach.includes('hs') && e.side === 'right')
  scored['ts_entry']    = tsLeft || tsRight
  scored['sw_ts_entry'] = tsLeft && tsRight
  scored['hs_entry']    = hsLeft || hsRight
  scored['sw_hs_entry'] = hsLeft && hsRight
  scored['5050']  = entries.some(e => e.slug === '50-50')
  scored['press'] = entries.some(e => e.slug === 'press')

  // ROTATIONS
  const fsLeft  = entries.some(e => e.rotation.includes('fs') && e.side === 'left')
  const fsRight = entries.some(e => e.rotation.includes('fs') && e.side === 'right')
  const bsLeft  = entries.some(e => e.rotation.includes('bs') && e.side === 'left')
  const bsRight = entries.some(e => e.rotation.includes('bs') && e.side === 'right')
  scored['fs_rotation']    = fsLeft || fsRight
  scored['sw_fs_rotation'] = fsLeft && fsRight
  scored['bs_rotation']    = bsLeft || bsRight
  scored['sw_bs_rotation'] = bsLeft && bsRight

  return { scored, total: Object.values(scored).filter(Boolean).length }
}

const SCORE_KEYS = [
  { section: 'compo_sectionAir',     items: ['railey_air','backroll_air','front_sbend_air','ts_air','sw_ts_air','whip'] },
  { section: 'compo_sectionGlisse',  items: ['flip','spin','fslip_bsboard','fsboard_bslip'] },
  { section: 'compo_sectionEntries', items: ['ts_entry','sw_ts_entry','hs_entry','sw_hs_entry','5050','press'] },
  { section: 'compo_sectionRota',    items: ['fs_rotation','sw_fs_rotation','bs_rotation','sw_bs_rotation'] },
]

export default function Compo() {
  const tr = useT()
  const [query, setQuery]             = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching]     = useState(false)
  const [entries, setEntries]         = useState([])
  const [pendingFigure, setPendingFigure]   = useState(null)
  const [pendingAnswers, setPendingAnswers] = useState({})

  const search = async (q) => {
    setQuery(q)
    if (!q.trim()) { setSuggestions([]); return }
    setSearching(true)
    const { data } = await supabase.rpc('search_figures', { query: q.trim() })
    setSuggestions((data || []).slice(0, 8).map(parseFigure))
    setSearching(false)
  }

  const selectFigure = (fig) => {
    setQuery('')
    setSuggestions([])

    const questions = []
    questions.push({ id: 'side', label: tr.compoSide, options: [tr.compoLeft, tr.compoRight] })

    const hasAir    = fig.contexts.includes('air_trick')
    const hasKicker = fig.contexts.includes('kicker')
    const hasJib    = fig.contexts.includes('jib')
    if (hasAir && (hasKicker || hasJib)) {
      const opts = []
      if (hasAir)    opts.push('Air Trick')
      if (hasKicker) opts.push('Kicker')
      if (hasJib)    opts.push('Jib')
      questions.push({ id: 'context', label: tr.compoContext, options: opts })
    }

    if (fig.approach.includes('hs') && fig.approach.includes('ts')) {
      questions.push({ id: 'approach', label: tr.compoApproach, options: [tr.compoHeelside, tr.compoToeside] })
    }

    setPendingFigure({ fig, questions })
    setPendingAnswers({})
  }

  const confirmEntry = () => {
    const { fig } = pendingFigure
    const answers = pendingAnswers

    const side = answers.side === tr.compoRight ? 'right' : 'left'

    let resolvedContexts = [...fig.contexts]
    if (answers.context) {
      const map = { 'Air Trick': 'air_trick', 'Kicker': 'kicker', 'Jib': 'jib' }
      resolvedContexts = [map[answers.context]]
    }

    let resolvedApproach = [...fig.approach]
    if (answers.approach) {
      resolvedApproach = [answers.approach === tr.compoToeside ? 'ts' : 'hs']
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
  }

  const allQuestionsAnswered = pendingFigure
    ? pendingFigure.questions.every(q => pendingAnswers[q.id])
    : false

  const { scored, total } = computeScore(entries)

  const sideLabel = (s) => s === 'left' ? tr.compoLeft : tr.compoRight
  const ctxLabel  = (c) => ({ air_trick: 'Air Trick', kicker: 'Kicker', jib: 'Jib', flat: 'Flat' })[c] || c
  const appLabel  = (a) => a === 'ts' ? tr.compoToeside : tr.compoHeelside

  return (
    <div className={styles.page}>
      <div className={styles.layout}>

        <div className={styles.left}>
          <h2 className={styles.sectionTitle}>{tr.compoTitle}</h2>

          <div className={styles.searchWrap}>
            <input
              className="input"
              type="text"
              placeholder={tr.compoAdd}
              value={query}
              onChange={e => search(e.target.value)}
              autoComplete="off"
            />
            {searching && <span className={styles.spinner} />}
            {suggestions.length > 0 && (
              <div className={styles.suggestions}>
                {suggestions.map(f => (
                  <button key={f.id} className={styles.suggestion} onClick={() => selectFigure(f)}>
                    <span className={styles.suggName}>{f.name}</span>
                    <span className={styles.suggCat}>{f.category_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {pendingFigure && (
            <div className={styles.pending}>
              <p className={styles.pendingTitle}>{pendingFigure.fig.name}</p>
              {pendingFigure.questions.map(q => (
                <div key={q.id} className={styles.questionRow}>
                  <span className={styles.questionLabel}>{q.label}</span>
                  <div className={styles.questionOptions}>
                    {q.options.map(opt => (
                      <button
                        key={opt}
                        className={`${styles.optBtn} ${pendingAnswers[q.id] === opt ? styles.optSelected : ''}`}
                        onClick={() => setPendingAnswers(a => ({ ...a, [q.id]: opt }))}
                      >{opt}</button>
                    ))}
                  </div>
                </div>
              ))}
              <div className={styles.pendingActions}>
                <button className="btn btn-ghost btn-sm" onClick={() => setPendingFigure(null)}>{tr.cancel}</button>
                <button className="btn btn-primary btn-sm" disabled={!allQuestionsAnswered} onClick={confirmEntry}>
                  {tr.compoConfirm}
                </button>
              </div>
            </div>
          )}

          {entries.length === 0 && !pendingFigure
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
              </div>
            )
          }
        </div>

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
