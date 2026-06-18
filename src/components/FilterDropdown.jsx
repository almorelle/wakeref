import { useRef, useState, useEffect, useCallback } from 'react'
import Icon from './Icon'
import styles from './FilterDropdown.module.css'

// Filtre mono-select présenté en menu déroulant. Le bouton affiche le nom de
// l'axe au repos, la valeur choisie quand un filtre est actif. Accessible :
// aria-expanded, role="listbox"/"option", fermeture Échap + clic-extérieur,
// navigation flèches haut/bas. `columns={2}` étale les options sur deux
// colonnes (utile quand l'axe a beaucoup de valeurs).
export default function FilterDropdown({ axisLabel, value, allValue = '', options, onChange, align = 'left', accent, columns = 1 }) {
  const [open, setOpen] = useState(false)
  const [fade, setFade] = useState({ top: false, bottom: false })
  const rootRef = useRef(null)
  const btnRef = useRef(null)
  const menuRef = useRef(null)
  const listRef = useRef(null)

  const active = value !== allValue
  const current = options.find(o => o.value === value)
  const triggerLabel = active && current ? current.label : axisLabel

  // Fondu haut/bas quand la liste déborde de sa hauteur max → signale qu'on
  // peut scroller pour découvrir le reste des options.
  const updateFade = useCallback(() => {
    const el = listRef.current
    if (!el) return
    const top = el.scrollTop > 1
    const bottom = el.scrollTop < el.scrollHeight - el.clientHeight - 1
    setFade(prev => (prev.top === top && prev.bottom === bottom) ? prev : { top, bottom })
  }, [])

  useEffect(() => {
    if (!open) return
    const onDoc = e => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false) }
    const onKey = e => { if (e.key === 'Escape') { setOpen(false); btnRef.current?.focus() } }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    // focus l'option sélectionnée à l'ouverture, puis recalcule le fondu
    const sel = menuRef.current?.querySelector('[aria-selected="true"]') || menuRef.current?.querySelector('[role="option"]')
    sel?.focus()
    updateFade()
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open, updateFade])

  const select = v => { onChange(v); setOpen(false); btnRef.current?.focus() }

  const onMenuKey = e => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const items = [...menuRef.current.querySelectorAll('[role="option"]')]
    const i = items.indexOf(document.activeElement)
    const next = e.key === 'ArrowDown' ? i + 1 : i - 1
    items[(next + items.length) % items.length]?.focus()
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        ref={btnRef}
        type="button"
        className={`${styles.trigger} ${active ? styles.active : ''}`}
        style={active && accent ? { '--accent': accent } : undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        {active && <span className={styles.dot} />}
        <span className={styles.triggerLabel}>{triggerLabel}</span>
        <Icon name="chevron-right" className={styles.chevron} size={16} />
      </button>

      {open && (
        <div
          ref={menuRef}
          className={`${styles.menu} ${align === 'right' ? styles.alignRight : ''} ${columns === 2 ? styles.menuWide : ''}`}
          role="listbox"
          aria-label={axisLabel}
          onKeyDown={onMenuKey}
        >
          {/* Le déclencheur affiche déjà le nom de l'axe au repos : on ne
              répète le titre que lorsqu'un filtre est actif (le bouton montre
              alors la valeur choisie, le titre apporte le contexte de l'axe). */}
          {active && <p className={styles.menuTitle}>{axisLabel}</p>}
          <div
            ref={listRef}
            className={`${styles.optionList} ${columns === 2 ? styles.cols2 : ''}`}
            data-fade-top={fade.top || undefined}
            data-fade-bottom={fade.bottom || undefined}
            onScroll={updateFade}
          >
            {options.map(o => {
              const sel = o.value === value
              return (
                <button
                  key={o.value || 'all'}
                  type="button"
                  role="option"
                  aria-selected={sel}
                  className={`${styles.option} ${sel ? styles.optionSel : ''} ${o.value === allValue ? styles.optionAll : ''}`}
                  onClick={() => select(o.value)}
                >
                  {o.color && <span className={styles.swatch} style={{ background: o.color }} />}
                  <span className={styles.optionLabel}>{o.label}</span>
                  {sel && <Icon name="check" className={styles.checkIcon} size={16} />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
