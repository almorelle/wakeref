import { NavLink } from 'react-router-dom'
import LangSwitcher from './LangSwitcher'
import { useT } from '../i18n/useT'
import { useTheme } from '../contexts/ThemeContext'
import styles from './Navbar.module.css'
import Icon from './Icon'

export default function Navbar() {
  const tr = useT()
  const { theme, toggleTheme } = useTheme()

  const links = [
    { to: '/',        icon: 'home',    label: tr.home    },
    { to: '/figures', icon: 'list',    label: tr.figures },
    { to: '/quiz',    icon: 'help',    label: tr.quiz    },
    { to: '/compo', icon: 'calculator', label: tr.compo },
    { to: '/contact', icon: 'mail',    label: tr.contact  },
  ]

  return (
    <>
      <header className={styles.topbar}>
        <NavLink to="/" className={styles.logo}>
          <img src={theme === 'dark' ? '/logo-line-white.png' : '/logo-line-black.png'} alt="WakeRef" height={36} />
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
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>
        <LangSwitcher />
      </header>

      {/* Top bar mobile — logo uniquement */}
      <header className={styles.topbarMobile}>
        <NavLink to="/" className={styles.logo}>
          <img
            src={theme === 'dark' ? '/logo-line-white.png' : '/logo-line-black.png'}
            alt="WakeRef"
            height={36}
          />
        </NavLink>
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
            <Icon name={l.icon} />
            <span>{l.label}</span>
          </NavLink>
        ))}
        <div className={styles.bottomLang}>
          <button
            className={`btn-icon ${styles.themeBtn}`}
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          <LangSwitcher />
        </div>
      </nav>
    </>
  )
}
