/**
 * Auto Updater Module
 * GitHub Releases üzerinden otomatik güncelleme sistemi
 * 
 * Düzeltmeler:
 * - Duplicate IPC handler koruması
 * - Race condition önleme (isChecking flag)
 * - Debounce mekanizması
 */
const { autoUpdater } = require('electron-updater')
const { app, ipcMain, BrowserWindow } = require('electron')

// Updater yapılandırması
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

// Güncelleme durumu
let updateAvailable = false
let updateInfo = null
let downloadProgress = 0

// Race condition önleme
let isChecking = false
let lastCheckTime = 0
const CHECK_DEBOUNCE_MS = 5000 // 5 saniye içinde tekrar kontrol engelle

// Duplicate handler koruması
let ipcHandlersSetup = false
let eventsSetup = false

/**
 * IPC Handlers kurulumu
 * Duplicate handler eklemeyi önler
 */
function setupUpdaterIPC() {
    // Zaten kurulduysa tekrar ekleme
    if (ipcHandlersSetup) {
        console.log('[Updater] IPC handlers already setup, skipping...')
        return
    }
    ipcHandlersSetup = true

    // Güncelleme kontrolü (debounce ve race condition korumalı)
    ipcMain.handle('check-for-updates', async () => {
        // Race condition kontrolü
        if (isChecking) {
            console.log('[Updater] Check already in progress, returning cached state')
            return {
                available: updateAvailable,
                version: updateInfo?.version || null,
                releaseNotes: updateInfo?.releaseNotes || null,
                cached: true
            }
        }

        // Debounce kontrolü
        const now = Date.now()
        if (now - lastCheckTime < CHECK_DEBOUNCE_MS) {
            console.log('[Updater] Check debounced, returning cached state')
            return {
                available: updateAvailable,
                version: updateInfo?.version || null,
                releaseNotes: updateInfo?.releaseNotes || null,
                cached: true
            }
        }

        try {
            isChecking = true
            lastCheckTime = now

            const result = await autoUpdater.checkForUpdates()

            // Result doğrudan kontrol et - Event listener'lara güvenme (Race condition fix)
            if (result && result.updateInfo) {
                const currentVersion = app.getVersion()
                const remoteVersion = result.updateInfo.version

                // Eğer versiyonlar farklıysa güncelleme vardır
                if (remoteVersion !== currentVersion) {
                    updateAvailable = true
                    updateInfo = result.updateInfo

                    return {
                        available: true,
                        version: remoteVersion,
                        releaseNotes: result.updateInfo.releaseNotes
                    }
                }
            }

            // Güncelleme yok
            updateAvailable = false
            return { available: false }
        } catch (error) {
            console.error('[Updater] Güncelleme kontrolü hatası:', error)
            return { available: false, error: error.message }
        } finally {
            isChecking = false
        }
    })

    // Güncelleme indirme
    ipcMain.handle('download-update', async () => {
        try {
            await autoUpdater.downloadUpdate()
            return { success: true }
        } catch (error) {
            console.error('[Updater] Güncelleme indirme hatası:', error)
            return { success: false, error: error.message }
        }
    })

    // Güncellemeyi kur ve yeniden başlat
    ipcMain.handle('install-update', () => {
        autoUpdater.quitAndInstall(false, true)
    })

    // Mevcut sürümü al
    ipcMain.handle('get-app-version', () => {
        return app.getVersion()
    })

    console.log('[Updater] IPC handlers setup complete')
}

/**
 * Updater olaylarını dinle
 * Duplicate event listener eklemeyi önler
 */
function setupUpdaterEvents() {
    // Zaten kurulduysa tekrar ekleme
    if (eventsSetup) {
        console.log('[Updater] Event listeners already setup, skipping...')
        return
    }
    eventsSetup = true

    // Güncelleme mevcut
    autoUpdater.on('update-available', (info) => {
        updateAvailable = true
        updateInfo = info
        isChecking = false // Kontrol tamamlandı
        sendToRenderer('update-available', {
            version: info.version,
            releaseNotes: info.releaseNotes
        })
    })

    // Güncelleme mevcut değil
    autoUpdater.on('update-not-available', (info) => {
        updateAvailable = false
        updateInfo = null
        isChecking = false // Kontrol tamamlandı
        sendToRenderer('update-not-available', { version: info.version })
    })

    // İndirme ilerlemesi
    autoUpdater.on('download-progress', (progress) => {
        downloadProgress = progress.percent
        sendToRenderer('download-progress', {
            percent: progress.percent,
            bytesPerSecond: progress.bytesPerSecond,
            transferred: progress.transferred,
            total: progress.total
        })
    })

    // İndirme tamamlandı
    autoUpdater.on('update-downloaded', (info) => {
        sendToRenderer('update-downloaded', {
            version: info.version
        })
    })

    // Hata
    autoUpdater.on('error', (error) => {
        console.error('[Updater] Auto updater hatası:', error)
        isChecking = false // Hata durumunda da kilidi aç
        sendToRenderer('update-error', { message: error.message })
    })

    console.log('[Updater] Event listeners setup complete')
}

/**
 * Renderer'a mesaj gönder
 */
function sendToRenderer(channel, data) {
    const windows = BrowserWindow.getAllWindows()
    windows.forEach(win => {
        if (win && win.webContents) {
            win.webContents.send(channel, data)
        }
    })
}

/**
 * Güncelleme modülünü başlat
 * Production'da otomatik kontrol yapar, development'ta sadece IPC kurar
 */
function initUpdater() {
    // IPC handler'ları her zaman kur (dev modunda da UI çalışabilsin)
    setupUpdaterIPC()

    // Event listener'ları her ortamda kur (Dev modunda da çalışsın)
    setupUpdaterEvents()

    // Development modunda OTOMATİK kontrol yapma (Manuel kontrol tetiklenebilir)
    if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
        console.log('[Updater] Development mode - auto check skipped')
        return
    }

    // Uygulama başladıktan 3 saniye sonra güncelleme kontrolü
    // isChecking flag sayesinde manuel kontrol ile çakışmaz
    setTimeout(() => {
        if (!isChecking) {
            console.log('[Updater] Auto check starting...')
            isChecking = true
            lastCheckTime = Date.now()
            autoUpdater.checkForUpdates().catch((error) => {
                console.error('[Updater] Auto check error:', error)
                isChecking = false
            })
        } else {
            console.log('[Updater] Auto check skipped - manual check in progress')
        }
    }, 3000)
}

module.exports = {
    initUpdater,
    setupUpdaterIPC  // Geriye dönük uyumluluk için export ediliyor ama initUpdater kullanılmalı
}
