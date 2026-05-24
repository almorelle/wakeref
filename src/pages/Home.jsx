import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import FigureCard from '../components/FigureCard'
import { useT } from '../i18n/useT'
import { CATEGORIES } from '../data/categories'
import { CONTEXTS } from '../data/contexts'
import styles from './Home.module.css'
import SEO from '../components/SEO'
import Icon from '../components/Icon'

export default function Home() {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [recent, setRecent] = useState([])
  const [videos, setVideos] = useState([])
  const navigate = useNavigate()
  const tr = useT()

  useEffect(() => {
    supabase.from('figures_full').select('*').order('created_at', { ascending: false }).limit(5).then(({ data }) => {
      if (data) setRecent(data)
    })
    supabase.from('videos')
      .select('figure_id')
      .eq('takedown_requested', false)
      .order('uploaded_at', { ascending: false })
      .limit(5)
      .then(async ({ data: vids }) => {
        if (!vids?.length) return
        const ids = [...new Set(vids.map(v => v.figure_id))]
        const { data: figs } = await supabase
          .from('figures_full')
          .select('*')
          .in('id', ids)
        if (figs) setVideos(figs)
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
      <SEO
        titleFr="WakeRef"
        titleEn="WakeRef"
        descriptionFr="Référentiel complet des figures de wakeboard et wakeskate."
        descriptionEn="Complete wakeboard and wakeskate tricks reference."
        path="/"
      />
      <div className={styles.hero}>
        <div className={styles.heroText}>
          <h1 className="sr-only">WakeRef — Référentiel complet des figures de wakeboard et wakeskate</h1>
          <p className={styles.sub}>{tr.appSubtitle}</p>
        </div>
        <div className={styles.searchWrap}>
          <Icon name="search" />
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
              <Icon name="x" />
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
            <p className="section-title" style={{ marginTop: '1.5rem' }}>{tr.categories}</p>
            <div className={styles.catGrid}>
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  className={styles.catCard}
                  onClick={() => navigate(`/figures?cat=${c.slug}`)}
                  style={{ '--cat-color': c.color }}
                >
                  <Icon name={c.icon} style={{ color: c.color }} />
                  <span className={styles.catName}>{tr.catNames[c.slug] || c.name}</span>
                </button>
              ))}
              {CONTEXTS.map(ctx => (
                <button
                  key={ctx.slug}
                  className={styles.catCard}
                  onClick={() => navigate(`/figures?ctx=${ctx.slug}`)}
                  style={{ '--cat-color': ctx.color }}
                >
                  <Icon name={ctx.icon} style={{ color: ctx.color }} />
                  <span className={styles.catName}>{ctx.label}</span>
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

            {videos.length > 0 && (
              <>
                <p className="section-title" style={{ marginTop: '2rem' }}>{tr.recentVideos}</p>
                <div className={styles.list}>
                  {videos.map(f => <FigureCard key={f.id} figure={f} />)}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
