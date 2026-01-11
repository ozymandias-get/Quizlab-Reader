import { useState, useEffect, useCallback, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'

/**
 * Settings modal için state ve işlemleri yöneten custom hook
 * Güncelleme state'leri AppContext'ten senkronize edilir
 */
export function useSettings(isOpen) {
    // AppContext'ten güncelleme state'lerini al
    const {
        updateAvailable,
        updateInfo: appUpdateInfo,
        isCheckingUpdate,
        hasCheckedUpdate,
        checkForUpdates: appCheckForUpdates
    } = useApp()

    // Toast bildirimleri için
    const { showSuccess, showError, showWarning } = useToast()

    // Uygulama versiyonu
    const [appVersion, setAppVersion] = useState('1.0.0')

    // setTimeout referansları için ref (cleanup için)
    const resetTimeoutsRef = useRef([])
    const isMountedRef = useRef(true) // Unmount kontrolü için flag

    // Update status - AppContext'ten türetilir
    // Durumlar: 'idle' (başlangıç), 'checking' (kontrol ediliyor), 
    //           'available' (güncelleme var), 'latest' (güncel), 'error' (hata)
    let updateStatus = 'idle'
    if (isCheckingUpdate) {
        updateStatus = 'checking'
    } else if (appUpdateInfo?.error) {
        updateStatus = 'error'
    } else if (updateAvailable) {
        updateStatus = 'available'
    } else if (hasCheckedUpdate && !updateAvailable) {
        // Kontrol yapıldı ve güncelleme yok = güncel
        updateStatus = 'latest'
    }
    const updateInfo = appUpdateInfo

    // Cookie states
    const [isResettingCookies, setIsResettingCookies] = useState(false)
    const [cookieResetSuccess, setCookieResetSuccess] = useState(false)
    const [cookieResetError, setCookieResetError] = useState(null) // Hata mesajı
    const [resetStats, setResetStats] = useState(null)

    // Profile states
    const [profiles, setProfiles] = useState([])
    const [activeProfileId, setActiveProfileId] = useState(null)
    const [isLoadingProfiles, setIsLoadingProfiles] = useState(false)
    const [newProfileName, setNewProfileName] = useState('')
    const [newProfileCookieJson, setNewProfileCookieJson] = useState('')
    const [isCreatingProfile, setIsCreatingProfile] = useState(false)
    const [isSwitchingProfile, setIsSwitchingProfile] = useState(null)

    // Delete confirmation modal state
    const [deleteConfirmation, setDeleteConfirmation] = useState(null) // { profileId, profileName }
    const [isDeletingProfile, setIsDeletingProfile] = useState(false)

    // Uygulama sürümünü al
    useEffect(() => {
        if (window.electronAPI?.getAppVersion) {
            window.electronAPI.getAppVersion().then(version => {
                if (version) setAppVersion(version)
            })
        }
    }, [])

    // Modal açıldığında profilleri yükle
    useEffect(() => {
        if (isOpen) {
            loadProfilesList()
        }
    }, [isOpen])

    // Global event listener for sync (BottomBar ve SettingsModal arası senkronizasyon)
    useEffect(() => {
        const handleCookiesChanged = (event) => {
            const { action } = event.detail || {}
            // Profil listesini veya aktif profili etkileyen eylemler
            if (['profile-switch', 'profile-deleted', 'profile-created', 'profile-renamed'].includes(action)) {
                loadProfilesList()
            }
        }
        window.addEventListener('cookies-changed', handleCookiesChanged)
        return () => window.removeEventListener('cookies-changed', handleCookiesChanged)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // loadProfilesList dependency olarak eklenemez çünkü her render'da yeniden oluşturuluyor

    // Profilleri yükle
    const loadProfilesList = async () => {
        if (!window.electronAPI?.getProfiles) return

        setIsLoadingProfiles(true)
        try {
            const result = await window.electronAPI.getProfiles()
            if (result.success) {
                setProfiles(result.profiles || [])
                setActiveProfileId(result.activeProfileId)
            }
        } catch (e) {
            console.error('[Settings] Profil yükleme hatası:', e)
        } finally {
            setIsLoadingProfiles(false)
        }
    }

    // Güncelleme kontrolü - AppContext'teki fonksiyonu kullan
    const checkForUpdates = async () => {
        await appCheckForUpdates()
    }

    // GitHub Releases sayfasını aç
    const openReleasesPage = async () => {
        if (!window.electronAPI?.openReleasesPage) {
            // Fallback: doğrudan URL aç
            window.open('https://github.com/ozymandias-get/Quizlab-Reader/releases', '_blank')
            return
        }
        await window.electronAPI.openReleasesPage()
    }

    // Cookie sıfırlama
    const resetAllCookies = async () => {
        if (!window.electronAPI?.googleLogout) {
            console.warn('[Settings] Cookie reset API not available')
            const errorMsg = 'Cookie sıfırlama API\'si mevcut değil'
            setCookieResetError(errorMsg)
            showError(errorMsg)
            return
        }

        if (isResettingCookies) return

        // Önceki timeout'ları temizle (eğer varsa)
        resetTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
        resetTimeoutsRef.current = []

        setIsResettingCookies(true)
        setCookieResetSuccess(false)
        setCookieResetError(null)
        setResetStats(null)

        try {
            const result = await window.electronAPI.googleLogout()

            // Unmount kontrolü - component unmount olduysa state update yapma
            if (!isMountedRef.current) return

            if (result.success) {
                setCookieResetSuccess(true)
                setResetStats(result.stats)
                console.log('[Settings] Reset tamamlandı:', result.stats)

                // Global event dispatch et - SADECE başarılı olduğunda
                // AiWebview bu eventi dinleyerek webview'ları yeniler
                window.dispatchEvent(new CustomEvent('cookies-changed', {
                    detail: { action: 'reset', stats: result.stats }
                }))

                // Profilleri yenile
                loadProfilesList()

                // 5 saniye sonra success mesajını kaldır (stats görülebilsin)
                const successTimeout = setTimeout(() => {
                    if (isMountedRef.current) {
                        setCookieResetSuccess(false)
                        setResetStats(null)
                    }
                }, 5000)
                resetTimeoutsRef.current.push(successTimeout)
            } else {
                // HATA: Kullanıcıya göster, event dispatch ETME
                const errorMsg = result.error || 'Cookie sıfırlama başarısız oldu'
                console.error('[Settings] Reset hatası:', errorMsg)
                setCookieResetError(errorMsg)
                showError(`Sıfırlama başarısız: ${errorMsg}`)

                // Kısmi başarı durumunda da stats göster
                if (result.stats) {
                    setResetStats(result.stats)
                }

                // 8 saniye sonra hata mesajını kaldır
                const errorTimeout = setTimeout(() => {
                    if (isMountedRef.current) {
                        setCookieResetError(null)
                        setResetStats(null)
                    }
                }, 8000)
                resetTimeoutsRef.current.push(errorTimeout)
            }
        } catch (error) {
            // Exception: Kullanıcıya göster (sadece component mount ise)
            if (!isMountedRef.current) return

            const errorMsg = error.message || 'Beklenmeyen bir hata oluştu'
            console.error('[Settings] Cookie reset error:', error)
            setCookieResetError(errorMsg)
            showError(`Cookie sıfırlama hatası: ${errorMsg}`)

            const errorTimeout = setTimeout(() => {
                if (isMountedRef.current) {
                    setCookieResetError(null)
                }
            }, 8000)
            resetTimeoutsRef.current.push(errorTimeout)
        } finally {
            if (isMountedRef.current) {
                setIsResettingCookies(false)
            }
        }
    }

    // Component unmount olduğunda timeout'ları temizle ve flag'i güncelle
    useEffect(() => {
        isMountedRef.current = true
        return () => {
            isMountedRef.current = false // Unmount flag'i
            resetTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
            resetTimeoutsRef.current = []
        }
    }, [])

    // Yeni profil oluştur
    const handleCreateProfile = async () => {
        if (isCreatingProfile) return

        if (!newProfileName.trim()) {
            showWarning('Lütfen profil adı girin')
            return
        }
        if (!newProfileCookieJson.trim()) {
            showWarning('Lütfen cookie JSON yapıştırın')
            return
        }
        if (!window.electronAPI?.createProfile) return

        setIsCreatingProfile(true)
        try {
            const result = await window.electronAPI.createProfile(newProfileName.trim(), newProfileCookieJson)

            if (result.success) {
                setNewProfileName('')
                setNewProfileCookieJson('')
                await loadProfilesList()

                // Platform bilgisini kullanıcıya göster
                const platformName = result.target === 'chatgpt' ? 'ChatGPT' :
                    result.target === 'gemini' ? 'Gemini' : null
                console.log('[Settings] Profil oluşturuldu, partition:', result.partition, 'target:', result.target)

                if (platformName) {
                    showSuccess(`"${result.profile.name}" profili oluşturuldu (${platformName})`)
                } else {
                    // Platform tespit edilemedi - uyarı ile göster
                    showWarning(`"${result.profile.name}" profili oluşturuldu (platform tespit edilemedi)`)
                }

                // Platform ile ilgili ek uyarılar varsa göster
                if (result.platformWarning) {
                    // Biraz gecikme ile ikinci toast göster (üst üste binmesin)
                    setTimeout(() => {
                        showWarning(result.platformWarning)
                    }, 500)
                }

                // Şifreleme uyarısı varsa göster
                if (result.encryptionWarning) {
                    setTimeout(() => {
                        showWarning(result.encryptionWarning)
                    }, 1000)
                }

                window.dispatchEvent(new CustomEvent('cookies-changed', {
                    detail: {
                        action: 'profile-created',
                        profileId: result.profile.id,
                        partition: result.partition,
                        target: result.target // Backend'den tespit edilen platform (gemini/chatgpt/null)
                    }
                }))
            } else {
                showError(result.error || 'Profil oluşturulamadı')
            }
        } catch (e) {
            console.error('[Settings] Profil oluşturma hatası:', e)
            showError('Profil oluşturma hatası: ' + e.message)
        } finally {
            setIsCreatingProfile(false)
        }
    }

    // Profil geçişi
    const handleSwitchProfile = async (profileId) => {
        if (!window.electronAPI?.switchProfile || profileId === activeProfileId || isSwitchingProfile) return

        setIsSwitchingProfile(profileId)
        try {
            const result = await window.electronAPI.switchProfile(profileId)
            if (result.success) {
                setActiveProfileId(profileId)

                // Oturum süresi dolmuşsa kullanıcıyı bilgilendir
                if (result.sessionExpired) {
                    showWarning('Bu profilin oturumu sona ermiş. Lütfen yeniden giriş yapın.')
                }

                window.dispatchEvent(new CustomEvent('cookies-changed', {
                    detail: {
                        action: 'profile-switch',
                        profileId,
                        partition: result.partition,
                        sessionExpired: result.sessionExpired // UI'a oturum durumunu bildir
                    }
                }))
                return true
            } else {
                showError(result.error || 'Profile geçilemedi')
                return false
            }
        } catch (e) {
            console.error('[Settings] Profil geçiş hatası:', e)
            showError('Profil geçiş hatası: ' + e.message)
            return false
        } finally {
            setIsSwitchingProfile(null)
        }
    }

    // Profil silme - onay modalını aç
    const handleDeleteProfile = (profileId) => {
        if (!window.electronAPI?.deleteProfile) return

        const profile = profiles.find(p => p.id === profileId)
        setDeleteConfirmation({
            profileId,
            profileName: profile?.name || 'Profil'
        })
    }

    // Silme işlemini onayla
    const confirmDeleteProfile = async () => {
        if (!deleteConfirmation || isDeletingProfile) return

        const { profileId } = deleteConfirmation
        setIsDeletingProfile(true)
        // Modalı hemen kapatma, işlem bitince kapat
        // setDeleteConfirmation(null) -> Bunu success sonrasına veya finally'ye taşıyalım, 
        // ancak kullanıcı silinirken modalı görmeli ki beklediğini anlasın.
        // Fakat mevcut UI tasarımında modal bir "onay" modalı.
        // Loading state bu modal üzerinde gösterilecek.

        try {
            const result = await window.electronAPI.deleteProfile(profileId)
            if (result.success) {
                await loadProfilesList()
                showSuccess('Profil başarıyla silindi')

                window.dispatchEvent(new CustomEvent('cookies-changed', {
                    detail: {
                        action: 'profile-deleted',
                        partition: result.newPartition,
                        wasActiveProfile: profileId === activeProfileId // Silinen profil aktifti mi?
                    }
                }))
                setDeleteConfirmation(null) // Başarılı olunca kapat
            } else {
                showError(result.error || 'Profil silinemedi')
                // Hata durumunda kapatmalı mıyız? Kullanıcı tekrar deneyebilir.
                // Şimdilik kapatalım, UX tercihi.
                setDeleteConfirmation(null)
            }
        } catch (e) {
            console.error('[Settings] Profil silme hatası:', e)
            showError('Profil silme hatası: ' + e.message)
        } finally {
            setIsDeletingProfile(false)
        }
    }

    // Silme işlemini iptal et
    const cancelDeleteProfile = useCallback(() => {
        setDeleteConfirmation(null)
    }, [])

    return {
        // App info
        appVersion,

        // Update
        updateStatus,
        updateInfo,
        checkForUpdates,
        openReleasesPage,

        // Cookies
        isResettingCookies,
        cookieResetSuccess,
        cookieResetError,
        resetStats,
        resetAllCookies,

        // Profiles
        profiles,
        activeProfileId,
        isLoadingProfiles,
        newProfileName,
        setNewProfileName,
        newProfileCookieJson,
        setNewProfileCookieJson,
        isCreatingProfile,
        isSwitchingProfile,
        handleCreateProfile,
        handleSwitchProfile,
        handleDeleteProfile,
        deleteConfirmation,
        isDeletingProfile,
        confirmDeleteProfile,
        cancelDeleteProfile,
        loadProfilesList
    }
}
