import { useEffect, useRef, useState } from 'react'
import { Link, useNavigationType } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useT } from '../i18n/useT'
import { useLanguage } from '../contexts/language-context'
import { competitionState, competitionPath, formatCompetitionDate, dateSegments, todayISO } from '../lib/competitionDates'
import SEO from '../components/SEO'
import RemoteLogo from '../components/RemoteLogo'
import styles from './Competitions.module.css'

// Vrai une fois la page montée au moins une fois dans cette session JS. Sert à
// distinguer les deux « POP » que React Router ne sépare pas : le tout premier
// rendu d'une URL ouverte directement (où il faut ancrer) et un retour arrière
// vers une page déjà visitée (où le navigateur restitue une position qu'on ne
// doit pas écraser).
let mountedOnce = false

// `date_precision` doit rester dans le select : sans lui, le formateur laisserait
// remonter le 31 décembre fictif des compétitions connues à l'année seule.
const COLS = 'id, name, date_start, date_end, date_precision, wakepark, affiliation, tour_name, cancelled, logo_path'

export default function Competitions() {
  const tr = useT()
  const { lang } = useLanguage()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const anchorRef = useRef(null)
  const navType = useNavigationType()

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

  // Le fil est chronologique et continu ; c'est le défilement initial qui place
  // le visiteur sur « maintenant ». Sans ça il atterrirait sur la plus ancienne
  // compétition de l'historique.
  //
  // Deux abstentions. Sur un retour arrière (POP), le navigateur restitue la
  // position et `ScrollToTop` s'efface volontairement pour la préserver : on
  // ferait exactement ce que ce composant existe pour éviter. Et si l'ancre est
  // déjà la première ligne, défiler ne ferait que pousser le titre hors écran.
  useEffect(() => {
    if (loading) return
    const isBackNavigation = mountedOnce && navType === 'POP'
    mountedOnce = true
    if (isBackNavigation) return
    const el = anchorRef.current
    if (!el || el === el.parentElement?.firstElementChild) return
    el.scrollIntoView({ block: 'center', behavior: 'instant' })
  }, [loading, navType])

  const now = new Date()
  const states = rows.map(c => competitionState(c, now))
  // L'année du LIEU, pas celle du navigateur : autour du Nouvel An les deux
  // divergent pendant plusieurs heures, et toute la saison en cours basculait
  // alors en forme compacte pour un visiteur à l'étranger.
  const thisYear = todayISO(now).slice(0, 4)
  // Ancre : la compétition en cours, sinon la plus PROCHE à venir. Le tri étant
  // décroissant, celle-ci est la dernière du bloc à venir, juste avant le passé —
  // d'où les `lastIndexOf` plutôt que `indexOf`.
  // `competitionState` exclut déjà les annulées de l'état 'live', donc l'ancre ne
  // peut pas se poser sur un événement qui n'a pas lieu.
  let anchorIdx = states.indexOf('live')
  if (anchorIdx === -1) {
    for (let i = states.length - 1; i >= 0; i--) {
      if (states[i] === 'upcoming' && !rows[i].cancelled) { anchorIdx = i; break }
    }
  }
  if (anchorIdx === -1) anchorIdx = states.lastIndexOf('upcoming')
  if (anchorIdx === -1) anchorIdx = 0

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

      {/* `role="list"` : sous `list-style: none`, Safari/VoiceOver retire la
          sémantique de liste et n'annonce plus le nombre d'entrées. */}
      {!loading && !failed && rows.length > 0 && (
      <ol className={styles.ribbon} role="list" aria-label={tr.competitions.title}>
        {rows.map((c, i) => {
          const state = states[i]
          const isYear = c.date_precision === 'year'
          // L'année de rattachement est celle de la FIN : une compétition du 28
          // décembre au 2 janvier se déroule pour l'essentiel dans l'année qui
          // commence, et c'est là qu'un lecteur la cherchera.
          const year = String(c.date_end || c.date_start).slice(0, 4)
          // Ruptures : le millésime quand l'année change en descendant, et le
          // repère « nous sommes ici » juste avant la première compétition passée.
          const newYear = i === 0 || year !== String(rows[i - 1].date_end || rows[i - 1].date_start).slice(0, 4)
          const firstPast = state === 'past' && (i === 0 || states[i - 1] !== 'past')
          // Sans compétition passée (saison fraîche), le repère n'apparaissait
          // nulle part : on le pose alors sous la dernière ligne à venir.
          const lastAhead = state !== 'past' && i === rows.length - 1 && !states.includes('past')

          // Annulée : traitée comme le passé, elle n'aura pas lieu.
          const tone = c.cancelled ? 'past' : state
          // Forme compacte pour tout ce qui n'est pas imminent : le passé, et
          // les autres années — avant comme après. Ne reste en pleine forme que
          // ce qui arrive dans la saison en cours, c'est-à-dire ce pour quoi on
          // ouvre la page. Le fil redevient parcourable quand l'archive grossit.
          const compact = state === 'past' || year !== thisYear
          return (
            <li
              key={c.id}
              ref={i === anchorIdx ? anchorRef : undefined}
              // Les classes absentes sont filtrées : `styles.upcoming` n'existe pas
              // (l'état par défaut n'a pas de style propre) et interpolait la
              // chaîne « undefined » dans le DOM.
              className={[
                styles.item,
                styles[tone],
                i % 2 ? styles.right : styles.left,
                c.cancelled && styles.cancelled,
                compact && styles.compact,
              ].filter(Boolean).join(' ')}
            >
              {firstPast && (
                <p className={styles.todayMark}><span>{tr.competitions.todayMark}</span></p>
              )}
              {newYear && <p className={styles.year}><span>{year}</span></p>}
              <span className={styles.row}>
              {/* `RemoteLogo` retombe sur les initiales quand le fichier a disparu du
                  bucket : un `<img>` brut laissait une case vide, et la ligne perdait
                  son seul repère visuel. */}
              <RemoteLogo
                path={c.logo_path}
                className={styles.node}
                imgClassName={styles.logo}
                emptyClassName={styles.nodeEmpty}
                fallback={<span className={styles.logoFallback} aria-hidden="true">{[...c.name].slice(0, 2).join('')}</span>}
              />
              <Link to={competitionPath(c)} className={styles.card}>
                <span className={styles.when}>
                  {dateSegments(formatCompetitionDate(c, lang), lang).map((seg, n) => (
                    <span key={n} className={seg.isMonth ? styles.month : undefined}>{seg.text}</span>
                  ))}
                  {isYear && <span className={styles.fuzzy}>{tr.competitions.dateTbd}</span>}
                </span>
                <span className={styles.name}>{c.name}</span>
                {!compact && (
                  <span className={styles.meta}>
                    {c.cancelled && <span className={styles.cancelledTag}>{tr.competitions.cancelled}</span>}
                    {c.wakepark && <span>{c.wakepark}</span>}
                    {c.tour_name && <span>{c.tour_name}</span>}
                    {c.affiliation === 'federal' && <span>{tr.competitions.federal}</span>}
                  </span>
                )}
                {compact && c.cancelled && (
                  <span className={styles.meta}>
                    <span className={styles.cancelledTag}>{tr.competitions.cancelled}</span>
                  </span>
                )}
                {state === 'live' && !c.cancelled && (
                  <span className={styles.liveTape}>
                    <span className={styles.liveDot} aria-hidden="true" />{tr.competitions.live}
                  </span>
                )}
              </Link>
              </span>
              {lastAhead && (
                <p className={`${styles.todayMark} ${styles.todayMarkTail}`}>
                  <span>{tr.competitions.todayMark}</span>
                </p>
              )}
            </li>
          )
        })}
      </ol>
      )}
    </div>
  )
}
