import React, { useState, useEffect, useRef, memo } from 'react'
import { useAi, useAppTools, useLanguage } from '../../context'

// @react-pdf-viewer imports
import { Viewer, SpecialZoomLevel, ScrollMode } from '@react-pdf-viewer/core'

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
 * PDF Viewer Main Component
 * Orchestrates modular hooks and sub-components.
 * Virtualization is enabled by default in react-pdf-viewer, but 
 * optimized here with Worker and stable plugin references.
 */
function PdfViewer({ pdfFile, onSelectPdf, onTextSelection, t: propT }) {
    const { autoSend, toggleAutoSend, sendImageToAI } = useAi()
    const { startScreenshot } = useAppTools()
    const { t: contextT } = useLanguage()
    const t = propT || contextT || ((k) => k)

    // Local state
    const containerRef = useRef(null)

    // Derived state
    const pdfUrl = pdfFile?.streamUrl

    // === CUSTOM HOOKS ===
    const {
        plugins,
        jumpToPageRef,
        ZoomIn,
        ZoomOut,
        CurrentScale,
        highlight,
        clearHighlights
    } = usePdfPlugins()

    const {
        currentPage,
        totalPages,
        handlePageChange,
        handleDocumentLoad,
        goToPreviousPage,
        goToNextPage
    } = usePdfNavigation({
        containerRef,
        jumpToPageRef
    })

    const { handleFullPageScreenshot } = usePdfScreenshot({
        currentPage,
        sendImageToAI,
        startScreenshot
    })

    usePdfTextSelection({
        containerRef,
        onTextSelection
    })

    usePdfContextMenu(containerRef, t)

    // === RENDER ===
    if (!pdfUrl) {
        return <PdfPlaceholder onSelectPdf={onSelectPdf} />
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden h-full min-h-0">
            <div
                ref={containerRef}
                className="flex-1 overflow-hidden pdf-viewer-container h-full min-h-0 relative flex flex-col"
                style={{ '--scale-factor': '1' }}
                onWheel={(e) => {
                    // Ctrl+wheel zoom'u tamamen devre dışı bırak
                    // Sadece UI üzerindeki +/- butonlarıyla zoom yapılabilir
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault()
                        e.stopPropagation()
                    }
                }}
            >
                <Viewer
                    fileUrl={pdfUrl}
                    plugins={plugins}
                    defaultScale={SpecialZoomLevel.PageWidth}
                    scrollMode={ScrollMode.Page}
                    onPageChange={handlePageChange}
                    onDocumentLoad={handleDocumentLoad}
                    renderError={(error) => (
                        <div className="flex items-center justify-center h-full text-red-500 p-8 text-center bg-stone-950/50 backdrop-blur-sm">
                            <p>{t('pdf_load_error')}: {error.message || t('error_unknown_error')}</p>
                        </div>
                    )}
                    theme={{
                        theme: 'dark',
                    }}
                />
            </div>

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
