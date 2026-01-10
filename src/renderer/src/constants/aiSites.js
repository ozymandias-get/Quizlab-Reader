/**
 * AI Siteleri yapılandırması
 * Desteklenen AI platformlarının URL ve isim bilgilerini içerir
 * 
 * SELECTOR STRATEJİSİ:
 * - Birden fazla selector virgülle ayrılarak belirtilir
 * - Tarayıcı ilk eşleşeni kullanır (CSS :is() benzeri davranış)
 * - AI siteleri DOM'larını sık değiştirdiğinden fallback'ler kritik
 * 
 * SELECTOR ÖNCELİK SIRASI:
 * 1. data-testid veya aria-label (en kararlı)
 * 2. Özel class isimleri
 * 3. Genel element türleri (fallback)
 */

/**
 * MERKEZİ USER-AGENT VE HEADER TANIMLARI
 * Tüm webview ve session ayarları için tek kaynak
 * 
 * NOT: Bu değerler hem main process (windowManager.js) hem de
 * renderer process (AiWebview.jsx) tarafından kullanılır
 */
export const CHROME_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

export const BROWSER_HEADERS = {
    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"'
}

/**
 * GÜVENLİK: Domain Allowlist (Beyaz Liste)
 * 
 * SADECE bu listede tam eşleşen domainlere navigasyona izin verilir.
 * includes() tabanlı zayıf kontrol yerine katı regex eşleşmesi kullanılır.
 * 
 * Her domain için:
 * - Tam domain eşleşmesi (örn: "chatgpt.com")
 * - Veya subdomain eşleşmesi (örn: "*.chatgpt.com")
 * 
 * YENİ BİR AI PLATFORM EKLENECEKSE:
 * 1. AI_SITES objesine platform ekle
 * 2. ALLOWED_DOMAINS listesine ilgili domainleri ekle
 * 3. ALLOWED_AUTH_DOMAINS listesine gerekli auth domainlerini ekle
 */

// Ana AI platformlarının domainleri (navigasyona izin verilen)
// NOT: Sadece dosya içinde kullanılır - dışarıya export edilmez
const ALLOWED_DOMAINS = [
    // ChatGPT
    'chatgpt.com',
    'chat.openai.com',
    'openai.com',

    // Google Gemini
    'gemini.google.com',
    'bard.google.com',
    'google.com',        // Google subdomainleri için
    'gstatic.com',       // Google static assets
    'googleapis.com',    // Google API'ları
]

// OAuth/Login işlemleri için izin verilen auth domainleri
// NOT: Sadece dosya içinde kullanılır - dışarıya export edilmez
const ALLOWED_AUTH_DOMAINS = [
    // Google Authentication
    'accounts.google.com',
    'accounts.youtube.com',

    // Apple Sign-in
    'appleid.apple.com',
    'appleid.cdn-apple.com',

    // Microsoft (ChatGPT Microsoft hesap desteği)
    'login.microsoftonline.com',
    'login.live.com',

    // OpenAI Authentication
    'auth.openai.com',
    'auth0.openai.com',
    'platform.openai.com',

    // CloudFlare (Bot koruması için)
    'challenges.cloudflare.com',
]

/**
 * GÜVENLİK: Verilen hostname'in izin listesinde olup olmadığını kontrol eder.
 * 
 * KATI EŞLEŞTİRME KURALLARI:
 * 1. Tam eşleşme: "chatgpt.com" === "chatgpt.com" ✓
 * 2. Subdomain eşleşme: "auth.openai.com".endsWith(".openai.com") ✓
 * 3. REDDETME: "maliciouschatgpt.com" !== "chatgpt.com" (kötü niyetli)
 * 4. REDDETME: "chatgpt.com.evil.com" !== "chatgpt.com" (phishing)
 * 
 * NOT: includes() gibi zayıf kontroller KULLANILMAZ!
 * 
 * @param {string} hostname - Kontrol edilecek hostname (örn: "chatgpt.com")
 * @param {string[]} allowedDomains - İzin verilen domain listesi
 * @returns {boolean} - İzinli ise true
 */
const isHostnameAllowed = (hostname, allowedDomains) => {
    // Erken return - geçersiz parametreler
    if (!hostname || typeof hostname !== 'string') return false
    if (!allowedDomains || !Array.isArray(allowedDomains)) return false

    const normalizedHostname = hostname.toLowerCase().trim()

    // GÜVENLİK: Boş veya çok uzun hostname'leri reddet
    if (normalizedHostname.length === 0 || normalizedHostname.length > 253) {
        return false
    }

    // GÜVENLİK: Sadece geçerli hostname karakterlerini kabul et
    // a-z, 0-9, hyphen, dots - diğer her şeyi reddet
    if (!/^[a-z0-9.-]+$/.test(normalizedHostname)) {
        return false
    }

    for (const domain of allowedDomains) {
        const normalizedDomain = domain.toLowerCase().trim()

        // Tam eşleşme: "chatgpt.com" === "chatgpt.com"
        if (normalizedHostname === normalizedDomain) {
            return true
        }

        // Subdomain eşleşmesi: "auth.openai.com".endsWith(".openai.com")
        // GÜVENLİK: Doğrudan endsWith kullanmak yerine "." prefix kontrolü yapıyoruz
        // Bu sayede "maliciouschatgpt.com" gibi domainler geçemez
        if (normalizedHostname.endsWith('.' + normalizedDomain)) {
            return true
        }
    }

    return false
}

/**
 * Hem ana domainleri hem de auth domainlerini kontrol eder.
 * 
 * @param {string} hostname - Kontrol edilecek hostname
 * @returns {boolean} - İzinli ise true
 */
export const isAllowedNavigation = (hostname) => {
    return isHostnameAllowed(hostname, ALLOWED_DOMAINS) ||
        isHostnameAllowed(hostname, ALLOWED_AUTH_DOMAINS)
}

/**
 * Auth sayfası olup olmadığını kontrol eder.
 * 
 * @param {string} hostname - Kontrol edilecek hostname
 * @returns {boolean} - Auth sayfası ise true
 */
export const isAuthDomain = (hostname) => {
    return isHostnameAllowed(hostname, ALLOWED_AUTH_DOMAINS)
}

export const AI_SITES = {
    chatgpt: {
        url: 'https://chatgpt.com',
        name: 'chatgpt.com',
        displayName: 'ChatGPT',
        icon: 'chatgpt',
        // ChatGPT input selector'ları (öncelik sırasına göre)
        // 1. data-id attribute (kararlı)
        // 2. #prompt-textarea ID (eski versiyon)
        // 3. contenteditable div (yeni versiyon)
        // 4. Genel textarea fallback
        inputSelector: [
            'textarea[data-id="root"]',
            '#prompt-textarea',
            'div[contenteditable="true"][data-placeholder]',
            'form textarea'
        ].join(', '),
        // ChatGPT send button selector'ları
        // 1. data-testid (en kararlı)
        // 2. aria-label attribute
        // 3. SVG içeren button (fallback)
        sendButtonSelector: [
            'button[data-testid="send-button"]',
            'button[aria-label="Send prompt"]',
            'button[aria-label="Send message"]',
            'form button[type="submit"]'
        ].join(', ')
    },
    gemini: {
        url: 'https://gemini.google.com',
        name: 'gemini.google.com',
        displayName: 'Gemini',
        icon: 'gemini',
        // Gemini input selector'ları
        // 1. rich-textarea (yeni versiyon)
        // 2. ql-editor (Quill editör)
        // 3. contenteditable div (genel fallback)
        inputSelector: [
            'rich-textarea .ql-editor',
            '.ql-editor[contenteditable="true"]',
            'div[contenteditable="true"][aria-label]',
            'div[contenteditable="true"]'
        ].join(', '),
        // Gemini send button selector'ları
        // 1. aria-label attribute (en kararlı)
        // 2. mat-icon-button class (Material Design)
        // 3. send-button class (fallback)
        sendButtonSelector: [
            'button[aria-label="Send message"]',
            'button.send-button',
            'button[aria-label*="Send"]',
            'button[mat-icon-button][aria-label*="send" i]'
        ].join(', ')
    }
}

/**
 * Varsayılan AI platformu
 */
export const DEFAULT_AI = 'gemini'

/**
 * Geçerli AI seçenekleri
 */
export const VALID_AI_OPTIONS = Object.keys(AI_SITES)
