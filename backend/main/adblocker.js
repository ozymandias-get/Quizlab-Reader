const { session, app } = require('electron')
const { ElectronBlocker } = require('@ghostery/adblocker-electron')
const fetch = require('cross-fetch')
const { promises: fs } = require('fs')
const path = require('path')

/**
 * AdBlocker using Ghostery Engine
 * Blocks ads and trackers using world-class filter lists (uBlock, Easylist, etc.)
 */
async function setupAdBlocker(partition = 'persist:ai_session') {
    try {
        const ses = session.fromPartition(partition)
        const cachePath = path.join(app.getPath('userData'), 'adblock_engine.bin')

        // Initialize Ghostery Blocker with caching
        const blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch, {
            path: cachePath,
            read: fs.readFile,
            write: fs.writeFile,
        })

        // Enable blocking for the specific session
        blocker.enableBlockingInSession(ses)

        console.log(`[Ghostery AdBlocker] Active for partition: ${partition}`)
    } catch (error) {
        console.error('[AdBlocker] Ghostery initialization failed:', error)
    }

    // Suppress specific Autofill/CDP errors from Ghostery that are harmless in Electron
    // Apply patch only once (Singleton)
    if (!global.isAdBlockerConsolePatched) {
        const originalConsoleError = console.error
        console.error = (...args) => {
            // Filter only the specific harmless error from Ghostery/Puppeteer
            if (args.length > 0 &&
                typeof args[0] === 'string' &&
                args[0].includes('Autofill.enable')) {
                return
            }
            originalConsoleError.apply(console, args)
        }
        global.isAdBlockerConsolePatched = true
    }
}

module.exports = { setupAdBlocker }
