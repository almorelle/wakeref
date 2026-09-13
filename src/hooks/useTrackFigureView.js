import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { dejaVuAujourdhui } from '../lib/vuDuJour'

const CLE = 'wakeref_figures_vues'
// L'ancien dédoublonnage posait une clé par figure et par jour
// (`wakeref_viewed_<id>_<date>`), jamais nettoyée. Elles ne servent plus à rien :
// on les retire au passage, pour que les navigateurs déjà chargés en récupèrent
// la place. Une fois vidé, le balayage ne trouve plus rien.
const ANCIEN_PREFIXE = 'wakeref_viewed_'

function purgerAnciennesCles() {
  try {
    const aRetirer = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(ANCIEN_PREFIXE)) aRetirer.push(k)
    }
    aRetirer.forEach(k => localStorage.removeItem(k))
  } catch { /* storage indispo : rien à purger */ }
}

/**
 * Incrémente le compteur d'une figure, une fois par jour et par navigateur.
 * Même mécanique que `useTrackCompetitionView` : une seule clé localStorage pour
 * toute la journée. Le drapeau est posé AVANT l'appel, ce qui dédoublonne aussi
 * le double montage de StrictMode. Erreurs avalées : c'est du best-effort.
 */
export function useTrackFigureView(id) {
  useEffect(() => {
    if (!id) return
    purgerAnciennesCles()
    if (dejaVuAujourdhui(CLE, id)) return
    // Le builder supabase est « thenable » mais n'expose pas .catch().
    supabase.rpc('track_figure_view', { fig_id: id }).then(() => {}, () => {})
  }, [id])
}
