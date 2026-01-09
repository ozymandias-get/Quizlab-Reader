/**
 * localStorage Key Sabitleri
 * 
 * Tüm localStorage key'leri burada merkezi olarak tanımlanır.
 * Bu yaklaşım:
 * - Yazım hatalarını önler (IDE otomatik tamamlama sağlar)
 * - Key'lerin nerede kullanıldığını bulmayı kolaylaştırır
 * - Refactoring'i güvenli hale getirir
 * - Çakışmaları önler
 * 
 * Kullanım:
 * import { STORAGE_KEYS } from '../constants/storageKeys'
 * useLocalStorage(STORAGE_KEYS.LEFT_PANEL_WIDTH, 50)
 */

export const STORAGE_KEYS = {
    // Panel Ayarları
    /** Sol panelin genişlik yüzdesi (number) */
    LEFT_PANEL_WIDTH: 'leftPanelWidth',

    // AI Ayarları
    /** Son seçilen AI platform ID'si (string: 'gemini' | 'chatgpt') */
    LAST_SELECTED_AI: 'lastSelectedAI',

    /** Otomatik gönder özelliği aktif mi (boolean) */
    AUTO_SEND_ENABLED: 'autoSendEnabled',

    // Dil Ayarları
    /** Uygulama dili (string: 'tr' | 'en' | 'zh' | 'es' | 'ar') */
    APP_LANGUAGE: 'appLanguage'
}

/**
 * Storage key'lerinin türleri (TypeScript benzeri dokümantasyon)
 * @typedef {Object} StorageKeyTypes
 * @property {number} LEFT_PANEL_WIDTH - 0-100 arası yüzde değeri
 * @property {string} LAST_SELECTED_AI - 'gemini' veya 'chatgpt'
 * @property {boolean} AUTO_SEND_ENABLED - true veya false
 * @property {string} APP_LANGUAGE - Dil kodu
 */

/**
 * Tüm localStorage verilerini temizle (debug/reset için)
 */
export function clearAllStorageKeys() {
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
    })
}

/**
 * Belirli bir key'in localStorage'da olup olmadığını kontrol et
 * @param {string} key - STORAGE_KEYS'den bir key
 * @returns {boolean}
 */
export function hasStorageKey(key) {
    return localStorage.getItem(key) !== null
}

export default STORAGE_KEYS
