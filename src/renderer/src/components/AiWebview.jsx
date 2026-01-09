import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { useLanguage } from '../context/LanguageContext'

/**
 * AI Webview Bileşeni
 * 
 * Her AI platformu için ayrı webview oluşturur ve CSS ile gizler/gösterir.
 * Bu sayede kullanıcı AI'lar arasında geçiş yaptığında oturum ve sohbet geçmişi korunur.
 * 
 * Context'ten global state'e erişir - prop drilling yok
 * 
 * FOUC ÖNLEMİ:
 * - initializedWebviews lazy initialize edilir (currentAI ile başlar)
 * - İlk render'da aktif AI'ın webview'ı hemen oluşturulur
 * - Titreme/flash yaşanmaz
 */
function AiWebview({ isResizing }) {
    // Context'ten global state'e eriş
    const { currentAI, aiSites, webviewRef } = useApp()
    const { showError, showWarning } = useToast()
    const { t } = useLanguage()

    // Her AI platformu için ayrı ref
    const webviewRefs = useRef({})

    // Crash recovery için retry sayacı
    const crashRetryCount = useRef({})

    // Her AI için ayrı loading ve error state'leri
    const [loadingStates, setLoadingStates] = useState({})
    const [errorStates, setErrorStates] = useState({})

    // Hangi webview'ların initialize edildiğini takip et (lazy loading)
    // FOUC ÖNLEMİ: currentAI ile lazy initialize et - ilk render'da doğru webview gösterilir
    const [initializedWebviews, setInitializedWebviews] = useState(() => {
        // İlk render'da currentAI zaten mevcut (localStorage'dan lazy init edilmiş)
        // Hemen bu AI'ın webview'ını oluştur
        return currentAI ? new Set([currentAI]) : new Set()
    })

    // Aktif webview'ı context'teki webviewRef'e bağla
    useEffect(() => {
        if (webviewRef) {
            // webviewRef'e aktif webview'ın metodlarını expose et
            webviewRef.current = {
                executeJavaScript: (script) => {
                    const activeWebview = webviewRefs.current[currentAI]
                    if (activeWebview) {
                        return activeWebview.executeJavaScript(script)
                    }
                    return Promise.reject(new Error('Webview not ready'))
                },
                getActiveWebview: () => webviewRefs.current[currentAI],
                getWebview: (aiId) => webviewRefs.current[aiId],
                insertText: (text) => {
                    const activeWebview = webviewRefs.current[currentAI]
                    if (activeWebview && activeWebview.insertText) {
                        return activeWebview.insertText(text)
                    }
                    return Promise.reject(new Error('Webview insertText not supported or webview not ready'))
                }
            }
        }
    }, [currentAI, webviewRef])

    // currentAI değiştiğinde, o webview'ı initialize et (lazy loading)
    // Not: İlk render'da currentAI zaten Set içinde olduğu için bu effect çalışmaz
    useEffect(() => {
        if (currentAI && !initializedWebviews.has(currentAI)) {
            setInitializedWebviews(prev => new Set([...prev, currentAI]))
        }
    }, [currentAI, initializedWebviews])

    // Webview event handler'ları oluştur
    const createEventHandlers = useCallback((aiId) => {
        // AI sitesinin hostname'ini al (will-navigate kontrolü için)
        const siteUrl = aiSites[aiId]?.url
        let siteHostname = ''
        try {
            siteHostname = new URL(siteUrl).hostname
        } catch (e) {
            console.warn('[AiWebview] URL parse hatası:', siteUrl)
        }

        return {
            handleStartLoading: () => {
                setLoadingStates(prev => ({ ...prev, [aiId]: true }))
                setErrorStates(prev => ({ ...prev, [aiId]: null }))
            },
            handleStopLoading: () => {
                setLoadingStates(prev => ({ ...prev, [aiId]: false }))
            },
            handleFailLoad: (event) => {
                setLoadingStates(prev => ({ ...prev, [aiId]: false }))
                if (event.errorCode !== -3) { // -3 = Aborted (normal)
                    setErrorStates(prev => ({
                        ...prev,
                        [aiId]: event.errorDescription || 'Sayfa yüklenemedi'
                    }))
                }
            },
            handleNewWindow: (event) => {
                // Akıllı Pop-up Yönetimi
                // Varsayılan: Pop-up'lara izin ver (Google Login, Apple Sign-in vb. için)

                // URL kontrolü
                try {
                    const targetUrl = new URL(event.url)
                    const targetHostname = targetUrl.hostname

                    // 1. Auth/Login sayfaları ise KESİNLİKLE izin ver (Electron native popup açsın)
                    const isAuthPage =
                        targetHostname.includes('accounts.google.com') ||
                        targetHostname.includes('appleid.apple.com') ||
                        targetHostname.includes('auth') ||
                        targetHostname.includes('login') ||
                        targetHostname.includes('signin') ||
                        targetHostname.includes('oauth')

                    if (isAuthPage || event.disposition === 'new-window') {
                        // event.preventDefault() YAPMA - Bırak açılsın
                        return
                    }

                    // 2. Harici bir kaynak referansı ise sistem tarayıcıda aç
                    // (Zaten will-navigate bunu yapıyor ama new-window da yakalayabilir)
                    const isExternal = !targetHostname.includes(siteHostname) &&
                        !targetHostname.endsWith('.' + siteHostname) &&
                        !siteHostname.endsWith('.' + targetHostname)

                    if (isExternal) {
                        event.preventDefault()
                        window.electronAPI?.openExternal?.(event.url)
                    }
                } catch (err) {
                    // Hata durumunda güvenli davran, popup açma
                    event.preventDefault()
                    console.warn('[AiWebview] New window URL parse hatası:', err)
                }
            },
            // will-navigate: Harici linkleri sistem tarayıcısında aç
            // Bu, kullanıcının "Help", "Terms" gibi linklere tıkladığında
            // AI arayüzünden çıkıp sıkışmasını önler
            handleWillNavigate: (event) => {
                try {
                    const targetUrl = new URL(event.url)
                    const targetHostname = targetUrl.hostname

                    // Sadece http/https protokollerini kontrol et
                    if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
                        return
                    }

                    // Aynı domain ise (veya subdomain) izin ver
                    // Örn: chatgpt.com, auth.openai.com gibi
                    const isInternalLink =
                        targetHostname === siteHostname ||
                        targetHostname.endsWith('.' + siteHostname) ||
                        siteHostname.endsWith('.' + targetHostname) ||
                        // ChatGPT için özel: openai.com domaini
                        (siteHostname.includes('chatgpt') && targetHostname.includes('openai')) ||
                        (siteHostname.includes('openai') && targetHostname.includes('chatgpt')) ||
                        // Gemini için özel: google.com subdomainleri
                        (siteHostname.includes('google') && targetHostname.includes('google'))

                    if (!isInternalLink) {
                        // Harici link - navigasyonu engelle ve sistem tarayıcısında aç
                        event.preventDefault()

                        window.electronAPI?.openExternal?.(event.url)
                    }
                } catch (error) {
                    console.warn('[AiWebview] will-navigate URL parse hatası:', error)
                }
            },
            // Webview process çöktüğünde (bellek şişmesi, GPU hatası vb.)
            handleCrashed: () => {
                console.error('[AiWebview] Webview çöktü:', aiId)
                setLoadingStates(prev => ({ ...prev, [aiId]: false }))

                // Retry sayacını kontrol et
                const retries = crashRetryCount.current[aiId] || 0

                if (retries < 3) {
                    // Otomatik reload dene
                    crashRetryCount.current[aiId] = retries + 1
                    showWarning(t('webview_crashed_retrying') || `${aiSites[aiId]?.displayName || 'AI'} çöktü, yeniden yükleniyor...`)

                    // Kısa gecikme ile reload
                    setTimeout(() => {
                        const webview = webviewRefs.current[aiId]
                        if (webview) {
                            webview.reload()
                        }
                    }, 1000)
                } else {
                    // Çok fazla çökme - kullanıcıya hata göster
                    setErrorStates(prev => ({
                        ...prev,
                        [aiId]: t('webview_crashed_max') || 'Sayfa sürekli çöküyor. Lütfen uygulamayı yeniden başlatın.'
                    }))
                    showError(t('webview_crashed_max') || `${aiSites[aiId]?.displayName || 'AI'} sürekli çöküyor`)
                }
            },
            // Webview yanıt vermiyor (donma)
            handleUnresponsive: () => {
                console.warn('[AiWebview] Webview yanıt vermiyor:', aiId)
                showWarning(t('webview_unresponsive') || `${aiSites[aiId]?.displayName || 'AI'} yanıt vermiyor...`)
            },
            // Webview tekrar yanıt vermeye başladı
            handleResponsive: () => {

                // Crash retry sayacını sıfırla
                crashRetryCount.current[aiId] = 0
            }
        }
    }, [aiSites, showError, showWarning, t])

    // Webview ref callback - event listener'ları bağla
    const setWebviewRef = useCallback((aiId) => (element) => {
        if (element && !webviewRefs.current[aiId]) {
            webviewRefs.current[aiId] = element

            const handlers = createEventHandlers(aiId)

            element.addEventListener('did-start-loading', handlers.handleStartLoading)
            element.addEventListener('did-stop-loading', handlers.handleStopLoading)
            element.addEventListener('did-fail-load', handlers.handleFailLoad)
            element.addEventListener('new-window', handlers.handleNewWindow)
            element.addEventListener('will-navigate', handlers.handleWillNavigate)
            // Crash recovery event'leri
            element.addEventListener('crashed', handlers.handleCrashed)
            element.addEventListener('render-process-gone', handlers.handleCrashed) // Electron 11+ için
            element.addEventListener('unresponsive', handlers.handleUnresponsive)
            element.addEventListener('responsive', handlers.handleResponsive)

            // Cleanup için handler'ları sakla
            element._eventHandlers = handlers
        }
    }, [createEventHandlers])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            Object.values(webviewRefs.current).forEach(webview => {
                if (webview && webview._eventHandlers) {
                    const handlers = webview._eventHandlers
                    webview.removeEventListener('did-start-loading', handlers.handleStartLoading)
                    webview.removeEventListener('did-stop-loading', handlers.handleStopLoading)
                    webview.removeEventListener('did-fail-load', handlers.handleFailLoad)
                    webview.removeEventListener('new-window', handlers.handleNewWindow)
                    webview.removeEventListener('will-navigate', handlers.handleWillNavigate)
                    // Crash recovery event'leri
                    webview.removeEventListener('crashed', handlers.handleCrashed)
                    webview.removeEventListener('render-process-gone', handlers.handleCrashed)
                    webview.removeEventListener('unresponsive', handlers.handleUnresponsive)
                    webview.removeEventListener('responsive', handlers.handleResponsive)
                }
            })
        }
    }, [])

    const handleRetry = (aiId) => {
        setErrorStates(prev => ({ ...prev, [aiId]: null }))
        const webview = webviewRefs.current[aiId]
        if (webview) {
            webview.reload()
        }
    }

    // AI platformlarının listesi
    const aiPlatforms = Object.keys(aiSites)

    return (
        <>
            {/* Her AI platformu için ayrı container */}
            {aiPlatforms.map(aiId => {
                const isActive = currentAI === aiId
                const isInitialized = initializedWebviews.has(aiId)
                const isLoading = loadingStates[aiId]
                const error = errorStates[aiId]
                const siteConfig = aiSites[aiId]

                // Lazy loading: Sadece initialize edilmiş webview'ları render et
                if (!isInitialized) {
                    return null
                }

                return (
                    <div
                        key={aiId}
                        className="flex-1 relative overflow-hidden bg-stone-950/30 m-3 rounded-[1.5rem]"
                        style={{
                            // Aktif olmayan webview'ları CSS ile gizle (DOM'dan silme!)
                            display: isActive ? 'flex' : 'none',
                            flexDirection: 'column',
                            // Resizing sırasında pointer event'lerini kapat (Mouse trap fix)
                            pointerEvents: isResizing ? 'none' : 'auto'
                        }}
                    >
                        <webview
                            ref={setWebviewRef(aiId)}
                            src={siteConfig?.url || 'about:blank'}
                            partition="persist:ai_session"
                            className="absolute inset-0 w-full h-full rounded-[1.5rem]"
                            allowpopups="true"
                            useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                        />

                        {/* Loading Overlay */}
                        {isLoading && (
                            <div className="absolute inset-0 bg-stone-900/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 text-stone-400 text-sm rounded-[1.5rem] z-10">
                                <div className="loader" />
                                <span>{siteConfig?.displayName || 'AI'} yükleniyor...</span>
                            </div>
                        )}

                        {/* Error Overlay */}
                        {error && (
                            <div className="absolute inset-0 bg-stone-900/95 backdrop-blur-sm flex items-center justify-center rounded-[1.5rem] z-10">
                                <div className="flex flex-col items-center text-center gap-5 p-10 max-w-xs">
                                    <svg className="text-red-400/80" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 8v4" />
                                        <circle cx="12" cy="16" r="0.5" fill="currentColor" />
                                    </svg>
                                    <h3 className="font-display text-xl font-semibold text-stone-200">
                                        {siteConfig?.displayName || 'AI'} Bağlantı Hatası
                                    </h3>
                                    <p className="text-stone-500 text-sm leading-relaxed">{error}</p>
                                    <button
                                        className="btn-secondary flex items-center gap-2 mt-2"
                                        onClick={() => handleRetry(aiId)}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M23 4v6h-6" />
                                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                                        </svg>
                                        <span>Tekrar Dene</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )
            })}
        </>
    )
}

export default AiWebview
