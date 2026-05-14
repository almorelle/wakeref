import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext(null)

const SUPPORTED = ['fr', 'en']
const STORAGE_KEY = 'wakeref_lang'

function detectLang() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && SUPPORTED.includes(stored)) return stored
  const browser = navigator.language?.slice(0, 2).toLowerCase()
  return SUPPORTED.includes(browser) ? browser : 'fr'
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectLang)

  const setLang = (l) => {
    setLangState(l)
    localStorage.setItem(STORAGE_KEY, l)
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}

// Retourne le bon champ selon la langue, avec fallback FR
export function useLocalizedField() {
  const { lang } = useLanguage()
  return (figure, field) => {
    if (lang === 'en') {
      const enVal = figure[`${field}_en`]
      if (enVal && (Array.isArray(enVal) ? enVal.length > 0 : enVal.trim()))
        return enVal
    }
    return figure[field]
  }
}
