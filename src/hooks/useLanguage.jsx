// src/hooks/useLanguage.jsx
// Language context — provides lang state and t() translation function
// Persists choice in localStorage

import { createContext, useContext, useState, useCallback } from 'react'
import { getT } from '../utils/i18n'

const LangContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('nj_lang') || 'en' } catch { return 'en' }
  })

  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next = prev === 'en' ? 'ta' : 'en'
      try { localStorage.setItem('nj_lang', next) } catch {}
      return next
    })
  }, [])

  const t = useCallback((section, key) => getT(lang)(section, key), [lang])

  return (
    <LangContext.Provider value={{ lang, toggleLang, t, isTamil: lang === 'ta' }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLanguage must be inside LanguageProvider')
  return ctx
}
