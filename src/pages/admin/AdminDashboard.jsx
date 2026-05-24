import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import styles from './AdminDashboard.module.css'
import Icon from '../../components/Icon'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ figures: 0, videos: 0, takedowns: 0 })

  useEffect(() => {
    Promise.all([
      supabase.from('figures').select('id', { count: 'exact', head: true }),
      supabase.from('videos').select('id', { count: 'exact', head: true }),
      supabase.from('takedown_requests').select('id', { count: 'exact', head: true }).eq('handled', false),
    ]).then(([f, v, t]) => {
      setStats({ figures: f.count || 0, videos: v.count || 0, takedowns: t.count || 0 })
    })
  }, [])

  const tiles = [
    { label: 'Figures', value: stats.figures, icon: 'list', action: () => navigate('/admin/figures'), color: 'var(--c-accent)' },
    { label: 'Vidéos', value: stats.videos, icon: 'video', action: () => navigate('/admin/videos'), color: 'var(--c-wake)' },
    { label: 'Retraits en attente', value: stats.takedowns, icon: 'flag', action: () => navigate('/admin/takedowns'), color: stats.takedowns > 0 ? 'var(--c-danger)' : 'var(--c-success)' },
  ]

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Dashboard</h1>
      <div className={styles.grid}>
        {tiles.map(t => (
          <button key={t.label} className={styles.tile} onClick={t.action} style={{ '--tile-color': t.color }}>
            <Icon name={t.icon} />
            <span className={styles.tileValue}>{t.value}</span>
            <span className={styles.tileLabel}>{t.label}</span>
          </button>
        ))}
      </div>
      <div className={styles.shortcuts}>
        <p className="section-title">Actions rapides</p>
        <button className="btn btn-primary" onClick={() => navigate('/admin/figures/new')}>
          <Icon name="plus" /> Nouvelle figure
        </button>
        <button className="btn btn-ghost" onClick={() => navigate('/admin/videos')}>
          <Icon name="upload" /> Uploader une vidéo
        </button>
        <button className="btn btn-ghost" onClick={() => navigate('/')} target="_blank">
          <Icon name="external-link" /> Voir le site
        </button>
      </div>
    </div>
  )
}
