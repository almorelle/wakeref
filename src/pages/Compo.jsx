import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useT } from '../i18n/useT'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/Toast'
import Icon from '../components/Icon'
import SEO from '../components/SEO'
import RunSaisie from '../components/RunSaisie'
import { GRIDS, GRID_OPTIONS, SCORING_SLUGS, computeScore, serializeEntry } from '../lib/compoGrids'
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

// Couleur d'accent par discipline : signe visuellement le run (pill active,
// score, critères, en-tête du panneau). Exposée en variable CSS --disc.
const DISCIPLINE_COLOR = {
  wakeboard: 'var(--c-wake)',   // cyan
  wakeskate: 'var(--c-ws)',     // ambre
  seated:    'var(--c-seated)', // violet
}

const EMPTY_RUN = { entries: [], jibPasses: [], otherEntries: [] }

// ── Main ─────────────────────────────────────────────────────
export default function Compo() {
  const tr = useT()
  const { id } = useParams()
  const { toasts, toast } = useToast()
  const [stored] = useState(loadStored)
  const [name, setName]               = useState(stored?.name || '')
  // Données du run regroupées : <RunSaisie> est contrôlé via value/onChange ;
  // un objet unique permet des mises à jour fonctionnelles correctes (undo).
  const [run, setRun] = useState(() => ({
    entries: stored?.entries || [],
    jibPasses: stored?.jibPasses || [],
    otherEntries: stored?.otherEntries || [],
  }))
  const [gridKey, setGridKey]         = useState(stored?.gridKey || 'wakeboard')
  const [saving, setSaving]           = useState(false)
  const [savedId, setSavedId]         = useState(null) // id of the run once saved → share link
  const [savedSig, setSavedSig]       = useState(null) // content signature the saved link belongs to
  const [showSave, setShowSave]       = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false) // score breakdown fold (mobile only)
  // Bumpé par resetCompo pour remonter <RunSaisie> et purger sa saisie en cours.
  const [resetNonce, setResetNonce]   = useState(0)

  // Grille active : pilote la couleur de discipline et le verrouillage du
  // sélecteur (le changement de discipline est bloqué dès qu'un item existe).
  const activeGrid = GRIDS[gridKey] || GRIDS.wakeboard
  const disciplineColor = DISCIPLINE_COLOR[activeGrid.discipline] || 'var(--c-accent)'

  const itemCount = run.entries.length + run.jibPasses.length + run.otherEntries.length

  // Minimal snapshot of the run — persisted to localStorage and used to tell
  // whether a previously generated share link still matches the current content.
  const snapshot = useMemo(
    () => JSON.stringify({ name, entries: run.entries, jibPasses: run.jibPasses, otherEntries: run.otherEntries, gridKey }),
    [name, run, gridKey]
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
      setRun({
        entries: d.entries || [],
        jibPasses: d.jibPasses || [],
        otherEntries: d.otherEntries || [],
      })
      setGridKey(d.gridKey || 'wakeboard')
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
    setRun(EMPTY_RUN)
    setShowSave(false)
    setSavedId(null)
    setResetNonce(n => n + 1)
  }

  // Changement de grille : on garde les figures saisies (donnée agnostique) mais
  // la saisie en cours est purgée par le remount de <RunSaisie> (key=gridKey).
  // Garde-fou : on n'autorise pas de changer de discipline avec des figures déjà
  // saisies (un run ne mélange pas les disciplines) ; le switch de niveau au sein
  // d'une même discipline (seated MP1↔MP5) reste permis.
  const changeGrid = (key) => {
    if (itemCount && (GRIDS[key]?.discipline || 'wakeboard') !== activeGrid.discipline) return
    setGridKey(key)
  }

  const { scored, score20, grid } = computeScore(run.entries, run.jibPasses, gridKey)

  const saveRun = async () => {
    setSaving(true)
    const newId = shortId()
    const { error } = await supabase.from('compositions').insert({
      id: newId,
      name: name.trim() || null,
      score: score20,
      data: {
        entries: run.entries.map(serializeEntry),
        jibPasses: run.jibPasses,
        otherEntries: run.otherEntries,
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

  // Glow the save button once the run is worth keeping (3+ tricks), but not when
  // it's already saved/unchanged or the save panel is already open.
  const showSaveHint = itemCount >= 3 && !linkValid && !showSave

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
      <div className={styles.layout} style={{ '--disc': disciplineColor }}>

        <div className={styles.left}>
          <div className={styles.headerRow}>
            <h2 className={styles.sectionTitle}>{tr.compoTitle}</h2>
            {itemCount > 0 && (
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
              const locked = itemCount > 0 && GRIDS[key].discipline !== activeGrid.discipline
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

          {/* Saisie du run (réutilisable, sans calcul de score) */}
          <RunSaisie
            key={`${gridKey}-${resetNonce}`}
            gridKey={gridKey}
            value={run}
            onChange={setRun}
            toast={toast}
          />
        </div>

        {/* Score */}
        <div className={styles.right}>
          {/* En-tête de discipline : signe le run dans la couleur de la grille. */}
          <span className={styles.disciplineTag}>{tr.compoGrids?.[gridKey] || gridKey}</span>
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
