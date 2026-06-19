import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import styles from './AdminLayout.module.css'
import Icon from '../../components/Icon'

export default function AdminLayout() {
  const { session, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [prevPath, setPrevPath] = useState(location.pathname)
  const logo = <><span className={styles.logoMark} aria-hidden="true" />WakeRef</>

  useEffect(() => {
    if (!loading && !session) navigate('/admin/login')
  }, [session, loading, navigate])

  // Échap ferme le drawer mobile (le clic sur le backdrop le fait déjà).
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  // Close the mobile menu on navigation (adjust state during render rather than
  // in an effect, which avoids an extra render pass).
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname)
    setMenuOpen(false)
  }

  if (loading) return <span className="spinner" style={{ marginTop: '3rem' }} />
  if (!session) return null

  const links = [
    { to: '/admin',               icon: 'layout-dashboard', label: 'Dashboard',   end: true },
    { to: '/admin/figures',       icon: 'list',              label: 'Figures'               },
    { to: '/admin/videos',        icon: 'video',             label: 'Vidéos'                },
    { to: '/admin/takedowns',     icon: 'flag',              label: 'Retraits'              },
    { to: '/admin/submissions',   icon: 'inbox',             label: 'Soumissions'           },
    { to: '/admin/compositions',  icon: 'list',              label: 'Runs'                  },
    { to: '/admin/judge-runs',    icon: 'star',              label: 'Runs juge'             },
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
        <button className="btn-icon" onClick={() => setMenuOpen(o => !o)} aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={menuOpen}>
          <Icon name={menuOpen ? 'x' : 'menu-2'} />
        </button>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className={styles.backdrop} onClick={() => setMenuOpen(false)}>
          <aside className={styles.drawer} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Menu de navigation">
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
