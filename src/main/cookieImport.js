/**
 * Cookie Import Module
 * Manuel cookie import işlemleri - JSON ve dosya import
 */
const { ipcMain, dialog } = require('electron')
const fs = require('fs')
const { loadProfiles, saveProfiles, loadCookiesToPartition } = require('./profileManager')
const { encryptCookies } = require('./cookieEncryption')

// Validation sabitleri
const MAX_COOKIES = 500 // Maksimum cookie sayısı
const MAX_JSON_SIZE = 1024 * 1024 // 1MB maksimum JSON boyutu
const ALLOWED_DOMAINS = [
    // Google servisleri
    '.google.com', 'google.com',
    '.accounts.google.com', 'accounts.google.com',
    '.gemini.google.com', 'gemini.google.com',
    '.aistudio.google.com', 'aistudio.google.com',
    '.googleapis.com', 'googleapis.com',
    // OpenAI servisleri
    '.openai.com', 'openai.com',
    '.chatgpt.com', 'chatgpt.com',
    '.auth0.com', 'auth0.com',
    // Diğer AI servisleri
    '.anthropic.com', 'anthropic.com',
    '.claude.ai', 'claude.ai'
]

/**
 * GÜVENLİK: Domain'in izin listesinde olup olmadığını kontrol eder
 * 
 * KATI EŞLEŞTİRME KURALLARI:
 * 1. Tam eşleşme: ".google.com" === ".google.com" ✓
 * 2. Subdomain eşleşme: ".accounts.google.com".endsWith(".google.com") ✓
 *    - Önemli: "." prefix zorunlu, "evilgoogle.com" REDDEDILIR
 * 3. REDDETME: "maliciousgoogle.com" !== "google.com" (kötü niyetli)
 * 4. REDDETME: "google.com.evil.com" !== "google.com" (phishing)
 * 
 * @param {string} domain - Kontrol edilecek cookie domain'i
 * @returns {boolean} - İzinli ise true
 */
function isDomainAllowed(domain) {
    if (!domain || typeof domain !== 'string') return false

    const normalizedDomain = domain.toLowerCase().trim()

    // GÜVENLİK: Sadece geçerli domain karakterlerini kabul et
    if (!/^[a-z0-9.-]+$/.test(normalizedDomain)) {
        return false
    }

    for (const allowed of ALLOWED_DOMAINS) {
        const normalizedAllowed = allowed.toLowerCase().trim()

        // 1. Tam eşleşme: ".google.com" === ".google.com"
        if (normalizedDomain === normalizedAllowed) {
            return true
        }

        // 2. Subdomain eşleşmesi için KATI KONTROL:
        // Cookie domain ".accounts.google.com" ve allowed ".google.com" için
        // normalizedDomain.endsWith(normalizedAllowed) kullanırız
        // AMA sadece allowed "." ile başlıyorsa - bu subdomain belirtir
        // 
        // GÜVENLİK: "maliciousgoogle.com".endsWith("google.com") = true OLURDU
        // FAKAT "maliciousgoogle.com".endsWith(".google.com") = false
        // Bu sayede kötü niyetli domain'ler geçemez!

        if (normalizedAllowed.startsWith('.')) {
            // Allowed zaten "." ile başlıyor, direkt endsWith kontrolü güvenli
            if (normalizedDomain.endsWith(normalizedAllowed)) {
                return true
            }
        } else {
            // Allowed "." ile başlamıyor (örn: "google.com")
            // Bu durumda subdomain kontrolü için "." prefix ekle
            if (normalizedDomain.endsWith('.' + normalizedAllowed)) {
                return true
            }
        }
    }

    return false
}

/**
 * Tek bir cookie objesini doğrula
 * @param {object} cookie 
 * @returns {{ valid: boolean, error?: string }}
 */
function validateCookie(cookie) {
    // Gerekli alanlar
    if (!cookie || typeof cookie !== 'object') {
        return { valid: false, error: 'Cookie bir obje olmalı' }
    }

    if (!cookie.name || typeof cookie.name !== 'string') {
        return { valid: false, error: 'Cookie name gerekli ve string olmalı' }
    }

    if (cookie.value === undefined || cookie.value === null) {
        return { valid: false, error: 'Cookie value gerekli' }
    }

    // Domain kontrolü
    const domain = cookie.domain || ''
    if (!domain) {
        return { valid: false, error: 'Cookie domain gerekli' }
    }

    // GÜVENLİK: Katı domain whitelist kontrolü
    if (!isDomainAllowed(domain)) {
        return { valid: false, error: `İzin verilmeyen domain: ${domain}` }
    }

    return { valid: true }
}

/**
 * Cookie listesini doğrula ve filtrele
 * @param {Array} cookies 
 * @returns {{ validCookies: Array, errors: object, stats: object }}
 */
function validateAndFilterCookies(cookies) {
    const validCookies = []

    // Kategorize edilmiş hata listleri - kullanıcıya daha iyi feedback
    const domainErrors = []  // Domain filtresine takılan cookie'ler
    const formatErrors = []  // Format hatası olan cookie'ler

    let skippedDomain = 0
    let skippedInvalid = 0

    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i]
        const validation = validateCookie(cookie)

        if (validation.valid) {
            // Sanitize - tehlikeli alanları temizle
            validCookies.push({
                name: String(cookie.name).slice(0, 256), // Max 256 karakter
                value: String(cookie.value).slice(0, 4096), // Max 4KB value
                domain: String(cookie.domain).slice(0, 256),
                path: cookie.path || '/',
                secure: Boolean(cookie.secure),
                httpOnly: Boolean(cookie.httpOnly),
                expirationDate: cookie.expirationDate || cookie.expires,
                sameSite: cookie.sameSite
            })
        } else {
            // Hataları kategorize et
            const isDomainError = validation.error?.includes('domain') ||
                validation.error?.includes('İzin verilmeyen')

            if (isDomainError) {
                skippedDomain++
                // İlk 3 domain hatasını kaydet (örnek olarak)
                if (domainErrors.length < 3) {
                    const domainInfo = cookie?.domain || 'bilinmeyen'
                    domainErrors.push({
                        index: i + 1,
                        domain: domainInfo,
                        name: cookie?.name?.slice(0, 30) || 'bilinmeyen'
                    })
                }
            } else {
                skippedInvalid++
                // İlk 3 format hatasını kaydet
                if (formatErrors.length < 3) {
                    formatErrors.push({
                        index: i + 1,
                        error: validation.error,
                        name: cookie?.name?.slice(0, 30) || 'bilinmeyen'
                    })
                }
            }
        }
    }

    // Kullanıcı dostu hata mesajları oluştur
    const errorMessages = []

    if (domainErrors.length > 0) {
        const examples = domainErrors.map(e => `#${e.index} (${e.domain})`).join(', ')
        errorMessages.push(`${skippedDomain} cookie izin verilmeyen domain'den: ${examples}${skippedDomain > 3 ? '...' : ''}`)
    }

    if (formatErrors.length > 0) {
        const examples = formatErrors.map(e => `#${e.index}: ${e.error}`).join('; ')
        errorMessages.push(`${skippedInvalid} cookie format hatası: ${examples}${skippedInvalid > 3 ? '...' : ''}`)
    }

    return {
        validCookies,
        errors: {
            messages: errorMessages,
            domainErrors,
            formatErrors
        },
        stats: {
            total: cookies.length,
            valid: validCookies.length,
            skippedDomain,
            skippedInvalid
        }
    }
}

/**
 * Cookie import IPC handler'ları kaydet
 */
function registerCookieImportHandlers() {
    // Cookie JSON'ı import et (yapıştırma)
    ipcMain.handle('import-cookies-json', async (event, cookiesJson) => {
        try {
            // Boyut kontrolü
            if (typeof cookiesJson === 'string' && cookiesJson.length > MAX_JSON_SIZE) {
                return { success: false, error: `JSON çok büyük (max ${MAX_JSON_SIZE / 1024}KB)` }
            }

            let cookies

            try {
                cookies = JSON.parse(cookiesJson)
            } catch (e) {
                return { success: false, error: 'Geçersiz JSON formatı' }
            }

            if (!Array.isArray(cookies)) {
                if (typeof cookies === 'object') {
                    cookies = [cookies]
                } else {
                    return { success: false, error: 'Cookie listesi bekleniyor' }
                }
            }

            // Cookie sayısı kontrolü
            if (cookies.length > MAX_COOKIES) {
                return { success: false, error: `Çok fazla cookie (max ${MAX_COOKIES})` }
            }

            // Validation ve filtreleme
            const { validCookies, errors, stats } = validateAndFilterCookies(cookies)

            if (validCookies.length === 0) {
                // Detaylı hata mesajı oluştur
                const errorMsg = errors.messages.length > 0
                    ? errors.messages.join(' | ')
                    : 'Geçerli cookie bulunamadı'
                return {
                    success: false,
                    error: errorMsg,
                    stats
                }
            }

            console.log(`[CookieImport] Validation: ${stats.valid}/${stats.total} geçerli, ${stats.skippedDomain} domain filtresi, ${stats.skippedInvalid} geçersiz`)

            // Aktif profili bul ve partition'ı belirle
            const data = loadProfiles()
            const activeId = data.activeProfileId
            const partition = activeId ? `persist:profile_${activeId}` : 'persist:ai_session'

            // Profil varsa yedeği şifreli olarak güncelle
            if (activeId) {
                const profile = data.profiles.find(p => p.id === activeId)
                if (profile) {
                    profile.cookieData = encryptCookies(validCookies)
                    saveProfiles(data)
                    console.log('[CookieImport] 🔐 Cookie yedeği şifreli olarak güncellendi')
                }
            }

            // Optimize edilmiş yardımcı fonksiyonu kullan
            const importedCount = await loadCookiesToPartition(partition, validCookies)
            let errorCount = validCookies.length - importedCount

            console.log(`[CookieImport] ✅ ${importedCount} cookie aktarıldı, ${errorCount} partition hatası`)

            return {
                success: importedCount > 0,
                imported: importedCount,
                errors: errorCount,
                stats
            }
        } catch (error) {
            console.error('[CookieImport] Genel hata:', error)
            return { success: false, error: error.message }
        }
    })

    // Cookie dosyası seç ve import et
    ipcMain.handle('import-cookies-file', async () => {
        try {
            const result = await dialog.showOpenDialog({
                title: 'Cookie Dosyası Seç',
                filters: [
                    { name: 'JSON Dosyaları', extensions: ['json'] },
                    { name: 'Tüm Dosyalar', extensions: ['*'] }
                ],
                properties: ['openFile']
            })

            if (result.canceled || result.filePaths.length === 0) {
                return { success: false, reason: 'cancelled' }
            }

            const filePath = result.filePaths[0]

            // Dosya boyutu kontrolü
            const fileStats = fs.statSync(filePath)
            if (fileStats.size > MAX_JSON_SIZE) {
                return { success: false, error: `Dosya çok büyük (max ${MAX_JSON_SIZE / 1024}KB)` }
            }

            const fileContent = fs.readFileSync(filePath, 'utf-8')

            let cookies
            try {
                cookies = JSON.parse(fileContent)
            } catch (e) {
                return { success: false, error: 'Dosya geçersiz JSON formatında' }
            }

            if (!Array.isArray(cookies)) {
                cookies = [cookies]
            }

            // Cookie sayısı kontrolü
            if (cookies.length > MAX_COOKIES) {
                return { success: false, error: `Çok fazla cookie (max ${MAX_COOKIES})` }
            }

            // Validation ve filtreleme
            const { validCookies, errors, stats } = validateAndFilterCookies(cookies)

            if (validCookies.length === 0) {
                // Detaylı hata mesajı oluştur
                const errorMsg = errors.messages.length > 0
                    ? errors.messages.join(' | ')
                    : 'Geçerli cookie bulunamadı'
                return {
                    success: false,
                    error: errorMsg,
                    stats
                }
            }

            console.log(`[CookieImport] Dosya validation: ${stats.valid}/${stats.total} geçerli`)

            // Aktif profili bul ve partition'ı belirle
            const data = loadProfiles()
            const activeId = data.activeProfileId
            const partition = activeId ? `persist:profile_${activeId}` : 'persist:ai_session'

            // Profil varsa yedeği şifreli olarak güncelle
            if (activeId) {
                const profile = data.profiles.find(p => p.id === activeId)
                if (profile) {
                    profile.cookieData = encryptCookies(validCookies)
                    saveProfiles(data)
                    console.log('[CookieImport] 🔐 Cookie yedeği şifreli olarak güncellendi (dosya import)')
                }
            }

            // Optimize edilmiş yardımcı fonksiyonu kullan
            const importedCount = await loadCookiesToPartition(partition, validCookies)
            console.log(`[CookieImport] ✅ Dosyadan ${importedCount} cookie aktarıldı -> ${partition}`)

            return { success: importedCount > 0, imported: importedCount, stats }
        } catch (error) {
            console.error('[CookieImport] Dosya import hatası:', error)
            return { success: false, error: error.message }
        }
    })
}

module.exports = {
    registerCookieImportHandlers
}
