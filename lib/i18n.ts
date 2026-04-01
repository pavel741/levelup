/**
 * Standalone i18n for use outside React (stores, utils, etc.)
 * Reads language from localStorage - use when useLanguage() is not available
 */
import enTranslations from '@/lib/translations/en.json'
import etTranslations from '@/lib/translations/et.json'

type Language = 'en' | 'et'
type Translations = typeof enTranslations

const translations: Record<Language, Translations> = {
  en: enTranslations,
  et: etTranslations,
}

function getLanguage(): Language {
  if (typeof window === 'undefined') return 'en'
  const saved = localStorage.getItem('language') as Language
  if (saved === 'en' || saved === 'et') return saved
  const browser = navigator.language?.split('-')[0]
  return browser === 'et' ? 'et' : 'en'
}

export function getT(key: string, params?: Record<string, string | number>): string {
  const lang = getLanguage()
  const keys = key.split('.')
  let value: unknown = translations[lang]

  for (const k of keys) {
    if (value && typeof value === 'object' && k in (value as object)) {
      value = (value as Record<string, unknown>)[k]
    } else {
      value = translations.en
      for (const fk of keys) {
        if (value && typeof value === 'object' && fk in (value as object)) {
          value = (value as Record<string, unknown>)[fk]
        } else {
          return key
        }
      }
      break
    }
  }

  if (typeof value !== 'string') return key
  if (params) {
    return value.replace(/\{(\w+)\}/g, (_, p) => params[p]?.toString() ?? _)
  }
  return value
}
