/**
 * QuizLab Reader - Electron Main Process
 */
const { app, BrowserWindow, dialog } = require('electron')
const {
    registerPdfScheme,
    registerPdfProtocol,
    registerPdfHandlers,
    startPdfCleanupInterval,
    stopPdfCleanupInterval,
    clearAllPdfPaths
} = require('./pdfProtocol')
const {
    createWindow,
    createSplashWindow,
    getSplashWindow,
    getMainWindow,
    isDev
} = require('./windowManager')
const { registerGeneralHandlers } = require('./ipcHandlers')
const { initUpdater } = require('./updater')
const { setupAdBlocker } = require('./adblocker')

// ============================================
// SINGLE INSTANCE LOCK
// ============================================
if (!isDev) {
    const gotTheLock = app.requestSingleInstanceLock()
    if (!gotTheLock) {
        app.quit()
        process.exit(0)
    }

    app.on('second-instance', () => {
        const mainWindow = getMainWindow()
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
        }
    })
}

// ============================================
// INITIALIZATION
// ============================================

// Register schemes before app ready
registerPdfScheme()

/**
 * Main application entry point
 */
async function initializeApp() {
    // 1. Initial splash screen
    createSplashWindow()

    // 2. Protocols and Handlers
    registerPdfProtocol()
    registerPdfHandlers()
    registerGeneralHandlers()
    await setupAdBlocker()

    // 3. Background maintenance
    startPdfCleanupInterval()

    // 4. Create main window
    createWindow()

    // Init update system
    initUpdater()
}

app.whenReady().then(initializeApp)

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        const mw = createWindow()
        mw.show()
    }
})

app.on('window-all-closed', () => {
    stopPdfCleanupInterval()
    clearAllPdfPaths()

    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// ============================================
// GLOBAL ERROR HANDLING
// ============================================

const handleSeriousError = (type, error) => {
    console.error(`${type}:`, error)

    if (app.isReady()) {
        const message = error instanceof Error ? error.message : String(error)
        dialog.showErrorBox(
            type,
            ` The app encountered a critical error.\n\n` +
            `Error: ${message.slice(0, 500)}`
        )
    }
}

process.on('uncaughtException', (err) => {
    if (err.code === 'EPIPE') return
    handleSeriousError('Uncaught Exception', err)
})

process.on('unhandledRejection', (reason) => {
    handleSeriousError('Unhandled Rejection', reason)
})

