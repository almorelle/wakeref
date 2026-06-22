// Comparaison de la saisie d'un juge à la solution de référence d'un run.
// Pur (pas de React). Aucun score /20 n'est calculé ici.
//
// Modèle : l'ALIGNEMENT se fait sur le TYPE de chaque élément (kicker, air
// trick, module/jib, flat, autre) — c'est le type qui porte l'ordre et les
// « en trop / oublié ». On aligne par plus longue sous-séquence commune (LCS)
// des types : un kicker s'aligne avec un kicker, un module avec un module, etc.
// Une fois deux éléments alignés (même type, bon ordre), la JUSTESSE est
// BINAIRE : correct (contenu exact) ou faux. Pas d'état intermédiaire.

const arr = (a) => (a || []).slice().sort().join(',')

// Type fin d'un élément : c'est la clé d'alignement (ordre / surplus / manque).
const kindOf = (item) => {
  if (item.type === 'jib')   return 'jib'
  if (item.type === 'other') return 'other'
  const c = item.data.contexts || []
  if (c.includes('air_trick')) return 'air_trick'
  if (c.includes('kicker'))    return 'kicker'
  if (c.includes('flat'))      return 'flat'
  return c[0] || 'figure'
}

// Signature de contenu exact (pour décider correct vs faux une fois aligné).
const figureKey = (e) => `fig|${e.slug || ''}|${e.side || ''}|${arr(e.approach)}|${arr(e.rotation)}`
const jibKey = (p) => [
  'jib', p.side || '', p.approach || '', arr(p.figures),
  p.entryRotation || '', p.exitRotation || '',
  arr(p.entryTricks), arr(p.exitTricks),
  p.press ? 1 : 0, p['5050'] ? 1 : 0,
].join('|')
const otherKey = (o) => `other|${(o.name || '').trim().toLowerCase()}`

const contentKey = (item) =>
  item.type === 'jib'   ? jibKey(item.data)
  : item.type === 'other' ? otherKey(item.data)
  : figureKey(item.data)

// Éléments ordonnés d'un run (figures + passes jib + autres), avec leur type.
function orderedItems(run) {
  const items = [
    ...(run?.entries || []).map(e => ({ type: 'figure', data: e })),
    ...(run?.jibPasses || []).map(p => ({ type: 'jib', data: p })),
    ...(run?.otherEntries || []).map(o => ({ type: 'other', data: o })),
  ].map(it => ({ ...it, kind: kindOf(it), key: contentKey(it) }))
  return items.sort((a, b) => (a.data._seq ?? 0) - (b.data._seq ?? 0))
}

// Alignement LCS sur le type : renvoie une liste de paires { judge, ref } dans
// l'ordre, où l'un des deux peut être null (surplus / manque).
function alignByKind(J, R) {
  const n = J.length, m = R.length
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = J[i].kind === R[j].kind
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const pairs = []
  let i = 0, j = 0
  while (i < n && j < m) {
    if (J[i].kind === R[j].kind) { pairs.push({ judge: J[i], ref: R[j] }); i++; j++ }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { pairs.push({ judge: J[i], ref: null }); i++ }
    else { pairs.push({ judge: null, ref: R[j] }); j++ }
  }
  while (i < n) { pairs.push({ judge: J[i], ref: null }); i++ }
  while (j < m) { pairs.push({ judge: null, ref: R[j] }); j++ }
  return pairs
}

// États par ligne :
//   correct   — bon type au bon endroit ET contenu exact (vrai)
//   incorrect — bon type au bon endroit mais contenu différent (faux)
//   missing   — la référence a un élément de ce type ici, pas la saisie (oublié)
//   extra     — la saisie a un élément sans correspondance de type (en trop)
export function diffRuns(judgeRun, referenceRun) {
  const J = orderedItems(judgeRun)
  const R = orderedItems(referenceRun)
  const pairs = alignByKind(J, R)

  const rows = []
  const tally = { correct: 0, incorrect: 0, missing: 0, extra: 0 }

  pairs.forEach(({ judge, ref }, idx) => {
    const position = idx + 1
    if (judge && ref) {
      // « autre » est du texte libre : présent au bon endroit (bon type) = correct,
      // on ne juge pas le libellé exact.
      const ok = judge.type === 'other' ? true : judge.key === ref.key
      rows.push({ state: ok ? 'correct' : 'incorrect', position, judge, ref })
      ok ? tally.correct++ : tally.incorrect++
    } else if (ref) {
      rows.push({ state: 'missing', position, judge: null, ref })
      tally.missing++
    } else {
      rows.push({ state: 'extra', position, judge, ref: null })
      tally.extra++
    }
  })

  return { rows, tally }
}
