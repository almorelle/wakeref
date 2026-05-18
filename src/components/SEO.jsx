import { useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

const SITE_NAME = 'WakeRef'
const SITE_URL  = 'https://wakeref.app'
const OG_IMAGE  = `${SITE_URL}/og-image.jpg`

const DEFAULT = {
  fr: {
    title:       'WakeRef',
    description: 'Référentiel complet des figures de wakeboard et wakeskate.',
  },
  en: {
    title:       'WakeRef',
    description: 'Complete wakeboard and wakeskate tricks reference.',
  },
}

export default function SEO({ titleFr, titleEn, descriptionFr, descriptionEn, path = '' }) {
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

    // OG
    setMeta('property', 'og:title',       fullTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:image',       OG_IMAGE)
    setMeta('property', 'og:url',         url)
    setMeta('property', 'og:type',        'website')
    setMeta('property', 'og:site_name',   SITE_NAME)
    setMeta('property', 'og:locale',      lang === 'en' ? 'en_US' : 'fr_FR')
  }, [fullTitle, description, url, lang])

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
