/**
 * QuizLab Reader - Electron Main Process
 * 
 * Bellek Optimizasyonu:
 * - PDF dosyaları Base64 yerine streaming protocol ile yüklenir
 * - Bu sayede 100MB PDF için 300-400MB yerine ~100MB RAM kullanılır
 * - UI thread bloklanmaz, dosya asenkron stream edilir
 */
const { app, BrowserWindow, ipcMain, dialog, session, protocol, net, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const { initUpdater } = require('./updater')

// Production: app.isPackaged true olduğunda
// Development: app.isPackaged false olduğunda (electron . ile çalıştırıldığında)
const isDev = !app.isPackaged

// ============================================
// SINGLE INSTANCE LOCK
// ============================================
// Production: Birden fazla uygulama penceresinin açılmasını engelle
// Development: Devre dışı - hem dev hem kurulu exe aynı anda çalışabilir
let gotTheLock = true

if (!isDev) {
    // Production modunda single instance lock uygula
    gotTheLock = app.requestSingleInstanceLock()

    if (!gotTheLock) {
        // Başka bir instance zaten çalışıyor - bu instance'ı kapat
        app.quit()
    } else {
        // İkinci instance açılmaya çalışıldığında
        app.on('second-instance', (event, commandLine, workingDirectory) => {
            const mainWindow = BrowserWindow.getAllWindows()[0]
            if (mainWindow) {
                // Pencere minimize edilmişse restore et
                if (mainWindow.isMinimized()) {
                    mainWindow.restore()
                }
                // Pencereyi öne getir ve focus'la
                mainWindow.focus()
            }
        })
    }
} else {
    // Development modunda single instance lock yok
    // Bu sayede hem `npm run dev` hem de kurulu exe aynı anda çalışabilir
    console.log('[Dev] Single instance lock devre dışı - paralel çalışma aktif')
}

// Güvenli PDF yollarını saklamak için Map
// Key: benzersiz ID, Value: dosya yolu
const authorizedPdfPaths = new Map()

// Custom protokolü privileged olarak kaydet (app.whenReady() öncesi yapılmalı)
// Bu, protokolün fetch API, blob URL gibi web özelliklerini kullanabilmesi için gerekli
protocol.registerSchemesAsPrivileged([
    {
        scheme: 'local-pdf',
        privileges: {
            standard: true,
            secure: true,
            supportFetchAPI: true,
            stream: true,
            bypassCSP: true
        }
    }
])

/**
 * Özel 'local-pdf' protokolünü kaydet
 * Bu protokol PDF dosyalarını streaming ile sunar
 * Güvenlik: Sadece select-pdf ile seçilen dosyalara erişim izni verilir
 */
function registerPdfProtocol() {
    protocol.handle('local-pdf', async (request) => {
        try {
            // URL format: local-pdf://ID
            // Standard scheme olduğu için host = ID olur
            const url = new URL(request.url)
            // Host'tan ID'yi al (local-pdf://pdf_123 -> host = pdf_123)
            const pdfId = url.host



            // Yetkilendirilmiş dosya yolunu bul
            const filePath = authorizedPdfPaths.get(pdfId)

            if (!filePath) {
                console.error('[PDF Protocol] Erişim reddedildi - yetkisiz ID:', pdfId)
                return new Response('Unauthorized', { status: 403 })
            }



            // Dosya var mı kontrol et
            if (!fs.existsSync(filePath)) {
                console.error('[PDF Protocol] Dosya bulunamadı:', filePath)
                return new Response('Not Found', { status: 404 })
            }

            // Dosya boyutunu al
            const stats = await fs.promises.stat(filePath)


            // Dosyayı stream olarak oku - RAM'de tamamen tutmaz
            const stream = fs.createReadStream(filePath)

            // Node.js stream'i Web ReadableStream'e çevir
            const webStream = new ReadableStream({
                start(controller) {
                    stream.on('data', (chunk) => {
                        controller.enqueue(chunk)
                    })
                    stream.on('end', () => {
                        controller.close()
                    })
                    stream.on('error', (err) => {
                        console.error('[PDF Protocol] Stream hatası:', err)
                        controller.error(err)
                    })
                },
                cancel() {
                    stream.destroy()
                }
            })



            return new Response(webStream, {
                status: 200,
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Length': String(stats.size),
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'no-cache'
                }
            })
        } catch (error) {
            console.error('[PDF Protocol] Hata:', error)
            return new Response('Internal Error', { status: 500 })
        }
    })
}

// ============================================
// WINDOW STATE PERSISTENCE
// ============================================
// Pencere konumu ve boyutunu kaydet/geri yükle

const windowStateFile = path.join(app.getPath('userData'), 'window-state.json')

/**
 * Kaydedilmiş pencere durumunu yükle
 */
function loadWindowState() {
    try {
        if (fs.existsSync(windowStateFile)) {
            const data = fs.readFileSync(windowStateFile, 'utf-8')
            const state = JSON.parse(data)
            // console.log('[WindowState] Yüklendi:', state)
            return state
        }
    } catch (error) {
        console.warn('[WindowState] Yükleme hatası:', error.message)
    }
    // Varsayılan değerler
    return {
        width: 1400,
        height: 900,
        x: undefined,
        y: undefined,
        isMaximized: false
    }
}

/**
 * Pencere durumunu kaydet
 */
function saveWindowState(window) {
    try {
        const isMaximized = window.isMaximized()
        const bounds = window.getBounds()

        // Maximize durumunda normal boyutları sakla
        const state = {
            width: isMaximized ? (window._lastBounds?.width || bounds.width) : bounds.width,
            height: isMaximized ? (window._lastBounds?.height || bounds.height) : bounds.height,
            x: isMaximized ? (window._lastBounds?.x || bounds.x) : bounds.x,
            y: isMaximized ? (window._lastBounds?.y || bounds.y) : bounds.y,
            isMaximized
        }

        fs.writeFileSync(windowStateFile, JSON.stringify(state, null, 2))
        // console.log('[WindowState] Kaydedildi:', state)
    } catch (error) {
        console.warn('[WindowState] Kaydetme hatası:', error.message)
    }
}

function createWindow() {
    // Kaydedilmiş pencere durumunu yükle
    const windowState = loadWindowState()

    // Preload script yolu
    const preloadPath = isDev
        ? path.join(__dirname, '../preload/index.js')
        : path.join(app.getAppPath(), 'src', 'preload', 'index.js')

    // Icon yolu
    const iconPath = isDev
        ? path.join(__dirname, '../../resources/icon.png')
        : path.join(process.resourcesPath, 'resources', 'icon.png')

    const mainWindow = new BrowserWindow({
        width: windowState.width,
        height: windowState.height,
        x: windowState.x,
        y: windowState.y,
        minWidth: 1000,
        minHeight: 600,
        icon: iconPath,
        // Menü çubuğunu gizle (Windows/Linux)
        // Dev modunda Alt tuşuyla erişilebilir, Production'da tamamen gizli
        autoHideMenuBar: true,
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

    // Production modunda menüyü tamamen kaldır
    if (!isDev) {
        mainWindow.setMenu(null)
    }

    // Maximize durumu için normal boyutları takip et
    mainWindow._lastBounds = null
    mainWindow.on('resize', () => {
        if (!mainWindow.isMaximized()) {
            mainWindow._lastBounds = mainWindow.getBounds()
        }
    })
    mainWindow.on('move', () => {
        if (!mainWindow.isMaximized()) {
            mainWindow._lastBounds = mainWindow.getBounds()
        }
    })

    // Kaydedilmiş maximize durumunu uygula
    if (windowState.isMaximized) {
        mainWindow.maximize()
    }

    // Dev veya production moduna göre yükle
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173')
        mainWindow.webContents.openDevTools()
    } else {
        // Production'da ASAR içinden yükle
        // Önce app.getAppPath() dene (ASAR için doğru yol)
        const appPath = app.getAppPath()
        const indexPath = path.join(appPath, 'dist', 'index.html')



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

    // Pencere kapatılmadan önce durumu kaydet
    mainWindow.on('close', () => {
        saveWindowState(mainWindow)
    })

    // User-Agent ayarı
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        callback({ requestHeaders: details.requestHeaders })
    })
}

/**
 * Benzersiz PDF ID'si oluştur
 */
function generatePdfId() {
    return `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

// IPC Handler: PDF dosyası seçme
// Artık Base64 dönüşümü yok - sadece dosya meta bilgisi ve streaming URL döner
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
        // Dosyanın var olduğunu ve okunabilir olduğunu kontrol et
        await fs.promises.access(filePath, fs.constants.R_OK)

        // Dosya boyutunu al (UI'da göstermek için)
        const stats = await fs.promises.stat(filePath)

        // Benzersiz ID oluştur ve dosya yolunu yetkilendir
        const pdfId = generatePdfId()
        authorizedPdfPaths.set(pdfId, filePath)

        // Eski yolları temizlemeyi kaldırdık (Re-hydration ve kalıcılık için gerekli)
        // authorizedPdfPaths.size > 50 kontrolü iptal edildi
        // Map sadece string tuttuğu için bellek sorunu yaratmaz

        return {
            path: filePath,
            name: path.basename(filePath),
            size: stats.size,
            // Streaming URL - Base64 yerine bu kullanılacak
            // Format: local-pdf://ID (basit ve güvenilir)
            streamUrl: `local-pdf://${pdfId}`
        }
    } catch (error) {
        console.error('PDF erişim hatası:', error)
        return null
    }
})

// IPC Handler: Ekran görüntüsü yakalama
// Not: Tüm pencereyi yakalar, kırpma işlemi renderer tarafında (Canvas) yapılır

// IPC Handler: Dosya yolundan streamUrl üret
// Drag & drop ile eklenen PDF'ler için kullanılır
ipcMain.handle('get-pdf-stream-url', async (event, filePath) => {
    try {
        if (!filePath) {
            console.error('[get-pdf-stream-url] Dosya yolu belirtilmedi')
            return null
        }

        // Dosyanın var olduğunu ve okunabilir olduğunu kontrol et
        await fs.promises.access(filePath, fs.constants.R_OK)

        // Benzersiz ID oluştur ve dosya yolunu yetkilendir
        const pdfId = generatePdfId()
        authorizedPdfPaths.set(pdfId, filePath)

        // Eski yolları temizlemeyi kaldırdık (Re-hydration ve kalıcılık için gerekli)
        // authorizedPdfPaths.size > 50 kontrolü iptal edildi



        return {
            streamUrl: `local-pdf://${pdfId}`
        }
    } catch (error) {
        console.error('[get-pdf-stream-url] Hata:', error)
        return null
    }
})

ipcMain.handle('capture-screen', async () => {
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

// IPC Handler: Görüntüyü sistem clipboard'una kopyala
// Bu, ekran görüntüsünü AI'ya yapıştırabilmek için gerekli
ipcMain.handle('copy-image-to-clipboard', async (event, dataUrl) => {
    try {
        const { clipboard, nativeImage } = require('electron')

        // Base64 data URL'den görüntü oluştur
        const image = nativeImage.createFromDataURL(dataUrl)

        if (image.isEmpty()) {
            console.error('[Clipboard] Görüntü boş!')
            return false
        }

        // Sistem clipboard'una kopyala
        clipboard.writeImage(image)

        return true
    } catch (error) {
        console.error('[Clipboard] Görüntü kopyalama hatası:', error)
        return false
    }
})

// IPC Handler: Harici linki sistem tarayıcısında aç
// Webview'da tıklanan harici linkleri işlemek için kullanılır
ipcMain.handle('open-external', async (event, url) => {
    try {
        // URL güvenlik kontrolü
        const parsedUrl = new URL(url)
        if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
            await shell.openExternal(url)
            return true
        }
        return false
    } catch (error) {
        console.error('Harici bağlantı açma hatası:', error)
        return false
    }
})

// IPC Handler: PDF Context Menu
ipcMain.on('show-pdf-context-menu', (event) => {
    const { Menu, MenuItem } = require('electron')
    const win = BrowserWindow.fromWebContents(event.sender)

    const menu = new Menu()

    // 📄 Tam Sayfa SS (Yeni özellik - öncelikli)
    menu.append(new MenuItem({
        label: '📄 Tam Sayfa Görüntüsü Al',
        accelerator: 'F',
        click: () => {
            win.webContents.send('trigger-screenshot', 'full-page')
        }
    }))

    // 📸 Alan Seçerek SS
    menu.append(new MenuItem({
        label: '📸 Alan Seçerek Görüntü Al',
        accelerator: 'C',
        click: () => {
            win.webContents.send('trigger-screenshot', 'crop')
        }
    }))

    menu.append(new MenuItem({ type: 'separator' }))

    // 🔍 Zoom kontrolleri
    menu.append(new MenuItem({
        label: '🔍 Yakınlaştır',
        accelerator: 'CmdOrCtrl+Plus',
        role: 'zoomIn'
    }))

    menu.append(new MenuItem({
        label: '🔍 Uzaklaştır',
        accelerator: 'CmdOrCtrl+-',
        role: 'zoomOut'
    }))

    menu.append(new MenuItem({
        label: '↺ Zoom Sıfırla',
        accelerator: 'CmdOrCtrl+0',
        role: 'resetZoom'
    }))

    menu.append(new MenuItem({ type: 'separator' }))

    // 🔄 Yenile
    menu.append(new MenuItem({
        label: '🔄 Sayfayı Yenile',
        accelerator: 'CmdOrCtrl+R',
        role: 'reload'
    }))

    menu.popup({ window: win })
})

app.whenReady().then(() => {
    // Single Instance Lock kontrolü
    // Eğer lock alınamadıysa (ikinci instance ise) pencere açma, quit bekle
    if (!gotTheLock) return

    // PDF streaming protokolünü kaydet - pencere oluşturmadan önce
    registerPdfProtocol()

    createWindow()

    // Auto updater'ı başlat
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

    // Kritik hatalarda kullanıcıya dialog göster
    // App henüz hazır değilse dialog gösterilemez, sadece loglama yapılır
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

    // Promise rejection'ları da kullanıcıya bildir
    if (app.isReady()) {
        dialog.showErrorBox(
            'İşlenmeyen Promise Hatası',
            `Bir async işlem başarısız oldu.\n\n` +
            `Sebep: ${reason instanceof Error ? reason.message : String(reason)}`
        )
    }
})
