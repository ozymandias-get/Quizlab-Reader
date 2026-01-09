import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { translations, LANGUAGES, DEFAULT_LANGUAGE, VALID_LANGUAGES } from '../constants/translations'
import { STORAGE_KEYS } from '../constants/storageKeys'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
    const [language, setLanguageState] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.APP_LANGUAGE)
        return saved && VALID_LANGUAGES.includes(saved) ? saved : DEFAULT_LANGUAGE
    })

    // Dil değiştirme fonksiyonu
    const setLanguage = useCallback((newLang) => {
        if (VALID_LANGUAGES.includes(newLang)) {
            setLanguageState(newLang)
            localStorage.setItem(STORAGE_KEYS.APP_LANGUAGE, newLang)

            // RTL diller için document direction ayarla
            const langConfig = LANGUAGES[newLang]
            document.documentElement.dir = langConfig?.dir || 'ltr'
            document.documentElement.lang = newLang
        }
    }, [])

    // İlk yüklemede direction ayarla
    useEffect(() => {
        const langConfig = LANGUAGES[language]
        document.documentElement.dir = langConfig?.dir || 'ltr'
        document.documentElement.lang = language
    }, [language])

    // Çeviri fonksiyonu
    const t = useCallback((key) => {
        return translations[language]?.[key] || translations[DEFAULT_LANGUAGE]?.[key] || key
    }, [language])

    // Context value'yu memoize ederek gereksiz re-render'ları önle
    const value = useMemo(() => ({
        language,
        setLanguage,
        t,
        languages: LANGUAGES,
        currentLanguage: LANGUAGES[language]
    }), [language, setLanguage, t])

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}

export default LanguageContext
