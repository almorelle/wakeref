import { useState, useEffect, useMemo } from 'react'
import { useT } from '../i18n/useT'
import SEO from '../components/SEO'
import { GRIDS, GRID_OPTIONS } from '../lib/compoGrids'
import styles from './CompositionSimple.module.css'

const STORAGE_KEY = 'wakeref_composition_simple'

// Couleur d'accent par discipline (cf. Compo) — pilote la teinte via --disc.
const DISCIPLINE_COLOR = {
  wakeboard: 'var(--c-wake)',   // cyan
  wakeskate: 'var(--c-ws)',     // ambre
  seated:    'var(--c-seated)', // violet
}

const loadStored = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    return {
      gridKey: GRIDS[data.gridKey] ? data.gridKey : 'wakeboard',
      // checked : { [gridKey]: { [itemKey]: true } } — état par grille conservé.
      checked: data.checked && typeof data.checked === 'object' ? data.checked : {},
    }
  } catch {
    return null
  }
}

// ── Page de saisie manuelle de note ──────────────────────────
// Cousine légère de Compo : pas de saisie de tricks, on coche directement les
// items de la grille et on lit la note /20. Non exposée dans le menu (/composition-simple).
export default function CompositionSimple() {
  const tr = useT()
  const [stored] = useState(loadStored)
  const [gridKey, setGridKey] = useState(stored?.gridKey || 'wakeboard')
  const [checked, setChecked] = useState(stored?.checked || {})

  const grid = GRIDS[gridKey] || GRIDS.wakeboard
  const disciplineColor = DISCIPLINE_COLOR[grid.discipline] || 'var(--c-accent)'
  const gridChecked = checked[gridKey] || {}

  // Persiste à chaque changement pour qu'un refresh ne perde pas la saisie.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ gridKey, checked }))
  }, [gridKey, checked])

  // Note binaire normalisée /20 (même calcul que computeScore, sans les tests).
  const { total, max, score20 } = useMemo(() => {
    const items = grid.sections.flatMap(s => s.items)
    const max = items.length
    const total = items.filter(it => gridChecked[it.key]).length
    return { total, max, score20: max ? Math.round((total / max) * 20) : 0 }
  }, [grid, gridChecked])

  const toggle = (key) => {
    setChecked(prev => {
      const cur = { ...(prev[gridKey] || {}) }
      if (cur[key]) delete cur[key]
      else cur[key] = true
      return { ...prev, [gridKey]: cur }
    })
  }

  // Reset : vide uniquement la grille active (les autres restent intactes).
  const reset = () => {
    setChecked(prev => {
      const next = { ...prev }
      delete next[gridKey]
      return next
    })
  }

  return (
    <div className={styles.page} style={{ '--disc': disciplineColor }}>
      <SEO
        titleFr="Saisie de note"
        titleEn="Score sheet"
        descriptionFr="Coche les critères de la grille et lis ta note sur 20."
        descriptionEn="Tick the grid criteria and read your score out of 20."
        path="/composition-simple"
      />

      {/* Sélecteur de grille (discipline / niveau) — menu déroulant compact. */}
      <div className={styles.gridSelect}>
        <select
          className={styles.gridDropdown}
          value={gridKey}
          onChange={(e) => setGridKey(e.target.value)}
          aria-label={tr.compoGridLabel || 'Discipline'}
        >
          {GRID_OPTIONS.map(key => (
            <option key={key} value={key}>{tr.compoGrids?.[key] || key}</option>
          ))}
        </select>
      </div>

      {/* En-tête sticky : note /20 + reset */}
      <div className={styles.scoreBar}>
        <div className={styles.scoreValue}>
          <span className={styles.scoreTotal}>{score20}</span>
          <span className={styles.scoreMax}>/20</span>
          <span className={styles.scoreCount}>{total}/{max}</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={reset} disabled={!total}>
          {tr.compoReset}
        </button>
      </div>

      {/* Grille à cocher */}
      <div className={styles.sections}>
        {grid.sections.map(({ section, items }) => (
          <div key={section} className={styles.section}>
            <p className={styles.sectionTitle}>{tr[section]}</p>
            <div className={styles.items}>
              {items.map(({ key }) => {
                const on = !!gridChecked[key]
                return (
                  <button
                    key={key}
                    type="button"
                    className={`${styles.item} ${on ? styles.itemOn : ''}`}
                    aria-pressed={on}
                    onClick={() => toggle(key)}
                  >
                    <span className={styles.itemBox} aria-hidden="true" />
                    <span className={styles.itemLabel}>{tr.compoItems?.[key] || key}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
