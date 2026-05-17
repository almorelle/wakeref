import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import FigureCard from '../components/FigureCard'
import { useT } from '../i18n/useT'
import styles from './Figures.module.css'
import SEO from '../components/SEO'

export default function Figures() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [figures, setFigures] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const activeFilter = searchParams.get('cat') || 'tous'
  const activeContext = searchParams.get('ctx') || ''
  const tr = useT()

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      if (data) setCategories(data)
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    let q = supabase.from('figures_full').select('*').order('name')
    if (activeFilter !== 'tous') q = q.eq('category_slug', activeFilter)
    if (activeContext) q = q.contains('contexts', [activeContext])
    q.then(({ data }) => { setFigures(data || []); setLoading(false) })
  }, [activeFilter, activeContext])

  const setContext = (ctx) => {
    const params = {}
    if (activeFilter !== 'tous') params.cat = activeFilter
    if (ctx) params.ctx = ctx
    setSearchParams(params)
  }

  const setFilter = (slug) => {
    const params = {}
    if (slug !== 'tous') params.cat = slug
    if (activeContext) params.ctx = activeContext
    setSearchParams(params)
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
      <div className={styles.filters}>
        <button
          className={`${styles.chip} ${activeFilter === 'tous' ? styles.active : ''}`}
          onClick={() => setFilter('tous')}
        >{tr.all}</button>
        {categories.map(c => (
          <button
            key={c.id}
            className={`${styles.chip} ${activeFilter === c.slug ? styles.active : ''}`}
            onClick={() => setFilter(c.slug)}
            style={activeFilter === c.slug ? { '--chip-color': c.color } : {}}
          >{tr.catNames[c.slug] || c.name}</button>
        ))}
      </div>
      <div className={styles.filters} style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', borderBottom: 'none', borderTop: '1px solid var(--c-border)' }}>
        {[
          { value: '',          label: tr.all       },
          { value: 'kicker',    label: 'Kicker'     },
          { value: 'jib',       label: 'Jib'        },
          { value: 'flat',      label: 'Flat'       },
          { value: 'air_trick', label: 'Air Trick'  },
        ].map(ctx => (
          <button
            key={ctx.value}
            className={`${styles.chip} ${activeContext === ctx.value ? styles.active : ''}`}
            onClick={() => setContext(ctx.value)}
          >{ctx.label}</button>
        ))}
      </div>
      <div className="page-container">
        {loading && <span className="spinner" />}
        {!loading && figures.length === 0 && (
          <p style={{ color: 'var(--c-muted)', fontSize: 14, paddingTop: '1rem' }}>
            {tr.noFiguresInCat}
          </p>
        )}
        <div className={styles.list}>
          {figures.map(f => <FigureCard key={f.id} figure={f} />)}
        </div>
      </div>
    </div>
  )
}
