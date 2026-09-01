import { Link } from 'react-router-dom'
import { useT } from '../i18n/useT'
import styles from './Footer.module.css'

// Pied de page commun à toutes les pages publiques. Il porte trois choses :
// l'identité, les accès secondaires, et surtout la note de droits — le site
// republie du contenu d'auteur·ices, c'est le bon endroit pour le dire une fois
// pour toutes en plus de la mention par vidéo.
export default function Footer() {
  const tr = useT()
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <p className={styles.mark}>
            <span className={`picto-mark ${styles.pict}`} aria-hidden="true" />
            <span className="wordmark">WakeRef</span>
          </p>
          <p className={styles.tagline}>{tr.footerTagline}</p>
        </div>

        <nav className={styles.col} aria-label={tr.footerExplore}>
          <h2 className={styles.colTitle}>{tr.footerExplore}</h2>
          <Link to="/figures">{tr.figures}</Link>
          <Link to="/quiz">{tr.quiz}</Link>
          <Link to="/compo">{tr.compo}</Link>
          <Link to="/judge">{tr.judge.nav}</Link>
        </nav>

        <nav className={styles.col} aria-label={tr.footerAbout}>
          <h2 className={styles.colTitle}>{tr.footerAbout}</h2>
          <Link to="/contact">{tr.contact}</Link>
          <Link to="/submit">{tr.ctaButton}</Link>
          <Link to="/legal">{tr.footerLegal}</Link>
          <Link to="/terms">{tr.footerTerms}</Link>
          <Link to="/privacy">{tr.footerPrivacy}</Link>
        </nav>

        <div className={styles.col}>
          <h2 className={styles.colTitle}>{tr.footerCredits}</h2>
          <p className={styles.credits}>{tr.footerCreditsText}</p>
        </div>
      </div>

      <p className={styles.bottom}>
        <span>© {year} WakeRef — {tr.footerRights}</span>
      </p>
    </footer>
  )
}
