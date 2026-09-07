// Formatage des dates de compétition. Module React-free : la page publique du
// lot B en aura besoin autant que l'admin.
//
// `date_precision` porte l'incertitude. Pour une compétition connue à l'année
// seulement, `date_start` stocke le 31 décembre — un artefact de stockage qui ne
// doit JAMAIS remonter à l'écran : on n'affiche alors que l'année.

const MONTHS = {
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
}

// 'YYYY-MM-DD' → [année, mois, jour] sans passer par Date(), qui décalerait la
// veille pour les fuseaux négatifs.
const parts = (iso) => {
  if (!iso) return null
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number)
  return Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d) ? [y, m, d] : null
}

/**
 * Rend la période d'une compétition en une chaîne lisible.
 *   année seule          → « 2027 »
 *   un jour              → « 14 juin 2026 »
 *   deux jours, même mois→ « 12–14 juin 2026 »
 *   à cheval sur 2 mois  → « 30 mai – 2 juin 2026 »
 *   à cheval sur 2 ans   → « 28 décembre 2026 – 2 janvier 2027 »
 */
export function formatCompetitionDate(comp, lang = 'fr') {
  const start = parts(comp?.date_start)
  if (!start) return ''
  const [ys, ms, ds] = start
  // Un `select` qui oublie `date_precision` afficherait « 1 janvier 2027 » —
  // l'artefact de stockage, précisément ce que ce module existe pour cacher.
  // L'échec serait une date plausible, pas une erreur : on le signale en dev.
  if (import.meta.env?.DEV && comp.date_precision == null) {
    console.warn('[competitionDates] `date_precision` absent — ajoute-le au select, sinon le 31 décembre fictif s’affiche.', comp)
  }
  if (comp.date_precision === 'year') return String(ys)

  const mon = (MONTHS[lang] || MONTHS.fr)
  const end = parts(comp.date_end)
  const day = (d, m, y) => (lang === 'en' ? `${mon[m - 1]} ${d}, ${y}` : `${d} ${mon[m - 1]} ${y}`)

  if (!end || (end[0] === ys && end[1] === ms && end[2] === ds)) return day(ds, ms, ys)
  const [ye, me, de] = end
  if (ye !== ys) return `${day(ds, ms, ys)} – ${day(de, me, ye)}`
  if (me !== ms) {
    return lang === 'en'
      ? `${mon[ms - 1]} ${ds} – ${mon[me - 1]} ${de}, ${ys}`
      : `${ds} ${mon[ms - 1]} – ${de} ${mon[me - 1]} ${ys}`
  }
  return lang === 'en' ? `${mon[ms - 1]} ${ds}–${de}, ${ys}` : `${ds}–${de} ${mon[ms - 1]} ${ys}`
}
