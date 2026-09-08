import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useT } from '../i18n/useT'
import { useLanguage } from '../contexts/language-context'
import {
  competitionState, competitionPath, formatCompetitionDate, idFromParam, dateSegments,
} from '../lib/competitionDates'
import SEO from '../components/SEO'
import Icon from '../components/Icon'
import NotFound from './NotFound'
import VideoCard from '../components/VideoCards'
import RemoteLogo from '../components/RemoteLogo'
import { FFSNW_URL, FFSNW_LOGO, tourLogoPath } from '../lib/competitionAssets'
import styles from './CompetitionDetail.module.css'

// Colonnes explicites plutôt que `*` : la fiche est publique, et toute colonne
// ajoutée plus tard au lot A partirait sinon dans le navigateur sans décision.
const COLS = `id, name, date_start, date_end, date_precision, wakepark, affiliation,
  tour_name, tour_url, cancelled, info_url, entry_url, live_video_url,
  live_scoring_url, organiser_instagram_url, wakepark_url, poster_path`

// Les liens sont en deux groupes : ce qui se fait MAINTENANT (suivre, s'inscrire)
// et le reste. Six lignes identiques ne se hiérarchisaient pas ; là, ce qui est
// actionnable pendant la compétition se voit en premier et en grand.
const PRIMARY = [
  { key: 'live_video_url',   labelKey: 'liveVideo',   icon: 'brand-youtube' },
  { key: 'live_scoring_url', labelKey: 'liveScoring', icon: 'list'          },
  { key: 'entry_url',        labelKey: 'entry',       icon: 'send'          },
]
const SECONDARY = [
  { key: 'info_url',                labelKey: 'info',         icon: 'info-circle'     },
  { key: 'organiser_instagram_url', labelKey: 'organiser',    icon: 'home'            },
  { key: 'wakepark_url',            labelKey: 'wakeparkLink', icon: 'link', tape: 'wakepark' },
]

// Le composant est re-monté à chaque changement d'URL (`key`), ce qui remet
// `loading` à true sans setState synchrone dans un effet — passer d'une fiche
// suggérée à une autre repart donc d'un état propre.
export default function CompetitionDetailRoute() {
  const { idSlug } = useParams()
  return <CompetitionDetail key={idSlug} idSlug={idSlug} />
}

function CompetitionDetail({ idSlug }) {
  const id = idFromParam(idSlug)
  const tr = useT()
  const { lang } = useLanguage()
  const [comp, setComp] = useState(null)
  const [videos, setVideos] = useState([])
  const [videosFailed, setVideosFailed] = useState(false)
  const [siblings, setSiblings] = useState([])
  const [loading, setLoading] = useState(!!id)
  // Distingué de « introuvable » : un incident réseau ne doit pas afficher un 404
  // (avec son noindex) sur une URL bien vivante et présente dans le sitemap.
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase.from('competitions')
        .select(COLS).eq('id', id).eq('published', true).single()
      if (cancelled) return
      // PGRST116 = aucune ligne : c'est le seul cas qui est vraiment un 404.
      if (error && error.code !== 'PGRST116') { setFailed(true); setLoading(false); return }
      if (!data) { setLoading(false); return }
      setComp(data)
      // La fiche est lisible dès maintenant : les deux requêtes annexes ne
      // doivent plus retarder l'affichage, et elles sont indépendantes.
      setLoading(false)

      const year = String(data.date_start).slice(0, 4)
      const [{ data: vids, error: vErr }, { data: sib, error: sErr }] = await Promise.all([
        supabase.from('competition_videos')
          .select('id, url, title').eq('competition_id', id)
          .order('sort_order').order('id'),
        // Suggestions : même typologie, même année. Pas de pertinence calculée —
        // deux critères factuels, et l'ordre reste chronologique.
        supabase.from('competitions')
          .select('id, name, date_start, date_end, date_precision, cancelled')
          .eq('published', true).eq('affiliation', data.affiliation)
          .gte('date_start', `${year}-01-01`).lte('date_start', `${year}-12-31`)
          .neq('id', id).order('date_start').order('id'),
      ])
      if (cancelled) return
      // Une liste vide et une liste qu'on n'a pas pu lire ne disent pas la même
      // chose : la seconde ne doit pas affirmer « pas de vidéo ».
      setVideosFailed(!!vErr)
      setVideos(vids || [])
      if (!sErr) setSiblings(sib || [])
    })()
    return () => { cancelled = true }
  }, [id])

  if (loading) return <span className="spinner" role="status" aria-label={tr.competitions.loading} />
  if (failed) return <p className={styles.loadError}>{tr.competitions.loadError}</p>
  if (!comp) return <NotFound />

  const state = competitionState(comp)
  const isYear = comp.date_precision === 'year'
  const when = formatCompetitionDate(comp, lang)
  // Chaque description porte la date dans SA langue : `when` suit la langue
  // active, l'injecter dans les deux produirait une date française dans le texte
  // anglais dès que <SEO> émettra des alternates.
  const suffixFr = formatCompetitionDate(comp, 'fr') + (comp.wakepark ? ` — ${comp.wakepark}` : '')
  const suffixEn = formatCompetitionDate(comp, 'en') + (comp.wakepark ? ` — ${comp.wakepark}` : '')

  return (
    <div className={styles.page}>
      <SEO
        titleFr={comp.name}
        titleEn={comp.name}
        descriptionFr={`${suffixFr}. Infos, live et vidéos de la compétition.`}
        descriptionEn={`${suffixEn}. Info, live stream and videos of the competition.`}
        path={competitionPath(comp)}
      />

      <div className={styles.back}>
        <Link to="/competitions" className="btn btn-ghost btn-sm">
          <Icon name="arrow-left" /> {tr.competitions.title}
        </Link>
      </div>

      <header className={styles.masthead}>
        {/* L'affiche dans son format d'origine : ni recadrée ni étirée, on ne
            sait pas ce que l'organisateur a produit. */}
        {comp.poster_path && (
          <div className={styles.posterWrap}>
            <RemoteLogo path={comp.poster_path} imgClassName={styles.poster} />
          </div>
        )}
        <p className={styles.when}>
          {dateSegments(when, lang).map((seg, n) => (
            <span key={n} className={seg.isMonth ? styles.month : undefined}>{seg.text}</span>
          ))}
          {isYear && <span className={styles.fuzzy}>{tr.competitions.dateTbd}</span>}
        </p>
        <h1 className={`${styles.title} ${comp.cancelled ? styles.struck : ''}`}>{comp.name}</h1>
        {(state === 'live' || comp.cancelled) && (
          <p className={styles.meta}>
            {state === 'live' && !isYear && (
              <span className={styles.liveTag}><span className={styles.dot} aria-hidden="true" />{tr.competitions.live}</span>
            )}
            {comp.cancelled && <span className={styles.cancelledTag}>{tr.competitions.cancelled}</span>}
          </p>
        )}

        {/* L'appartenance, dite une seule fois et illustrée. Le wakepark et la
            typologie ne sont plus répétés en texte ici : le premier a son lien
            plus bas, la seconde se lit au logo. */}
        {(comp.affiliation === 'federal' || comp.tour_name) && (
          <div className={styles.affil}>
            {comp.affiliation === 'federal' && (
              <a className={styles.affilItem} href={FFSNW_URL} target="_blank" rel="noopener noreferrer">
                <RemoteLogo path={FFSNW_LOGO} alt="" height={30} />
                <span>{tr.competitions.affiliatedTo}</span>
                <Icon name="external-link" size={13} />
              </a>
            )}
            {comp.tour_name && (
              comp.tour_url ? (
                <a className={styles.affilItem} href={comp.tour_url} target="_blank" rel="noopener noreferrer">
                  <RemoteLogo path={tourLogoPath(comp.tour_name)} alt="" height={30} />
                  <span>{tr.competitions.partOf}</span>
                  <span className={styles.tapeSmall}>{comp.tour_name}</span>
                  <Icon name="external-link" size={13} />
                </a>
              ) : (
                <span className={styles.affilItem}>
                  <RemoteLogo path={tourLogoPath(comp.tour_name)} alt="" height={30} />
                  <span>{tr.competitions.partOf}</span>
                  <span className={styles.tapeSmall}>{comp.tour_name}</span>
                </span>
              )
            )}
          </div>
        )}
      </header>

      {/* Les liens sortants. Un lien absent s'affiche « à venir » plutôt que de
          disparaître : le vide annoncé donne rendez-vous, le vide muet fait partir. */}
      <section className={styles.section}>
        <h2 className={styles.h2}>{tr.competitions.linksTitle}</h2>
        <ul className={styles.primary} role="list">
          {PRIMARY.map(l => {
            const url = comp[l.key]
            return (
              <li key={l.key} className={url ? styles.onNow : styles.offNow}>
                {url ? (
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <Icon name={l.icon} size={20} />
                    <span>{tr.competitions.links[l.labelKey]}</span>
                    <Icon name="external-link" size={15} className={styles.ext} />
                  </a>
                ) : (
                  <span>
                    <Icon name={l.icon} size={20} />
                    <span>{tr.competitions.links[l.labelKey]}</span>
                    <span className={styles.tbd}>{state === 'past' ? tr.competitions.notAvailable : tr.competitions.tbd}</span>
                  </span>
                )}
              </li>
            )
          })}
        </ul>

        <ul className={styles.links} role="list">
          {SECONDARY.map(l => {
            const url = comp[l.key]
            return (
              <li key={l.key} className={url ? styles.linkOn : styles.linkOff}>
                {url ? (
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <Icon name={l.icon} size={17} />
                    <span>{tr.competitions.links[l.labelKey]}</span>
                    {l.tape && comp[l.tape] && <span className={styles.tape}>{comp[l.tape]}</span>}
                    <Icon name="external-link" size={14} className={styles.ext} />
                  </a>
                ) : (
                  <span>
                    <Icon name={l.icon} size={17} />
                    <span>{tr.competitions.links[l.labelKey]}</span>
                    {/* Le nom du parc est porté par l'étiquette du lien ; sans
                        lui il disparaissait de la page entière, alors qu'il y
                        figurait encore dans la méta-description. */}
                    {l.tape && comp[l.tape] && <span className={styles.tape}>{comp[l.tape]}</span>}
                    <span className={styles.tbd}>{state === 'past' ? tr.competitions.notAvailable : tr.competitions.tbd}</span>
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      {/* La section reste visible pour une compétition passée sans vidéo : c'est
          exactement le cas où le vide annoncé donne rendez-vous. Pour une
          compétition à venir, en revanche, l'absence de rétrospective va de soi. */}
      {(videos.length > 0 || videosFailed || state === 'past') && (
        <section className={styles.section}>
          <h2 className={styles.h2}>{tr.competitions.videosTitle}</h2>
          {videosFailed && <p className={styles.note}>{tr.competitions.videosError}</p>}
          {!videosFailed && videos.length === 0 && (
            <p className={styles.note}>{tr.competitions.videosNone}</p>
          )}
          {videos.length > 0 && (
            <ul className={styles.videos} role="list">
              {videos.map(v => (
                <li key={v.id}>
                  <VideoCard
                    url={v.url}
                    title={v.title}
                    labels={{
                      youtube: tr.competitions.watchOnYoutube,
                      instagram: tr.competitions.watchOnInstagram,
                      generic: tr.competitions.watch,
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {siblings.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.h2}>{(comp.affiliation === 'federal' ? tr.competitions.alsoTitleFederal : tr.competitions.alsoTitleIndependent).replace('{year}', String(comp.date_start).slice(0, 4))}</h2>
          <ul className={styles.siblings} role="list">
            {siblings.map(s => (
              <li key={s.id}>
                <Link to={competitionPath(s)}>
                  <span className={styles.sibWhen}>{formatCompetitionDate(s, lang)}</span>
                  <span className={s.cancelled ? styles.struck : undefined}>{s.name}</span>
                  {s.cancelled && <span className={styles.cancelledTag}>{tr.competitions.cancelled}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
