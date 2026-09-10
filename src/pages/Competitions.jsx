import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useT } from '../i18n/useT'
import SEO from '../components/SEO'
import CompetitionRibbon from '../components/CompetitionRibbon'
import styles from './Competitions.module.css'

// `date_precision` doit rester dans le select : sans lui, le formateur laisserait
// remonter le 31 décembre fictif des compétitions connues à l'année seule.
const COLS = 'id, name, date_start, date_end, date_precision, wakepark, affiliation, tour_name, cancelled, logo_path'

export default function Competitions() {
  const tr = useT()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from('competitions')
        .select(COLS)
        .eq('published', true)
        // Le futur vers le haut, le passé en descendant : on lit d'abord ce qui
        // arrive, comme un fil d'actualité et non comme une frise scolaire.
        .order('date_start', { ascending: false })
        .order('id', { ascending: false })
        // Plafond explicite : sans lui, la troncature par défaut de PostgREST
        // couperait par la fin, c'est-à-dire les compétitions à venir — celles
        // pour lesquelles on vient. Mieux vaut un plafond franc et lointain.
        .limit(2000)
      if (cancelled) return
      if (error) { setFailed(true); setLoading(false); return }
      setRows(data || [])
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <div className={styles.page}>
      <SEO
        titleFr="Compétitions"
        titleEn="Competitions"
        descriptionFr="Le calendrier des compétitions de wakeboard et wakeskate en cable : dates, lieux, live et vidéos."
        descriptionEn="The cable wakeboard and wakeskate competition calendar: dates, venues, live streams and videos."
        path="/competitions"
      />
      <header className={styles.masthead}>
        <h1 className={styles.title}>{tr.competitions.title}</h1>
        <p className={styles.subtitle}>{tr.competitions.subtitle}</p>
      </header>

      {loading && <span className="spinner" />}
      {failed && <p className={styles.empty}>{tr.competitions.loadError}</p>}
      {!loading && !failed && rows.length === 0 && (
        <p className={styles.empty}>{tr.competitions.none}</p>
      )}

      {!loading && !failed && (
        <CompetitionRibbon rows={rows} suggest />
      )}
    </div>
  )
}
