import { useNavigate } from 'react-router-dom'
import { useT } from '../i18n/useT'
import styles from './NotFound.module.css'
import Icon from '../components/Icon'

export default function NotFound() {
  const navigate = useNavigate()
  const tr = useT()

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <p className={styles.code}>{'🤷'}</p>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>{tr.notFoundTitle}</h1>
        <p className={styles.sub}>{tr.notFoundSub}</p>
        <div className={styles.actions}>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            <Icon name="home" /> {tr.notFoundHome}
          </button>
          <button className="btn btn-ghost" onClick={() => navigate(-1)}>
            <Icon name="arrow-left" /> {tr.back}
          </button>
        </div>
      </div>
    </div>
  )
}
