import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import FilterDropdown from '../../components/FilterDropdown'
import styles from './AdminFigures.module.css'
import Icon from '../../components/Icon'

const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// Mêmes axes que la page publique (catégorie via les catégories DB, sport, obstacle).
const SPORTS = [
  { value: '',          label: 'Tous'             },
  { value: 'wakeboard', label: 'Wakeboard'        },
  { value: 'wakeskate', label: 'Wakeskate'        },
  { value: 'seated',    label: 'Wakeboard assis'  },
]
const OBSTACLES = [
  { value: '',          label: 'Tous'      },
  { value: 'kicker',    label: 'Kicker'    },
  { value: 'air_trick', label: 'Air Trick' },
  { value: 'feature',   label: 'Module'    },
  { value: 'flat',      label: 'Flat'      },
]

export default function AdminFigures() {
  const [figures, setFigures] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('tous')
  const [sport, setSport] = useState('')
  const [ctx, setCtx] = useState('')
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

  useEffect(() => { void (async () => { await load() })() }, [])

  const deleteFigure = async (id, name) => {
    if (!confirm(`Supprimer "${name}" ? Cette action est irréversible.`)) return
    await supabase.from('figures').delete().eq('id', id)
    setFigures(prev => prev.filter(f => f.id !== id))
  }

  // Filtrage client-side : la liste complète est déjà chargée (212 lignes).
  // Appartenance multi-discipline : `sports` ⊇ {sport}, fallback sur [sport].
  const q = norm(query.trim())
  const filtered = figures.filter(f => {
    if (cat !== 'tous' && f.category_slug !== cat) return false
    if (sport && !(f.sports || [f.sport]).includes(sport)) return false
    if (ctx && !(f.contexts || []).includes(ctx)) return false
    if (q && !norm(f.name).includes(q)) return false
    return true
  })

  const catOptions = [
    { value: 'tous', label: 'Toutes' },
    ...categories.map(c => ({ value: c.slug, label: c.name, color: c.color })),
  ]

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Figures</h1>
          <p className={styles.sub} aria-live="polite">{filtered.length} figure{filtered.length > 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/figures/new')}>
          <Icon name="plus" /> Nouvelle figure
        </button>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <Icon name="search" />
          <input
            className={styles.searchInput}
            type="text"
            aria-label="Rechercher une figure"
            placeholder="Rechercher une figure…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
          />
          {query && (
            <button onClick={() => setQuery('')} className={styles.clearBtn} aria-label="Effacer la recherche">
              <Icon name="x" />
            </button>
          )}
        </div>

        <div className={styles.filterBtns}>
          <FilterDropdown
            axisLabel="Catégorie"
            value={cat}
            allValue="tous"
            columns={2}
            onChange={setCat}
            accent={categories.find(c => c.slug === cat)?.color}
            options={catOptions}
          />
          <FilterDropdown axisLabel="Sport"    value={sport} onChange={setSport} options={SPORTS} />
          <FilterDropdown axisLabel="Obstacle" value={ctx}   onChange={setCtx} align="right" options={OBSTACLES} />
        </div>
      </div>

      {loading && <span className="spinner" />}

      <div className={styles.table}>
        {filtered.map(f => (
          <div key={f.id} className={styles.row}>
            <div className={styles.rowName}>
              {f.name}
              {!f.published && <span className={styles.unpub}>Non publié</span>}
            </div>
            <div className={styles.rowActions}>
              <button className="btn btn-ghost btn-sm btn-icon" title="Vidéos" aria-label={`Vidéos de ${f.name}`} onClick={() => navigate(`/admin/videos?figure=${f.id}`)}>
                <Icon name="video" />
              </button>
              <button className="btn btn-ghost btn-sm btn-icon" title="Modifier" aria-label={`Modifier ${f.name}`} onClick={() => navigate(`/admin/figures/${f.id}/edit`, { state: { figureIds: filtered.map(x => x.id) } })}>
                <Icon name="pencil" />
              </button>
              <button className="btn btn-ghost btn-sm btn-icon" title="Supprimer" aria-label={`Supprimer ${f.name}`} style={{ color: 'var(--c-danger)' }} onClick={() => deleteFigure(f.id, f.name)}>
                <Icon name="trash" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
