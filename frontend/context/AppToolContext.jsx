import React, { createContext, useContext } from 'react'
import { useScreenshot } from '../hooks'
import { useAi } from './AiContext'
import { useElementPicker } from '../hooks/useElementPicker'

const AppToolContext = createContext(null)

export function AppToolProvider({ children }) {
    const { sendImageToAI, webviewInstance } = useAi()

    // Hooks using the AiContext dependencies
    const { isScreenshotMode, startScreenshot, closeScreenshot, handleCapture } = useScreenshot(sendImageToAI)
    const { isPickerActive, startPicker, togglePicker } = useElementPicker(webviewInstance)

    const value = React.useMemo(() => ({
        isScreenshotMode, startScreenshot, closeScreenshot, handleCapture,
        isPickerActive, startPicker, togglePicker
    }), [isScreenshotMode, startScreenshot, closeScreenshot, handleCapture, isPickerActive, startPicker, togglePicker])

    return (
        <AppToolContext.Provider value={value}>
            {children}
        </AppToolContext.Provider>
    )
}

export const useAppTools = () => {
    const context = useContext(AppToolContext)
    if (!context) throw new Error('useAppTools must be used within AppToolProvider')
    return context
}
