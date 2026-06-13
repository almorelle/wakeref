import { createContext, useContext } from 'react'

export const LanguageContext = createContext(null)

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
