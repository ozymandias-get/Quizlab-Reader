import { useState, useEffect } from 'react'

/**
 * localStorage ile state senkronizasyonu sağlayan hook
 * @param {string} key - localStorage'daki anahtar
 * @param {any} initialValue - Başlangıç değeri
 * @returns {[any, Function]} - [değer, setter fonksiyonu]
 */
export function useLocalStorage(key, initialValue) {
    // Başlangıç değerini localStorage'dan al veya varsayılan kullan
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = localStorage.getItem(key)
            return item !== null ? JSON.parse(item) : initialValue
        } catch (error) {
            console.warn(`useLocalStorage: "${key}" için değer okunamadı:`, error)
            return initialValue
        }
    })

    // Değer değiştiğinde localStorage'a kaydet
    const setValue = (value) => {
        try {
            // Fonksiyon olarak gelen değeri de destekle
            const valueToStore = value instanceof Function ? value(storedValue) : value
            setStoredValue(valueToStore)
            localStorage.setItem(key, JSON.stringify(valueToStore))
        } catch (error) {
            console.warn(`useLocalStorage: "${key}" için değer kaydedilemedi:`, error)
        }
    }

    return [storedValue, setValue]
}

/**
 * String değerler için localStorage hook'u (JSON parse etmeden)
 * @param {string} key - localStorage'daki anahtar
 * @param {string} initialValue - Başlangıç değeri
 * @param {string[]} validValues - Geçerli değerler listesi (opsiyonel)
 * @returns {[string, Function]} - [değer, setter fonksiyonu]
 */
export function useLocalStorageString(key, initialValue, validValues = null) {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = localStorage.getItem(key)
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

    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value
            setStoredValue(valueToStore)
            localStorage.setItem(key, valueToStore)
        } catch (error) {
            console.warn(`useLocalStorageString: "${key}" için değer kaydedilemedi:`, error)
        }
    }

    return [storedValue, setValue]
}

/**
 * Boolean değerler için localStorage hook'u
 * @param {string} key - localStorage'daki anahtar
 * @param {boolean} initialValue - Başlangıç değeri
 * @returns {[boolean, Function]} - [değer, setter/toggle fonksiyonu]
 */
export function useLocalStorageBoolean(key, initialValue = false) {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = localStorage.getItem(key)
            return item === 'true'
        } catch (error) {
            console.warn(`useLocalStorageBoolean: "${key}" için değer okunamadı:`, error)
            return initialValue
        }
    })

    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value
            setStoredValue(valueToStore)
            localStorage.setItem(key, valueToStore.toString())
        } catch (error) {
            console.warn(`useLocalStorageBoolean: "${key}" için değer kaydedilemedi:`, error)
        }
    }

    const toggle = () => setValue(!storedValue)

    return [storedValue, setValue, toggle]
}
