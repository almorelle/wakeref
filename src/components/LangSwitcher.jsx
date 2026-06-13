import { useLanguage } from '../contexts/language-context'
import styles from './LangSwitcher.module.css'

export default function LangSwitcher() {
  const { lang, setLang } = useLanguage()
  return (
    <div className={styles.switcher}>
      <button
        className={`${styles.btn} ${lang === 'fr' ? styles.active : ''}`}
        onClick={() => setLang('fr')}
      >FR</button>
      <span className={styles.sep} />
      <button
        className={`${styles.btn} ${lang === 'en' ? styles.active : ''}`}
        onClick={() => setLang('en')}
      >EN</button>
    </div>
  )
}
