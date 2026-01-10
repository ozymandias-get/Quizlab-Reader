import React, { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useSettings } from '../hooks/useSettings'
import { LanguageTab, AboutTab, DataTab, ProfileSection } from './settings'

/**
 * Ayarlar modalı ana bileşeni
 * Premium Glass Theme ile modern tasarım
 */
function SettingsModal({ isOpen, onClose }) {
    const { t } = useLanguage()
    const [activeTab, setActiveTab] = useState('language')
    const modalRef = useRef(null)

    // Custom hook ile tüm settings state ve işlemlerini al
    const settings = useSettings(isOpen)

    // ESC tuşu ile kapatma
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose])

    // Modal dışına tıklama ile kapatma
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target)) {
                onClose()
            }
        }
        if (isOpen) {
            setTimeout(() => {
                document.addEventListener('mousedown', handleClickOutside)
            }, 100)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Premium Backdrop with improved blur */}
            <div
                className="absolute inset-0 backdrop-blur-sm"
                style={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    transition: 'all 0.3s ease'
                }}
            />

            {/* Modal Container - Enhanced Glass Effect */}
            <div
                ref={modalRef}
                className="settings-modal relative w-full max-w-md mx-4 overflow-hidden"
                style={{
                    background: 'linear-gradient(165deg, rgba(5, 5, 5, 0.95) 0%, rgba(0, 0, 0, 0.98) 100%)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: `
                        0 0 0 1px rgba(0, 0, 0, 1),
                        0 50px 100px -20px rgba(0, 0, 0, 1),
                        0 0 60px -10px rgba(0, 0, 0, 0.8),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1)
                    `,
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    animation: 'modalEnter 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards'
                }}
            >
                {/* Glass Reflection Overlay */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.07) 0%, transparent 40%, transparent 60%, rgba(255, 255, 255, 0.03) 100%)',
                        borderRadius: '24px'
                    }}
                />

                {/* Header */}
                <ModalHeader title={t('settings_title')} onClose={onClose} />

                {/* Tabs */}
                <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} t={t} />

                {/* Content */}
                <div className="relative p-6 max-h-[60vh] overflow-y-auto settings-content">
                    {activeTab === 'language' && <LanguageTab />}

                    {activeTab === 'about' && (
                        <AboutTab
                            appVersion={settings.appVersion}
                            updateStatus={settings.updateStatus}
                            updateInfo={settings.updateInfo}
                            checkForUpdates={settings.checkForUpdates}
                            openReleasesPage={settings.openReleasesPage}
                        />
                    )}

                    {activeTab === 'accounts' && (
                        <ProfileSection
                            profiles={settings.profiles}
                            activeProfileId={settings.activeProfileId}
                            isLoadingProfiles={settings.isLoadingProfiles}
                            newProfileName={settings.newProfileName}
                            setNewProfileName={settings.setNewProfileName}
                            newProfileCookieJson={settings.newProfileCookieJson}
                            setNewProfileCookieJson={settings.setNewProfileCookieJson}
                            isCreatingProfile={settings.isCreatingProfile}
                            isSwitchingProfile={settings.isSwitchingProfile}
                            handleCreateProfile={settings.handleCreateProfile}
                            handleSwitchProfile={async (id) => {
                                await settings.handleSwitchProfile(id)
                                onClose()
                            }}
                            handleDeleteProfile={settings.handleDeleteProfile}
                        />
                    )}

                    {activeTab === 'data' && (
                        <DataTab
                            // Cookie props
                            isResettingCookies={settings.isResettingCookies}
                            cookieResetSuccess={settings.cookieResetSuccess}
                            cookieResetError={settings.cookieResetError}
                            resetAllCookies={settings.resetAllCookies}
                            resetStats={settings.resetStats}
                        />
                    )}
                </div>
            </div>

            {/* Animation keyframes */}
            <style>{`
                @keyframes modalEnter {
                    0% {
                        opacity: 0;
                        transform: scale(0.95) translateY(10px);
                        filter: blur(4px);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                        filter: blur(0);
                    }
                }
                
                .settings-content::-webkit-scrollbar {
                    width: 6px;
                }
                
                .settings-content::-webkit-scrollbar-track {
                    background: transparent;
                }
                
                .settings-content::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 3px;
                }
                
                .settings-content::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    )
}

/**
 * Modal başlık bileşeni - Premium Glass Style
 */
function ModalHeader({ title, onClose }) {
    return (
        <div
            className="relative flex items-center justify-between px-6 py-5"
            style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%)'
            }}
        >
            <h2 className="text-xl font-semibold flex items-center gap-3"
                style={{
                    color: 'rgba(255, 255, 255, 0.95)',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                }}>
                <div
                    className="p-2 rounded-xl"
                    style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                {title}
            </h2>
            <button
                onClick={onClose}
                className="group p-2 rounded-xl transition-all duration-200"
                style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                }}
            >
                <svg className="w-5 h-5 transition-colors duration-200"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    )
}

/**
 * Tab navigasyonu bileşeni - Premium Animated Tabs
 */
function TabNavigation({ activeTab, setActiveTab, t }) {
    const tabs = [
        {
            id: 'language',
            label: t('language'),
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
            )
        },
        {
            id: 'accounts',
            label: t('accounts') || 'Hesaplar',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            )
        },
        {
            id: 'data',
            label: t('data') || 'Veri',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
            )
        },
        {
            id: 'about',
            label: t('about'),
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        }
    ]

    return (
        <div
            className="relative flex mx-4 my-3 p-1 rounded-2xl"
            style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.04)'
            }}
        >
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="relative flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300"
                    style={{
                        color: activeTab === tab.id ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.45)',
                        background: activeTab === tab.id
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'transparent',
                        border: activeTab === tab.id
                            ? '1px solid rgba(255, 255, 255, 0.08)'
                            : '1px solid transparent',
                        boxShadow: activeTab === tab.id
                            ? '0 4px 15px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                            : 'none'
                    }}
                    onMouseEnter={(e) => {
                        if (activeTab !== tab.id) {
                            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (activeTab !== tab.id) {
                            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.45)'
                            e.currentTarget.style.background = 'transparent'
                        }
                    }}
                >
                    <span className="flex items-center justify-center gap-2">
                        {tab.icon}
                        {tab.label}
                    </span>
                </button>
            ))}
        </div>
    )
}

export default SettingsModal
