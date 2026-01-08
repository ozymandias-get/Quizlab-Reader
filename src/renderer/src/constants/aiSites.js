/**
 * AI Siteleri yapılandırması
 * Desteklenen AI platformlarının URL ve isim bilgilerini içerir
 */
export const AI_SITES = {
    chatgpt: {
        url: 'https://chatgpt.com',
        name: 'chatgpt.com',
        displayName: 'ChatGPT',
        icon: 'chatgpt'
    },
    gemini: {
        url: 'https://gemini.google.com',
        name: 'gemini.google.com',
        displayName: 'Gemini',
        icon: 'gemini'
    }
}

export const DEFAULT_AI = 'gemini'
export const VALID_AI_OPTIONS = ['chatgpt', 'gemini']
