/**
 * AI Siteleri yapılandırması
 * Desteklenen AI platformlarının URL ve isim bilgilerini içerir
 */
export const AI_SITES = {
    chatgpt: {
        url: 'https://chatgpt.com',
        name: 'chatgpt.com',
        displayName: 'ChatGPT',
        icon: 'chatgpt',
        // ChatGPT input selector'ları
        inputSelector: '#prompt-textarea, textarea[data-id="root"]',
        sendButtonSelector: 'button[data-testid="send-button"]'
    },
    gemini: {
        url: 'https://gemini.google.com',
        name: 'gemini.google.com',
        displayName: 'Gemini',
        icon: 'gemini',
        // Gemini input selector'ları
        inputSelector: '.ql-editor, div[contenteditable="true"]',
        sendButtonSelector: 'button[aria-label="Send message"], button.send-button'
    }
}

export const DEFAULT_AI = 'gemini'
export const VALID_AI_OPTIONS = ['chatgpt', 'gemini']

