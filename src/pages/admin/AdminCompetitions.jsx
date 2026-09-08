import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatCompetitionDate } from '../../lib/competitionDates'
import { useToast } from '../../hooks/useToast'
import ToastContainer from '../../components/Toast'
import Icon from '../../components/Icon'
import styles from './AdminCompetitions.module.css'

const AFFILIATION_LABELS = { federal: 'Fédérale', independent: 'Indépendante' }

export default function AdminCompetitions() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const { toasts, toast } = useToast()
  const navigate = useNavigate()

  // Chargement inline plutôt qu'une fonction `load` externe : non mémoïsée, elle
  // serait recréée à chaque rendu et manquerait au tableau de dépendances.
  // `toast` y figure et est stable (useCallback), donc pas de boucle. Les
  // mutations ci-dessous mettent l'état à jour localement, sans rechargement.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from('competitions')
        .select('id, name, date_start, date_end, date_precision, wakepark, affiliation, cancelled, published, logo_path, poster_path')
        .order('date_start', { ascending: false })
        .order('id', { ascending: false })
      if (cancelled) return
      // Sur erreur on ne remplace pas par [] : « Aucune compétition » et un
      // chargement raté seraient indistinguables une fois le toast disparu.
      if (error) { toast('Chargement impossible.', 'error'); setLoading(false); return }
      setRows(data || [])
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [toast])

  // Annulation réversible : la fiche reste, elle est seulement barrée. On ne
  // supprime que ce dont la suppression ne fait rien perdre (cf. bouton poubelle).
  const toggleCancelled = async (c) => {
    const next = !c.cancelled
    const { data, error } = await supabase.from('competitions')
      .update({ cancelled: next }).eq('id', c.id).select('id')
    // Sans `.select()`, un update qui ne touche aucune ligne (fiche supprimée
    // ailleurs, RLS) ne renvoie pas d'erreur et l'écran mentirait.
    if (error || !data?.length) { toast('Échec de la mise à jour.', 'error'); return }
    setRows(prev => prev.map(x => (x.id === c.id ? { ...x, cancelled: next } : x)))
    toast(next ? 'Compétition marquée annulée.' : 'Annulation levée.', 'success')
  }

  const remove = async (c) => {
    if (!confirm(`Supprimer "${c.name}" ? Cette action est irréversible.`)) return
    // La ligne d'abord : l'inverse détruisait le logo même quand la suppression
    // échouait, laissant une fiche listée avec une image morte.
    const { error } = await supabase.from('competitions').delete().eq('id', c.id)
    if (error) { toast('Échec de la suppression.', 'error'); return }
    const images = [c.poster_path, c.logo_path].filter(Boolean)
    if (images.length) await supabase.storage.from('videos').remove(images)
    setRows(prev => prev.filter(x => x.id !== c.id))
    toast('Compétition supprimée.', 'success')
  }

  return (
    <div className={styles.page}>
      <ToastContainer toasts={toasts} />
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Compétitions</h1>
          <p className={styles.sub} aria-live="polite">
            {rows.length} compétition{rows.length > 1 ? 's' : ''} référencée{rows.length > 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/competitions/new')}>
          <Icon name="plus" /> Nouvelle compétition
        </button>
      </div>

      {loading && <span className="spinner" />}

      {!loading && rows.length === 0 && (
        <p className={styles.empty}>{"Aucune compétition pour l'instant."}</p>
      )}

      <div className={styles.table}>
        {rows.map(c => (
          <div key={c.id} className={styles.row}>
            <div className={styles.rowName}>
              <span className={c.cancelled ? styles.struck : undefined}>{c.name}</span>
              <div className={styles.badges}>
                <span className={styles.badge}>{formatCompetitionDate(c)}</span>
                {c.wakepark && <span className={styles.badge}>{c.wakepark}</span>}
                <span className={styles.badge}>{AFFILIATION_LABELS[c.affiliation] || c.affiliation}</span>
                {c.cancelled && <span className={styles.cancelled}>Annulée</span>}
                {!c.published && <span className={styles.unpub}>Non publiée</span>}
              </div>
            </div>
            <div className={styles.rowActions}>
              <button className="btn btn-ghost btn-sm btn-icon" title="Modifier" aria-label={`Modifier ${c.name}`}
                onClick={() => navigate(`/admin/competitions/${c.id}/edit`)}>
                <Icon name="pencil" />
              </button>
              <button className="btn btn-ghost btn-sm btn-icon"
                title={c.cancelled ? 'Lever l’annulation' : 'Marquer annulée'}
                aria-label={`${c.cancelled ? 'Lever l’annulation de' : 'Marquer annulée'} ${c.name}`}
                onClick={() => toggleCancelled(c)}>
                <Icon name={c.cancelled ? 'refresh' : 'x'} />
              </button>
              <button className="btn btn-ghost btn-sm btn-icon" title="Supprimer" aria-label={`Supprimer ${c.name}`}
                style={{ color: 'var(--c-danger)' }} onClick={() => remove(c)}>
                <Icon name="trash" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
