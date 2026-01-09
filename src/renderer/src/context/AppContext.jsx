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
 */
const AppContext = createContext(null)

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
            // Input'a text ekle
            const aiConfig = AI_SITES[currentAI]
            if (!aiConfig) return false

            const selector = aiConfig.inputSelector
            // 1. Input'a focus yap
            await webview.executeJavaScript(`
                (function() {
                    const input = document.querySelector('${selector}');
                    if (input) {
                        input.focus();
                        // İçeriği temizle (opsiyonel, yeni sohbet gibi davranması için)
                        // input.value = ''; 
                        return true;
                    }
                    return false;
                })()
            `)

            // 2. Native olarak metni yaz (Klavye simülasyonu)
            // Bu yöntem React/Vue state'lerini %100 günceller
            try {
                await webview.insertText(text)
            } catch (err) {
                console.warn('[sendTextToAI] Native insertText başarısız, fallback deneniyor:', err)
                // Fallback: execCommand
                await webview.executeJavaScript(`document.execCommand('insertText', false, ${JSON.stringify(text)})`)
            }

            // 3. Otomatik gönder
            if (autoSend && aiConfig.sendButtonSelector) {
                // UI state'inin güncellenmesi için kısa bir bekleme
                await new Promise(resolve => setTimeout(resolve, 300))

                await webview.executeJavaScript(`
                    (function() {
                        const btn = document.querySelector('${aiConfig.sendButtonSelector}');
                        if (btn && !btn.disabled && btn.getAttribute('aria-disabled') !== 'true') {
                            btn.click();
                            return true;
                        }
                        return false;
                    })()
                `)
            }
            return true
        } catch (error) {
            console.error('Metin gönderme hatası:', error)
            return false
        }
    }, [currentAI, autoSend])

    const sendImageToAI = useCallback(async (imageDataUrl) => {
        const webview = webviewRef.current
        if (!webview || !imageDataUrl) return false

        try {
            const aiConfig = AI_SITES[currentAI]
            if (!aiConfig) return false

            // 1. Görüntüyü sistem clipboard'una kopyala (main process üzerinden)
            const copied = await window.electronAPI?.copyImageToClipboard(imageDataUrl)
            if (!copied) {
                console.error('[sendImageToAI] Görüntü panoya kopyalanamadı')
                return false
            }

            // 2. Clipboard işleminin tamamlanması için bekle (Race Condition Fix)
            await new Promise(resolve => setTimeout(resolve, 300))

            // 3. Webview'da input'a focus yap
            await webview.executeJavaScript(`
                (function() {
                    const input = document.querySelector('${aiConfig.inputSelector}');
                    if (input) {
                        input.focus();
                        return true;
                    }
                    return false;
                })()
            `)

            // 3. Klavye kısayolu ile yapıştır (Ctrl+V / Cmd+V)
            // execCommand('paste') güvenilir değil, native event gönderiyoruz
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
            }

            // 4. Otomatik gönder aktifse, gönder butonuna tıkla
            if (autoSend && aiConfig.sendButtonSelector) {
                // Resmin yüklenmesi için daha uzun bekle ve retry mekanizması ekle
                // Çoğu durumda görüntü 1500-3000ms içinde yüklenir
                let sent = false
                const maxRetries = 5
                const retryDelay = 800 // Her retry arasında 800ms

                for (let i = 0; i < maxRetries && !sent; i++) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay))

                    sent = await webview.executeJavaScript(`
                        (function() {
                            const btn = document.querySelector('${aiConfig.sendButtonSelector}');
                            if (btn) {
                                // Buton disabled değilse ve tıklanabilirse tıkla
                                const isDisabled = btn.disabled || 
                                                   btn.getAttribute('aria-disabled') === 'true' ||
                                                   btn.classList.contains('disabled');
                                if (!isDisabled) {
                                    btn.click();
                                    return true;
                                }
                            }
                            return false;
                        })()
                    `)

                    if (sent) {
                        console.log('[sendImageToAI] Görüntü gönderildi, retry:', i)
                    }
                }

                if (!sent) {
                    console.warn('[sendImageToAI] Otomatik gönderme başarısız - buton hala disabled olabilir')
                }
            }

            return true
        } catch (error) {
            console.error('Görüntü gönderme hatası:', error)
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
