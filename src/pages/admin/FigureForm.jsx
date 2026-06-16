import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'
import ToastContainer from '../../components/Toast'
import styles from './FigureForm.module.css'
import { useLocation } from 'react-router-dom'
import Icon from '../../components/Icon'

// Un « slot » de type de rotation : un par 360° complet (spin d'abord, puis
// chaque rewind ≥ 360°), plus le cas particulier d'une rotation BS impaire
// (180/540/900…) suivie d'un rewind de 180° — celui-ci étant forcément BS,
// la passe de poignée est imposée (slot `forced`).
// Renvoie des objets { label, forced? } ; source unique pour l'UI et l'enregistrement.
function rotationSlots(spin, rewindDegs, rotation) {
  const slots = []
  const rw = (rewindDegs || []).filter(d => d > 0)
  const isBS = (rotation || []).includes('bs')

  // tours complets du spin
  const spins = Math.floor(spin / 360)
  for (let i = 0; i < spins; i++) {
    slots.push({ label: spins > 1 ? `Spin · ${(i + 1) * 360}°` : 'Spin' })
  }

  // tours complets de chaque rewind ≥ 360°
  const rwFull = rw.filter(d => d >= 360)
  rwFull.forEach((d, ri) => {
    const n = Math.floor(d / 360)
    for (let i = 0; i < n; i++) {
      const base = rwFull.length > 1 ? `Rewind ${ri + 1}` : 'Rewind'
      slots.push({ label: n > 1 ? `${base} · ${(i + 1) * 360}°` : base })
    }
  })

  // spin BS impair + rewind de 180° (forcément BS) ⇒ passe de poignée imposée
  if (spin % 360 === 180 && isBS && rw.includes(180)) {
    slots.push({ label: 'Rewind 180°', forced: 'handle_pass' })
  }

  return slots
}

function Stepper({ label, value, min, max, step, suffix = '', onChange }) {
  const clamp = v => Math.max(min, Math.min(max, v))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label ? <span style={{ fontSize: 12, color: '#888' }}>{label}</span> : null}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button type="button" className="btn btn-ghost" style={{ padding: '4px 11px' }}
          onClick={() => onChange(clamp(value - step))} disabled={value <= min}>−</button>
        <span style={{ minWidth: 54, textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
          {value}{suffix}
        </span>
        <button type="button" className="btn btn-ghost" style={{ padding: '4px 11px' }}
          onClick={() => onChange(clamp(value + step))} disabled={value >= max}>+</button>
      </div>
    </div>
  )
}

const CheckGroup = ({ label, fieldKey, options, form, toggleArray }) => (
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

const SPORT_LABELS = { wakeboard: 'Wakeboard', wakeskate: 'Wakeskate', seated: 'Wakeboard assis' }
// Disciplines pouvant porter un override de tips (la native utilise `tips`).
const OVERRIDE_SPORTS = ['seated', 'wakeskate']
// Pré-remplit une liste de tips éditables : valeurs existantes + une ligne vide.
const padTips = (arr) => {
  const a = arr || []
  return [...a, '', '', '', ''].slice(0, Math.max(4, a.length + 1))
}

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
    sports: ['wakeboard'],
    difficulty: 2, published: true,
    contexts: [],
    approach: [],
    rotation: [],
    inverted: false,
    rewind: false,
    spin: 0,
    rewind_degs: [0],
    rotation_type: [],
    inverts: 0,
    description: '', tips: ['', '', '', ''],
    description_en: '', tips_en: ['', '', '', ''],
    tips_seated: ['', '', '', ''], tips_seated_en: ['', '', '', ''],
    tips_wakeskate: ['', '', '', ''], tips_wakeskate_en: ['', '', '', ''],
  })

  const [prereqIds, setPrereqIds] = useState([])
  const [prereqSearch, setPrereqSearch] = useState('')
  const [builtOnId, setBuiltOnId] = useState(null)
  const [builtOnSearch, setBuiltOnSearch] = useState('')
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
        setBuiltOnId(fig.built_on_id || null)
        setForm({
          name: fig.name,
          slug: fig.slug,
          category_id: String(fig.category_id || ''),
          sport: fig.sport,
          sports: (fig.sports && fig.sports.length) ? fig.sports : [fig.sport],
          difficulty: fig.difficulty,
          published: fig.published,
          contexts: fig.contexts || [],
          approach: fig.approach || [],
          rotation: fig.rotation || [],
          inverted: fig.inverted || false,
          rewind: fig.rewind || false,
          spin: fig.spin || 0,
          rewind_degs: (fig.rewind_degs && fig.rewind_degs.length) ? fig.rewind_degs : [0],
          rotation_type: fig.rotation_type || [],
          inverts: fig.inverts || 0,
          description: fig.description || '',
          tips: [...(fig.tips || []), '', '', '', ''].slice(0, Math.max(4, (fig.tips || []).length + 1)),
          description_en: fig.description_en || '',
          tips_en: [...(fig.tips_en || []), '', '', '', ''].slice(0, Math.max(4, (fig.tips_en || []).length + 1)),
          tips_seated: padTips(fig.tips_seated),
          tips_seated_en: padTips(fig.tips_seated_en),
          tips_wakeskate: padTips(fig.tips_wakeskate),
          tips_wakeskate_en: padTips(fig.tips_wakeskate_en),
        })
      }
      setLoading(false)
    })
  }, [id, isEdit])

  const genSlug = (name) =>
    name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const setRewind = (i, v) => setForm(f => { const a = [...f.rewind_degs]; a[i] = v; return { ...f, rewind_degs: a } })
  const addRewind = () => setForm(f => ({ ...f, rewind_degs: [...f.rewind_degs, 180] }))
  const removeRewind = (i) => setForm(f => {
    const a = f.rewind_degs.filter((_, j) => j !== i)
    return { ...f, rewind_degs: a.length ? a : [0] }
  })

  const setRotationType = (i, v) => setForm(f => {
    const a = [...f.rotation_type]
    while (a.length <= i) a.push('')
    a[i] = v
    return { ...f, rotation_type: a }
  })

  const setTip = (lang, i, v) => setTipList(lang === 'en' ? 'tips_en' : 'tips', i, v)

  // Édite une liste de tips quelconque (tips, tips_en, tips_seated, …) et fait
  // pousser une ligne vide quand on remplit la dernière.
  const setTipList = (key, i, v) => setForm(f => {
    const tips = [...(f[key] || [])]
    tips[i] = v
    if (v && i === tips.length - 1) tips.push('')
    return { ...f, [key]: tips }
  })

  // Changer la discipline native : l'ancienne native était auto-incluse dans
  // `sports` (pas un choix explicite) → on la retire, on garde les memberships
  // cochés + la nouvelle native en tête. Évite un membership fantôme.
  const setSport = (v) => setForm(f => ({
    ...f, sport: v, sports: [v, ...(f.sports || []).filter(s => s !== f.sport && s !== v)],
  }))

  const toggleArray = (key, value) => {
    setForm(f => {
      const arr = f[key] || []
      const next = arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value]
      return { ...f, [key]: next }
    })
  }

  const addPrereq = (figId) => {
    setPrereqIds(prev => prev.includes(figId) ? prev : [...prev, figId])
    setPrereqSearch('')
  }
  const removePrereq = (figId) => setPrereqIds(prev => prev.filter(x => x !== figId))

  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    // Appartenance : la native est toujours incluse (contrainte DB).
    const sports = Array.from(new Set([form.sport, ...(form.sports || [])]))
    // Un override n'a de sens que pour une discipline MEMBRE et NON-native ;
    // sinon on n'écrit rien → pas d'override orphelin si on décoche / bascule.
    const overrideFor = (key, d) =>
      (d !== form.sport && sports.includes(d)) ? form[key].filter(t => t.trim()) : []
    const payload = {
      ...form,
      slug: form.slug || genSlug(form.name),
      category_id: form.category_id ? parseInt(form.category_id) : null,
      built_on_id: builtOnId || null,
      difficulty: parseInt(form.difficulty),
      contexts: form.contexts,
      approach: form.approach,
      rotation: form.rotation,
      spin: form.spin,
      rewind_degs: form.rewind_degs.filter(v => v > 0),
      // une entrée par 360° complet (spin puis rewinds), dans l'ordre ;
      // vide → null (position conservée)
      rotation_type: rotationSlots(form.spin, form.rewind_degs, form.rotation)
        .map((slot, i) => slot.forced || form.rotation_type[i] || null),
      inverts: form.inverts,
      inverted: form.inverts > 0,                  // legacy, dérivé de inverts
      rewind: form.rewind_degs.some(v => v > 0),   // legacy, dérivé de rewind_degs
      tips: form.tips.filter(t => t.trim()),
      tips_en: form.tips_en.filter(t => t.trim()),
      sports,
      tips_seated: overrideFor('tips_seated', 'seated'),
      tips_seated_en: overrideFor('tips_seated_en', 'seated'),
      tips_wakeskate: overrideFor('tips_wakeskate', 'wakeskate'),
      tips_wakeskate_en: overrideFor('tips_wakeskate_en', 'wakeskate'),
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
            <select className="input" value={form.sport} onChange={e => setSport(e.target.value)}>
              <option value="wakeboard">Wakeboard</option>
              <option value="wakeskate">Wakeskate</option>
              <option value="seated">Wakeboard assis</option>
            </select>
          </div>
          <div className="field">
            <label>Difficulté (1-5)</label>
            <input className="input" type="number" min={1} max={5} value={form.difficulty}
              onChange={e => set('difficulty', e.target.value)} />
          </div>
        </div>

        <CheckGroup
          label="Aussi praticable en"
          fieldKey="sports"
          options={['wakeboard', 'wakeskate', 'seated']
            .filter(d => d !== form.sport)
            .map(d => ({ value: d, label: SPORT_LABELS[d] }))}
          form={form}
          toggleArray={toggleArray}
        />

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
            {OVERRIDE_SPORTS
              .filter(d => d !== form.sport && (form.sports || []).includes(d))
              .map(d => (
                <div className="field" key={d}>
                  <label>Conseils {SPORT_LABELS[d]} (FR) — override</label>
                  {form[`tips_${d}`].map((tip, i) => (
                    <input key={i} className="input" value={tip}
                      onChange={e => setTipList(`tips_${d}`, i, e.target.value)}
                      placeholder="Vide → hérite des conseils par défaut" style={{ marginBottom: 6 }} />
                  ))}
                </div>
              ))}
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
            {OVERRIDE_SPORTS
              .filter(d => d !== form.sport && (form.sports || []).includes(d))
              .map(d => (
                <div className="field" key={d}>
                  <label>Tips {SPORT_LABELS[d]} (EN) — override</label>
                  {form[`tips_${d}_en`].map((tip, i) => (
                    <input key={i} className="input" value={tip}
                      onChange={e => setTipList(`tips_${d}_en`, i, e.target.value)}
                      placeholder="Empty → inherits default tips" style={{ marginBottom: 6 }} />
                  ))}
                </div>
              ))}
          </>
        )}

        <div className="field">
          <label>Prérequis</label>
          {prereqIds.length > 0 && (
            <div className={styles.prereqChips}>
              {prereqIds.map(pid => {
                const f = allFigures.find(x => x.id === pid)
                return (
                  <span key={pid} className={styles.prereqChip}>
                    {f ? f.name : `#${pid}`}
                    <button type="button" className={styles.prereqChipRemove}
                      onClick={() => removePrereq(pid)} aria-label="Retirer">×</button>
                  </span>
                )
              })}
            </div>
          )}
          <div className={styles.prereqSearch}>
            <input className="input" value={prereqSearch}
              onChange={e => setPrereqSearch(e.target.value)}
              placeholder="Rechercher une figure à ajouter…" />
            {prereqSearch.trim() && (() => {
              const results = allFigures.filter(f =>
                (!id || f.id !== parseInt(id)) &&
                !prereqIds.includes(f.id) &&
                norm(f.name).includes(norm(prereqSearch))
              ).slice(0, 8)
              return (
                <div className={styles.prereqResults}>
                  {results.length === 0
                    ? <div className={styles.prereqNoResult}>Aucune figure trouvée</div>
                    : results.map(f => (
                        <button key={f.id} type="button" className={styles.prereqResult}
                          onClick={() => addPrereq(f.id)}>
                          {f.name}
                        </button>
                      ))}
                </div>
              )
            })()}
          </div>
        </div>

        <div className="field">
          <label>Précédent</label>
          {builtOnId ? (
            <div className={styles.prereqChips}>
              <span className={styles.prereqChip}>
                {(() => { const f = allFigures.find(x => x.id === builtOnId); return f ? f.name : `#${builtOnId}` })()}
                <button type="button" className={styles.prereqChipRemove}
                  onClick={() => setBuiltOnId(null)} aria-label="Retirer">×</button>
              </span>
            </div>
          ) : (
            <div className={styles.prereqSearch}>
              <input className="input" value={builtOnSearch}
                onChange={e => setBuiltOnSearch(e.target.value)}
                placeholder="Rechercher la figure précédente…" />
              {builtOnSearch.trim() && (() => {
                const results = allFigures.filter(f =>
                  (!id || f.id !== parseInt(id)) &&
                  norm(f.name).includes(norm(builtOnSearch))
                ).slice(0, 8)
                return (
                  <div className={styles.prereqResults}>
                    {results.length === 0
                      ? <div className={styles.prereqNoResult}>Aucune figure trouvée</div>
                      : results.map(f => (
                          <button key={f.id} type="button" className={styles.prereqResult}
                            onClick={() => { setBuiltOnId(f.id); setBuiltOnSearch('') }}>
                            {f.name}
                          </button>
                        ))}
                  </div>
                )
              })()}
            </div>
          )}
        </div>

        {/* ── Métadonnées ── */}
        <div style={{ borderTop: '1px solid var(--c-border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: 16 }}>

          <CheckGroup
            label="Contextes"
            fieldKey="contexts"
            options={[
              { value: 'kicker',    label: 'Kicker'    },
              { value: 'feature',   label: 'Module'    },
              { value: 'flat',      label: 'Flat'      },
              { value: 'air_trick', label: 'Air Trick' },
            ]}
            form={form}
            toggleArray={toggleArray}
          />

          <CheckGroup
            label="Approche"
            fieldKey="approach"
            options={[
              { value: 'hs', label: 'Heelside' },
              { value: 'ts', label: 'Toeside'  },
            ]}
            form={form}
            toggleArray={toggleArray}
          />

          <CheckGroup
            label="Sens de rotation"
            fieldKey="rotation"
            options={[
              { value: 'fs', label: 'Frontside' },
              { value: 'bs', label: 'Backside'  },
            ]}
            form={form}
            toggleArray={toggleArray}
          />

          <div className="field">
            <label>Rotation &amp; invert</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
              <Stepper label="Spin" value={form.spin} min={0} max={1440} step={180} suffix="°" onChange={v => set('spin', v)} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, color: '#888' }}>Rewind</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  {form.rewind_degs.map((v, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Stepper label="" value={v} min={0} max={1080} step={180} suffix="°" onChange={nv => setRewind(i, nv)} />
                      {form.rewind_degs.length > 1 && (
                        <button type="button" className={styles.rewindRemove} onClick={() => removeRewind(i)}>×</button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="btn btn-ghost" style={{ padding: '3px 10px', fontSize: 12 }} onClick={addRewind}>+ rewind</button>
                </div>
              </div>

              {(() => {
                const slots = rotationSlots(form.spin, form.rewind_degs, form.rotation)
                if (!slots.length) return null
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 12, color: '#888' }}>Type de rotation (par 360°)</span>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
                      {slots.map((slot, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: 11, color: '#888' }}>{slot.label}</span>
                          <select className="input" style={{ minWidth: 130 }}
                            value={slot.forced || form.rotation_type[i] || ''}
                            disabled={!!slot.forced}
                            onChange={e => setRotationType(i, e.target.value)}>
                            <option value="">—</option>
                            <option value="ole">Ole</option>
                            <option value="handle_pass">Handle pass</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              <Stepper label="Inverts (flips)" value={form.inverts} min={0} max={5} step={1} onChange={v => set('inverts', v)} />
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
