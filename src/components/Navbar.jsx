import { useState, useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import LangSwitcher from './LangSwitcher'
import FigureCard from './FigureCard'
import { searchFigures } from '../lib/searchFigures'
import { useT } from '../i18n/useT'
import { useTheme } from '../contexts/theme-context'
import styles from './Navbar.module.css'
import Icon from './Icon'

// Nombre de résultats montrés dans le menu avant de renvoyer au catalogue.
const MENU_RESULTS_MAX = 8

export default function Navbar() {
  const tr = useT()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const [open, setOpen] = useState(false)
  // Où porter le focus à l'ouverture : le champ de recherche quand on entre
  // par la loupe, le bouton « Fermer » quand on entre par le burger — pour ne
  // pas déclencher le clavier mobile de quelqu'un qui veut juste naviguer.
  const [focusTarget, setFocusTarget] = useState('close')
  const [menuQuery, setMenuQuery] = useState('')
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const searchRef = useRef(null)
  const closeRef = useRef(null)
  const burgerRef = useRef(null)

  // Barre transparente en haut de page (la couverture démarre sous elle), puis
  // fond papier translucide dès qu'on défile.
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Le menu se referme à chaque changement de page. Ajusté pendant le rendu
  // plutôt que dans un effet : le panneau ne survit pas à la navigation, même
  // le temps d'une frame.
  const [seenPath, setSeenPath] = useState(location.pathname)
  if (seenPath !== location.pathname) {
    setSeenPath(location.pathname)
    if (open) setOpen(false)
  }

  // Menu ouvert : on bloque le défilement de la page et on écoute Échap.
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    // Filet de sécurité : le focus posé pendant le geste (openMenu) peut être
    // repris par le bouton cliqué selon l'ordre mousedown/click du navigateur.
    // On le repose à la frame suivante, une fois le panneau réellement peint.
    const raf = requestAnimationFrame(() => {
      const el = focusTarget === 'search' ? searchRef.current : closeRef.current
      if (el && document.activeElement !== el) el.focus()
    })
    return () => {
      cancelAnimationFrame(raf)
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, focusTarget])

  // Recherche vivante dans le menu, même moteur que la home et le catalogue.
  useEffect(() => {
    const q = menuQuery.trim()
    const timer = setTimeout(async () => {
      if (!q) { setResults(null); return }
      setSearching(true)
      const data = await searchFigures(q)
      setResults(data)
      setSearching(false)
    }, q ? 250 : 0)
    return () => clearTimeout(timer)
  }, [menuQuery])

  // À la fermeture, le focus revient sur le bouton qui a ouvert le menu.
  const closeMenu = () => {
    setOpen(false)
    burgerRef.current?.focus()
  }

  // `flushSync` applique l'ouverture avant la fin du gestionnaire de clic : le
  // focus reste dans la tâche du geste utilisateur, condition pour que iOS
  // ouvre le clavier. Un focus différé (effet, rAF) ne le déclencherait pas.
  const openMenu = (target = 'close') => {
    flushSync(() => {
      setFocusTarget(target)
      setOpen(true)
    })
    const el = target === 'search' ? searchRef.current : closeRef.current
    // La lecture d'une propriété de mise en page force le recalcul de style :
    // un élément encore `visibility: hidden` pour le moteur n'est pas focusable.
    void el?.offsetWidth
    el?.focus()
  }

  const submitSearch = e => {
    e.preventDefault()
    const q = menuQuery.trim()
    setOpen(false)
    navigate(q ? `/figures?q=${encodeURIComponent(q)}` : '/figures')
  }

  const links = [
    { to: '/',        label: tr.home       },
    { to: '/figures', label: tr.figures    },
    { to: '/quiz',    label: tr.quiz       },
    { to: '/compo',   label: tr.compo      },
    { to: '/judge',   label: tr.judge.nav  },
    { to: '/contact', label: tr.contact    },
  ]

  const searchingNow = menuQuery.trim().length > 0

  return (
    <>
      {/* Bandeau de tête : burger — titre — réglages et loupe. Aucun item de
          navigation n'occupe la page, tout vit dans le menu plein écran. */}
      <header className={`${styles.topbar} ${scrolled ? styles.scrolled : ''}`}>
        <button
          ref={burgerRef}
          className={styles.burger}
          onClick={() => openMenu('close')}
          aria-label={tr.menu}
          aria-expanded={open}
          aria-controls="wr-menu"
        >
          <span /><span />
        </button>

        <NavLink to="/" className={styles.logo}>
          <span className={styles.logoMark} aria-hidden="true" />
          WakeRef
        </NavLink>

        <div className={styles.tools}>
          <button
            className={styles.toolBtn}
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? tr.themeLight : tr.themeDark}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
          </button>
          <LangSwitcher />
          <button
            className={styles.toolBtn}
            onClick={() => openMenu('search')}
            aria-label={tr.searchPlaceholder}
          >
            <Icon name="search" size={18} />
          </button>
        </div>
      </header>

      {/* Menu plein écran : entre par la gauche, occupe tout le papier. */}
      <div
        id="wr-menu"
        className={`${styles.menu} ${open ? styles.menuOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={tr.menu}
        inert={!open ? '' : undefined}
      >
        <div className={styles.menuTop}>
          <span className={`wordmark ${styles.menuWordmark}`}>WakeRef</span>
          <button
            ref={closeRef}
            className={styles.menuClose}
            onClick={closeMenu}
            aria-label={tr.close}
          >
            <Icon name="x" size={22} />
          </button>
        </div>

        <form className={styles.menuSearch} onSubmit={submitSearch} role="search">
          <Icon name="search" size={19} />
          <input
            ref={searchRef}
            type="search"
            className={styles.menuSearchInput}
            placeholder={tr.searchPlaceholder}
            aria-label={tr.searchPlaceholder}
            value={menuQuery}
            onChange={e => setMenuQuery(e.target.value)}
            autoComplete="off"
          />
          {menuQuery && (
            <button
              type="button"
              className={styles.menuClear}
              onClick={() => { setMenuQuery(''); searchRef.current?.focus() }}
              aria-label={tr.clearSearch}
            >
              <Icon name="x" size={17} />
            </button>
          )}
        </form>

        {/* Dès qu'on tape, les rubriques cèdent la place aux résultats : sinon
            six titres pleine page les repousseraient sous la ligne de flottaison. */}
        {/* Un résultat déjà ouvert ne change pas d'URL : la fermeture par
            changement de route ne suffit pas, on ferme sur le clic du lien. */}
        {searchingNow ? (
          <div
            className={styles.menuResults}
            onClick={e => { if (e.target.closest('a')) setOpen(false) }}
          >
            {searching && <span className="spinner" />}
            {!searching && results?.length === 0 && (
              <p className={styles.menuEmpty}>{tr.noResults(menuQuery.trim())}</p>
            )}
            {!searching && results?.slice(0, MENU_RESULTS_MAX).map((f, i) => (
              <FigureCard key={f.id} figure={f} index={i} />
            ))}
            {!searching && results?.length > MENU_RESULTS_MAX && (
              <button type="button" className={styles.menuMore} onClick={submitSearch}>
                {tr.seeAllResults(results.length)}
                <Icon name="arrow-right" size={15} />
              </button>
            )}
          </div>
        ) : (
          <nav className={styles.menuNav}>
            {links.map((l, i) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) => `${styles.menuItem} ${isActive ? styles.menuItemActive : ''}`}
                style={{ '--i': i }}
              >
                {l.label}
                {location.pathname === l.to && (
                  <span className={styles.menuHere}>— {tr.youAreHere}</span>
                )}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </>
  )
}
