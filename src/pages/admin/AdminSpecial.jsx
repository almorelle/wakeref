import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/Icon'
import styles from './AdminSpecial.module.css'

/* Annuaire des pages publiques auxquelles aucun menu ne mène — outils de jugement
   chromeless, laboratoire vocal, page héritée. Elles existent, elles sont
   servies, mais on ne les retrouve qu'en connaissant leur URL par cœur : d'où
   cette page, qui est la seule table des matières qu'elles aient.

   La liste est tenue à la main, et c'est un choix : la dériver demanderait de
   croiser le tableau de routes d'`App.jsx`, les liens de la `Navbar` et du
   `Footer` et les routes de `scripts/generate-sitemap.js` — trois sources qui
   ne s'exportent pas et qu'il faudrait refactorer pour un écran d'admin.
   Contrepartie assumée : une route publique ajoutée ailleurs n'apparaît pas
   ici toute seule. En ajouter une = une ligne ci-dessous.

   `sitemap` dit si l'URL est déclarée dans `sitemap.xml`, `noindex` si la page
   pose elle-même la balise robots (`<SEO noindex>`). Les deux sont
   indépendants : hors sitemap ne veut pas dire non indexable — Google suit
   aussi les liens entrants. */

const HORS_NAVIGATION = [
  {
    path: '/grille-composition',
    title: 'Feuille de note France 2026',
    desc: 'Grilles officielles de la saison, plein écran, sans Navbar ni Footer. Ses grilles sont volontairement séparées de celles de la Compo.',
    sitemap: false,
    noindex: false,
  },
  {
    path: '/juge',
    title: 'Module compétition — juge',
    desc: 'Portail de chargement d’un parcours par son code court. Chromeless également ; le parcours est la seule donnée qui voyage entre appareils.',
    sitemap: false,
    noindex: false,
  },
  {
    path: '/entrainement-juge/voix',
    title: 'Laboratoire de saisie vocale',
    desc: 'Reconnaissance des tricks par les modèles maison. Aucune page publique n’y mène — pas même /entrainement-juge.',
    sitemap: false,
    noindex: true,
  },
  {
    path: '/grille-composition-old',
    title: 'Grille de composition (héritée)',
    desc: 'Ancienne CompositionSimple, remplacée par la feuille France 2026. Atteignable depuis rien, mais indexable et porteuse de la même description que sa remplaçante — doublon connu, tracé dans deferred-work.md.',
    sitemap: false,
    noindex: false,
    legacy: true,
  },
]

/* Liées depuis le pied de page, mais délibérément absentes de `sitemap.xml` —
   le choix et sa raison sont écrits dans `scripts/generate-sitemap.js`, qui
   reste la source. Recensées ici pour que l'omission reste visible : hors
   sitemap ne veut pas dire non indexable, ces pages restent explorables par
   leurs liens. */
const HORS_SITEMAP_VOLONTAIRE = [
  { path: '/submit',                title: 'Proposer une vidéo',       desc: 'Formulaire — à atteindre depuis le site, pas depuis une recherche.' },
  { path: '/competitions/proposer', title: 'Proposer une compétition', desc: 'Formulaire, même raison.' },
  { path: '/legal',                 title: 'Mentions légales',         desc: 'Obligation légale, lue depuis le pied de page.' },
  { path: '/terms',                 title: 'Conditions d’utilisation', desc: 'Idem.' },
  { path: '/privacy',               title: 'Confidentialité',          desc: 'Idem.' },
]

function Ligne({ page, copied, onCopy }) {
  return (
    <div className={styles.item}>
      <div className={styles.itemBody}>
        <span className={styles.itemName}>
          {page.title}
          {page.legacy && <span className={styles.flagLegacy}>héritée</span>}
        </span>
        <code className={styles.path}>{page.path}</code>
        {page.desc && <p className={styles.itemDesc}>{page.desc}</p>}
        <div className={styles.flags}>
          {page.sitemap === false && <span className={styles.flag}>hors sitemap</span>}
          {page.noindex && <span className={styles.flag}>noindex</span>}
        </div>
      </div>
      <div className={styles.itemActions}>
        <button
          type="button"
          className="btn-icon"
          onClick={() => onCopy(page.path)}
          title="Copier l’URL complète"
          aria-label={copied ? 'URL copiée' : `Copier l’URL de ${page.title}`}
        >
          <Icon name={copied ? 'check' : 'copy'} />
        </button>
        <Link
          className="btn-icon"
          to={page.path}
          target="_blank"
          rel="noopener"
          title="Ouvrir dans un nouvel onglet"
          aria-label={`Ouvrir ${page.title} dans un nouvel onglet`}
        >
          <Icon name="external-link" />
        </Link>
      </div>
    </div>
  )
}

export default function AdminSpecial() {
  const [copiedPath, setCopiedPath] = useState(null)

  const copier = async (path) => {
    // URL absolue construite sur l'origine courante : en local on copie le lien
    // local, en production le lien partageable. Pas de domaine en dur.
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`)
      setCopiedPath(path)
      setTimeout(() => setCopiedPath(p => (p === path ? null : p)), 1500)
    } catch { /* presse-papiers indisponible */ }
  }

  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.title}>Spécial</h1>
        <p className={styles.sub}>
          Les pages publiques auxquelles aucun menu ne mène. Liste tenue à la main : une
          nouvelle route publique ne s’y ajoute pas toute seule.
        </p>
      </div>

      <section className={styles.section}>
        <p className="section-title">Hors navigation</p>
        <div className={styles.list}>
          {HORS_NAVIGATION.map(p => (
            <Ligne key={p.path} page={p} copied={copiedPath === p.path} onCopy={copier} />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <p className="section-title">Hors sitemap, mais volontairement</p>
        <p className={styles.note}>
          Liées depuis le pied de page, donc explorables par un moteur ;
          simplement pas déclarées dans <code>sitemap.xml</code>. Le choix est
          écrit dans <code>scripts/generate-sitemap.js</code> — cette liste le
          redit pour que l’omission ne se confonde jamais avec un oubli.
        </p>
        <div className={styles.list}>
          {HORS_SITEMAP_VOLONTAIRE.map(p => (
            <Ligne key={p.path} page={p} copied={copiedPath === p.path} onCopy={copier} />
          ))}
        </div>
      </section>
    </div>
  )
}
