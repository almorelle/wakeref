import { NavLink } from 'react-router-dom'
import LangSwitcher from './LangSwitcher'
import { useT } from '../i18n/useT'
import { useTheme } from '../contexts/ThemeContext'
import styles from './Navbar.module.css'

export default function Navbar() {
  const tr = useT()
  const { theme, toggleTheme } = useTheme()

  const links = [
    { to: '/',        icon: 'ti-home',    label: tr.home    },
    { to: '/figures', icon: 'ti-list',    label: tr.figures },
    { to: '/quiz',    icon: 'ti-help',    label: tr.quiz    },
    { to: '/contact', icon: 'ti-mail',    label: tr.contact  },
  ]

  return (
    <>
      <header className={styles.topbar}>
        <NavLink to="/" className={styles.logo}>
          <i className="ti ti-wave-sine" />
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
        <button
          className={`btn-icon ${styles.themeBtn}`}
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          <i className={`ti ${theme === 'dark' ? 'ti-sun' : 'ti-moon'}`} />
        </button>
        <LangSwitcher />
      </header>

      <nav className={styles.bottombar}>
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) => `${styles.bottomlink} ${isActive ? styles.active : ''}`}
          >
            <i className={`ti ${l.icon}`} />
            <span>{l.label}</span>
          </NavLink>
        ))}
        <div className={styles.bottomLang}>
          <button
            className={`btn-icon ${styles.themeBtn}`}
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <i className={`ti ${theme === 'dark' ? 'ti-sun' : 'ti-moon'}`} />
          </button>
          <LangSwitcher />
        </div>
      </nav>
    </>
  )
}
