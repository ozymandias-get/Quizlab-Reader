/**
 * QuizLab Reader - Preload Script
 * Main ve Renderer process'ler arasında güvenli köprü
 */
const { contextBridge, ipcRenderer } = require('electron')

// API'yi renderer'a güvenli şekilde expose et
contextBridge.exposeInMainWorld('electronAPI', {
    // PDF seçme
    selectPdf: () => ipcRenderer.invoke('select-pdf'),

    // Ekran görüntüsü alma
    captureScreen: () => ipcRenderer.invoke('capture-screen'),

    // Platform bilgisi
    platform: process.platform
})

// Webview için gerekli
contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron
})
