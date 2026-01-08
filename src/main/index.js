/**
 * QuizLab Reader - Electron Main Process
 */
const { app, BrowserWindow, ipcMain, dialog, session } = require('electron')
const path = require('path')
const fs = require('fs')
const { initUpdater, setupUpdaterIPC } = require('./updater')

const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 600,
        icon: path.join(__dirname, '../../resources/icon.png'),
        webPreferences: {
            preload: path.join(__dirname, '../preload/index.js'),
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
        mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
    }

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
