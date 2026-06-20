// Comparaison de la saisie d'un juge à la solution de référence d'un run.
// Pur (pas de React). Aligné par POSITION dans le run : « les bons tricks dans
// le bon ordre » (D8). Le champ « autre » (otherEntries) est EXCLU — jamais
// compté comme faute. Aucun score /20 n'est calculé ici.

const arr = (a) => (a || []).slice().sort().join(',')

// Signature comparable d'un élément de run (figure ou passe jib).
const figureSig = (e) => ({
  slug: e.slug || null,
  key: `fig|${e.slug || ''}|${e.side || ''}|${arr(e.approach)}|${arr(e.rotation)}`,
})
const jibSig = (p) => ({
  slug: null,
  key: [
    'jib', p.side || '', p.approach || '', arr(p.figures),
    p.entryRotation || '', p.exitRotation || '',
    arr(p.entryTricks), arr(p.exitTricks),
    p.press ? 1 : 0, p['5050'] ? 1 : 0,
  ].join('|'),
})

// Items ordonnés d'un run, hors « autre ». Chaque item : { type, data, sig }.
function orderedItems(run) {
  const items = [
    ...(run?.entries || []).map(e => ({ type: 'figure', data: e, sig: figureSig(e) })),
    ...(run?.jibPasses || []).map(p => ({ type: 'jib', data: p, sig: jibSig(p) })),
  ]
  return items.sort((a, b) => (a.data._seq ?? 0) - (b.data._seq ?? 0))
}

// États par position :
//   correct  — match exact (trick + approche + côté + rotation)
//   attr     — bon trick (même slug) à la bonne position, attribut différent
//   order    — bon trick mais présent à une autre position (transposition)
//   missing  — la référence a un élément ici, pas la saisie
//   extra    — la saisie a un élément ici, pas la référence
//   mismatch — substitution (les deux présents, aucun correspondant ailleurs) :
//              compté comme 1 oublié + 1 en trop
export function diffRuns(judgeRun, referenceRun) {
  const J = orderedItems(judgeRun)
  const R = orderedItems(referenceRun)
  const jKeys = J.map(x => x.sig.key)
  const rKeys = R.map(x => x.sig.key)
  const n = Math.max(J.length, R.length)

  const rows = []
  const tally = { correct: 0, missing: 0, extra: 0, attr: 0, order: 0 }

  for (let i = 0; i < n; i++) {
    const j = J[i]
    const r = R[i]
    const position = i + 1

    if (j && r) {
      if (j.sig.key === r.sig.key) {
        rows.push({ state: 'correct', position, judge: j, ref: r })
        tally.correct++
      } else if (j.type === 'figure' && r.type === 'figure' && j.sig.slug && j.sig.slug === r.sig.slug) {
        rows.push({ state: 'attr', position, judge: j, ref: r })
        tally.attr++
      } else if (rKeys.includes(j.sig.key) && jKeys.includes(r.sig.key)) {
        rows.push({ state: 'order', position, judge: j, ref: r })
        tally.order++
      } else {
        rows.push({ state: 'mismatch', position, judge: j, ref: r })
        tally.missing++
        tally.extra++
      }
    } else if (r) {
      rows.push({ state: 'missing', position, judge: null, ref: r })
      tally.missing++
    } else {
      rows.push({ state: 'extra', position, judge: j, ref: null })
      tally.extra++
    }
  }

  return { rows, tally }
}
