import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'
import ToastContainer from '../../components/Toast'
import styles from './AdminVideos.module.css'
import { useLocation } from 'react-router-dom'
import Icon from '../../components/Icon'

export default function AdminVideos() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toasts, toast } = useToast()
  const prefigureId = searchParams.get('figure')

  const [figures, setFigures] = useState([])
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const location = useLocation()
  const prefill = location.state?.prefill

  const [form, setForm] = useState({
    figure_id: prefigureId || '',
    title: '',
    source_type: 'upload',
    source_url: '',
    creator_name: '',
    creator_url: '',
    caption: '',
  })
  const [file, setFile] = useState(null)

  const load = async () => {
    const [{ data: figs }, { data: vids }] = await Promise.all([
      supabase.from('figures').select('id, name').order('name'),
      supabase.from('videos')
        .select('*, figures(name)')
        .order('uploaded_at', { ascending: false })
        .limit(50),
    ])
    setFigures(figs || [])
    setVideos(vids || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.figure_id) { toast('Sélectionne une figure', 'error'); return }
    setUploading(true)

    let file_path = null
    if (file) {
      const ext = file.name.split('.').pop()
      const path = `${form.figure_id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('videos').upload(path, file, {
        contentType: file.type,
        upsert: false,
      })
      if (upErr) { toast('Erreur upload : ' + upErr.message, 'error'); setUploading(false); return }
      file_path = path
    }

    const { error } = await supabase.from('videos').insert({
      ...form,
      figure_id: parseInt(form.figure_id),
      file_path,
    })
    if (error) { toast(error.message, 'error'); setUploading(false); return }

    toast('Vidéo ajoutée !', 'success')
    setForm(f => ({ ...f, title: '', source_url: '', creator_name: '', creator_url: '', caption: '' }))
    setFile(null)
    setUploading(false)
    load()
  }

  const deleteVideo = async (v) => {
    if (!confirm('Supprimer cette vidéo ?')) return
    if (v.file_path) await supabase.storage.from('videos').remove([v.file_path])
    await supabase.from('videos').delete().eq('id', v.id)
    setVideos(prev => prev.filter(x => x.id !== v.id))
    toast('Vidéo supprimée', 'success')
  }

  return (
    <div className={styles.page}>
      <ToastContainer toasts={toasts} />
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Vidéos</h1>
          <p className={styles.sub}>Upload et gestion des vidéos de figures</p>
        </div>
      </div>

      {/* Formulaire d'upload */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Ajouter une vidéo</h2>
        <form onSubmit={submit} className={styles.form}>
          <div className={styles.row2}>
            <div className="field">
              <label>Figure *</label>
              <select className="input" required value={form.figure_id} onChange={e => set('figure_id', e.target.value)}>
                <option value="">— Choisir une figure —</option>
                {figures.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Titre</label>
              <input className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ex: Tantrum à Sespe 2024" />
            </div>
          </div>

          <div className="field">
            <label>Fichier vidéo</label>
            <input
              className="input"
              type="file"
              accept="video/*"
              onChange={e => setFile(e.target.files[0])}
              style={{ padding: '8px' }}
            />
            {file && <p style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 4 }}>
              {file.name} — {(file.size / 1024 / 1024).toFixed(1)} Mo
            </p>}
          </div>

          <div className={styles.row2}>
            <div className="field">
              <label>Source originale (lien Instagram / YouTube)</label>
              <input className="input" value={form.source_url} onChange={e => set('source_url', e.target.value)} placeholder="https://www.instagram.com/p/..." />
            </div>
            <div className="field">
              <label>Type de source</label>
              <select className="input" value={form.source_type} onChange={e => set('source_type', e.target.value)}>
                <option value="upload">Upload direct</option>
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>
          </div>

          <div className={styles.row2}>
            <div className="field">
              <label>Créateur·ice (nom / pseudo)</label>
              <input className="input" value={form.creator_name} onChange={e => set('creator_name', e.target.value)} placeholder="@wakeboarder_fr" />
            </div>
            <div className="field">
              <label>Lien profil créateur·ice</label>
              <input className="input" value={form.creator_url} onChange={e => set('creator_url', e.target.value)} placeholder="https://instagram.com/..." />
            </div>
          </div>

          <div className="field">
            <label>Légende</label>
            <input className="input" value={form.caption} onChange={e => set('caption', e.target.value)} placeholder="Contexte, événement…" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? 'Upload en cours…' : <><Icon name="upload" /> Ajouter la vidéo</>}
            </button>
          </div>
        </form>
      </div>

      {/* Liste des vidéos */}
      <div className={styles.videoList}>
        <h2 className={styles.cardTitle}>Vidéos récentes</h2>
        {loading && <span className="spinner" />}
        {videos.map(v => (
          <div key={v.id} className={styles.videoRow}>
            <div className={styles.videoThumb}>
              {v.file_path
                ? <Icon name="video" />
                : <Icon name="link" />
              }
            </div>
            <div className={styles.videoMeta}>
              <span className={styles.videoFigure}>{v.figures?.name}</span>
              <span className={styles.videoTitle}>{v.title || 'Sans titre'}</span>
              {v.creator_name && <span className={styles.videoCreator}>{v.creator_name}</span>}
              {v.takedown_requested && <span className="badge" style={{ background: '#ef444420', color: 'var(--c-danger)' }}>Retrait demandé</span>}
            </div>
            <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--c-danger)' }} onClick={() => deleteVideo(v)}>
              <Icon name="trash" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
