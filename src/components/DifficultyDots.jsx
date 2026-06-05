export default function DifficultyDots({ value, max = 5 }) {
  return (
    <span className="diff" role="img" aria-label={`Difficulté ${value} / ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`diff-dot${i < value ? ' on' : ''}`} aria-hidden="true" />
      ))}
    </span>
  )
}
