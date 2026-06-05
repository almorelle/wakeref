// Rampe de couleur : cyan (facile) → ambre → rouge (difficile)
const dotColor = i => (i < 2 ? 'var(--c-wake)' : i < 4 ? 'var(--c-ws)' : 'var(--c-danger)')

export default function DifficultyDots({ value, max = 5 }) {
  return (
    <span className="diff" role="img" aria-label={`Difficulté ${value} / ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`diff-dot${i < value ? ' on' : ''}`}
          aria-hidden="true"
          style={i < value ? { '--d': dotColor(i) } : undefined}
        />
      ))}
    </span>
  )
}
