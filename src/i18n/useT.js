import { useLanguage } from '../contexts/language-context'
import { t } from './translations'

export function useT() {
  const { lang } = useLanguage()
  return t[lang] || t.fr
}
