import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { externalUrl } from '../../lib/url'
import { MAX_IMAGE_MB, refusSiTropLourd } from '../../lib/uploadLimits'
import { useToast } from '../../hooks/useToast'
import ToastContainer from '../../components/Toast'
import Icon from '../../components/Icon'
import styles from './CompetitionForm.module.css'

// Une fiche n'est qu'un carrefour de liens : rien n'est obligatoire hormis le
// nom, la date et l'affiliation. Une coquille vide est un état final valide —
// c'est même le principe du squelette de saison.
const LINKS = [
  { key: 'info_url',                label: 'Page d’infos',            ph: 'https://…' },
  { key: 'entry_url',               label: 'Inscription',             ph: 'https://…' },
  { key: 'live_video_url',          label: 'Live vidéo',              ph: 'https://youtube.com/…' },
  { key: 'live_scoring_url',        label: 'Live scoring',            ph: 'https://…' },
  { key: 'organiser_instagram_url', label: 'Instagram de l’orga',     ph: 'https://instagram.com/…' },
  { key: 'wakepark_url',            label: 'Site / Insta du wakepark', ph: 'https://…' },
]

const EMPTY = {
  name: '', date_start: '', date_end: '', date_precision: 'day', wakepark: '',
  affiliation: 'independent', tour_name: '', tour_url: '', cancelled: false,
  info_url: '', entry_url: '', live_video_url: '', live_scoring_url: '',
  organiser_instagram_url: '', wakepark_url: '', published: true,
}

// L'année seule est stockée sur le 31 décembre : artefact de stockage, jamais
// affiché. Le dernier jour et non le premier — une compétition annoncée « en
// 2027 » reste à venir tant que 2027 court, et se range après les compétitions
// datées de la même année dans le fil chronologique.
const yearOf = (iso) => (iso ? String(iso).slice(0, 4) : '')
const decLast = (year) => `${String(year).padStart(4, '0')}-12-31`
const isValidYear = (y) => /^\d{4}$/.test(y) && +y >= 2000 && +y <= 2100

export default function CompetitionForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const { toasts, toast } = useToast()
  // Une proposition reçue ouvre le formulaire avec le nom exact employé par
  // l'organisateur. `quand` et `lien` n'ont pas de champ où atterrir — la date
  // est libre, le lien n'est pas typé — donc ils s'affichent en bandeau plutôt
  // que de forcer un aller-retour vers la file.
  const [search] = useSearchParams()
  const fromSubmission = !isEdit && (search.get('quand') || search.get('lien'))

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState(() => (isEdit ? EMPTY : { ...EMPTY, name: [...(search.get('nom') || '')].slice(0, 160).join('') || EMPTY.name }))
  // Deux images de nature différente : l'affiche (sur la fiche) et le logo
  // (repère dans le fil public). Même mécanique, même préfixe Storage. Aucun
  // ratio n'est imposé — le rendu les contient sans recadrer ni déformer.
  const [images, setImages] = useState({ poster_path: null, logo_path: null })
  const [files, setFiles] = useState({ poster_path: null, logo_path: null })
  // L'année vit dans son propre état : la faire transiter par `date_start` à
  // chaque frappe la repassait par padStart(4,'0'), et taper « 2 » affichait « 0002 ».
  const [year, setYear] = useState('')
  const [loadFailed, setLoadFailed] = useState(false)
  const [videos, setVideos]   = useState([])

  const set = (key) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(prev => ({ ...prev, [key]: v }))
  }

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase.from('competitions').select('*').eq('id', id).single()
      if (cancelled) return
      // On ne laisse pas un formulaire vide et éditable sur une fiche illisible :
      // l'enregistrer écraserait la ligne réelle avec des valeurs par défaut.
      if (error || !data) { toast('Compétition introuvable', 'error'); setLoadFailed(true); setLoading(false); return }
      setForm({ ...EMPTY, ...Object.fromEntries(Object.keys(EMPTY).map(k => [k, data[k] ?? EMPTY[k]])) })
      setImages({ poster_path: data.poster_path || null, logo_path: data.logo_path || null })
      setYear(yearOf(data.date_start))
      const { data: vids, error: vErr } = await supabase.from('competition_videos')
        .select('id, url, title, sort_order').eq('competition_id', id).order('sort_order')
      if (cancelled) return
      // Sans ce garde-fou, un chargement raté afficherait « aucune vidéo » et la
      // sauvegarde suivante effacerait pour de bon les liens existants.
      if (vErr) { toast('Vidéos illisibles — enregistrement bloqué.', 'error'); setLoadFailed(true) }
      setVideos(vids || [])
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [id, isEdit, toast])

  // Clé stable : sans elle, retirer une ligne du milieu déplace le focus et le
  // curseur sur la ligne suivante (React réconcilie par position).
  const addVideo    = () => setVideos(prev => [...prev, { id: null, uid: `new-${Date.now()}-${prev.length}`, url: '', title: '', sort_order: prev.length }])
  const removeVideo = (i) => setVideos(prev => prev.filter((_, n) => n !== i))
  const setVideo    = (i, key) => (e) =>
    setVideos(prev => prev.map((v, n) => (n === i ? { ...v, [key]: e.target.value } : v)))

  const save = async (e) => {
    e.preventDefault()
    if (loadFailed) { toast('Chargement incomplet — recharge la page avant d’enregistrer.', 'error'); return }
    if (!form.name.trim()) { toast('Donne un nom à la compétition', 'error'); return }
    const isYearPrec = form.date_precision === 'year'
    if (isYearPrec && !isValidYear(year)) { toast('Année invalide (2000–2100)', 'error'); return }
    if (!isYearPrec && !form.date_start)  { toast('Une date de début est requise', 'error'); return }
    // Le CHECK competition_videos_url_check rejetterait tout le lot APRÈS que les
    // lignes existantes ont été supprimées : on filtre ici, avant d'y toucher.
    const bad = videos.find(v => v.url.trim() && (v.url.trim().length > 500 || !/^https?:\/\//i.test(v.url.trim())))
    if (bad) { toast('Lien vidéo invalide (http(s) attendu, 500 caractères max).', 'error'); return }
    setSaving(true)

    // Les deux images sont pesées AVANT le premier dépôt : sinon une affiche
    // acceptée serait déjà dans le bucket quand le logo est refusé, et il
    // faudrait la rattraper.
    for (const key of ['poster_path', 'logo_path']) {
      const refus = refusSiTropLourd(files[key], MAX_IMAGE_MB)
      if (refus) { toast(refus, 'error'); setSaving(false); return }
    }

    // Upload des images changées. Les nouveaux objets sont retenus pour être
    // retirés si l'écriture de la ligne échoue ensuite.
    const paths = { ...images }
    const uploaded = []
    for (const key of ['poster_path', 'logo_path']) {
      const file = files[key]
      if (!file) continue
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'bin'
      const path = `competitions/${Date.now()}-${key === 'logo_path' ? 'logo' : 'affiche'}.${ext}`
      const { error: upErr } = await supabase.storage.from('videos')
        .upload(path, file, { contentType: file.type || undefined, upsert: false })
      if (upErr) {
        toast('Erreur upload : ' + upErr.message, 'error')
        if (uploaded.length) await supabase.storage.from('videos').remove(uploaded)
        setSaving(false); return
      }
      uploaded.push(path)
      paths[key] = path
    }

    // `date_start` est normalisé ici et pas seulement dans le champ année : basculer
    // le sélecteur sur « année seule » ne déclenche aucun onChange, et laisserait
    // une vraie date de juin étiquetée `year` — invisible à l'écran, faux au lot B.
    const payload = {
      ...Object.fromEntries(Object.entries(form).map(([k, v]) =>
        [k, typeof v === 'string' && !v.trim() ? null : (typeof v === 'string' ? v.trim() : v)])),
      name: form.name.trim(),
      date_start: isYearPrec ? decLast(year) : form.date_start,
      date_end: isYearPrec ? null : (form.date_end || null),
      ...paths,
    }

    const { data: saved, error } = isEdit
      ? await supabase.from('competitions').update(payload).eq('id', id).select('id').single()
      : await supabase.from('competitions').insert(payload).select('id').single()
    if (error) {
      // Les objets uploadés ne sont référencés par rien : on les retire plutôt
      // que de les laisser grossir un bucket qu'aucun écran ne liste.
      if (uploaded.length) await supabase.storage.from('videos').remove(uploaded)
      toast(error.message, 'error'); setSaving(false); return
    }
    // Les anciennes images ne sont supprimées qu'une fois la ligne écrite :
    // l'inverse détruisait l'objet même quand l'enregistrement échouait.
    const orphans = ['poster_path', 'logo_path']
      .filter(k => files[k] && images[k] && images[k] !== paths[k])
      .map(k => images[k])
    if (orphans.length) await supabase.storage.from('videos').remove(orphans)

    // Les vidéos sont peu nombreuses : on remplace le jeu complet plutôt que de
    // differ ligne à ligne.
    const cid = saved.id
    await supabase.from('competition_videos').delete().eq('competition_id', cid)
    const rows = videos.filter(v => v.url.trim())
      .map((v, i) => ({ competition_id: cid, url: v.url.trim(), title: v.title?.trim() || null, sort_order: i }))
    if (rows.length) {
      const { error: vErr } = await supabase.from('competition_videos').insert(rows)
      if (vErr) { toast('Compétition enregistrée, mais les vidéos ont échoué : ' + vErr.message, 'error'); setSaving(false); return }
    }

    setSaving(false)
    toast(isEdit ? 'Compétition mise à jour !' : 'Compétition créée !', 'success')
    navigate('/admin/competitions')
  }

  if (loading) return <span className="spinner" />

  // Fiche illisible : on n'affiche pas un formulaire vide qui, enregistré,
  // écraserait la ligne réelle avec des valeurs par défaut.
  if (loadFailed && isEdit && !form.name) {
    return (
      <div className={styles.page}>
        <ToastContainer toasts={toasts} />
        <p className={styles.empty}>Cette compétition est introuvable ou illisible.</p>
        <button className="btn btn-primary" onClick={() => navigate('/admin/competitions')}>
          ← Retour à la liste
        </button>
      </div>
    )
  }

  const isYear = form.date_precision === 'year'

  return (
    <div className={styles.page}>
      <ToastContainer toasts={toasts} />
      <div className={styles.header}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/competitions')}>
          <Icon name="arrow-left" /> Retour
        </button>
        <h1 className={styles.title}>{isEdit ? 'Modifier la compétition' : 'Nouvelle compétition'}</h1>
      </div>

      {fromSubmission && (
        <p className={styles.fromSubmission}>
          Proposition reçue — <strong>{search.get('quand')}</strong>
          {search.get('lien') && (
            <>{' · '}<a href={externalUrl(search.get('lien'))} target="_blank" rel="noopener noreferrer">
              {search.get('lien')}
            </a></>
          )}
        </p>
      )}

      <form onSubmit={save} className={styles.form}>
        <div className="field">
          <label htmlFor="c-name">Nom *</label>
          <input id="c-name" className="input" required maxLength={160} value={form.name}
            onChange={set('name')} placeholder="ex. Coupe de la Ligue AURA" />
        </div>

        <p className={styles.groupTitle}>Quand</p>
        <div className="field">
          <label htmlFor="c-precision">Précision de la date</label>
          <select id="c-precision" className="input" value={form.date_precision} onChange={set('date_precision')}>
            <option value="day">Dates connues</option>
            <option value="year">Année seule (dates pas encore annoncées)</option>
          </select>
        </div>
        {isYear ? (
          <div className="field">
            <label htmlFor="c-year">Année *</label>
            <input id="c-year" className="input" type="number" required min="2000" max="2100"
              value={year} onChange={e => setYear(e.target.value)} placeholder="2027" />
          </div>
        ) : (
          <div className={styles.row}>
            <div className="field">
              <label htmlFor="c-start">Début *</label>
              <input id="c-start" className="input" type="date" required value={form.date_start} onChange={set('date_start')} />
            </div>
            <div className="field">
              <label htmlFor="c-end">Fin (vide si un seul jour)</label>
              <input id="c-end" className="input" type="date" value={form.date_end || ''}
                min={form.date_start || undefined} onChange={set('date_end')} />
            </div>
          </div>
        )}

        <p className={styles.groupTitle}>Où et quoi</p>
        <div className={styles.row}>
          <div className="field">
            <label htmlFor="c-wakepark">Wakepark</label>
            <input id="c-wakepark" className="input" maxLength={160} value={form.wakepark || ''} onChange={set('wakepark')}
              placeholder="ex. Wake Park de Sévrier" />
          </div>
          <div className="field">
            <label htmlFor="c-affiliation">Affiliation</label>
            <select id="c-affiliation" className="input" value={form.affiliation} onChange={set('affiliation')}>
              <option value="independent">Indépendante</option>
              <option value="federal">Fédérale</option>
            </select>
          </div>
        </div>
        <div className={styles.row}>
          <div className="field">
            <label htmlFor="c-tour">Circuit (optionnel)</label>
            <input id="c-tour" className="input" maxLength={160} value={form.tour_name || ''} onChange={set('tour_name')}
              placeholder="ex. Pro Tour" />
          </div>
          <div className="field">
            <label htmlFor="c-tour-url">Lien du circuit</label>
            <input id="c-tour-url" className="input" type="url" maxLength={500} value={form.tour_url || ''}
              onChange={set('tour_url')} placeholder="https://…" />
          </div>
        </div>

        <p className={styles.groupTitle}>Liens</p>
        <div className={styles.links}>
          {LINKS.map(l => (
            <div className="field" key={l.key}>
              <label htmlFor={`c-${l.key}`}>{l.label}</label>
              <input id={`c-${l.key}`} className="input" type="url" maxLength={500} value={form[l.key] || ''}
                onChange={set(l.key)} placeholder={l.ph} />
            </div>
          ))}
        </div>

        <p className={styles.groupTitle}>Vidéos</p>
        {videos.map((v, i) => (
          <div className={styles.row} key={v.id ?? v.uid}>
            <div className="field">
              <label htmlFor={`c-vurl-${i}`}>Lien {i + 1}</label>
              <input id={`c-vurl-${i}`} className="input" type="url" maxLength={500} value={v.url}
                onChange={setVideo(i, 'url')} placeholder="https://youtube.com/… ou instagram.com/…" />
            </div>
            <div className="field">
              <label htmlFor={`c-vtitle-${i}`}>Titre (optionnel)</label>
              <div className={styles.videoRow}>
                <input id={`c-vtitle-${i}`} className="input" maxLength={160} value={v.title || ''}
                  onChange={setVideo(i, 'title')} placeholder="ex. Finale open" />
                <button type="button" className="btn btn-ghost btn-sm btn-icon" title="Retirer"
                  aria-label={`Retirer la vidéo ${i + 1}`} style={{ color: 'var(--c-danger)' }}
                  onClick={() => removeVideo(i)}>
                  <Icon name="trash" />
                </button>
              </div>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-ghost btn-sm" onClick={addVideo}>
          <Icon name="plus" /> Ajouter un lien vidéo
        </button>

        <p className={styles.groupTitle}>Images</p>
        <div className={styles.row}>
          {[
            { key: 'poster_path', label: 'Affiche', hint: 'Affichée sur la fiche publique, dans son format d’origine.' },
            { key: 'logo_path',   label: 'Logo',    hint: 'Repère visuel dans le fil. Tenu dans un cadre sans être recadré ni déformé.' },
          ].map(img => (
            <div className="field" key={img.key}>
              <label htmlFor={`c-${img.key}`}>{img.label}</label>
              <input id={`c-${img.key}`} className="input" type="file" accept="image/*"
                onChange={e => setFiles(prev => ({ ...prev, [img.key]: e.target.files?.[0] || null }))} />
              <p className={styles.fileInfo}>{img.hint}</p>
              {images[img.key] && !files[img.key] && (
                <p className={styles.fileInfo}>
                  Actuel : {images[img.key].split('/').pop()}{' '}
                  <button type="button" className="btn btn-ghost btn-sm"
                    onClick={() => setImages(prev => ({ ...prev, [img.key]: null }))}>
                    Retirer
                  </button>
                </p>
              )}
              {files[img.key] && <p className={styles.fileInfo}>Remplacera l’image actuelle à l’enregistrement.</p>}
            </div>
          ))}
        </div>

        <div className={styles.actions}>
          <label className={styles.publishLabel}>
            <input type="checkbox" checked={form.published} onChange={set('published')} /> Publiée
          </label>
          <label className={styles.publishLabel}>
            <input type="checkbox" checked={form.cancelled} onChange={set('cancelled')} /> Annulée
          </label>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Enregistrement…' : (isEdit ? 'Enregistrer' : 'Créer')}
          </button>
        </div>
      </form>
    </div>
  )
}
