import React, { useState, useEffect, useRef, memo } from 'react'
import { useApp } from '../../context/AppContext'

// @react-pdf-viewer imports
import { Worker, Viewer, SpecialZoomLevel, ScrollMode } from '@react-pdf-viewer/core'

// PDF.js worker - Vite için ?url ile import
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url'

// PDF Viewer stilleri
import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/page-navigation/lib/styles/index.css'
import '@react-pdf-viewer/zoom/lib/styles/index.css'
import '@react-pdf-viewer/search/lib/styles/index.css'

// Modular Components
import PdfPlaceholder from './PdfPlaceholder'
import PdfToolbar from './PdfToolbar'

// Custom Hooks
import {
    usePdfPlugins,
    usePdfNavigation,
    usePdfTextSelection,
    usePdfScreenshot,
    usePdfContextMenu
} from './hooks'

/**
 * PDF Viewer Ana Bileşeni
 * Modüler hook'lar ve alt bileşenlerle orchestration yapar
 */
function PdfViewer({ pdfFile, onSelectPdf, onTextSelection }) {
    // Context'ten global state'e eriş
    const { autoSend, toggleAutoSend, startScreenshot, sendImageToAI } = useApp()

    // Local state
    const [pdfUrl, setPdfUrl] = useState(null)
    const containerRef = useRef(null)

    // === CUSTOM HOOKS ===

    // Plugin'leri initialize et
    const {
        plugins,
        jumpToPageRef,
        ZoomIn,
        ZoomOut,
        CurrentScale,
        highlight,
        clearHighlights
    } = usePdfPlugins()

    // Sayfa navigasyonu
    const {
        currentPage,
        totalPages,
        handlePageChange,
        handleDocumentLoad,
        goToPreviousPage,
        goToNextPage
    } = usePdfNavigation({
        containerRef,
        jumpToPageRef,
        pdfUrl
    })

    // Screenshot işlemleri
    const { handleFullPageScreenshot } = usePdfScreenshot({
        currentPage,
        sendImageToAI,
        startScreenshot
    })

    // Metin seçimi takibi
    usePdfTextSelection({
        containerRef,
        onTextSelection
    })

    // Sağ tık context menu
    usePdfContextMenu(containerRef)

    // === EFFECTS ===

    // PDF dosyası değiştiğinde URL ayarla
    useEffect(() => {
        if (pdfFile && pdfFile.streamUrl) {
            setPdfUrl(pdfFile.streamUrl)
        }
    }, [pdfFile])

    // === RENDER ===

    // PDF yüklenmemişse placeholder göster
    if (!pdfUrl) {
        return <PdfPlaceholder onSelectPdf={onSelectPdf} />
    }

    // PDF yüklendiğinde viewer göster
    return (
        <div className="flex-1 flex flex-col overflow-hidden h-full min-h-0">
            {/* PDF Viewer Container */}
            <div
                ref={containerRef}
                className="flex-1 overflow-hidden pdf-viewer-container h-full min-h-0"
            >
                <Worker workerUrl={pdfjsWorkerUrl}>
                    <Viewer
                        fileUrl={pdfUrl}
                        plugins={plugins}
                        defaultScale={SpecialZoomLevel.PageWidth}
                        scrollMode={ScrollMode.Page}
                        onPageChange={handlePageChange}
                        onDocumentLoad={handleDocumentLoad}
                        renderError={(error) => {
                            console.error('[PdfViewer] Render error:', error)
                            return (
                                <div className="flex items-center justify-center h-full text-red-500">
                                    <p>PDF yüklenirken hata: {error.message || 'Bilinmeyen hata'}</p>
                                </div>
                            )
                        }}
                        theme={{
                            theme: 'dark',
                        }}
                    />
                </Worker>
            </div>

            {/* Alt Toolbar */}
            <PdfToolbar
                pdfFile={pdfFile}
                onSelectPdf={onSelectPdf}
                onStartScreenshot={startScreenshot}
                onFullPageScreenshot={handleFullPageScreenshot}
                autoSend={autoSend}
                onToggleAutoSend={toggleAutoSend}
                currentPage={currentPage}
                totalPages={totalPages}
                onPreviousPage={goToPreviousPage}
                onNextPage={goToNextPage}
                highlight={highlight}
                clearHighlights={clearHighlights}
                ZoomIn={ZoomIn}
                ZoomOut={ZoomOut}
                CurrentScale={CurrentScale}
            />
        </div>
    )
}

export default memo(PdfViewer)
