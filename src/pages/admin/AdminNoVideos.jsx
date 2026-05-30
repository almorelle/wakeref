import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { CategoryBadge, SportBadge } from '../../components/Badges'
import DifficultyDots from '../../components/DifficultyDots'
import styles from '../admin/AdminFigures.module.css'
import Icon from '../../components/Icon'

const FILTERS = [
  { key: 'none', label: 'Sans vidéo', rpc: 'figures_without_videos', description: 'sans vidéo associée' },
  { key: 'no_upload', label: 'Sans vidéo uploadée', rpc: 'figures_without_uploaded_videos', description: 'sans vidéo uploadée directement' },
]

export default function AdminNoVideos() {
  const [figures, setFigures] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('none')
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    const rpc = FILTERS.find(f => f.key === filter).rpc
    supabase.rpc(rpc).then(({ data }) => {
      setFigures(data || [])
      setLoading(false)
    })
  }, [filter])

  const activeFilter = FILTERS.find(f => f.key === filter)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>
            Figures sans vidéo
          </h1>
          {!loading && (
            <p style={{ fontSize: 13, color: 'var(--c-muted)', marginTop: 4 }}>
              {figures.length} figure{figures.length > 1 ? 's' : ''} {activeFilter.description}
            </p>
          )}
        </div>
      </div>

      <div className={styles.filters}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`${styles.chip}${filter === f.key ? ` ${styles.active}` : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <span className="spinner" style={{ marginTop: '3rem' }} />
      ) : figures.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--c-muted)' }}>
          <Icon name="confetti" style={{ fontSize: 36, display: 'block', marginBottom: 12 }} />
          <p>Toutes les figures ont au moins une vidéo 🎉</p>
        </div>
      ) : (
        <div className={styles.table}>
          {figures.map(f => (
            <div key={f.id} className={styles.row}>
              <div className={styles.rowBody}>
                <div className={styles.rowName}>{f.name}</div>
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
                  <Icon name="upload" /> Uploader une vidéo
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
