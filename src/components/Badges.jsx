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
