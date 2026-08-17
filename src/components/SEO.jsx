import { useEffect } from 'react'
import { useLanguage } from '../contexts/language-context'

const SITE_NAME = 'WakeRef'
const SITE_URL  = 'https://wakeref.app'
const OG_IMAGE  = `${SITE_URL}/og-image.jpg`

const DEFAULT = {
  fr: {
    title:       'WakeRef',
    description: 'Référentiel complet des figures de wakeboard et wakeskate. Grabs, spins, raileys, inverts — référence complète de tricks, expliqués et en vidéo.',
  },
  en: {
    title:       'WakeRef',
    description: 'Complete wakeboard and wakeskate tricks reference. Grabs, spins, raileys, inverts — complete reference for tricks, explained and on video.',
  },
}

export default function SEO({ titleFr, titleEn, descriptionFr, descriptionEn, path = '', noindex = false }) {
  const { lang } = useLanguage()

  const title       = (lang === 'en' ? titleEn       : titleFr)       || DEFAULT[lang].title
  const description = (lang === 'en' ? descriptionEn : descriptionFr) || DEFAULT[lang].description
  const fullTitle   = title === SITE_NAME ? SITE_NAME : `${title} | ${SITE_NAME}`
  const url         = `${SITE_URL}${path}`

  useEffect(() => {
    // Title
    document.title = fullTitle

    // Meta description
    setMeta('name', 'description', description)

    // Indexation : les pages non publiques (ex. outils juge) se retirent des
    // moteurs. Toujours posé (et remis à index en quittant la page) car setMeta
    // mute le <head> partagé entre les routes.
    setMeta('name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow')

    // URL canonique auto-référente. Indispensable en SPA : sans elle, Google
    // regroupe les routes (qui servent toutes le même index.html) et choisit
    // lui-même une canonique → « page en double sans URL canonique choisie ».
    // `url` n'inclut jamais les query params (ex. ?cat=…), donc les variantes
    // filtrées de /figures se consolident sur /figures. Sur une page noindex on
    // retire la canonical pour ne pas envoyer de signaux contradictoires.
    if (noindex) removeLink('canonical')
    else setLink('canonical', url)

    // OG
    setMeta('property', 'og:title',       fullTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:image',       OG_IMAGE)
    setMeta('property', 'og:url',         url)
    setMeta('property', 'og:type',        'website')
    setMeta('property', 'og:site_name',   SITE_NAME)
    setMeta('property', 'og:locale',      lang === 'en' ? 'en_US' : 'fr_FR')
  }, [fullTitle, description, url, lang, noindex])

  return null
}

function setMeta(attr, name, content) {
  let el = document.querySelector(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function removeLink(rel) {
  const el = document.querySelector(`link[rel="${rel}"]`)
  if (el) el.remove()
}
