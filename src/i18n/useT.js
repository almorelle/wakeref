import { useLanguage } from '../contexts/LanguageContext'
import { t } from './translations'

export function useT() {
  const { lang } = useLanguage()
  return t[lang] || t.fr
}
