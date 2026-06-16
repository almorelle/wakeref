import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { searchFigures } from '../lib/searchFigures'
import FigureCard from '../components/FigureCard'
import { useT } from '../i18n/useT'
import { externalUrl } from '../lib/url'
import styles from './Home.module.css'
import SEO from '../components/SEO'
import Icon from '../components/Icon'

export default function Home() {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [mostViewed, setMostViewed] = useState([])
  const [videos, setVideos] = useState([])
  const [stats, setStats] = useState(null)
  const searchRef = useRef(null)
  const navigate = useNavigate()
  const tr = useT()

  // Sur mobile, la barre de recherche est placée bas dans le hero ; quand le
  // clavier s'ouvre il masque les résultats affichés en dessous. Au focus, on
  // remonte la barre juste sous la navbar pour libérer l'espace au-dessus du
  // clavier. Le délai laisse le clavier amorcer son ouverture (sinon iOS
  // recale la position après notre scroll).
  const handleSearchFocus = () => {
    if (window.innerWidth > 760) return
    setTimeout(() => {
      const el = searchRef.current
      if (!el) return
      const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 52
      const top = el.getBoundingClientRect().top + window.scrollY - navH - 8
      window.scrollTo({ top, behavior: 'smooth' })
    }, 300)
  }

  useEffect(() => {
    supabase.rpc('home_stats').then(({ data }) => {
      const row = data?.[0]
      if (!row) return
      const total = row.total_figures
      const pct = total > 0 ? Math.round((row.figures_with_video / total) * 100) : 0
      setStats({ total, pct })
    })

    // Figures les plus consultées (fenêtre glissante 30j) : la RPC renvoie
    // directement les colonnes de carte, déjà ordonnées — un seul aller-retour.
    supabase.rpc('most_viewed_figures').then(({ data }) => {
      if (data?.length) setMostViewed(data)
    }).catch(() => {})

    // Figures aux vidéos les plus récentes : idem, un seul aller-retour.
    supabase.rpc('recent_video_figures').then(({ data }) => {
      if (data?.length) setVideos(data)
    }).catch(() => {})
  }, [])

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
        <span className={`picto-mark ${styles.heroWatermark}`} aria-hidden="true" />
        <div className={styles.wake} aria-hidden="true">
          <svg viewBox="0 0 1200 160" preserveAspectRatio="none" fill="none">
            <path d="M0 100 Q150 60 300 100 T600 100 T900 100 T1200 100 T1500 100 T1800 100 T2100 100 T2400 100" stroke="var(--c-wake)" strokeWidth="1.5" opacity=".55" />
            <path d="M0 120 Q150 90 300 120 T600 120 T900 120 T1200 120 T1500 120 T1800 120 T2100 120 T2400 120" stroke="var(--c-wake)" strokeWidth="1" opacity=".3" />
            <path d="M0 80 Q150 50 300 80 T600 80 T900 80 T1200 80 T1500 80 T1800 80 T2100 80 T2400 80" stroke="#7c3aed" strokeWidth="1" opacity=".25" />
          </svg>
        </div>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <span className={styles.eyebrow}>{tr.heroEyebrow}</span>
            <h1 className={styles.title}>{tr.heroTitle}</h1>
            <p className={styles.sub}>{tr.appSubtitle}</p>
          </div>
          <div className={styles.searchWrap} ref={searchRef}>
            <Icon name="search" />
            <input
              className={styles.searchInput}
              type="text"
              placeholder={tr.searchPlaceholder}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={handleSearchFocus}
              autoComplete="off"
            />
            {query && (
              <button onClick={() => setQuery('')} className={styles.clearBtn} aria-label={tr.clearSearch}>
                <Icon name="x" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="page-container">
        {query.trim() && (
          <div className={styles.results}>
            {searching && <span className="spinner" />}
            {!searching && searchResults?.length === 0 && (
              <p className={styles.empty}>{tr.noResults(query)}</p>
            )}
            {!searching && searchResults?.map((f, i) => <FigureCard key={f.id} figure={f} index={i} />)}
          </div>
        )}

        {!query.trim() && (
          <>
            <div className={styles.tiles}>
              {[
                { to: '/figures', icon: 'list',       color: 'var(--c-accent)', title: tr.tileCatalogTitle, sub: tr.tileCatalogSub },
                { to: '/quiz',    icon: 'help',       color: 'var(--c-wake)',   title: tr.tileQuizTitle,    sub: tr.tileQuizSub },
                { to: '/compo',   icon: 'calculator', color: 'var(--c-ws)',     title: tr.tileCompoTitle,   sub: tr.tileCompoSub },
              ].map((f, i) => (
                <button
                  key={f.to}
                  className={styles.tile}
                  onClick={() => navigate(f.to)}
                  style={{ '--tile': f.color, '--i': i }}
                >
                  <span className={styles.tileGo}><Icon name="arrow-right" /></span>
                  <span className={styles.tileIcon}><Icon name={f.icon} /></span>
                  <span className={styles.tileName}>{f.title}</span>
                  <span className={styles.tileSub}>{f.sub}</span>
                </button>
              ))}
            </div>

            <div className={styles.cta}>
              {stats && (
                <div className={styles.ctaStats}>
                  <div className={styles.ctaStat}>
                    <span className={styles.ctaNum}>{stats.total}</span>
                    <span className={styles.ctaLabel}>{tr.ctaFiguresLabel}</span>
                  </div>
                  <div className={styles.ctaStat}>
                    <span className={styles.ctaNum}>{stats.pct}%</span>
                    <span className={styles.ctaLabel}>{tr.ctaVideosLabel}</span>
                  </div>
                </div>
              )}
              <div className={styles.ctaBody}>
                <h2 className={styles.ctaTitle}>{tr.ctaTitle}</h2>
                <p className={styles.ctaText}>{tr.ctaText}</p>
                <button className={`btn btn-submit ${styles.ctaBtn}`} onClick={() => navigate('/submit')}>
                  <Icon name="upload" /> {tr.ctaButton}
                </button>
              </div>
            </div>

            <a
              href={externalUrl('https://www.worldcabletricks.com/', { ref: true })}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.wctBanner}
            >
              <img src="/wct-logo.png" alt="World Cable Tricks" className={styles.wctLogo} />
              <div className={styles.wctBody}>
                <p className={styles.wctTitle}>{tr.wctTitle}</p>
                <p className={styles.wctText}>{tr.wctText}</p>
              </div>
              <span className={styles.wctBtn}>
                {tr.wctButton} <Icon name="arrow-right" />
              </span>
            </a>

            {mostViewed.length > 0 && (
              <>
                <p className="section-title" style={{ marginTop: '2rem' }}>{tr.mostViewedFigures}</p>
                <div className={styles.list}>
                  {mostViewed.map((f, i) => <FigureCard key={f.id} figure={f} index={i} />)}
                </div>
              </>
            )}

            {videos.length > 0 && (
              <>
                <p className="section-title" style={{ marginTop: '2rem' }}>{tr.recentVideos}</p>
                <div className={styles.list}>
                  {videos.map((f, i) => <FigureCard key={f.id} figure={f} index={i} />)}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
