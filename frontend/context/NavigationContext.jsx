import React, { createContext, useContext, useState, useMemo, useCallback } from 'react'
import { STORAGE_KEYS } from '../constants/storageKeys'
import { useLocalStorageString } from '../hooks'
import { APP_CONSTANTS } from '../constants/appConstants'

const NavigationContext = createContext(null)

export function NavigationProvider({ children }) {
    const [leftPanelTab, setLeftPanelTab] = useLocalStorageString(
        STORAGE_KEYS.LEFT_PANEL_TAB,
        APP_CONSTANTS.LEFT_PANEL_TABS.VIEWER,
        Object.values(APP_CONSTANTS.LEFT_PANEL_TABS)
    )

    const value = useMemo(() => ({
        leftPanelTab, setLeftPanelTab
    }), [leftPanelTab])

    return (
        <NavigationContext.Provider value={value}>
            {children}
        </NavigationContext.Provider>
    )
}

export const useNavigation = () => {
    const context = useContext(NavigationContext)
    if (!context) throw new Error('useNavigation must be used within NavigationProvider')
    return context
}
