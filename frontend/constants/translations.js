import en from '../locales/en.json'
import tr from '../locales/tr.json'

/**
 * Dil çevirileri yapılandırması
 * Desteklenen diller: İngilizce, Türkçe
 */

export const LANGUAGES = {
    en: {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        flag: '🇬🇧',
        dir: 'ltr'
    },
    tr: {
        code: 'tr',
        name: 'Turkish',
        nativeName: 'Türkçe',
        flag: '🇹🇷',
        dir: 'ltr'
    }
}

export const translations = {
    en,
    tr
}

export const DEFAULT_LANGUAGE = 'tr'
export const VALID_LANGUAGES = Object.keys(LANGUAGES)

