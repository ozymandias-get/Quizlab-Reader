import React, { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../context/LanguageContext'

function SettingsModal({ isOpen, onClose }) {
    const { t, language, setLanguage, languages } = useLanguage()
    const [activeTab, setActiveTab] = useState('language')
    const modalRef = useRef(null)

    // Update states
    const [appVersion, setAppVersion] = useState('1.0.0')
    const [updateStatus, setUpdateStatus] = useState('idle') // idle, checking, available, downloading, ready, error
    const [updateInfo, setUpdateInfo] = useState(null)
    const [downloadProgress, setDownloadProgress] = useState(0)

    // Uygulama sürümünü al
    useEffect(() => {
        if (window.electronAPI?.getAppVersion) {
            window.electronAPI.getAppVersion().then(version => {
                if (version) setAppVersion(version)
            })
        }
    }, [])

    // Güncelleme olaylarını dinle
    useEffect(() => {
        if (!window.electronAPI) return

        window.electronAPI.onUpdateAvailable?.((data) => {
            setUpdateStatus('available')
            setUpdateInfo(data)
        })

        window.electronAPI.onUpdateNotAvailable?.((data) => {
            setUpdateStatus('idle')
            setUpdateInfo(null)
        })

        window.electronAPI.onDownloadProgress?.((data) => {
            setDownloadProgress(Math.round(data.percent))
        })

        window.electronAPI.onUpdateDownloaded?.((data) => {
            setUpdateStatus('ready')
        })

        window.electronAPI.onUpdateError?.((data) => {
            setUpdateStatus('error')
            console.error('Update error:', data.message)
        })
    }, [])

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

    // Güncelleme kontrolü
    const checkForUpdates = async () => {
        if (!window.electronAPI?.checkForUpdates) {
            setUpdateStatus('error')
            return
        }
        setUpdateStatus('checking')
        try {
            const result = await window.electronAPI.checkForUpdates()
            if (!result.available) {
                setUpdateStatus('idle')
            }
        } catch (error) {
            setUpdateStatus('error')
        }
    }

    // Güncelleme indir
    const downloadUpdate = async () => {
        if (!window.electronAPI?.downloadUpdate) return
        setUpdateStatus('downloading')
        setDownloadProgress(0)
        await window.electronAPI.downloadUpdate()
    }

    // Güncellemeyi kur
    const installUpdate = () => {
        if (!window.electronAPI?.installUpdate) return
        window.electronAPI.installUpdate()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div
                ref={modalRef}
                className="relative bg-stone-900/95 backdrop-blur-xl border border-stone-700/50 
                           rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden
                           animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-stone-700/50">
                    <h2 className="text-xl font-semibold text-stone-100 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {t('settings_title')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-stone-700/50 transition-colors text-stone-400 hover:text-stone-100"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-stone-700/50">
                    <button
                        onClick={() => setActiveTab('language')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors
                                   ${activeTab === 'language'
                                ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/10'
                                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'}`}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                            </svg>
                            {t('language')}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('about')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors
                                   ${activeTab === 'about'
                                ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/10'
                                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'}`}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {t('about')}
                        </span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'language' && (
                        <div className="space-y-4">
                            <p className="text-stone-400 text-sm mb-4">{t('select_language')}</p>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.values(languages).map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => setLanguage(lang.code)}
                                        className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200
                                                   ${language === lang.code
                                                ? 'bg-indigo-500/20 border-2 border-indigo-500 text-indigo-300'
                                                : 'bg-stone-800/50 border-2 border-transparent hover:border-stone-600 text-stone-300 hover:text-stone-100'
                                            }`}
                                    >
                                        <span className="text-2xl">{lang.flag}</span>
                                        <div className="text-left">
                                            <div className="font-medium text-sm">{lang.nativeName}</div>
                                            <div className="text-xs text-stone-500">{lang.name}</div>
                                        </div>
                                        {language === lang.code && (
                                            <svg className="w-5 h-5 ml-auto text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'about' && (
                        <div className="space-y-6">
                            {/* App Info */}
                            <div className="text-center">
                                <div className="flex justify-center mb-4">
                                    <img
                                        src="/icon.png"
                                        alt="Quizlab Reader"
                                        className="w-20 h-20 rounded-2xl shadow-lg"
                                    />
                                </div>
                                <h3 className="text-xl font-bold text-stone-100">Quizlab Reader</h3>
                                <p className="text-stone-400 text-sm mt-1">{t('version')} {appVersion}</p>
                            </div>

                            {/* Update Section */}
                            <div className="bg-stone-800/50 rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-stone-300 font-medium">{t('updates')}</span>
                                    {updateStatus === 'available' && (
                                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                                            {t('update_available')}
                                        </span>
                                    )}
                                </div>

                                {/* Status Messages */}
                                {updateStatus === 'idle' && (
                                    <p className="text-stone-500 text-sm">{t('update_not_available')}</p>
                                )}

                                {updateStatus === 'checking' && (
                                    <div className="flex items-center gap-2 text-stone-400 text-sm">
                                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                        </svg>
                                        {t('checking_updates')}
                                    </div>
                                )}

                                {updateStatus === 'available' && updateInfo && (
                                    <div className="text-sm">
                                        <p className="text-green-400">{t('new_version')}: {updateInfo.version}</p>
                                    </div>
                                )}

                                {updateStatus === 'downloading' && (
                                    <div className="space-y-2">
                                        <p className="text-stone-400 text-sm">{t('downloading')} {downloadProgress}%</p>
                                        <div className="w-full h-2 bg-stone-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 transition-all duration-300"
                                                style={{ width: `${downloadProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {updateStatus === 'ready' && (
                                    <p className="text-green-400 text-sm">{t('update_ready')}</p>
                                )}

                                {updateStatus === 'error' && (
                                    <p className="text-red-400 text-sm">{t('update_error')}</p>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-2">
                                    {(updateStatus === 'idle' || updateStatus === 'error') && (
                                        <button
                                            onClick={checkForUpdates}
                                            className="flex-1 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-sm font-medium rounded-lg transition-colors"
                                        >
                                            {t('check_for_updates')}
                                        </button>
                                    )}

                                    {updateStatus === 'available' && (
                                        <button
                                            onClick={downloadUpdate}
                                            className="flex-1 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 text-sm font-medium rounded-lg transition-colors"
                                        >
                                            {t('download_update')}
                                        </button>
                                    )}

                                    {updateStatus === 'ready' && (
                                        <button
                                            onClick={installUpdate}
                                            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
                                        >
                                            {t('install_restart')}
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
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 transition-colors text-stone-300 text-sm"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                    GitHub
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default SettingsModal
