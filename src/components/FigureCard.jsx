import { Link } from 'react-router-dom'
import DifficultyDots from './DifficultyDots'
import { SportBadge, CategoryBadge, ContextBadge } from './Badges'
import styles from './FigureCard.module.css'
import Icon from './Icon'

// Ligne de sommaire : plus une carte mais une entrée d'index, séparée de la
// suivante par un filet pointillé. Le nom porte la typo de titre, les
// métadonnées la ligne d'étiquettes, la difficulté est calée à droite.
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
        </div>
      </div>
      <DifficultyDots value={figure.difficulty} />
      <Icon name="arrow-right" size={16} className={styles.go} />
    </Link>
  )
}
