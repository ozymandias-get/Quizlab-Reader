import React, { forwardRef, useState, useEffect, useImperativeHandle, useRef } from 'react'

const AiWebview = forwardRef(({ currentAI, aiSites }, ref) => {
    const webviewRef = useRef(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)

    // Ref'i expose et (executeJavaScript için)
    useImperativeHandle(ref, () => ({
        executeJavaScript: (script) => {
            if (webviewRef.current) {
                return webviewRef.current.executeJavaScript(script)
            }
            return Promise.reject(new Error('Webview not ready'))
        }
    }))

    // AI değişikliğinde URL güncelle
    useEffect(() => {
        if (webviewRef.current && aiSites[currentAI]) {
            webviewRef.current.src = aiSites[currentAI].url
        }
    }, [currentAI, aiSites])

    // Webview event listener'ları
    useEffect(() => {
        const webview = webviewRef.current
        if (!webview) return

        const handleStartLoading = () => {
            setIsLoading(true)
            setError(null)
        }

        const handleStopLoading = () => {
            setIsLoading(false)
        }

        const handleFailLoad = (event) => {
            setIsLoading(false)
            if (event.errorCode !== -3) {
                setError(event.errorDescription || 'Sayfa yüklenemedi')
            }
        }

        const handleNewWindow = (event) => {
            event.preventDefault()
            webview.src = event.url
        }

        webview.addEventListener('did-start-loading', handleStartLoading)
        webview.addEventListener('did-stop-loading', handleStopLoading)
        webview.addEventListener('did-fail-load', handleFailLoad)
        webview.addEventListener('new-window', handleNewWindow)

        return () => {
            webview.removeEventListener('did-start-loading', handleStartLoading)
            webview.removeEventListener('did-stop-loading', handleStopLoading)
            webview.removeEventListener('did-fail-load', handleFailLoad)
            webview.removeEventListener('new-window', handleNewWindow)
        }
    }, [currentAI])

    const handleRetry = () => {
        setError(null)
        if (webviewRef.current) {
            webviewRef.current.reload()
        }
    }

    return (
        <>
            {/* Webview Container */}
            <div className="flex-1 relative overflow-hidden bg-stone-950/30 m-3 rounded-[1.5rem]">
                <webview
                    ref={webviewRef}
                    src={aiSites[currentAI]?.url || 'https://chatgpt.com'}
                    partition="persist:ai_session"
                    className="absolute inset-0 w-full h-full rounded-[1.5rem]"
                    allowpopups="true"
                    useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                />

                {/* Loading Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-stone-900/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 text-stone-400 text-sm rounded-[1.5rem]">
                        <div className="loader" />
                        <span>Yükleniyor...</span>
                    </div>
                )}

                {/* Error Overlay */}
                {error && (
                    <div className="absolute inset-0 bg-stone-900/95 backdrop-blur-sm flex items-center justify-center rounded-[1.5rem]">
                        <div className="flex flex-col items-center text-center gap-5 p-10 max-w-xs">
                            <svg className="text-red-400/80" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 8v4" />
                                <circle cx="12" cy="16" r="0.5" fill="currentColor" />
                            </svg>
                            <h3 className="font-display text-xl font-semibold text-stone-200">Bağlantı Hatası</h3>
                            <p className="text-stone-500 text-sm leading-relaxed">{error}</p>
                            <button className="btn-secondary flex items-center gap-2 mt-2" onClick={handleRetry}>
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
        </>
    )
})

AiWebview.displayName = 'AiWebview'

export default AiWebview
