import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { externalUrl } from '../lib/url'
import DifficultyDots from '../components/DifficultyDots'
import { SportBadge, CategoryBadge, ContextBadge } from '../components/Badges'
import { useT } from '../i18n/useT'
import { useLocalizedField } from '../contexts/LanguageContext'
import SEO from '../components/SEO'
import styles from './FigureDetail.module.css'
import Icon from '../components/Icon'

export default function FigureDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const tr = useT()
  const localize = useLocalizedField()

  const [figure, setFigure] = useState(null)
  const [loading, setLoading] = useState(true)
  const [takedownVideo, setTakedownVideo] = useState(null)
  const [takedownForm, setTakedownForm] = useState({ name: '', email: '', message: '' })
  const [takedownSent, setTakedownSent] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setLoading(true)
    supabase.from('figures_full').select('*').eq('slug', slug).single().then(({ data }) => {
      setFigure(data)
      setLoading(false)
    })
  }, [slug])

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

    // Upload direct
    if (v.source_type === 'upload' && url) {
      return <video src={url} controls playsInline className={styles.video} />
    }

    // Instagram
    if (v.source_type === 'instagram' && v.source_url) {
      return (
        <a href={externalUrl(v.source_url, { ref: true })} target="_blank" rel="noopener" className={styles.platformThumb}>
          <Icon name="brand-instagram" style={{ color: '#E1306C' }} />
          <span>Voir sur Instagram</span>
        </a>
      )
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

  if (loading) return <span className="spinner" style={{ marginTop: '3rem' }} />
  if (!figure) return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <Icon name="arrow-left" /> {tr.back}
        </button>
      </div>
      <div className="page-container">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '4rem 0', textAlign: 'center' }}>
          <span style={{ fontSize: 48 }}>🤷</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800 }}>{tr.notFound}</h2>
          <p style={{ fontSize: 14, color: 'var(--c-muted)' }}>{tr.notFoundSub}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
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
  const switchOf        = figure.switch_of_figure ? (typeof figure.switch_of_figure === 'string' ? JSON.parse(figure.switch_of_figure) : figure.switch_of_figure) : null
  const switchVersions  = typeof figure.switch_versions === 'string' ? JSON.parse(figure.switch_versions) : figure.switch_versions || []
  const videos          = typeof figure.videos === 'string'       ? JSON.parse(figure.videos)       : figure.videos  || []

  const desc            = localize(figure, 'description')
  const tips            = localize(figure, 'tips') || []

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <nav className={styles.breadcrumb}>
          <button onClick={() => navigate('/')} className={styles.breadcrumbLink}>
            <Icon name="home" />
          </button>
          <Icon name="chevron-right" className={styles.breadcrumbSep} />
          <button onClick={() => navigate('/figures')} className={styles.breadcrumbLink}>
            {tr.figures}
          </button>
          <Icon name="chevron-right" className={styles.breadcrumbSep} />
          <button onClick={() => navigate(`/figures?cat=${figure.category_slug}`)} className={styles.breadcrumbLink}>
            {tr.catNames[figure.category_slug] || figure.category_name}
          </button>
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
        <section className={styles.section}>
          <p className="section-title"><Icon name="file-description" /> {tr.description}</p>
          <p className={styles.desc}>{desc}</p>
        </section>

        {tips.length > 0 && (
          <section className={styles.section}>
            <p className="section-title"><Icon name="bulb" /> {tr.tips}</p>
            <ul className={styles.tips}>
              {tips.map((tip, i) => <li key={i}>{tip}</li>)}
            </ul>
          </section>
        )}

        <section className={styles.section}>
          <p className="section-title"><Icon name="lock" /> {tr.prerequisites}</p>
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
            <p className="section-title"><Icon name="arrows-exchange" /> {switchOf ? tr.switchOf : tr.switchVersions}</p>
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
            <p className="section-title" style={{ margin: 0 }}><Icon name="video" /> {tr.videos}</p>
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
                        <a href={externalUrl(v.creator_url, { ref: true }) || '#'} target="_blank" rel="noopener" className={styles.creator}>
                          <Icon name={v.source_type === 'instagram' ? 'brand-instagram' : v.source_type === 'youtube' ? 'brand-youtube' : 'video'} />
                          {v.creator_name}
                        </a>
                      )}
                      {v.source_type === 'upload' && v.source_url && (
                        <a href={externalUrl(v.source_url, { ref: true })} target="_blank" rel="noopener" className={styles.sourceLink}>
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
              <button onClick={() => setTakedownVideo(null)} className="btn-icon"><Icon name="x" /></button>
            </div>
            {takedownSent
              ? (
                <div className={styles.takedownSuccess}>
                  <Icon name="check" style={{ fontSize: 32, color: 'var(--c-success)' }} />
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
                    <textarea className="input" rows={3} placeholder={tr.takedownMsgPh} style={{ resize: 'vertical' }}
                      value={takedownForm.message} onChange={e => setTakedownForm(f => ({ ...f, message: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
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
