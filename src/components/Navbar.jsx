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
    { to: '/',        icon: 'home',        label: tr.home    },
    { to: '/figures', icon: 'list',        label: tr.figures },
    { to: '/quiz',    icon: 'help',        label: tr.quiz    },
    { to: '/compo',   icon: 'calculator',  label: tr.compo   },
    { to: '/submit',  icon: 'upload',      label: tr.submit  },
    { to: '/contact', icon: 'mail',        label: tr.contact },
  ]

  return (
    <>
      {/* Desktop topbar */}
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
        <button className={`btn-icon ${styles.themeBtn}`} onClick={toggleTheme} aria-label="Toggle theme">
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>
        <LangSwitcher />
      </header>

      {/* Mobile topbar — logo + thème + langue */}
      <header className={styles.topbarMobile}>
        <NavLink to="/" className={styles.logo}>
          <img
            src={theme === 'dark' ? '/logo-line-white.png' : '/logo-line-black.png'}
            alt="WakeRef"
            height={36}
          />
        </NavLink>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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
