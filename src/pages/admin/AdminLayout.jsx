import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../contexts/ThemeContext'
import styles from './AdminLayout.module.css'
import Icon from '../../components/Icon'

export default function AdminLayout() {
  const { session, loading, signOut } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const logo = <img src={theme === 'dark' ? '/logo-line-white.png' : '/logo-line-black.png'} alt="WakeRef" height={28} />

  useEffect(() => {
    if (!loading && !session) navigate('/admin/login')
  }, [session, loading, navigate])

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  if (loading) return <span className="spinner" style={{ marginTop: '3rem' }} />
  if (!session) return null

  const links = [
    { to: '/admin',               icon: 'layout-dashboard', label: 'Dashboard',   end: true },
    { to: '/admin/figures',       icon: 'list',              label: 'Figures'               },
    { to: '/admin/videos',        icon: 'video',             label: 'Vidéos'                },
    { to: '/admin/takedowns',     icon: 'flag',              label: 'Retraits'              },
    { to: '/admin/submissions',   icon: 'inbox',             label: 'Soumissions'           },
    { to: '/admin/compositions',  icon: 'list',              label: 'Runs'                  },
    { to: '/admin/no-videos',     icon: 'video-off',         label: 'À compléter'           },
  ]

  const sidebarContent = (
    <>
      <NavLink to="/" className={styles.logo}>
        {logo}
      </NavLink>
      <span className={styles.adminLabel}>Admin</span>
      <nav className={styles.nav}>
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
          >
            <Icon name={l.icon} />
            {l.label}
          </NavLink>
        ))}
      </nav>
      <button className={styles.signout} onClick={() => { signOut(); navigate('/') }}>
        <Icon name="logout" /> Déconnexion
      </button>
    </>
  )

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>{sidebarContent}</aside>

      {/* Mobile topbar */}
      <header className={styles.mobileTopbar}>
        <NavLink to="/" className={styles.logo}>
          {logo}
        </NavLink>
        <button className="btn-icon" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          <Icon name={menuOpen ? 'x' : 'menu-2'} />
        </button>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className={styles.backdrop} onClick={() => setMenuOpen(false)}>
          <aside className={styles.drawer} onClick={e => e.stopPropagation()}>
            {sidebarContent}
          </aside>
        </div>
      )}

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
