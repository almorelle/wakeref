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
import { slugify } from './competitionDates.js'

export const FFSNW_URL = 'https://www.ffsnw.fr/'
export const FFSNW_LOGO = 'competitions/ffsnw.png'

export const tourLogoPath = (tourName) => {
  const slug = slugify(tourName)
  return slug ? `competitions/tours/${slug}.png` : null
}

// La page publique d'un circuit. Même slug que le logo, et pour la même raison :
// il n'existe pas d'entité « circuit » en base — seulement un texte libre sur
// chaque compétition. Le slug est donc la seule clé stable qu'on puisse mettre
// dans une URL, et la page se résout en comparant les slugs côté client.
export const tourPath = (tourName) => {
  const slug = slugify(tourName)
  return slug ? `/competitions/circuit/${slug}` : null
}
