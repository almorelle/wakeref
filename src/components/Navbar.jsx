import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import LangSwitcher from './LangSwitcher'
import { useT } from '../i18n/useT'
import { useTheme } from '../contexts/ThemeContext'
import styles from './Navbar.module.css'
import Icon from './Icon'

export default function Navbar() {
  const tr = useT()
  const { theme, toggleTheme } = useTheme()

  // Navbar transparente en haut de page (hero immersif), puis fond translucide
  // dès qu'on scrolle — évite la bande/le liseré au repos.
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const topClass = scrolled ? styles.scrolled : ''

  const links = [
    { to: '/',        icon: 'home',        label: tr.home    },
    { to: '/figures', icon: 'list',        label: tr.figures },
    { to: '/quiz',    icon: 'help',        label: tr.quiz    },
    { to: '/compo',   icon: 'calculator',  label: tr.compo   },
    { to: '/contact', icon: 'mail',        label: tr.contact },
  ]

  return (
    <>
      {/* Desktop topbar */}
      <header className={`${styles.topbar} ${topClass}`}>
        <NavLink to="/" className={styles.logo}>
          <span className={styles.logoMark} aria-hidden="true" />
          WakeRef
        </NavLink>
        <nav className={styles.topnav}>
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) => `${styles.toplink} ${isActive ? styles.active : ''}`}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <button className={`btn-icon ${styles.themeBtn}`} onClick={toggleTheme} aria-label="Toggle theme">
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>
        <LangSwitcher />
      </header>

      {/* Mobile topbar — logo + thème + langue */}
      <header className={`${styles.topbarMobile} ${topClass}`}>
        <NavLink to="/" className={styles.logo}>
          <span className={styles.logoMark} aria-hidden="true" />
          WakeRef
        </NavLink>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className={`btn-icon ${styles.themeBtn}`} onClick={toggleTheme} aria-label="Toggle theme">
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          <LangSwitcher />
        </div>
      </header>

      {/* Mobile bottombar — navigation uniquement */}
      <nav className={styles.bottombar}>
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) => `${styles.bottomlink} ${isActive ? styles.active : ''}`}
          >
            <Icon name={l.icon} />
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
