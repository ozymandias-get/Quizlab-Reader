import { useState, useCallback } from 'react'
import { useToast } from '../context/ToastContext'

/**
 * Cookie Import Modal Bileşeni
 * Kullanıcının cookie JSON yapıştırıp profil oluşturmasını sağlar
 */
function CookieImportModal({
    isOpen,
    onClose,
    targetPlatform = 'gemini', // 'gemini' | 'chatgpt'
    onSuccess
}) {
    const { showWarning } = useToast()
    const [profileName, setProfileName] = useState('')
    const [cookieJson, setCookieJson] = useState('')
    const [isImporting, setIsImporting] = useState(false)
    const [error, setError] = useState(null)

    // Modal açıldığında state'leri sıfırla
    const resetState = useCallback(() => {
        setProfileName('')
        setCookieJson('')
        setError(null)
    }, [])

    // Modal kapatıldığında
    const handleClose = useCallback(() => {
        resetState()
        onClose()
    }, [onClose, resetState])

    // Cookie import ve profil oluştur
    const handleImport = useCallback(async () => {
        if (!profileName.trim()) {
            setError('Lütfen profil için bir isim girin')
            return
        }

        if (!cookieJson.trim()) {
            setError('Lütfen cookie JSON yapıştırın')
            return
        }

        if (!window.electronAPI?.createProfile) {
            setError('Profil API kullanılamıyor')
            return
        }

        setError(null)
        setIsImporting(true)

        try {
            const result = await window.electronAPI.createProfile(profileName.trim(), cookieJson)

            if (result.success) {
                // Platform uyuşmazlığı kontrolü: Kullanıcı X platformu için cookie import ediyor ama
                // cookie aslında Y platformuna ait
                if (result.target && result.target !== targetPlatform) {
                    const expectedPlatform = targetPlatform === 'gemini' ? 'Gemini' : 'ChatGPT'
                    const detectedPlatform = result.target === 'gemini' ? 'Gemini' : 'ChatGPT'
                    showWarning(
                        `Dikkat: ${expectedPlatform} için cookie import ediyordunuz ama ` +
                        `cookie'ler ${detectedPlatform} platformuna ait görünüyor. ` +
                        `Bu profil sadece ${detectedPlatform} için çalışacak.`
                    )
                }

                // Platform uyarısı varsa göster (karışık cookie, tanınmayan domain vs.)
                if (result.platformWarning) {
                    setTimeout(() => showWarning(result.platformWarning), 300)
                }

                // Şifreleme uyarısı varsa göster
                if (result.encryptionWarning) {
                    setTimeout(() => showWarning(result.encryptionWarning), 600)
                }

                // Event dispatch et - tespit edilen target'i kullan (değil targetPlatform)
                window.dispatchEvent(new CustomEvent('cookies-changed', {
                    detail: {
                        action: 'profile-created',
                        target: result.target || targetPlatform, // Backend tespitini tercih et
                        profileId: result.profile.id,
                        partition: result.partition
                    }
                }))

                handleClose()
                onSuccess?.(result)
            } else {
                setError(result.error || 'Profil oluşturulamadı')
            }
        } catch (e) {
            console.error('[CookieImportModal] Hata:', e)
            setError(e.message || 'Beklenmeyen bir hata oluştu')
        } finally {
            setIsImporting(false)
        }
    }, [profileName, cookieJson, targetPlatform, handleClose, onSuccess, showWarning])

    if (!isOpen) return null

    const platformConfig = {
        gemini: {
            name: 'Google Gemini',
            url: 'https://gemini.google.com',
            color: 'blue'
        },
        chatgpt: {
            name: 'ChatGPT',
            url: 'https://chatgpt.com',
            color: 'emerald'
        }
    }

    const platform = platformConfig[targetPlatform] || platformConfig.gemini

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-stone-700">
                    <h3 className="text-lg font-semibold text-stone-100">
                        🍪 {platform.name} Cookie İçe Aktar
                    </h3>
                    <button
                        onClick={handleClose}
                        className="p-1 text-stone-400 hover:text-stone-200 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-5">
                    {/* Talimatlar */}
                    <div className="bg-stone-800/50 rounded-xl p-4 mb-4">
                        <h4 className="text-sm font-medium text-stone-200 mb-2">Nasıl Yapılır:</h4>

                        {/* Kolay Yöntem */}
                        <div className="mb-3 pb-3 border-b border-stone-700">
                            <p className="text-xs text-emerald-400 font-medium mb-1.5">✨ Kolay Yöntem (Önerilen):</p>
                            <ol className="text-xs text-stone-400 space-y-1 list-decimal list-inside">
                                <li>
                                    <a
                                        href="https://chromewebstore.google.com/detail/editthiscookie-v3/ojfebgpkimhlhcblbalbfjblapadhbol"
                                        target="_blank"
                                        rel="noopener"
                                        className="text-blue-400 hover:underline"
                                    >
                                        EditThisCookie
                                    </a> eklentisini Chrome'a kurun
                                </li>
                                <li>
                                    <a
                                        href={platform.url}
                                        target="_blank"
                                        rel="noopener"
                                        className="text-blue-400 hover:underline"
                                    >
                                        {platform.url.replace('https://', '')}
                                    </a>'a giriş yapın
                                </li>
                                <li>Eklenti simgesine tıklayın → Export → JSON kopyalayın</li>
                            </ol>
                        </div>

                        {/* Manuel Yöntem */}
                        <p className="text-xs text-stone-500 font-medium mb-1.5">Manuel Yöntem (DevTools):</p>
                        <ol className="text-xs text-stone-500 space-y-1 list-decimal list-inside">
                            <li>F12 ile DevTools'u açın → Application → Cookies</li>
                            <li>Cookie'leri sağ tık → "Copy all as JSON" yapın</li>
                        </ol>

                        {/* Önemli Uyarı */}
                        <div className="mt-3 pt-3 border-t border-amber-500/30 bg-amber-500/10 rounded-lg p-2.5">
                            <p className="text-xs text-amber-400 font-medium flex items-start gap-1.5">
                                <span className="text-base leading-none">⚠️</span>
                                <span>
                                    <strong>Önemli:</strong> Cookie alırken gizli pencerede (Ctrl+Shift+N)
                                    sadece <strong>tek hesap</strong> ile giriş yapın.
                                    Birden fazla hesap açıkken alınan cookie'ler düzgün çalışmaz.
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Profil İsmi */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-stone-300 mb-2">
                            Profil Adı <span className="text-stone-500">(bu hesabı tanımlayacak)</span>
                        </label>
                        <input
                            type="text"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            placeholder="örn: İş Hesabı, Kişisel, Okul..."
                            className="w-full px-4 py-2.5 bg-stone-800 border border-stone-600 rounded-xl text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    {/* JSON Textarea */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-stone-300 mb-2">
                            Cookie JSON
                        </label>
                        <textarea
                            value={cookieJson}
                            onChange={(e) => setCookieJson(e.target.value)}
                            placeholder="Cookie JSON'ı buraya yapıştırın..."
                            className="w-full h-32 px-4 py-3 bg-stone-800 border border-stone-600 rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-indigo-500 resize-none font-mono"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleImport}
                        disabled={!profileName.trim() || !cookieJson.trim() || isImporting}
                        className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isImporting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Kaydediliyor...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Hesabı Kaydet</span>
                            </>
                        )}
                    </button>

                    {/* Tip */}
                    <p className="text-xs text-stone-500 text-center mt-3">
                        💡 Başka hesap eklemek için: Ayarlar → Veri → Yeni Hesap Ekle
                    </p>
                </div>
            </div>
        </div>
    )
}

export default CookieImportModal
