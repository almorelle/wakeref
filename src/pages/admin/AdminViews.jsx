import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { SportBadge } from '../../components/Badges'
import { competitionPath, formatCompetitionDate } from '../../lib/competitionDates'
import styles from './AdminViews.module.css'

/* Lecture des trois compteurs maison : `figure_views` (figure, jour), alimenté
   depuis la page d'un trick, `competition_views` (compétition, jour), depuis la
   fiche d'une compétition, et `page_views` (route, jour), depuis `PublicLayout`
   pour tout le reste. L'écriture existe depuis la migration 0001 et on ne purge jamais
   la table : l'historique complet est donc là depuis la mise en service, il
   n'était simplement lu nulle part au-delà des cinq ids de la home. Cet écran
   est cette lecture — il n'écrit rien et ne change pas la collecte.

   Ce qu'on mesure : des VUES, pas des visiteurs. Aucun identifiant, aucune IP,
   aucun cookie ; un flag localStorage dédoublonne une figure par jour et par
   navigateur (`FigureDetail.jsx`). Les robots qui exécutent le JS sont comptés.
   Les chiffres sont donc justes en relatif — ce qui monte, ce qu'on n'ouvre
   jamais — et approximatifs en absolu. Ne pas les présenter comme une
   fréquentation. */

const MOIS_AFFICHES = 12
const TOP_LIM = 10
const FENETRE_JAMAIS_VUE = 365

const nf = new Intl.NumberFormat('fr-FR')
const moisCourt = new Intl.DateTimeFormat('fr-FR', { month: 'short' })
const moisLong = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
const dateCourte = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

// '2026-09-01' → Date locale. `new Date(iso)` interpréterait la chaîne en UTC
// et reculerait d'un jour à l'ouest de Greenwich, décalant tout le graphe d'un
// mois. On construit donc la date par ses composants.
function dateLocale(iso) {
  const [y, m, d] = String(iso).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

function Vide({ children }) {
  return <p className={styles.vide}>{children}</p>
}

/* Série unique, une couleur : l'encre d'accent. Pas de légende — le titre dit
   ce qui est tracé. Les valeurs ne sont pas écrites sur chaque barre (illisible
   à douze colonnes) : l'axe porte l'échelle, l'extrême est étiqueté, le survol
   et le focus donnent le détail, et le tableau replié sous le graphe rend
   chaque valeur lisible sans dépendre du pointeur. */
function GrapheMensuel({ mois }) {
  if (!mois.length) return <Vide>Pas encore de mois complet à afficher.</Vide>

  const max = Math.max(...mois.map(m => m.views), 1)
  const iMax = mois.findIndex(m => m.views === max)
  const moisCourant = new Date().toISOString().slice(0, 7)

  return (
    <>
      <div className={styles.graphe}>
        <div className={styles.axeY} aria-hidden="true">
          <span>{nf.format(max)}</span>
          <span>{nf.format(Math.round(max / 2))}</span>
          <span>0</span>
        </div>
        <div className={styles.plot}>
          <div className={styles.filets} aria-hidden="true"><i /><i /><i /></div>
          <div className={styles.colonnes}>
            {mois.map((m, i) => {
              const partiel = String(m.month).slice(0, 7) === moisCourant
              const label = moisLong.format(dateLocale(m.month))
              return (
                <div
                  key={m.month}
                  className={styles.colonne}
                  tabIndex={0}
                  aria-label={`${label} : ${nf.format(m.views)} vues${partiel ? ', mois en cours' : ''}`}
                >
                  <span className={styles.bulle} aria-hidden="true">
                    {label} — {nf.format(m.views)}
                  </span>
                  {i === iMax && m.views > 0 && (
                    <span className={styles.valeurMax} aria-hidden="true">{nf.format(m.views)}</span>
                  )}
                  <div
                    className={`${styles.barre} ${partiel ? styles.barrePartielle : ''}`}
                    style={{ height: `${Math.max((m.views / max) * 100, m.views > 0 ? 2 : 0)}%` }}
                  />
                </div>
              )
            })}
          </div>
        </div>
        <div className={styles.axeX} aria-hidden="true">
          {mois.map(m => (
            <span key={m.month}>{moisCourt.format(dateLocale(m.month)).replace('.', '')}</span>
          ))}
        </div>
      </div>

      <details className={styles.tableau}>
        <summary>Voir les valeurs</summary>
        <table>
          <thead>
            <tr><th scope="col">Mois</th><th scope="col">Vues</th></tr>
          </thead>
          <tbody>
            {mois.map(m => (
              <tr key={m.month}>
                <td>{moisLong.format(dateLocale(m.month))}</td>
                <td className={styles.num}>{nf.format(m.views)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  )
}

function ListeTop({ figures }) {
  if (!figures.length) return <Vide>Aucune vue sur cette fenêtre.</Vide>
  const max = figures[0]?.views || 1
  return (
    <ol className={styles.top}>
      {figures.map(f => (
        <li key={f.figure_id} className={styles.topItem}>
          {/* La jauge est un fond de ligne, pas une barre à part : elle donne le
              rapport au premier d'un coup d'œil sans ajouter d'encre. */}
          <span className={styles.jauge} style={{ width: `${(f.views / max) * 100}%` }} aria-hidden="true" />
          <Link to={`/figures/${f.slug}`} target="_blank" rel="noopener" className={styles.topNom}>
            {f.name}
          </Link>
          <SportBadge sport={f.sport} />
          {!f.published && <span className={styles.brouillon}>dépubliée</span>}
          <span className={styles.topVues}>{nf.format(f.views)}</span>
        </li>
      ))}
    </ol>
  )
}

export default function AdminViews() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    let annule = false
    Promise.all([
      supabase.rpc('view_stats_totals'),
      supabase.rpc('views_by_month', { months: MOIS_AFFICHES }),
      supabase.rpc('top_viewed_figures', { days: 30, lim: TOP_LIM }),
      supabase.rpc('top_viewed_figures', { days: 365, lim: TOP_LIM }),
      supabase.rpc('never_viewed_figures', { days: FENETRE_JAMAIS_VUE }),
      supabase.rpc('page_view_stats'),
      supabase.rpc('page_view_span'),
      supabase.rpc('competition_view_stats'),
    ]).then(([totaux, mois, top30, top365, jamais, pages, span, comps]) => {
      if (annule) return
      const ko = [totaux, mois, top30, top365, jamais, pages, span, comps].find(r => r.error)
      if (ko) {
        // Deux échecs ont une cause connue et une réponse précise, qui valent
        // mieux qu'un message brut : PGRST202 = fonction absente du schéma,
        // 42501 = privilège manquant sur `figure_views` (une policy RLS ne
        // remplace pas le `grant select`). Les deux se règlent par la même
        // migration.
        const code = ko.error.code
        setErreur(code === 'PGRST202' || code === '42501' ? 'migration' : ko.error.message)
        setLoading(false)
        return
      }
      setData({
        totaux: totaux.data?.[0] || null,
        mois: mois.data || [],
        top30: top30.data || [],
        top365: top365.data || [],
        jamais: jamais.data || [],
        pages: pages.data || [],
        span: span.data?.[0] || null,
        comps: comps.data || [],
      })
      setLoading(false)
    })
    return () => { annule = true }
  }, [])

  if (loading) return <span className="spinner" style={{ marginTop: '3rem' }} />

  if (erreur) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Vues</h1>
        <p className={styles.erreur}>
          {erreur === 'migration'
            ? 'La base n’a pas encore tout ce qu’il faut pour lire les vues — fonctions ou privilège de lecture sur figure_views. Exécute scripts/migrations/0022-view-stats.sql en entier dans l’éditeur SQL Supabase, puis recharge.'
            : `Lecture impossible : ${erreur}`}
        </p>
      </div>
    )
  }

  const { totaux, mois, top30, top365, jamais, pages, span, comps } = data
  const debut = totaux?.first_day ? dateLocale(totaux.first_day) : null
  const debutPages = span?.first_day ? dateLocale(span.first_day) : null
  // Les mois antérieurs à la première mesure ne sont pas des mois à zéro : ils
  // n'ont pas été mesurés. Les tracer inventerait une chute au début du graphe.
  const moisMesures = debut
    ? mois.filter(m => dateLocale(m.month) >= new Date(debut.getFullYear(), debut.getMonth(), 1))
    : mois

  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.title}>Vues</h1>
        <p className={styles.sub}>
          Compteur maison, conservé sans limite de durée — là où l’hébergeur ne
          garde que trente jours. Ce sont des vues de pages de tricks, pas des
          visiteurs : rien n’identifie qui que ce soit, et les robots qui
          exécutent le JavaScript sont comptés. À lire en relatif.
        </p>
      </div>

      <section className={styles.section}>
        <p className="section-title">En bref</p>
        <div className={styles.chiffres}>
          <div className={styles.chiffre}>
            <span className={styles.chiffreLabel}>30 derniers jours</span>
            <span className={styles.chiffreValeur}>{nf.format(totaux?.views_30d ?? 0)}</span>
          </div>
          <div className={styles.chiffre}>
            <span className={styles.chiffreLabel}>12 derniers mois</span>
            <span className={styles.chiffreValeur}>{nf.format(totaux?.views_365d ?? 0)}</span>
          </div>
          <div className={styles.chiffre}>
            <span className={styles.chiffreLabel}>Depuis le début</span>
            <span className={styles.chiffreValeur}>{nf.format(totaux?.views_total ?? 0)}</span>
          </div>
          <div className={styles.chiffre}>
            <span className={styles.chiffreLabel}>Première mesure</span>
            <span className={styles.chiffreValeurPetite}>
              {debut ? moisLong.format(debut) : '—'}
            </span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <p className="section-title">Vues par mois</p>
        <GrapheMensuel mois={moisMesures} />
        <p className={styles.note}>
          Le dernier mois est en cours : sa barre est claire, et elle n’est pas
          comparable aux précédentes tant qu’il n’est pas terminé.
        </p>
      </section>

      <div className={styles.duo}>
        <section className={styles.section}>
          <p className="section-title">Top 30 jours</p>
          <ListeTop figures={top30} />
        </section>
        <section className={styles.section}>
          <p className="section-title">Top 12 mois</p>
          <ListeTop figures={top365} />
        </section>
      </div>

      <section className={styles.section}>
        <p className="section-title">
          Jamais ouvertes en 12 mois <span className={styles.compteur}>{jamais.length}</span>
        </p>
        <p className={styles.note}>
          Figures publiées qu’aucune visite n’a atteintes sur la fenêtre. C’est
          l’angle mort utile : soit elles manquent au catalogue de quelqu’un,
          soit rien n’y mène.
        </p>
        {jamais.length === 0 ? (
          <Vide>Toutes les figures publiées ont été ouvertes au moins une fois.</Vide>
        ) : (
          <ul className={styles.jamais}>
            {jamais.map(f => (
              <li key={f.figure_id}>
                <Link to={`/figures/${f.slug}`} target="_blank" rel="noopener">
                  {f.name}
                </Link>
                <SportBadge sport={f.sport} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <p className="section-title">Fiches de compétition</p>
        <p className={styles.note}>
          Une ligne par compétition publiée, ouverte ou non. Comptées par id :
          renommer une compétition ne remet pas son compteur à zéro. Le passé
          antérieur à la mesure maison est une reprise de l’export de
          l’hébergeur — totaux exacts, découpe par jour estimée.
        </p>
        {comps.length === 0 ? (
          <Vide>Aucune compétition publiée.</Vide>
        ) : (
          <table className={styles.pages}>
            <thead>
              <tr>
                <th scope="col">Compétition</th>
                <th scope="col" className={styles.num}>30 j</th>
                <th scope="col" className={styles.num}>Total</th>
              </tr>
            </thead>
            <tbody>
              {comps.map(c => (
                <tr key={c.competition_id} className={c.views_total === 0 ? styles.ligneZero : ''}>
                  <th scope="row">
                    <Link
                      to={competitionPath({ id: c.competition_id, name: c.name })}
                      target="_blank"
                      rel="noopener"
                      className={styles.pageLabel}
                    >
                      {c.name}
                    </Link>
                    <span className={styles.pagePath}>
                      {formatCompetitionDate(c, 'fr')}
                      {c.tour_name ? ` · ${c.tour_name}` : ''}
                      {c.cancelled ? ' · annulée' : ''}
                    </span>
                  </th>
                  <td className={styles.num}>{nf.format(c.views_30d)}</td>
                  <td className={styles.num}>{nf.format(c.views_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className={styles.section}>
        <p className="section-title">Pages du site</p>
        <p className={styles.note}>
          Compteur distinct de celui des tricks, démarré{' '}
          {debutPages ? `le ${dateCourte.format(debutPages)}` : 'à la mise en service'} —
          il ne remonte donc pas aussi loin. Ce sont des routes, pas des adresses :
          les runs partagés ou les pages de circuit comptent sur une seule ligne.
          Les fiches de tricks et de compétitions n’y figurent pas, elles ont leur
          propre mesure ci-dessus.
        </p>
        {pages.length === 0 ? (
          <Vide>Aucune page déclarée.</Vide>
        ) : (
          <table className={styles.pages}>
            <thead>
              <tr>
                <th scope="col">Page</th>
                <th scope="col" className={styles.num}>30 j</th>
                <th scope="col" className={styles.num}>12 mois</th>
                <th scope="col" className={styles.num}>Total</th>
              </tr>
            </thead>
            <tbody>
              {pages.map(p => (
                <tr key={p.path} className={p.views_total === 0 ? styles.ligneZero : ''}>
                  <th scope="row">
                    <span className={styles.pageLabel}>{p.label}</span>
                    <code className={styles.pagePath}>{p.path}</code>
                  </th>
                  <td className={styles.num}>{nf.format(p.views_30d)}</td>
                  <td className={styles.num}>{nf.format(p.views_365d)}</td>
                  <td className={styles.num}>{nf.format(p.views_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
