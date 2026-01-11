/**
 * Window Manager Module
 * Pencere oluşturma, durum kaydetme ve splash screen yönetimi
 */
const { BrowserWindow, dialog, session, app, screen } = require('electron')
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
            
            // Boş dosya kontrolü
            if (!data || data.trim().length === 0) {
                console.warn('[WindowState] Dosya boş, varsayılan değerler kullanılıyor')
                return {
                    width: 1400,
                    height: 900,
                    x: undefined,
                    y: undefined,
                    isMaximized: false
                }
            }
            
            const state = JSON.parse(data)
            
            // Geçerli format kontrolü
            if (!state || typeof state !== 'object') {
                console.warn('[WindowState] Geçersiz state verisi, varsayılan değerler kullanılıyor')
                return {
                    width: 1400,
                    height: 900,
                    x: undefined,
                    y: undefined,
                    isMaximized: false
                }
            }
            
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
        if (!window || window.isDestroyed()) return

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

    // Ekran dışı kontrolü (Pencere koordinatları geçerli mi?)
    if (windowState.x !== undefined && windowState.y !== undefined) {
        const display = screen.getDisplayMatching({
            x: windowState.x,
            y: windowState.y,
            width: windowState.width,
            height: windowState.height
        })

        if (!display ||
            windowState.x < display.bounds.x ||
            windowState.y < display.bounds.y ||
            windowState.x > display.bounds.x + display.bounds.width ||
            windowState.y > display.bounds.y + display.bounds.height) {

            console.log('[WindowState] Geçersiz koordinatlar, merkeze alınıyor')
            windowState.x = undefined
            windowState.y = undefined
        }
    }

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
    mainWindow._lastBounds = mainWindow.getBounds()
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

    // Pencere kapandığında referansı temizle (Zombie object oluşumunu engelle)
    mainWindow.on('closed', () => {
        mainWindow = null
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
const initializedSessions = new Set()

/**
 * Belirli bir partition için session ayarlarını yapılandır
 * @param {string} partitionName 
 */
function configureSession(partitionName) {
    if (initializedSessions.has(partitionName)) return

    try {
        const ses = partitionName === 'default'
            ? session.defaultSession
            : session.fromPartition(partitionName)

        initializedSessions.add(partitionName)

        console.log(`[Sessions] Partition yapılandırılıyor: ${partitionName}`)

        ses.webRequest.onBeforeSendHeaders((details, callback) => {
            details.requestHeaders['User-Agent'] = CHROME_USER_AGENT

            // Browser header'larını ekle
            Object.assign(details.requestHeaders, BROWSER_HEADERS)

            // Google domain'leri için ek header'lar
            if (details.url.includes('google.com') || details.url.includes('gstatic.com') || details.url.includes('googleapis.com')) {
                Object.assign(details.requestHeaders, GOOGLE_HEADERS)
            }

            callback({ requestHeaders: details.requestHeaders })
        })

        // Üçüncü taraf cookie'lere ve özelliklere izin ver
        ses.setPermissionRequestHandler((webContents, permission, callback) => {
            const allowedPermissions = ['notifications', 'media', 'geolocation', 'openExternal']
            callback(allowedPermissions.includes(permission))
        })
    } catch (e) {
        console.error(`[Sessions] Hata (${partitionName}):`, e)
    }
}

function setupSessions() {
    // Default session'ı yapılandır (Sadece bir kez!)
    configureSession('default')

    // Ana AI session'ı yapılandır
    configureSession('persist:ai_session')
}

// ============================================
// SPLASH WINDOW
// ============================================
let splashWindow = null

function createSplashWindow() {
    const finalSplashPath = isDev
        ? path.join(__dirname, '../../src/renderer/public/splash.html')
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
    configureSession,
    isDev
}
