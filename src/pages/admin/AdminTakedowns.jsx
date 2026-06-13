import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'
import ToastContainer from '../../components/Toast'
import styles from './AdminTakedowns.module.css'
import Icon from '../../components/Icon'

export default function AdminTakedowns() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const { toasts, toast } = useToast()

  const load = async () => {
    const { data } = await supabase
      .from('takedown_requests')
      .select('*, videos(title, figure_id, figures(name))')
      .order('created_at', { ascending: false })
    setRequests(data || [])
    setLoading(false)
  }

  useEffect(() => { void (async () => { await load() })() }, [])

  const handle = async (req, approve) => {
    if (approve) {
      await supabase.from('videos').update({ takedown_requested: true }).eq('id', req.video_id)
    }
    await supabase.from('takedown_requests').update({ handled: true }).eq('id', req.id)
    toast(approve ? 'Vidéo masquée et demande traitée.' : 'Demande rejetée.', 'success')
    load()
  }

  const pending = requests.filter(r => !r.handled)
  const handled = requests.filter(r => r.handled)

  return (
    <div className={styles.page}>
      <ToastContainer toasts={toasts} />
      <h1 className={styles.title}>Demandes de retrait</h1>

      {loading && <span className="spinner" />}

      {!loading && pending.length === 0 && (
        <div className={styles.empty}>
          <Icon name="check" style={{ fontSize: 32, color: 'var(--c-success)' }} />
          <p>Aucune demande en attente.</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className={styles.section}>
          <p className="section-title">En attente ({pending.length})</p>
          {pending.map(r => (
            <div key={r.id} className={styles.card}>
              <div className={styles.cardMeta}>
                <span className={styles.figure}>{r.videos?.figures?.name || 'Figure inconnue'}</span>
                <span className={styles.detail}>{r.name || 'Anonyme'} — {r.email}</span>
                {r.message && <p className={styles.message}>&quot;{r.message}&quot;</p>}
                <span className={styles.date}>{new Date(r.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className={styles.actions}>
                <button className="btn btn-ghost btn-sm" onClick={() => handle(r, false)}>
                  Rejeter
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handle(r, true)}>
                  <Icon name="eye-off" /> Masquer la vidéo
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {handled.length > 0 && (
        <div className={styles.section}>
          <p className="section-title">Traités ({handled.length})</p>
          {handled.map(r => (
            <div key={r.id} className={`${styles.card} ${styles.cardDone}`}>
              <span className={styles.figure}>{r.videos?.figures?.name || '—'}</span>
              <span className={styles.detail}>{r.email}</span>
              <span className="badge" style={{ background: '#22c55e20', color: 'var(--c-success)' }}>Traité</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
