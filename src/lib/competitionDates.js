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

// Le jour courant EN FRANCE, pas chez le visiteur. Les compétitions référencées
// ont lieu en France et leurs dates sont des jours civils français ; se fier au
// fuseau du navigateur ferait dire « à venir » à une compétition déjà en cours
// pour quelqu'un qui la suit depuis Los Angeles, et l'inverse depuis Sydney.
// 'en-CA' rend directement le format YYYY-MM-DD.
const VENUE_TZ = 'Europe/Paris'
const dayFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: VENUE_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
})
export const todayISO = (now = new Date()) => dayFmt.format(now)

/**
 * État temporel d'une compétition : 'live' | 'past' | 'upcoming'.
 *
 * Seule une précision au jour peut produire 'live' — c'est une liste blanche et
 * non une exception pour 'year' : toute précision plus grossière ajoutée un jour
 * hériterait sinon d'un badge « en ce moment » le jour de son artefact de
 * stockage. Une compétition à l'année, rangée au 31 décembre, reste 'upcoming'
 * tant que son année court et bascule 'past' au 1er janvier suivant.
 *
 * Une compétition annulée n'est jamais 'live' non plus : elle n'a pas lieu.
 */
export function competitionState(comp, now = new Date()) {
  const start = String(comp?.date_start || '').slice(0, 10)
  if (!start) return 'upcoming'
  if (import.meta.env?.DEV && comp?.date_precision == null) {
    console.warn('[competitionDates] `date_precision` absent — ajoute-le au select, sinon une compétition à l’année peut être dite « en cours ».', comp)
  }
  const end = String(comp?.date_end || '').slice(0, 10) || start
  const today = todayISO(now)
  if (today > end) return 'past'
  if (today < start) return 'upcoming'
  return comp?.date_precision === 'day' && !comp?.cancelled ? 'live' : 'upcoming'
}

// Slug décoratif : seul l'id en tête est lu au routage, donc renommer une
// compétition ne casse aucun lien déjà partagé.
// Les marques diacritiques sont écrites en séquences d'échappement : sous forme
// littérale, ce sont des caractères combinants invisibles dans un éditeur, qu'un
// formateur ou une normalisation NFC peut fondre dans le crochet précédent.
export const slugify = (s) => String(s || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)

export const competitionPath = (comp) => {
  if (comp?.id == null) return '/competitions'
  const slug = slugify(comp.name)
  return `/competitions/${comp.id}${slug ? `-${slug}` : ''}`
}

// L'inverse : `10-championnat-de-france-2026` → 10. Le séparateur est exigé pour
// que `10nimportequoi` ne résolve pas silencieusement vers la compétition 10.
export const idFromParam = (param) => {
  const m = /^(\d+)(?:-|$)/.exec(String(param || ''))
  if (!m) return null
  // Borné : un id démesuré partait en requête, où Postgres le rejetait avec une
  // erreur qui n'est pas « aucune ligne » — la page affichait alors « réessayez
  // plus tard » sur une URL qui ne pourra jamais exister.
  const n = Number(m[1])
  return Number.isSafeInteger(n) && n > 0 ? n : null
}

/**
 * Découpe une date déjà formatée en segments, en marquant les noms de mois.
 * Sert à ne mettre en couleur que le mois : c'est lui qui sert de point d'appui
 * quand on parcourt un fil du regard, plus que le quantième ou l'année.
 *
 * Le découpage s'appuie sur la liste exacte des mois de la langue, jamais sur
 * une heuristique — « mai » ne doit pas être trouvé à l'intérieur d'un mot.
 */
export function dateSegments(text, lang = 'fr') {
  const months = MONTHS[lang] || MONTHS.fr
  if (!text) return []
  const re = new RegExp(`\\b(${months.join('|')})\\b`, 'g')
  return String(text).split(re).filter(Boolean).map(part => ({
    text: part,
    isMonth: months.includes(part),
  }))
}
