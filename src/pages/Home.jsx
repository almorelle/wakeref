import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { searchFigures } from '../lib/searchFigures'
import FigureCard from '../components/FigureCard'
import { useT } from '../i18n/useT'
import { externalUrl } from '../lib/url'
import { HERO_CLIP_IDS, MODULE_IMAGE_DIR } from '../data/heroClips'
import useScrollDrive from '../hooks/useScrollDrive'
import styles from './Home.module.css'
import SEO from '../components/SEO'
import Icon from '../components/Icon'

// Garde-fou de rotation : si un clip n'émet jamais `ended` (métadonnées non
// chargées, fichier illisible), on passe au suivant au bout de ce délai. Ce
// n'est pas la durée d'affichage — chaque clip joue sa longueur propre.
const CLIP_MAX_MS = 20000

// Enchaînement des clips de couverture. Ces trois durées sont solidaires du CSS
// (`.heroVid` / `.heroVidOn`) : le clip entrant se révèle en FADE_IN_MS, le
// sortant reste opaque HOLD_MS sous lui, et la bascule est déclenchée LEAD_MS
// avant la fin du clip pour que le fondu se joue sur deux images ANIMÉES.
// LEAD_MS dépasse HOLD_MS d'environ 250 ms : c'est la latence maximale de
// `timeupdate`, sans quoi la fin du fondu retomberait sur une image figée.
const FADE_IN_MS = 900
const HOLD_MS = 1000
const LEAD_MS = 1250

// Vignettes affichées par rangée, et taille du vivier demandé aux RPC pour
// pouvoir compléter après filtrage sur « a un clip jouable ».
const ROW_MAX = 10
const ROW_POOL = 30

const storageUrl = path => supabase.storage.from('videos').getPublicUrl(path).data.publicUrl

// Vignette d'une figure : le clip tourne en muet au survol (desktop) ou dès
// que la carte est franchement à l'écran (tactile). Le poster n'est demandé que
// lorsque la carte approche : sans ça, une rangée déclenche dix téléchargements.
function PreviewCard({ figure, clip }) {
  const ref = useRef(null)
  const vidRef = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !clip) return
    const tactile = window.matchMedia('(hover: none)').matches
    const io = new IntersectionObserver(([e]) => {
      const v = vidRef.current
      if (!v) return
      if (e.isIntersecting) {
        if (v.preload === 'none') { v.preload = 'metadata'; v.load() }
        if (tactile) { v.preload = 'auto'; v.play().catch(() => {}) }
      } else if (tactile && !v.paused) {
        v.pause()
      }
    }, { rootMargin: '300px', threshold: tactile ? 0.6 : 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [clip])

  const hoverPlay = () => {
    const v = vidRef.current
    if (!v) return
    v.preload = 'auto'
    v.play().catch(() => {})
  }
  const hoverStop = () => {
    const v = vidRef.current
    if (!v) return
    v.pause()
    try { v.currentTime = 0.1 } catch { /* pas encore seekable */ }
  }

  return (
    <Link
      to={`/figures/${figure.slug}`}
      className={styles.card}
      ref={ref}
      onMouseEnter={hoverPlay}
      onMouseLeave={hoverStop}
    >
      <span className={styles.cardMedia}>
        {clip ? (
          <video
            ref={vidRef}
            src={`${clip.url}#t=0.1`}
            muted loop playsInline preload="none"
            aria-hidden="true"
          />
        ) : (
          <span className={styles.cardNoClip}>{'\u2014'}</span>
        )}
      </span>
      <span className={styles.cardName}>{figure.name}</span>
      <span className={styles.cardSub}>
        {[figure.category_name, clip?.creator].filter(Boolean).join(' · ')}
      </span>
    </Link>
  )
}

export default function Home() {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [mostViewed, setMostViewed] = useState([])
  const [videos, setVideos] = useState([])
  const [stats, setStats] = useState(null)
  const [hero, setHero] = useState([])
  const [heroIdx, setHeroIdx] = useState(0)
  // clip d'illustration par figure, pour les vignettes des deux rangées
  const [clips, setClips] = useState({})
  const heroRefs = useRef([])
  const searchRef = useRef(null)
  const modulesRef = useRef(null)
  const navigate = useNavigate()
  const tr = useT()

  // Les blocs de rubrique s'animent au défilement. Sur Chrome et Safari c'est
  // du CSS pur (`animation-timeline: view()`, cf. Home.module.css) ; ce hook ne
  // fait quelque chose que sur les moteurs qui ne l'ont pas encore, Firefox
  // aujourd'hui. La `<nav>` n'est montée qu'en dehors d'une recherche.
  useScrollDrive(modulesRef, !query.trim())

  // Sur mobile, la barre de recherche est basse dans la couverture ; quand le
  // clavier s'ouvre il masque les résultats affichés en dessous. Au focus, on
  // remonte la barre juste sous la navbar pour libérer l'espace au-dessus du
  // clavier. Le délai laisse le clavier amorcer son ouverture (sinon iOS
  // recale la position après notre scroll).
  // Amène la barre juste sous la navbar, pour que les résultats soient dans le
  // champ de vision. La couverture fait un écran entier : sans ça, ils
  // s'affichent sous la ligne de flottaison et paraissent absents.
  const pinSearch = useCallback((delay = 0) => {
    setTimeout(() => {
      const el = searchRef.current
      if (!el) return
      const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 52
      const top = el.getBoundingClientRect().top + window.scrollY - navH - 8
      if (Math.abs(window.scrollY - top) < 8) return
      // Repositionnement instantané, pas `smooth` : la couverture en 100svh
      // et les vidéos qui tournent font annuler l'animation de défilement par
      // le navigateur — vérifié, on restait bloqué à quelques pixels du haut.
      window.scrollTo({ top, behavior: 'auto' })
    }, delay)
  }, [])

  // Sur mobile, on remonte dès le focus : le clavier va occuper le bas de
  // l'écran, et le délai lui laisse le temps de s'ouvrir (sinon iOS recale la
  // position après notre défilement). Sur desktop, remonter au simple clic
  // serait brutal — on attend la première frappe.
  const handleSearchFocus = () => {
    if (window.innerWidth > 760) return
    pinSearch(300)
  }

  useEffect(() => {
    supabase.rpc('home_stats').then(({ data }) => {
      const row = data?.[0]
      if (!row) return
      const total = row.total_figures
      const pct = total > 0 ? Math.round((row.figures_with_video / total) * 100) : 0
      setStats({ total, pct })
    })

    // Les deux rangées. On demande aux RPC bien plus de figures que les ROW_MAX
    // affichées : les vignettes ont besoin d'un fichier uploadé, or une figure
    // peut n'avoir que des vidéos YouTube ou Instagram. On filtre ensuite sur
    // celles qui ont un clip jouable et on complète avec les suivantes, dans
    // l'ordre rendu par la RPC.
    ;(async () => {
      const [mv, rv] = await Promise.all([
        supabase.rpc('most_viewed_figures', { days: 30, lim: ROW_POOL }),
        supabase.rpc('recent_video_figures', { lim: ROW_POOL }),
      ])
      const most = mv.data || []
      const recent = rv.data || []

      const ids = [...new Set([...most, ...recent].map(f => f.id))]
      if (!ids.length) return
      const { data: vids } = await supabase
        .from('videos')
        .select('figure_id, file_path, creator_name, sort_order')
        .in('figure_id', ids)
        .not('file_path', 'is', null)
        .eq('takedown_requested', false)
        .order('sort_order')
      const map = {}
      for (const v of vids || []) {
        if (!map[v.figure_id]) map[v.figure_id] = { url: storageUrl(v.file_path), creator: v.creator_name }
      }
      setClips(map)
      const jouables = list => list.filter(f => map[f.id]).slice(0, ROW_MAX)
      setMostViewed(jouables(most))
      setVideos(jouables(recent))
    })()

    // Couverture : une requête groupée sur les ids de `heroClips`. Elle rapporte
    // le chemin du fichier ET de quoi légender (auteur·ice + figure liée), ce
    // qu'un dossier Storage ne permettrait pas.
    ;(async () => {
      const { data: vids } = await supabase
        .from('videos')
        .select('id, figure_id, file_path, creator_name, creator_url')
        .in('id', HERO_CLIP_IDS)
        .eq('takedown_requested', false)
      if (!vids?.length) return
      const { data: figs } = await supabase
        .from('figures_card')
        .select('id, name, slug')
        .in('id', [...new Set(vids.map(v => v.figure_id))])
      const byFig = new Map((figs || []).map(f => [f.id, f]))
      // On restitue l'ordre déclaré dans heroClips, que le `in()` ne garantit pas.
      const ordered = HERO_CLIP_IDS
        .map(id => vids.find(v => v.id === id))
        .filter(v => v && v.file_path)
        .map(v => ({
          id: v.id,
          url: storageUrl(v.file_path),
          creator: v.creator_name,
          creatorUrl: v.creator_url,
          figure: byFig.get(v.figure_id) || null,
        }))
      setHero(ordered)
    })()
  }, [])

  // Rotation de la couverture : chaque clip est joué en entier, on passe au
  // suivant sur `ended`. D'où l'absence de `loop` dès qu'il y en a plusieurs —
  // un clip bouclé ne déclencherait jamais l'événement.
  const nextClip = useCallback(() => {
    setHeroIdx(i => (hero.length ? (i + 1) % hero.length : 0))
  }, [hero.length])

  // Le clip courant repart de zéro et joue. Le sortant, lui, N'EST PAS mis en
  // pause tout de suite : il continue de tourner sous le fondu, sans quoi on
  // verrait son image figée pendant toute la transition — c'était le défaut.
  // Il n'est arrêté qu'une fois hors de vue, pour libérer le décodage.
  useEffect(() => {
    if (!hero.length) return
    const actif = heroRefs.current[heroIdx]
    if (actif) {
      try { actif.currentTime = 0 } catch { /* pas encore seekable */ }
      actif.play().catch(() => {})
    }
    const t = setTimeout(() => {
      heroRefs.current.forEach((el, i) => {
        if (el && i !== heroIdx && !el.paused) el.pause()
      })
    }, HOLD_MS + 150)
    return () => clearTimeout(t)
  }, [heroIdx, hero.length])

  // Bascule anticipée. On n'attend pas `ended` : à ce moment-là le clip est
  // déjà arrêté sur sa dernière image, et le fondu se jouerait sur un arrêt sur
  // image. On surveille donc la position de lecture. `timeupdate` plutôt qu'un
  // minuteur calculé sur la durée : il suit la lecture réelle et ne dérive pas
  // si le clip se met à bufferiser.
  useEffect(() => {
    if (hero.length < 2) return
    const el = heroRefs.current[heroIdx]
    if (!el) return
    let bascule = false
    const surveille = () => {
      if (bascule) return
      const { duration, currentTime } = el
      if (!Number.isFinite(duration) || duration <= 0) return
      // Clip trop court pour une anticipation d'une seconde : on la réduit
      // plutôt que de basculer dès les premières images.
      const avance = Math.min(LEAD_MS / 1000, duration / 3)
      if (duration - currentTime <= avance) {
        bascule = true
        nextClip()
      }
    }
    el.addEventListener('timeupdate', surveille)
    return () => el.removeEventListener('timeupdate', surveille)
  }, [heroIdx, hero.length, nextClip])

  // Filet de sécurité : un clip dont les métadonnées ne chargent pas n'émettrait
  // jamais `ended` et figerait la rotation. Le minuteur est suspendu quand
  // l'onglet passe en arrière-plan — le navigateur y met déjà les vidéos en
  // pause, la rotation défilerait donc dans le vide.
  useEffect(() => {
    if (hero.length < 2) return
    let t
    const arm = () => {
      clearTimeout(t)
      if (!document.hidden) t = setTimeout(nextClip, CLIP_MAX_MS)
    }
    // Au retour au premier plan, on relance le clip courant : le navigateur
    // l'a mis en pause, il ne repartirait pas seul.
    const onVisible = () => {
      arm()
      if (!document.hidden) heroRefs.current[heroIdx]?.play().catch(() => {})
    }
    arm()
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearTimeout(t); document.removeEventListener('visibilitychange', onVisible) }
  }, [heroIdx, hero.length, nextClip])

  const hasQuery = query.trim().length > 0
  useEffect(() => {
    if (hasQuery && window.innerWidth > 760) pinSearch()
  }, [hasQuery, pinSearch])

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


  const modules = [
    { to: '/figures', img: 'Catalogue', title: tr.tileCatalogTitle, sub: tr.tileCatalogSub },
    { to: '/quiz',    img: 'Quiz',      title: tr.tileQuizTitle,    sub: tr.tileQuizSub    },
    { to: '/compo',   img: 'Compo',     title: tr.tileCompoTitle,   sub: tr.tileCompoSub   },
    { to: '/judge',   img: 'Juge',      title: tr.tileJudgeTitle,   sub: tr.tileJudgeSub   },
  ]

  const current = hero[heroIdx]

  return (
    <div className={styles.page}>
      <SEO
        titleFr="WakeRef"
        titleEn="WakeRef"
        descriptionFr="Référentiel complet des figures de wakeboard et wakeskate."
        descriptionEn="Complete wakeboard and wakeskate tricks reference."
        path="/"
      />

      {/* ── Couverture plein écran ── */}
      <header className={styles.hero}>
        {hero.map((c, i) => (
          <video
            key={c.id}
            ref={el => { heroRefs.current[i] = el }}
            className={`${styles.heroVid} ${i === heroIdx ? styles.heroVidOn : ''}`}
            src={c.url}
            muted playsInline
            /* `autoPlay` en plus de l'appel à play() dans l'effet : selon l'état
               de l'onglet, la lecture programmatique peut être refusée alors que
               la lecture déclarative passe. Les deux se complètent. */
            autoPlay={i === heroIdx}
            loop={hero.length < 2}
            /* Filet seulement : la bascule normale a lieu avant la fin. La
               garde sur `heroIdx` empêche le clip SORTANT — qui finit sa
               lecture sous le fondu — de faire avancer une seconde fois. */
            onEnded={hero.length > 1 && i === heroIdx ? nextClip : undefined}
            /* seuls le clip courant et le suivant sont chargés */
            preload={i === heroIdx || i === (heroIdx + 1) % hero.length ? 'auto' : 'none'}
            aria-hidden="true"
          />
        ))}
        <div className={styles.grade} aria-hidden="true" />

        <div className={styles.heroInner}>
          {/* Le wordmark a été retiré d'ici : la navbar l'affiche déjà, centré,
              à 200 px au-dessus. Il ne restait que la répétition — et la mesure
              a montré que c'était en plus la seule moitié lisible, la partie
              informative sortant du voile d'encre latéral. */}
          <p className={styles.kicker}>{tr.heroEyebrow}</p>
          <h1 className={styles.title}>{tr.heroTitle}</h1>

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

          {/* Légende du clip en cours : le trick, et qui l'a filmé. Elle vit
              dans le bloc de copie et non en bas d'écran — plus bas, elle
              tomberait dans le fondu vers le papier et deviendrait illisible. */}
          {current?.figure && (
            <p className={styles.credit} key={current.id}>
              <Link
                to={`/figures/${current.figure.slug}`}
                className={`${styles.tape} ${styles.creditTrick}`}
              >
                {current.figure.name}
              </Link>
              {current.creator && (
                <>
                  {current.creatorUrl ? (
                    <a
                      href={externalUrl(current.creatorUrl, { ref: true })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.tape} ${styles.creditBy}`}
                    >{current.creator}</a>
                  ) : (
                    <span className={`${styles.tape} ${styles.creditBy}`}>{current.creator}</span>
                  )}
                </>
              )}
            </p>
          )}
        </div>


        <div className={styles.down} aria-hidden="true">
          <span>Scroll</span><i />
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
            {/* ── Les quatre modules, en blocs empilés qui alternent ── */}
            <nav ref={modulesRef} className={styles.modules} aria-label={tr.summary}>
              {modules.map((m, i) => (
                <button key={m.to} className={styles.mod} onClick={() => navigate(m.to)}>
                  <span className={styles.modImg}>
                    <img
                      src={storageUrl(`${MODULE_IMAGE_DIR}/${m.img}.jpg`)}
                      alt=""
                      loading="lazy"
                    />
                  </span>
                  <span className={styles.modBody}>
                    <span className={styles.modNum}>{String(i + 1).padStart(2, '0')}</span>
                    <span className={styles.modTitle}>{m.title}</span>
                    <span className={styles.modText}>{m.sub}</span>
                    <span className={styles.modGo}>{tr.open} <Icon name="arrow-right" size={15} /></span>
                  </span>
                </button>
              ))}
            </nav>

            {mostViewed.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h2 className={styles.sectionTitle}>{tr.mostViewedFigures}</h2>
                  <Link to="/figures" className={styles.seeAll}>{tr.seeAll} <Icon name="arrow-right" size={14} /></Link>
                </div>
                <div className={styles.rail}>
                  {mostViewed.map(f => <PreviewCard key={f.id} figure={f} clip={clips[f.id]} />)}
                </div>
              </section>
            )}

            {videos.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h2 className={styles.sectionTitle}>{tr.recentVideos}</h2>
                  <Link to="/figures" className={styles.seeAll}>{tr.seeAll} <Icon name="arrow-right" size={14} /></Link>
                </div>
                <div className={styles.rail}>
                  {videos.map(f => <PreviewCard key={f.id} figure={f} clip={clips[f.id]} />)}
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
