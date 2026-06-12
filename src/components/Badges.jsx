import { useT } from '../i18n/useT'

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

export function ContextBadge({ context }) {
  const tr = useT()
  return (
    <span className="badge" style={{ background: 'var(--c-surface3)', color: 'var(--c-muted)', border: '1px solid var(--c-border2)' }}>
      {tr.ctxNames?.[context] || context}
    </span>
  )
}
