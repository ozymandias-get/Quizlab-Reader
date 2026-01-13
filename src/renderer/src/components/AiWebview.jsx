import React, { useState, useEffect, useRef, useCallback, memo } from 'react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { useLanguage } from '../context/LanguageContext'
import { isAllowedNavigation, isAuthDomain, CHROME_USER_AGENT } from '../constants/aiSites'
import CookieImportModal from './CookieImportModal'

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
 * 
 * GOOGLE LOGIN:
 * - Login yoksa "Google ile Giriş Yap" butonu gösterilir
 * - Login popup açılır ve başarılı olunca webview otomatik yenilenir
 */
function AiWebview({ isResizing }) {
    // Context'ten global state'e eriş
    const { currentAI, aiSites, webviewRef } = useApp()
    const { showError, showWarning, showSuccess } = useToast()
    const { t } = useLanguage()

    // Her AI platformu için ayrı ref
    const webviewRefs = useRef({})

    // Crash recovery için retry sayacı
    const crashRetryCount = useRef({})

    // setTimeout cleanup için ref
    const timeoutRefs = useRef({})

    // Her AI için ayrı loading ve error state'leri
    const [loadingStates, setLoadingStates] = useState({})
    const [errorStates, setErrorStates] = useState({})

    // Her AI için login durumu (cookie var mı?)
    const [loginStates, setLoginStates] = useState({}) // { gemini: true/false, chatgpt: true/false }

    // Aktif partition - her profil için ayrı depolama alanı
    const [currentPartition, setCurrentPartition] = useState('persist:ai_session')

    // Hangi webview'ların initialize edildiğini takip et (lazy loading)
    // FOUC ÖNLEMİ: currentAI ile lazy initialize et - ilk render'da doğru webview gösterilir
    const [initializedWebviews, setInitializedWebviews] = useState(() => {
        // İlk render'da currentAI zaten mevcut (localStorage'dan lazy init edilmiş)
        // Hemen bu AI'ın webview'ını oluştur
        return currentAI ? new Set([currentAI]) : new Set()
    })

    // Login durumlarını ve aktif profili kontrol et
    // ChatGPT cookie olmadan da çalışır, Plus özellikleri için login gerekebilir ama zorunlu değil
    useEffect(() => {
        const initializeSession = async () => {
            let profileData = null

            try {
                if (window.electronAPI?.getProfiles) {
                    profileData = await window.electronAPI.getProfiles()

                    if (profileData?.success && profileData.activeProfileId) {
                        // Güvenlik: activeProfileId sanitize kontrolü (server'dan geldiği için güvenli ama yine de kontrol)
                        const activeId = String(profileData.activeProfileId).replace(/[^a-zA-Z0-9_-]/g, '')
                        if (!activeId) {
                            console.warn('[AiWebview] Geçersiz activeProfileId, varsayılan partition kullanılıyor')
                            return
                        }
                        const partition = `persist:profile_${activeId}`
                        setCurrentPartition(partition)
                        console.log('[AiWebview] Aktif partition:', partition)

                        const activeProfile = profileData.profiles.find(p => p.id === profileData.activeProfileId)
                        if (activeProfile?.target) {
                            setLoginStates(prev => ({ ...prev, [activeProfile.target]: true }))
                        }
                    }
                }
            } catch (e) {
                console.warn('[AiWebview] Profil bilgisi alınamadı:', e)
            }

            // Race condition check: Startup restore tamamlandı mı?
            // Eğer biz mount olmadan önce restore bittiyse event'i kaçırmış olabiliriz.
            try {
                if (window.electronAPI?.getStartupStatus) {
                    const status = await window.electronAPI.getStartupStatus()
                    if (status && status.complete && status.success) {
                        console.log('[AiWebview] Startup restore zaten tamamlanmış:', status)

                        // Profil bilgisi önceden alınamadıysa tekrar dene
                        if (!profileData && window.electronAPI?.getProfiles) {
                            profileData = await window.electronAPI.getProfiles()
                        }

                        if (profileData?.success && profileData.activeProfileId) {
                            const activeProfile = profileData.profiles.find(p => p.id === profileData.activeProfileId)
                            if (activeProfile?.target) {
                                console.log('[AiWebview] Login state güncelleniyor (startup check):', activeProfile.target)
                                setLoginStates(prev => ({ ...prev, [activeProfile.target]: true }))
                            }
                        }
                    }
                }
            } catch (e) {
                console.warn('[AiWebview] Startup status alınamadı:', e)
            }
        }
        initializeSession()
    }, [])

    // Cookie değişikliklerini dinle (sıfırlama veya import sonrası)
    useEffect(() => {
        const handleCookiesChanged = (event) => {
            const { action } = event.detail || {}

            if (action === 'reset' || action === 'profile-deleted') {
                const { partition, wasActiveProfile } = event.detail || {}

                // Profil silindiyse ve aktif profil değilse - login state değiştirme
                if (action === 'profile-deleted' && wasActiveProfile === false) {
                    console.log('[AiWebview] Aktif olmayan profil silindi, login state değiştirilmedi')
                    return
                }

                // Cookie'ler sıfırlandı veya AKTİF profil silindi - login durumunu false yap
                // NOT: Boş obje {} yerine false kullanarak overlay gösterilmesini sağlıyoruz
                setLoginStates({ gemini: false, chatgpt: false })

                // Partition güncelle
                if (partition) {
                    setCurrentPartition(partition)
                    console.log('[AiWebview] Partition güncellendi (reset/delete):', partition)
                } else if (action === 'reset') {
                    // Cookie sıfırlandıysa default partition'a dön
                    setCurrentPartition('persist:ai_session')
                }

                // Tüm webview'ları yeniden yükle (yeni partition ile)
                console.log('[AiWebview] Reset sonrası tüm webview\'lar yeniden yükleniyor...')
                Object.keys(webviewRefs.current).forEach(aiId => {
                    const webview = webviewRefs.current[aiId]
                    if (webview && typeof webview.reload === 'function') {
                        try {
                            webview.reload()
                            console.log(`[AiWebview] ${aiId} webview reloaded`)
                        } catch (e) {
                            console.warn('[AiWebview] Reload hatası:', aiId, e)
                        }
                    }
                })
            } else if (action === 'import' || action === 'profile-created') {
                // Profil oluşturuldu veya import edildi
                const { partition, target } = event.detail || {}

                // Partition bilgisi varsa güncelle - React key değişince webview yeniden mount olur
                if (partition) {
                    console.log('[AiWebview] Partition güncellendi (create/import):', partition, 'target:', target)
                    setCurrentPartition(partition)
                    // Login durumunu güncelle - sadece target belirtilmişse
                    if (target) {
                        setLoginStates(prev => ({ ...prev, [target]: true }))
                    } else {
                        // Target bilinmiyorsa - varsayılan davranış yok, yanlış login state'i önlensin
                        console.warn('[AiWebview] Profile oluşturuldu ama target belirtilmedi - login state güncellenmedi')
                    }
                } else {
                    // Partition yoksa sadece login durumunu güncelle ve reload yap (legacy)
                    if (target) {
                        setLoginStates(prev => ({ ...prev, [target]: true }))
                        const webview = webviewRefs.current[target]
                        if (webview && typeof webview.reload === 'function') {
                            try {
                                webview.reload()
                            } catch (e) {
                                console.warn('[AiWebview] Reload hatası:', target, e)
                            }
                        }
                    } else {
                        // Target ve partition bilinmiyorsa - varsayılan davranış yok
                        console.warn('[AiWebview] Profile oluşturuldu ama target ve partition belirtilmedi')
                    }
                }
            } else if (action === 'profile-switch') {
                // Profile geçildi - partition'ı güncelle
                const { partition, profileId, sessionExpired } = event.detail || {}

                if (partition) {
                    console.log('[AiWebview] Profile geçildi, yeni partition:', partition, 'sessionExpired:', sessionExpired)
                    setCurrentPartition(partition)

                    // Oturum süresi dolmuşsa hemen login overlay göster
                    if (sessionExpired) {
                        setLoginStates({ gemini: false, chatgpt: false })
                    } else {
                        // Login durumunu undefined yap - overlay gösterilmeyecek
                        setLoginStates({})
                    }
                } else if (profileId) {
                    // Partition bilgisi yoksa profileId'den oluştur
                    // Güvenlik: profileId sanitize kontrolü
                    const sanitizedId = String(profileId).replace(/[^a-zA-Z0-9_-]/g, '')
                    if (!sanitizedId) {
                        console.warn('[AiWebview] Geçersiz profileId, varsayılan partition kullanılıyor')
                        return
                    }
                    const newPartition = `persist:profile_${sanitizedId}`
                    console.log('[AiWebview] Profile geçildi (id\' den türetildi):', newPartition)
                    setCurrentPartition(newPartition)
                    setLoginStates({})
                }

                // Oturum süresi dolmamışsa login durumlarını kontrol et
                if (!sessionExpired) {
                    // Önceki timeout'u temizle
                    if (timeoutRefs.current['checkGoogleLogin']) {
                        clearTimeout(timeoutRefs.current['checkGoogleLogin'])
                    }

                    timeoutRefs.current['checkGoogleLogin'] = setTimeout(async () => {
                        if (window.electronAPI?.checkGoogleLogin) {
                            const googleResult = await window.electronAPI.checkGoogleLogin()
                            setLoginStates(prev => ({
                                ...prev,
                                gemini: googleResult.loggedIn
                            }))
                        }
                        timeoutRefs.current['checkGoogleLogin'] = null
                    }, 500) // Biraz daha uzun bekle (partition switch ve cookie yükleme için)
                }
            }
        }

        window.addEventListener('cookies-changed', handleCookiesChanged)
        return () => {
            window.removeEventListener('cookies-changed', handleCookiesChanged)
            // Tüm timeout'ları temizle
            Object.values(timeoutRefs.current).forEach(timeoutId => {
                if (timeoutId) clearTimeout(timeoutId)
            })
            timeoutRefs.current = {}
        }
    }, [])

    // Oturum süresi dolduğunda main process'ten gelen bildirimi dinle
    useEffect(() => {
        if (!window.electronAPI?.onSessionExpired) return

        const cleanup = window.electronAPI.onSessionExpired((data) => {
            console.log('[AiWebview] Session expired event alındı:', data)

            // Login overlay'ı göster
            setLoginStates({ gemini: false, chatgpt: false })

            // Default partition'a dön
            setCurrentPartition('persist:ai_session')

            // Kullanıcıya bildir - action'a göre farklı mesaj
            if (data.profileName) {
                if (data.action === 'profile-deleted') {
                    showWarning(`"${data.profileName}" profilinin oturumu sona erdi ve silindi. Lütfen yeniden giriş yapın.`)
                } else {
                    showWarning(`"${data.profileName}" profilinin oturumu sona erdi. Lütfen tekrar giriş yapın.`)
                }
            }

            // cookies-changed eventi dispatch et - ayarlar panelini güncelle
            window.dispatchEvent(new CustomEvent('cookies-changed', {
                detail: {
                    action: 'profile-deleted',
                    wasActiveProfile: true,
                    partition: 'persist:ai_session'
                }
            }))
        })

        return cleanup
    }, [showWarning])

    // Cookie restore tamamlandığında (Startup)
    useEffect(() => {
        if (!window.electronAPI?.onCookiesRestored) return

        let isMounted = true // Unmount kontrolü için flag
        let timeoutId = null

        const cleanup = window.electronAPI.onCookiesRestored(async (data) => {
            if (!isMounted) return // Component unmount olduysa dur

            console.log('[AiWebview] Cookies restored event alındı:', data)
            const { target } = data

            // Target belirtilmişse login durumunu güncelle
            if (target && isMounted) {
                setLoginStates(prev => ({ ...prev, [target]: true }))
            }

            // Webview'ları reload et (cookie'lerin geçerli olması için)
            // Kısa bir gecikme ile reload yap (partition persistence için)
            timeoutId = setTimeout(() => {
                if (!isMounted) return // Component unmount olduysa dur

                Object.keys(webviewRefs.current).forEach(aiId => {
                    const webview = webviewRefs.current[aiId]
                    if (webview && typeof webview.reload === 'function') {
                        webview.reload()
                        console.log(`[AiWebview] Restore sonrası reload: ${aiId}`)
                    }
                })

                // Login durumunu tekrar teyit et (özellikle Gemini için)
                if (isMounted && window.electronAPI?.checkGoogleLogin) {
                    window.electronAPI.checkGoogleLogin().then(res => {
                        if (isMounted) {
                            setLoginStates(prev => ({ ...prev, gemini: res.loggedIn }))
                        }
                    })
                }
            }, 500)
        })

        return () => {
            isMounted = false // Cleanup: unmount flag'i
            if (timeoutId) clearTimeout(timeoutId)
            if (cleanup) cleanup()
        }
    }, [])

    // Cookie import modal state
    const [showCookieModal, setShowCookieModal] = useState(false)
    const [cookieModalTarget, setCookieModalTarget] = useState(null) // 'gemini' veya 'chatgpt'

    // Cookie modal'ını aç
    const openCookieModal = useCallback((aiId) => {
        setCookieModalTarget(aiId)
        setShowCookieModal(true)
    }, [])

    // Cookie import başarılı olduğunda
    const handleCookieImportSuccess = useCallback((result) => {
        showSuccess(`"${result.profile?.name || 'Profil'}" oluşturuldu!`)
        console.log('[AiWebview] Profil oluşturuldu, partition:', result.partition)
    }, [showSuccess])


    // Aktif webview'ı context'teki webviewRef'e bağla
    useEffect(() => {
        if (webviewRef) {
            // webviewRef'e aktif webview'ın metodlarını expose et
            webviewRef.current = {
                executeJavaScript: (script) => {
                    const activeWebview = webviewRefs.current[currentAI]

                    if (!activeWebview) {
                        console.warn('[AiWebview] executeJavaScript: Webview bulunamadı', { currentAI })
                        return Promise.reject(new Error('Webview not ready - please wait for the page to load'))
                    }

                    // Doğrudan webview metodunu çağır, hata olursa yakalanır
                    return activeWebview.executeJavaScript(script)
                },
                getActiveWebview: () => webviewRefs.current[currentAI],
                getWebview: (aiId) => webviewRefs.current[aiId],
                insertText: (text) => {
                    const activeWebview = webviewRefs.current[currentAI]

                    if (!activeWebview || !activeWebview.insertText) {
                        return Promise.reject(new Error('Webview insertText not supported or webview not ready'))
                    }
                    return activeWebview.insertText(text)
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentAI]) // initializedWebviews dependency'den çıkarıldı - infinite loop önleme

    // Webview event handler'ları oluştur
    const createEventHandlers = useCallback((aiId) => {
        // NOT: Domain kontrolü artık merkezi allowlist üzerinden yapılıyor
        // aiSites.js içindeki isAllowedNavigation ve isAuthDomain fonksiyonları kullanılıyor

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
                // GÜVENLİK: Katı Allowlist Tabanlı Pop-up Yönetimi
                // Sadece izin listesindeki domainlere pop-up açılmasına izin ver

                try {
                    const targetUrl = new URL(event.url)
                    const targetHostname = targetUrl.hostname

                    // 1. Auth domainleri için izin ver (popup açılsın)
                    // isAuthDomain katı eşleşme kullanır - includes() değil!
                    if (isAuthDomain(targetHostname)) {
                        // event.preventDefault() YAPMA - Bırak açılsın
                        return
                    }

                    // 2. İzinli domain listesinde mi kontrol et
                    if (isAllowedNavigation(targetHostname)) {
                        // new-window disposition ise native popup olarak aç
                        if (event.disposition === 'new-window') {
                            console.log('[AiWebview] İzinli domain popup:', targetHostname)
                            return
                        }
                        // Diğer durumlar için mevcut webview'da aç
                        return
                    }

                    // 3. İzin listesinde OLMAYAN domain - sistem tarayıcısında aç
                    event.preventDefault()
                    console.warn('[AiWebview] Harici domain engellendi, sistem tarayıcısında açılıyor:', targetHostname)
                    window.electronAPI?.openExternal?.(event.url)

                } catch (err) {
                    // Hata durumunda güvenli davran, popup açma
                    event.preventDefault()
                    console.warn('[AiWebview] New window URL parse hatası:', err)
                }
            },
            // GÜVENLİK: Katı Allowlist Tabanlı Navigasyon Kontrolü
            // will-navigate: Sadece izin listesindeki domainlere navigasyona izin ver
            // Bu, kullanıcının zararlı linklere tıklamasını engeller
            handleWillNavigate: (event) => {
                try {
                    const targetUrl = new URL(event.url)
                    const targetHostname = targetUrl.hostname

                    // Sadece http/https protokollerini kontrol et
                    if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
                        return
                    }

                    // GÜVENLİK: Katı allowlist kontrolü
                    // includes() KULLANILMIYOR - sadece tam domain eşleşmesi!
                    const isAllowed = isAllowedNavigation(targetHostname)

                    if (isAllowed) {
                        // İzin listesinde - navigasyona izin ver
                        return
                    }

                    // İzin listesinde DEĞİL - navigasyonu engelle ve sistem tarayıcısında aç
                    event.preventDefault()
                    console.warn('[AiWebview] Navigasyon engellendi, harici domain:', targetHostname)
                    window.electronAPI?.openExternal?.(event.url)

                } catch (error) {
                    // Hata durumunda navigasyonu engelle (güvenli davranış)
                    event.preventDefault()
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

                    // Önceki timeout'u temizle (eğer varsa)
                    const timeoutKey = `crash-retry-${aiId}`
                    if (timeoutRefs.current[timeoutKey]) {
                        clearTimeout(timeoutRefs.current[timeoutKey])
                    }

                    // Kısa gecikme ile reload
                    timeoutRefs.current[timeoutKey] = setTimeout(() => {
                        const webview = webviewRefs.current[aiId]
                        if (webview) {
                            webview.reload()
                        }
                        timeoutRefs.current[timeoutKey] = null
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
    // NOT: Webview key değiştiğinde (partition değişikliği) yeni element gelir
    // Bu durumda eski element'ten farklıysa yeni event listener'lar eklenir
    const setWebviewRef = useCallback((aiId) => (element) => {
        // Element yoksa veya aynı element ise bir şey yapma
        if (!element) return

        // Eğer aynı element ise (zaten bağlı), tekrar event ekleme
        if (webviewRefs.current[aiId] === element) return

        // Eski element varsa event listener'larını temizle
        const oldElement = webviewRefs.current[aiId]
        if (oldElement && oldElement._eventHandlers) {
            const oldHandlers = oldElement._eventHandlers
            oldElement.removeEventListener('did-start-loading', oldHandlers.handleStartLoading)
            oldElement.removeEventListener('did-stop-loading', oldHandlers.handleStopLoading)
            oldElement.removeEventListener('did-fail-load', oldHandlers.handleFailLoad)
            oldElement.removeEventListener('new-window', oldHandlers.handleNewWindow)
            oldElement.removeEventListener('will-navigate', oldHandlers.handleWillNavigate)
            oldElement.removeEventListener('dom-ready', oldHandlers.handleDomReady)
            oldElement.removeEventListener('crashed', oldHandlers.handleCrashed)
            oldElement.removeEventListener('render-process-gone', oldHandlers.handleCrashed)
            oldElement.removeEventListener('unresponsive', oldHandlers.handleUnresponsive)
            oldElement.removeEventListener('responsive', oldHandlers.handleResponsive)
            console.log('[AiWebview] Eski webview event listener\'ları temizlendi:', aiId)
        }

        // Yeni element'i kaydet
        webviewRefs.current[aiId] = element

        const handlers = createEventHandlers(aiId)

        // DOM ready handler - sadece loglama için
        const handleDomReady = () => {
            console.log('[AiWebview] dom-ready:', aiId)
        }

        element.addEventListener('did-start-loading', handlers.handleStartLoading)
        element.addEventListener('did-stop-loading', handlers.handleStopLoading)
        element.addEventListener('did-fail-load', handlers.handleFailLoad)
        element.addEventListener('new-window', handlers.handleNewWindow)
        element.addEventListener('will-navigate', handlers.handleWillNavigate)
        element.addEventListener('dom-ready', handleDomReady)
        // Crash recovery event'leri
        element.addEventListener('crashed', handlers.handleCrashed)
        element.addEventListener('render-process-gone', handlers.handleCrashed) // Electron 11+ için
        element.addEventListener('unresponsive', handlers.handleUnresponsive)
        element.addEventListener('responsive', handlers.handleResponsive)

        // Cleanup için handler'ları sakla
        element._eventHandlers = { ...handlers, handleDomReady }

        console.log('[AiWebview] Yeni webview event listener\'ları bağlandı:', aiId)
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
                    webview.removeEventListener('dom-ready', handlers.handleDomReady)
                    // Crash recovery event'leri
                    webview.removeEventListener('crashed', handlers.handleCrashed)
                    webview.removeEventListener('render-process-gone', handlers.handleCrashed)
                    webview.removeEventListener('unresponsive', handlers.handleUnresponsive)
                    webview.removeEventListener('responsive', handlers.handleResponsive)
                }
            })
            // Tüm timeout'ları temizle
            Object.values(timeoutRefs.current).forEach(timeoutId => {
                if (timeoutId) clearTimeout(timeoutId)
            })
            timeoutRefs.current = {}
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
                        {/* 
                          * PERFORMANS: visibility: hidden ile Chromium suspend mekanizması
                          * - display: none webview'ı DOM'dan kaldırmaz ama render eder
                          * - visibility: hidden ekliyerek Chromium'un otomatik tab suspension
                          *   mekanizmasını tetikliyoruz (Page Visibility API)
                          * - Bu GPU bellek ve CPU döngülerini önemli ölçüde azaltır
                          */}
                        <webview
                            key={`${aiId}_${currentPartition}`}
                            ref={setWebviewRef(aiId)}
                            src={siteConfig?.url || 'about:blank'}
                            partition={currentPartition}
                            className="absolute inset-0 w-full h-full rounded-[1.5rem]"
                            style={{
                                // Aktif olmayan webview'ı invisible yap - Chromium suspend eder
                                visibility: isActive ? 'visible' : 'hidden'
                            }}
                            allowpopups="true"
                            useragent={CHROME_USER_AGENT}
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

                        {/* Login Overlay - Her AI için login yoksa göster */}
                        {loginStates[aiId] === false && !isLoading && !error && (
                            <div className={`absolute inset-0 bg-gradient-to-br from-stone-900/98 via-stone-900/95 ${aiId === 'gemini' ? 'to-blue-900/20' : 'to-emerald-900/20'} backdrop-blur-md flex items-center justify-center rounded-[1.5rem] z-20`}>
                                <div className="flex flex-col items-center text-center gap-6 p-10 max-w-sm">
                                    {/* Platform Logo */}
                                    <div className={`w-16 h-16 ${aiId === 'gemini' ? 'bg-white' : 'bg-[#10a37f]'} rounded-2xl flex items-center justify-center shadow-xl`}>
                                        {aiId === 'gemini' ? (
                                            <svg width="32" height="32" viewBox="0 0 24 24">
                                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                            </svg>
                                        ) : (
                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                                                <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
                                            </svg>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="font-display text-xl font-semibold text-stone-100 mb-2">
                                            {aiId === 'gemini' ? "Gemini'yi" : "ChatGPT'yi"} Kullanmak İçin Giriş Yapın
                                        </h3>
                                        <p className="text-stone-400 text-sm leading-relaxed">
                                            {aiId === 'gemini'
                                                ? 'Chrome\'dan Google cookie\'lerini aktararak Gemini AI\'yı kullanabilirsiniz.'
                                                : 'Chrome\'dan OpenAI cookie\'lerini aktararak ChatGPT\'yi kullanabilirsiniz.'
                                            }
                                        </p>
                                    </div>

                                    {/* Cookie Import Butonu */}
                                    <button
                                        onClick={() => openCookieModal(aiId)}
                                        className={`flex items-center justify-center gap-3 px-6 py-3 ${aiId === 'gemini' ? 'bg-white hover:bg-gray-50 text-gray-700' : 'bg-[#10a37f] hover:bg-[#0d8a6a] text-white'} font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                        <span>Cookie İçe Aktar</span>
                                    </button>

                                    <p className="text-stone-500 text-xs text-center">
                                        Tarayıcıdan {aiId === 'gemini' ? 'gemini.google.com' : 'chatgpt.com'} cookie'lerini aktarın
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ChatGPT için bilgilendirme banner'ı - sadece ChatGPT sekmesinde ve ilk kez görüntülendiğinde */}
                        {aiId === 'chatgpt' && !isLoading && !error && !localStorage.getItem('chatgpt_info_dismissed') && (
                            <div className="absolute bottom-4 left-4 right-4 z-10">
                                <div className="bg-emerald-900/90 backdrop-blur-sm border border-emerald-700/50 rounded-xl p-3 flex items-start gap-3 shadow-lg">
                                    <svg className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="flex-1">
                                        <p className="text-xs text-emerald-200">
                                            <span className="font-medium">ChatGPT Plus kullanıyorsanız:</span>{' '}
                                            <span className="text-emerald-300/80">
                                                Giriş sorunu yaşarsanız Ayarlar → Veri → Cookie İçe Aktar ile oturum açabilirsiniz.
                                            </span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            localStorage.setItem('chatgpt_info_dismissed', 'true')
                                            // Force re-render
                                            setLoadingStates(prev => ({ ...prev }))
                                        }}
                                        className="p-1 hover:bg-emerald-800/50 rounded-lg transition-colors text-emerald-400 hover:text-emerald-200"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )
            })}

            {/* Cookie Import Modal */}
            <CookieImportModal
                isOpen={showCookieModal}
                onClose={() => setShowCookieModal(false)}
                targetPlatform={cookieModalTarget}
                onSuccess={handleCookieImportSuccess}
            />
        </>
    )
}

// React.memo ile sarmalama - sadece isResizing prop'u değiştiğinde re-render
// Bu, parent component (App) re-render olduğunda gereksiz render'ları önler
export default memo(AiWebview)
