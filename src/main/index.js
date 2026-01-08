/**
 * QuizLab Reader - Electron Main Process
 */
const { app, BrowserWindow, ipcMain, dialog, session } = require('electron')
const path = require('path')
const fs = require('fs')
const { initUpdater, setupUpdaterIPC } = require('./updater')

// Production: app.isPackaged true olduğunda
// Development: app.isPackaged false olduğunda (electron . ile çalıştırıldığında)
const isDev = !app.isPackaged

function createWindow() {
    // Preload script yolu
    const preloadPath = isDev
        ? path.join(__dirname, '../preload/index.js')
        : path.join(app.getAppPath(), 'src', 'preload', 'index.js')

    // Icon yolu
    const iconPath = isDev
        ? path.join(__dirname, '../../resources/icon.png')
        : path.join(process.resourcesPath, 'resources', 'icon.png')

    const mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 600,
        icon: iconPath,
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true,
            webviewTag: true,
            webSecurity: true,
            allowRunningInsecureContent: false
        },
        backgroundColor: '#0c0a09',
        titleBarStyle: 'default',
        frame: true,
        show: false
    })

    // Dev veya production moduna göre yükle
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173')
        mainWindow.webContents.openDevTools()
    } else {
        // Production'da ASAR içinden yükle
        // Önce app.getAppPath() dene (ASAR için doğru yol)
        const appPath = app.getAppPath()
        const indexPath = path.join(appPath, 'dist', 'index.html')

        console.log('=== Loading Production ===')
        console.log('appPath:', appPath)
        console.log('indexPath:', indexPath)

        mainWindow.loadFile(indexPath).catch(err => {
            console.error('Failed to load:', err.message)
            dialog.showErrorBox('Load Error', `Path: ${indexPath}\nError: ${err.message}`)
        })
    }

    // Hata yakalama
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Page failed to load:', errorCode, errorDescription)
    })

    // Pencere hazır olduğunda göster
    mainWindow.once('ready-to-show', () => {
        mainWindow.show()
    })

    // User-Agent ayarı
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        callback({ requestHeaders: details.requestHeaders })
    })
}

// IPC Handler: PDF dosyası seçme
ipcMain.handle('select-pdf', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'PDF Dosyaları', extensions: ['pdf'] }
        ]
    })

    if (result.canceled || result.filePaths.length === 0) {
        return null
    }

    const filePath = result.filePaths[0]

    try {
        const pdfBuffer = fs.readFileSync(filePath)
        const base64Data = pdfBuffer.toString('base64')
        return {
            path: filePath,
            name: path.basename(filePath),
            data: base64Data
        }
    } catch (error) {
        console.error('PDF okuma hatası:', error)
        return null
    }
})

// IPC Handler: Ekran görüntüsü yakalama
ipcMain.handle('capture-screen', async (event, rect) => {
    try {
        const mainWindow = BrowserWindow.getAllWindows()[0]
        if (!mainWindow) return null

        // Tüm pencere içeriğini yakala
        const image = await mainWindow.webContents.capturePage()
        return image.toDataURL()
    } catch (error) {
        console.error('Ekran yakalama hatası:', error)
        return null
    }
})

app.whenReady().then(() => {
    createWindow()

    // Updater IPC'lerini kur (dev modunda da çalışsın, sadece güncelleme kontrolü yapmaz)
    setupUpdaterIPC()

    // Auto updater'ı başlat (sadece production'da)
    initUpdater()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error)
})
