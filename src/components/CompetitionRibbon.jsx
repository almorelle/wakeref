import { useEffect, useRef } from 'react'
import { Link, useNavigationType } from 'react-router-dom'
import { useT } from '../i18n/useT'
import { useLanguage } from '../contexts/language-context'
import { competitionState, competitionPath, formatCompetitionDate, dateSegments, todayISO } from '../lib/competitionDates'
import RemoteLogo from './RemoteLogo'
import styles from './CompetitionRibbon.module.css'

// Vrai une fois le ruban monté au moins une fois dans cette session JS. Sert à
// distinguer les deux « POP » que React Router ne sépare pas : le tout premier
// rendu d'une URL ouverte directement (où il faut ancrer) et un retour arrière
// vers une page déjà visitée (où le navigateur restitue une position qu'on ne
// doit pas écraser).
let mountedOnce = false

/**
 * Le fil des compétitions : une ligne de temps verticale, le futur en haut.
 *
 * Les lignes arrivent DÉJÀ triées et filtrées — le composant ne requête rien.
 * C'est ce qui lui permet de servir aussi bien l'agenda complet qu'une page de
 * circuit restreinte à une année : la même apparence, deux jeux de données.
 *
 * `suggest` : la ligne d'appel à contribution, posée en tête. Elle n'existe que
 * sur l'agenda complet — proposer une compétition depuis la page d'un circuit
 * laisserait croire qu'on la rattache à ce circuit.
 *
 * `anchorToToday` : au chargement, faire défiler jusqu'à « aujourd'hui ». Utile
 * sur un fil long, contre-productif sur une liste courte, où défiler ne ferait
 * que pousser le titre de la page hors de l'écran.
 *
 * `showYears` : les séparateurs de millésime. Inutiles quand la liste tient dans
 * une seule année et que la page l'annonce déjà dans son titre — les répéter
 * quarante pixels plus bas n'ajoute rien, et sur une saison terminée le repère
 * « aujourd'hui » se retrouvait au-dessus du millésime, en tête de page.
 *
 * `label` : ce que le lecteur d'écran annonce en entrant dans la liste. Sur une
 * page de circuit, « Compétitions » serait vrai mais inutile — c'est le nom du
 * circuit qui situe.
 */
export default function CompetitionRibbon({ rows, suggest = false, anchorToToday = true, showYears = true, label }) {
  const tr = useT()
  const { lang } = useLanguage()
  const anchorRef = useRef(null)
  const navType = useNavigationType()

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

  // Le fil est chronologique et continu ; c'est le défilement initial qui place
  // le visiteur sur « maintenant ». Sans ça il atterrirait sur la plus ancienne
  // compétition de l'historique.
  //
  // Deux abstentions. Sur un retour arrière (POP), le navigateur restitue la
  // position et `ScrollToTop` s'efface volontairement pour la préserver : on
  // ferait exactement ce que ce composant existe pour éviter. Et si l'ancre est
  // déjà la première ligne, défiler ne ferait que pousser le titre hors écran.
  useEffect(() => {
    // Posé AVANT toute sortie : le drapeau décrit « le ruban a déjà été monté
    // dans cette session », un fait indépendant de la décision d'ancrer.
    const dejaMonte = mountedOnce
    mountedOnce = true
    if (!anchorToToday) return
    if (dejaMonte && navType === 'POP') return
    const el = anchorRef.current
    if (!el || el === el.parentElement?.firstElementChild) return
    el.scrollIntoView({ block: 'center', behavior: 'instant' })
  }, [anchorToToday, navType])

  return (
    /* `role="list"` : sous `list-style: none`, Safari/VoiceOver retire la
       sémantique de liste et n'annonce plus le nombre d'entrées. */
    <ol className={styles.ribbon} role="list" aria-label={label || tr.competitions.title}>
      {suggest && (
        /* Première entrée du fil, au-dessus du premier millésime : on vient
           signaler une compétition à VENIR, et le futur est en haut. Même
           gabarit qu'une compétition — pastille au centre, carte sur le côté —
           pour qu'elle se lise comme une ligne du calendrier et non comme un
           encart. `right` : la première vraie entrée est à gauche, le zigzag
           continue. Ni date ni méta, seul le libellé. */
        <li className={[styles.item, styles.right].filter(Boolean).join(' ')}>
          {/* Un SEUL lien pour la ligne entière : le carré et le libellé sont
              deux poignées de la même destination, et deux <a> vers la même
              cible s'annoncent en double au lecteur d'écran. C'est donc le lien
              qui porte la grille — et il ne reçoit les clics que sur ses deux
              cellules pleines, jamais sur la colonne vide qui court sur toute
              la largeur de la page. */}
          <Link to="/competitions/proposer" className={`${styles.row} ${styles.suggestRow}`}>
            <span className={`${styles.node} ${styles.nodeEmpty} ${styles.suggestNode}`}>
              <span className={styles.suggestMark} aria-hidden="true">?</span>
            </span>
            <span className={styles.card}>
              <span className={styles.name}>{tr.competitions.suggest}</span>
            </span>
          </Link>
        </li>
      )}
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
            {showYears && newYear && <p className={styles.year}><span>{year}</span></p>}
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
  )
}
