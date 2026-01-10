import React, { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useApp } from '../context/AppContext'
import { useSettings } from '../hooks/useSettings'
import SettingsModal from './SettingsModal'

function BottomBar({ onHoverChange }) {
    const [isHovered, setIsHovered] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
    const { t, currentLanguage } = useLanguage()
    // Context'ten global state'e eriş - prop drilling yok
    const { currentAI, setCurrentAI } = useApp()

    // Profilleri çek
    const { profiles, activeProfileId, handleSwitchProfile } = useSettings(true)

    // Timeout refs for delayed closing
    const closeTimeoutRef = useRef(null)

    // Hover durumunu parent'a bildir
    useEffect(() => {
        onHoverChange?.(isHovered)
    }, [isHovered, onHoverChange])

    const handleMouseEnter = () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current)
            closeTimeoutRef.current = null
        }
        setIsHovered(true)
    }

    const handleMouseLeave = () => {
        setIsHovered(false)
        // Delay closing to allow traversing gaps
        closeTimeoutRef.current = setTimeout(() => {
            setIsProfileMenuOpen(false)
        }, 250)
    }

    // Menü dışına tıklanınca kapat
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isProfileMenuOpen && !event.target.closest('.profile-menu-container')) {
                setIsProfileMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isProfileMenuOpen])

    const activeProfile = profiles.find(p => p.id === activeProfileId)

    const handleGeminiClick = () => {
        if (currentAI === 'gemini') {
            setIsProfileMenuOpen(!isProfileMenuOpen)
        } else {
            setCurrentAI('gemini')
            setIsProfileMenuOpen(false)
        }
    }

    const handleProfileSelect = async (profileId) => {
        await handleSwitchProfile(profileId)
        setIsProfileMenuOpen(false)
    }

    return (
        <>
            <div
                className="fixed bottom-2 left-1/2 -translate-x-1/2 z-50 profile-menu-container"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* Profil Menüsü - Integrated Premium Dropdown */}
                {isProfileMenuOpen && (
                    <div
                        className="absolute bottom-full left-0 mb-3 w-56 overflow-hidden origin-bottom-left"
                        style={{
                            background: 'rgba(5, 5, 7, 0.85)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '20px',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.9), 0 0 15px -3px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
                            backdropFilter: 'blur(30px) saturate(140%)',
                            padding: '6px',
                            animation: 'menuSpring 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                        }}
                    >
                        <div className="space-y-1">
                            {profiles.length > 0 ? profiles.map(profile => (
                                <button
                                    key={profile.id}
                                    onClick={() => handleProfileSelect(profile.id)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-left relative"
                                    style={{
                                        background: activeProfileId === profile.id ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (activeProfileId !== profile.id) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                                    }}
                                    onMouseLeave={(e) => {
                                        if (activeProfileId !== profile.id) e.currentTarget.style.background = 'transparent'
                                    }}
                                >
                                    {/* Avatar */}
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shadow-inner"
                                        style={{
                                            background: activeProfileId === profile.id
                                                ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%)'
                                                : 'rgba(255, 255, 255, 0.05)',
                                            color: activeProfileId === profile.id ? '#a5b4fc' : 'rgba(255, 255, 255, 0.4)',
                                            border: activeProfileId === profile.id ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid rgba(255, 255, 255, 0.05)'
                                        }}
                                    >
                                        {profile.name.charAt(0).toUpperCase()}
                                    </div>

                                    {/* Name */}
                                    <span
                                        className="text-sm font-medium truncate flex-1 transition-colors"
                                        style={{
                                            color: activeProfileId === profile.id ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.6)'
                                        }}
                                    >
                                        {profile.name}
                                    </span>

                                    {/* Active Indicator & Hover Arrow */}
                                    <div className="flex items-center justify-center w-4">
                                        {activeProfileId === profile.id ? (
                                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
                                        ) : (
                                            <svg
                                                className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-2 group-hover:translate-x-0"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                style={{ color: 'rgba(255, 255, 255, 0.3)' }}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        )}
                                    </div>
                                </button>
                            )) : (
                                <div className="px-3 py-8 text-center flex flex-col items-center gap-2 opacity-50">
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs text-stone-400">Profil yok</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}


                {/* Ana kontrol bar - Glassmorphism */}
                <div className={`
                    floating-bar
                    ${isHovered ? 'floating-bar--expanded' : ''}
                `}>
                    {/* İç içerik - opacity ile kontrol */}
                    <div className={`
                        floating-bar__content
                        ${isHovered ? 'floating-bar__content--visible' : ''}
                    `}>
                        {/* Gemini */}
                        <button
                            className={`floating-btn floating-btn--model ${currentAI === 'gemini' ? 'floating-btn--selected' : ''}`}
                            onClick={handleGeminiClick}
                            title="Gemini"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.352 0 0 5.352 0 12s5.352 12 12 12 12-5.352 12-12S18.648 0 12 0zm0 21.6c-5.292 0-9.6-4.308-9.6-9.6S6.708 2.4 12 2.4s9.6 4.308 9.6 9.6-4.308 9.6-9.6 9.6zm0-16.8c-3.972 0-7.2 3.228-7.2 7.2s3.228 7.2 7.2 7.2 7.2-3.228 7.2-7.2-3.228-7.2-7.2-7.2zm0 12c-2.652 0-4.8-2.148-4.8-4.8s2.148-4.8 4.8-4.8 4.8 2.148 4.8 4.8-2.148 4.8-4.8 4.8z" />
                            </svg>
                            <span className="floating-btn__label flex items-center gap-1">
                                {t('gemini')}
                                {activeProfile && currentAI === 'gemini' && (
                                    <span style={{ opacity: 0.5 }}>({activeProfile.name})</span>
                                )}
                            </span>
                        </button>

                        {/* ChatGPT */}
                        <button
                            className={`floating-btn floating-btn--model ${currentAI === 'chatgpt' ? 'floating-btn--selected' : ''}`}
                            onClick={() => setCurrentAI('chatgpt')}
                            title="ChatGPT"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.4066-.6812zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6099-1.4997Z" />
                            </svg>
                            <span className="floating-btn__label">{t('chatgpt')}</span>
                        </button>

                        {/* Ayırıcı çizgi */}
                        <div className="w-px h-6 bg-stone-600/50 mx-1" />

                        {/* Dil göstergesi */}
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-800/50 text-stone-400 text-sm">
                            <span>{currentLanguage?.flag}</span>
                            <span className="hidden sm:inline">{currentLanguage?.nativeName}</span>
                        </div>

                        {/* Ayarlar butonu */}
                        <button
                            className="floating-btn floating-btn--settings"
                            onClick={() => setIsSettingsOpen(true)}
                            title={t('settings')}
                        >
                            <svg className="w-5 h-5 settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    </div>

                    {/* İnce çizgi göstergesi - Nefes alan ışık */}
                    <div className="floating-bar__indicator" />
                </div>
            </div>

            {/* Animation Keyframes for dropdown */}
            <style>{`
                @keyframes slideUpFade {
                    0% { opacity: 0; transform: translateY(10px); }
                    100% { opacity: 1; transform: translateY(0); }
                }

                @keyframes menuSpring {
                    0% { opacity: 0; transform: translateY(10px) scale(0.95); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>

            {/* Settings Modal */}
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </>
    )
}

export default BottomBar
