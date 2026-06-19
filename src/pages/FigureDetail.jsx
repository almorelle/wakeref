import { Fragment, useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { externalUrl } from '../lib/url'
import DifficultyDots from '../components/DifficultyDots'
import { SportBadge, CategoryBadge, ContextBadge } from '../components/Badges'
import { useT } from '../i18n/useT'
import { useLocalizedField } from '../contexts/language-context'
import SEO from '../components/SEO'
import styles from './FigureDetail.module.css'
import Icon from '../components/Icon'
import { decomposeTrick, rotationIcon } from '../lib/trickDecomposition'

// Carte Instagram : affiche le thumbnail `thumbnails/<shortcode>.jpg` du bucket
// s'il existe, sinon retombe sur la tuile dégradée brandée.
function InstagramCard({ v, label }) {
  const [errored, setErrored] = useState(false)
  const shortcode = v.source_url?.match(/instagram\.com\/(?:p|reels?|tv)\/([^/?#]+)/)?.[1]
  const thumbUrl = shortcode
    ? supabase.storage.from('videos').getPublicUrl(`thumbnails/${shortcode}.jpg`).data.publicUrl
    : null
  const showImg = thumbUrl && !errored

  const info = (
    <div className={styles.instaInfo}>
      {v.creator_name && <span className={styles.instaAuthor}>{v.creator_name}</span>}
      <span className={styles.instaCta}><Icon name="brand-instagram" /> {label}</span>
    </div>
  )

  return (
    <a href={externalUrl(v.source_url, { ref: true })} target="_blank" rel="noopener noreferrer" className={styles.instaCard}>
      {showImg ? (
        <>
          <img
            src={thumbUrl}
            alt={v.title || v.creator_name || ''}
            className={styles.instaImg}
            loading="lazy"
            onError={() => setErrored(true)}
          />
          <div className={styles.instaScrim}>
            <div className={styles.instaPlay}><Icon name="player-play" /></div>
            {info}
          </div>
        </>
      ) : (
        <div className={styles.instaFallback}>
          <div className={styles.instaPlay}><Icon name="player-play" /></div>
          {info}
        </div>
      )}
    </a>
  )
}

export default function FigureDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const tr = useT()
  const localize = useLocalizedField()

  const [figure, setFigure] = useState(null)
  const [loadedSlug, setLoadedSlug] = useState(null)
  const [takedownVideo, setTakedownVideo] = useState(null)
  const [takedownForm, setTakedownForm] = useState({ name: '', email: '', message: '' })
  const [takedownSent, setTakedownSent] = useState(false)
  const [copied, setCopied] = useState(false)
  // Discipline d'onglet tips préférée, mémorisée comme la langue (wakeref_lang).
  const [tipFacet, setTipFacet] = useState(() => localStorage.getItem('wakeref_facet') || '')

  // Arbre de progression : refs + fondu de bord pour gérer le débordement.
  const treeRef = useRef(null)
  const currentNodeRef = useRef(null)
  const [treeFade, setTreeFade] = useState({ left: false, right: false })
  const updateTreeFade = useCallback(() => {
    const el = treeRef.current
    if (!el) return
    const left = el.scrollLeft > 1
    const right = el.scrollLeft < el.scrollWidth - el.clientWidth - 1
    setTreeFade(prev => (prev.left === left && prev.right === right) ? prev : { left, right })
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data } = await supabase.from('figures_full').select('*').eq('slug', slug).single()
      if (!active) return
      setFigure(data)
      setLoadedSlug(slug)
    })()
    return () => { active = false }
  }, [slug])

  // Compteur de vues : une vue par figure / jour / navigateur (dédupe localStorage,
  // pas d'auth). Écriture via la RPC security definer ; erreurs avalées (best-effort).
  useEffect(() => {
    if (!figure?.id) return
    const key = `wakeref_viewed_${figure.id}_${new Date().toISOString().slice(0, 10)}`
    // Flag posé AVANT l'appel : dédupe le double-rendu StrictMode / les remontages
    // rapides. try/catch car localStorage throw en navigation privée.
    try {
      if (localStorage.getItem(key)) return
      localStorage.setItem(key, '1')
    } catch { /* storage indispo : on tracke au plus une fois par montage */ }
    // NB : le builder supabase est « thenable » mais n'expose pas .catch() ;
    // on passe le handler d'erreur en 2e argument de .then().
    supabase.rpc('track_figure_view', { fig_id: figure.id }).then(() => {}, () => {})
  }, [figure?.id])

  // Centre le nœud courant dans l'arbre au chargement : sinon, sur mobile,
  // l'arbre déborde ancré à gauche et le nœud courant + ses « étapes suivantes »
  // (enfants) restent hors-écran et invisibles.
  useEffect(() => {
    const tree = treeRef.current, cur = currentNodeRef.current
    if (!tree || !cur || tree.scrollWidth <= tree.clientWidth) { updateTreeFade(); return }
    const tr = tree.getBoundingClientRect(), cr = cur.getBoundingClientRect()
    const center = (cr.left - tr.left) + tree.scrollLeft + cr.width / 2
    tree.scrollLeft = center - tree.clientWidth / 2
    updateTreeFade()
  }, [figure, updateTreeFade])

  // Loading while the fetched figure doesn't match the current slug yet.
  const loading = loadedSlug !== slug

  const shareTrick = async () => {
    const url = window.location.href
    const text = figure.name
    if (navigator.share) {
      await navigator.share({ title: text, url })
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const submitTakedown = async (e) => {
    e.preventDefault()
    if (!takedownForm.email) return
    await supabase.from('takedown_requests').insert({ video_id: takedownVideo.id, ...takedownForm })
    setTakedownSent(true)
  }

  const getVideoUrl = (video) => {
    if (video.file_path) {
      const { data } = supabase.storage.from('videos').getPublicUrl(video.file_path)
      return data.publicUrl
    }
    return null
  }

  const renderVideoMedia = (v) => {
    const url = getVideoUrl(v)

    // Upload direct. Le fragment #t=0.1 + preload="metadata" force le navigateur
    // à peindre la première frame en guise de poster (sinon cadre gris/noir tant
    // que rien n'est chargé), sans avoir à générer de miniature.
    if (v.source_type === 'upload' && url) {
      return <video src={`${url}#t=0.1`} controls playsInline preload="metadata" className={styles.video} />
    }

    // Instagram
    if (v.source_type === 'instagram' && v.source_url) {
      return <InstagramCard v={v} label={tr.viewOnInstagram} />
    }

    // YouTube
    if (v.source_type === 'youtube' && v.source_url) {
      const videoId = v.source_url.match(/(?:v=|youtu\.be\/|shorts\/)([^&?\s]+)/)?.[1]
      const isShort = v.source_url.includes('/shorts/')
      if (videoId) {
        return (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}`}
            className={styles.video}
            allowFullScreen
            allow="autoplay; fullscreen"
            style={{
              border: 'none',
              width: '100%',
              aspectRatio: isShort ? '9/16' : '16/9',
              height: 'auto'
            }}
          />
        )
      }
    }

    // Fallback
    return <div className={styles.videoPlaceholder}><Icon name="player-play" /></div>
  }

  if (loading) return <span className="spinner" />
  if (!figure) return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <Icon name="arrow-left" /> {tr.back}
        </button>
      </div>
      <div className="page-container">
        <div className={styles.notFound}>
          <span className={styles.notFoundIcon}>🤷</span>
          <h2 className={styles.notFoundTitle}>{tr.notFound}</h2>
          <p className={styles.notFoundText}>{tr.notFoundSub}</p>
          <div className={styles.notFoundActions}>
            <button className="btn btn-primary" onClick={() => navigate('/figures')}>
              <Icon name="list" /> {tr.figures}
            </button>
            <button className="btn btn-ghost" onClick={() => navigate(-1)}>
              <Icon name="arrow-left" /> {tr.back}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const prereqs         = typeof figure.prerequisites === 'string' ? JSON.parse(figure.prerequisites) : figure.prerequisites || []
  const builtOn         = figure.built_on_figure ? (typeof figure.built_on_figure === 'string' ? JSON.parse(figure.built_on_figure) : figure.built_on_figure) : null
  const builtOnChildren = typeof figure.built_on_children === 'string' ? JSON.parse(figure.built_on_children) : figure.built_on_children || []
  const switchOf        = figure.switch_of_figure ? (typeof figure.switch_of_figure === 'string' ? JSON.parse(figure.switch_of_figure) : figure.switch_of_figure) : null
  const switchVersions  = typeof figure.switch_versions === 'string' ? JSON.parse(figure.switch_versions) : figure.switch_versions || []
  const videos          = typeof figure.videos === 'string'       ? JSON.parse(figure.videos)       : figure.videos  || []
  const baseFigure      = figure.base_figure ? (typeof figure.base_figure === 'string' ? JSON.parse(figure.base_figure) : figure.base_figure) : null

  const desc            = localize(figure, 'description')

  // Tips facettés par discipline. `tips` (localisé) = jeu par défaut de la
  // discipline native ; `tips_<d>` = override rempli seulement s'il diverge.
  // Un onglet par discipline de `sports` qui est native OU a un override non
  // vide ; onglets affichés uniquement s'il y a ≥2 jeux distincts à montrer.
  const defaultTips = localize(figure, 'tips') || []
  const figSports   = Array.isArray(figure.sports) && figure.sports.length
    ? figure.sports : (figure.sport ? [figure.sport] : [])
  // La native utilise TOUJOURS `tips` : on ignore un éventuel override résiduel
  // sur elle (donnée orpheline d'une bascule de discipline côté admin).
  const tipsOverride = (d) =>
    d === figure.sport  ? []
    : d === 'seated'    ? (localize(figure, 'tips_seated')    || [])
    : d === 'wakeskate' ? (localize(figure, 'tips_wakeskate') || [])
    : []
  const tipTabs = figSports
    .map(d => {
      const ov = tipsOverride(d)
      return { sport: d, tips: ov.length ? ov : defaultTips, hasOwn: ov.length > 0, isNative: d === figure.sport }
    })
    .filter(t => (t.isNative || t.hasOwn) && t.tips.length > 0)
  // Onglets dès qu'il y a ≥2 jeux, OU un unique jeu non-natif (à étiqueter pour
  // ne pas faire passer des conseils spécifiques pour les conseils par défaut).
  const showTipTabs    = tipTabs.length > 1 || (tipTabs.length === 1 && !tipTabs[0].isNative)
  const activeTipSport = tipTabs.some(t => t.sport === tipFacet)
    ? tipFacet
    : (tipTabs.some(t => t.sport === figure.sport) ? figure.sport : tipTabs[0]?.sport)
  const activeTips     = (tipTabs.find(t => t.sport === activeTipSport) || tipTabs[0])?.tips || defaultTips
  const tipsToShow     = showTipTabs ? activeTips : (tipTabs[0]?.tips || defaultTips)

  // Décomposition du trick en composantes élémentaires (base → inverts → rotations).
  const decomp     = decomposeTrick(figure)
  // Section masquée pour les tricks sans invert ni spin (rien à décomposer).
  const hasDecomp  = decomp.inverts > 0 || (figure.spin || 0) > 0
  const approachLabels = { ts: tr.approachTs, hs: tr.approachHs, regular: tr.approachRegular, fakie: tr.approachFakie }
  const approachLabel = decomp.approach.map(a => approachLabels[a] || a).join(' / ')
  const dirLabel   = (dir, long) =>
    dir === 'fs' ? (long ? tr.dirFsLong : tr.dirFsShort)
    : dir === 'bs' ? (long ? tr.dirBsLong : tr.dirBsShort)
    : ''
  const typeLabel  = type => (type === 'ole' ? tr.rotTypeOle : type === 'handle_pass' ? tr.rotTypeHandlePass : '')

  // Couleur d'identité selon l'approche : ambre (Heelside) / violet (Toeside)
  // côté standing, cyan (Regular) / rose (Fakie) côté seated.
  const approachSide  = decomp.approach[0]
  const approachClass = approachSide === 'hs' ? styles.decompHs
    : approachSide === 'ts' ? styles.decompTs
    : approachSide === 'regular' ? styles.decompRegular
    : approachSide === 'fakie' ? styles.decompFakie : ''

  const DecompChip = ({ icon, label, sub }) => (
    <div className={styles.decompChip}>
      {icon && <Icon name={icon} size={22} className={styles.decompIcon} />}
      <span className={styles.decompLabel}>{label}</span>
      {sub && <span className={styles.decompSub}>{sub}</span>}
    </div>
  )

  // Composantes affichées, dans l'ordre : base → inverts → rotations.
  // 1re boîte = trick de base + approche en sous-label. Quand il y a un invert,
  // le 1er est absorbé dans la boîte de base (qui prend alors l'icône d'invert).
  // La catégorie Spin n'affiche pas le trick de base.
  const decompChips = []
  const hasBase = decomp.approach.length > 0 && figure.category_slug !== 'spin'
  const baseAbsorbsInvert = hasBase && decomp.inverts > 0
  if (hasBase) {
    decompChips.push({
      key: 'base',
      icon: baseAbsorbsInvert ? 'rotate-360' : undefined,
      label: baseFigure?.name || figure.name,
      sub: approachLabel,
    })
  }
  for (let i = baseAbsorbsInvert ? 1 : 0; i < decomp.inverts; i++) {
    decompChips.push({ key: `inv-${i}`, icon: 'rotate-360', label: tr.decompInvert })
  }
  decomp.rotations.forEach((u, i) => {
    const label = `${u.degs}° ${dirLabel(u.dir, true)}`
    const sub = [u.rewind && tr.decompRewind, typeLabel(u.type)].filter(Boolean).join(' · ')
    decompChips.push({ key: `rot-${i}`, icon: rotationIcon(u.degs, u.cw), label, sub })
  })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <nav className={styles.breadcrumb}>
          <Link to="/" className={styles.breadcrumbLink} aria-label={tr.home}>
            <Icon name="home" />
          </Link>
          <Icon name="chevron-right" className={styles.breadcrumbSep} />
          <Link to="/figures" className={styles.breadcrumbLink}>
            {tr.figures}
          </Link>
          <Icon name="chevron-right" className={styles.breadcrumbSep} />
          <Link to={`/figures?cat=${figure.category_slug}`} className={styles.breadcrumbLink}>
            {tr.catNames[figure.category_slug] || figure.category_name}
          </Link>
          <Icon name="chevron-right" className={styles.breadcrumbSep} />
          <span className={styles.breadcrumbCurrent}>{figure.name}</span>
        </nav>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{figure.name}</h1>
          <button className={styles.shareBtn} onClick={shareTrick} title={tr.share}>
            <Icon name={copied ? 'check' : 'share-3'} />
            <span>{copied ? tr.copied : tr.share}</span>
          </button>
        </div>
        <div className={styles.meta}>
          <CategoryBadge slug={figure.category_slug} name={figure.category_name} />
          <SportBadge sport={figure.sport} />
          <DifficultyDots value={figure.difficulty} />
          {figure.contexts?.map(ctx => <ContextBadge key={ctx} context={ctx} />)}
        </div>
      </div>

      <SEO
        titleFr={figure.name}
        titleEn={figure.name}
        descriptionFr={figure.description?.substring(0, 160)}
        descriptionEn={figure.description_en?.substring(0, 160) || figure.description?.substring(0, 160)}
        path={'/figures/' + figure.slug}
      />
      <div className="page-container">
        {(builtOn || builtOnChildren.length > 0) && (
          <section className={styles.section}>
            <h2 className="section-title"><Icon name="binary-tree" /> {tr.progression}</h2>
            <div
              ref={treeRef}
              className={`${styles.tree} ${builtOn ? styles.treeHorizontal : styles.treeVertical}`}
              data-fade-left={treeFade.left || undefined}
              data-fade-right={treeFade.right || undefined}
              onScroll={updateTreeFade}
            >
              {builtOn && (
                <>
                  <Link to={'/figures/' + builtOn.slug} className={styles.treeNode}>
                    {builtOn.name}
                    {builtOn.switch_names && <span className={styles.hasSwitch}>+ {builtOn.switch_names}</span>}
                  </Link>
                  <div className={styles.treeConnector} aria-hidden="true" />
                </>
              )}
              <span ref={currentNodeRef} className={`${styles.treeNode} ${styles.treeNodeCurrent}`}>
                {figure.name}
                {switchVersions.length > 0 && <span className={styles.hasSwitch}>+ {switchVersions.map(s => s.name).join(', ')}</span>}
              </span>
              {builtOnChildren.length > 0 && (
                <>
                  <div className={styles.treeConnector} aria-hidden="true" />
                  <div className={styles.treeChildren}>
                    {builtOnChildren.map(n => (
                      <Link key={n.id} to={'/figures/' + n.slug} className={styles.treeNode}>
                        {n.name}
                        {n.switch_names && <span className={styles.hasSwitch}>+ {n.switch_names}</span>}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        <section className={styles.section}>
          <h2 className="section-title"><Icon name="file-description" /> {tr.description}</h2>
          <p className={styles.desc}>{desc}</p>
        </section>

        {hasDecomp && (
          <section className={styles.section}>
            <h2 className="section-title"><Icon name="binary-tree" /> {tr.decomposition}</h2>
            <div className={`${styles.decomp} ${approachClass}`}>
              {decompChips.map((c, i) => (
                <Fragment key={c.key}>
                  {i > 0 && <span className={styles.decompPlus} aria-hidden="true">+</span>}
                  <DecompChip icon={c.icon} label={c.label} sub={c.sub} />
                </Fragment>
              ))}
            </div>
          </section>
        )}

        {tipsToShow.length > 0 && (
          <section className={styles.section}>
            <h2 className="section-title"><Icon name="bulb" /> {tr.tips}</h2>
            {showTipTabs && (
              <div className={styles.tipTabs} role="group" aria-label={tr.tips}>
                {tipTabs.map(t => (
                  <button
                    key={t.sport}
                    type="button"
                    aria-pressed={t.sport === activeTipSport}
                    className={`${styles.tipTab} ${t.sport === activeTipSport ? styles.tipTabActive : ''}`}
                    onClick={() => { setTipFacet(t.sport); localStorage.setItem('wakeref_facet', t.sport) }}
                  >{tr.sportNames?.[t.sport] || t.sport}</button>
                ))}
              </div>
            )}
            <ul className={styles.tips}>
              {tipsToShow.map((tip, i) => <li key={i}>{tip}</li>)}
            </ul>
          </section>
        )}

        <section className={styles.section}>
          <h2 className="section-title"><Icon name="lock" /> {tr.prerequisites}</h2>
          {prereqs.length === 0
            ? <p className={styles.empty}>{tr.noPrereqs}</p>
            : (
              <div className={styles.prereqs}>
                {prereqs.map(p => (
                  <Link key={p.id} to={`/figures/${p.slug}`} className={styles.prereqChip}>{p.name}</Link>
                ))}
              </div>
            )
          }
        </section>

        {(switchOf || switchVersions.length > 0) && (
          <section className={styles.section}>
            <h2 className="section-title"><Icon name="arrows-exchange" /> {switchOf ? tr.switchOf : tr.switchVersions}</h2>
            <div className={styles.prereqs}>
              {switchOf && (
                <Link to={'/figures/' + switchOf.slug} className={styles.prereqChip}>
                  {switchOf.name}
                </Link>
              )}
              {switchVersions.map(s => (
                <Link key={s.id} to={'/figures/' + s.slug} className={styles.prereqChip}>
                  {s.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={`section-title ${styles.videosTitle}`}><Icon name="video" /> {tr.videos}</h2>
            <Link to={`/submit?figure=${figure.slug}`} className="btn btn-submit btn-sm">
              <Icon name="upload" /> {tr.submitCta}
            </Link>
          </div>
          {videos.length === 0
            ? <p className={styles.empty}>{tr.noVideos}</p>
            : (
              <div className={styles.videosGrid}>
                {videos.map(v => (
                  <div key={v.id} className={styles.videoCard}>
                    {renderVideoMedia(v)}
                    <div className={styles.videoMeta}>
                      {v.title && <p className={styles.videoTitle}>{v.title}</p>}
                      {v.creator_name && (
                        <a href={externalUrl(v.creator_url, { ref: true }) || '#'} target="_blank" rel="noopener noreferrer" className={styles.creator}>
                          <Icon name={v.source_type === 'instagram' ? 'brand-instagram' : v.source_type === 'youtube' ? 'brand-youtube' : 'video'} />
                          {v.creator_name}
                        </a>
                      )}
                      {v.source_type === 'upload' && v.source_url && (
                        <a href={externalUrl(v.source_url, { ref: true })} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
                          {tr.originalSource} <Icon name="external-link" />
                        </a>
                      )}
                      {v.caption && <p className={styles.caption}>{v.caption}</p>}
                      <div className={styles.creditNote}>
                        <Icon name="info-circle" />
                        {tr.pedagogicNote}{' '}
                        <button className={styles.takedownBtn} onClick={() => { setTakedownVideo(v); setTakedownSent(false) }}>
                          {tr.takedownCta}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </section>
      </div>

      {takedownVideo && (
        <div className={styles.modalOverlay} onClick={() => setTakedownVideo(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{tr.takedownTitle}</h2>
              <button onClick={() => setTakedownVideo(null)} className="btn-icon" aria-label={tr.close}><Icon name="x" /></button>
            </div>
            {takedownSent
              ? (
                <div className={styles.takedownSuccess}>
                  <Icon name="check" size={32} className={styles.takedownSuccessIcon} />
                  <p>{tr.takedownSuccessMsg}</p>
                  <button className="btn btn-ghost" onClick={() => setTakedownVideo(null)}>{tr.close}</button>
                </div>
              )
              : (
                <form onSubmit={submitTakedown} className={styles.takedownForm}>
                  <p className={styles.takedownInfo}>{tr.takedownInfo}</p>
                  <div className="field">
                    <label>{tr.takedownName}</label>
                    <input className="input" type="text" placeholder={tr.takedownNamePh}
                      value={takedownForm.name} onChange={e => setTakedownForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label>{tr.takedownEmail} *</label>
                    <input className="input" type="email" required placeholder="email@example.com"
                      value={takedownForm.email} onChange={e => setTakedownForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label>{tr.takedownMessage}</label>
                    <textarea className={`input ${styles.takedownTextarea}`} rows={3} placeholder={tr.takedownMsgPh}
                      value={takedownForm.message} onChange={e => setTakedownForm(f => ({ ...f, message: e.target.value }))} />
                  </div>
                  <div className={styles.modalActions}>
                    <button type="button" className="btn btn-ghost" onClick={() => setTakedownVideo(null)}>{tr.cancel}</button>
                    <button type="submit" className="btn btn-primary">{tr.takedownSend}</button>
                  </div>
                </form>
              )
            }
          </div>
        </div>
      )}
    </div>
  )
}
