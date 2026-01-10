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
 */

// Chrome User-Agent - Bot dedektörlerini atlamak için
const CHROME_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// Tarayıcı header'ları - sec-ch-* header'ları
const BROWSER_HEADERS = {
    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"'
}

// Google domain'leri için ek header'lar
const GOOGLE_HEADERS = {
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-dest': 'document',
    'upgrade-insecure-requests': '1'
}

module.exports = {
    CHROME_USER_AGENT,
    BROWSER_HEADERS,
    GOOGLE_HEADERS
}
