export default function DifficultyDots({ value, max = 5 }) {
  return (
    <span className="diff">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`diff-dot${i < value ? ' on' : ''}`} />
      ))}
    </span>
  )
}
