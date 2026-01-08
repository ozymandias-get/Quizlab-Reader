import React, { forwardRef, useState, useEffect, useImperativeHandle, useRef, useCallback } from 'react'

/**
 * AI Webview Bileşeni
 * 
 * Her AI platformu için ayrı webview oluşturur ve CSS ile gizler/gösterir.
 * Bu sayede kullanıcı AI'lar arasında geçiş yaptığında oturum ve sohbet geçmişi korunur.
 * 
 * @param {string} currentAI - Aktif AI platform ID'si ('chatgpt' | 'gemini')
 * @param {Object} aiSites - AI platform yapılandırmaları
 */
const AiWebview = forwardRef(({ currentAI, aiSites }, ref) => {
    // Her AI platformu için ayrı ref
    const webviewRefs = useRef({})

    // Her AI için ayrı loading ve error state'leri
    const [loadingStates, setLoadingStates] = useState({})
    const [errorStates, setErrorStates] = useState({})

    // Hangi webview'ların initialize edildiğini takip et (lazy loading)
    const [initializedWebviews, setInitializedWebviews] = useState(new Set())

    // Aktif webview'ı ref olarak expose et (executeJavaScript için)
    useImperativeHandle(ref, () => ({
        executeJavaScript: (script) => {
            const activeWebview = webviewRefs.current[currentAI]
            if (activeWebview) {
                return activeWebview.executeJavaScript(script)
            }
            return Promise.reject(new Error('Webview not ready'))
        },
        // Aktif webview'ı doğrudan al
        getActiveWebview: () => webviewRefs.current[currentAI],
        // Belirli bir AI'ın webview'ını al
        getWebview: (aiId) => webviewRefs.current[aiId]
    }), [currentAI])

    // currentAI değiştiğinde, o webview'ı initialize et (lazy loading)
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
                event.preventDefault()
                const webview = webviewRefs.current[aiId]
                if (webview) {
                    webview.src = event.url
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
                        console.log('[AiWebview] Harici link sistem tarayıcısında açılıyor:', event.url)
                        window.electronAPI?.openExternal?.(event.url)
                    }
                } catch (error) {
                    console.warn('[AiWebview] will-navigate URL parse hatası:', error)
                }
            }
        }
    }, [aiSites])

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
                            flexDirection: 'column'
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
})

AiWebview.displayName = 'AiWebview'

export default AiWebview
