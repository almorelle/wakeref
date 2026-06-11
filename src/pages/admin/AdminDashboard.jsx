import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import styles from './AdminDashboard.module.css'
import Icon from '../../components/Icon'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ figures: 0, videos: 0, submissions: 0, takedowns: 0, videoPct: 0, instaNoThumb: 0, runs: 0, noVideo: 0, noUpload: 0 })

  useEffect(() => {
    Promise.all([
      supabase.from('figures').select('id', { count: 'exact', head: true }),
      supabase.from('videos').select('id', { count: 'exact', head: true }),
      supabase.from('video_submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('takedown_requests').select('id', { count: 'exact', head: true }).eq('handled', false),
      supabase.rpc('home_stats'),
      supabase.from('videos').select('source_url').eq('source_type', 'instagram'),
      supabase.storage.from('videos').list('thumbnails', { limit: 1000 }),
      supabase.from('compositions').select('id', { count: 'exact', head: true }),
      supabase.rpc('figures_without_videos'),
      supabase.rpc('figures_without_uploaded_videos'),
    ]).then(([f, v, sub, t, hs, insta, thumbs, runs, nv, nu]) => {
      const row = hs.data?.[0]
      const videoPct = row && row.total_figures > 0
        ? Math.round((row.figures_with_video / row.total_figures) * 100)
        : 0

      const thumbSet = new Set((thumbs.data || []).map(o => o.name))
      const instaNoThumb = (insta.data || []).filter(v => {
        const shortcode = v.source_url?.match(/instagram\.com\/(?:p|reels?|tv)\/([^/?#]+)/)?.[1]
        return !shortcode || !thumbSet.has(`${shortcode}.jpg`)
      }).length

      const noVideoIds = new Set((nv.data || []).map(f => f.id))
      const noUpload = (nu.data || []).filter(f => !noVideoIds.has(f.id)).length

      setStats({
        figures: f.count || 0,
        videos: v.count || 0,
        submissions: sub.count || 0,
        takedowns: t.count || 0,
        videoPct,
        instaNoThumb,
        runs: runs.count || 0,
        noVideo: noVideoIds.size,
        noUpload,
      })
    })
  }, [])

  const tiles = [
    { label: 'Figures', value: stats.figures, icon: 'list', action: () => navigate('/admin/figures'), color: 'var(--c-accent)' },
    { label: 'Vidéos', value: stats.videos, icon: 'video', action: () => navigate('/admin/videos'), color: 'var(--c-accent)' },
    { label: 'Figures avec vidéo', value: `${stats.videoPct}%`, icon: 'video', action: () => navigate('/admin/no-videos'), color: 'var(--c-accent)' },
    { label: 'Figures sans vidéo', value: stats.noVideo, icon: 'video-off', action: () => navigate('/admin/no-videos?open=noVideo'), color: stats.noVideo > 0 ? 'var(--c-danger)' : 'var(--c-success)' },
    { label: 'Avec vidéo sans upload', value: stats.noUpload, icon: 'cloud-upload', action: () => navigate('/admin/no-videos?open=onlyExternal'), color: stats.noUpload > 0 ? 'var(--c-danger)' : 'var(--c-success)' },
    { label: 'Instagram sans miniature', value: stats.instaNoThumb, icon: 'brand-instagram', action: () => navigate('/admin/no-videos?open=noThumb'), color: stats.instaNoThumb > 0 ? 'var(--c-danger)' : 'var(--c-success)' },
    { label: 'Retraits en attente', value: stats.takedowns, icon: 'flag', action: () => navigate('/admin/takedowns'), color: stats.takedowns > 0 ? 'var(--c-danger)' : 'var(--c-success)' },
    { label: 'Soumissions à traiter', value: stats.submissions, icon: 'inbox', action: () => navigate('/admin/submissions'), color: stats.submissions > 0 ? 'var(--c-danger)' : 'var(--c-success)' },
    { label: 'Runs sauvegardés', value: stats.runs, icon: 'list', action: () => navigate('/admin/compositions'), color: 'var(--c-accent)' },
  ]

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Dashboard</h1>
      <div className={styles.grid}>
        {tiles.map(t => (
          <button key={t.label} className={styles.tile} onClick={t.action} style={{ '--tile-color': t.color }}>
            <Icon name={t.icon} />
            <span className={styles.tileValue}>{t.value}</span>
            <span className={styles.tileLabel}>{t.label}</span>
          </button>
        ))}
      </div>
      <div className={styles.shortcuts}>
        <p className="section-title">Actions rapides</p>
        <button className="btn btn-primary" onClick={() => navigate('/admin/figures/new')}>
          <Icon name="plus" /> Nouvelle figure
        </button>
        <button className="btn btn-ghost" onClick={() => navigate('/admin/videos')}>
          <Icon name="upload" /> Uploader une vidéo
        </button>
        <button className="btn btn-ghost" onClick={() => navigate('/')} target="_blank">
          <Icon name="external-link" /> Voir le site
        </button>
      </div>
    </div>
  )
}
