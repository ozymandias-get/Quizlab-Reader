/**
 * Cookie Şifreleme Modülü
 * 
 * Electron safeStorage API'si kullanarak cookie bilgilerini güvenli şekilde şifreler.
 * - Windows: DPAPI (Data Protection API) kullanır
 * - macOS: Keychain kullanır
 * - Linux: Secret Service API kullanır
 * 
 * Bu sayede cookie verileri disk üzerinde düz metin olarak saklanmaz.
 */
const { safeStorage } = require('electron')

/**
 * Şifrelemenin kullanılabilir olup olmadığını kontrol eder
 * @returns {boolean}
 */
function isEncryptionAvailable() {
    return safeStorage.isEncryptionAvailable()
}

/**
 * Metni şifreler ve Base64 formatında döndürür
 * @param {string} plainText - Şifrelenecek metin
 * @returns {string|null} - Şifrelenmiş Base64 string veya null
 */
function encrypt(plainText) {
    try {
        if (!isEncryptionAvailable()) {
            console.warn('[CookieEncryption] Şifreleme mevcut değil, düz metin kullanılacak')
            return null
        }

        if (!plainText || typeof plainText !== 'string') {
            return null
        }

        // safeStorage.encryptString Buffer döndürür
        const encryptedBuffer = safeStorage.encryptString(plainText)

        // Buffer'ı Base64'e çevir (JSON'da saklanabilsin)
        return encryptedBuffer.toString('base64')
    } catch (error) {
        console.error('[CookieEncryption] Şifreleme hatası:', error)
        return null
    }
}

/**
 * Base64 şifreli metni çözer
 * @param {string} encryptedBase64 - Şifrelenmiş Base64 string
 * @returns {string|null} - Çözülmüş metin veya null
 */
function decrypt(encryptedBase64) {
    try {
        if (!isEncryptionAvailable()) {
            console.warn('[CookieEncryption] Şifreleme mevcut değil')
            return null
        }

        if (!encryptedBase64 || typeof encryptedBase64 !== 'string') {
            return null
        }

        // Base64'ü Buffer'a çevir
        const encryptedBuffer = Buffer.from(encryptedBase64, 'base64')

        // safeStorage.decryptString ile çöz
        return safeStorage.decryptString(encryptedBuffer)
    } catch (error) {
        console.error('[CookieEncryption] Deşifreleme hatası:', error)
        return null
    }
}

/**
 * Cookie array'ini şifreler
 * @param {Array} cookies - Cookie nesneleri dizisi
 * @returns {object} - { encrypted: true, data: "..." } veya şifreleme yoksa { encrypted: false, data: null, noEncryption: true }
 */
function encryptCookies(cookies) {
    if (!cookies || !Array.isArray(cookies)) {
        return { encrypted: false, data: [] }
    }

    // JSON'a çevir
    const jsonString = JSON.stringify(cookies)

    // Şifrele
    const encryptedData = encrypt(jsonString)

    if (encryptedData) {
        return {
            encrypted: true,
            data: encryptedData
        }
    }

    // GÜVENLİK: Şifreleme başarısız olursa cookie verilerini DİSKE YAZMA
    // Düz metin cookie verileri güvenlik riski oluşturur
    console.warn('[CookieEncryption] ⚠️ Şifreleme başarısız - cookie verileri diske YAZILMAYACAK (güvenlik)')
    return {
        encrypted: false,
        data: null,
        noEncryption: true // Bu flag, şifrelemenin mevcut olmadığını belirtir
    }
}

/**
 * Şifrelenmiş cookie verisini çözer
 * @param {object} cookieData - { encrypted: boolean, data: string|array }
 * @returns {Array} - Cookie nesneleri dizisi
 */
function decryptCookies(cookieData) {
    if (!cookieData) {
        return []
    }

    // Eski format (şifresiz array)
    if (Array.isArray(cookieData)) {
        return cookieData
    }

    // Yeni format (object)
    if (typeof cookieData === 'object') {
        // noEncryption: Şifreleme mevcut değildi, cookie verisi kaydedilmedi
        if (cookieData.noEncryption || cookieData.data === null) {
            return []
        }

        // Şifrelenmemiş veri (eski format, migration için)
        if (!cookieData.encrypted) {
            return Array.isArray(cookieData.data) ? cookieData.data : []
        }

        // Şifrelenmiş veri
        const decryptedJson = decrypt(cookieData.data)
        if (decryptedJson) {
            try {
                return JSON.parse(decryptedJson)
            } catch (e) {
                console.error('[CookieEncryption] JSON parse hatası:', e)
                return []
            }
        }
    }

    return []
}

/**
 * Mevcut profil verisinin migration'ını yapar (eski düz formatı şifreli formata çevirir)
 * @param {object} profileData - Profil verisi { profiles: [...], activeProfileId: ... }
 * @returns {object} - Güncellenmiş profil verisi
 */
function migrateProfileData(profileData) {
    if (!profileData || !profileData.profiles) {
        return profileData
    }

    let needsSave = false

    for (const profile of profileData.profiles) {
        // Eski format: cookies doğrudan array
        if (profile.cookies && Array.isArray(profile.cookies)) {
            console.log(`[CookieEncryption] Migrating profile: ${profile.name}`)
            profile.cookieData = encryptCookies(profile.cookies)
            delete profile.cookies // Eski alanı sil
            needsSave = true
        }

        // Zaten yeni format ama encrypted false ise şifrelemeyi dene
        if (profile.cookieData && !profile.cookieData.encrypted && isEncryptionAvailable()) {
            const cookies = decryptCookies(profile.cookieData)
            if (cookies.length > 0) {
                profile.cookieData = encryptCookies(cookies)
                needsSave = true
            }
        }
    }

    if (needsSave) {
        profileData._migrated = true
    }

    return profileData
}

module.exports = {
    isEncryptionAvailable,
    encrypt,
    decrypt,
    encryptCookies,
    decryptCookies,
    migrateProfileData
}
