import React from 'react'
import { useLanguage } from '../../context/LanguageContext'

/**
 * Cookie yönetimi bölümü bileşeni - Premium Glass Design
 */
function CookieSection({
    isResettingCookies,
    cookieResetSuccess,
    cookieResetError,
    resetAllCookies,
    resetStats
}) {
    const { t } = useLanguage()

    return (
        <div className="space-y-4">
            {/* Section Header */}
            <h3
                className="text-sm font-medium flex items-center gap-2"
                style={{ color: 'rgba(255, 255, 255, 0.85)' }}
            >
                <div
                    className="p-1.5 rounded-lg"
                    style={{
                        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)',
                        border: '1px solid rgba(251, 191, 36, 0.2)'
                    }}
                >
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        style={{ color: 'rgba(251, 191, 36, 1)' }}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                {t('cookie_management') || 'Oturum Cookie\'leri'}
            </h3>

            {/* Content Card */}
            <div
                className="rounded-xl p-4 space-y-4"
                style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
            >
                {/* Info Text */}
                <p
                    className="text-xs leading-relaxed"
                    style={{ color: 'rgba(255, 255, 255, 0.45)' }}
                >
                    {t('cookie_info') || 'AI platformlarına giriş yapmak için kullandığınız cookie\'ler bu uygulamada güvenli şekilde saklanır. Cookie\'ler sadece yerel cihazınızda tutulur ve hiçbir sunucuya gönderilmez.'}
                </p>

                {/* Security Info Box */}
                <div
                    className="flex items-start gap-3 p-3 rounded-xl"
                    style={{
                        background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%)',
                        border: '1px solid rgba(52, 211, 153, 0.15)'
                    }}
                >
                    <div
                        className="p-1.5 rounded-lg flex-shrink-0"
                        style={{
                            background: 'rgba(52, 211, 153, 0.15)',
                            border: '1px solid rgba(52, 211, 153, 0.25)'
                        }}
                    >
                        <svg
                            className="w-3.5 h-3.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            style={{ color: 'rgba(52, 211, 153, 1)' }}
                        >
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="text-xs leading-relaxed">
                        <span
                            className="font-medium"
                            style={{ color: 'rgba(134, 239, 172, 1)' }}
                        >
                            {t('secure_storage') || '🔐 Şifreli Depolama:'}
                        </span>
                        <span style={{ color: 'rgba(134, 239, 172, 0.7)' }}>
                            {' '}{t('secure_storage_info') || 'Cookie verileri işletim sistemi seviyesinde şifrelenerek (Windows DPAPI) güvenli şekilde saklanır.'}
                        </span>
                    </div>
                </div>

                {/* Reset Button Row */}
                <div className="flex items-center gap-3 pt-1">
                    <button
                        onClick={resetAllCookies}
                        disabled={isResettingCookies}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(220, 38, 38, 0.08) 100%)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: 'rgba(252, 165, 165, 1)'
                        }}
                        onMouseEnter={(e) => {
                            if (!isResettingCookies) {
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.15) 100%)'
                                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)'
                                e.currentTarget.style.transform = 'translateY(-1px)'
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(220, 38, 38, 0.08) 100%)'
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)'
                            e.currentTarget.style.transform = 'translateY(0)'
                        }}
                    >
                        {isResettingCookies ? (
                            <>
                                <div
                                    className="w-4 h-4 border-2 rounded-full animate-spin"
                                    style={{
                                        borderColor: 'rgba(252, 165, 165, 0.2)',
                                        borderTopColor: 'rgba(252, 165, 165, 1)'
                                    }}
                                />
                                <span>{t('resetting') || 'Sıfırlanıyor...'}</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span>{t('reset_cookies') || 'Cookie\'leri Sıfırla'}</span>
                            </>
                        )}
                    </button>

                    {/* Success Message with Stats */}
                    {cookieResetSuccess && (
                        <div className="flex flex-col gap-1">
                            <span
                                className="text-xs flex items-center gap-1.5"
                                style={{ color: 'rgba(52, 211, 153, 1)' }}
                            >
                                <div
                                    className="w-4 h-4 rounded-full flex items-center justify-center"
                                    style={{
                                        background: 'rgba(52, 211, 153, 0.15)',
                                        border: '1px solid rgba(52, 211, 153, 0.3)'
                                    }}
                                >
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                {t('cookies_reset_success') || 'Tüm oturumlar temizlendi!'}
                            </span>
                            {/* Detaylı stats */}
                            {resetStats && (
                                <span
                                    className="text-xs ml-5"
                                    style={{ color: 'rgba(255, 255, 255, 0.45)' }}
                                >
                                    {resetStats.partitionsCleaned} partition temizlendi
                                    {resetStats.profileCount > 0 && ` • ${resetStats.profileCount} profil silindi`}
                                </span>
                            )}
                            {/* Başarısız partition uyarısı */}
                            {resetStats?.partitionsFailed > 0 && (
                                <span
                                    className="text-xs ml-5 flex items-center gap-1"
                                    style={{ color: 'rgba(251, 191, 36, 0.9)' }}
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    {resetStats.partitionsFailed} partition temizlenemedi
                                </span>
                            )}
                        </div>
                    )}

                    {/* Error Message */}
                    {cookieResetError && (
                        <div className="flex flex-col gap-1">
                            <span
                                className="text-xs flex items-center gap-1.5"
                                style={{ color: 'rgba(239, 68, 68, 1)' }}
                            >
                                <div
                                    className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.15)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)'
                                    }}
                                >
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                ⚠️ Sıfırlama başarısız oldu!
                            </span>
                            <span
                                className="text-xs ml-5"
                                style={{ color: 'rgba(252, 165, 165, 0.8)' }}
                            >
                                {cookieResetError}
                            </span>
                            {/* Kısmi başarı durumunda stats göster */}
                            {resetStats && (
                                <span
                                    className="text-xs ml-5"
                                    style={{ color: 'rgba(251, 191, 36, 0.8)' }}
                                >
                                    Kısmi temizlik: {resetStats.partitionsCleaned || 0} partition temizlendi
                                    {resetStats.partitionsFailed > 0 && `, ${resetStats.partitionsFailed} başarısız`}
                                </span>
                            )}
                            <span
                                className="text-xs ml-5"
                                style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                            >
                                Lütfen tekrar deneyin veya uygulamayı yeniden başlatıp tekrar deneyin.
                            </span>
                        </div>
                    )}
                </div>

                {/* Warning Text */}
                <p
                    className="text-xs"
                    style={{ color: 'rgba(255, 255, 255, 0.35)' }}
                >
                    {t('reset_cookies_warning') || 'Bu işlem tüm AI platformlarındaki oturumlarınızı kapatır ve profilleri siler. Tekrar giriş yapmanız gerekecektir.'}
                </p>
            </div>
        </div>
    )
}

export default CookieSection
