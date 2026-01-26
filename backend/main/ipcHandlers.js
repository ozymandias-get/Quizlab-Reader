const electron = require('electron')
const { ipcMain, BrowserWindow, shell, Menu, MenuItem, clipboard, nativeImage, app } = electron
const fs = require('fs').promises
const path = require('path')
const APP_CONFIG = require('./constants')

const { AI_REGISTRY, DEFAULT_AI_ID, GET_ALL_AI_IDS, isAuthDomain, CHROME_USER_AGENT, INACTIVE_PLATFORMS } = require('../modules/ai/aiManager')
const { generateFocusScript, generateClickSendScript, generateAutoSendScript } = require('../modules/automation/automationScripts')
const { generatePickerScript } = require('../modules/automation/userElementPicker')

const getCustomPlatformsPath = () => path.join(app.getPath('userData'), 'ai_custom_platforms.json')

function registerGeneralHandlers() {
    const { IPC_CHANNELS, SCREENSHOT_TYPES } = APP_CONFIG

    ipcMain.handle(IPC_CHANNELS.CAPTURE_SCREEN, async (event) => {
        try {
            const win = BrowserWindow.fromWebContents(event.sender)
            if (!win || win.isDestroyed()) return null
            const image = await win.webContents.capturePage()
            return image.toDataURL()
        } catch (error) {
            console.error('[IPC] Screen capture failed:', error)
            return null
        }
    })

    ipcMain.handle(IPC_CHANNELS.COPY_IMAGE, async (event, dataUrl) => {
        try {
            if (!dataUrl?.startsWith('data:image/')) return false
            const image = nativeImage.createFromDataURL(dataUrl)
            if (image.isEmpty()) return false
            clipboard.writeImage(image)
            return true
        } catch (error) {
            console.error('[IPC] Clipboard copy failed:', error)
            return false
        }
    })

    ipcMain.handle(IPC_CHANNELS.OPEN_EXTERNAL, async (event, url) => {
        if (!url || typeof url !== 'string') return false
        try {
            const parsedUrl = new URL(url)
            const allowedProtocols = ['http:', 'https:', 'mailto:']
            if (allowedProtocols.includes(parsedUrl.protocol)) {
                await shell.openExternal(url)
                return true
            }
            return false
        } catch (error) {
            console.error(`[IPC] External link error:`, error.message)
            return false
        }
    })

    ipcMain.handle(IPC_CHANNELS.FORCE_PASTE, async (event, webContentsId) => {
        try {
            if (!webContentsId) return false
            const contents = electron.webContents.fromId(webContentsId)
            if (contents && !contents.isDestroyed()) {
                contents.paste()
                return true
            }
            return false
        } catch (error) {
            console.error('[IPC] Force paste failed:', error)
            return false
        }
    })

    ipcMain.on(IPC_CHANNELS.SHOW_PDF_CONTEXT_MENU, (event, labels = {}) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (!win || win.isDestroyed()) return

        const menu = new Menu()
        menu.append(new MenuItem({
            label: labels.full_page_screenshot || 'Full Page Screenshot',
            accelerator: 'CmdOrCtrl+S',
            click: () => win.webContents.send(IPC_CHANNELS.TRIGGER_SCREENSHOT, SCREENSHOT_TYPES.FULL)
        }))
        menu.append(new MenuItem({
            label: labels.crop_screenshot || 'Crop Screenshot',
            accelerator: 'CmdOrCtrl+Shift+S',
            click: () => win.webContents.send(IPC_CHANNELS.TRIGGER_SCREENSHOT, SCREENSHOT_TYPES.CROP)
        }))
        menu.append(new MenuItem({ type: 'separator' }))
        menu.append(new MenuItem({ label: labels.zoom_in || 'Zoom In', role: 'zoomIn' }))
        menu.append(new MenuItem({ label: labels.zoom_out || 'Zoom Out', role: 'zoomOut' }))
        menu.append(new MenuItem({ label: labels.reset_zoom || 'Reset Zoom', role: 'resetZoom' }))
        menu.append(new MenuItem({ type: 'separator' }))
        menu.append(new MenuItem({ label: labels.reload || 'Reload', role: 'reload' }))
        menu.popup({ window: win })
    })

    ipcMain.handle(IPC_CHANNELS.SAVE_AI_CONFIG, async (event, hostname, config) => {
        try {
            const configPath = path.join(app.getPath('userData'), 'ai_custom_selectors.json')
            let currentConfig = {}
            try {
                const data = await fs.readFile(configPath, 'utf8')
                currentConfig = JSON.parse(data)
            } catch (e) { }

            currentConfig[hostname] = { ...config, timestamp: Date.now() }
            await fs.writeFile(configPath, JSON.stringify(currentConfig, null, 2))
            return true
        } catch (error) {
            console.error('[IPC] Failed to save AI config:', error)
            return false
        }
    })

    ipcMain.handle(IPC_CHANNELS.GET_AI_CONFIG, async (event, hostname) => {
        try {
            const configPath = path.join(app.getPath('userData'), 'ai_custom_selectors.json')
            try {
                const data = await fs.readFile(configPath, 'utf8')
                const fullConfig = JSON.parse(data)
                return hostname ? fullConfig[hostname] : fullConfig
            } catch (e) {
                return null
            }
        } catch (error) {
            console.error('[IPC] Failed to get AI config:', error)
            return null
        }
    })

    // Tek bir selektörü sil
    ipcMain.handle(IPC_CHANNELS.DELETE_AI_CONFIG, async (event, hostname) => {
        try {
            const configPath = path.join(app.getPath('userData'), 'ai_custom_selectors.json')
            let currentConfig = {}
            try {
                const data = await fs.readFile(configPath, 'utf8')
                currentConfig = JSON.parse(data)
            } catch (e) { }

            if (currentConfig[hostname]) {
                delete currentConfig[hostname]
                await fs.writeFile(configPath, JSON.stringify(currentConfig, null, 2))
            }
            return true
        } catch (error) {
            console.error('[IPC] Failed to delete AI config:', error)
            return false
        }
    })

    // Tüm selektörleri sil
    ipcMain.handle(IPC_CHANNELS.DELETE_ALL_AI_CONFIGS, async () => {
        try {
            const configPath = path.join(app.getPath('userData'), 'ai_custom_selectors.json')
            await fs.writeFile(configPath, JSON.stringify({}, null, 2))
            return true
        } catch (error) {
            console.error('[IPC] Failed to delete all AI configs:', error)
            return false
        }
    })

    ipcMain.handle(IPC_CHANNELS.ADD_CUSTOM_AI, async (event, platformData) => {
        try {
            const configPath = getCustomPlatformsPath()
            let currentConfig = {}
            try {
                const data = await fs.readFile(configPath, 'utf8')
                currentConfig = JSON.parse(data)
            } catch (e) { }

            const id = 'custom_' + Date.now()
            let newPlatform = {
                id,
                name: platformData.name,
                url: platformData.url,
                icon: 'globe', // Default
                selectors: { input: null, button: null, waitFor: null },
                isCustom: true
            }

            // Check if we can restore icon from inactive platforms
            const lowerUrl = platformData.url.toLowerCase().trim()
            for (const key in INACTIVE_PLATFORMS) {
                const p = INACTIVE_PLATFORMS[key]
                if (p.url && (lowerUrl.includes(p.url.replace('https://', '').replace(/\/$/, '')) || p.url.includes(lowerUrl))) {
                    newPlatform.icon = p.icon
                    newPlatform.color = p.color
                    break
                }
            }

            currentConfig[id] = newPlatform
            await fs.writeFile(configPath, JSON.stringify(currentConfig, null, 2))
            return { success: true, id, platform: newPlatform }
        } catch (error) {
            console.error('[IPC] Failed to add custom AI:', error)
            return { success: false, error: error.message }
        }
    })

    ipcMain.handle(IPC_CHANNELS.DELETE_CUSTOM_AI, async (event, id) => {
        try {
            const configPath = getCustomPlatformsPath()
            let currentConfig = {}
            try {
                const data = await fs.readFile(configPath, 'utf8')
                currentConfig = JSON.parse(data)
            } catch (e) { }

            if (currentConfig[id]) {
                delete currentConfig[id]
                await fs.writeFile(configPath, JSON.stringify(currentConfig, null, 2))
                return true
            }
            return false
        } catch (error) {
            return false
        }
    })

    ipcMain.handle(IPC_CHANNELS.GET_AI_REGISTRY, async () => {
        // Load custom platforms
        const configPath = getCustomPlatformsPath()
        let customPlatforms = {}
        try {
            const data = await fs.readFile(configPath, 'utf8')
            customPlatforms = JSON.parse(data)
        } catch (e) { }

        const mergedRegistry = { ...AI_REGISTRY, ...customPlatforms }
        const allIds = [...Object.keys(AI_REGISTRY), ...Object.keys(customPlatforms)]

        return {
            aiRegistry: mergedRegistry,
            defaultAiId: DEFAULT_AI_ID,
            allAiIds: allIds,
            chromeUserAgent: CHROME_USER_AGENT
        }
    })

    ipcMain.handle(IPC_CHANNELS.GET_AUTOMATION_SCRIPTS, (event, action, ...args) => {
        try {
            switch (action) {
                case 'generateFocusScript': return generateFocusScript(...args)
                case 'generateClickSendScript': return generateClickSendScript(...args)
                case 'generateAutoSendScript': return generateAutoSendScript(...args)
                case 'generatePickerScript': return generatePickerScript(args[0])
                default: return null
            }
        } catch (error) {
            console.error('[IPC] Automation script error:', error)
            return null
        }
    })

    ipcMain.handle(IPC_CHANNELS.IS_AUTH_DOMAIN, (event, urlOrHostname) => {
        try {
            // Try to parse as URL to extract hostname
            const parsed = new URL(urlOrHostname)
            return isAuthDomain(parsed.hostname)
        } catch {
            // If invalid URL (e.g. just "google.com"), assume it's already a hostname
            return isAuthDomain(urlOrHostname)
        }
    })
}

module.exports = { registerGeneralHandlers }
