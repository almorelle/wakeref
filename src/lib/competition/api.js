// Accès données des parcours de compétition (table `parcours`, cf.
// scripts/competition_parcours.sql). Wrappers minces sur le singleton Supabase —
// pas de couche API intermédiaire (convention repo). Le parcours est l'objet
// partageable par short-code : édité/administré côté admin, lu par code côté /competition.
import { supabase } from '../supabase'

// short-code : 8 octets aléatoires en base36 (même schéma que les compositions).
export function shortId() {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes, (b) => (b % 36).toString(36)).join('')
}

// Liste admin (RLS authenticated).
export async function listParcours() {
  const { data, error } = await supabase
    .from('parcours')
    .select('id, name, data, updated_at')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data || []
}

// Chargement admin d'un parcours par id (pour l'édition).
export async function loadParcours(id) {
  const { data, error } = await supabase
    .from('parcours')
    .select('id, name, data, updated_at')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// Lecture publique par short-code (fonction security-definer, grant anon).
export async function getParcoursByCode(code) {
  const { data, error } = await supabase
    .rpc('get_parcours', { code })
    .single()
  if (error) throw error
  return data
}

// Erreur métier « nom déjà pris » — le code appelant l'affiche sans stack.
export class DuplicateNameError extends Error {
  constructor() { super('duplicate-name'); this.name = 'DuplicateNameError' }
}

async function nameTaken(name, exceptId) {
  let q = supabase.from('parcours').select('id').eq('name', name)
  if (exceptId) q = q.neq('id', exceptId)
  const { data } = await q.limit(1)
  return !!(data && data.length)
}

// Insertion avec retry : un 23505 peut venir du nom (unique) OU de l'id (PK).
// Nom pris → DuplicateNameError ; sinon collision d'id → on régénère et on réessaie.
export async function insertParcours({ name, data }) {
  let id = shortId()
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { error } = await supabase.from('parcours').insert({ id, name, data })
    if (!error) return id
    if (error.code !== '23505') throw error
    if (await nameTaken(name)) throw new DuplicateNameError()
    id = shortId() // collision d'id (rare) → nouveau code
  }
  throw new Error('parcours-insert-failed')
}

export async function updateParcours(id, { name, data }) {
  const { error } = await supabase.from('parcours').update({ name, data }).eq('id', id)
  if (error) {
    if (error.code === '23505' && await nameTaken(name, id)) throw new DuplicateNameError()
    throw error
  }
}

export async function deleteParcours(id) {
  const { error } = await supabase.from('parcours').delete().eq('id', id)
  if (error) throw error
}

// Duplication : nouveau code + nom « … (copie) » (suffixé jusqu'à unicité).
export async function duplicateParcours(row) {
  let name = `${row.name} (copie)`
  for (let i = 2; await nameTaken(name); i += 1) name = `${row.name} (copie ${i})`
  const id = await insertParcours({ name, data: row.data })
  return { id, name }
}
