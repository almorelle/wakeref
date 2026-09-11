import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useT } from '../i18n/useT'
import { externalUrl } from '../lib/url'
import { slugify, todayISO } from '../lib/competitionDates'
import { tourLogoPath, tourPath, FFSNW_URL, FFSNW_LOGO, FEDERAL_PATH } from '../lib/competitionAssets'
import SEO from '../components/SEO'
import Icon from '../components/Icon'
import RemoteLogo from '../components/RemoteLogo'
import CompetitionRibbon from '../components/CompetitionRibbon'
import NotFound from './NotFound'
import styles from './TourCompetitions.module.css'

// Deux pages, une seule forme : celle d'un circuit et celle des compétitions
// fédérales. Toutes deux sont un SOUS-ENSEMBLE de l'agenda, réduit à l'année en
// cours et rendu par le même ruban ; seuls changent le critère et l'en-tête.

// Mêmes colonnes que l'agenda : c'est le même ruban qui les rend. `tour_url`
// s'ajoute, pour le lien sortant de l'en-tête d'un circuit.
const COLS = 'id, name, date_start, date_end, date_precision, wakepark, affiliation, tour_name, tour_url, cancelled, logo_path'

// Les critères sont des constantes de module : passés à l'effet, ils en sont
// une dépendance, et une fonction recréée à chaque rendu relancerait la requête.
const WITH_TOUR = q => q.not('tour_name', 'is', null)
const FEDERAL = q => q.eq('affiliation', 'federal')

// On charge TOUTES les années, alors que la page n'en montre qu'une. Pour un
// circuit, c'est ce qui distingue les deux silences : un circuit qui n'existe
// pas (404) et un circuit réel sans étape cette année (on le dit). Restreindre
// la requête à l'année en cours rendait les deux cas identiques, et un visiteur
// venu de l'édition précédente tombait sur un 404.
function usePublishedCompetitions(narrow) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data, error } = await narrow(
        supabase.from('competitions').select(COLS).eq('published', true)
      )
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
  }, [narrow])

  return { rows, loading, failed }
}

// L'année du LIEU, pas celle du navigateur — même raison que dans le ruban.
// L'année de rattachement d'une compétition est celle de sa FIN, comme dans le ruban.
const currentYear = () => todayISO().slice(0, 4)
const inYear = (rows, year) => rows.filter(c => String(c.date_end || c.date_start).slice(0, 4) === year)

function GroupPage({ seo, logo, kicker, title, year, outUrl, outLabel, rows, emptyText }) {
  const tr = useT()
  return (
    <div className={styles.page}>
      <SEO {...seo} />

      <header className={styles.masthead}>
        <RemoteLogo path={logo} className={styles.logoBox} alt="" height={54} eager />
        <div className={styles.headings}>
          <p className={styles.kicker}>{kicker}</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.year}>{year}</p>
        </div>
      </header>

      <div className={styles.links}>
        {outUrl && (
          <a className={styles.out} href={externalUrl(outUrl, { ref: true })} target="_blank" rel="noopener noreferrer">
            {outLabel} <Icon name="external-link" size={13} />
          </a>
        )}
        <Link to="/competitions" className={styles.out}>
          <Icon name="arrow-left" size={13} /> {tr.competitions.allCompetitions}
        </Link>
      </div>

      {/* Rien cette année. On le DIT plutôt que de rendre une page muette : le
          vide annoncé donne rendez-vous, le vide silencieux fait partir. */}
      {rows.length === 0 && <p className={styles.empty}>{emptyText}</p>}

      {/* Sans les mécaniques de frise (`timeline={false}`) : quelques dates d'une
          même saison n'ont besoin ni de défilement initial, ni de millésime — le
          titre l'annonce —, ni du repère « aujourd'hui », ni d'une forme compacte
          qui ferait lire la compétition passée comme un défaut de rendu. Le passé
          reste reconnaissable à son encre. Pas d'appel à contribution non plus :
          proposer une compétition depuis ici laisserait croire qu'on la
          rattache à ce circuit, ou à la fédération. */}
      {rows.length > 0 && (
        <CompetitionRibbon rows={rows} timeline={false} label={`${title} ${year}`} />
      )}
    </div>
  )
}

const Spinner = () => {
  const tr = useT()
  return <span className="spinner" role="status" aria-label={tr.competitions.loading} />
}

// Sortie avant l'en-tête : sans elle, un chargement raté rendait un titre vide
// au-dessus du message d'erreur.
const LoadError = () => {
  const tr = useT()
  return <div className={styles.page}><p className={styles.empty}>{tr.competitions.loadError}</p></div>
}

export default function TourCompetitions() {
  // Repassé par `slugify` : le routeur compare les chemins SANS tenir compte de
  // la casse, donc `/circuit/Le-Pro-Tour` atteint bien cette route — et
  // échouerait à la comparaison ci-dessous, rendant un 404 sur une URL que le
  // routeur venait d'accepter. Même piège que les redirections `/Compo/x`.
  const { slug: rawSlug } = useParams()
  const slug = slugify(rawSlug)
  const tr = useT()
  // La requête ne dépend pas du slug : elle rapporte toutes les compétitions
  // publiées rattachées à un circuit, et le tri se fait au rendu. Passer d'un
  // circuit à l'autre ne relance donc rien — et deviner un slug de brouillon
  // produit exactement la même requête qu'un slug valide.
  const { rows, loading, failed } = usePublishedCompetitions(WITH_TOUR)
  const year = currentYear()

  if (loading) return <Spinner />
  if (failed) return <LoadError />

  // Le slug ne se résout pas en SQL : `slugify` est du JS, et aucune colonne ne
  // porte de slug. La comparaison se fait donc ici, sur des lignes déjà chargées.
  const tourRows = rows.filter(c => slugify(c.tour_name) === slug)

  // Aucune compétition publiée ne porte ce circuit : indiscernable d'une URL
  // inventée, et c'est voulu — sinon l'anon apprendrait qu'un brouillon existe.
  if (tourRows.length === 0) return <NotFound />

  const tourName = tourRows[0]?.tour_name || ''

  return (
    <GroupPage
      // `path` vient de `tourPath` et non d'une chaîne recopiée : une seule
      // définition de la forme d'URL, et c'est la forme CANONIQUE — pas celle
      // qui a été tapée, dont la casse peut différer.
      seo={{
        titleFr: `${tourName} ${year}`,
        titleEn: `${tourName} ${year}`,
        descriptionFr: `Les étapes du circuit ${tourName} en ${year} : dates, lieux, live et vidéos.`,
        descriptionEn: `The ${tourName} tour in ${year}: dates, venues, live streams and videos.`,
        path: tourPath(tourName),
      }}
      logo={tourLogoPath(tourName)}
      kicker={tr.competitions.tourKicker}
      title={tourName}
      year={year}
      outUrl={tourRows.find(c => c.tour_url)?.tour_url || null}
      outLabel={tr.competitions.tourSite}
      rows={inYear(tourRows, year)}
      emptyText={tr.competitions.tourNoneThisYear.split('{year}').join(year)}
    />
  )
}

// La page n'a pas de 404 : la fédération existe qu'il y ait ou non des
// compétitions publiées, et une année sans date annoncée se dit à l'écran.
export function FederalCompetitions() {
  const tr = useT()
  const { rows, loading, failed } = usePublishedCompetitions(FEDERAL)
  const year = currentYear()

  if (loading) return <Spinner />
  if (failed) return <LoadError />

  return (
    <GroupPage
      seo={{
        titleFr: `Compétitions fédérales ${year}`,
        titleEn: `Federal competitions ${year}`,
        descriptionFr: `Les compétitions de wakeboard cable affiliées à la FFSNW en ${year} : dates, lieux, live et vidéos.`,
        descriptionEn: `Cable wakeboard competitions affiliated to the FFSNW in ${year}: dates, venues, live streams and videos.`,
        path: FEDERAL_PATH,
      }}
      logo={FFSNW_LOGO}
      kicker={tr.competitions.federalKicker}
      title={tr.competitions.federalTitle}
      year={year}
      outUrl={FFSNW_URL}
      outLabel={tr.competitions.federalSite}
      rows={inYear(rows, year)}
      emptyText={tr.competitions.federalNoneThisYear.split('{year}').join(year)}
    />
  )
}
