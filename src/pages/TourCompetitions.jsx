import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useT } from '../i18n/useT'
import { externalUrl } from '../lib/url'
import { slugify, todayISO } from '../lib/competitionDates'
import { tourLogoPath, tourPath } from '../lib/competitionAssets'
import SEO from '../components/SEO'
import Icon from '../components/Icon'
import RemoteLogo from '../components/RemoteLogo'
import CompetitionRibbon from '../components/CompetitionRibbon'
import NotFound from './NotFound'
import styles from './TourCompetitions.module.css'

// Mêmes colonnes que l'agenda : c'est le même ruban qui les rend. `tour_url`
// s'ajoute, pour le lien sortant de l'en-tête.
const COLS = 'id, name, date_start, date_end, date_precision, wakepark, affiliation, tour_name, tour_url, cancelled, logo_path'

export default function TourCompetitions() {
  // Repassé par `slugify` : le routeur compare les chemins SANS tenir compte de
  // la casse, donc `/circuit/Le-Pro-Tour` atteint bien cette route — et
  // échouerait à la comparaison ci-dessous, rendant un 404 sur une URL que le
  // routeur venait d'accepter. Même piège que les redirections `/Compo/x`.
  const { slug: rawSlug } = useParams()
  const slug = slugify(rawSlug)
  const tr = useT()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  // L'année du LIEU, pas celle du navigateur — même raison que dans le ruban.
  const year = todayISO().slice(0, 4)

  // La requête ne dépend NI du slug NI de l'année : elle rapporte toutes les
  // compétitions publiées rattachées à un circuit, et le tri se fait au rendu.
  // Passer d'un circuit à l'autre ne relance donc rien.
  //
  // On charge le circuit sur TOUTES ses années, alors que la page n'en montre
  // qu'une. C'est ce qui permet de distinguer les deux silences : un circuit
  // qui n'existe pas (404) et un circuit réel sans étape cette année (on le
  // dit). Restreindre la requête à l'année en cours rendait les deux cas
  // identiques, et un visiteur venu de l'édition précédente tombait sur un 404.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from('competitions')
        .select(COLS)
        .eq('published', true)
        .not('tour_name', 'is', null)
        .order('date_start', { ascending: false })
        .order('id', { ascending: false })
        // Même plafond que l'agenda. Ici le tri décroissant fait que la
        // troncature couperait les plus ANCIENNES : au-delà du plafond, un
        // circuit disparu depuis longtemps rendrait 404 au lieu de dire qu'il
        // n'a pas d'étape cette année. Franc et lointain.
        .limit(2000)
      if (cancelled) return
      if (error) { setFailed(true); setLoading(false); return }
      setRows(data || [])
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  if (loading) return <span className="spinner" role="status" aria-label={tr.loading || 'Chargement'} />
  // Sortie avant l'en-tête : sans elle, un chargement raté rendait le nom du
  // circuit vide au-dessus du message d'erreur.
  if (failed) return <div className={styles.page}><p className={styles.empty}>{tr.competitions.loadError}</p></div>

  // Le slug ne se résout pas en SQL : `slugify` est du JS, et aucune colonne ne
  // porte de slug. La comparaison se fait donc ici, sur des lignes déjà chargées.
  const tourRows = rows.filter(c => slugify(c.tour_name) === slug)
  // L'année de rattachement est celle de la FIN, comme dans le ruban.
  const thisYear = tourRows.filter(c => String(c.date_end || c.date_start).slice(0, 4) === year)

  // Aucune compétition publiée ne porte ce circuit : indiscernable d'une URL
  // inventée, et c'est voulu — sinon l'anon apprendrait qu'un brouillon existe.
  if (tourRows.length === 0) return <NotFound />

  const tourName = tourRows[0]?.tour_name || ''
  const tourUrl = tourRows.find(c => c.tour_url)?.tour_url || null

  return (
    <div className={styles.page}>
      {/* `path` vient de `tourPath` et non d'une chaîne recopiée : une seule
          définition de la forme d'URL, et c'est la forme CANONIQUE — pas celle
          qui a été tapée, dont la casse peut différer. */}
      <SEO
        titleFr={`${tourName} ${year}`}
        titleEn={`${tourName} ${year}`}
        descriptionFr={`Les étapes du circuit ${tourName} en ${year} : dates, lieux, live et vidéos.`}
        descriptionEn={`The ${tourName} tour in ${year}: dates, venues, live streams and videos.`}
        path={tourPath(tourName)}
      />

      <header className={styles.masthead}>
        <RemoteLogo path={tourLogoPath(tourName)} className={styles.logoBox} alt="" height={54} eager />
        <div className={styles.headings}>
          <p className={styles.kicker}>{tr.competitions.tourKicker}</p>
          <h1 className={styles.title}>{tourName}</h1>
          <p className={styles.year}>{year}</p>
        </div>
      </header>

      <div className={styles.links}>
        {tourUrl && (
          <a className={styles.out} href={externalUrl(tourUrl, { ref: true })} target="_blank" rel="noopener noreferrer">
            {tr.competitions.tourSite} <Icon name="external-link" size={13} />
          </a>
        )}
        <Link to="/competitions" className={styles.out}>
          <Icon name="arrow-left" size={13} /> {tr.competitions.allCompetitions}
        </Link>
      </div>

      {/* Le circuit existe, mais pas cette année. On le DIT plutôt que de rendre
          une page muette : le vide annoncé donne rendez-vous, le vide silencieux
          fait partir. */}
      {thisYear.length === 0 && (
        <p className={styles.empty}>{tr.competitions.tourNoneThisYear.split('{year}').join(year)}</p>
      )}

      {/* Sans les mécaniques de frise (`timeline={false}`) : quatre étapes d'une
          même saison n'ont besoin ni de défilement initial, ni de millésime — le
          titre l'annonce —, ni du repère « aujourd'hui », ni d'une forme compacte
          qui ferait lire l'étape passée comme un défaut de rendu. Le passé reste
          reconnaissable à son encre. Pas d'appel à contribution non plus :
          proposer une compétition depuis ici laisserait croire qu'on la
          rattache à ce circuit. */}
      {thisYear.length > 0 && (
        <CompetitionRibbon rows={thisYear} timeline={false} label={`${tourName} ${year}`} />
      )}
    </div>
  )
}
