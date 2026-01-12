'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import enTranslations from '@/lib/translations/en.json'
import etTranslations from '@/lib/translations/et.json'

type Language = 'en' | 'et'

type Translations = typeof enTranslations

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const translations: Record<Language, Translations> = {
  en: enTranslations,
  et: etTranslations,
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language
    let langToSet: Language = 'en'
    
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'et')) {
      langToSet = savedLanguage
    } else {
      // Try to detect browser language
      const browserLang = navigator.language.split('-')[0]
      if (browserLang === 'et') {
        langToSet = 'et'
      }
    }
    
    setLanguageState(langToSet)
    // Update HTML lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = langToSet
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
    // Update HTML lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang
    }
  }

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.')
    let value: any = translations[language]
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        // Fallback to English if translation not found
        value = translations.en
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey]
          } else {
            return key // Return key if translation not found
          }
        }
        break
      }
    }
    
    if (typeof value !== 'string') {
      return key
    }
    
    // Replace placeholders with params
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() ?? match
      })
    }
    
    return value
  }

  // Update HTML lang attribute when language changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language
    }
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

