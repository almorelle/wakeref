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
    <span className="badge">{tr.ctxNames?.[context] || context}</span>
  )
}
