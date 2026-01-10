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
    // NOT: Spesifik listener kaldırma - diğer modüller aynı kanalı dinleyebilir
    onTriggerScreenshot: (callback) => {
        // Wrapper fonksiyon oluştur - kaldırırken aynı referansı kullanmamız gerekiyor
        const handler = (event, type) => callback(type)
        ipcRenderer.on('trigger-screenshot', handler)
        // Cleanup: Sadece BU listener'ı kaldır, diğerlerini etkileme
        return () => ipcRenderer.removeListener('trigger-screenshot', handler)
    },

    // Platform bilgisi
    platform: process.platform,

    // ===== GOOGLE LOGIN API =====
    // Google login popup aç
    googleLoginPopup: () => ipcRenderer.invoke('google-login-popup'),

    // Google login durumunu kontrol et
    checkGoogleLogin: () => ipcRenderer.invoke('check-google-login'),

    // Google oturumunu kapat
    googleLogout: () => ipcRenderer.invoke('google-logout'),

    // ===== COOKIE IMPORT API =====
    // Cookie JSON'ı import et (yapıştırma)
    importCookiesJson: (json) => ipcRenderer.invoke('import-cookies-json', json),

    // ===== PROFILE API =====
    // Profilleri getir
    getProfiles: () => ipcRenderer.invoke('get-profiles'),

    // Yeni profil oluştur (isim ve opsiyonel cookie JSON)
    createProfile: (name, cookieJson) => ipcRenderer.invoke('create-profile', name, cookieJson),

    // Profili güncelle
    updateProfile: (profileId) => ipcRenderer.invoke('update-profile', profileId),

    // Profile geç
    switchProfile: (profileId) => ipcRenderer.invoke('switch-profile', profileId),

    // Profili sil
    deleteProfile: (profileId) => ipcRenderer.invoke('delete-profile', profileId),

    // Profil adını değiştir
    renameProfile: (profileId, newName) => ipcRenderer.invoke('rename-profile', profileId, newName),

    // ===== UPDATER API =====
    // Güncelleme kontrolü (GitHub Releases)
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

    // GitHub Releases sayfasını aç
    openReleasesPage: () => ipcRenderer.invoke('open-releases-page'),

    // Uygulama sürümünü al
    getAppVersion: () => ipcRenderer.invoke('get-app-version')
})
