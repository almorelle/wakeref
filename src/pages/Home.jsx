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

  // Sur mobile, la barre de recherche est placée bas dans la couverture ; quand
  // le clavier s'ouvre il masque les résultats affichés en dessous. Au focus, on
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

  const sections = [
    { to: '/figures', title: tr.tileCatalogTitle, sub: tr.tileCatalogSub },
    { to: '/quiz',    title: tr.tileQuizTitle,    sub: tr.tileQuizSub    },
    { to: '/compo',   title: tr.tileCompoTitle,   sub: tr.tileCompoSub   },
    { to: '/judge',   title: tr.tileJudgeTitle,   sub: tr.tileJudgeSub   },
  ]

  return (
    <div className={styles.page}>
      <SEO
        titleFr="WakeRef"
        titleEn="WakeRef"
        descriptionFr="Référentiel complet des figures de wakeboard et wakeskate."
        descriptionEn="Complete wakeboard and wakeskate tricks reference."
        path="/"
      />

      {/* Couverture : le titre du « numéro », la barre de recherche en action
          principale, et le picto casque en filigrane débordant. */}
      <header className={styles.cover}>
        <span className={`picto-mark ${styles.coverWatermark}`} aria-hidden="true" />
        <div className={styles.coverInner}>
          <p className={styles.kicker}>
            <span className="wordmark">WakeRef</span>
            <span aria-hidden="true"> — </span>
            {tr.heroEyebrow}
          </p>
          <h1 className={styles.title}>{tr.heroTitle}</h1>
          <p className={styles.standfirst}>{tr.appSubtitle}</p>

          <div className={styles.searchWrap} ref={searchRef}>
            <Icon name="search" size={19} />
            <input
              className={styles.searchInput}
              type="text"
              aria-label={tr.searchPlaceholder}
              placeholder={tr.searchPlaceholder}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={handleSearchFocus}
              autoComplete="off"
            />
            {query && (
              <button onClick={() => setQuery('')} className={styles.clearBtn} aria-label={tr.clearSearch}>
                <Icon name="x" size={17} />
              </button>
            )}
          </div>
          <p className={`hand ${styles.coverNote}`}>— {tr.coverNote}</p>
        </div>
      </header>

      <div className="page-container">
        {query.trim() && (
          <div className={styles.results}>
            {searching && <span className="spinner" />}
            {!searching && searchResults?.length === 0 && (
              <p className={styles.empty}>{tr.noResults(query)}</p>
            )}
            {!searching && searchResults?.length > 0 && (
              <div className={styles.list}>
                {searchResults.map((f, i) => <FigureCard key={f.id} figure={f} index={i} />)}
              </div>
            )}
          </div>
        )}

        {!query.trim() && (
          <>
            {/* Sommaire : les quatre modules en table des matières, chaque
                entrée numérotée et reliée à sa flèche par des points de suite. */}
            <nav className={styles.toc} aria-label={tr.summary}>
              <h2 className={`section-title ${styles.tocTitle}`}>{tr.summary}</h2>
              {sections.map((s, i) => (
                <button
                  key={s.to}
                  className={styles.tocItem}
                  onClick={() => navigate(s.to)}
                  style={{ '--i': i }}
                >
                  <span className={styles.tocHead}>
                    <span className={styles.tocNum}>{String(i + 1).padStart(2, '0')}</span>
                    <span className={styles.tocName}>{s.title}</span>
                    <span className={styles.tocLeader} aria-hidden="true" />
                    <Icon name="arrow-right" size={17} className={styles.tocGo} />
                  </span>
                  <span className={styles.tocSub}>{s.sub}</span>
                </button>
              ))}
            </nav>

            {/* Contenu de référence en premier : c'est ce que l'utilisateur
                vient consulter. Les CTA de contribution viennent après. */}
            {mostViewed.length > 0 && (
              <section className={styles.section}>
                <h2 className="section-title">{tr.mostViewedFigures}</h2>
                <div className={styles.list}>
                  {mostViewed.map((f, i) => <FigureCard key={f.id} figure={f} index={i} />)}
                </div>
              </section>
            )}

            {videos.length > 0 && (
              <section className={styles.section}>
                <h2 className="section-title">{tr.recentVideos}</h2>
                <div className={styles.list}>
                  {videos.map((f, i) => <FigureCard key={f.id} figure={f} index={i} />)}
                </div>
              </section>
            )}

            <section className={styles.cta}>
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
                  <Icon name="upload" size={16} /> {tr.ctaButton}
                </button>
              </div>
            </section>

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
                {tr.wctButton} <Icon name="arrow-right" size={15} />
              </span>
            </a>
          </>
        )}
      </div>
    </div>
  )
}
