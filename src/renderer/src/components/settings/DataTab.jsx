import React from 'react'
import CookieSection from './CookieSection'

/**
 * Veri yönetimi sekmesi bileşeni
 * Cookie ve Profil yönetimi bölümlerini içerir
 */
function DataTab({
    // Cookie props
    isResettingCookies,
    cookieResetSuccess,
    cookieResetError,
    resetAllCookies,
    resetStats,
    // Profile props
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
    return (
        <div className="space-y-6">
            {/* Cookie Yönetimi */}
            <CookieSection
                isResettingCookies={isResettingCookies}
                cookieResetSuccess={cookieResetSuccess}
                cookieResetError={cookieResetError}
                resetAllCookies={resetAllCookies}
                resetStats={resetStats}
            />
        </div>
    )
}

export default DataTab
