import React, { useState, useCallback } from 'react'
import PdfViewer from './components/PdfViewer'
import AiWebview from './components/AiWebview'
import BottomBar from './components/BottomBar'
import FloatingButton from './components/FloatingButton'
import ScreenshotTool from './components/ScreenshotTool'

// Context imports
import { useApp } from './context/AppContext'
import { useToast } from './context/ToastContext'
import { useLanguage } from './context/LanguageContext'

// Constants
import { STORAGE_KEYS } from './constants/storageKeys'

// Hook imports
import { usePanelResize } from './hooks'

function App() {
    // Toast notifications
    const { showError, showSuccess, showWarning } = useToast()
    const { t } = useLanguage()

    // Global state context'ten
    const {
        sendTextToAI,
        isScreenshotMode,
        handleCapture,
        closeScreenshot
    } = useApp()

    // Panel resize hook - STORAGE_KEYS sabiti kullanılıyor
    const {
        leftPanelWidth,
        isResizing,
        handleMouseDown,
        leftPanelRef
    } = usePanelResize({
        initialWidth: 50,
        minLeft: 300,
        minRight: 400,
        storageKey: STORAGE_KEYS.LEFT_PANEL_WIDTH
    })

    // Local State - Sadece bu bileşene özgü state'ler
    const [pdfFile, setPdfFile] = useState(null)
    const [selectedText, setSelectedText] = useState('')
    const [selectionPosition, setSelectionPosition] = useState(null)
    const [isBarHovered, setIsBarHovered] = useState(false)

    // Handlers
    const handleSelectPdf = useCallback(async () => {
        if (!window.electronAPI?.selectPdf) {
            showError(t('error_api_unavailable') || 'API kullanılamıyor')
            return
        }
        try {
            const result = await window.electronAPI.selectPdf()
            if (result) {
                setPdfFile(result)
            }
        } catch (error) {
            console.error('PDF seçme hatası:', error)
            // Kullanıcıya hata mesajı göster
            if (error.message?.includes('permission')) {
                showError(t('error_permission') || 'Dosya erişim izni reddedildi')
            } else if (error.message?.includes('corrupt') || error.message?.includes('invalid')) {
                showError(t('error_corrupt_file') || 'PDF dosyası bozuk veya geçersiz')
            } else {
                showError(t('error_pdf_load') || 'PDF yüklenemedi. Lütfen tekrar deneyin.')
            }
        }
    }, [showError, t])

    const handleTextSelection = useCallback((text, position) => {
        setSelectedText(text)
        setSelectionPosition(position)
    }, [])

    const handleSendToAI = useCallback(async () => {
        if (!selectedText) return
        const success = await sendTextToAI(selectedText)
        if (success) {
            setSelectedText('')
            setSelectionPosition(null)
        } else {
            showWarning(t('error_send_failed') || 'Metin gönderilemedi. AI sayfasının yüklendiğinden emin olun.')
        }
    }, [selectedText, sendTextToAI, showWarning, t])

    return (
        <div className="h-screen w-screen overflow-hidden relative">
            {/* Background Blobs */}
            <div className="fixed inset-0 bg-stone-950 z-[-1]">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-900/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-amber-900/20 rounded-full blur-[100px]" />
            </div>

            {/* Main Container - Split View */}
            <div
                className="main-panels-container flex h-screen w-screen p-3 pb-10 gap-2"
                style={{
                    transform: isBarHovered ? 'translateY(-30px)' : 'translateY(0)',
                    transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)'
                }}
            >
                {/* Left Panel - PDF Viewer */}
                <div
                    ref={leftPanelRef}
                    className="glass-panel flex-shrink-0 flex flex-col overflow-hidden"
                    style={{ width: `${leftPanelWidth}%`, minWidth: '300px' }}
                >
                    {/* PdfViewer artık autoSend ve onAutoSendToggle prop'larını almıyor */}
                    {/* Context üzerinden erişiyor */}
                    <PdfViewer
                        pdfFile={pdfFile}
                        onSelectPdf={handleSelectPdf}
                        onTextSelection={handleTextSelection}
                    />
                </div>

                {/* Resizer */}
                <div
                    className={`resizer ${isResizing ? 'dragging' : ''}`}
                    onMouseDown={handleMouseDown}
                />

                {/* Right Panel - AI Webview */}
                <div className="glass-panel flex-1 min-w-[350px] flex flex-col overflow-hidden">
                    {/* AiWebview artık currentAI ve aiSites prop'larını almıyor */}
                    {/* Context üzerinden erişiyor */}
                    <AiWebview />
                </div>
            </div>

            {/* Bottom Bar - artık currentAI ve onAIChange prop'larını almıyor */}
            <BottomBar onHoverChange={setIsBarHovered} />

            {/* Floating Send Button */}
            {selectedText && selectionPosition && (
                <FloatingButton
                    onClick={handleSendToAI}
                    position={selectionPosition}
                />
            )}

            {/* Screenshot Tool */}
            <ScreenshotTool
                isActive={isScreenshotMode}
                onCapture={handleCapture}
                onClose={closeScreenshot}
            />
        </div>
    )
}

export default App
