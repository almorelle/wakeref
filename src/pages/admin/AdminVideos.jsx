import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'
import ToastContainer from '../../components/Toast'
import styles from './AdminVideos.module.css'
import Icon from '../../components/Icon'

const SPORT_LABELS = { wakeboard: 'Wakeboard', wakeskate: 'Wakeskate', seated: 'Wakeboard assis' }
const GENDER_LABELS = { woman: 'Femme', man: 'Homme', other: 'Autre' }

const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// Déduit le type de source sans le demander à l'admin : un fichier joint = upload
// direct ; sinon on lit l'URL source. Renvoie null si indéterminable (ni fichier,
// ni URL reconnue) → l'ajout est bloqué (le rendu ne sait afficher que ces 3 types).
const deriveSourceType = (file, url) => {
  if (file) return 'upload'
  const u = (url || '').trim()
  if (!u) return null
  if (/instagram\.com/i.test(u)) return 'instagram'
  if (/youtube\.com|youtu\.be/i.test(u)) return 'youtube'
  return null
}

export default function AdminVideos() {
  const [searchParams] = useSearchParams()
  const { toasts, toast } = useToast()
  const prefigureId = searchParams.get('figure')

  const [figures, setFigures] = useState([])
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  // Bumpé après un upload pour forcer le remount de l'input file (un input file
  // ne peut pas être vidé par état : sans ça il garde le nom du fichier précédent).
  const [fileKey, setFileKey] = useState(0)

  // Combobox figure : champ texte éditable + liste navigable au clavier.
  const [figureSearch, setFigureSearch] = useState('')
  const [figureOpen, setFigureOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const pickerRef = useRef(null)
  const figureInputRef = useRef(null)
  const activeOptionRef = useRef(null)

  const [form, setForm] = useState({
    figure_id: prefigureId || '',
    title: '',
    source_url: '',
    creator_name: '',
    creator_url: '',
    caption: '',
    sport: '',             // '' = hérite du sport de la figure
    performer_gender: '',   // curation interne (jamais public)
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

  useEffect(() => { void (async () => { await load() })() }, [])

  // Préremplissage via ?figure= (flux Figures→Vidéos) : renseigne le champ figure
  // + le titre avec le nom de la figure une fois la liste chargée.
  useEffect(() => {
    if (!figures.length || !prefigureId) return
    const f = figures.find(x => String(x.id) === String(prefigureId))
    if (f) {
      setForm(s => (s.title ? s : { ...s, title: f.name }))
      setFigureSearch(prev => prev || f.name)
    }
  }, [figures, prefigureId])

  // Fermeture du menu au clic extérieur.
  useEffect(() => {
    if (!figureOpen) return
    const onDoc = e => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setFigureOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [figureOpen])

  // Garde l'option surlignée visible pendant la navigation clavier.
  useEffect(() => { activeOptionRef.current?.scrollIntoView({ block: 'nearest' }) }, [highlight, figureOpen])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const figureResults = figureSearch.trim()
    ? figures.filter(f => norm(f.name).includes(norm(figureSearch))).slice(0, 8)
    : []
  const safeHighlight = Math.min(highlight, Math.max(0, figureResults.length - 1))

  // Sélection d'une figure → renseigne le champ + le titre (nom de la figure).
  const pickFigure = (f) => {
    setForm(s => ({ ...s, figure_id: String(f.id), title: f.name }))
    setFigureSearch(f.name)
    setFigureOpen(false)
  }

  const clearFigure = () => {
    setForm(s => ({ ...s, figure_id: '', title: '' }))
    setFigureSearch('')
    setHighlight(0)
    setFigureOpen(true)
    figureInputRef.current?.focus()
  }

  const onFigureKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault(); setFigureOpen(true); setHighlight(h => Math.min(h + 1, figureResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); setHighlight(h => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      if (figureOpen && figureResults[safeHighlight]) { e.preventDefault(); pickFigure(figureResults[safeHighlight]) }
    } else if (e.key === 'Escape') {
      setFigureOpen(false)
    }
  }

  // Réutilise les infos d'auteur·ice d'une vidéo existante (utile pour des
  // uploads à la chaîne depuis la même source). N'écrase QUE ces 4 champs.
  const reuse = (v) => setForm(s => ({
    ...s,
    creator_name: v.creator_name || '',
    source_url: v.source_url || '',
    creator_url: v.creator_url || '',
    performer_gender: v.performer_gender || '',
  }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.figure_id) { toast('Sélectionne une figure', 'error'); return }
    const source_type = deriveSourceType(file, form.source_url)
    if (!source_type) {
      toast('Ajoute un fichier vidéo ou une source Instagram/YouTube valide', 'error')
      return
    }
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
      source_type,                                       // déduit (upload / instagram / youtube)
      sport: form.sport || null,                         // '' → hérite de la figure
      performer_gender: form.performer_gender || null,   // '' → non renseigné
    })
    if (error) { toast(error.message, 'error'); setUploading(false); return }

    toast('Vidéo ajoutée !', 'success')
    // Reset : on garde la figure sélectionnée et on repropose son nom en titre
    // (uploads à la chaîne de la même figure).
    setForm(f => {
      const sel = figures.find(x => String(x.id) === String(f.figure_id))
      return { ...f, title: sel?.name || '', source_url: '', creator_name: '', creator_url: '', caption: '', sport: '', performer_gender: '' }
    })
    setFile(null)
    setFileKey(k => k + 1)   // vide l'input file (cf. plus haut)
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
              <label htmlFor="video-figure">Figure *</label>
              {/* Combobox : champ éditable + liste navigable au clavier (↑/↓, Entrée,
                  Échap). Un select natif à 200+ options est pénible. */}
              <div className={styles.picker} ref={pickerRef}>
                <input
                  ref={figureInputRef}
                  id="video-figure"
                  className={`input ${styles.pickerInput}`}
                  value={figureSearch}
                  role="combobox"
                  aria-expanded={figureOpen}
                  aria-autocomplete="list"
                  aria-controls="figure-listbox"
                  placeholder="Rechercher une figure…"
                  autoComplete="off"
                  onChange={e => { set('figure_id', ''); setFigureSearch(e.target.value); setFigureOpen(true); setHighlight(0) }}
                  onFocus={() => setFigureOpen(true)}
                  onKeyDown={onFigureKey}
                />
                {figureSearch && (
                  <button type="button" className={styles.pickerClearInline} onClick={clearFigure} aria-label="Effacer la figure">
                    <Icon name="x" size={16} />
                  </button>
                )}
                {figureOpen && figureSearch.trim() && (
                  <div className={styles.pickerResults} role="listbox" id="figure-listbox">
                    {figureResults.length === 0
                      ? <div className={styles.pickerNoResult}>Aucune figure trouvée</div>
                      : figureResults.map((f, idx) => (
                          <button
                            key={f.id}
                            ref={idx === safeHighlight ? activeOptionRef : null}
                            type="button"
                            role="option"
                            aria-selected={idx === safeHighlight}
                            className={`${styles.pickerResult} ${idx === safeHighlight ? styles.pickerResultActive : ''}`}
                            onMouseEnter={() => setHighlight(idx)}
                            onClick={() => pickFigure(f)}>
                            {f.name}
                          </button>
                        ))}
                  </div>
                )}
              </div>
            </div>
            <div className="field">
              <label htmlFor="video-title">Titre</label>
              <input id="video-title" className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ex: Tantrum à Sespe 2024" />
            </div>
          </div>

          <div className="field">
            <label htmlFor="video-file">Fichier vidéo</label>
            <input
              key={fileKey}
              id="video-file"
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

          <div className="field">
            <label htmlFor="video-source">Source originale (lien Instagram / YouTube)</label>
            <input id="video-source" className="input" value={form.source_url} onChange={e => set('source_url', e.target.value)} placeholder="https://www.instagram.com/p/..." />
            {/* Type de source déduit : fichier joint → upload direct, sinon lu depuis l'URL. */}
            <p style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 4 }}>
              {file
                ? 'Type : upload direct (fichier joint)'
                : deriveSourceType(null, form.source_url)
                  ? `Type : ${deriveSourceType(null, form.source_url) === 'instagram' ? 'Instagram' : 'YouTube'}`
                  : 'Ajoute un fichier ou un lien Instagram/YouTube'}
            </p>
          </div>

          <div className={styles.row2}>
            <div className="field">
              <label htmlFor="video-creator">Créateur·ice (nom / pseudo)</label>
              <input id="video-creator" className="input" value={form.creator_name} onChange={e => set('creator_name', e.target.value)} placeholder="@wakeboarder_fr" />
            </div>
            <div className="field">
              <label htmlFor="video-creatorurl">Lien profil créateur·ice</label>
              <input id="video-creatorurl" className="input" value={form.creator_url} onChange={e => set('creator_url', e.target.value)} placeholder="https://instagram.com/..." />
            </div>
          </div>

          <div className="field">
            <label htmlFor="video-caption">Légende</label>
            <input id="video-caption" className="input" value={form.caption} onChange={e => set('caption', e.target.value)} placeholder="Contexte, événement…" />
          </div>

          <div className={styles.row2}>
            <div className="field">
              <label htmlFor="video-sport">Sport (si différent de la figure)</label>
              <select id="video-sport" className="input" value={form.sport} onChange={e => set('sport', e.target.value)}>
                <option value="">— Hérite de la figure —</option>
                <option value="wakeboard">Wakeboard</option>
                <option value="wakeskate">Wakeskate</option>
                <option value="seated">Wakeboard assis</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="video-gender">Genre de la personne (curation interne)</label>
              <select id="video-gender" className="input" value={form.performer_gender} onChange={e => set('performer_gender', e.target.value)}>
                <option value="">— Non renseigné —</option>
                <option value="woman">Femme</option>
                <option value="man">Homme</option>
                <option value="other">Autre</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={uploading || !deriveSourceType(file, form.source_url)}>
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
              {v.file_path ? <Icon name="video" /> : <Icon name="link" />}
            </div>
            <div className={styles.videoMeta}>
              <div className={styles.videoHead}>
                <span className={styles.videoFigure}>{v.figures?.name}</span>
                {v.title && <span className={styles.videoTitle}>{v.title}</span>}
                {v.takedown_requested && <span className="badge" style={{ background: '#ef444420', color: 'var(--c-danger)' }}>Retrait demandé</span>}
              </div>
              {(v.creator_name || v.sport || v.performer_gender) && (
                <div className={styles.videoSub}>
                  {v.creator_name && <span>{v.creator_name}</span>}
                  {v.sport && <span>{SPORT_LABELS[v.sport] || v.sport}</span>}
                  {v.performer_gender && <span>{GENDER_LABELS[v.performer_gender] || v.performer_gender}</span>}
                </div>
              )}
              {/* Texte brut (non cliquable) : sélectionnable pour copier la source. */}
              {(v.source_url || v.creator_url) && (
                <div className={styles.videoUrls}>
                  {v.source_url && <span className={styles.videoUrl}>{v.source_url}</span>}
                  {v.creator_url && <span className={styles.videoUrl}>{v.creator_url}</span>}
                </div>
              )}
            </div>
            <div className={styles.videoActions}>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => reuse(v)}
                title="Réutiliser dans le formulaire" aria-label="Réutiliser ces infos (créateur·ice, source, profil, genre) dans le formulaire">
                <Icon name="copy" />
              </button>
              <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--c-danger)' }} onClick={() => deleteVideo(v)} aria-label="Supprimer la vidéo">
                <Icon name="trash" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
