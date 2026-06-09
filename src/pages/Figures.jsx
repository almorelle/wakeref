import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { searchFigures } from '../lib/searchFigures'
import FigureCard from '../components/FigureCard'
import { useT } from '../i18n/useT'
import { CATEGORIES } from '../data/categories'
import styles from './Figures.module.css'
import SEO from '../components/SEO'
import Icon from '../components/Icon'

export default function Figures() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [figures, setFigures] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const activeFilter  = searchParams.get('cat')   || 'tous'
  const activeContext = searchParams.get('ctx')   || ''
  const activeSport   = searchParams.get('sport') || ''
  const tr = useT()

  useEffect(() => {
    setLoading(true)
    // Liste : on ne sélectionne que les colonnes affichées par FigureCard.
    // Évite que la vue figures_full calcule les sous-requêtes lourdes
    // (videos, prerequisites, switch_versions) pour chaque figure.
    let q = supabase
      .from('figures_full')
      .select('id,slug,name,sport,difficulty,category_slug,category_name,contexts')
    if (activeFilter !== 'tous') q = q.eq('category_slug', activeFilter)
    if (activeContext) q = q.contains('contexts', [activeContext])
    if (activeSport)  q = q.eq('sport', activeSport)
    q.then(({ data }) => {
      // Tri naturel : les chiffres sont comparés numériquement (180 < 360 < 1080),
      // les noms textuels restent alphabétiques.
      const sorted = (data || []).sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true })
      )
      setFigures(sorted)
      setLoading(false)
    })
  }, [activeFilter, activeContext, activeSport])

  const buildParams = () => {
    const base = {}
    if (activeFilter !== 'tous') base.cat = activeFilter
    if (activeContext) base.ctx = activeContext
    if (activeSport)  base.sport = activeSport
    return base
  }

  const setFilter = (slug) => {
    const p = buildParams()
    delete p.cat
    if (slug !== 'tous') p.cat = slug
    setSearchParams(p)
  }

  const setContext = (ctx) => {
    const p = buildParams()
    if (ctx) p.ctx = ctx
    else delete p.ctx
    setSearchParams(p)
  }

  useEffect(() => {
    if (!query.trim()) { setSearchResults(null); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      const data = await searchFigures(query.trim())
      setSearchResults(data)
      setSearching(false)
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  const setSport = (sport) => {
    const p = buildParams()
    if (sport) p.sport = sport
    else delete p.sport
    setSearchParams(p)
  }

  return (
    <div className={styles.page}>
      <SEO
        titleFr="Figures"
        titleEn="Tricks"
        descriptionFr="Liste complète des figures de wakeboard et wakeskate, par catégorie."
        descriptionEn="Complete list of wakeboard and wakeskate tricks, by category."
        path="/figures"
      />
      <div className={styles.searchBar}>
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
            <button onClick={() => setQuery('')} className={styles.clearBtn} aria-label={tr.clearSearch}>
              <Icon name="x" />
            </button>
          )}
        </div>
      </div>

      {/* Filtre catégories */}
      <div className={styles.filters}>
        <button
          className={`${styles.chip} ${activeFilter === 'tous' ? styles.active : ''}`}
          onClick={() => setFilter('tous')}
        >{tr.all}</button>
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            className={`${styles.chip} ${activeFilter === c.slug ? styles.active : ''}`}
            onClick={() => setFilter(c.slug)}
            style={activeFilter === c.slug ? { '--chip-color': c.color } : {}}
          >{tr.catNames[c.slug] || c.name}</button>
        ))}
      </div>

      {/* Filtre sport + contexte */}
      <div className={styles.filters} style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', borderBottom: 'none', borderTop: '1px solid var(--c-border)' }}>
        <button
          className={`${styles.chip} ${activeSport === '' ? styles.active : ''}`}
          onClick={() => setSport('')}
        >{tr.all}</button>
        <button
          className={`${styles.chip} ${activeSport === 'wakeboard' ? styles.active : ''}`}
          onClick={() => setSport('wakeboard')}
        >Wakeboard</button>
        <button
          className={`${styles.chip} ${activeSport === 'wakeskate' ? styles.active : ''}`}
          onClick={() => setSport('wakeskate')}
        >Wakeskate</button>

        <span style={{ width: 1, background: 'var(--c-border)', margin: '0 4px', alignSelf: 'stretch' }} />

        {[
          { value: '',          label: tr.all      },
          { value: 'kicker',    label: 'Kicker'    },
          { value: 'jib',       label: 'Jib'       },
          { value: 'flat',      label: 'Flat'       },
          { value: 'air_trick', label: 'Air Trick' },
        ].map(ctx => (
          <button
            key={ctx.value}
            className={`${styles.chip} ${activeContext === ctx.value ? styles.active : ''}`}
            onClick={() => setContext(ctx.value)}
          >{ctx.label}</button>
        ))}
      </div>

      <div className="page-container">
        {query.trim() ? (
          <>
            {searching && <span className="spinner" />}
            {!searching && searchResults?.length === 0 && (
              <p style={{ color: 'var(--c-muted)', fontSize: 14, paddingTop: '1rem' }}>{tr.noResults(query)}</p>
            )}
            <div className={styles.list}>
              {!searching && searchResults?.map((f, i) => <FigureCard key={f.id} figure={f} index={i} />)}
            </div>
          </>
        ) : (
          <>
            {loading && <span className="spinner" />}
            {!loading && figures.length === 0 && (
              <p style={{ color: 'var(--c-muted)', fontSize: 14, paddingTop: '1rem' }}>
                {tr.noFiguresInCat}
              </p>
            )}
            <div className={styles.list}>
              {figures.map((f, i) => <FigureCard key={f.id} figure={f} index={i} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
