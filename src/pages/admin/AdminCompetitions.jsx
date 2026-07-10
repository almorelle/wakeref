import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listParcours, duplicateParcours, deleteParcours } from '../../lib/competition/api'
import { zonesOnly } from '../../lib/competition/model'
import { useToast } from '../../hooks/useToast'
import ToastContainer from '../../components/Toast'
import Icon from '../../components/Icon'
import styles from './AdminCompetitions.module.css'

const zoneCount = (data) => zonesOnly(data?.parcours || []).length

export default function AdminCompetitions() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const { toasts, toast } = useToast()
  const navigate = useNavigate()

  const load = async () => {
    try { setRows(await listParcours()) } catch { toast('Chargement impossible.', 'error') }
    setLoading(false)
  }
  useEffect(() => { void load() }, [])

  const remove = async (row) => {
    if (!window.confirm(`Supprimer le parcours « ${row.name} » ?`)) return
    try {
      await deleteParcours(row.id)
      toast('Parcours supprimé.', 'success')
      setRows((prev) => prev.filter((r) => r.id !== row.id))
    } catch { toast('Échec de la suppression.', 'error') }
  }

  const duplicate = async (row) => {
    try {
      const { id } = await duplicateParcours(row)
      toast('Parcours dupliqué.', 'success')
      navigate(`/admin/competitions/${id}/edit`)
    } catch { toast('Échec de la duplication.', 'error') }
  }

  return (
    <div className={styles.page}>
      <ToastContainer toasts={toasts} />

      <div className={styles.head}>
        <h1 className={styles.title}>Parcours de compétition</h1>
        <Link className="btn btn-primary btn-sm" to="/admin/competitions/new">
          <Icon name="plus" /> Créer un parcours
        </Link>
      </div>

      {loading && <span className="spinner" />}

      {!loading && rows.length === 0 && (
        <div className={styles.empty}>
          <Icon name="arrow-zig-zag" size={32} />
          <p>Aucun parcours pour l&apos;instant.</p>
        </div>
      )}

      {rows.length > 0 && (
        <div className={styles.section}>
          <p className="section-title">{rows.length} parcours</p>
          {rows.map((r) => (
            <div key={r.id} className={styles.card}>
              <div className={styles.meta}>
                <span className={styles.name}>{r.name}</span>
                <span className={styles.sub}>
                  <span>{zoneCount(r.data)} zone{zoneCount(r.data) > 1 ? 's' : ''}</span>
                  <span>·</span>
                  <span>{new Date(r.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                  <span>·</span>
                  <code>{r.id}</code>
                </span>
              </div>
              <div className={styles.actions}>
                <Link className="btn btn-ghost btn-sm" to={`/competition/${r.id}`} target="_blank" rel="noopener noreferrer">
                  <Icon name="external-link" /> Voir
                </Link>
                <Link className="btn btn-ghost btn-sm" to={`/admin/competitions/${r.id}/edit`}>
                  <Icon name="pencil" /> Éditer
                </Link>
                <button className="btn btn-ghost btn-sm" onClick={() => duplicate(r)}>
                  <Icon name="copy" /> Dupliquer
                </button>
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
