import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { externalUrl } from '../../lib/url'
import { useToast } from '../../hooks/useToast'
import ToastContainer from '../../components/Toast'
import Icon from '../../components/Icon'
import styles from './AdminCompetitionSubmissions.module.css'

const STATUS_LABELS = { pending: 'À traiter', handled: 'Traitée', rejected: 'Écartée' }

// Non traitées en tête, chaque groupe restant du plus récent au plus ancien.
const sortPendingFirst = (rows) => [
  ...rows.filter(r => r.status === 'pending'),
  ...rows.filter(r => r.status !== 'pending'),
]

export default function AdminCompetitionSubmissions() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const { toasts, toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from('competition_submissions')
        .select('id, name, date_text, url, status, created_at')
        .order('created_at', { ascending: false })
      if (cancelled) return
      if (error) { setFailed(true); setLoading(false); return }
      // À traiter d'abord : c'est la seule chose qu'on vient faire ici. Le tri se
      // fait ici et non en SQL — `order('status')` est alphabétique, et rangerait
      // « handled » avant « pending ».
      setRows(sortPendingFirst(data || []))
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [toast])

  const setStatus = async (row, status) => {
    const { data, error } = await supabase.from('competition_submissions')
      .update({ status }).eq('id', row.id).select('id')
    if (error || !data?.length) { toast('Échec de la mise à jour.', 'error'); return }
    setRows(prev => prev.map(r => (r.id === row.id ? { ...r, status } : r)))
    toast({ handled: 'Proposition classée traitée.', rejected: 'Proposition écartée.',
            pending: 'Proposition remise à traiter.' }[status], 'success')
  }

  // Classée AVANT la navigation : sinon la proposition reste « à traiter » et la
  // même compétition se recrée au passage suivant. Réversible par « Rouvrir ».
  const createListing = async (row) => {
    if (row.status === 'pending') await setStatus(row, 'handled')
    navigate('/admin/competitions/new?' + new URLSearchParams({
      nom: row.name, quand: row.date_text, ...(row.url ? { lien: row.url } : {}),
    }))
  }

  const pending = rows.filter(r => r.status === 'pending').length

  return (
    <div className={styles.page}>
      <ToastContainer toasts={toasts} />
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Propositions</h1>
          <p className={styles.sub} aria-live="polite">
            {failed ? '—' : `${pending} à traiter · ${rows.length} au total`}
          </p>
        </div>
      </div>

      {loading && <span className="spinner" role="status" aria-label="Chargement" />}
      {!loading && failed && (
        <p className={styles.empty}>Chargement impossible pour le moment.</p>
      )}
      {!loading && !failed && rows.length === 0 && (
        <p className={styles.empty}>Aucune proposition pour l&apos;instant.</p>
      )}

      <div className={styles.table}>
        {rows.map(r => (
          <div key={r.id} className={`${styles.row} ${r.status !== 'pending' ? styles.done : ''}`}>
            <div className={styles.meta}>
              <span className={styles.rowName}>{r.name}</span>
              <span className={styles.sub2}>
                <span>{r.date_text}</span>
                <span>·</span>
                <span>{new Date(r.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                <span>·</span>
                <span className={styles.status}>{STATUS_LABELS[r.status] || r.status}</span>
              </span>
              {r.url && (
                <a className={styles.link} href={externalUrl(r.url)} target="_blank" rel="noopener noreferrer">
                  {r.url} <Icon name="external-link" size={13} />
                </a>
              )}
            </div>
            <div className={styles.rowActions}>
              {/* Créer la fiche est l'action utile : la proposition n'est qu'un
                  signalement, elle ne devient jamais une compétition toute seule. */}
              <button className="btn btn-primary btn-sm"
                onClick={() => createListing(r)}>
                <Icon name="plus" /> Créer la fiche
              </button>
              {r.status === 'pending' ? (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={() => setStatus(r, 'handled')}>
                    <Icon name="check" /> Traitée
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--c-danger)' }}
                    onClick={() => setStatus(r, 'rejected')}>
                    <Icon name="x" /> Écarter
                  </button>
                </>
              ) : (
                <button className="btn btn-ghost btn-sm" onClick={() => setStatus(r, 'pending')}>
                  <Icon name="arrow-left" /> Rouvrir
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
