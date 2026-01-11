import React, { createContext, useContext, useRef, useMemo, useCallback, useState, useEffect } from 'react'
import { AI_SITES, DEFAULT_AI, VALID_AI_OPTIONS } from '../constants/aiSites'
import { STORAGE_KEYS } from '../constants/storageKeys'
import { useLocalStorageString, useLocalStorageBoolean, useScreenshot } from '../hooks'

/**
 * GÜVENLİK: CSS Selector Validasyonu
 * 
 * Selector'lar şu an sabit aiSites.js'den geliyor ancak
 * gelecekte dinamikleşirse injection saldırılarını önlemek için
 * katı validasyon uyguluyoruz.
 * 
 * Tehlikeli karakterler: `, `, ${, \, newlines, backticks
 */
const SAFE_SELECTOR_PATTERN = /^[a-zA-Z0-9_\-\.#\[\]="'\s,*:()>+~^$|@]+$/

const validateSelector = (selector) => {
    if (!selector || typeof selector !== 'string') {
        throw new Error('Invalid selector: must be a non-empty string')
    }

    // Maksimum uzunluk kontrolü (DoS önleme)
    if (selector.length > 1000) {
        throw new Error('Invalid selector: too long')
    }

    // Tehlikeli karakterleri kontrol et
    if (!SAFE_SELECTOR_PATTERN.test(selector)) {
        throw new Error(`Invalid selector: contains unsafe characters`)
    }

    // Template literal injection kontrolü
    if (selector.includes('${') || selector.includes('`')) {
        throw new Error('Invalid selector: template injection attempt')
    }

    return selector
}

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
const createWaitForElementScript = (selector, maxWaitMs = 5000, intervalMs = 100) => {
    // GÜVENLİK: Selector validasyonu
    const safeSelector = validateSelector(selector)

    return `
    (async function() {
        const selector = ${JSON.stringify(safeSelector)};
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
}

/**
 * Butonun aktif (enabled) olmasını bekleyen polling fonksiyonu
 * 
 * @param {string} selector - CSS selector
 * @param {number} maxWaitMs - Maksimum bekleme süresi
 * @param {number} intervalMs - Kontrol aralığı
 * @returns {string} - Webview'da çalışacak JavaScript kodu
 */
const createWaitForEnabledButtonScript = (selector, maxWaitMs = 8000, intervalMs = 200) => {
    // GÜVENLİK: Selector validasyonu
    const safeSelector = validateSelector(selector)

    return `
    (async function() {
        const selector = ${JSON.stringify(safeSelector)};
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
}

/**
 * Input elemanına focus yapan ve text ekleyen script
 * Elemanın var olmasını bekler
 */
const createFocusAndInsertScript = (selector) => {
    // GÜVENLİK: Selector validasyonu
    const safeSelector = validateSelector(selector)

    return `
    (async function() {
        const selector = ${JSON.stringify(safeSelector)};
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
}

export function AppProvider({ children }) {
    // AI Seçimi - STORAGE_KEYS sabiti kullanılıyor
    const [currentAI, setCurrentAI] = useLocalStorageString(STORAGE_KEYS.LAST_SELECTED_AI, DEFAULT_AI, VALID_AI_OPTIONS)

    // Otomatik Gönder - STORAGE_KEYS sabiti kullanılıyor
    const [autoSend, setAutoSend, toggleAutoSend] = useLocalStorageBoolean(STORAGE_KEYS.AUTO_SEND_ENABLED, false)

    // Güncelleme State'leri
    const [updateAvailable, setUpdateAvailable] = useState(false)
    const [updateInfo, setUpdateInfo] = useState(null)
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
    const [hasCheckedUpdate, setHasCheckedUpdate] = useState(false) // Kontrol yapıldı mı?

    // Webview ref - AI'ya mesaj göndermek için
    const webviewRef = useRef(null)

    // Güncelleme kontrolü fonksiyonu
    const checkForUpdates = useCallback(async () => {
        if (!window.electronAPI?.checkForUpdates) {
            console.log('[Update] Güncelleme API\'si bulunamadı (dev mode olabilir)')
            setHasCheckedUpdate(true)
            return { available: false }
        }

        setIsCheckingUpdate(true)
        try {
            const result = await window.electronAPI.checkForUpdates()

            // Unmount kontrolü yapılmıyor çünkü bu fonksiyon useCallback ile memoize edilmiş
            // ve component unmount olduğunda zaten çağrılmaz (setTimeout cleanup ile)
            if (result.error) {
                // Hata durumu - updateInfo'ya hata bilgisi kaydet
                setUpdateAvailable(false)
                setUpdateInfo({ error: result.error })
                console.warn('[Update] Kontrol hatası:', result.error)
            } else if (result.available) {
                setUpdateAvailable(true)
                setUpdateInfo(result)
                console.log('[Update] Güncelleme mevcut:', result.version)
            } else {
                setUpdateAvailable(false)
                setUpdateInfo(null)
                console.log('[Update] Uygulama güncel')
            }

            return result
        } catch (error) {
            console.error('[Update] Kontrol hatası:', error)
            setUpdateInfo({ error: error.message })
            return { available: false, error: error.message }
        } finally {
            setIsCheckingUpdate(false)
            setHasCheckedUpdate(true)
        }
    }, [])

    // Uygulama başlangıcında güncelleme kontrolü - tek seferlik
    // 5 saniye gecikme ile çalışır, uygulama yüklenmesini bekler
    useEffect(() => {
        const timer = setTimeout(() => {
            checkForUpdates()
        }, 5000) // 5 saniye sonra kontrol et

        return () => clearTimeout(timer)
    }, [checkForUpdates]) // checkForUpdates useCallback ile memoize edildiği için güvenli


    // AI Sender fonksiyonları
    // TUTARLI DÖNÜŞ TİPİ: Her zaman { success: boolean, error?: string } objesi döner
    const sendTextToAI = useCallback(async (text) => {
        const webview = webviewRef.current
        if (!webview || !text) return { success: false, error: 'invalid_input' }

        try {
            const aiConfig = AI_SITES[currentAI]
            if (!aiConfig) {
                console.error('[sendTextToAI] AI config bulunamadı:', currentAI)
                return { success: false, error: 'config_not_found' }
            }

            const selector = aiConfig.inputSelector

            // 1. Input elemanını bul ve focus yap (polling ile)
            const focusResult = await webview.executeJavaScript(createFocusAndInsertScript(selector))

            if (!focusResult.success) {
                console.error('[sendTextToAI] Input bulunamadı:', focusResult.reason)
                return { success: false, error: 'input_not_found' }
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

            return { success: true }
        } catch (error) {
            // Webview hazır değilse veya DOM-ready olmadan çağrıldıysa bu hatayı alırız
            if (error.message?.includes('not ready') || error.message?.includes('dom-ready')) {
                console.warn('[sendTextToAI] ⚠️ Webview henüz hazır değil:', error.message)
                return { success: false, error: 'webview_not_ready' }
            }
            console.error('[sendTextToAI] ❌ Metin gönderme hatası:', error)
            return { success: false, error: 'unknown_error' }
        }
    }, [currentAI, autoSend])

    // TUTARLI DÖNÜŞ TİPİ: Her zaman { success: boolean, error?: string } objesi döner
    const sendImageToAI = useCallback(async (imageDataUrl) => {
        const webview = webviewRef.current
        if (!webview || !imageDataUrl) return { success: false, error: 'invalid_input' }

        try {
            const aiConfig = AI_SITES[currentAI]
            if (!aiConfig) {
                console.error('[sendImageToAI] AI config bulunamadı:', currentAI)
                return { success: false, error: 'config_not_found' }
            }

            // 1. Görüntüyü sistem clipboard'una kopyala (main process üzerinden)
            const copied = await window.electronAPI?.copyImageToClipboard(imageDataUrl)
            if (!copied) {
                console.error('[sendImageToAI] ❌ Görüntü panoya kopyalanamadı')
                return { success: false, error: 'clipboard_failed' }
            }
            console.log('[sendImageToAI] ✅ Görüntü panoya kopyalandı')

            // 2. Input elemanını bul ve focus yap (polling ile)
            const focusResult = await webview.executeJavaScript(createFocusAndInsertScript(aiConfig.inputSelector))

            if (!focusResult.success) {
                console.error('[sendImageToAI] ❌ Input bulunamadı:', focusResult.reason)
                return { success: false, error: 'input_not_found' }
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

            return { success: true }
        } catch (error) {
            // Webview hazır değilse veya DOM-ready olmadan çağrıldıysa bu hatayı alırız
            if (error.message?.includes('not ready') || error.message?.includes('dom-ready')) {
                console.warn('[sendImageToAI] ⚠️ Webview henüz hazır değil:', error.message)
                return { success: false, error: 'webview_not_ready' }
            }
            console.error('[sendImageToAI] ❌ Görüntü gönderme hatası:', error)
            return { success: false, error: 'unknown_error' }
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
        handleCapture,

        // Güncelleme
        updateAvailable,
        updateInfo,
        isCheckingUpdate,
        hasCheckedUpdate,
        checkForUpdates
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
        handleCapture,
        updateAvailable,
        updateInfo,
        isCheckingUpdate,
        hasCheckedUpdate,
        checkForUpdates
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
