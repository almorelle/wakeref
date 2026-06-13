import { useState } from 'react'
import { LanguageContext } from './language-context'

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
