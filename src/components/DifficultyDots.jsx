// Direction « papier » : deux encres seulement. Les niveaux 1–3 restent en
// encre, le magenta n'apparaît qu'à partir de 4 — il signale la difficulté
// haute sans réintroduire de rampe de couleurs.
const dotColor = i => (i < 3 ? 'var(--c-text)' : 'var(--c-accent)')

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
