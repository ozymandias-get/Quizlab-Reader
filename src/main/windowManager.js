/**
 * Window Manager Module
 * Pencere oluşturma, durum kaydetme ve splash screen yönetimi
 */
const { BrowserWindow, dialog, session, app } = require('electron')
const path = require('path')
const fs = require('fs')
const { CHROME_USER_AGENT, BROWSER_HEADERS, GOOGLE_HEADERS } = require('./browserConfig')

const isDev = !app.isPackaged

// ============================================
// WINDOW STATE PERSISTENCE
// ============================================
const windowStateFile = path.join(app.getPath('userData'), 'window-state.json')

/**
 * Kaydedilmiş pencere durumunu yükle
 */
function loadWindowState() {
    try {
        if (fs.existsSync(windowStateFile)) {
            const data = fs.readFileSync(windowStateFile, 'utf-8')
            const state = JSON.parse(data)
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

        const state = {
            width: isMaximized ? (window._lastBounds?.width || bounds.width) : bounds.width,
            height: isMaximized ? (window._lastBounds?.height || bounds.height) : bounds.height,
            x: isMaximized ? (window._lastBounds?.x || bounds.x) : bounds.x,
            y: isMaximized ? (window._lastBounds?.y || bounds.y) : bounds.y,
            isMaximized
        }

        fs.writeFileSync(windowStateFile, JSON.stringify(state, null, 2))
    } catch (error) {
        console.warn('[WindowState] Kaydetme hatası:', error.message)
    }
}

// ============================================
// MAIN WINDOW
// ============================================
let mainWindow = null

function createWindow() {
    const windowState = loadWindowState()

    const preloadPath = isDev
        ? path.join(__dirname, '../preload/index.js')
        : path.join(app.getAppPath(), 'src', 'preload', 'index.js')

    const iconPath = isDev
        ? path.join(__dirname, '../../resources/icon.png')
        : path.join(process.resourcesPath, 'resources', 'icon.png')

    mainWindow = new BrowserWindow({
        width: windowState.width,
        height: windowState.height,
        x: windowState.x,
        y: windowState.y,
        minWidth: 1000,
        minHeight: 600,
        icon: iconPath,
        autoHideMenuBar: true,
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true, // GÜVENLİK: Webview process izolasyonu
            webviewTag: true, // AI platformları için gerekli
            webSecurity: true,
            allowRunningInsecureContent: false,
            spellcheck: false, // Performans iyileştirmesi
            backgroundThrottling: true // Arka plandaki sekmelerde CPU kullanımını azalt
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

    // Pencere kapatılmadan önce durumu kaydet
    mainWindow.on('close', () => {
        saveWindowState(mainWindow)
    })

    // Session ayarları - Webview için
    setupSessions()

    return mainWindow
}

/**
 * Session ayarlarını yapılandır
 * CHROME_USER_AGENT, BROWSER_HEADERS, GOOGLE_HEADERS merkezi sabitlerden gelir
 * 
 * GÜVENLİK: Bu fonksiyon sadece bir kez çalıştırılmalı - handler birikimi tehlikeli
 */
let sessionsInitialized = false

function setupSessions() {
    // Çoklu çağrı koruması - handler birikimini önle
    if (sessionsInitialized) {
        console.log('[Sessions] Zaten yapılandırılmış, atlanıyor...')
        return
    }
    sessionsInitialized = true

    const aiSession = session.fromPartition('persist:ai_session')

    // Default session için User-Agent
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders['User-Agent'] = CHROME_USER_AGENT
        callback({ requestHeaders: details.requestHeaders })
    })

    // AI Session için gelişmiş ayarlar
    aiSession.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders['User-Agent'] = CHROME_USER_AGENT

        // Browser header'larını ekle
        Object.assign(details.requestHeaders, BROWSER_HEADERS)

        // Google domain'leri için ek header'lar
        if (details.url.includes('google.com') || details.url.includes('gstatic.com') || details.url.includes('googleapis.com')) {
            Object.assign(details.requestHeaders, GOOGLE_HEADERS)
        }

        callback({ requestHeaders: details.requestHeaders })
    })

    // Üçüncü taraf cookie'lere izin ver
    aiSession.setPermissionRequestHandler((webContents, permission, callback) => {
        const allowedPermissions = ['notifications', 'media', 'geolocation', 'openExternal']
        callback(allowedPermissions.includes(permission))
    })
}

// ============================================
// SPLASH WINDOW
// ============================================
let splashWindow = null

function createSplashWindow() {
    const splashPath = isDev
        ? path.join(__dirname, '../../src/renderer/public/splash.html')
        : path.join(process.resourcesPath, 'dist', 'splash.html')

    const finalSplashPath = isDev
        ? splashPath
        : path.join(app.getAppPath(), 'dist', 'splash.html')

    splashWindow = new BrowserWindow({
        width: 340,
        height: 340,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        resizable: false,
        movable: false,
        center: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    })

    splashWindow.loadFile(finalSplashPath).catch(err => {
        console.warn('Splash screen could not be loaded:', err)
    })

    splashWindow.on('closed', () => {
        splashWindow = null
    })

    return splashWindow
}

function getSplashWindow() {
    return splashWindow
}

function getMainWindow() {
    return mainWindow
}

module.exports = {
    createWindow,
    createSplashWindow,
    getSplashWindow,
    getMainWindow,
    loadWindowState,
    saveWindowState,
    isDev
}
