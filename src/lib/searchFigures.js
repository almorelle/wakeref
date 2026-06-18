import { supabase } from './supabase'
import { expandQuery } from './searchExpand'

// Forme « compacte » d'une chaîne : minuscule, sans accents, sans rien d'autre
// que [a-z0-9]. Même normalisation que le RPC search_figures côté SQL, pour que
// le classement de pertinence recalculé ici colle à son matching.
const compact = s =>
  (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')

// Reclasse les résultats par pertinence vis-à-vis de la requête brute, alignée
// sur les paliers du RPC : nom exact (0) < préfixe de nom (1) < sous-chaîne de
// nom (2) < match par description seule (3). Le RPC renvoie déjà dans cet ordre,
// mais l'intersection multi-termes et le besoin d'un tri numérique imposaient un
// re-tri JS — qui écrasait la pertinence (un match par description seule au nom
// alphabétiquement précoce remontait au-dessus d'un « FS 180 »). À palier égal,
// le nom le plus court passe devant (le terme cherché y est plus « central » :
// « FS 180 » avant « Switch FS 180 to blind »), puis tri naturel (180 < 360).
function rankByRelevance(results, rawQuery) {
  const cq = compact(rawQuery)
  const tier = (name) => {
    if (!cq) return 3
    const cn = compact(name)
    if (cn === cq) return 0
    if (cn.startsWith(cq)) return 1
    if (cn.includes(cq)) return 2
    return 3
  }
  return results
    .map(f => ({ f, t: tier(f.name) }))
    .sort((a, b) =>
      a.t - b.t ||
      a.f.name.length - b.f.name.length ||
      a.f.name.localeCompare(b.f.name, undefined, { numeric: true })
    )
    .map(x => x.f)
}

// Search figures with abbreviation expansion.
// Expands the query into terms (e.g. "tb3" → ["ts","bs","3"]),
// runs one RPC call per term in parallel, then intersects results.
export async function searchFigures(query) {
  const terms = expandQuery(query)
  if (terms.length === 0) return []

  const searches = await Promise.all(
    terms.map(term => supabase.rpc('search_figures', { query: term }).then(r => r.data || []))
  )

  if (searches.length === 1) return rankByRelevance(searches[0], query)

  const idSets = searches.map(results => new Set(results.map(f => f.id)))
  const merged = searches[0].filter(f => idSets.every(set => set.has(f.id)))
  return rankByRelevance(merged, query)
}
