import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { externalUrl } from '../../lib/url'
import { CategoryBadge, SportBadge } from '../../components/Badges'
import DifficultyDots from '../../components/DifficultyDots'
import styles from './AdminNoVideos.module.css'
import Icon from '../../components/Icon'

const PanelHead = ({ icon, title, desc, count, panelKey, open, toggle }) => (
  <button className={styles.panelHead} onClick={() => toggle(panelKey)} aria-expanded={!!open[panelKey]}>
    <Icon name={icon} />
    <span className={styles.panelTitle}>{title}</span>
    <span className={styles.panelDesc}>{desc}</span>
    <span className={styles.count}>{count}</span>
    <Icon name="chevron-right" className={`${styles.chevron} ${open[panelKey] ? styles.chevronOpen : ''}`} />
  </button>
)

const FigurePanel = ({ icon, title, desc, figures, panelKey, open, toggle, navigate }) => (
  <div className={styles.panel}>
    <PanelHead icon={icon} title={title} desc={desc} count={figures.length} panelKey={panelKey} open={open} toggle={toggle} />
    {open[panelKey] && (
      figures.length === 0 ? (
        <div className={styles.empty}><Icon name="confetti" />Rien à compléter 🎉</div>
      ) : (
        <div className={styles.list}>
          {figures.map(f => (
            <div key={f.id} className={styles.item}>
              <button className={styles.itemMain} onClick={() => navigate(`/admin/videos?figure=${f.id}`)}>
                <span className={styles.itemName}>{f.name}</span>
                <span className={styles.itemMeta}>
                  <CategoryBadge slug={f.category_slug} name={f.category_name} />
                  <SportBadge sport={f.sport} />
                  <DifficultyDots value={f.difficulty} />
                </span>
              </button>
              <Link
                to={`/figures/${f.slug}`}
                target="_blank"
                rel="noopener"
                className={styles.itemLink}
                title="Voir la page du trick"
                aria-label={`Voir la page du trick ${f.name}`}
              >
                <Icon name="external-link" />
              </Link>
            </div>
          ))}
        </div>
      )
    )}
  </div>
)

export default function AdminNoVideos() {
  const [noVideo, setNoVideo] = useState([])
  const [noUpload, setNoUpload] = useState([])
  const [noThumb, setNoThumb] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(null)
  const [searchParams] = useSearchParams()
  const [open, setOpen] = useState(() => {
    const section = searchParams.get('open')
    return section ? { [section]: true } : {}
  })
  const navigate = useNavigate()

  const toggle = (key) => setOpen(o => ({ ...o, [key]: !o[key] }))

  const copyLink = async (v) => {
    try {
      await navigator.clipboard.writeText(externalUrl(v.source_url))
      setCopiedId(v.id)
      setTimeout(() => setCopiedId(c => (c === v.id ? null : c)), 1500)
    } catch { /* clipboard unavailable */ }
  }

  useEffect(() => {
    Promise.all([
      supabase.rpc('figures_without_videos'),
      supabase.rpc('figures_without_uploaded_videos'),
      supabase.from('videos').select('*, figures(name)').eq('source_type', 'instagram'),
      supabase.storage.from('videos').list('thumbnails', { limit: 1000 }),
    ]).then(([nv, nu, insta, thumbs]) => {
      setNoVideo(nv.data || [])
      setNoUpload(nu.data || [])
      const thumbSet = new Set((thumbs.data || []).map(o => o.name))
      setNoThumb(
        (insta.data || [])
          .map(v => ({ ...v, shortcode: v.source_url?.match(/instagram\.com\/(?:p|reels?|tv)\/([^/?#]+)/)?.[1] }))
          .filter(v => !v.shortcode || !thumbSet.has(`${v.shortcode}.jpg`))
      )
      setLoading(false)
    })
  }, [])

  if (loading) return <span className="spinner" style={{ marginTop: '3rem' }} />

  const noVideoIds = new Set(noVideo.map(f => f.id))
  const onlyExternal = noUpload.filter(f => !noVideoIds.has(f.id))

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>À compléter</h1>

      <FigurePanel
        icon="video-off"
        title="Figures sans vidéo"
        desc="aucune vidéo associée"
        figures={noVideo}
        panelKey="noVideo"
        open={open}
        toggle={toggle}
        navigate={navigate}
      />

      <FigurePanel
        icon="upload"
        title="Figures sans vidéo uploadée"
        desc="aucune vidéo uploadée directement"
        figures={noUpload}
        panelKey="noUpload"
        open={open}
        toggle={toggle}
        navigate={navigate}
      />

      <FigurePanel
        icon="cloud-upload"
        title="Figures avec vidéo mais sans upload"
        desc="vidéo associée mais aucun upload direct"
        figures={onlyExternal}
        panelKey="onlyExternal"
        open={open}
        toggle={toggle}
        navigate={navigate}
      />

      <div className={styles.panel}>
        <PanelHead
          icon="brand-instagram"
          title="Liens Instagram sans miniature"
          desc="miniature non uploadée"
          count={noThumb.length}
          panelKey="noThumb"
          open={open}
          toggle={toggle}
        />
        {open.noThumb && (
          noThumb.length === 0 ? (
            <div className={styles.empty}><Icon name="confetti" />Toutes les miniatures sont là 🎉</div>
          ) : (
            <div className={styles.list}>
              {noThumb.map(v => (
                <button
                  key={v.id}
                  className={styles.item}
                  onClick={() => copyLink(v)}
                  aria-label={copiedId === v.id ? 'Lien copié' : 'Copier le lien Instagram'}
                >
                  <span className={styles.itemName}>{v.figures?.name || `Figure #${v.figure_id}`}</span>
                  <span className={styles.itemMeta}>
                    {v.creator_name && <span className={styles.mono}>{v.creator_name}</span>}
                    <span className={styles.mono}>{v.shortcode || 'lien invalide'}</span>
                    <Icon name={copiedId === v.id ? 'check' : 'copy'} />
                  </span>
                </button>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
