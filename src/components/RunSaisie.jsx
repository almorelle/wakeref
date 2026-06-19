import { useState } from 'react'
import { searchFigures } from '../lib/searchFigures'
import { GRIDS, SCORING_SLUGS, WS_JIB_TRICKS } from '../lib/compoGrids'
import { useT } from '../i18n/useT'
import Icon from './Icon'
import styles from './RunSaisie.module.css'

const parseArr = (v) => typeof v === 'string' ? JSON.parse(v) : v || []
const parseFigure = (f) => ({
  ...f,
  contexts: parseArr(f.contexts),
  approach: parseArr(f.approach),
  rotation: parseArr(f.rotation),
  rotation_type: parseArr(f.rotation_type),
})

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

// Numéro de séquence suivant : max des _seq existants + 1 (unique, croissant,
// commun aux trois tableaux). Calculé sur l'état courant à chaque ajout.
const nextSeqOf = (v) => Math.max(
  0, ...[...v.entries, ...v.jibPasses, ...v.otherEntries].map(x => x._seq || 0)
) + 1

const ARRAY_KEY = { figure: 'entries', jib: 'jibPasses', other: 'otherEntries' }

const sortedAllItems = (v) => [
  ...v.entries.map(e => ({ type: 'figure', data: e })),
  ...v.jibPasses.map(p => ({ type: 'jib', data: p })),
  ...v.otherEntries.map(o => ({ type: 'other', data: o })),
].sort((a, b) => (a.data._seq ?? 0) - (b.data._seq ?? 0))

// ── Saisie de run réutilisable ───────────────────────────────
// Composant contrôlé et présentation-neutre : il ne pose ni largeur ni grille
// (le parent compose la mise en page). Aucun calcul de score ici.
//   - gridKey  : identifiant de grille actif (fixé par le parent)
//   - value    : { entries, jibPasses, otherEntries }
//   - onChange : reçoit la valeur suivante, ou un updater (prev) => next
//   - toast    : fonction toast (pour l'undo de suppression)
export default function RunSaisie({ gridKey, value, onChange, toast }) {
  const tr = useT()
  const [query, setQuery]               = useState('')
  const [suggestions, setSuggestions]   = useState([])
  const [searching, setSearching]       = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const [pendingFigure, setPendingFigure]   = useState(null)
  const [pendingAnswers, setPendingAnswers] = useState({})
  const [pendingRewind, setPendingRewind]   = useState(false) // toggle rewind (spin sur kicker)
  const [addMode, setAddMode]           = useState(null) // null | 'jib' | 'kicker' | 'air_trick' | 'flat' | 'other'

  // Grille active : pilote les modes d'ajout, le filtre sport de la recherche,
  // l'axe d'approche du jib et la dispo du toggle rewind.
  const activeGrid = GRIDS[gridKey] || GRIDS.wakeboard
  const gridModes  = activeGrid.modes
  const seatedApproach = activeGrid.discipline === 'seated'
  const gridSupportsRewind = activeGrid.sections.some(s => s.items.some(i => i.key === 'seated_rewind'))

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
    onChange(prev => ({
      ...prev,
      entries: [...prev.entries, {
        ...fig,
        contexts: resolvedContexts,
        approach: resolvedApproach,
        side,
        rewind: pendingRewind || !!fig.rewind,
        _key: `${fig.id}-${Date.now()}`,
        _seq: nextSeqOf(prev),
      }],
    }))
    setPendingFigure(null)
    setPendingAnswers({})
    setPendingRewind(false)
    setAddMode(null)
  }

  const confirmJib = (pass) => {
    onChange(prev => ({
      ...prev,
      jibPasses: [...prev.jibPasses, { ...pass, _key: `jib-${Date.now()}`, _seq: nextSeqOf(prev) }],
    }))
    setAddMode(null)
  }

  const confirmOther = (name) => {
    onChange(prev => ({
      ...prev,
      otherEntries: [...prev.otherEntries, { name, _key: `other-${Date.now()}`, _seq: nextSeqOf(prev) }],
    }))
    setAddMode(null)
  }

  const allQuestionsAnswered = pendingFigure
    ? pendingFigure.questions.every(q => pendingAnswers[q.id])
    : false

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

  const allItems = sortedAllItems(value)

  // Échange un item avec son voisin, puis renumérote _seq 1..N sur les trois
  // tableaux pour que l'ordre survive entre types (un jib peut passer au-dessus
  // d'une figure).
  const moveItem = (index, dir) => {
    onChange(prev => {
      const items = sortedAllItems(prev)
      const target = index + dir
      if (target < 0 || target >= items.length) return prev
      const reordered = [...items]
      ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
      const seqByKey = new Map(reordered.map((it, i) => [it.data._key, i + 1]))
      const reseq = (x) => ({ ...x, _seq: seqByKey.get(x._key) ?? x._seq })
      return {
        entries: prev.entries.map(reseq),
        jibPasses: prev.jibPasses.map(reseq),
        otherEntries: prev.otherEntries.map(reseq),
      }
    })
  }

  // Supprime un trick mais le garde restaurable via un toast Undo. L'item conserve
  // son _seq, donc l'undo le replace à sa position d'origine.
  const removeItem = (type, item) => {
    const key = ARRAY_KEY[type]
    onChange(prev => ({ ...prev, [key]: prev[key].filter(x => x._key !== item._key) }))
    toast(tr.compoRemoved, 'info', {
      actionLabel: tr.undo,
      onAction: () => onChange(prev => ({ ...prev, [key]: [...prev[key], item] })),
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
    <>
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
    </>
  )
}
