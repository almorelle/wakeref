import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'
import ToastContainer from '../../components/Toast'
import styles from './FigureForm.module.css'
import { useLocation } from 'react-router-dom'
import Icon from '../../components/Icon'

export default function FigureForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const { toasts, toast } = useToast()

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState([])
  const [allFigures, setAllFigures] = useState([])
  const [activeTab, setActiveTab] = useState('fr')

  const [form, setForm] = useState({
    name: '', slug: '', category_id: '', sport: 'wakeboard',
    difficulty: 2, published: true,
    contexts: [],
    approach: [],
    rotation: [],
    inverted: false,
    rewind: false,
    description: '', tips: ['', '', '', ''],
    description_en: '', tips_en: ['', '', '', ''],
  })

  const [prereqIds, setPrereqIds] = useState([])
  const location = useLocation()
  const figureIds = location.state?.figureIds || []
  const currentIndex = figureIds.indexOf(parseInt(id))
  const prevId = figureIds[currentIndex - 1]
  const nextId = figureIds[currentIndex + 1]

  useEffect(() => {
    const baseQueries = Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('figures').select('id, name, slug').order('name'),
    ])

    if (!isEdit) {
      baseQueries.then(([{ data: cats }, { data: figs }]) => {
        setCategories(cats || [])
        setAllFigures(figs || [])
      })
      return
    }

    Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('figures').select('id, name, slug').order('name'),
      supabase.from('figures').select('*').eq('id', id).single(),
      supabase.from('figures_full').select('prerequisites').eq('id', id).single(),
    ]).then(([{ data: cats }, { data: figs }, { data: fig }, { data: full }]) => {
      setCategories(cats || [])
      setAllFigures(figs || [])

      if (fig) {
        const prereqs = full?.prerequisites
          ? (typeof full.prerequisites === 'string' ? JSON.parse(full.prerequisites) : full.prerequisites)
          : []
        setPrereqIds(prereqs.map(p => p.id))
        setForm({
          name: fig.name,
          slug: fig.slug,
          category_id: String(fig.category_id || ''),
          sport: fig.sport,
          difficulty: fig.difficulty,
          published: fig.published,
          contexts: fig.contexts || [],
          approach: fig.approach || [],
          rotation: fig.rotation || [],
          inverted: fig.inverted || false,
          rewind: fig.rewind || false,
          description: fig.description || '',
          tips: [...(fig.tips || []), '', '', '', ''].slice(0, Math.max(4, (fig.tips || []).length + 1)),
          description_en: fig.description_en || '',
          tips_en: [...(fig.tips_en || []), '', '', '', ''].slice(0, Math.max(4, (fig.tips_en || []).length + 1)),
        })
      }
      setLoading(false)
    })
  }, [id, isEdit])

  const genSlug = (name) =>
    name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const setTip = (lang, i, v) => setForm(f => {
    const key = lang === 'en' ? 'tips_en' : 'tips'
    const tips = [...f[key]]
    tips[i] = v
    if (v && i === tips.length - 1) tips.push('')
    return { ...f, [key]: tips }
  })

  const toggleArray = (key, value) => {
    setForm(f => {
      const arr = f[key] || []
      const next = arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value]
      return { ...f, [key]: next }
    })
  }

  const togglePrereq = (figId) => {
    setPrereqIds(prev => prev.includes(figId) ? prev.filter(x => x !== figId) : [...prev, figId])
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      slug: form.slug || genSlug(form.name),
      category_id: form.category_id ? parseInt(form.category_id) : null,
      difficulty: parseInt(form.difficulty),
      contexts: form.contexts,
      approach: form.approach,
      rotation: form.rotation,
      inverted: form.inverted,
      rewind: form.rewind,
      tips: form.tips.filter(t => t.trim()),
      tips_en: form.tips_en.filter(t => t.trim()),
    }

    let figureId = id ? parseInt(id) : null
    if (isEdit) {
      const { error } = await supabase.from('figures').update(payload).eq('id', id)
      if (error) { toast(error.message, 'error'); setSaving(false); return }
    } else {
      const { data, error } = await supabase.from('figures').insert(payload).select().single()
      if (error) { toast(error.message, 'error'); setSaving(false); return }
      figureId = data.id
    }

    await supabase.from('prerequisites').delete().eq('figure_id', figureId)
    if (prereqIds.length) {
      await supabase.from('prerequisites').insert(prereqIds.map(r => ({ figure_id: figureId, requires_id: r })))
    }

    toast(isEdit ? 'Figure mise à jour !' : 'Figure créée !', 'success')
    setSaving(false)
  }

  if (loading) return <span className="spinner" />

  const tabs = [
    { id: 'fr', label: '🇫🇷 Français' },
    { id: 'en', label: '🇬🇧 English' },
  ]

  const CheckGroup = ({ label, fieldKey, options }) => (
    <div className="field">
      <label>{label}</label>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {options.map(opt => (
          <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
            <input
              type="checkbox"
              checked={(form[fieldKey] || []).includes(opt.value)}
              onChange={() => toggleArray(fieldKey, opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      <ToastContainer toasts={toasts} />
      <div className={styles.header}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/figures')}>
          <Icon name="arrow-left" /> Retour
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" disabled={!prevId}
            onClick={() => navigate(`/admin/figures/${prevId}/edit`, { state: location.state })}>
            <Icon name="arrow-left" /> Précédent
          </button>
          <button className="btn btn-ghost btn-sm" disabled={!nextId}
            onClick={() => navigate(`/admin/figures/${nextId}/edit`, { state: location.state })}>
            Suivant <Icon name="arrow-right" />
          </button>
        </div>
        <h1 className={styles.title}>{isEdit ? 'Modifier la figure' : 'Nouvelle figure'}</h1>
      </div>

      <form onSubmit={save} className={styles.form}>
        <div className={styles.row2}>
          <div className="field">
            <label>Nom *</label>
            <input className="input" required value={form.name}
              onChange={e => { set('name', e.target.value); if (!isEdit) set('slug', genSlug(e.target.value)) }} />
          </div>
          <div className="field">
            <label>Slug</label>
            <input className="input" value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="auto-généré" />
          </div>
        </div>

        <div className={styles.row3}>
          <div className="field">
            <label>Catégorie</label>
            <select key={form.category_id} className="input" value={form.category_id} onChange={e => set('category_id', e.target.value)}>
              <option value="">— Choisir —</option>
              {categories.map(c => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Sport</label>
            <select className="input" value={form.sport} onChange={e => set('sport', e.target.value)}>
              <option value="wakeboard">Wakeboard</option>
              <option value="wakeskate">Wakeskate</option>
            </select>
          </div>
          <div className="field">
            <label>Difficulté (1-5)</label>
            <input className="input" type="number" min={1} max={5} value={form.difficulty}
              onChange={e => set('difficulty', e.target.value)} />
          </div>
        </div>

        <div className={styles.tabs}>
          {tabs.map(t => (
            <button key={t.id} type="button"
              className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(t.id)}
            >{t.label}</button>
          ))}
        </div>

        {activeTab === 'fr' && (
          <>
            <div className="field">
              <label>Description (FR)</label>
              <textarea className="input" rows={4} value={form.description}
                onChange={e => set('description', e.target.value)} style={{ resize: 'vertical' }} />
            </div>
            <div className="field">
              <label>Conseils (FR)</label>
              {form.tips.map((tip, i) => (
                <input key={i} className="input" value={tip}
                  onChange={e => setTip('fr', i, e.target.value)}
                  placeholder={`Conseil ${i + 1}…`} style={{ marginBottom: 6 }} />
              ))}
            </div>
          </>
        )}

        {activeTab === 'en' && (
          <>
            <div className="field">
              <label>Description (EN)</label>
              <textarea className="input" rows={4} value={form.description_en}
                onChange={e => set('description_en', e.target.value)} style={{ resize: 'vertical' }}
                placeholder="Leave empty to fallback to French" />
            </div>
            <div className="field">
              <label>Tips (EN)</label>
              {form.tips_en.map((tip, i) => (
                <input key={i} className="input" value={tip}
                  onChange={e => setTip('en', i, e.target.value)}
                  placeholder={`Tip ${i + 1}… (leave empty to fallback to French)`}
                  style={{ marginBottom: 6 }} />
              ))}
            </div>
          </>
        )}

        <div className="field">
          <label>Prérequis</label>
          <div className={styles.prereqList}>
            {allFigures.filter(f => !id || f.id !== parseInt(id)).map(f => (
              <label key={f.id} className={`${styles.prereqItem} ${prereqIds.includes(f.id) ? styles.prereqChecked : ''}`}>
                <input type="checkbox" checked={prereqIds.includes(f.id)} onChange={() => togglePrereq(f.id)} />
                {f.name}
              </label>
            ))}
          </div>
        </div>

        {/* ── Métadonnées ── */}
        <div style={{ borderTop: '1px solid var(--c-border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: 16 }}>

          <CheckGroup
            label="Contextes"
            fieldKey="contexts"
            options={[
              { value: 'kicker',    label: 'Kicker'    },
              { value: 'jib',       label: 'Jib'       },
              { value: 'flat',      label: 'Flat'      },
              { value: 'air_trick', label: 'Air Trick' },
            ]}
          />

          <CheckGroup
            label="Approche"
            fieldKey="approach"
            options={[
              { value: 'hs', label: 'Heelside' },
              { value: 'ts', label: 'Toeside'  },
            ]}
          />

          <CheckGroup
            label="Rotation"
            fieldKey="rotation"
            options={[
              { value: 'fs', label: 'Frontside' },
              { value: 'bs', label: 'Backside'  },
            ]}
          />

          <div className="field">
            <label>Qualificatifs</label>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={form.inverted} onChange={e => set('inverted', e.target.checked)} />
                Inversé (tête en bas)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={form.rewind} onChange={e => set('rewind', e.target.checked)} />
                Rewind
              </label>
            </div>
          </div>

        </div>

        <div className="field" style={{ marginTop: 8 }}>
          <label style={{ flexDirection: 'row', display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={form.published} onChange={e => set('published', e.target.checked)} />
            Publié (visible sur le site)
          </label>
        </div>

        <div className={styles.actions}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/admin/figures')}>Annuler</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer la figure'}
          </button>
        </div>
      </form>
    </div>
  )
}
