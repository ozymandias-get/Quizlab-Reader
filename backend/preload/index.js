const { contextBridge, ipcRenderer } = require('electron')

let _aiRegistryCache = null

contextBridge.exposeInMainWorld('electronAPI', {
    // AI & Automation
    getAiRegistry: async (forceRefresh = false) => {
        if (!_aiRegistryCache || forceRefresh) {
            _aiRegistryCache = await ipcRenderer.invoke('get-ai-registry')
        }
        return _aiRegistryCache
    },
    isAuthDomain: (url) => ipcRenderer.invoke('is-auth-domain', url),
    automation: {
        generateFocusScript: (config) => ipcRenderer.invoke('get-automation-scripts', 'generateFocusScript', config),
        generateClickSendScript: (config) => ipcRenderer.invoke('get-automation-scripts', 'generateClickSendScript', config),
        generateAutoSendScript: (config, text, submit) => ipcRenderer.invoke('get-automation-scripts', 'generateAutoSendScript', config, text, submit),
        generatePickerScript: (translations) => ipcRenderer.invoke('get-automation-scripts', 'generatePickerScript', translations)
    },

    // PDF
    selectPdf: (options) => ipcRenderer.invoke('select-pdf', options),
    getPdfStreamUrl: (filePath) => ipcRenderer.invoke('get-pdf-stream-url', filePath),

    // Utilities
    captureScreen: () => ipcRenderer.invoke('capture-screen'),
    copyImageToClipboard: (dataUrl) => ipcRenderer.invoke('copy-image-to-clipboard', dataUrl),
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    forcePaste: (webContentsId) => ipcRenderer.invoke('force-paste-in-webview', webContentsId),
    showPdfContextMenu: (labels) => ipcRenderer.send('show-pdf-context-menu', labels),

    // Events
    onTriggerScreenshot: (callback) => {
        const handler = (event, type) => callback(type)
        ipcRenderer.on('trigger-screenshot', handler)
        return () => ipcRenderer.removeListener('trigger-screenshot', handler)
    },

    // Meta
    platform: process.platform,

    // Updater
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    openReleasesPage: () => ipcRenderer.invoke('open-releases-page'),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),

    // AI Config
    saveAiConfig: (hostname, config) => ipcRenderer.invoke('save-ai-config', hostname, config),
    getAiConfig: (hostname) => ipcRenderer.invoke('get-ai-config', hostname),
    deleteAiConfig: (hostname) => ipcRenderer.invoke('delete-ai-config', hostname),
    deleteAllAiConfigs: () => ipcRenderer.invoke('delete-all-ai-configs'),
    addCustomAi: (data) => ipcRenderer.invoke('add-custom-ai', data),
    deleteCustomAi: (id) => ipcRenderer.invoke('delete-custom-ai', id)
})
