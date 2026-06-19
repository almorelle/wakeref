import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'
import ToastContainer from '../../components/Toast'
import Icon from '../../components/Icon'
import RunSaisie from '../../components/RunSaisie'
import { GRIDS, GRID_OPTIONS, serializeEntry } from '../../lib/compoGrids'
import styles from './JudgeRunForm.module.css'

const EMPTY_RUN = { entries: [], jibPasses: [], otherEntries: [] }

const GRID_LABELS = {
  wakeboard:  'Wakeboard',
  wakeskate:  'Wakeskate',
  seated_mp1: 'Assis · MP1–MP3',
  seated_mp5: 'Assis · MP3–MP5',
}

const DIFFICULTIES = [
  { value: 'easy',   label: 'Facile (U11 · MP1–3)'        },
  { value: 'medium', label: 'Moyen (U14 · MP3–5 · O40)'   },
  { value: 'hard',   label: 'Difficile (U18 · open · O30)' },
]

export default function JudgeRunForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const { toasts, toast } = useToast()

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving]   = useState(false)
  const [name, setName]       = useState('')
  const [gridKey, setGridKey] = useState('wakeboard')
  const [difficulty, setDifficulty] = useState('medium')
  const [category, setCategory] = useState('')
  const [sourceType, setSourceType] = useState('upload')
  const [videoUrl, setVideoUrl] = useState('')
  const [file, setFile] = useState(null)
  const [existingVideoPath, setExistingVideoPath] = useState(null)
  const [published, setPublished] = useState(false)
  const [run, setRun] = useState(EMPTY_RUN)

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase.from('judge_runs').select('*').eq('id', id).single()
      if (cancelled) return
      if (error || !data) { toast('Run introuvable', 'error'); setLoading(false); return }
      const sol = data.solution || {}
      setName(data.name || '')
      setGridKey(sol.gridKey || data.grid_key || 'wakeboard')
      setDifficulty(data.difficulty || 'medium')
      setCategory(data.category || '')
      setSourceType(data.source_type || 'upload')
      setVideoUrl(data.video_url || '')
      setExistingVideoPath(data.video_path || null)
      setPublished(!!data.published)
      setRun({
        entries: sol.entries || [],
        jibPasses: sol.jibPasses || [],
        otherEntries: sol.otherEntries || [],
      })
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [id, isEdit, toast])

  // Changer de grille invalide la saisie (un run ne mélange pas les disciplines).
  const changeGrid = (key) => { setGridKey(key); setRun(EMPTY_RUN) }

  const itemCount = run.entries.length + run.jibPasses.length + run.otherEntries.length

  const save = async (e) => {
    e.preventDefault()
    if (!name.trim()) { toast('Donne un nom au run', 'error'); return }
    if (itemCount === 0) { toast('La solution est vide — saisis le run de référence', 'error'); return }
    setSaving(true)

    // Vidéo : upload d'un nouveau fichier OU URL externe.
    let video_path = existingVideoPath
    let video_url = null
    if (sourceType === 'upload') {
      if (file) {
        const ext = file.name.split('.').pop()
        const path = `runs/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('videos').upload(path, file, {
          contentType: file.type,
          upsert: false,
        })
        if (upErr) { toast('Erreur upload : ' + upErr.message, 'error'); setSaving(false); return }
        // Remplacement : retire l'ancien fichier devenu orphelin.
        if (existingVideoPath) await supabase.storage.from('videos').remove([existingVideoPath])
        video_path = path
      }
    } else {
      video_path = null
      video_url = videoUrl.trim() || null
    }

    const payload = {
      name: name.trim(),
      discipline: GRIDS[gridKey].discipline,
      grid_key: gridKey,
      difficulty,
      category: category.trim() || null,
      source_type: sourceType,
      video_path,
      video_url,
      solution: {
        entries: run.entries.map(serializeEntry),
        jibPasses: run.jibPasses,
        otherEntries: run.otherEntries,
        gridKey,
      },
      published,
    }

    const { error } = isEdit
      ? await supabase.from('judge_runs').update(payload).eq('id', id)
      : await supabase.from('judge_runs').insert(payload)

    setSaving(false)
    if (error) { toast(error.message, 'error'); return }
    toast(isEdit ? 'Run mis à jour !' : 'Run créé !', 'success')
    navigate('/admin/judge-runs')
  }

  if (loading) return <span className="spinner" />

  return (
    <div className={styles.page}>
      <ToastContainer toasts={toasts} />
      <div className={styles.header}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/judge-runs')}>
          <Icon name="arrow-left" /> Retour
        </button>
        <h1 className={styles.title}>{isEdit ? 'Modifier le run de référence' : 'Nouveau run de référence'}</h1>
      </div>

      <form onSubmit={save} className={styles.form}>
        <div className="field">
          <label htmlFor="jr-name">Nom *</label>
          <input id="jr-name" className="input" required maxLength={120} value={name}
            onChange={e => setName(e.target.value)} placeholder="ex. Run wakeboard medium #3" />
        </div>

        <div className={styles.row3}>
          <div className="field">
            <label htmlFor="jr-grid">Grille (discipline / niveau de saisie)</label>
            <select id="jr-grid" className="input" value={gridKey} onChange={e => changeGrid(e.target.value)}>
              {GRID_OPTIONS.map(k => <option key={k} value={k}>{GRID_LABELS[k] || k}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="jr-difficulty">Niveau</label>
            <select id="jr-difficulty" className="input" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
              {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="jr-category">Catégorie (optionnel)</label>
            <input id="jr-category" className="input" value={category}
              onChange={e => setCategory(e.target.value)} placeholder="ex. U14, O40…" />
          </div>
        </div>

        <p className={styles.groupTitle}>Vidéo du run</p>
        <div className={styles.row2}>
          <div className="field">
            <label htmlFor="jr-source">Source</label>
            <select id="jr-source" className="input" value={sourceType} onChange={e => setSourceType(e.target.value)}>
              <option value="upload">Upload direct</option>
              <option value="external">URL externe</option>
            </select>
          </div>
          {sourceType === 'upload' ? (
            <div className="field">
              <label htmlFor="jr-file">Fichier {isEdit && existingVideoPath ? '(laisser vide pour garder l\'actuel)' : ''}</label>
              <input id="jr-file" className="input" type="file" accept="video/*"
                onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
          ) : (
            <div className="field">
              <label htmlFor="jr-url">URL de la vidéo</label>
              <input id="jr-url" className="input" type="url" value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)} placeholder="https://…" />
            </div>
          )}
        </div>

        <p className={styles.groupTitle}>Solution de référence (saisie du run)</p>
        <div className={styles.saisieWrap}>
          <RunSaisie
            key={gridKey}
            gridKey={gridKey}
            value={run}
            onChange={setRun}
            toast={toast}
          />
        </div>

        <div className="field">
          <label className={styles.publishLabel}>
            <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} />
            {"Publié (visible dans l'entraînement juge)"}
          </label>
        </div>

        <div className={styles.actions}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/admin/judge-runs')}>Annuler</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer le run'}
          </button>
        </div>
      </form>
    </div>
  )
}
