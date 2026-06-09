import { supabase } from './supabase'
import { expandQuery } from './searchExpand'

// Search figures with abbreviation expansion.
// Expands the query into terms (e.g. "tb3" → ["ts","bs","3"]),
// runs one RPC call per term in parallel, then intersects results.
export async function searchFigures(query) {
  const terms = expandQuery(query)
  if (terms.length === 0) return []

  const searches = await Promise.all(
    terms.map(term => supabase.rpc('search_figures', { query: term }).then(r => r.data || []))
  )

  if (searches.length === 1) return searches[0]

  const idSets = searches.map(results => new Set(results.map(f => f.id)))
  return searches[0].filter(f => idSets.every(set => set.has(f.id)))
}
