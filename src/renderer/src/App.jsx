import React, { useState, useCallback } from 'react'
import PdfViewer from './components/PdfViewer'
import AiWebview from './components/AiWebview'
import BottomBar from './components/BottomBar'
import FloatingButton from './components/FloatingButton'
import ScreenshotTool from './components/ScreenshotTool'
import FileExplorer from './components/FileExplorer'

// Context imports
import { useApp } from './context/AppContext'
import { useToast } from './context/ToastContext'
import { useLanguage } from './context/LanguageContext'
import { FileProvider } from './context/FileContext'

// Constants
import { STORAGE_KEYS } from './constants/storageKeys'

// Hook imports
import { usePanelResize } from './hooks'

// Sol panel sekme türleri
const LEFT_PANEL_TABS = {
    EXPLORER: 'explorer',
    VIEWER: 'viewer'
}

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
        leftPanelRef,
        resizerRef
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
    const [leftPanelTab, setLeftPanelTab] = useState(LEFT_PANEL_TABS.VIEWER)

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
                // PDF seçildiğinde otomatik olarak görüntüleyici sekmesine geç
                setLeftPanelTab(LEFT_PANEL_TABS.VIEWER)
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

    // FileExplorer'dan dosya seçildiğinde
    const handleFileSelect = useCallback(async (file) => {
        if (file.type !== 'file') return

        // 1. Dosya yolu varsa (yerel dosya), öncelikle stream URL'i yenilemeyi dene
        // Bu, uygulama yeniden başlatıldığında expired olan stream URL'leri (local-pdf://) yeniler
        if (file.path && window.electronAPI?.getPdfStreamUrl) {
            try {
                const result = await window.electronAPI.getPdfStreamUrl(file.path)
                if (result?.streamUrl) {
                    setPdfFile({
                        path: file.path,
                        name: file.name,
                        size: file.size,
                        streamUrl: result.streamUrl
                    })
                    setLeftPanelTab(LEFT_PANEL_TABS.VIEWER)
                    showSuccess(`"${file.name}" açıldı`)
                    return
                }
            } catch (error) {
                console.error('PDF açma hatası:', error)
                // Hata oluşursa (örn. dosya silinmiş), kullanıcıyı uyar
                showError(t('error_pdf_access') || 'Dosyaya erişilemiyor')
                return
            }
        }

        // 2. Fallback: Eğer yol yoksa ama streamUrl varsa (örn. geçici dosya), onu dene
        if (file.streamUrl) {
            setPdfFile({
                path: file.path,
                name: file.name,
                size: file.size,
                streamUrl: file.streamUrl
            })
            setLeftPanelTab(LEFT_PANEL_TABS.VIEWER)
            showSuccess(`"${file.name}" açıldı`)
            return
        }

        showError(t('error_pdf_load') || 'PDF dosyası açılamadı')
    }, [showSuccess, showError, t])

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
        <FileProvider>
            <div className="h-screen w-screen overflow-hidden relative animate-app-enter">
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
                    {/* Left Panel - Tabs + Content */}
                    <div
                        ref={leftPanelRef}
                        className="glass-panel flex-shrink-0 flex flex-col overflow-hidden"
                        style={{ width: `${leftPanelWidth}%`, minWidth: '300px' }}
                    >
                        {/* Sekme Başlıkları - Modern Segmented Control */}
                        <div className="shrink-0 p-4 pb-2">
                            <div className="flex p-1.5 bg-stone-950/60 rounded-xl border border-white/5 backdrop-blur-md shadow-inner">
                                {/* Gezgin Tab */}
                                <button
                                    onClick={() => setLeftPanelTab(LEFT_PANEL_TABS.EXPLORER)}
                                    className={`
                                        flex-1 flex items-center justify-center gap-2.5 py-2.5 rounded-[0.6rem]
                                        text-sm font-semibold transition-all duration-300 relative overflow-hidden group
                                        ${leftPanelTab === LEFT_PANEL_TABS.EXPLORER
                                            ? 'text-amber-100 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/5 border border-amber-500/20 shadow-lg shadow-amber-900/10'
                                            : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50 border border-transparent'
                                        }
                                    `}
                                >
                                    <svg className={`w-4 h-4 transition-transform duration-300 ${leftPanelTab === LEFT_PANEL_TABS.EXPLORER ? 'scale-110' : ''}`} fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
                                    </svg>
                                    <span className="truncate">{t('explorer')}</span>

                                    {/* Active Glow Effect */}
                                    {leftPanelTab === LEFT_PANEL_TABS.EXPLORER && (
                                        <div className="absolute inset-0 bg-amber-400/5 blur-md" />
                                    )}
                                </button>

                                {/* Görüntüleyici Tab */}
                                <button
                                    onClick={() => setLeftPanelTab(LEFT_PANEL_TABS.VIEWER)}
                                    className={`
                                        flex-1 flex items-center justify-center gap-2.5 py-2.5 rounded-[0.6rem]
                                        text-sm font-semibold transition-all duration-300 relative overflow-hidden group
                                        ${leftPanelTab === LEFT_PANEL_TABS.VIEWER
                                            ? 'text-emerald-100 bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 shadow-lg shadow-emerald-900/10'
                                            : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50 border border-transparent'
                                        }
                                    `}
                                >
                                    <svg
                                        className={`w-4 h-4 transition-transform duration-300 ${leftPanelTab === LEFT_PANEL_TABS.VIEWER ? 'scale-110 text-emerald-400' : 'group-hover:scale-105'}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="truncate">{t('viewer')}</span>

                                    {/* Pulse Indicator */}
                                    {pdfFile && (
                                        <span className={`
                                            absolute top-2 right-2 w-1.5 h-1.5 rounded-full 
                                            ${leftPanelTab === LEFT_PANEL_TABS.VIEWER ? 'bg-emerald-400' : 'bg-emerald-500/50'}
                                            animate-pulse
                                        `} />
                                    )}

                                    {/* Active Glow Effect */}
                                    {leftPanelTab === LEFT_PANEL_TABS.VIEWER && (
                                        <div className="absolute inset-0 bg-emerald-400/5 blur-md" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Sekme İçerikleri */}
                        <div className="flex-1 overflow-hidden relative">
                            {/* FileExplorer - Hep render edilir, CSS ile gizlenir */}
                            <div className={`h-full w-full ${leftPanelTab === LEFT_PANEL_TABS.EXPLORER ? 'block' : 'hidden'}`}>
                                <FileExplorer
                                    onFileSelect={handleFileSelect}
                                    className="h-full"
                                />
                            </div>

                            {/* PdfViewer - Hep render edilir, CSS ile gizlenir */}
                            <div className={`h-full w-full ${leftPanelTab === LEFT_PANEL_TABS.VIEWER ? 'block' : 'hidden'}`}>
                                <PdfViewer
                                    pdfFile={pdfFile}
                                    onSelectPdf={handleSelectPdf}
                                    onTextSelection={handleTextSelection}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Resizer */}
                    <div
                        ref={resizerRef}
                        className="resizer"
                        onMouseDown={handleMouseDown}
                    />

                    {/* Right Panel - AI Webview */}
                    <div className="glass-panel flex-1 min-w-[350px] flex flex-col overflow-hidden">
                        {/* AiWebview artık currentAI ve aiSites prop'larını almıyor */}
                        {/* Context üzerinden erişiyor */}
                        <AiWebview isResizing={isResizing} />
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
        </FileProvider>
    )
}

export default App

