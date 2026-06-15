import { useT } from '../i18n/useT'

const SPORT_BADGE_CLASS = { wakeskate: 'ws', seated: 'seated' }

export function SportBadge({ sport }) {
  const tr = useT()
  return (
    <span className={`badge badge-${SPORT_BADGE_CLASS[sport] || 'wake'}`}>
      {tr.sportNames?.[sport] || tr.sportNames?.wakeboard || 'Wakeboard'}
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
