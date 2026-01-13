/**
 * Browser Config - Merkezi tarayıcı ayarları
 * 
 * Bu dosya hem main process hem de renderer process'te
 * kullanılan tarayıcı ayarlarını içerir.
 * 
 * NEDEN AYRI DOSYA?
 * - Main process CommonJS (require) kullanır
 * - Renderer process ESM (import) kullanır
 * - Bu dosya her iki ortamda da çalışır
 * 
 * GÜVENLİK NOTU:
 * - Google, "Electron", "Node.js" vb. kelimeleri User-Agent'ta görürse red eder
 * - webdriver, automation algılama mekanizmalarını engellemek gerekiyor
 * - User-Agent değişirse Google güvenliği tetikler (persistence önemli)
 */

const { app } = require('electron')
const path = require('path')
const fs = require('fs')

// User-Agent persistence dosyası
const getUserAgentFile = () => path.join(app.getPath('userData'), 'user-agent.json')

/**
 * Kullanıcının ilk login'de kullandığı User-Agent'ı sakla
 * Google, UA değişikliklerinde güvenlik uyarısı verir
 */
function saveUserAgent(ua) {
    try {
        const filePath = getUserAgentFile()
        fs.writeFileSync(filePath, JSON.stringify({ userAgent: ua, savedAt: new Date().toISOString() }), 'utf-8')
        console.log('[BrowserConfig] User-Agent kaydedildi')
    } catch (e) {
        console.error('[BrowserConfig] User-Agent kaydetme hatası:', e)
    }
}

/**
 * Kaydedilmiş User-Agent'ı yükle veya varsayılanı döndür
 */
function loadUserAgent() {
    try {
        const filePath = getUserAgentFile()
        if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
            if (data && data.userAgent) {
                console.log('[BrowserConfig] Kaydedilmiş User-Agent yüklendi')
                return data.userAgent
            }
        }
    } catch (e) {
        console.warn('[BrowserConfig] User-Agent yükleme hatası:', e)
    }
    return null
}

// Varsayılan Chrome User-Agent (Güncel sürüm - Electron, Node.js kelimeleri YOK)
// ÖNEMLİ: Bu string'te Electron, Node.js, Quizlab vb. şüpheli kelimeler OLMAMALI
const DEFAULT_CHROME_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

// Kaydedilmiş veya varsayılan User-Agent'ı kullan
let CHROME_USER_AGENT = loadUserAgent() || DEFAULT_CHROME_USER_AGENT

// İlk kez çalışıyorsa User-Agent'ı kaydet
if (!loadUserAgent()) {
    saveUserAgent(CHROME_USER_AGENT)
}

// Tarayıcı header'ları - sec-ch-* header'ları (Chrome sürümü ile uyumlu)
const BROWSER_HEADERS = {
    'sec-ch-ua': '"Chromium";v="131", "Google Chrome";v="131", "Not-A.Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-ch-ua-full-version-list': '"Chromium";v="131.0.6778.85", "Google Chrome";v="131.0.6778.85", "Not-A.Brand";v="99.0.0.0"'
}

// Google domain'leri için ek header'lar
const GOOGLE_HEADERS = {
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-dest': 'document',
    'upgrade-insecure-requests': '1'
}

// ŞÜPHELİ HEADER'LARI TEMİZLE
// Google bu header'lara bakarak bot tespiti yapar
const HEADERS_TO_REMOVE = [
    'X-Requested-With',           // Android WebView / App işareti
    'X-DevTools-Emulate-Network-Conditions-Client-Id',
    'X-Chrome-Connected',
    'X-Chrome-ID-Consistency-Request',
    'sec-ch-ua-arch',             // Aşırı detaylı bilgi
    'sec-ch-ua-bitness',
    'sec-ch-ua-wow64'
]

// WEBDRİVER / OTOMASİZON ALGILAMA ÖNLEME
// navigator.webdriver = undefined yapılmalı
const ANTI_DETECTION_SCRIPT = `
(function() {
    // navigator.webdriver'ı gizle
    Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
        configurable: true
    });
    
    // Electron/Node.js izlerini temizle
    delete window.process;
    delete window.require;
    delete window.module;
    delete window.exports;
    
    // Chrome DevTools algılamasını engelle
    Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
        configurable: true
    });
    
    Object.defineProperty(navigator, 'languages', {
        get: () => ['tr-TR', 'tr', 'en-US', 'en'],
        configurable: true
    });
    
    // Headless Chrome algılamasını engelle
    Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => 8,
        configurable: true
    });
    
    // Permission query'sini düzelt
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
    
    console.log('[AntiDetection] Browser fingerprint maskelendi');
})();
`

// BrowserWindow webPreferences için anti-detection ayarları
const ANTI_DETECTION_PREFS = {
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
    webSecurity: true,
    allowRunningInsecureContent: false,
    // Bunlar olmadan Google algılama yapabilir
    enableBlinkFeatures: undefined,
    disableBlinkFeatures: 'AutomationControlled'
}

module.exports = {
    CHROME_USER_AGENT,
    DEFAULT_CHROME_USER_AGENT,
    BROWSER_HEADERS,
    GOOGLE_HEADERS,
    HEADERS_TO_REMOVE,
    ANTI_DETECTION_SCRIPT,
    ANTI_DETECTION_PREFS,
    saveUserAgent,
    loadUserAgent
}
