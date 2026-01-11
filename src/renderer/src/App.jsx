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
        closeScreenshot,
        updateAvailable,
        updateInfo
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
    const [isUpdateBannerVisible, setIsUpdateBannerVisible] = useState(true)


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
        // Sadece dosyalar açılabilir, klasörler değil
        if (file.type !== 'file') {
            // Klasör seçildi - kullanıcıya bilgi ver
            if (file.type === 'folder') {
                // Klasörler genişletilir, açılmaz - bu bir hata değil
                return
            }
            showWarning(t('error_invalid_file_type') || 'Geçersiz dosya türü')
            return
        }

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
        const result = await sendTextToAI(selectedText)

        // Tutarlı obje dönüşü: { success: boolean, error?: string }
        if (result.success) {
            setSelectedText('')
            setSelectionPosition(null)
        } else if (result.error === 'webview_not_ready') {
            // Webview henüz hazır değil - sayfa yükleniyor
            showWarning(t('error_webview_not_ready') || 'AI sayfası henüz yüklenmiyor. Lütfen sayfanın yüklenmesini bekleyin.')
        } else if (result.error === 'input_not_found') {
            // Input alanı bulunamadı
            showWarning(t('error_input_not_found') || 'AI giriş alanı bulunamadı. Sayfayı yenileyin.')
        } else {
            // Diğer hatalar
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

                {/* Güncelleme Bildirimi Banner */}
                {updateAvailable && updateInfo && isUpdateBannerVisible && (
                    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[90] max-w-2xl w-full mx-4 animate-in slide-in-from-top-4 fade-in duration-500">
                        <div className="bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-emerald-500/5 backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-2xl shadow-emerald-900/20 p-4 flex items-start gap-4">
                            {/* İkon */}
                            <div className="flex-shrink-0 w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>

                            {/* İçerik */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-emerald-100 font-semibold text-sm mb-1">
                                            {t('update_available') || 'Yeni Güncelleme Mevcut!'}
                                        </h3>
                                        <p className="text-stone-400 text-xs leading-relaxed">
                                            {t('new_version') || 'Versiyon'} <span className="text-emerald-400 font-medium">{updateInfo.version}</span> {t('is_available') || 'indirebilirsiniz'}
                                            {updateInfo.releaseName && (
                                                <span className="block mt-1 text-stone-500">{updateInfo.releaseName}</span>
                                            )}
                                        </p>
                                    </div>

                                    {/* Kapat Butonu */}
                                    <button
                                        onClick={() => setIsUpdateBannerVisible(false)}
                                        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-stone-800/50 transition-colors text-stone-500 hover:text-stone-300"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Aksiyon Butonları */}
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={async () => {
                                            if (window.electronAPI?.openReleasesPage) {
                                                await window.electronAPI.openReleasesPage()
                                            } else {
                                                window.open('https://github.com/ozymandias-get/Quizlab-Reader/releases', '_blank')
                                            }
                                        }}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-medium rounded-lg transition-all hover:scale-105"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                        </svg>
                                        {t('download_from_github') || 'GitHub\'dan İndir'}
                                    </button>
                                    <button
                                        onClick={() => setIsUpdateBannerVisible(false)}
                                        className="px-3 py-1.5 hover:bg-stone-800/50 text-stone-400 hover:text-stone-300 text-xs font-medium rounded-lg transition-colors"
                                    >
                                        {t('later') || 'Sonra'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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

