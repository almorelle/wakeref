import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { CategoryBadge, SportBadge } from '../../components/Badges'
import DifficultyDots from '../../components/DifficultyDots'
import styles from '../admin/AdminFigures.module.css'

export default function AdminNoVideos() {
  const [figures, setFigures] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.rpc('figures_without_videos').then(({ data, error }) => {
      if (error) {
        // Fallback : requête manuelle
        supabase.from('figures_full').select('*').then(({ data: all }) => {
          if (!all) return
          const withoutVideos = all.filter(f => {
            const vids = typeof f.videos === 'string' ? JSON.parse(f.videos) : f.videos || []
            return vids.length === 0
          })
          setFigures(withoutVideos)
          setLoading(false)
        })
      } else {
        setFigures(data || [])
        setLoading(false)
      }
    })
  }, [])

  if (loading) return <span className="spinner" style={{ marginTop: '3rem' }} />

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>
            Figures sans vidéo
          </h1>
          <p style={{ fontSize: 13, color: 'var(--c-muted)', marginTop: 4 }}>
            {figures.length} figure{figures.length > 1 ? 's' : ''} sans vidéo associée
          </p>
        </div>
      </div>

      {figures.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--c-muted)' }}>
          <i className="ti ti-confetti" style={{ fontSize: 36, display: 'block', marginBottom: 12 }} />
          <p>Toutes les figures ont au moins une vidéo 🎉</p>
        </div>
      ) : (
        <div className={styles.list}>
          {figures.map(f => (
            <div key={f.id} className={styles.row}>
              <div className={styles.rowMain}>
                <span className={styles.rowName}>{f.name}</span>
                <div className={styles.rowMeta}>
                  <CategoryBadge slug={f.category_slug} name={f.category_name} />
                  <SportBadge sport={f.sport} />
                  <DifficultyDots value={f.difficulty} />
                </div>
              </div>
              <div className={styles.rowActions}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => navigate(`/admin/videos?figure=${f.id}`)}
                >
                  <i className="ti ti-video-plus" /> Ajouter une vidéo
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
