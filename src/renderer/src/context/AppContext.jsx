import React, { createContext, useContext, useRef, useMemo, useCallback } from 'react'
import { AI_SITES, DEFAULT_AI, VALID_AI_OPTIONS } from '../constants/aiSites'
import { STORAGE_KEYS } from '../constants/storageKeys'
import { useLocalStorageString, useLocalStorageBoolean, useScreenshot } from '../hooks'

/**
 * AppContext - Global uygulama state'i
 * 
 * Prop drilling sorununu çözer:
 * - autoSend, toggleAutoSend
 * - currentAI, setCurrentAI  
 * - isScreenshotMode, startScreenshot, closeScreenshot
 * - webviewRef (AI'ya mesaj göndermek için)
 * - sendTextToAI, sendImageToAI
 * 
 * DOM Bağımlılığı Düzeltmesi:
 * - setTimeout yerine polling mekanizması
 * - waitForElement ve waitForEnabledButton fonksiyonları
 * - Exponential backoff ile retry
 */
const AppContext = createContext(null)

/**
 * DOM elemanının var olmasını bekleyen polling fonksiyonu
 * Webview içinde executeJavaScript ile çalışır
 * 
 * @param {string} selector - CSS selector
 * @param {number} maxWaitMs - Maksimum bekleme süresi (ms)
 * @param {number} intervalMs - Kontrol aralığı (ms)
 * @returns {string} - Webview'da çalışacak JavaScript kodu
 */
const createWaitForElementScript = (selector, maxWaitMs = 5000, intervalMs = 100) => `
    (async function() {
        const selector = ${JSON.stringify(selector)};
        const maxWait = ${maxWaitMs};
        const interval = ${intervalMs};
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWait) {
            const el = document.querySelector(selector);
            if (el) return true;
            await new Promise(r => setTimeout(r, interval));
        }
        return false;
    })()
`

/**
 * Butonun aktif (enabled) olmasını bekleyen polling fonksiyonu
 * 
 * @param {string} selector - CSS selector
 * @param {number} maxWaitMs - Maksimum bekleme süresi
 * @param {number} intervalMs - Kontrol aralığı
 * @returns {string} - Webview'da çalışacak JavaScript kodu
 */
const createWaitForEnabledButtonScript = (selector, maxWaitMs = 8000, intervalMs = 200) => `
    (async function() {
        const selector = ${JSON.stringify(selector)};
        const maxWait = ${maxWaitMs};
        const interval = ${intervalMs};
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWait) {
            const btn = document.querySelector(selector);
            if (btn) {
                const isDisabled = btn.disabled || 
                                   btn.getAttribute('aria-disabled') === 'true' ||
                                   btn.classList.contains('disabled') ||
                                   btn.hasAttribute('disabled');
                
                if (!isDisabled) {
                    btn.click();
                    return { success: true, waitedMs: Date.now() - startTime };
                }
            }
            await new Promise(r => setTimeout(r, interval));
        }
        return { success: false, waitedMs: Date.now() - startTime, reason: 'timeout' };
    })()
`

/**
 * Input elemanına focus yapan ve text ekleyen script
 * Elemanın var olmasını bekler
 */
const createFocusAndInsertScript = (selector) => `
    (async function() {
        const selector = ${JSON.stringify(selector)};
        const maxWait = 3000;
        const interval = 100;
        const startTime = Date.now();
        
        // Elemanın oluşmasını bekle
        let input = null;
        while (Date.now() - startTime < maxWait) {
            input = document.querySelector(selector);
            if (input) break;
            await new Promise(r => setTimeout(r, interval));
        }
        
        if (!input) {
            return { success: false, reason: 'element_not_found' };
        }
        
        input.focus();
        return { success: true, tagName: input.tagName };
    })()
`

export function AppProvider({ children }) {
    // AI Seçimi - STORAGE_KEYS sabiti kullanılıyor
    const [currentAI, setCurrentAI] = useLocalStorageString(STORAGE_KEYS.LAST_SELECTED_AI, DEFAULT_AI, VALID_AI_OPTIONS)

    // Otomatik Gönder - STORAGE_KEYS sabiti kullanılıyor
    const [autoSend, setAutoSend, toggleAutoSend] = useLocalStorageBoolean(STORAGE_KEYS.AUTO_SEND_ENABLED, false)

    // Webview ref - AI'ya mesaj göndermek için
    const webviewRef = useRef(null)

    // AI Sender fonksiyonları
    const sendTextToAI = useCallback(async (text) => {
        const webview = webviewRef.current
        if (!webview || !text) return false

        try {
            const aiConfig = AI_SITES[currentAI]
            if (!aiConfig) {
                console.error('[sendTextToAI] AI config bulunamadı:', currentAI)
                return false
            }

            const selector = aiConfig.inputSelector

            // 1. Input elemanını bul ve focus yap (polling ile)
            const focusResult = await webview.executeJavaScript(createFocusAndInsertScript(selector))

            if (!focusResult.success) {
                console.error('[sendTextToAI] Input bulunamadı:', focusResult.reason)
                return false
            }

            // 2. Native olarak metni yaz (Klavye simülasyonu)
            // Bu yöntem React/Vue state'lerini %100 günceller
            try {
                await webview.insertText(text)
            } catch (err) {
                console.warn('[sendTextToAI] Native insertText başarısız, fallback deneniyor:', err)
                // Fallback: execCommand
                await webview.executeJavaScript(`document.execCommand('insertText', false, ${JSON.stringify(text)})`)
            }

            // 3. Otomatik gönder (polling ile buton aktif olana kadar bekle)
            if (autoSend && aiConfig.sendButtonSelector) {
                // Polling ile butonun aktif olmasını bekle ve tıkla
                const sendResult = await webview.executeJavaScript(
                    createWaitForEnabledButtonScript(aiConfig.sendButtonSelector, 5000, 150)
                )

                if (sendResult.success) {
                    console.log(`[sendTextToAI] ✅ Mesaj gönderildi (${sendResult.waitedMs}ms bekledik)`)
                } else {
                    console.warn('[sendTextToAI] ⚠️ Otomatik gönderme başarısız:', sendResult.reason)
                }
            }

            return true
        } catch (error) {
            console.error('[sendTextToAI] ❌ Metin gönderme hatası:', error)
            return false
        }
    }, [currentAI, autoSend])

    const sendImageToAI = useCallback(async (imageDataUrl) => {
        const webview = webviewRef.current
        if (!webview || !imageDataUrl) return false

        try {
            const aiConfig = AI_SITES[currentAI]
            if (!aiConfig) {
                console.error('[sendImageToAI] AI config bulunamadı:', currentAI)
                return false
            }

            // 1. Görüntüyü sistem clipboard'una kopyala (main process üzerinden)
            const copied = await window.electronAPI?.copyImageToClipboard(imageDataUrl)
            if (!copied) {
                console.error('[sendImageToAI] ❌ Görüntü panoya kopyalanamadı')
                return false
            }
            console.log('[sendImageToAI] ✅ Görüntü panoya kopyalandı')

            // 2. Input elemanını bul ve focus yap (polling ile)
            const focusResult = await webview.executeJavaScript(createFocusAndInsertScript(aiConfig.inputSelector))

            if (!focusResult.success) {
                console.error('[sendImageToAI] ❌ Input bulunamadı:', focusResult.reason)
                return false
            }
            console.log('[sendImageToAI] ✅ Input focus yapıldı:', focusResult.tagName)

            // 3. Kısa bekleme - clipboard işleminin tamamlanması için
            await new Promise(resolve => setTimeout(resolve, 150))

            // 4. Klavye kısayolu ile yapıştır (Ctrl+V / Cmd+V)
            const activeWebview = webview.getActiveWebview()
            if (activeWebview) {
                const isMac = window.electronAPI?.platform === 'darwin'
                const modifier = isMac ? 'meta' : 'control'

                // Input event gönder
                activeWebview.sendInputEvent({
                    type: 'keyDown',
                    keyCode: 'v',
                    modifiers: [modifier]
                })

                activeWebview.sendInputEvent({
                    type: 'char',
                    keyCode: 'v',
                    modifiers: [modifier]
                })

                activeWebview.sendInputEvent({
                    type: 'keyUp',
                    keyCode: 'v',
                    modifiers: [modifier]
                })

                console.log('[sendImageToAI] ✅ Paste komutu gönderildi')
            }

            // 5. Otomatik gönder aktifse, polling ile butonun aktif olmasını bekle
            if (autoSend && aiConfig.sendButtonSelector) {
                // Görüntü yüklenmesi biraz zaman alabilir, daha uzun timeout
                const sendResult = await webview.executeJavaScript(
                    createWaitForEnabledButtonScript(aiConfig.sendButtonSelector, 10000, 300)
                )

                if (sendResult.success) {
                    console.log(`[sendImageToAI] ✅ Görüntü gönderildi (${sendResult.waitedMs}ms bekledik)`)
                } else {
                    console.warn('[sendImageToAI] ⚠️ Otomatik gönderme başarısız:', sendResult.reason)
                    console.warn('[sendImageToAI] ℹ️ Görüntü muhtemelen eklendi, manuel gönderebilirsiniz')
                }
            }

            return true
        } catch (error) {
            console.error('[sendImageToAI] ❌ Görüntü gönderme hatası:', error)
            return false
        }
    }, [currentAI, autoSend])

    // Screenshot işlemleri
    const {
        isScreenshotMode,
        startScreenshot,
        closeScreenshot,
        handleCapture
    } = useScreenshot(sendImageToAI)

    // Context value'yu memoize et
    const value = useMemo(() => ({
        // AI Seçimi
        currentAI,
        setCurrentAI,
        aiSites: AI_SITES,

        // Otomatik Gönder
        autoSend,
        setAutoSend,
        toggleAutoSend,

        // Webview
        webviewRef,

        // AI İletişim
        sendTextToAI,
        sendImageToAI,

        // Screenshot
        isScreenshotMode,
        startScreenshot,
        closeScreenshot,
        handleCapture
    }), [
        currentAI,
        setCurrentAI,
        autoSend,
        setAutoSend,
        toggleAutoSend,
        sendTextToAI,
        sendImageToAI,
        isScreenshotMode,
        startScreenshot,
        closeScreenshot,
        handleCapture
    ])

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

/**
 * AppContext hook'u
 * Provider dışında kullanılırsa hata fırlatır
 */
export function useApp() {
    const context = useContext(AppContext)
    if (!context) {
        throw new Error('useApp must be used within an AppProvider')
    }
    return context
}

export default AppContext
