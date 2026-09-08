// Où trouver les logos d'affiliation d'une compétition.
//
// Le logo d'un circuit est retrouvé À PARTIR DE SON NOM, sans colonne ni saisie
// supplémentaire : il suffit de déposer le fichier sous le slug du circuit, de
// la même façon que les miniatures Instagram vivent sous `thumbnails/<shortcode>`.
// « Le Pro Tour » → `competitions/tours/le-pro-tour.png`.
//
// Conséquence assumée : renommer un circuit dans l'admin détache son logo tant
// que le fichier n'est pas renommé à son tour. L'affichage retombe alors
// silencieusement sur le nom seul, jamais sur une image cassée.
import { slugify } from './competitionDates'

export const FFSNW_URL = 'https://www.ffsnw.fr/'
export const FFSNW_LOGO = 'competitions/ffsnw.png'

export const tourLogoPath = (tourName) => {
  const slug = slugify(tourName)
  return slug ? `competitions/tours/${slug}.png` : null
}
