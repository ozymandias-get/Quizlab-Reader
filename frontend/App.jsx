import React, { useState, useCallback } from 'react'
import { AnimatePresence, motion, LayoutGroup } from 'framer-motion'
import AiWebview from './components/AiWebview'
import BottomBar from './components/BottomBar'
import FloatingButton from './components/FloatingButton'
import ScreenshotTool from './components/ScreenshotTool'
import UpdateBanner from './components/UpdateBanner'
import LeftPanel from './components/LeftPanel'
import AppBackground from './components/AppBackground'
import ToastContainer from './components/Toast/ToastContainer'
import UsageAssistant from './components/UsageAssistant'


// Context & Constants
import { useAi, useAppTools, useUpdate, useAppearance, useNavigation, useToast, useLanguage } from './context'

import { STORAGE_KEYS } from './constants/storageKeys'
import { APP_CONSTANTS } from './constants/appConstants'

// Hooks
import { usePanelResize } from './hooks'

const { LEFT_PANEL_TABS } = APP_CONSTANTS

function App() {
    const { showError, showSuccess } = useToast()
    const { t } = useLanguage()

    // Global state from specific contexts
    const { sendTextToAI } = useAi()
    const { isScreenshotMode, handleCapture, closeScreenshot } = useAppTools()
    const { updateAvailable, updateInfo } = useUpdate()
    const { isLayoutSwapped, isTourActive, setIsTourActive } = useAppearance()
    const { leftPanelTab, setLeftPanelTab } = useNavigation()

    // Panel resize hook
    const {
        leftPanelWidth,
        isResizing,
        handleMouseDown,
        leftPanelRef,
        resizerRef
    } = usePanelResize({
        initialWidth: 50,
        minLeft: 300,
        minRight: 400,
        storageKey: STORAGE_KEYS.LEFT_PANEL_WIDTH,
        isReversed: isLayoutSwapped
    })

    // Local State
    const [pdfFile, setPdfFile] = useState(null)
    const [selectedText, setSelectedText] = useState('')
    const [selectionPosition, setSelectionPosition] = useState(null)
    const [isBarHovered, setIsBarHovered] = useState(false)
    const [isUpdateBannerVisible, setIsUpdateBannerVisible] = useState(true)

    // Race condition protection for file loading
    const lastLoadRequestId = React.useRef(0)

    /**
     * PDF selection from local file system
     */
    const handleSelectPdf = useCallback(async () => {
        const api = window.electronAPI
        if (!api?.selectPdf) {
            showError('toast_api_unavailable')
            return
        }

        const currentRequestId = ++lastLoadRequestId.current

        try {
            const result = await api.selectPdf({ filterName: t('pdf_documents') })
            // Only update if this is still the latest request
            if (currentRequestId === lastLoadRequestId.current && result) {
                setPdfFile(result)
                setLeftPanelTab(LEFT_PANEL_TABS.VIEWER)
            }
        } catch (error) {
            if (currentRequestId === lastLoadRequestId.current) {
                console.error('[App] PDF Selection Error:', error)
                showError('toast_pdf_load_error', null, { error: error.message || t('error_unknown_error') })
            }
        }
    }, [showError, t, setLeftPanelTab])

    /**
     * File selection from the Explorer sidebar
     */
    const handleFileSelect = useCallback(async (file) => {
        if (file.type !== 'file') return

        const currentRequestId = ++lastLoadRequestId.current
        const api = window.electronAPI

        // 1. Refresh stream URL if possible (session safety)
        if (file.path && api?.getPdfStreamUrl) {
            try {
                const result = await api.getPdfStreamUrl(file.path)

                // Check race condition before updating
                if (currentRequestId !== lastLoadRequestId.current) return

                if (result?.streamUrl) {
                    setPdfFile({ ...file, streamUrl: result.streamUrl })
                    setLeftPanelTab(LEFT_PANEL_TABS.VIEWER)
                    showSuccess('toast_opened', null, { fileName: file.name })
                    return
                }
            } catch (error) {
                console.error('[App] PDF Refresh Error:', error)
            }
        }

        // Check race condition again before fallback
        if (currentRequestId !== lastLoadRequestId.current) return

        // 2. Fallback: Use existing streamUrl
        if (file.streamUrl) {
            setPdfFile(file)
            setLeftPanelTab(LEFT_PANEL_TABS.VIEWER)
            showSuccess('toast_opened', null, { fileName: file.name })
        } else {
            showError('error_pdf_load')
        }
    }, [showSuccess, showError, t, setLeftPanelTab])

    const handleTextSelection = useCallback((text, position) => {
        setSelectedText(text)
        setSelectionPosition(position)
    }, [])

    const handleSendToAI = useCallback(async () => {
        if (!selectedText) return
        const result = await sendTextToAI(selectedText)

        if (result.success) {
            setSelectedText('')
            setSelectionPosition(null)
        }
    }, [selectedText, sendTextToAI])

    return (
        <LayoutGroup>
            <div className="h-screen w-screen overflow-hidden relative animate-app-enter">
                <AppBackground />

                {/* Global Toast Notifications */}
                <ToastContainer />

                <UpdateBanner
                    updateAvailable={updateAvailable}
                    updateInfo={updateInfo}
                    isVisible={isUpdateBannerVisible}
                    onClose={() => setIsUpdateBannerVisible(false)}
                    t={t}
                />

                <main
                    className={`flex h-screen w-screen p-5 ${isLayoutSwapped ? 'flex-row-reverse' : 'flex-row'}`}
                >
                    <LeftPanel
                        panelRef={leftPanelRef}
                        width={leftPanelWidth}
                        activeTab={leftPanelTab}
                        onTabChange={setLeftPanelTab}
                        t={t}
                        onFileSelect={handleFileSelect}
                        pdfFile={pdfFile}
                        onSelectPdf={handleSelectPdf}
                        onTextSelection={handleTextSelection}
                    />

                    <motion.div
                        layout
                        ref={resizerRef}
                        className="resizer"
                        onMouseDown={handleMouseDown}
                        transition={{ layout: { duration: 0.4, ease: "easeInOut" } }}
                        style={{ willChange: 'transform' }}
                    />

                    <motion.div
                        layout
                        className="glass-panel flex-1 min-w-[350px] flex flex-col overflow-hidden"
                        transition={{ layout: { duration: 0.4, ease: "easeInOut" } }}
                        style={{ willChange: 'transform' }}
                    >
                        <AiWebview isResizing={isResizing} isBarHovered={isBarHovered} />
                    </motion.div>
                </main>

                <BottomBar onHoverChange={setIsBarHovered} />

                {selectedText && selectionPosition && (
                    <FloatingButton onClick={handleSendToAI} position={selectionPosition} />
                )}

                <ScreenshotTool
                    isActive={isScreenshotMode}
                    onCapture={handleCapture}
                    onClose={closeScreenshot}
                />

                {/* Usage Assistant (Global Overlay) */}
                <UsageAssistant
                    isActive={isTourActive}
                    onClose={() => setIsTourActive(false)}
                />
            </div>
        </LayoutGroup>
    )
}

export default App
