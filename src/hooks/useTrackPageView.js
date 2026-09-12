import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { routePattern } from '../lib/pageViews'
import { dejaVuAujourdhui } from '../lib/vuDuJour'

/**
 * Incrémente le compteur de la page courante, une fois par jour et par
 * navigateur. Best-effort : les erreurs sont avalées, une mesure ratée ne doit
 * jamais se voir à l'écran. Les pages hors liste (figures, fiches de
 * compétition, admin, surfaces chromeless, 404) rendent `null` et ne
 * déclenchent aucun appel.
 */
export function useTrackPageView() {
  const { pathname } = useLocation()

  useEffect(() => {
    const motif = routePattern(pathname)
    if (!motif) return
    if (dejaVuAujourdhui('wakeref_pages_vues', motif)) return
    supabase.rpc('track_page_view', { p: motif }).then(() => {}, () => {})
  }, [pathname])
}
