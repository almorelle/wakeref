import { useNavigate } from 'react-router-dom'
import DifficultyDots from './DifficultyDots'
import { SportBadge, CategoryBadge, ContextBadge } from './Badges'
import styles from './FigureCard.module.css'

export default function FigureCard({ figure }) {
  const navigate = useNavigate()
  return (
    <div
      className={styles.card}
      onClick={() => navigate(`/figures/${figure.slug}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/figures/${figure.slug}`)}
    >
      <div className={styles.body}>
        <span className={styles.name}>{figure.name}</span>
        <div className={styles.meta}>
          <CategoryBadge slug={figure.category_slug} name={figure.category_name} />
          <SportBadge sport={figure.sport} />
          {figure.contexts?.map(ctx => (
            <ContextBadge key={ctx} context={ctx} />
          ))}
          <DifficultyDots value={figure.difficulty} />
        </div>
      </div>
      <i className="ti ti-chevron-right" style={{ color: 'var(--c-faint)', fontSize: 16 }} />
    </div>
  )
}
