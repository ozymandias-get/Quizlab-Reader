/**
 * Google Auth Module
 * Google login popup, logout ve oturum kontrol işlemleri
 */
const { BrowserWindow, ipcMain, session, app } = require('electron')
const { loadProfiles, saveProfiles, loadCookiesToPartition, validateSessionCookies } = require('./profileManager')
const { encryptCookies } = require('./cookieEncryption')
const { getMainWindow } = require('./windowManager')
const path = require('path')
const fs = require('fs')

let googleLoginWindow = null

/**
 * Google Auth ile ilgili IPC handler'ları kaydet
 */
function registerGoogleAuthHandlers() {
    // Google Login Popup
    ipcMain.handle('google-login-popup', async () => {
        if (googleLoginWindow && !googleLoginWindow.isDestroyed()) {
            googleLoginWindow.focus()
            return { success: false, reason: 'already_open' }
        }

        const { CHROME_USER_AGENT, BROWSER_HEADERS, GOOGLE_HEADERS } = require('./browserConfig')

        return new Promise((resolve) => {
            let isLoginSuccess = false
            let isResolved = false // Promise'in birden fazla kez resolve edilmesini engelle
            let resolveTimeout = null // setTimeout referansı (cleanup için)

            // Güvenli resolve fonksiyonu (sadece bir kez çalışır)
            const safeResolve = (value) => {
                if (isResolved) {
                    console.warn('[GoogleLogin] Promise zaten resolve edildi, tekrar çağrı yok sayılıyor')
                    return
                }
                isResolved = true

                // Bekleyen timeout'u iptal et
                if (resolveTimeout) {
                    clearTimeout(resolveTimeout)
                    resolveTimeout = null
                }

                if (googleLoginWindow) {
                    // Window referansını temizlemeden önce eventleri kaldır
                    googleLoginWindow.removeAllListeners('closed')
                    googleLoginWindow.webContents.removeAllListeners('did-fail-load')
                    googleLoginWindow.webContents.removeAllListeners('did-navigate')
                }
                resolve(value)
            }

            // ...

            googleLoginWindow = new BrowserWindow({
                width: 500,
                height: 700,
                parent: getMainWindow(),
                modal: false,
                show: true,
                autoHideMenuBar: true,
                title: 'Google ile Giriş Yap',
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                    sandbox: true,
                    partition: 'persist:google_auth',
                    webSecurity: true,
                    allowRunningInsecureContent: false,
                    // enableRemoteModule: false // Electron yeni sürümlerinde zaten yok
                }
            })

            const authSession = session.fromPartition('persist:google_auth')

            // Header manipülasyonu - Merkezi config'den al
            // WebRequest listener'larını tek sefer ekleyip pencere kapanınca temizle
            const handleBeforeSendHeaders = (details, callback) => {
                const headers = { ...details.requestHeaders }

                headers['User-Agent'] = CHROME_USER_AGENT
                Object.assign(headers, BROWSER_HEADERS)
                Object.assign(headers, GOOGLE_HEADERS)

                callback({ requestHeaders: headers })
            }

            const handleHeadersReceived = (details, callback) => {
                callback({ responseHeaders: details.responseHeaders })
            }

            authSession.webRequest.onBeforeSendHeaders(handleBeforeSendHeaders)
            authSession.webRequest.onHeadersReceived(handleHeadersReceived)

            googleLoginWindow.loadURL('https://accounts.google.com/signin/v2/identifier?continue=https%3A%2F%2Fgemini.google.com&flowName=GlifWebSignIn&hl=tr')

            // Login başarılı kontrolü
            googleLoginWindow.webContents.on('did-navigate', async (event, url) => {
                // console.log('[GoogleLogin] Navigated to:', url)

                if (url.includes('gemini.google.com') && !url.includes('accounts.google.com')) {
                    console.log('[GoogleLogin] ✅ Login başarılı! Cookie\'ler aktarılıyor...')
                    isLoginSuccess = true

                    try {
                        const authCookies = await authSession.cookies.get({})

                        // Hedef partition'ı belirle: Aktif profil varsa onu kullan, yoksa default
                        const data = loadProfiles()
                        const activeId = data.activeProfileId
                        // Güvenlik: activeId sanitize kontrolü (dosya bozulmuş olabilir)
                        const sanitizedId = activeId && typeof activeId === 'string' 
                            ? activeId.replace(/[^a-zA-Z0-9_-]/g, '') 
                            : null
                        const targetPartition = sanitizedId ? `persist:profile_${sanitizedId}` : 'persist:ai_session'

                        const aiSession = session.fromPartition(targetPartition)
                        console.log(`[GoogleLogin] Cookie'ler hedefe aktarılıyor: ${targetPartition}`)

                        const cookiesToTransfer = []
                        const isAllowedDomain = (domain, allowList) => {
                            if (!domain || typeof domain !== 'string') return false
                            const normalized = domain.toLowerCase().replace(/^\./, '')
                            return allowList.some(allowed => {
                                const allowedNorm = allowed.toLowerCase().replace(/^\./, '')
                                return normalized === allowedNorm || normalized.endsWith(`.${allowedNorm}`)
                            })
                        }

                        const transferAllowlist = ['google.com', 'youtube.com', 'gstatic.com']

                        for (const cookie of authCookies) {
                            if (isAllowedDomain(cookie.domain, transferAllowlist)) {
                                cookiesToTransfer.push(cookie)
                            }
                        }

                        // Optimize edilmiş fonksiyonu kullan
                        const count = await loadCookiesToPartition(targetPartition, cookiesToTransfer)
                        console.log(`[GoogleLogin] ✅ ${count} cookie başarıyla aktarıldı!`)

                        // Cookie'leri profil dosyasına şifreli olarak kaydet (kalıcılık için)
                        let profileId = activeId
                        let profileName = ''
                        let savedToDisk = false

                        if (activeId) {
                            // Mevcut profile cookie'leri güncelle
                            if (!data.profiles || !Array.isArray(data.profiles)) {
                                console.warn('[GoogleLogin] Geçersiz profil verisi, yeni profil oluşturuluyor')
                                data.profiles = []
                            }
                            const profile = data.profiles.find(p => p.id === activeId)
                            if (profile) {
                                profile.cookieData = encryptCookies(cookiesToTransfer)

                                // Google Login -> Kesinlikle Gemini
                                if (!profile.target) profile.target = 'gemini'

                                savedToDisk = saveProfiles(data)
                                profileName = profile.name
                                if (profile.cookieData.encrypted) {
                                    console.log(`[GoogleLogin] 🔐 Cookie'ler profil dosyasına şifreli olarak kaydedildi (${activeId})`)
                                } else {
                                    console.warn(`[GoogleLogin] ⚠️ Şifreleme başarısız - profil güncellendi ama cookie saklanamadı (${activeId})`)
                                }
                            }
                        } else {
                            // Aktif profil yoksa yeni bir profil oluştur
                            const newProfile = {
                                id: Date.now().toString(),
                                name: 'Google Hesabı',
                                createdAt: new Date().toISOString(),
                                cookieData: encryptCookies(cookiesToTransfer),
                                target: 'gemini' // Yeni Google profili = Gemini
                            }
                            data.profiles.push(newProfile)
                            data.activeProfileId = newProfile.id
                            savedToDisk = saveProfiles(data)
                            profileId = newProfile.id
                            profileName = newProfile.name
                            console.log(`[GoogleLogin] Yeni profil oluşturuldu: ${newProfile.name}`)
                            if (newProfile.cookieData.encrypted) {
                                console.log(`[GoogleLogin] 🔐 Cookie'ler şifreli olarak kaydedildi`)
                            } else {
                                console.warn(`[GoogleLogin] ⚠️ Şifreleme başarısız - cookie saklanamadı`)
                            }
                        }

                        // Doğrulama: Partition'daki ve diskteki cookie sayısını karşılaştır
                        const verifySession = session.fromPartition(targetPartition)
                        const verifiedCookies = await verifySession.cookies.get({})
                        const verifiedCount = verifiedCookies.filter(c =>
                            c.domain.includes('google.com') ||
                            c.domain.includes('youtube.com')
                        ).length

                        console.log(`[GoogleLogin] ════════════════════════════════════════`)
                        console.log(`[GoogleLogin] ✅ LOGIN TAMAMLANDI`)
                        console.log(`[GoogleLogin]   Aktarılan cookie: ${count}`)
                        console.log(`[GoogleLogin]   Partition'da doğrulanan: ${verifiedCount}`)
                        console.log(`[GoogleLogin]   Diske kaydedildi: ${savedToDisk ? 'Evet' : 'Hayır'}`)
                        console.log(`[GoogleLogin]   Profil: ${profileName} (${profileId})`)
                        console.log(`[GoogleLogin] ════════════════════════════════════════`)

                        // Window kapatılmadan önce kısa bir süre bekle
                        resolveTimeout = setTimeout(() => {
                            resolveTimeout = null
                            if (googleLoginWindow && !googleLoginWindow.isDestroyed()) {
                                googleLoginWindow.close()
                            }
                            safeResolve({
                                success: true,
                                stats: {
                                    cookiesTransferred: count,
                                    cookiesVerified: verifiedCount,
                                    savedToDisk,
                                    profileId,
                                    profileName
                                }
                            })
                        }, 500)
                    } catch (error) {
                        console.error('[GoogleLogin] Cookie aktarım hatası:', error)
                        // Login başarılı oldu ama cookie aktarımı başarısız -> ne yapmalı?
                        // Kullanıcıya hata dönelim
                        safeResolve({ success: false, reason: 'cookie_transfer_failed', error: error.message })
                        if (googleLoginWindow && !googleLoginWindow.isDestroyed()) {
                            googleLoginWindow.close()
                        }
                    }
                }
            })

            googleLoginWindow.on('closed', () => {
                // Bekleyen timeout'u iptal et (eğer varsa)
                if (resolveTimeout) {
                    clearTimeout(resolveTimeout)
                    resolveTimeout = null
                }

                googleLoginWindow = null
                // Login başarılı ise (yukarıda resolve edildiyse) bu zaten çalışmaz
                if (!isLoginSuccess && !isResolved) {
                    safeResolve({ success: false, reason: 'closed' })
                }

                // Listener'ları temizle (birikmeyi önle)
                try {
                    authSession.webRequest.removeListener('onBeforeSendHeaders', handleBeforeSendHeaders)
                    authSession.webRequest.removeListener('onHeadersReceived', handleHeadersReceived)
                } catch (_) { /* ignore cleanup errors */ }
            })

            googleLoginWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
                console.error('[GoogleLogin] Yükleme hatası:', errorCode, errorDescription)
                if (errorCode !== -3) { // Aborted
                    // Yükleme hatası login'i engeller mi? Bazen geçici olabilir.
                    // Hemen reject etmek yerine loglayalım, kullanıcı kapatırsa 'closed' döner.
                    // safeResolve({ success: false, reason: 'load_failed', error: errorDescription })
                }
            })
        })
    })

    // Login durumu kontrol - Gelişmiş doğrulama
    ipcMain.handle('check-google-login', async () => {
        try {
            const data = loadProfiles()
            const activeId = data.activeProfileId
            // Güvenlik: activeId sanitize kontrolü (dosya bozulmuş olabilir)
            const sanitizedId = activeId && typeof activeId === 'string' 
                ? activeId.replace(/[^a-zA-Z0-9_-]/g, '') 
                : null
            const activeProfile = sanitizedId ? data.profiles.find(p => p.id === sanitizedId) : null
            const partition = sanitizedId ? `persist:profile_${sanitizedId}` : 'persist:ai_session'

            const aiSession = session.fromPartition(partition)
            const cookies = await aiSession.cookies.get({})

            // Gelişmiş doğrulama kullan (süre kontrolü dahil)
            // Hedef platformu belirtmek önemli (yanlış pozitifleri önler)
            const target = activeProfile ? activeProfile.target : null
            const validation = validateSessionCookies(cookies, target)

            return {
                loggedIn: validation.isValid,
                details: validation.details
            }
        } catch (error) {
            console.error('[GoogleLogin] Cookie kontrol hatası:', error)
            return { loggedIn: false, error: error.message }
        }
    })

    // Logout - Tüm oturumları temizle (profil partition'ları dahil)
    ipcMain.handle('google-logout', async () => {
        const stats = {
            partitionsCleaned: [],
            partitionsFailed: [],
            profileCount: 0,
            profilesFile: false
        }

        try {
            // 1. Varsayılan ai_session partition'ını temizle
            try {
                const aiSession = session.fromPartition('persist:ai_session')
                await aiSession.clearStorageData({ storages: ['cookies'] })
                await aiSession.clearStorageData({ storages: ['localstorage', 'indexdb', 'sessionstorage'] })
                stats.partitionsCleaned.push('persist:ai_session')
                console.log('[CookieReset] ✓ persist:ai_session temizlendi')
            } catch (e) {
                stats.partitionsFailed.push({ partition: 'persist:ai_session', error: e.message })
                console.error('[CookieReset] ✗ persist:ai_session temizlenemedi:', e.message)
            }

            // 2. google_auth partition'ını temizle
            try {
                const authSession = session.fromPartition('persist:google_auth')
                await authSession.clearStorageData({ storages: ['cookies', 'localstorage', 'indexdb', 'sessionstorage'] })
                stats.partitionsCleaned.push('persist:google_auth')
                console.log('[CookieReset] ✓ persist:google_auth temizlendi')
            } catch (e) {
                // google_auth partition olmayabilir, bu normal
                console.log('[CookieReset] - persist:google_auth mevcut değil veya boş')
            }

            // 3. Tüm profil partition'larını temizle
            const data = loadProfiles()
            if (data.profiles && data.profiles.length > 0) {
                stats.profileCount = data.profiles.length
                for (const profile of data.profiles) {
                    // Güvenlik: profile.id sanitize kontrolü (dosya bozulmuş olabilir)
                    if (!profile.id || typeof profile.id !== 'string') continue
                    const sanitizedProfileId = profile.id.replace(/[^a-zA-Z0-9_-]/g, '')
                    if (!sanitizedProfileId) continue
                    const partitionName = `persist:profile_${sanitizedProfileId}`
                    try {
                        const profileSession = session.fromPartition(partitionName)
                        await profileSession.clearStorageData({ storages: ['cookies', 'localstorage', 'indexdb', 'sessionstorage'] })
                        stats.partitionsCleaned.push(partitionName)
                        console.log(`[CookieReset] ✓ ${partitionName} temizlendi (${profile.name})`)
                    } catch (e) {
                        stats.partitionsFailed.push({ partition: partitionName, profile: profile.name, error: e.message })
                        console.error(`[CookieReset] ✗ ${partitionName} temizlenemedi:`, e.message)
                    }
                }
            }

            // 4. Diskteki partition klasörlerini fiziksel olarak sil
            // (clearStorageData sadece verileri temizler, klasörler kalabilir)
            const partitionsDir = path.join(app.getPath('userData'), 'Partitions')
            let diskCleanupCount = 0

            if (fs.existsSync(partitionsDir)) {
                try {
                    const partitionFolders = fs.readdirSync(partitionsDir)

                    for (const folder of partitionFolders) {
                        // Sadece uygulama tarafından oluşturulan partition'ları sil
                        if (folder.startsWith('persist_profile_') ||
                            folder === 'persist_ai_session' ||
                            folder === 'persist_google_auth') {

                            const folderPath = path.join(partitionsDir, folder)
                            try {
                                fs.rmSync(folderPath, { recursive: true, force: true })
                                diskCleanupCount++
                                console.log(`[CookieReset] ✓ Disk klasörü silindi: ${folder}`)
                            } catch (e) {
                                console.error(`[CookieReset] ✗ Disk klasörü silinemedi (${folder}):`, e.message)
                            }
                        }
                    }

                    if (diskCleanupCount > 0) {
                        console.log(`[CookieReset] ✅ ${diskCleanupCount} partition klasörü diskten silindi`)
                    }
                } catch (e) {
                    console.error('[CookieReset] Partition klasörlerini okuma hatası:', e.message)
                }
            }

            // 5. Profil dosyasını sil
            const profilesFile = path.join(app.getPath('userData'), 'cookie-profiles.json')
            if (fs.existsSync(profilesFile)) {
                fs.unlinkSync(profilesFile)
                stats.profilesFile = true
                console.log('[CookieReset] ✓ Profil dosyası silindi')
            }

            // Özet log
            console.log(`[CookieReset] ════════════════════════════════════════`)
            console.log(`[CookieReset] ✅ RESET TAMAMLANDI`)
            console.log(`[CookieReset]   Temizlenen partition: ${stats.partitionsCleaned.length}`)
            console.log(`[CookieReset]   Disk temizliği: ${diskCleanupCount} klasör`)
            console.log(`[CookieReset]   Başarısız partition: ${stats.partitionsFailed.length}`)
            console.log(`[CookieReset]   Profil sayısı: ${stats.profileCount}`)
            console.log(`[CookieReset]   Profil dosyası silindi: ${stats.profilesFile ? 'Evet' : 'Hayır'}`)
            console.log(`[CookieReset] ════════════════════════════════════════`)

            return {
                success: true,
                stats: {
                    partitionsCleaned: stats.partitionsCleaned.length,
                    partitionsFailed: stats.partitionsFailed.length,
                    diskCleanupCount,
                    profileCount: stats.profileCount,
                    profilesFileDeleted: stats.profilesFile,
                    details: stats
                }
            }
        } catch (error) {
            console.error('[CookieReset] Kritik Hata:', error)
            return {
                success: false,
                error: error.message,
                stats: {
                    partitionsCleaned: stats.partitionsCleaned.length,
                    partitionsFailed: stats.partitionsFailed.length,
                    profileCount: stats.profileCount,
                    details: stats
                }
            }
        }
    })
}

module.exports = {
    registerGoogleAuthHandlers
}
