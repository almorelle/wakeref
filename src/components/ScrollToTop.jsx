import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/* Remonte en haut à chaque changement de page.
 *
 * Une application à navigation côté client ne recharge pas le document : sans
 * ça, React Router remplace le contenu mais laisse la fenêtre où elle était.
 * Un lien cliqué dans le pied de page ouvrait donc la page suivante à
 * mi-hauteur, ou en bas.
 *
 * Trois précautions :
 * — On ne dépend que de `pathname`, jamais de `search`. Les filtres du
 *   catalogue et la recherche vivent dans la query string ; remonter à chaque
 *   frappe serait insupportable.
 * — Retour arrière (`POP`) : on ne touche à rien. La personne s'attend à
 *   retrouver la page là où elle l'avait laissée, c'est le navigateur qui
 *   restitue cette position.
 * — Lien ancré : remonter annulerait précisément le saut demandé. */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (navigationType === 'POP' || hash) return
    window.scrollTo(0, 0)
  }, [pathname, hash, navigationType])

  return null
}
