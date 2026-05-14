import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import FigureCard from '../components/FigureCard'
import { useT } from '../i18n/useT'
import styles from './Home.module.css'

const CAT_ICONS = {
  grabs: 'ti-hand-grab', spins: 'ti-rotate-clockwise', inverts: 'ti-flip-vertical',
  slides: 'ti-layout-sidebar', surface: 'ti-waves', wakeskate: 'ti-skateboard',
}

export default function Home() {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [categories, setCategories] = useState([])
  const [recent, setRecent] = useState([])
  const navigate = useNavigate()
  const tr = useT()

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      if (data) setCategories(data)
    })
    supabase.from('figures_full').select('*').order('created_at', { ascending: false }).limit(5).then(({ data }) => {
      if (data) setRecent(data)
    })
  }, [])

  useEffect(() => {
    if (!query.trim()) { setSearchResults(null); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase.rpc('search_figures', { query: query.trim() })
      setSearchResults(data || [])
      setSearching(false)
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroText}>
          <h1 className={styles.title}>WakeRef</h1>
          <p className={styles.sub}>{tr.appSubtitle}</p>
        </div>
        <div className={styles.searchWrap}>
          <i className="ti ti-search" />
          <input
            className={styles.searchInput}
            type="text"
            placeholder={tr.searchPlaceholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
          />
          {query && (
            <button onClick={() => setQuery('')} className={styles.clearBtn}>
              <i className="ti ti-x" />
            </button>
          )}
        </div>
      </div>

      <div className="page-container">
        {query.trim() && (
          <div className={styles.results}>
            {searching && <span className="spinner" />}
            {!searching && searchResults?.length === 0 && (
              <p className={styles.empty}>{tr.noResults(query)}</p>
            )}
            {!searching && searchResults?.map(f => <FigureCard key={f.id} figure={f} />)}
          </div>
        )}

        {!query.trim() && (
          <>
            <p className="section-title">{tr.categories}</p>
            <div className={styles.catGrid}>
              {categories.map(c => (
                <button
                  key={c.id}
                  className={styles.catCard}
                  onClick={() => navigate(`/figures?cat=${c.slug}`)}
                  style={{ '--cat-color': c.color }}
                >
                  <i className={`ti ${CAT_ICONS[c.slug] || 'ti-star'}`} />
                  <span className={styles.catName}>{tr.catNames[c.slug] || c.name}</span>
                </button>
              ))}
            </div>

            {recent.length > 0 && (
              <>
                <p className="section-title" style={{ marginTop: '2rem' }}>{tr.recentFigures}</p>
                <div className={styles.list}>
                  {recent.map(f => <FigureCard key={f.id} figure={f} />)}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
