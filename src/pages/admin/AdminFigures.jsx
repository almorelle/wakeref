import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import styles from './AdminFigures.module.css'
import { ContextBadge } from '../../components/Badges'
import Icon from '../../components/Icon'

export default function AdminFigures() {
  const [figures, setFigures] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('tous')
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    const [{ data: cats }, { data: figs }] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('figures_full').select('*').order('name'),
    ])
    setCategories(cats || [])
    setFigures(figs || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const deleteFigure = async (id, name) => {
    if (!confirm(`Supprimer "${name}" ? Cette action est irréversible.`)) return
    await supabase.from('figures').delete().eq('id', id)
    setFigures(prev => prev.filter(f => f.id !== id))
  }

  const filtered = filter === 'tous' ? figures : figures.filter(f => f.category_slug === filter)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Figures</h1>
          <p className={styles.sub}>{figures.length} figures au total</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/figures/new')}>
          <Icon name="plus" /> Nouvelle figure
        </button>
      </div>

      {/* Filtres */}
      <div className={styles.filters}>
        <button className={`${styles.chip} ${filter === 'tous' ? styles.active : ''}`} onClick={() => setFilter('tous')}>Tous</button>
        {categories.map(c => (
          <button
            key={c.id}
            className={`${styles.chip} ${filter === c.slug ? styles.active : ''}`}
            onClick={() => setFilter(c.slug)}
          >{c.name}</button>
        ))}
      </div>

      {loading && <span className="spinner" />}

      <div className={styles.table}>
        {filtered.map(f => (
          <div key={f.id} className={styles.row}>
            <div className={styles.rowBody}>
              <div className={styles.rowName}>{f.name}</div>
              <div className={styles.rowMeta}>
                <span className={`badge badge-${f.category_slug}`}>{f.category_name}</span>
                <span className={`badge badge-${f.sport === 'wakeskate' ? 'ws' : 'wake'}`}>{f.sport}</span>
                {f.contexts?.map(ctx => <ContextBadge key={ctx} context={ctx} />)}
                <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>Difficulté {f.difficulty}/5</span>
                {!f.published && <span className="badge" style={{ background: '#ef444420', color: 'var(--c-danger)' }}>Non publié</span>}
              </div>
            </div>
            <div className={styles.rowActions}>
              <button className="btn btn-ghost btn-sm btn-icon" title="Vidéos" onClick={() => navigate(`/admin/videos?figure=${f.id}`)}>
                <Icon name="video" />
              </button>
              <button className="btn btn-ghost btn-sm btn-icon" title="Modifier" onClick={() => navigate(`/admin/figures/${f.id}/edit`, {state: { figureIds: filtered.map(f => f.id) }})}>
                <Icon name="pencil" />
              </button>
              <button className="btn btn-ghost btn-sm btn-icon" title="Supprimer" style={{ color: 'var(--c-danger)' }} onClick={() => deleteFigure(f.id, f.name)}>
                <Icon name="trash" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
