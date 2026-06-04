import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'
import ToastContainer from '../../components/Toast'
import styles from './AdminCompositions.module.css'
import Icon from '../../components/Icon'

const trickCount = (data) =>
  (data?.entries?.length || 0) + (data?.jibPasses?.length || 0) + (data?.otherEntries?.length || 0)

export default function AdminCompositions() {
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const { toasts, toast } = useToast()

  const load = async () => {
    const { data } = await supabase
      .from('compositions')
      .select('id, name, score, data, created_at')
      .order('created_at', { ascending: false })
    setRuns(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const remove = async (run) => {
    if (!window.confirm('Supprimer ce run ?')) return
    const { error } = await supabase.from('compositions').delete().eq('id', run.id)
    if (error) { toast('Échec de la suppression.', 'error'); return }
    toast('Run supprimé.', 'success')
    setRuns(prev => prev.filter(r => r.id !== run.id))
  }

  return (
    <div className={styles.page}>
      <ToastContainer toasts={toasts} />
      <h1 className={styles.title}>Runs sauvegardés</h1>

      {loading && <span className="spinner" />}

      {!loading && runs.length === 0 && (
        <div className={styles.empty}>
          <Icon name="inbox" style={{ fontSize: 32 }} />
          <p>Aucun run sauvegardé pour l'instant.</p>
        </div>
      )}

      {runs.length > 0 && (
        <div className={styles.section}>
          <p className="section-title">{runs.length} run{runs.length > 1 ? 's' : ''}</p>
          {runs.map(r => (
            <div key={r.id} className={styles.card}>
              <div className={styles.meta}>
                <span className={`${styles.name} ${r.name ? '' : styles.unnamed}`}>
                  {r.name || 'Sans nom'}
                </span>
                <span className={styles.sub}>
                  <span>{trickCount(r.data)} figure{trickCount(r.data) > 1 ? 's' : ''}</span>
                  <span>·</span>
                  <span>{new Date(r.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                  <span>·</span>
                  <code>{r.id}</code>
                </span>
              </div>
              <span className={styles.score}>{r.score ?? '—'}/20</span>
              <div className={styles.actions}>
                <Link className="btn btn-ghost btn-sm" to={`/compo/${r.id}`} target="_blank" rel="noopener noreferrer">
                  <Icon name="external-link" /> Voir
                </Link>
                <button className="btn btn-danger btn-sm" onClick={() => remove(r)}>
                  <Icon name="trash" /> Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
