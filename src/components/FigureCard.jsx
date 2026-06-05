import { Link } from 'react-router-dom'
import DifficultyDots from './DifficultyDots'
import { SportBadge, CategoryBadge, ContextBadge } from './Badges'
import styles from './FigureCard.module.css'
import Icon from './Icon'

export default function FigureCard({ figure, index = 0 }) {
  return (
    <Link to={`/figures/${figure.slug}`} className={styles.card} style={{ '--i': index }}>
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
      <Icon name="chevron-right" style={{ color: 'var(--c-faint)', fontSize: 16 }} />
    </Link>
  )
}
