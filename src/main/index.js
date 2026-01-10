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
const { registerPdfScheme, registerPdfProtocol, registerPdfHandlers, startPdfCleanupInterval, stopPdfCleanupInterval } = require('./pdfProtocol')
const { createWindow, createSplashWindow, getSplashWindow, isDev } = require('./windowManager')
const { registerGoogleAuthHandlers } = require('./googleAuth')
const { registerProfileHandlers, restoreActiveProfileCookies } = require('./profileManager')
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
            const mainWindow = BrowserWindow.getAllWindows()[0]
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

    // 3. Ağır işlemleri başlat (Cookie Restore) - Splash gösterilirken arka planda çalışsın
    const cookieRestorePromise = restoreActiveProfileCookies()

    // 4. Main Window'u oluştur (Biraz gecikmeli)
    setTimeout(async () => {
        // Main window oluşturulmadan önce cookie'lerin yüklendiğinden emin ol
        // (Webview hemen session'a erişeceği için bu önemlidir)
        await cookieRestorePromise

        const mainWindow = createWindow()

        // Auto updater'ı başlat (UI ile bağlantılı olabilir)
        initUpdater()

        mainWindow.once('ready-to-show', () => {
            // Main window hazır olduğunda splash'i kapat ve göster
            setTimeout(() => {
                const splashWindow = getSplashWindow()
                if (splashWindow) {
                    splashWindow.close()
                }
                mainWindow.show()
                mainWindow.focus()
            }, 600)
        })
    }, 100)

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    // PDF cleanup interval'ini durdur
    stopPdfCleanupInterval()

    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// ============================================
// ERROR HANDLERS
// ============================================
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error)

    if (app.isReady()) {
        dialog.showErrorBox(
            'Beklenmeyen Hata',
            `Uygulama beklenmeyen bir hata ile karşılaştı.\n\n` +
            `Hata: ${error.message}\n\n` +
            `Detay: ${error.stack || 'Detay yok'}\n\n` +
            `Uygulama çalışmaya devam edebilir ancak bazı özellikler etkilenmiş olabilir.`
        )
    }
})

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason)

    if (app.isReady()) {
        dialog.showErrorBox(
            'İşlenmeyen Promise Hatası',
            `Bir async işlem başarısız oldu.\n\n` +
            `Sebep: ${reason instanceof Error ? reason.message : String(reason)}`
        )
    }
})
