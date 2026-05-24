import { useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import styles from './AdminLayout.module.css'
import Icon from '../../components/Icon'

export default function AdminLayout() {
  const { session, loading, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !session) navigate('/admin/login')
  }, [session, loading, navigate])

  if (loading) return <span className="spinner" style={{ marginTop: '3rem' }} />
  if (!session) return null

  const links = [
    { to: '/admin',         icon: 'layout-dashboard', label: 'Dashboard',  end: true },
    { to: '/admin/figures', icon: 'list',              label: 'Figures'             },
    { to: '/admin/videos',  icon: 'video',             label: 'Vidéos'              },
    { to: '/admin/takedowns',  icon: 'flag',           label: 'Retraits'            },
    { to: '/admin/no-videos',  icon: 'video-off',      label: 'Sans vidéo'          },
  ]

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <NavLink to="/" className={styles.logo}>
          <Icon name="wave-sine" />
          <span>WakeRef</span>
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
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
