import { useState, useEffect, useMemo } from 'react'
import SEO from '../components/SEO'
import Icon from '../components/Icon'
import { useTheme } from '../contexts/theme-context'
import styles from './France2026.module.css'

const STORAGE_KEY = 'wakeref_france2026'

// Couleur d'accent par discipline (cf. Compo) — pilote la teinte via --disc.
const DISCIPLINE_COLOR = {
  wakeboard: 'var(--c-wake)',   // cyan
  wakeskate: 'var(--c-ws)',     // ambre
  seated:    'var(--c-seated)', // violet
}

// ── Grilles dédiées France 2026 ──────────────────────────────
// Page autonome : les grilles sont définies ici (pas de dépendance à compoGrids).
// Chaque item a une clé stable `s{section}i{item}` pour la persistance localStorage.
const RAW_GRIDS = {
  wakeboard: {
    discipline: 'wakeboard',
    label: 'Wakeboard',
    sections: [
      { title: 'Air tricks', items: ['Raley', 'Backroll', 'Front', 'Inside TS', 'Outside TS', 'Whip', 'Regular', 'Goofy'] },
      { title: 'Kicker',     items: ['Flip', 'Spin'] },
      { title: 'Jib',        items: ['FS Lip', 'FS Board', 'BS Lip', 'BS Board', 'Nose Press', 'Flip', 'Spin'] },
      { title: 'Entrées',    items: ['Regular TS', 'Regular HS', 'Goofy TS', 'Goofy HS'] },
      { title: 'Spins',      items: ['Regular FS', 'Regular BS', 'Goofy HS', 'Goofy BS'] },
    ],
  },
  wakeskate: {
    discipline: 'wakeskate',
    label: 'Wakeskate',
    sections: [
      { title: 'Flat',    items: ['Ollie', 'Shov', 'Flip', 'Spin', 'Switch'] },
      { title: 'Kicker',  items: ['Shov', 'Flip', 'Spin'] },
      { title: 'Jib',     items: ['Ollie In', 'Shov in/out', 'Flip in/out', 'FS Lip', 'FS Board', 'BS Lip', 'BS Board'] },
      { title: 'Entrées', items: ['Regular TS', 'Regular HS', 'Goofy TS', 'Goofy HS'] },
      { title: 'Spins',   items: ['Regular FS', 'Regular BS', 'Goofy HS', 'Goofy BS'] },
    ],
  },
  seated: {
    discipline: 'seated',
    label: 'Assis',
    sections: [
      { title: 'Flat',      items: ['Ollie', 'Slide', 'Spin'] },
      { title: 'Kicker',    items: ['Spin', 'Flip'] },
      { title: 'Jib',       items: ['50-50', 'Spin', 'Transfer'] },
      { title: 'Entrées',   items: ['Inside', 'Outside', 'SW Inside', 'SW Outside'] },
      { title: 'Rotations', items: ['Inside FS', 'Outside FS', 'Inside BS', 'Outside BS'] },
    ],
  },
}

// Injecte des clés stables sur chaque item (indépendantes des libellés).
const GRIDS = Object.fromEntries(
  Object.entries(RAW_GRIDS).map(([gk, g]) => [gk, {
    ...g,
    sections: g.sections.map((s, si) => ({
      ...s,
      items: s.items.map((label, ii) => ({ key: `s${si}i${ii}`, label })),
    })),
  }])
)

const GRID_OPTIONS = Object.keys(GRIDS)

const loadStored = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    return {
      gridKey: GRIDS[data.gridKey] ? data.gridKey : 'wakeboard',
      checked: data.checked && typeof data.checked === 'object' ? data.checked : {},
    }
  } catch {
    return null
  }
}

// ── Page France 2026 : saisie manuelle de note ───────────────
// Cousine de CompositionSimple avec des grilles dédiées. On coche les items,
// note /20 (normalisée quel que soit le nombre d'items) + compteur de cases.
export default function France2026() {
  const { theme, toggleTheme } = useTheme()
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

  // Note binaire normalisée /20 + compteur de cases cochées.
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
        titleFr="France 2026 — Saisie de note"
        titleEn="France 2026 — Score sheet"
        descriptionFr="Coche les critères de la grille et lis ta note sur 20."
        descriptionEn="Tick the grid criteria and read your score out of 20."
        path="/france2026"
      />

      {/* Sélecteur de discipline + bascule thème, sur une même ligne. */}
      <div className={styles.gridSelect}>
        <select
          className={styles.gridDropdown}
          value={gridKey}
          onChange={(e) => setGridKey(e.target.value)}
          aria-label="Discipline"
        >
          {GRID_OPTIONS.map(key => (
            <option key={key} value={key}>{GRIDS[key].label}</option>
          ))}
        </select>
        <button
          type="button"
          className={styles.themeBtn}
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>
      </div>

      {/* Barre de note sticky en haut : note /20 + compteur + reset */}
      <div className={styles.scoreBar}>
        <div className={styles.scoreValue}>
          <span className={styles.scoreTotal}>{score20}</span>
          <span className={styles.scoreMax}>/20</span>
          <span className={styles.scoreCount}>{total}/{max} cases cochées</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={reset} disabled={!total}>
          Effacer
        </button>
      </div>

      {/* Grille à cocher */}
      <div className={styles.sections}>
        {grid.sections.map(({ title, items }) => (
          <div key={title} className={styles.section}>
            <p className={styles.sectionTitle}>{title}</p>
            <div className={styles.items}>
              {items.map(({ key, label }) => {
                const on = !!gridChecked[key]
                return (
                  <button
                    key={key}
                    type="button"
                    className={`${styles.item} ${on ? styles.itemOn : ''}`}
                    aria-pressed={on}
                    onClick={() => toggle(key)}
                  >
                    <span className={styles.itemLabel}>{label}</span>
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
