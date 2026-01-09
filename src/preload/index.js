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
    // Güncelleme kontrolü (GitHub Releases)
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

    // GitHub Releases sayfasını aç
    openReleasesPage: () => ipcRenderer.invoke('open-releases-page'),

    // Uygulama sürümünü al
    getAppVersion: () => ipcRenderer.invoke('get-app-version')
})
