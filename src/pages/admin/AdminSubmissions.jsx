import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { externalUrl } from '../../lib/url'
import { useToast } from '../../hooks/useToast'
import ToastContainer from '../../components/Toast'
import styles from './AdminSubmissions.module.css'
import Icon from '../../components/Icon'

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const { toasts, toast } = useToast()

  const load = async () => {
    const { data } = await supabase
      .from('video_submissions')
      .select('*, figures(name, slug)')
      .order('submitted_at', { ascending: false })
    setSubmissions(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const review = async (sub, newStatus) => {
    await supabase.from('video_submissions').update({ status: newStatus }).eq('id', sub.id)
    toast(newStatus === 'approved' ? 'Soumission approuvée.' : 'Soumission rejetée.', 'success')
    load()
  }

  const pending  = submissions.filter(s => s.status === 'pending')
  const reviewed = submissions.filter(s => s.status !== 'pending')

  return (
    <div className={styles.page}>
      <ToastContainer toasts={toasts} />
      <h1 className={styles.title}>Soumissions de vidéos</h1>

      {loading && <span className="spinner" />}

      {!loading && pending.length === 0 && (
        <div className={styles.empty}>
          <Icon name="check" style={{ fontSize: 32, color: 'var(--c-success)' }} />
          <p>Aucune soumission en attente.</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className={styles.section}>
          <p className="section-title">En attente ({pending.length})</p>
          {pending.map(s => (
            <SubmissionCard key={s.id} sub={s} onReview={review} />
          ))}
        </div>
      )}

      {reviewed.length > 0 && (
        <div className={styles.section}>
          <p className="section-title">Traités ({reviewed.length})</p>
          {reviewed.map(s => (
            <div key={s.id} className={`${styles.card} ${styles.cardDone}`}>
              <span className={styles.figure}>{s.figures?.name || '—'}</span>
              <a href={externalUrl(s.source_url)} target="_blank" rel="noopener noreferrer" className={styles.url}>
                {s.source_url}
              </a>
              <span
                className="badge"
                style={s.status === 'approved'
                  ? { background: '#22c55e20', color: 'var(--c-success)' }
                  : { background: '#ef444415', color: 'var(--c-danger)' }
                }
              >
                {s.status === 'approved' ? 'Approuvé' : 'Rejeté'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SubmissionCard({ sub, onReview }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardMeta}>
        <span className={styles.figure}>{sub.figures?.name || 'Figure inconnue'}</span>
        <a href={externalUrl(sub.source_url)} target="_blank" rel="noopener noreferrer" className={styles.url}>
          <Icon name="external-link" /> {sub.source_url}
        </a>
        {sub.title && <span className={styles.detail}><strong>Titre :</strong> {sub.title}</span>}
        {sub.creator_name && (
          <span className={styles.detail}>
            <strong>Auteur·ice :</strong>{' '}
            {sub.creator_url
              ? <a href={externalUrl(sub.creator_url)} target="_blank" rel="noopener noreferrer">{sub.creator_name}</a>
              : sub.creator_name
            }
          </span>
        )}
        {sub.caption && <p className={styles.caption}>"{sub.caption}"</p>}
        <span className={styles.date}>
          {new Date(sub.submitted_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </span>
      </div>
      <div className={styles.actions}>
        <button className="btn btn-ghost btn-sm" onClick={() => onReview(sub, 'rejected')}>
          Rejeter
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => onReview(sub, 'approved')}>
          <Icon name="check" /> Approuver
        </button>
      </div>
    </div>
  )
}
