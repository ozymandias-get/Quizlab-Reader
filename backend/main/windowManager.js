/**
 * Window Manager Module
 */
const { BrowserWindow, dialog, session, app, screen } = require('electron')
const path = require('path')
const fs = require('fs')
const APP_CONFIG = require('./constants')

const isDev = !app.isPackaged
const windowStateFile = path.join(app.getPath('userData'), 'window-state.json')

/**
 * Path Resolution Helper
 */
const getAppPath = (...parts) => {
    return isDev
        ? path.join(__dirname, ...parts)
        : path.join(app.getAppPath(), ...parts)
}

// ============================================
// WINDOW STATE PERSISTENCE
// ============================================

function getDefaultWindowState() {
    return {
        width: APP_CONFIG.WINDOW.DEFAULT_WIDTH,
        height: APP_CONFIG.WINDOW.DEFAULT_HEIGHT,
        x: undefined,
        y: undefined,
        isMaximized: false
    }
}

function loadWindowState() {
    try {
        if (fs.existsSync(windowStateFile)) {
            const data = fs.readFileSync(windowStateFile, 'utf-8')
            return data ? JSON.parse(data) : getDefaultWindowState()
        }
    } catch (error) {
        console.warn('[WindowState] Load error:', error.message)
    }
    return getDefaultWindowState()
}

function saveWindowState(window) {
    try {
        if (!window || window.isDestroyed()) return

        const isMaximized = window.isMaximized()
        // Use normalBounds if maximized to restore to proper size
        const bounds = isMaximized && window.getNormalBounds ? window.getNormalBounds() : window.getBounds()

        const state = {
            width: bounds.width,
            height: bounds.height,
            x: bounds.x,
            y: bounds.y,
            isMaximized
        }

        fs.writeFileSync(windowStateFile, JSON.stringify(state, null, 2))
    } catch (error) {
        console.warn('[WindowState] Save error:', error.message)
    }
}

// ============================================
// MAIN WINDOW
// ============================================
let mainWindow = null

function createWindow() {
    const windowState = loadWindowState()

    // Monitor positioning
    // Monitor positioning
    if (windowState.x !== undefined && windowState.y !== undefined) {
        const display = screen.getDisplayMatching(windowState)

        if (display) {
            const { workArea } = display

            // Ensure width/height fits in workArea
            if (windowState.width > workArea.width) windowState.width = workArea.width
            if (windowState.height > workArea.height) windowState.height = workArea.height

            // Check X bounds
            if (windowState.x + windowState.width > workArea.x + workArea.width) {
                windowState.x = workArea.x + workArea.width - windowState.width
            }
            if (windowState.x < workArea.x) {
                windowState.x = workArea.x
            }

            // Check Y bounds
            if (windowState.y + windowState.height > workArea.y + workArea.height) {
                windowState.y = workArea.y + workArea.height - windowState.height
            }
            if (windowState.y < workArea.y) {
                windowState.y = workArea.y
            }
        } else {
            windowState.x = undefined
            windowState.y = undefined
        }
    }

    const iconPath = getAppPath(isDev ? '../../resources' : 'resources', `icon.${process.platform === 'win32' ? 'ico' : 'png'}`)

    mainWindow = new BrowserWindow({
        width: windowState.width,
        height: windowState.height,
        x: windowState.x,
        y: windowState.y,
        minWidth: APP_CONFIG.WINDOW.MIN_WIDTH,
        minHeight: APP_CONFIG.WINDOW.MIN_HEIGHT,
        icon: iconPath,
        autoHideMenuBar: true,
        backgroundColor: '#0c0a09',
        show: false,
        webPreferences: {
            preload: path.join(__dirname, '../preload/index.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            webviewTag: true,
            webSecurity: true,
            spellcheck: false
        }
    })

    if (!isDev) {
        mainWindow.setMenu(null)
    } else {
        mainWindow.loadURL('http://localhost:5173')
        mainWindow.webContents.openDevTools()
    }

    if (!isDev) {
        const indexPath = path.join(app.getAppPath(), 'dist', 'index.html')
        mainWindow.loadFile(indexPath).catch(err => {
            dialog.showErrorBox('Load Error', `Index not found: ${indexPath}`)
        })
    }

    if (windowState.isMaximized) {
        mainWindow.maximize()
    }

    mainWindow.once('ready-to-show', () => {
        if (splashWindow && !splashWindow.isDestroyed()) {
            splashWindow.destroy()
            splashWindow = null
        }
        mainWindow.show()
    })

    mainWindow.on('close', () => saveWindowState(mainWindow))
    mainWindow.on('closed', () => { mainWindow = null })

    setupSessions()

    return mainWindow
}

// ============================================
// SESSIONS
// ============================================

function setupSessions() {
    try {
        const aiSession = session.fromPartition(APP_CONFIG.PARTITIONS.AI)

        aiSession.webRequest.onBeforeSendHeaders((details, callback) => {
            details.requestHeaders['User-Agent'] = APP_CONFIG.CHROME_USER_AGENT
            callback({ requestHeaders: details.requestHeaders })
        })

        aiSession.setPermissionRequestHandler((webContents, permission, callback) => {
            const allowed = ['notifications', 'media', 'geolocation']
            callback(allowed.includes(permission))
        })
    } catch (e) {
        console.error(`[Sessions] Error:`, e)
    }
}

// ============================================
// SPLASH WINDOW
// ============================================
let splashWindow = null

function createSplashWindow() {
    const splashPath = isDev
        ? path.join(__dirname, '../../frontend/public/splash.html')
        : path.join(app.getAppPath(), 'dist', 'splash.html')

    splashWindow = new BrowserWindow({
        width: 380,
        height: 380,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        resizable: false,
        center: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    })

    splashWindow.loadFile(splashPath).catch(() => { })
    splashWindow.on('closed', () => { splashWindow = null })

    return splashWindow
}

module.exports = {
    createWindow,
    createSplashWindow,
    getSplashWindow: () => splashWindow,
    getMainWindow: () => mainWindow,
    isDev
}
