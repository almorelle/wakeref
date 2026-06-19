import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'
import ToastContainer from '../../components/Toast'
import Icon from '../../components/Icon'
import styles from './AdminJudgeRuns.module.css'

const DISCIPLINE_LABELS = { wakeboard: 'Wakeboard', wakeskate: 'Wakeskate', seated: 'Assis' }
const DIFFICULTY_LABELS = { easy: 'Facile', medium: 'Moyen', hard: 'Difficile' }

export default function AdminJudgeRuns() {
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const { toasts, toast } = useToast()
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('judge_runs')
      .select('id, name, discipline, difficulty, published, video_path')
      .order('created_at', { ascending: false })
    setRuns(data || [])
    setLoading(false)
  }

  useEffect(() => { void (async () => { await load() })() }, [])

  const deleteRun = async (r) => {
    if (!confirm(`Supprimer "${r.name}" ? Cette action est irréversible.`)) return
    if (r.video_path) await supabase.storage.from('videos').remove([r.video_path])
    await supabase.from('judge_runs').delete().eq('id', r.id)
    setRuns(prev => prev.filter(x => x.id !== r.id))
    toast('Run supprimé', 'success')
  }

  return (
    <div className={styles.page}>
      <ToastContainer toasts={toasts} />
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Runs juge</h1>
          <p className={styles.sub} aria-live="polite">{runs.length} run{runs.length > 1 ? 's' : ''} de référence</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/judge-runs/new')}>
          <Icon name="plus" /> Nouveau run
        </button>
      </div>

      {loading && <span className="spinner" />}

      {!loading && runs.length === 0 && (
        <p className={styles.empty}>{"Aucun run de référence pour l'instant."}</p>
      )}

      <div className={styles.table}>
        {runs.map(r => (
          <div key={r.id} className={styles.row}>
            <div className={styles.rowName}>
              {r.name}
              <div className={styles.badges}>
                <span className={styles.badge}>{DISCIPLINE_LABELS[r.discipline] || r.discipline}</span>
                <span className={styles.badge}>{DIFFICULTY_LABELS[r.difficulty] || r.difficulty}</span>
                {!r.published && <span className={styles.unpub}>Non publié</span>}
              </div>
            </div>
            <div className={styles.rowActions}>
              <button className="btn btn-ghost btn-sm btn-icon" title="Modifier" aria-label={`Modifier ${r.name}`}
                onClick={() => navigate(`/admin/judge-runs/${r.id}/edit`)}>
                <Icon name="pencil" />
              </button>
              <button className="btn btn-ghost btn-sm btn-icon" title="Supprimer" aria-label={`Supprimer ${r.name}`}
                style={{ color: 'var(--c-danger)' }} onClick={() => deleteRun(r)}>
                <Icon name="trash" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
