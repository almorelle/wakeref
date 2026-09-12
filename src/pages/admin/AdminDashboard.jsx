import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import styles from './AdminDashboard.module.css'
import Icon from '../../components/Icon'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ figures: 0, videos: 0, submissions: 0, takedowns: 0, videoPct: 0, instaNoThumb: 0, runs: 0, noVideo: 0, noUpload: 0, competitions: 0, compSubmissions: 0, vues30: 0 })

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
      supabase.from('competitions').select('id', { count: 'exact', head: true }).eq('published', true),
      supabase.from('competition_submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.rpc('view_stats_totals'),
    ]).then(([f, v, sub, t, hs, insta, thumbs, runs, nv, nu, comp, compSub, vues]) => {
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
        competitions: comp.count || 0,
        compSubmissions: compSub.count || 0,
        vues30: vues.data?.[0]?.views_30d || 0,
      })
    })
  }, [])

  // Inventaire : chiffres purement informatifs, ton neutre.
  const overview = [
    { label: 'Figures', value: stats.figures, icon: 'list', action: () => navigate('/admin/figures') },
    { label: 'Vidéos', value: stats.videos, icon: 'video', action: () => navigate('/admin/videos') },
    { label: 'Figures avec vidéo', value: `${stats.videoPct}%`, icon: 'video', action: () => navigate('/admin/no-videos') },
    { label: 'Compétitions publiées', value: stats.competitions, icon: 'calendar-event', action: () => navigate('/admin/competitions') },
    { label: 'Runs sauvegardés', value: stats.runs, icon: 'list', action: () => navigate('/admin/compositions') },
    // Vues de TRICKS seulement, pas le cumul avec `page_views` : ce dernier
    // compteur a démarré le 2026-09-12, et l'additionner ferait monter la
    // tuile pendant trente jours pour une raison qui n'est pas la
    // fréquentation. Le détail des deux est dans /admin/vues.
    { label: 'Vues de tricks (30 j)', value: stats.vues30.toLocaleString('fr-FR'), icon: 'eye', action: () => navigate('/admin/vues') },
  ]
  // À traiter : compteurs d'action. >0 = rouge (à faire), 0 = vert (rien à faire).
  const todo = [
    { label: 'Figures sans vidéo', value: stats.noVideo, icon: 'video-off', action: () => navigate('/admin/no-videos?open=noVideo') },
    { label: 'Avec vidéo sans upload', value: stats.noUpload, icon: 'cloud-upload', action: () => navigate('/admin/no-videos?open=onlyExternal') },
    { label: 'Instagram sans miniature', value: stats.instaNoThumb, icon: 'brand-instagram', action: () => navigate('/admin/no-videos?open=noThumb') },
    { label: 'Retraits en attente', value: stats.takedowns, icon: 'flag', action: () => navigate('/admin/takedowns') },
    { label: 'Soumissions vidéo', value: stats.submissions, icon: 'inbox', action: () => navigate('/admin/submissions') },
    { label: 'Soumissions compétition', value: stats.compSubmissions, icon: 'calendar-event', action: () => navigate('/admin/competition-submissions') },
  ]

  const renderTile = (t, tone) => (
    <button key={t.label} className={`${styles.tile} ${tone ? styles[tone] : ''}`} onClick={t.action}>
      <Icon name={t.icon} className={styles.tileIcon} />
      <span className={styles.tileValue}>{t.value}</span>
      <span className={styles.tileLabel}>{t.label}</span>
    </button>
  )

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Dashboard</h1>

      <section>
        <p className="section-title">Vue d&apos;ensemble</p>
        <div className={styles.grid}>
          {overview.map(t => renderTile(t, null))}
        </div>
      </section>

      <section>
        <p className="section-title">À traiter</p>
        <div className={styles.grid}>
          {todo.map(t => renderTile(t, t.value > 0 ? 'tileAlert' : 'tileOk'))}
        </div>
      </section>

      <div className={styles.shortcuts}>
        <p className="section-title">Actions rapides</p>
        <div className={styles.shortcutBtns}>
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
    </div>
  )
}
