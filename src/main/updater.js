/**
 * Auto Updater Module
 * GitHub Releases üzerinden otomatik güncelleme sistemi
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

/**
 * IPC Handlers kurulumu
 */
function setupUpdaterIPC() {
    // Güncelleme kontrolü
    ipcMain.handle('check-for-updates', async () => {
        try {
            const result = await autoUpdater.checkForUpdates()
            return {
                available: updateAvailable,
                version: updateInfo?.version || null,
                releaseNotes: updateInfo?.releaseNotes || null
            }
        } catch (error) {
            console.error('Güncelleme kontrolü hatası:', error)
            return { available: false, error: error.message }
        }
    })

    // Güncelleme indirme
    ipcMain.handle('download-update', async () => {
        try {
            await autoUpdater.downloadUpdate()
            return { success: true }
        } catch (error) {
            console.error('Güncelleme indirme hatası:', error)
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
}

/**
 * Updater olaylarını dinle
 */
function setupUpdaterEvents() {
    // Güncelleme mevcut
    autoUpdater.on('update-available', (info) => {
        updateAvailable = true
        updateInfo = info
        sendToRenderer('update-available', {
            version: info.version,
            releaseNotes: info.releaseNotes
        })
    })

    // Güncelleme mevcut değil
    autoUpdater.on('update-not-available', (info) => {
        updateAvailable = false
        updateInfo = null
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
        console.error('Auto updater hatası:', error)
        sendToRenderer('update-error', { message: error.message })
    })
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
 */
function initUpdater() {
    // Development modunda güncelleme kontrolü yapma
    if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
        console.log('Development mode - auto updater disabled')
        return
    }

    setupUpdaterIPC()
    setupUpdaterEvents()

    // Uygulama başladıktan 3 saniye sonra güncelleme kontrolü
    setTimeout(() => {
        autoUpdater.checkForUpdates().catch(console.error)
    }, 3000)
}

module.exports = {
    initUpdater,
    setupUpdaterIPC
}
