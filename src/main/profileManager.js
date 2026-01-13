/**
 * Profile Manager Module
 * Cookie profil yönetimi - CRUD işlemleri ve şifreleme
 */
const { ipcMain, session, app } = require('electron')
const path = require('path')
const fs = require('fs')
const { configureSession } = require('./windowManager') // Session konfigürasyonu için
const {
    encryptCookies,
    decryptCookies,
    migrateProfileData,
    isEncryptionAvailable
} = require('./cookieEncryption')



/**
 * Cookie listesinden hedef platformu tespit et
 * @param {Array} cookies - Cookie listesi
 * @returns {{ target: string|null, warning: string|null }}
 */
function detectProfileTarget(cookies) {
    if (!cookies || cookies.length === 0) {
        return { target: null, warning: 'Cookie verisi boş.' }
    }

    const domains = cookies.map(c => c.domain || '').filter(Boolean)

    // Güvenli domain eşleşmesi (includes yerine katı kontrol)
    const matchesDomain = (domain, allowedList) => {
        if (!domain || typeof domain !== 'string' || !allowedList) return false
        const normalized = domain.toLowerCase().replace(/^\./, '')

        return allowedList.some(allowed => {
            const allowedNormalized = allowed.toLowerCase().replace(/^\./, '')
            return normalized === allowedNormalized || normalized.endsWith(`.${allowedNormalized}`)
        })
    }

    // ChatGPT domainleri
    const chatgptDomains = ['chatgpt.com', '.chatgpt.com', 'chat.openai.com', '.chat.openai.com', 'openai.com', '.openai.com']
    // Gemini/Google domainleri
    const geminiDomains = ['gemini.google.com', '.gemini.google.com', 'google.com', '.google.com']

    const hasChatgpt = domains.some(d => matchesDomain(d, chatgptDomains))
    const hasGemini = domains.some(d => matchesDomain(d, geminiDomains))

    let target = null
    let warning = null

    if (hasChatgpt && !hasGemini) {
        target = 'chatgpt'
    } else if (hasGemini && !hasChatgpt) {
        target = 'gemini'
    } else if (hasChatgpt && hasGemini) {
        // Her iki domain de varsa, daha spesifik olanı tercih et ve uyarı ver
        const chatgptCount = domains.filter(d => d.includes('chatgpt') || d.includes('openai')).length
        const geminiCount = domains.filter(d => d.includes('gemini') || d.includes('google')).length
        target = chatgptCount > geminiCount ? 'chatgpt' : 'gemini'
        warning = 'Karışık cookie tespit edildi (hem Gemini hem ChatGPT). Bu profil sadece tespit edilen platform için çalışacaktır.'
    } else {
        // Hiçbir bilinen domain bulunamadı
        warning = 'Cookie\'lerde bilinen AI platformu tespit edilemedi. Lütfen doğru siteden (gemini.google.com veya chatgpt.com) cookie aldığınızdan emin olun.'
    }

    return { target, warning }
}

const PROFILES_FILE = path.join(app.getPath('userData'), 'cookie-profiles.json')

// Startup durumu takibi (Race condition önlemek için)
let startupStatus = { complete: false, success: false, result: null }

/**
 * GÜVENLİK: profileId sanitization
 * Path traversal saldırılarını önlemek için profileId'yi sanitize eder
 * @param {string} profileId - Profil ID'si
 * @returns {string|null} - Sanitize edilmiş ID veya null (geçersizse)
 */
function sanitizeProfileId(profileId) {
    if (!profileId || typeof profileId !== 'string') {
        return null
    }

    // Sadece alfanumerik karakterler ve alt çizgi kabul et
    // Path traversal karakterlerini engelle: /, \, .., :
    if (!/^[a-zA-Z0-9_-]+$/.test(profileId)) {
        console.warn('[Profiles] Geçersiz profileId formatı:', profileId)
        return null
    }

    // Maksimum uzunluk kontrolü (DoS önleme)
    if (profileId.length > 100) {
        console.warn('[Profiles] profileId çok uzun:', profileId.length)
        return null
    }

    return profileId
}

/**
 * Profil verilerini oku (şifreleme desteği ile)
 */
function loadProfiles() {
    try {
        if (fs.existsSync(PROFILES_FILE)) {
            const data = fs.readFileSync(PROFILES_FILE, 'utf-8')

            // Boş dosya kontrolü
            if (!data || data.trim().length === 0) {
                console.warn('[Profiles] Dosya boş, varsayılan değerler kullanılıyor')
                return { profiles: [], activeProfileId: null }
            }

            let profileData = JSON.parse(data)

            // Geçerli format kontrolü
            if (!profileData || typeof profileData !== 'object') {
                console.warn('[Profiles] Geçersiz profil verisi, varsayılan değerler kullanılıyor')
                return { profiles: [], activeProfileId: null }
            }

            // profiles array kontrolü
            if (!Array.isArray(profileData.profiles)) {
                profileData.profiles = []
            }

            // Migration: Eski düz cookie formatını şifreli formata çevir
            const migratedData = migrateProfileData(profileData)

            if (migratedData._migrated) {
                delete migratedData._migrated
                saveProfiles(migratedData)
                console.log('[Profiles] ✅ Cookie verileri şifrelendi')
            }

            return migratedData
        }
    } catch (e) {
        console.error('[Profiles] Dosya okuma hatası:', e)
    }
    return { profiles: [], activeProfileId: null }
}

/**
 * Profil verilerini kaydet
 * GÜVENLİK: Şifrelenmemiş cookie verileri diske yazılmaz
 */
function saveProfiles(data) {
    try {
        // GÜVENLİK KONTROLÜ: Şifrelenmemiş cookie verilerini temizle
        if (data && data.profiles) {
            for (const profile of data.profiles) {
                if (profile.cookieData) {
                    // noEncryption flag'i veya encrypted: false ile düz veri varsa temizle
                    if (profile.cookieData.noEncryption ||
                        (!profile.cookieData.encrypted && profile.cookieData.data !== null)) {
                        console.warn(`[Profiles] ⚠️ Güvenlik: "${profile.name}" profili için şifrelenmemiş cookie verisi diske YAZILMAYACAK`)
                        profile.cookieData = {
                            encrypted: false,
                            data: null,
                            noEncryption: true
                        }
                    }
                }
            }
        }

        if (isEncryptionAvailable()) {
            console.log('[Profiles] 🔐 Veriler şifreli olarak kaydediliyor')
        } else {
            console.warn('[Profiles] ⚠️ Şifreleme mevcut değil - cookie verileri kaydedilmeyecek')
        }
        fs.writeFileSync(PROFILES_FILE, JSON.stringify(data, null, 2), 'utf-8')
        return true
    } catch (e) {
        console.error('[Profiles] Dosya yazma hatası:', e)
        return false
    }
}

/**
 * Cookie'leri belirli bir partition'a yükle
 */
async function loadCookiesToPartition(partitionName, cookies) {
    const ses = session.fromPartition(partitionName)

    // Paralel işleme için Promise.all kullanımı
    // Her bir set işlemi try/catch ile sarmalanır, böylece biri başarısız olsa da diğerleri devam eder
    const promises = cookies.map(async (cookie) => {
        try {
            // Normalization: Farklı formatlardaki (JSON veya Electron) cookie verilerini standartlaştır
            const domain = cookie.domain || '.google.com'
            const path = cookie.path || '/'
            // Domain string kontrolü
            const cleanDomain = typeof domain === 'string' ? domain.replace(/^\./, '') : 'google.com'
            const url = cookie.url || `https://${cleanDomain}${path}`

            let expirationDate = undefined
            if (cookie.expirationDate) {
                expirationDate = cookie.expirationDate
            } else if (cookie.expires) {
                expirationDate = typeof cookie.expires === 'number'
                    ? cookie.expires
                    : new Date(cookie.expires).getTime() / 1000
            }

            const cookieData = {
                url,
                name: cookie.name,
                value: cookie.value,
                domain: domain,
                path: path,
                secure: cookie.secure !== false,
                httpOnly: cookie.httpOnly || false,
                expirationDate: expirationDate,
                sameSite: cookie.sameSite || undefined
            }

            await ses.cookies.set(cookieData)
            return true
        } catch (e) {
            // console.warn(`[Cookies] Set error (${cookie.name}):`, e.message)
            return false
        }
    })

    const results = await Promise.all(promises)
    const successCount = results.filter(Boolean).length

    return successCount
}

/**
 * Oturum cookie'lerinin geçerliliğini kontrol et
 * @param {Array} cookies - Mevcut cookie listesi
 * @param {string} [target] - Hedef platform ('gemini' veya 'chatgpt')
 * @returns {Object} - { isValid: boolean, reason: string, details: object }
 */
function validateSessionCookies(cookies, target = null) {
    // Google oturum için kritik cookie'ler
    const criticalCookies = ['SID', 'HSID', 'SSID', 'APISID', 'SAPISID']
    const secureCookies = ['__Secure-1PSID', '__Secure-3PSID', '__Secure-1PAPISID', '__Secure-3PAPISID']
    const allCritical = [...criticalCookies, ...secureCookies]

    const now = Date.now() / 1000 // Unix timestamp in seconds

    // Google domain'li cookie'leri filtrele
    const googleCookies = cookies.filter(c =>
        c.domain && (c.domain.includes('google.com') || c.domain.includes('.google.com'))
    )

    // EĞER target 'chatgpt' ise veya hiç google cookie yoksa ama openai cookie varsa
    const openaiCookies = cookies.filter(c =>
        c.domain && (c.domain.includes('openai.com') || c.domain.includes('chatgpt.com'))
    )

    // Platform tespiti (parametre olarak gelmediyse)
    const isGoogleTarget = target === 'gemini' || (!target && googleCookies.length > 0)
    const isOpenAITarget = target === 'chatgpt' || (!target && openaiCookies.length > 0)

    // ChatGPT Kontrolü
    if (isOpenAITarget && !isGoogleTarget) {
        // ChatGPT için şimdilik basit kontrol: Cookie var mı?
        // Daha detaylı kontrol: __Secure-next-auth.session-token vb.
        return {
            isValid: true,
            reason: 'Valid ChatGPT session found (basic check)',
            details: {
                totalCookies: cookies.length,
                openaiCookies: openaiCookies.length
            }
        }
    }

    if (googleCookies.length === 0) {
        return {
            isValid: false,
            reason: 'No Google cookies found',
            details: { totalCookies: cookies.length, googleCookies: 0 }
        }
    }

    // Kritik cookie'leri bul
    const foundCritical = googleCookies.filter(c => allCritical.includes(c.name))

    if (foundCritical.length === 0) {
        return {
            isValid: false,
            reason: 'No critical session cookies found',
            details: {
                googleCookies: googleCookies.length,
                criticalFound: 0,
                cookieNames: googleCookies.map(c => c.name).slice(0, 10)
            }
        }
    }

    // Süresi dolmuş cookie'leri kontrol et
    const expiredCritical = foundCritical.filter(c => {
        if (!c.expirationDate) return false // Session cookie, süresiz
        return c.expirationDate < now
    })

    const validCritical = foundCritical.filter(c => {
        if (!c.expirationDate) return true // Session cookie, geçerli sayılır
        return c.expirationDate >= now
    })

    if (validCritical.length === 0) {
        return {
            isValid: false,
            reason: 'All critical cookies expired',
            details: {
                criticalFound: foundCritical.length,
                expired: expiredCritical.length,
                valid: 0
            }
        }
    }

    // En az bir geçerli kritik cookie var
    return {
        isValid: true,
        reason: 'Valid session found',
        details: {
            criticalFound: foundCritical.length,
            valid: validCritical.length,
            expired: expiredCritical.length,
            validNames: validCritical.map(c => c.name)
        }
    }
}

/**
 * Aktif profilin cookie'lerini restore et (Uygulama açılışında)
 * @param {BrowserWindow} mainWindow - Ana pencere (event göndermek için)
 * @returns {Object} - { success: boolean, sessionExpired: boolean, profileDeleted: boolean }
 */
async function restoreActiveProfileCookies(mainWindow = null) {
    const result = { success: true, sessionExpired: false, profileDeleted: false }

    try {
        const data = loadProfiles()
        if (!data.activeProfileId) {
            console.log('[Profiles] Aktif profil yok, restore atlanıyor')
            return result
        }

        const activeProfile = data.profiles.find(p => p.id === data.activeProfileId)
        if (!activeProfile) {
            console.log('[Profiles] Aktif profil bulunamadı:', data.activeProfileId)
            return result
        }

        if (!activeProfile.cookieData) {
            console.log('[Profiles] Profilde cookie verisi yok:', activeProfile.name)
            return result
        }

        // Güvenlik: activeProfile.id sanitize kontrolü (dosya bozulmuş olabilir)
        const sanitizedId = activeProfile.id && typeof activeProfile.id === 'string'
            ? activeProfile.id.replace(/[^a-zA-Z0-9_-]/g, '')
            : null
        if (!sanitizedId) {
            console.error('[Profiles] Geçersiz activeProfile.id formatı')
            return { success: false, sessionExpired: false, error: 'Geçersiz profil ID formatı' }
        }
        const partition = `persist:profile_${sanitizedId}`

        // Session'ı yapılandır (Headerlar vs.)
        configureSession(partition)

        const ses = session.fromPartition(partition)
        const existing = await ses.cookies.get({})

        console.log(`[Profiles] Partition kontrol ediliyor: ${partition} (${existing.length} cookie)`)

        // Gelişmiş oturum geçerlilik kontrolü
        // Profilin hedef platformuna göre doğrulama yap
        const validation = validateSessionCookies(existing, activeProfile.target)
        console.log(`[Profiles] Oturum durumu: ${validation.reason}`, validation.details)

        if (!validation.isValid) {
            console.log(`[Profiles] ⚠️ Geçersiz oturum tespit edildi, yedekten restore ediliyor...`)

            // Önce mevcut (geçersiz) cookie'leri temizle
            if (existing.length > 0) {
                console.log(`[Profiles] ${existing.length} eski cookie temizleniyor...`)
                for (const cookie of existing) {
                    try {
                        // Domain ve path kontrolü
                        if (!cookie.domain || typeof cookie.domain !== 'string' || !cookie.name) continue
                        const cleanDomain = cookie.domain.replace(/^\./, '')
                        const path = cookie.path || '/'
                        const url = `https://${cleanDomain}${path}`
                        await ses.cookies.remove(url, cookie.name)
                    } catch (e) {
                        // Silme hatalarını görmezden gel
                    }
                }
            }

            const cookies = decryptCookies(activeProfile.cookieData)

            if (cookies.length > 0) {
                const count = await loadCookiesToPartition(partition, cookies)
                console.log(`[Profiles] ✅ Yedekten ${count} cookie restore edildi`)

                // Restore sonrası tekrar kontrol
                const newCookies = await ses.cookies.get({})
                const newValidation = validateSessionCookies(newCookies, activeProfile.target)
                console.log(`[Profiles] Restore sonrası durum: ${newValidation.reason}`, newValidation.details)

                // Restore sonrası da geçersizse - yedekteki cookie'ler de expire olmuş
                // PROFİLİ SİL - kullanıcı yeniden oluşturmalı
                if (!newValidation.isValid) {
                    console.log(`[Profiles] ⚠️ Yedekteki cookie'ler de geçersiz, profil siliniyor: ${activeProfile.name}`)
                    result.sessionExpired = true
                    result.success = false
                    result.profileDeleted = true

                    // Partition verilerini temizle
                    try {
                        await ses.clearStorageData()
                        console.log(`[Profiles] Partition temizlendi (session expired): ${partition}`)
                    } catch (e) { /* ignore */ }

                    // Profili listeden sil
                    const profileIdToDelete = activeProfile.id
                    const profileNameDeleted = activeProfile.name
                    const currentData = loadProfiles()
                    const profileIndex = currentData.profiles.findIndex(p => p.id === profileIdToDelete)
                    if (profileIndex !== -1) {
                        currentData.profiles.splice(profileIndex, 1)
                        // Eğer bu profil aktifse, başka bir profil seç veya null yap
                        if (currentData.activeProfileId === profileIdToDelete) {
                            currentData.activeProfileId = currentData.profiles.length > 0 ? currentData.profiles[0].id : null
                        }
                        saveProfiles(currentData)
                        console.log(`[Profiles] ✅ Süresi dolmuş profil silindi: ${profileNameDeleted}`)
                    }

                    // Renderer'a bildir - profil silindi
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.webContents.send('session-expired', {
                            profileName: profileNameDeleted,
                            profileId: profileIdToDelete,
                            reason: newValidation.reason,
                            action: 'profile-deleted'
                        })
                        console.log('[Profiles] Renderer\'a session-expired eventi gönderildi (profile deleted)')
                    }
                }
            } else {
                // Yedekte cookie yok - profili sil
                console.log(`[Profiles] ⚠️ Şifreli yedekte cookie bulunamadı, profil siliniyor: ${activeProfile.name}`)
                result.sessionExpired = true
                result.success = false
                result.profileDeleted = true

                try {
                    await ses.clearStorageData()
                } catch (e) { /* ignore */ }

                // Profili listeden sil
                const profileIdToDelete = activeProfile.id
                const profileNameDeleted = activeProfile.name
                const currentData = loadProfiles()
                const profileIndex = currentData.profiles.findIndex(p => p.id === profileIdToDelete)
                if (profileIndex !== -1) {
                    currentData.profiles.splice(profileIndex, 1)
                    if (currentData.activeProfileId === profileIdToDelete) {
                        currentData.activeProfileId = currentData.profiles.length > 0 ? currentData.profiles[0].id : null
                    }
                    saveProfiles(currentData)
                    console.log(`[Profiles] ✅ Cookie yedeği olmayan profil silindi: ${profileNameDeleted}`)
                }

                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('session-expired', {
                        profileName: profileNameDeleted,
                        profileId: profileIdToDelete,
                        reason: 'No backup cookies found',
                        action: 'profile-deleted'
                    })
                }
            }
        } else {
            console.log(`[Profiles] ✅ Geçerli oturum mevcut, restore gerekmiyor`)
        }

        // Başarılı olduğunda (veya zaten geçerli olduğunda) event gönder
        if (result.success && !result.sessionExpired && mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('cookies-restored', {
                profileId: activeProfile.id,
                target: activeProfile.target
            })
            console.log('[Profiles] Renderer\'a cookies-restored eventi gönderildi')
        }
    } catch (error) {
        console.error('[Profiles] Startup restore hatası:', error)
        result.success = false
    }

    // Durumu güncelle
    startupStatus = { complete: true, success: result.success, result }

    return result
}

/**
 * Profil yönetimi IPC handler'ları kaydet
 */
function registerProfileHandlers() {
    // Profilleri getir
    ipcMain.handle('get-profiles', async () => {
        try {
            const data = loadProfiles()
            return {
                success: true,
                profiles: data.profiles.map(p => ({
                    id: p.id,
                    name: p.name,
                    target: p.target, // Platform bilgisi
                    createdAt: p.createdAt,
                    isEncrypted: p.cookieData?.encrypted || false
                })),
                activeProfileId: data.activeProfileId,
                encryptionAvailable: isEncryptionAvailable()
            }
        } catch (error) {
            return { success: false, error: error.message }
        }
    })

    // Startup durumunu getir (Race condition için)
    ipcMain.handle('get-startup-status', async () => {
        return startupStatus
    })

    // Yeni profil oluştur
    ipcMain.handle('create-profile', async (event, profileName, cookieJsonStr) => {
        try {
            if (!profileName || profileName.trim().length === 0) {
                return { success: false, error: 'Profil adı gerekli' }
            }

            const data = loadProfiles()

            // profiles array kontrolü
            if (!data.profiles || !Array.isArray(data.profiles)) {
                data.profiles = []
            }

            if (data.profiles.some(p => p.name.toLowerCase() === profileName.trim().toLowerCase())) {
                return { success: false, error: 'Bu isimde bir profil zaten var' }
            }

            let cookies = []
            if (cookieJsonStr) {
                try {
                    cookies = typeof cookieJsonStr === 'string' ? JSON.parse(cookieJsonStr) : cookieJsonStr
                } catch (e) {
                    console.warn('[Profiles] Cookie JSON parse hatası:', e)
                    return { success: false, error: 'Geçersiz cookie JSON formatı' }
                }
            }

            const newProfile = {
                id: Date.now().toString(),
                name: profileName.trim(),
                createdAt: new Date().toISOString(),
                cookieData: encryptCookies(cookies),
                target: null // Aşağıda güncellenecek
            }

            data.profiles.push(newProfile)
            data.activeProfileId = newProfile.id
            saveProfiles(data)

            // Güvenlik: newProfile.id sanitize kontrolü (yeni oluşturuldu ama yine de kontrol)
            const sanitizedNewId = newProfile.id && typeof newProfile.id === 'string'
                ? newProfile.id.replace(/[^a-zA-Z0-9_-]/g, '')
                : null
            if (!sanitizedNewId) {
                console.error('[Profiles] Geçersiz newProfile.id formatı')
                return { success: false, error: 'Geçersiz profil ID formatı' }
            }
            const partition = `persist:profile_${sanitizedNewId}`

            // Session'ı yapılandır
            configureSession(partition)

            // Cookie domain'lerine bakarak hangi platform için oluşturulduğunu tespit et
            const { target: detectedTarget, warning: platformWarning } = detectProfileTarget(cookies)

            console.log(`[Profiles] Tespit edilen platform: ${detectedTarget || 'bilinmiyor'}`)
            if (platformWarning) {
                console.warn(`[Profiles] ⚠️ ${platformWarning}`)
            }

            // Profili güncelle
            newProfile.target = detectedTarget

            // Profili kaydet (target güncellendikten sonra)
            saveProfiles(data)

            if (cookies.length > 0) {
                await loadCookiesToPartition(partition, cookies)
                console.log(`[Profiles] ✅ Cookie'ler partition'a yüklendi: ${partition}`)

                if (newProfile.cookieData.encrypted) {
                    console.log(`[Profiles] 🔐 Cookie verileri şifreli olarak saklandı`)
                } else if (newProfile.cookieData.noEncryption) {
                    console.warn(`[Profiles] ⚠️ Şifreleme mevcut değil - cookie yedeği KAYDEDILMEDI (güvenlik)`)
                }
            } else {
                // platformWarning zaten detectProfileTarget'tan geliyor olabilir ama burada override edelim
                // çünkü cookie uzunluğu 0 ise detect çağrılmayabilir veya farklı dönebilir.
                // Gerçi yukarıda çağırdık. Eğer cookies empty ise detect de empty döner.
                if (!platformWarning) {
                    // Sadece override et
                    // platformWarning = 'Cookie verisi boş...' -> const olduğu için yapamayız, return objesinde halledelim
                }
            }

            // Şifreleme mevcut değilse uyarı döndür
            const encryptionWarning = newProfile.cookieData.noEncryption
                ? 'Şifreleme mevcut olmadığından cookie yedeği kaydedilmedi. Oturum sadece bu cihazda geçerli olacak.'
                : null

            return {
                success: true,
                profile: { id: newProfile.id, name: newProfile.name, createdAt: newProfile.createdAt },
                partition,
                target: detectedTarget, // Hangi platform için oluşturuldu (null = bilinmiyor)
                platformWarning: platformWarning || (cookies.length === 0 ? 'Cookie verisi boş. Profil oluşturuldu ancak oturum açılamayacak.' : null),
                encryptionWarning
            }
        } catch (error) {
            console.error('[Profiles] Profil oluşturma hatası:', error)
            return { success: false, error: error.message }
        }
    })

    // Profil güncelle (İsim değiştirme)
    ipcMain.handle('rename-profile', async (event, { profileId, newName }) => {
        try {
            if (!newName || newName.trim().length === 0) {
                return { success: false, error: 'Yeni profil adı gerekli' }
            }

            // profileId sanitization
            const sanitizedId = sanitizeProfileId(profileId)
            if (!sanitizedId) {
                return { success: false, error: 'Geçersiz profil ID formatı' }
            }

            const data = loadProfiles()

            // profiles array kontrolü
            if (!data.profiles || !Array.isArray(data.profiles)) {
                return { success: false, error: 'Profil verisi geçersiz' }
            }

            const profileIndex = data.profiles.findIndex(p => p.id === sanitizedId)

            if (profileIndex === -1) {
                return { success: false, error: 'Profil bulunamadı' }
            }

            // İsim çakışması kontrolü (kendisi hariç)
            const duplicate = data.profiles.find(p =>
                p.id !== sanitizedId &&
                p.name.toLowerCase() === newName.trim().toLowerCase()
            )

            if (duplicate) {
                return { success: false, error: 'Bu isimde başka bir profil zaten var' }
            }

            // Profili güncelle
            data.profiles[profileIndex].name = newName.trim()
            saveProfiles(data)

            return { success: true, profile: data.profiles[profileIndex] }
        } catch (error) {
            console.error('[Profiles] Profil güncelleme hatası:', error)
            return { success: false, error: error.message }
        }
    })

    // Profile geç
    ipcMain.handle('switch-profile', async (event, profileId) => {
        try {
            // Profil değiştirmeden önce, MEVCUT profilin cookie'lerini son kez kaydet
            await syncCookiesToDisk(true)

            // profileId sanitization
            const sanitizedId = sanitizeProfileId(profileId)
            if (!sanitizedId) {
                return { success: false, error: 'Geçersiz profil ID formatı' }
            }

            const data = loadProfiles()

            // profiles array kontrolü
            if (!data.profiles || !Array.isArray(data.profiles)) {
                return { success: false, error: 'Profil verisi geçersiz' }
            }

            const newProfile = data.profiles.find(p => p.id === sanitizedId)

            if (!newProfile) {
                return { success: false, error: 'Profil bulunamadı' }
            }

            data.activeProfileId = sanitizedId
            saveProfiles(data)

            const partition = `persist:profile_${sanitizedId}`

            // Session'ı yapılandır
            configureSession(partition)

            // Şifreli cookie yedeği varsa ve geçerli oturum yoksa yükle
            if (newProfile.cookieData) {
                const ses = session.fromPartition(partition)
                const existing = await ses.cookies.get({})

                // Gelişmiş oturum geçerlilik kontrolü
                const validation = validateSessionCookies(existing, newProfile.target)

                if (!validation.isValid) {
                    console.log(`[Profiles] Profil geçişinde geçersiz oturum: ${validation.reason}`)

                    // Eski cookie'leri temizle
                    for (const cookie of existing) {
                        try {
                            // Domain ve path kontrolü
                            if (!cookie.domain || !cookie.name) continue
                            const domain = cookie.domain.replace(/^\./, '')
                            const path = cookie.path || '/'
                            const url = `https://${domain}${path}`
                            await ses.cookies.remove(url, cookie.name)
                        } catch (e) { /* ignore */ }
                    }

                    const cookies = decryptCookies(newProfile.cookieData)
                    if (cookies.length > 0) {
                        await loadCookiesToPartition(partition, cookies)
                        console.log(`[Profiles] 🔐 Şifreli cookie yedeğinden ${cookies.length} cookie yüklendi`)

                        // Restore sonrası tekrar kontrol
                        const newCookies = await ses.cookies.get({})
                        const newValidation = validateSessionCookies(newCookies, newProfile.target)

                        if (!newValidation.isValid) {
                            // Yedekteki cookie'ler de geçersiz
                            console.log(`[Profiles] ⚠️ Yedekteki cookie'ler de geçersiz: ${newValidation.reason}`)
                            return {
                                success: true,
                                partition: partition,
                                sessionExpired: true,
                                reason: newValidation.reason
                            }
                        }
                    } else {
                        // Yedekte cookie yok
                        console.log(`[Profiles] ⚠️ Yedekte cookie bulunamadı`)
                        return {
                            success: true,
                            partition: partition,
                            sessionExpired: true,
                            reason: 'No backup cookies'
                        }
                    }
                }
            }

            console.log(`[Profiles] ✅ Profile geçildi: ${newProfile.name} -> ${partition}`)
            return { success: true, partition: partition }
        } catch (error) {
            console.error('[Profiles] Profil geçiş hatası:', error)
            return { success: false, error: error.message }
        }
    })

    // Profil sil
    ipcMain.handle('delete-profile', async (event, profileId) => {
        try {
            // profileId sanitization
            const sanitizedId = sanitizeProfileId(profileId)
            if (!sanitizedId) {
                return { success: false, error: 'Geçersiz profil ID formatı' }
            }

            const data = loadProfiles()

            // profiles array kontrolü
            if (!data.profiles || !Array.isArray(data.profiles)) {
                return { success: false, error: 'Profil verisi geçersiz' }
            }

            const profileIndex = data.profiles.findIndex(p => p.id === sanitizedId)

            if (profileIndex === -1) {
                return { success: false, error: 'Profil bulunamadı' }
            }

            const deletedName = data.profiles[profileIndex].name
            data.profiles.splice(profileIndex, 1)

            // Partition verilerini temizle
            const partition = `persist:profile_${sanitizedId}`
            try {
                await session.fromPartition(partition).clearStorageData()
                console.log(`[Profiles] Partition temizlendi: ${partition}`)
            } catch (e) {
                console.error('[Profiles] Partition temizleme hatası:', e)
            }

            // Diskteki partition klasörünü de sil (boşta kalan dosyaları temizle)
            try {
                const partitionsDir = path.join(app.getPath('userData'), 'Partitions')
                const partitionFolder = path.join(partitionsDir, `persist_profile_${sanitizedId}`)
                if (fs.existsSync(partitionFolder)) {
                    fs.rmSync(partitionFolder, { recursive: true, force: true })
                    console.log(`[Profiles] ✓ Disk klasörü silindi: persist_profile_${sanitizedId}`)
                }
            } catch (e) {
                console.error('[Profiles] Disk klasörü silme hatası:', e.message)
            }

            let newActiveProfileId = null
            if (data.activeProfileId === sanitizedId) {
                data.activeProfileId = data.profiles.length > 0 ? data.profiles[0].id : null
                newActiveProfileId = data.activeProfileId
            } else {
                newActiveProfileId = data.activeProfileId
            }

            saveProfiles(data)
            console.log(`[Profiles] ✅ Profil silindi: ${deletedName}`)

            let newPartition = 'persist:ai_session'
            if (newActiveProfileId) {
                // Güvenlik: newActiveProfileId sanitize kontrolü
                const sanitizedNewId = typeof newActiveProfileId === 'string'
                    ? newActiveProfileId.replace(/[^a-zA-Z0-9_-]/g, '')
                    : null
                if (sanitizedNewId) {
                    newPartition = `persist:profile_${sanitizedNewId}`
                }
            }

            return { success: true, newActiveProfileId, newPartition }
        } catch (error) {
            return { success: false, error: error.message }
        }
    })


}

let cookieSyncInterval = null

/**
 * Aktif profilin cookie'lerini diske yedekle (Sync)
 * @param {boolean} force - Zorla kaydet (validasyon uyarısını yoksaymaz ama loglamayı değiştirir)
 */

async function syncCookiesToDisk(force = false) {
    try {
        // 1. Aşama: Sadece aktif profil ID'sini öğrenmek için hızlı okuma
        const initialData = loadProfiles()
        const activeId = initialData.activeProfileId
        if (!activeId) return

        const initialProfile = initialData.profiles.find(p => p.id === activeId)
        if (!initialProfile) return

        // 2. Aşama: Async işlemler (Cookie okuma)
        const sanitizedId = activeId.replace(/[^a-zA-Z0-9_-]/g, '')
        const partition = `persist:profile_${sanitizedId}`
        const ses = session.fromPartition(partition)

        const cookies = await ses.cookies.get({})

        // 3. Aşama: Validasyon - İlk okunan profilin target'ına göre
        const validation = validateSessionCookies(cookies, initialProfile.target)
        if (!validation.isValid) {
            if (force) console.warn('[CookieSync] ⚠️ Mevcut oturum geçersiz, sync atlandı')
            return
        }

        const allowedDomains = []
        if (initialProfile.target === 'gemini') {
            allowedDomains.push('google.com', 'youtube.com', 'gstatic.com')
        } else if (initialProfile.target === 'chatgpt') {
            allowedDomains.push('openai.com', 'chatgpt.com')
        } else {
            allowedDomains.push('google.com', 'youtube.com', 'gstatic.com', 'openai.com', 'chatgpt.com')
        }

        const isAllowed = (domain) => {
            if (!domain) return false
            const norm = domain.toLowerCase().replace(/^\./, '')
            return allowedDomains.some(d => {
                const allowedNorm = d.toLowerCase().replace(/^\./, '')
                return norm === allowedNorm || norm.endsWith(`.${allowedNorm}`)
            })
        }

        const cookiesToSave = cookies.filter(c => isAllowed(c.domain))

        if (cookiesToSave.length === 0) return

        const encryptedData = encryptCookies(cookiesToSave)

        // 4. Aşama: KRİTİK SEKSİYON (Synchronous)
        // Veriyi tekrar diskten oku, güncelle ve hemen yaz
        // Bu blok arasında async (await) işlem OLMAMALI
        const freshData = loadProfiles()

        // Aktif profil değişmiş olsa bile, cookie'leri aldığımız profil ID'sini bulup güncellemeliyiz
        const targetProfile = freshData.profiles.find(p => p.id === activeId)

        if (targetProfile) {
            targetProfile.cookieData = encryptedData

            if (saveProfiles(freshData)) {
                if (force) console.log(`[CookieSync] ✅ Cookie yedeği güncellendi (Kapanış) - ${targetProfile.name}`)
            }
        }
    } catch (error) {
        console.error('[CookieSync] Hata:', error)
    }
}

/**
 * Cookie senkronizasyonunu başlat
 */
function startCookieSync() {
    if (cookieSyncInterval) clearInterval(cookieSyncInterval)

    // 5 dakikada bir çalış
    cookieSyncInterval = setInterval(() => syncCookiesToDisk(false), 5 * 60 * 1000)

    // İlk çalışmayı hemen yapma, 30sn sonra yap
    setTimeout(() => syncCookiesToDisk(false), 30 * 1000)

    console.log('[CookieSync] Cookie senkronizasyonu başlatıldı (5dk aralık)')
}

/**
 * Cookie senkronizasyonunu durdur ve son bir kez kaydet
 */
async function stopCookieSync() {
    if (cookieSyncInterval) {
        clearInterval(cookieSyncInterval)
        cookieSyncInterval = null
    }
    // Son durumu kaydet
    await syncCookiesToDisk(true)
    console.log('[CookieSync] Cookie senkronizasyonu durduruldu')
}

module.exports = {
    loadProfiles,
    saveProfiles,
    loadCookiesToPartition,
    restoreActiveProfileCookies,
    registerProfileHandlers,
    validateSessionCookies,
    detectProfileTarget,
    startCookieSync,
    stopCookieSync,
    PROFILES_FILE
}
