import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { translations, LANGUAGES, DEFAULT_LANGUAGE, VALID_LANGUAGES } from '../constants/translations'
import { STORAGE_KEYS } from '../constants/storageKeys'

export const LanguageContext = createContext(null)

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
    const t = useCallback((key, params = {}) => {
        // Dot notation desteği (Örn: toast.info.title)
        const getNestedValue = (obj, path) => {
            return path.split('.').reduce((acc, part) => acc && acc[part], obj);
        };

        let translation = getNestedValue(translations[language], key) ||
            getNestedValue(translations[DEFAULT_LANGUAGE], key) ||
            key;

        // Eğer sonuç bir obje ise (eksik anahtar), key'i geri dön
        if (typeof translation !== 'string') {
            translation = key;
        }

        // Parametreleri yerleştir (Interpolation)
        if (params && typeof params === 'object') {
            Object.entries(params).forEach(([k, v]) => {
                translation = translation.replace(new RegExp(`\\{${k}\\}`, 'g'), v)
            })
        }

        return translation
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
