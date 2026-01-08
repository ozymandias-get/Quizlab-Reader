import { useState, useEffect, useCallback } from 'react'

/**
 * SSR/Test ortamı kontrolü
 * window objesi olmayan ortamlarda (Jest, Vitest, SSR) hata vermemek için
 */
const isClient = typeof window !== 'undefined'

/**
 * localStorage'a güvenli erişim sağlar
 * window undefined ise null döner
 */
const getStorageItem = (key) => {
    if (!isClient) return null
    try {
        return localStorage.getItem(key)
    } catch (error) {
        console.warn(`localStorage erişim hatası (get "${key}"):`, error)
        return null
    }
}

/**
 * localStorage'a güvenli yazma sağlar
 * window undefined ise sessizce başarısız olur
 */
const setStorageItem = (key, value) => {
    if (!isClient) return false
    try {
        localStorage.setItem(key, value)
        return true
    } catch (error) {
        console.warn(`localStorage yazma hatası (set "${key}"):`, error)
        return false
    }
}

/**
 * localStorage ile state senkronizasyonu sağlayan hook
 * SSR ve test ortamlarında güvenli çalışır
 * 
 * @param {string} key - localStorage'daki anahtar
 * @param {any} initialValue - Başlangıç değeri
 * @returns {[any, Function]} - [değer, setter fonksiyonu]
 */
export function useLocalStorage(key, initialValue) {
    // Başlangıç değerini localStorage'dan al veya varsayılan kullan
    const [storedValue, setStoredValue] = useState(() => {
        // SSR/Test ortamında localStorage erişilemez
        if (!isClient) return initialValue

        try {
            const item = getStorageItem(key)
            return item !== null ? JSON.parse(item) : initialValue
        } catch (error) {
            console.warn(`useLocalStorage: "${key}" için değer okunamadı:`, error)
            return initialValue
        }
    })

    // Cross-window senkronizasyon için storage event'i dinle
    useEffect(() => {
        // SSR/Test ortamında event listener ekleme
        if (!isClient) return

        const handleStorageChange = (e) => {
            // Sadece ilgili key değiştiğinde ve başka pencereden geldiyse
            if (e.key === key && e.newValue !== null) {
                try {
                    setStoredValue(JSON.parse(e.newValue))
                } catch (error) {
                    console.warn(`useLocalStorage: "${key}" için cross-window sync başarısız:`, error)
                }
            } else if (e.key === key && e.newValue === null) {
                // Key silindiyse initialValue'ya dön
                setStoredValue(initialValue)
            }
        }

        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [key, initialValue])

    // Değer değiştiğinde localStorage'a kaydet
    const setValue = useCallback((value) => {
        try {
            // Fonksiyon olarak gelen değeri de destekle
            const valueToStore = value instanceof Function ? value(storedValue) : value
            setStoredValue(valueToStore)
            setStorageItem(key, JSON.stringify(valueToStore))
        } catch (error) {
            console.warn(`useLocalStorage: "${key}" için değer kaydedilemedi:`, error)
        }
    }, [key, storedValue])

    return [storedValue, setValue]
}

/**
 * String değerler için localStorage hook'u (JSON parse etmeden)
 * SSR ve test ortamlarında güvenli çalışır
 * 
 * @param {string} key - localStorage'daki anahtar
 * @param {string} initialValue - Başlangıç değeri
 * @param {string[]} validValues - Geçerli değerler listesi (opsiyonel)
 * @returns {[string, Function]} - [değer, setter fonksiyonu]
 */
export function useLocalStorageString(key, initialValue, validValues = null) {
    const [storedValue, setStoredValue] = useState(() => {
        // SSR/Test ortamında localStorage erişilemez
        if (!isClient) return initialValue

        try {
            const item = getStorageItem(key)
            if (item !== null) {
                // Geçerli değerler varsa kontrol et
                if (validValues && !validValues.includes(item)) {
                    return initialValue
                }
                return item
            }
            return initialValue
        } catch (error) {
            console.warn(`useLocalStorageString: "${key}" için değer okunamadı:`, error)
            return initialValue
        }
    })

    // Cross-window senkronizasyon
    useEffect(() => {
        // SSR/Test ortamında event listener ekleme
        if (!isClient) return

        const handleStorageChange = (e) => {
            if (e.key === key && e.newValue !== null) {
                // Geçerli değerler varsa kontrol et
                if (validValues && !validValues.includes(e.newValue)) {
                    return
                }
                setStoredValue(e.newValue)
            } else if (e.key === key && e.newValue === null) {
                setStoredValue(initialValue)
            }
        }

        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [key, initialValue, validValues])

    const setValue = useCallback((value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value
            setStoredValue(valueToStore)
            setStorageItem(key, valueToStore)
        } catch (error) {
            console.warn(`useLocalStorageString: "${key}" için değer kaydedilemedi:`, error)
        }
    }, [key, storedValue])

    return [storedValue, setValue]
}

/**
 * Boolean değerler için localStorage hook'u
 * SSR ve test ortamlarında güvenli çalışır
 * 
 * @param {string} key - localStorage'daki anahtar
 * @param {boolean} initialValue - Başlangıç değeri
 * @returns {[boolean, Function, Function]} - [değer, setter, toggle fonksiyonu]
 */
export function useLocalStorageBoolean(key, initialValue = false) {
    const [storedValue, setStoredValue] = useState(() => {
        // SSR/Test ortamında localStorage erişilemez
        if (!isClient) return initialValue

        try {
            const item = getStorageItem(key)
            // null ise (key yok) initialValue kullan
            if (item === null) return initialValue
            return item === 'true'
        } catch (error) {
            console.warn(`useLocalStorageBoolean: "${key}" için değer okunamadı:`, error)
            return initialValue
        }
    })

    // Cross-window senkronizasyon
    useEffect(() => {
        // SSR/Test ortamında event listener ekleme
        if (!isClient) return

        const handleStorageChange = (e) => {
            if (e.key === key && e.newValue !== null) {
                setStoredValue(e.newValue === 'true')
            } else if (e.key === key && e.newValue === null) {
                setStoredValue(initialValue)
            }
        }

        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [key, initialValue])

    const setValue = useCallback((value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value
            setStoredValue(valueToStore)
            setStorageItem(key, valueToStore.toString())
        } catch (error) {
            console.warn(`useLocalStorageBoolean: "${key}" için değer kaydedilemedi:`, error)
        }
    }, [key, storedValue])

    const toggle = useCallback(() => {
        setValue((prev) => !prev)
    }, [setValue])

    return [storedValue, setValue, toggle]
}
