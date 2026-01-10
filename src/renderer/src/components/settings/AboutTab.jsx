import React from 'react'
import { useLanguage } from '../../context/LanguageContext'
import appIcon from '../../assets/icon.png'

/**
 * Hakkında sekmesi bileşeni - Premium Glass Design
 */
function AboutTab({
    appVersion,
    updateStatus,
    updateInfo,
    checkForUpdates,
    openReleasesPage
}) {
    const { t } = useLanguage()

    return (
        <div className="space-y-6">
            {/* App Info Card */}
            <div
                className="text-center p-6 rounded-2xl"
                style={{
                    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)'
                }}
            >
                {/* App Icon with glow */}
                <div className="flex justify-center mb-4">
                    <div
                        className="relative"
                        style={{
                            filter: 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.3))'
                        }}
                    >
                        <img
                            src={appIcon}
                            alt="Quizlab Reader"
                            className="w-20 h-20 rounded-2xl"
                            style={{
                                boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)'
                            }}
                        />
                        {/* Subtle overlay */}
                        <div
                            className="absolute inset-0 rounded-2xl"
                            style={{
                                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%)'
                            }}
                        />
                    </div>
                </div>

                <h3
                    className="text-xl font-bold"
                    style={{
                        color: 'rgba(255, 255, 255, 0.95)',
                        textShadow: '0 0 20px rgba(99, 102, 241, 0.3)'
                    }}
                >
                    Quizlab Reader
                </h3>
                <p
                    className="text-sm mt-1"
                    style={{ color: 'rgba(255, 255, 255, 0.45)' }}
                >
                    {t('version')} {appVersion}
                </p>
            </div>

            {/* Update Section */}
            <div
                className="rounded-xl p-4 space-y-3"
                style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
            >
                <div className="flex items-center justify-between">
                    <span
                        className="font-medium"
                        style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                    >
                        {t('updates')}
                    </span>
                    {updateStatus === 'available' && (
                        <span
                            className="px-2.5 py-1 text-xs font-medium rounded-full"
                            style={{
                                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.15) 100%)',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                color: 'rgba(134, 239, 172, 1)'
                            }}
                        >
                            {t('update_available')}
                        </span>
                    )}
                </div>

                {/* Status Messages */}
                <UpdateStatusMessage
                    status={updateStatus}
                    updateInfo={updateInfo}
                    t={t}
                />

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                    {(updateStatus === 'idle' || updateStatus === 'error' || updateStatus === 'latest') && (
                        <button
                            onClick={checkForUpdates}
                            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300"
                            style={{
                                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
                                border: '1px solid rgba(99, 102, 241, 0.25)',
                                color: 'rgba(165, 180, 252, 1)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.2) 100%)'
                                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)'
                                e.currentTarget.style.transform = 'translateY(-1px)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)'
                                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.25)'
                                e.currentTarget.style.transform = 'translateY(0)'
                            }}
                        >
                            {t('check_for_updates')}
                        </button>
                    )}

                    {updateStatus === 'available' && (
                        <button
                            onClick={openReleasesPage}
                            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                            style={{
                                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)',
                                border: '1px solid rgba(34, 197, 94, 0.25)',
                                color: 'rgba(134, 239, 172, 1)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.25) 0%, rgba(16, 185, 129, 0.2) 100%)'
                                e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.4)'
                                e.currentTarget.style.transform = 'translateY(-1px)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)'
                                e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.25)'
                                e.currentTarget.style.transform = 'translateY(0)'
                            }}
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            {t('download_from_github') || "GitHub'dan İndir"}
                        </button>
                    )}
                </div>
            </div>

            {/* GitHub Link */}
            <div className="flex justify-center pt-2">
                <a
                    href="https://github.com/ozymandias-get/Quizlab-Reader"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300"
                    style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: 'rgba(255, 255, 255, 0.6)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 8px 25px -10px rgba(0, 0, 0, 0.5)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                    }}
                >
                    <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    <span className="text-sm font-medium">GitHub</span>
                </a>
            </div>
        </div>
    )
}

/**
 * Güncelleme durumu mesajı bileşeni - Glass Style
 */
function UpdateStatusMessage({ status, updateInfo, t }) {
    switch (status) {
        case 'idle':
            return (
                <p
                    className="text-sm"
                    style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                >
                    {t('update_not_available')}
                </p>
            )

        case 'latest':
            return (
                <div
                    className="flex items-center gap-2 text-sm"
                    style={{ color: 'rgba(52, 211, 153, 1)' }}
                >
                    <div
                        className="flex items-center justify-center w-5 h-5 rounded-full"
                        style={{
                            background: 'rgba(52, 211, 153, 0.15)',
                            border: '1px solid rgba(52, 211, 153, 0.3)'
                        }}
                    >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                    {t('you_have_latest') || 'En güncel sürüme sahipsiniz'}
                </div>
            )

        case 'checking':
            return (
                <div
                    className="flex items-center gap-2 text-sm"
                    style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                >
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    {t('checking_updates')}
                </div>
            )

        case 'available':
            if (!updateInfo) return null
            return (
                <div className="text-sm space-y-1">
                    <p style={{ color: 'rgba(134, 239, 172, 1)' }}>
                        {t('new_version')}: {updateInfo.version}
                    </p>
                    {updateInfo.releaseName && (
                        <p
                            className="text-xs"
                            style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                        >
                            {updateInfo.releaseName}
                        </p>
                    )}
                </div>
            )

        case 'error':
            return (
                <p
                    className="text-sm"
                    style={{ color: 'rgba(248, 113, 113, 1)' }}
                >
                    {t('update_error')}
                </p>
            )

        default:
            return null
    }
}

export default AboutTab
