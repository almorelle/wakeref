/* Dédoublonnage « une fois par jour et par navigateur » des compteurs de vues.

   Une clé par compteur, qui tient la journée entière et qu'on remplace au
   premier passage du lendemain. L'ancien dédoublonnage de `figure_views`
   posait au contraire une clé par figure et par jour, jamais nettoyée ;
   `useTrackFigureView` est passé sur ce helper et purge ces clés-là. */

/**
 * Renvoie `true` si `valeur` a déjà été comptée aujourd'hui sous `cle`, et
 * l'enregistre sinon. Sans localStorage (navigation privée) ou avec un contenu
 * illisible, renvoie `false` : on compte au plus une fois par montage, comme
 * FigureDetail dans le même cas.
 */
export function dejaVuAujourdhui(cle, valeur) {
  const jour = new Date().toISOString().slice(0, 10)
  try {
    const brut = localStorage.getItem(cle)
    const etat = brut ? JSON.parse(brut) : null
    const vues = etat && etat.d === jour && Array.isArray(etat.v) ? etat.v : []
    if (vues.includes(valeur)) return true
    localStorage.setItem(cle, JSON.stringify({ d: jour, v: [...vues, valeur] }))
    return false
  } catch {
    return false
  }
}
