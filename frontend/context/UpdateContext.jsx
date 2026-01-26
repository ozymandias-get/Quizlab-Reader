import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const UpdateContext = createContext(null)
const UPDATE_CHECK_DELAY = 5000

export function UpdateProvider({ children }) {
    const [updateAvailable, setUpdateAvailable] = useState(false)
    const [updateInfo, setUpdateInfo] = useState(null)
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
    const [hasCheckedUpdate, setHasCheckedUpdate] = useState(false)

    const checkForUpdates = useCallback(async () => {
        if (!window.electronAPI?.checkForUpdates) {
            setHasCheckedUpdate(true)
            return { available: false }
        }
        setIsCheckingUpdate(true)
        try {
            const result = await window.electronAPI.checkForUpdates()
            if (result.error) {
                setUpdateAvailable(false)
                setUpdateInfo({ error: result.error })
            } else if (result.available) {
                setUpdateAvailable(true)
                setUpdateInfo(result)
            } else {
                setUpdateAvailable(false)
                setUpdateInfo(null)
            }
            return result
        } catch (error) {
            setUpdateInfo({ error: error.message })
            return { available: false, error: error.message }
        } finally {
            setIsCheckingUpdate(false)
            setHasCheckedUpdate(true)
        }
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => checkForUpdates(), UPDATE_CHECK_DELAY)
        return () => clearTimeout(timer)
    }, [checkForUpdates])

    const value = useMemo(() => ({
        updateAvailable, updateInfo, isCheckingUpdate, hasCheckedUpdate, checkForUpdates
    }), [updateAvailable, updateInfo, isCheckingUpdate, hasCheckedUpdate, checkForUpdates])

    return (
        <UpdateContext.Provider value={value}>
            {children}
        </UpdateContext.Provider>
    )
}

export const useUpdate = () => {
    const context = useContext(UpdateContext)
    if (!context) throw new Error('useUpdate must be used within UpdateProvider')
    return context
}
