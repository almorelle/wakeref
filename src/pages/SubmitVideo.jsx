import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useT } from '../i18n/useT'
import SEO from '../components/SEO'
import Icon from '../components/Icon'
import styles from './SubmitVideo.module.css'

export default function SubmitVideo() {
  const tr = useT()
  const [searchParams] = useSearchParams()
  const figureSlug = searchParams.get('figure')

  const [figures, setFigures] = useState([])
  const [form, setForm] = useState({
    figure_id: '',
    source_url: '',
    title: '',
    creator_name: '',
    creator_url: '',
    caption: '',
  })
  const [status, setStatus] = useState('idle') // idle | sending | success | error

  useEffect(() => {
    supabase.from('figures').select('id, name, slug').order('name').then(({ data }) => {
      setFigures(data || [])
      if (figureSlug && data) {
        const fig = data.find(f => f.slug === figureSlug)
        if (fig) setForm(f => ({ ...f, figure_id: fig.id }))
      }
    })
  }, [figureSlug])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setStatus('sending')
    const { error } = await supabase.from('video_submissions').insert({
      figure_id: Number(form.figure_id),
      source_url: form.source_url,
      title: form.title || null,
      creator_name: form.creator_name || null,
      creator_url: form.creator_url || null,
      caption: form.caption || null,
    })
    setStatus(error ? 'error' : 'success')
  }

  return (
    <div className="page-container">
      <SEO
        titleFr="Soumettre une vidéo"
        titleEn="Submit a video"
        descriptionFr="Soumets une vidéo de wakeboard ou wakeskate pour l'ajouter à WakeRef."
        descriptionEn="Submit a wakeboard or wakeskate video to add to WakeRef."
        path="/submit"
      />
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>{tr.submitTitle}</h1>
          <p className={styles.sub}>{tr.submitSub}</p>
        </div>

        {status === 'success' ? (
          <div className={styles.success}>
            <Icon name="check" style={{ fontSize: 36, color: 'var(--c-success)' }} />
            <p>{tr.submitSuccess}</p>
            <Link to="/figures" className="btn btn-ghost">{tr.figures}</Link>
          </div>
        ) : (
          <form onSubmit={submit} className={styles.form}>
            <div className="field">
              <label>{tr.submitFigure} *</label>
              <select
                className="input"
                required
                value={form.figure_id}
                onChange={e => set('figure_id', e.target.value)}
              >
                <option value="">{tr.submitFigurePh}</option>
                {figures.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>{tr.submitUrl} *</label>
              <input
                className="input"
                type="url"
                required
                placeholder="https://www.youtube.com/watch?v=…"
                value={form.source_url}
                onChange={e => set('source_url', e.target.value)}
              />
            </div>

            <div className="field">
              <label>{tr.submitVideoTitle}</label>
              <input
                className="input"
                type="text"
                placeholder={tr.submitVideoTitlePh}
                value={form.title}
                onChange={e => set('title', e.target.value)}
              />
            </div>

            <div className={styles.row}>
              <div className="field">
                <label>{tr.submitCreator}</label>
                <input
                  className="input"
                  type="text"
                  placeholder={tr.submitCreatorPh}
                  value={form.creator_name}
                  onChange={e => set('creator_name', e.target.value)}
                />
              </div>
              <div className="field">
                <label>{tr.submitCreatorUrl}</label>
                <input
                  className="input"
                  type="url"
                  placeholder="https://instagram.com/…"
                  value={form.creator_url}
                  onChange={e => set('creator_url', e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label>{tr.submitCaption}</label>
              <textarea
                className="input"
                rows={3}
                placeholder={tr.submitCaptionPh}
                value={form.caption}
                onChange={e => set('caption', e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            {status === 'error' && (
              <p className={styles.error}>{tr.submitError}</p>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={status === 'sending'}
              style={{ alignSelf: 'flex-end' }}
            >
              {status === 'sending'
                ? <><Icon name="loader-2" className="spin" /> {tr.submitSending}</>
                : <><Icon name="send" /> {tr.submitSend}</>
              }
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
