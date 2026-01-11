/**
 * QuizLab Reader - Electron Main Process
 * 
 * Modüler Yapı:
 * - windowManager.js   : Pencere yönetimi (main, splash, state)
 * - pdfProtocol.js     : PDF streaming protokolü
 * - googleAuth.js      : Google login/logout işlemleri
 * - profileManager.js  : Cookie profil yönetimi
 * - cookieImport.js    : Cookie import işlemleri
 * - ipcHandlers.js     : Genel IPC handler'ları
 * - cookieEncryption.js: Cookie şifreleme (mevcut)
 * - updater.js         : Auto-updater (mevcut)
 */
const { app, BrowserWindow, dialog } = require('electron')

// Modülleri import et
const { registerPdfScheme, registerPdfProtocol, registerPdfHandlers, startPdfCleanupInterval, stopPdfCleanupInterval, clearAllPdfPaths } = require('./pdfProtocol')
const { createWindow, createSplashWindow, getSplashWindow, getMainWindow, isDev } = require('./windowManager')
const { registerGoogleAuthHandlers } = require('./googleAuth')
const { registerProfileHandlers, restoreActiveProfileCookies, startCookieSync, stopCookieSync } = require('./profileManager')
const { registerCookieImportHandlers } = require('./cookieImport')
const { registerGeneralHandlers } = require('./ipcHandlers')
const { initUpdater } = require('./updater')

// ============================================
// SINGLE INSTANCE LOCK
// ============================================
let gotTheLock = true

if (!isDev) {
    gotTheLock = app.requestSingleInstanceLock()

    if (!gotTheLock) {
        app.quit()
    } else {
        app.on('second-instance', (event, commandLine, workingDirectory) => {
            const mainWindow = getMainWindow()
            if (mainWindow) {
                if (mainWindow.isMinimized()) {
                    mainWindow.restore()
                }
                mainWindow.focus()
            }
        })
    }
} else {
    console.log('[Dev] Single instance lock devre dışı - paralel çalışma aktif')
}

// ============================================
// PROTOCOL REGISTRATION (app.whenReady() öncesi)
// ============================================
registerPdfScheme()

// ============================================
// IPC HANDLERS REGISTRATION
// ============================================
// Tüm modüllerden handler'ları kaydet
registerPdfHandlers()
registerGoogleAuthHandlers()
registerProfileHandlers()
registerCookieImportHandlers()
registerGeneralHandlers()

// ============================================
// APP LIFECYCLE
// ============================================
app.whenReady().then(async () => {
    if (!gotTheLock) return

    // 1. Önce Splash Screen'i göster (Hemen!)
    createSplashWindow()

    // 2. Kritik protokolleri kaydet
    registerPdfProtocol()

    // 3. PDF path temizlik interval'ini başlat (bellek optimizasyonu)
    startPdfCleanupInterval()

    // 4. Main Window'u oluştur
    setTimeout(async () => {
        const mainWindow = createWindow()

        // 5. Cookie restore işlemi - UI gösterilmeden önce tamamlanır
        // Kullanıcı etkileşimi öncesi oturumun hazır olduğundan emin olur
        mainWindow.once('ready-to-show', async () => {
            try {
                const restoreResult = await restoreActiveProfileCookies(mainWindow)

                if (restoreResult.sessionExpired) {
                    console.log('[App] Oturum süresi dolmuş, yeniden giriş bekleniyor. (Profil korundu)')
                }
            } catch (err) {
                console.error('[App] Cookie restore hatası:', err)
            } finally {
                // Splash'i kapat ve main window'u göster
                const splashWindow = getSplashWindow()
                if (splashWindow) {
                    splashWindow.close()
                }
                mainWindow.show()
                mainWindow.focus()
            }
        })

        // Auto updater'ı başlat
        initUpdater()

        // Cookie senkronizasyonunu başlat
        startCookieSync()
    }, 100)

    app.on('activate', async () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            const mw = createWindow()
            mw.show()

            // Cookie restore işlemini yap
            try {
                const restoreResult = await restoreActiveProfileCookies(mw)
                if (restoreResult.sessionExpired) {
                    console.log('[App] Oturum süresi dolmuş (Activate).')
                }
            } catch (err) {
                console.error('[App] Cookie restore hatası (Activate):', err)
            }
        }
    })
})

app.on('window-all-closed', () => {
    // PDF cleanup interval'ini durdur
    stopPdfCleanupInterval()
    clearAllPdfPaths()

    if (process.platform !== 'darwin') {
        app.quit()
    }
})

let isQuitting = false

app.on('before-quit', async (event) => {
    if (!isQuitting) {
        event.preventDefault() // Kapanmayı durdur

        console.log('[App] Kapanış öncesi son yedekleme yapılıyor...')

        // Timeout mekanizması: Maksimum 3 saniye bekle
        const syncOp = stopCookieSync()
        const timeoutOp = new Promise(resolve => setTimeout(resolve, 3000))

        await Promise.race([syncOp, timeoutOp])

        isQuitting = true
        app.quit() // Tekrar tetikle (artık isQuitting true)
    }
})

// ============================================
// ERROR HANDLERS
// ============================================
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error)

    if (app.isReady()) {
        // Güvenlik: Hassas bilgi sızıntısını önle - sadece genel hata mesajı göster
        const safeMessage = error.message || 'Bilinmeyen hata'
        // Stack trace'i sadece console'a yaz, kullanıcıya gösterme
        dialog.showErrorBox(
            'Beklenmeyen Hata',
            `Uygulama beklenmeyen bir hata ile karşılaştı.\n\n` +
            `Hata: ${safeMessage}\n\n` +
            `Uygulama çalışmaya devam edebilir ancak bazı özellikler etkilenmiş olabilir.\n\n` +
            `Detaylı bilgi için konsol loglarını kontrol edin.`
        )
    }
})

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason)

    if (app.isReady()) {
        // Güvenlik: Hassas bilgi sızıntısını önle
        let safeReason = 'Bilinmeyen hata'
        if (reason instanceof Error) {
            safeReason = reason.message || 'Bilinmeyen hata'
        } else if (typeof reason === 'string') {
            // String uzunluğunu sınırla (DoS önleme)
            safeReason = reason.slice(0, 200)
        } else {
            safeReason = String(reason).slice(0, 200)
        }

        dialog.showErrorBox(
            'İşlenmeyen Promise Hatası',
            `Bir async işlem başarısız oldu.\n\n` +
            `Sebep: ${safeReason}`
        )
    }
})
