import { NavLink } from 'react-router-dom'
import LangSwitcher from './LangSwitcher'
import { useT } from '../i18n/useT'
import styles from './Navbar.module.css'

export default function Navbar() {
  const tr = useT()

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
          <LangSwitcher />
        </div>
      </nav>
    </>
  )
}
