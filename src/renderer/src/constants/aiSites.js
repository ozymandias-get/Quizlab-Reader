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

/**
 * AI sitesinin selector'larını güncelle (runtime için)
 * DOM yapısı değişirse kullanılabilir
 */
export const updateAISiteSelectors = (aiKey, inputSelector, sendButtonSelector) => {
    if (AI_SITES[aiKey]) {
        if (inputSelector) AI_SITES[aiKey].inputSelector = inputSelector
        if (sendButtonSelector) AI_SITES[aiKey].sendButtonSelector = sendButtonSelector
        console.log(`[aiSites] ${aiKey} selector'ları güncellendi`)
    }
}
