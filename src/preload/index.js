/**
 * QuizLab Reader - Preload Script
 * Main ve Renderer process'ler arasında güvenli köprü
 */
const { contextBridge, ipcRenderer } = require('electron')

// API'yi renderer'a güvenli şekilde expose et
contextBridge.exposeInMainWorld('electronAPI', {
    // PDF seçme
    selectPdf: () => ipcRenderer.invoke('select-pdf'),

    // Dosya yolundan streamUrl üret (drag & drop için)
    getPdfStreamUrl: (filePath) => ipcRenderer.invoke('get-pdf-stream-url', filePath),

    // Ekran görüntüsü alma
    captureScreen: () => ipcRenderer.invoke('capture-screen'),

    // Görüntüyü sistem clipboard'una kopyala
    copyImageToClipboard: (dataUrl) => ipcRenderer.invoke('copy-image-to-clipboard', dataUrl),

    // Harici linki sistem tarayıcısında aç
    openExternal: (url) => ipcRenderer.invoke('open-external', url),

    // PDF Sağ Tık Menüsü
    showPdfContextMenu: () => ipcRenderer.send('show-pdf-context-menu'),

    // Screenshot tetikleyicisi (Main -> Renderer)
    onTriggerScreenshot: (callback) => {
        ipcRenderer.on('trigger-screenshot', (event, type) => callback(type))
        // Cleanup için return fonksiyonu (opsiyonel ama iyi pratik)
        return () => ipcRenderer.removeAllListeners('trigger-screenshot')
    },

    // Platform bilgisi
    platform: process.platform,

    // ===== UPDATER API =====
    // Güncelleme kontrolü
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

    // Güncelleme indir
    downloadUpdate: () => ipcRenderer.invoke('download-update'),

    // Güncellemeyi kur ve yeniden başlat
    installUpdate: () => ipcRenderer.invoke('install-update'),

    // Uygulama sürümünü al
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),

    // Güncelleme olaylarını dinle
    onUpdateAvailable: (callback) => {
        ipcRenderer.on('update-available', (event, data) => callback(data))
    },
    onUpdateNotAvailable: (callback) => {
        ipcRenderer.on('update-not-available', (event, data) => callback(data))
    },
    onDownloadProgress: (callback) => {
        ipcRenderer.on('download-progress', (event, data) => callback(data))
    },
    onUpdateDownloaded: (callback) => {
        ipcRenderer.on('update-downloaded', (event, data) => callback(data))
    },
    onUpdateError: (callback) => {
        ipcRenderer.on('update-error', (event, data) => callback(data))
    }
})

// Webview için gerekli
contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron
})
