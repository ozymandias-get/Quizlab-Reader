import React, { useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'

/**
 * Profil yönetimi bölümü bileşeni - Premium Glass Design
 */
function ProfileSection({
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
    handleDeleteProfile
}) {
    const { t } = useLanguage()
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div
            className="space-y-4 pt-4"
            style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}
        >
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-2 px-1">
                <div
                    className="p-2 rounded-xl"
                    style={{
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        boxShadow: '0 2px 10px -2px rgba(99, 102, 241, 0.2)'
                    }}
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        style={{ color: 'rgba(165, 180, 252, 1)' }}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </div>
                <div>
                    <h3
                        className="text-base font-semibold"
                        style={{ color: 'rgba(255, 255, 255, 0.95)' }}
                    >
                        {t('google_account_management') || 'Google Hesabı Yönetimi'}
                    </h3>
                    <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        {t('account_profiles') || 'Hesap Profilleri'}
                    </p>
                </div>
            </div>

            {/* Content Card */}
            <div
                className="rounded-xl p-4 space-y-4"
                style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
            >
                {/* Aktif Profil Göstergesi - Her zaman görünür */}
                <ActiveProfileIndicator
                    profiles={profiles}
                    activeProfileId={activeProfileId}
                />

                {/* Profil Listesi - Her zaman görünür */}
                {!isLoadingProfiles && profiles.length > 0 && (
                    <ProfileList
                        profiles={profiles}
                        activeProfileId={activeProfileId}
                        isSwitchingProfile={isSwitchingProfile}
                        handleSwitchProfile={handleSwitchProfile}
                        handleDeleteProfile={handleDeleteProfile}
                    />
                )}

                {/* Yükleme Durumu */}
                {isLoadingProfiles && <LoadingSpinner />}

                {/* Profil Yoksa Empty State */}
                {!isLoadingProfiles && profiles.length === 0 && <EmptyProfileState />}

                {/* Yeni Profil Ekleme - Accordion */}
                <div className="pt-2">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group"
                        style={{
                            background: isOpen ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid',
                            borderColor: isOpen ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'
                        }}
                    >
                        <span
                            className="text-sm font-medium flex items-center gap-2"
                            style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                        >
                            <div className="p-1 rounded-lg bg-green-500/20 text-green-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            {isOpen ? (t('close') || 'Kapat') : (t('add_account') || 'Hesap Ekle')}
                        </span>
                        <svg
                            className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    <div
                        className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0'}`}
                    >
                        <div className="overflow-hidden">
                            <CreateProfileForm
                                profiles={profiles}
                                newProfileName={newProfileName}
                                setNewProfileName={setNewProfileName}
                                newProfileCookieJson={newProfileCookieJson}
                                setNewProfileCookieJson={setNewProfileCookieJson}
                                isCreatingProfile={isCreatingProfile}
                                handleCreateProfile={handleCreateProfile}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * Aktif profil göstergesi - Premium Glass Style
 */
function ActiveProfileIndicator({ profiles, activeProfileId }) {
    const activeProfile = profiles.find(p => p.id === activeProfileId)

    if (!activeProfileId || !activeProfile) return null

    return (
        <div
            className="flex items-center gap-3 p-4 rounded-xl"
            style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                boxShadow: '0 4px 20px -5px rgba(99, 102, 241, 0.2)'
            }}
        >
            {/* Avatar */}
            <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.4) 0%, rgba(139, 92, 246, 0.35) 100%)',
                    border: '1px solid rgba(165, 180, 252, 0.3)',
                    boxShadow: '0 4px 12px -4px rgba(99, 102, 241, 0.4)'
                }}
            >
                <span
                    className="text-lg font-bold"
                    style={{ color: 'rgba(255, 255, 255, 0.95)' }}
                >
                    {activeProfile.name.charAt(0).toUpperCase()}
                </span>
            </div>

            {/* Info */}
            <div className="flex-1">
                <div
                    className="text-sm font-medium flex items-center gap-1.5"
                    style={{ color: 'rgba(199, 210, 254, 0.8)' }}
                >
                    Aktif Profil
                    {activeProfile.isEncrypted && (
                        <span
                            title="Cookie verileri şifreli"
                            style={{ color: 'rgba(52, 211, 153, 1)' }}
                        >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                        </span>
                    )}
                </div>
                <div
                    className="text-lg font-semibold"
                    style={{ color: 'rgba(255, 255, 255, 0.95)' }}
                >
                    {activeProfile.name}
                </div>
            </div>

            {/* Status Badge */}
            <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{
                    background: 'rgba(52, 211, 153, 0.12)',
                    border: '1px solid rgba(52, 211, 153, 0.25)'
                }}
            >
                <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: 'rgba(52, 211, 153, 1)' }}
                />
                <span
                    className="text-xs font-medium"
                    style={{ color: 'rgba(134, 239, 172, 1)' }}
                >
                    Bağlı
                </span>
            </div>
        </div>
    )
}

/**
 * Yükleme göstergesi
 */
function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center py-8">
            <div
                className="w-6 h-6 border-2 rounded-full animate-spin"
                style={{
                    borderColor: 'rgba(99, 102, 241, 0.2)',
                    borderTopColor: 'rgba(99, 102, 241, 1)'
                }}
            />
        </div>
    )
}

/**
 * Profil yokken gösterilen başlangıç durumu
 */
function EmptyProfileState() {
    return (
        <div className="space-y-4">
            {/* Empty State Icon */}
            <div className="text-center py-4">
                <div
                    className="w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center"
                    style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                >
                    <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        style={{ color: 'rgba(255, 255, 255, 0.3)' }}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                </div>
                <h4
                    className="text-sm font-medium mb-1"
                    style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                >
                    İlk Profilinizi Oluşturun
                </h4>
                <p
                    className="text-xs"
                    style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                >
                    Birden fazla hesap kullanmak için profil sistemi kurun
                </p>
            </div>

            {/* Step Guide */}
            <div className="space-y-2 text-xs">
                {[
                    'Önce AI sitesine (Gemini/ChatGPT) normal tarayıcıdan giriş yapın',
                    'EditThisCookie ile cookie\'leri export edin ve aşağıya yapıştırın',
                    'Profile isim verin ve kaydedin - başka hesaplar için tekrarlayın'
                ].map((step, index) => (
                    <div
                        key={index}
                        className="flex items-start gap-3 p-2.5 rounded-xl"
                        style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.04)'
                        }}
                    >
                        <div
                            className="w-5 h-5 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{
                                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.4) 0%, rgba(139, 92, 246, 0.35) 100%)',
                                border: '1px solid rgba(99, 102, 241, 0.3)'
                            }}
                        >
                            {index + 1}
                        </div>
                        <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>{step}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

/**
 * Profil listesi - Glass Style
 */
function ProfileList({
    profiles,
    activeProfileId,
    isSwitchingProfile,
    handleSwitchProfile,
    handleDeleteProfile
}) {
    const otherProfiles = profiles.filter(p => p.id !== activeProfileId)

    if (otherProfiles.length === 0) return null

    return (
        <div className="space-y-2">
            <div
                className="text-xs font-medium"
                style={{ color: 'rgba(255, 255, 255, 0.4)' }}
            >
                Diğer Hesaplar
            </div>
            {otherProfiles.map(profile => (
                <div
                    key={profile.id}
                    className="group flex items-center justify-between p-3 rounded-xl transition-all duration-200"
                    style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.04)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.04)'
                    }}
                >
                    <div className="flex items-center gap-2.5">
                        {/* Avatar */}
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.08)'
                            }}
                        >
                            <span
                                className="text-xs font-medium"
                                style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                            >
                                {profile.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <span
                            className="text-sm"
                            style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                        >
                            {profile.name}
                        </span>
                        {profile.isEncrypted && (
                            <span
                                title="Cookie verileri şifreli"
                                style={{ color: 'rgba(52, 211, 153, 0.8)' }}
                            >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                            </span>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => handleSwitchProfile(profile.id)}
                            disabled={isSwitchingProfile === profile.id}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
                            style={{
                                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
                                border: '1px solid rgba(99, 102, 241, 0.25)',
                                color: 'rgba(165, 180, 252, 1)'
                            }}
                            onMouseEnter={(e) => {
                                if (isSwitchingProfile !== profile.id) {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.2) 100%)'
                                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)'
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)'
                                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.25)'
                            }}
                        >
                            {isSwitchingProfile === profile.id ? '...' : 'Geç'}
                        </button>
                        <button
                            onClick={() => handleDeleteProfile(profile.id)}
                            className="p-1.5 rounded-lg transition-all duration-200"
                            style={{
                                color: 'rgba(255, 255, 255, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                                e.currentTarget.style.color = 'rgba(248, 113, 113, 1)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent'
                                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.3)'
                            }}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}

/**
 * Yeni profil oluşturma formu - Glass Style
 */
function CreateProfileForm({
    profiles,
    newProfileName,
    setNewProfileName,
    newProfileCookieJson,
    setNewProfileCookieJson,
    isCreatingProfile,
    handleCreateProfile
}) {
    return (
        <div
            className="pt-4"
            style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}
        >
            <div
                className="text-xs font-medium mb-3"
                style={{ color: 'rgba(255, 255, 255, 0.4)' }}
            >
                {profiles.length === 0 ? '🆕 Yeni Profil Oluştur' : '+ Yeni Hesap Ekle'}
            </div>

            {/* Profile Name Input */}
            <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="Profil adı (örn: İş Hesabı, Kişisel...)"
                className="w-full px-4 py-2.5 mb-2 text-sm rounded-xl transition-all duration-200 focus:outline-none"
                style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: 'rgba(255, 255, 255, 0.9)'
                }}
                onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
                }}
                onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                    e.currentTarget.style.boxShadow = 'none'
                }}
            />

            {/* Cookie JSON Textarea */}
            <textarea
                value={newProfileCookieJson}
                onChange={(e) => setNewProfileCookieJson(e.target.value)}
                placeholder="Cookie JSON yapıştırın (EditThisCookie'den export edin)"
                className="w-full h-20 px-4 py-2.5 mb-3 text-xs rounded-xl transition-all duration-200 focus:outline-none resize-none font-mono"
                style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: 'rgba(255, 255, 255, 0.9)'
                }}
                onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
                }}
                onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                    e.currentTarget.style.boxShadow = 'none'
                }}
            />

            {/* Submit Button */}
            <button
                onClick={handleCreateProfile}
                disabled={!newProfileName.trim() || !newProfileCookieJson.trim() || isCreatingProfile}
                className="w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.4) 0%, rgba(139, 92, 246, 0.35) 100%)',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    color: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 4px 20px -5px rgba(99, 102, 241, 0.4)'
                }}
                onMouseEnter={(e) => {
                    if (!isCreatingProfile && newProfileName.trim() && newProfileCookieJson.trim()) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.5) 0%, rgba(139, 92, 246, 0.45) 100%)'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                        e.currentTarget.style.boxShadow = '0 8px 30px -5px rgba(99, 102, 241, 0.5)'
                    }
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.4) 0%, rgba(139, 92, 246, 0.35) 100%)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 20px -5px rgba(99, 102, 241, 0.4)'
                }}
            >
                {isCreatingProfile ? (
                    <>
                        <div
                            className="w-4 h-4 border-2 rounded-full animate-spin"
                            style={{
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                                borderTopColor: 'rgba(255, 255, 255, 1)'
                            }}
                        />
                        <span>Kaydediliyor...</span>
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Hesabı Ekle</span>
                    </>
                )}
            </button>

            {/* Warning Box */}
            <div
                className="mt-3 p-3 rounded-xl"
                style={{
                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(245, 158, 11, 0.05) 100%)',
                    border: '1px solid rgba(251, 191, 36, 0.15)'
                }}
            >
                <p
                    className="text-xs flex items-start gap-2"
                    style={{ color: 'rgba(252, 211, 77, 0.9)' }}
                >
                    <span>⚠️</span>
                    <span>
                        <strong>Önemli:</strong> Cookie alırken <strong>gizli pencerede</strong> (Ctrl+Shift+N)
                        sadece tek hesap ile giriş yapın.
                    </span>
                </p>
            </div>

            {/* Help Link */}
            <p
                className="text-xs mt-3 text-center"
                style={{ color: 'rgba(255, 255, 255, 0.35)' }}
            >
                💡 <a
                    href="https://chromewebstore.google.com/detail/editthiscookie-v3/ojfebgpkimhlhcblbalbfjblapadhbol"
                    target="_blank"
                    rel="noopener"
                    className="transition-colors duration-200"
                    style={{ color: 'rgba(96, 165, 250, 1)' }}
                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                    EditThisCookie
                </a> ile cookie export edin
            </p>
            <p
                className="text-xs text-center"
                style={{ color: 'rgba(255, 255, 255, 0.25)' }}
            >
                🔍 Platform otomatik tespit edilir (Gemini/ChatGPT)
            </p>
        </div>
    )
}

export default ProfileSection
