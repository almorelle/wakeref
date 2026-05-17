export function SportBadge({ sport }) {
  return (
    <span className={`badge badge-${sport === 'wakeskate' ? 'ws' : 'wake'}`}>
      {sport === 'wakeskate' ? 'Wakeskate' : 'Wakeboard'}
    </span>
  )
}

export function CategoryBadge({ slug, name }) {
  return (
    <span className={`badge badge-${slug}`}>{name}</span>
  )
}

const CONTEXT_LABELS = {
  fr: { kicker: 'Kicker', jib: 'Jib', flat: 'Flat', air_trick: 'Air Trick' },
  en: { kicker: 'Kicker', jib: 'Jib', flat: 'Flat', air_trick: 'Air Trick' },
}

export function ContextBadge({ context }) {
  return (
    <span className="badge" style={{ background: 'var(--c-surface3)', color: 'var(--c-muted)', border: '1px solid var(--c-border2)' }}>
      {CONTEXT_LABELS.fr[context] || context}
    </span>
  )
}
