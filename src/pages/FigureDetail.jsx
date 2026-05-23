import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import DifficultyDots from '../components/DifficultyDots'
import { SportBadge, CategoryBadge, ContextBadge } from '../components/Badges'
import { useT } from '../i18n/useT'
import { useLocalizedField } from '../contexts/LanguageContext'
import SEO from '../components/SEO'
import styles from './FigureDetail.module.css'

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

  useEffect(() => {
    setLoading(true)
    supabase.from('figures_full').select('*').eq('slug', slug).single().then(({ data }) => {
      setFigure(data)
      setLoading(false)
    })
  }, [slug])

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
        <a href={v.source_url} target="_blank" rel="noopener noreferrer" className={styles.platformThumb}>
          <i className="ti ti-brand-instagram" style={{ color: '#E1306C' }} />
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
    return <div className={styles.videoPlaceholder}><i className="ti ti-player-play" /></div>
  }

  if (loading) return <span className="spinner" style={{ marginTop: '3rem' }} />
  if (!figure) return (
    <div className="page-container" style={{ paddingTop: '2rem' }}>
      <p style={{ color: 'var(--c-muted)' }}>{tr.notFound}</p>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginTop: '1rem' }}>
        ← {tr.back}
      </button>
    </div>
  )

  const prereqs       = typeof figure.prerequisites === 'string' ? JSON.parse(figure.prerequisites) : figure.prerequisites || []
  const switchOf       = figure.switch_of_figure ? (typeof figure.switch_of_figure === 'string' ? JSON.parse(figure.switch_of_figure) : figure.switch_of_figure) : null
  const switchVersions = typeof figure.switch_versions === 'string' ? JSON.parse(figure.switch_versions) : figure.switch_versions || []
  const videos  = typeof figure.videos === 'string'       ? JSON.parse(figure.videos)       : figure.videos  || []

  const desc = localize(figure, 'description')
  const tips = localize(figure, 'tips') || []

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <i className="ti ti-arrow-left" /> {tr.back}
        </button>
        <h1 className={styles.title}>{figure.name}</h1>
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
          <p className="section-title"><i className="ti ti-file-description" /> {tr.description}</p>
          <p className={styles.desc}>{desc}</p>
        </section>

        {tips.length > 0 && (
          <section className={styles.section}>
            <p className="section-title"><i className="ti ti-bulb" /> {tr.tips}</p>
            <ul className={styles.tips}>
              {tips.map((tip, i) => <li key={i}>{tip}</li>)}
            </ul>
          </section>
        )}

        <section className={styles.section}>
          <p className="section-title"><i className="ti ti-lock" /> {tr.prerequisites}</p>
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
            <p className="section-title"><i className="ti ti-arrows-exchange" /> {switchOf ? tr.switchOf : tr.switchVersions}</p>
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
          <p className="section-title"><i className="ti ti-video" /> {tr.videos}</p>
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
                        <a href={v.creator_url || '#'} target="_blank" rel="noopener noreferrer" className={styles.creator}>
                          <i className={`ti ${v.source_type === 'instagram' ? 'ti-brand-instagram' : v.source_type === 'youtube' ? 'ti-brand-youtube' : 'ti-video'}`} />
                          {v.creator_name}
                        </a>
                      )}
                      {v.source_type === 'upload' && v.source_url && (
                        <a href={v.source_url} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
                          {tr.originalSource} <i className="ti ti-external-link" />
                        </a>
                      )}
                      {v.caption && <p className={styles.caption}>{v.caption}</p>}
                      <div className={styles.creditNote}>
                        <i className="ti ti-info-circle" />
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
              <button onClick={() => setTakedownVideo(null)} className="btn-icon"><i className="ti ti-x" /></button>
            </div>
            {takedownSent
              ? (
                <div className={styles.takedownSuccess}>
                  <i className="ti ti-check" style={{ fontSize: 32, color: 'var(--c-success)' }} />
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
