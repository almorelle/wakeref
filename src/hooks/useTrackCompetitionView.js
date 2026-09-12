import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { dejaVuAujourdhui } from '../lib/vuDuJour'

/**
 * Incrémente le compteur d'une fiche de compétition, une fois par jour et par
 * navigateur — le pendant de `track_figure_view` pour l'agenda. On compte par
 * ID, pas par URL : le slug est décoratif, renommer la compétition ne doit pas
 * ouvrir un second compteur. Passer `null` tant que la fiche n'est pas chargée :
 * une URL qui finit en 404 ne doit rien écrire (le RPC l'ignorerait de toute
 * façon, mais autant ne pas faire l'aller-retour).
 */
export function useTrackCompetitionView(id) {
  useEffect(() => {
    if (!id) return
    if (dejaVuAujourdhui('wakeref_competitions_vues', id)) return
    supabase.rpc('track_competition_view', { cid: id }).then(() => {}, () => {})
  }, [id])
}
