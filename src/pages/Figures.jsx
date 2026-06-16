import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { searchFigures } from '../lib/searchFigures'
import FigureCard from '../components/FigureCard'
import FilterDropdown from '../components/FilterDropdown'
import { useT } from '../i18n/useT'
import { CATEGORIES } from '../data/categories'
import styles from './Figures.module.css'
import SEO from '../components/SEO'
import Icon from '../components/Icon'

export default function Figures() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [figures, setFigures] = useState([])
  const [loadedKey, setLoadedKey] = useState(null)
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const activeFilter  = searchParams.get('cat')   || 'tous'
  const activeContext = searchParams.get('ctx')   || ''
  const activeSport   = searchParams.get('sport') || ''
  const filterKey = `${activeFilter}|${activeContext}|${activeSport}`
  const tr = useT()

  useEffect(() => {
    // Liste : vue légère dédiée aux cartes — aucune des sous-requêtes lourdes
    // de figures_full (videos, prerequisites, switch_versions…) n'est calculée.
    let q = supabase
      .from('figures_card')
      .select('*')
    if (activeFilter !== 'tous') q = q.eq('category_slug', activeFilter)
    if (activeContext) q = q.contains('contexts', [activeContext])
    // Appartenance multi-discipline : une figure praticable en seated (sports
    // contient 'seated') apparaît sous le filtre Seated, même si sport ≠ seated.
    if (activeSport)  q = q.contains('sports', [activeSport])
    q.then(({ data }) => {
      // Tri naturel : les chiffres sont comparés numériquement (180 < 360 < 1080),
      // les noms textuels restent alphabétiques.
      const sorted = (data || []).sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true })
      )
      setFigures(sorted)
      setLoadedKey(`${activeFilter}|${activeContext}|${activeSport}`)
    })
  }, [activeFilter, activeContext, activeSport])

  // Loading while the fetched list doesn't match the current filters yet.
  const loading = loadedKey !== filterKey

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
    const q = query.trim()
    const timer = setTimeout(async () => {
      if (!q) { setSearchResults(null); return }
      setSearching(true)
      const data = await searchFigures(q)
      setSearchResults(data)
      setSearching(false)
    }, q ? 250 : 0)
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
        descriptionFr="Liste complète des figures de wakeboard, wakeskate et wakeboard assis, par catégorie."
        descriptionEn="Complete list of wakeboard, wakeskate and seated wakeboard tricks, by category."
        path="/figures"
      />
      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <Icon name="search" />
          <input
            className={styles.searchInput}
            type="text"
            aria-label={tr.searchPlaceholder}
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

        {/* Trois axes en menus déroulants mono-select */}
        <div className={styles.filterBtns}>
          <FilterDropdown
            axisLabel={tr.filterLabels.category}
            value={activeFilter}
            allValue="tous"
            columns={2}
            onChange={setFilter}
            accent={CATEGORIES.find(c => c.slug === activeFilter)?.color}
            options={[
              { value: 'tous', label: tr.all },
              ...CATEGORIES.map(c => ({ value: c.slug, label: tr.catNames[c.slug] || c.name, color: c.color })),
            ]}
          />
          <FilterDropdown
            axisLabel={tr.filterLabels.sport}
            value={activeSport}
            onChange={setSport}
            options={[
              { value: '',          label: tr.all },
              { value: 'wakeboard', label: 'Wakeboard' },
              { value: 'wakeskate', label: 'Wakeskate' },
              { value: 'seated',    label: tr.sportNames?.seated || 'Seated' },
            ]}
          />
          <FilterDropdown
            axisLabel={tr.filterLabels.obstacle}
            value={activeContext}
            onChange={setContext}
            align="right"
            options={[
              { value: '',          label: tr.all },
              { value: 'kicker',    label: tr.ctxNames?.kicker    || 'Kicker'    },
              { value: 'air_trick', label: tr.ctxNames?.air_trick || 'Air Trick' },
              { value: 'feature',   label: tr.ctxNames?.feature   || 'Feature'   },
              { value: 'flat',      label: tr.ctxNames?.flat      || 'Flat'      },
            ]}
          />
        </div>
      </div>

      <div className="page-container">
        {query.trim() ? (
          <>
            {searching && <span className="spinner" />}
            {!searching && searchResults?.length === 0 && (
              <p style={{ color: 'var(--c-muted)', fontSize: 14, paddingTop: '1rem' }}>{tr.noResults(query)}</p>
            )}
            {!searching && searchResults?.length > 0 && (
              <p className={styles.count} aria-live="polite">{tr.figureCount(searchResults.length)}</p>
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
            {!loading && figures.length > 0 && (
              <p className={styles.count} aria-live="polite">{tr.figureCount(figures.length)}</p>
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
