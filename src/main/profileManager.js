/**
 * Profile Manager Module
 * Cookie profil yönetimi - CRUD işlemleri ve şifreleme
 */
const { ipcMain, session, app } = require('electron')
const path = require('path')
const fs = require('fs')
const {
    encryptCookies,
    decryptCookies,
    migrateProfileData,
    isEncryptionAvailable
} = require('./cookieEncryption')

const PROFILES_FILE = path.join(app.getPath('userData'), 'cookie-profiles.json')

/**
 * Profil verilerini oku (şifreleme desteği ile)
 */
function loadProfiles() {
    try {
        if (fs.existsSync(PROFILES_FILE)) {
            const data = fs.readFileSync(PROFILES_FILE, 'utf-8')
            let profileData = JSON.parse(data)

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
            const url = cookie.url || `https://${domain.replace(/^\./, '')}${path}`

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
 * Aktif profilin cookie'lerini restore et (Uygulama açılışında)
 */
async function restoreActiveProfileCookies() {
    try {
        const data = loadProfiles()
        if (!data.activeProfileId) return

        const activeProfile = data.profiles.find(p => p.id === data.activeProfileId)
        if (!activeProfile || !activeProfile.cookieData) return

        const partition = `persist:profile_${activeProfile.id}`
        const ses = session.fromPartition(partition)
        const existing = await ses.cookies.get({})

        if (existing.length === 0) {
            console.log(`[Profiles] Partition boş, yedekten restore ediliyor: ${partition}`)
            const cookies = decryptCookies(activeProfile.cookieData)
            if (cookies.length > 0) {
                const count = await loadCookiesToPartition(partition, cookies)
                console.log(`[Profiles] ✅ Başlangıçta ${count} cookie restore edildi`)
            }
        } else {
            console.log(`[Profiles] Partition dolu, restore atlanıyor (${existing.length} cookie): ${partition}`)
        }
    } catch (error) {
        console.error('[Profiles] Startup restore hatası:', error)
    }
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

    // Yeni profil oluştur
    ipcMain.handle('create-profile', async (event, profileName, cookieJsonStr) => {
        try {
            if (!profileName || profileName.trim().length === 0) {
                return { success: false, error: 'Profil adı gerekli' }
            }

            const data = loadProfiles()

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
                cookieData: encryptCookies(cookies)
            }

            data.profiles.push(newProfile)
            data.activeProfileId = newProfile.id
            saveProfiles(data)

            const partition = `persist:profile_${newProfile.id}`

            // Cookie domain'lerine bakarak hangi platform için oluşturulduğunu tespit et
            let detectedTarget = null
            let platformWarning = null

            if (cookies.length > 0) {
                const domains = cookies.map(c => c.domain || '').filter(Boolean)

                // ChatGPT domainleri
                const chatgptDomains = ['chatgpt.com', '.chatgpt.com', 'chat.openai.com', '.chat.openai.com', 'openai.com', '.openai.com']
                // Gemini/Google domainleri
                const geminiDomains = ['gemini.google.com', '.gemini.google.com', 'google.com', '.google.com']

                const hasChatgpt = domains.some(d => chatgptDomains.some(cd => d.includes(cd.replace(/^\./, ''))))
                const hasGemini = domains.some(d => geminiDomains.some(gd => d.includes(gd.replace(/^\./, ''))))

                if (hasChatgpt && !hasGemini) {
                    detectedTarget = 'chatgpt'
                } else if (hasGemini && !hasChatgpt) {
                    detectedTarget = 'gemini'
                } else if (hasChatgpt && hasGemini) {
                    // Her iki domain de varsa, daha spesifik olanı tercih et ve uyarı ver
                    const chatgptCount = domains.filter(d => d.includes('chatgpt') || d.includes('openai')).length
                    const geminiCount = domains.filter(d => d.includes('gemini') || d.includes('google')).length
                    detectedTarget = chatgptCount > geminiCount ? 'chatgpt' : 'gemini'
                    platformWarning = 'Karışık cookie tespit edildi (hem Gemini hem ChatGPT). Bu profil sadece tespit edilen platform için çalışacaktır.'
                } else {
                    // Hiçbir bilinen domain bulunamadı
                    platformWarning = 'Cookie\'lerde bilinen AI platformu tespit edilemedi. Lütfen doğru siteden (gemini.google.com veya chatgpt.com) cookie aldığınızdan emin olun.'
                }

                console.log(`[Profiles] Tespit edilen platform: ${detectedTarget || 'bilinmiyor'}`)
                if (platformWarning) {
                    console.warn(`[Profiles] ⚠️ ${platformWarning}`)
                }

                await loadCookiesToPartition(partition, cookies)
                console.log(`[Profiles] ✅ Cookie'ler partition'a yüklendi: ${partition}`)

                if (newProfile.cookieData.encrypted) {
                    console.log(`[Profiles] 🔐 Cookie verileri şifreli olarak saklandı`)
                } else if (newProfile.cookieData.noEncryption) {
                    console.warn(`[Profiles] ⚠️ Şifreleme mevcut değil - cookie yedeği KAYDEDILMEDI (güvenlik)`)
                }
            } else {
                platformWarning = 'Cookie verisi boş. Profil oluşturuldu ancak oturum açılamayacak.'
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
                platformWarning, // Platform tespit uyarısı (varsa)
                encryptionWarning
            }
        } catch (error) {
            console.error('[Profiles] Profil oluşturma hatası:', error)
            return { success: false, error: error.message }
        }
    })

    // Profil güncelle (UI uyumluluğu için)
    ipcMain.handle('update-profile', async (event, profileId) => {
        return { success: true }
    })

    // Profile geç
    ipcMain.handle('switch-profile', async (event, profileId) => {
        try {
            const data = loadProfiles()
            const newProfile = data.profiles.find(p => p.id === profileId)

            if (!newProfile) {
                return { success: false, error: 'Profil bulunamadı' }
            }

            data.activeProfileId = profileId
            saveProfiles(data)

            const partition = `persist:profile_${newProfile.id}`

            // Şifreli cookie yedeği varsa ve partition boşsa yükle
            if (newProfile.cookieData) {
                const ses = session.fromPartition(partition)
                const existing = await ses.cookies.get({})

                if (existing.length === 0) {
                    const cookies = decryptCookies(newProfile.cookieData)
                    if (cookies.length > 0) {
                        await loadCookiesToPartition(partition, cookies)
                        console.log(`[Profiles] 🔐 Şifreli cookie yedeğinden ${cookies.length} cookie yüklendi`)
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
            const data = loadProfiles()
            const profileIndex = data.profiles.findIndex(p => p.id === profileId)

            if (profileIndex === -1) {
                return { success: false, error: 'Profil bulunamadı' }
            }

            const deletedName = data.profiles[profileIndex].name
            data.profiles.splice(profileIndex, 1)

            // Partition verilerini temizle
            const partition = `persist:profile_${profileId}`
            try {
                await session.fromPartition(partition).clearStorageData()
                console.log(`[Profiles] Partition temizlendi: ${partition}`)
            } catch (e) {
                console.error('[Profiles] Partition temizleme hatası:', e)
            }

            // Diskteki partition klasörünü de sil (boşta kalan dosyaları temizle)
            try {
                const partitionsDir = path.join(app.getPath('userData'), 'Partitions')
                const partitionFolder = path.join(partitionsDir, `persist_profile_${profileId}`)
                if (fs.existsSync(partitionFolder)) {
                    fs.rmSync(partitionFolder, { recursive: true, force: true })
                    console.log(`[Profiles] ✓ Disk klasörü silindi: persist_profile_${profileId}`)
                }
            } catch (e) {
                console.error('[Profiles] Disk klasörü silme hatası:', e.message)
            }

            let newActiveProfileId = null
            if (data.activeProfileId === profileId) {
                data.activeProfileId = data.profiles.length > 0 ? data.profiles[0].id : null
                newActiveProfileId = data.activeProfileId
            } else {
                newActiveProfileId = data.activeProfileId
            }

            saveProfiles(data)
            console.log(`[Profiles] ✅ Profil silindi: ${deletedName}`)

            let newPartition = 'persist:ai_session'
            if (newActiveProfileId) {
                newPartition = `persist:profile_${newActiveProfileId}`
            }

            return { success: true, newActiveProfileId, newPartition }
        } catch (error) {
            return { success: false, error: error.message }
        }
    })

    // Profil adını değiştir
    ipcMain.handle('rename-profile', async (event, profileId, newName) => {
        try {
            if (!newName || newName.trim().length === 0) {
                return { success: false, error: 'Profil adı gerekli' }
            }

            const data = loadProfiles()
            const profile = data.profiles.find(p => p.id === profileId)

            if (!profile) {
                return { success: false, error: 'Profil bulunamadı' }
            }

            if (data.profiles.some(p => p.id !== profileId && p.name.toLowerCase() === newName.trim().toLowerCase())) {
                return { success: false, error: 'Bu isimde bir profil zaten var' }
            }

            profile.name = newName.trim()
            saveProfiles(data)

            return { success: true }
        } catch (error) {
            return { success: false, error: error.message }
        }
    })
}

module.exports = {
    loadProfiles,
    saveProfiles,
    loadCookiesToPartition,
    restoreActiveProfileCookies,
    registerProfileHandlers,
    PROFILES_FILE
}
