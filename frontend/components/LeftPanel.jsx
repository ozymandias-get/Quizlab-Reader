import React, { memo, Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { APP_CONSTANTS } from '../constants/appConstants'
import { useLanguage } from '../context/LanguageContext'

const { LEFT_PANEL_TABS } = APP_CONSTANTS

import { Worker } from '@react-pdf-viewer/core'
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url'
import ErrorBoundary from './ErrorBoundary'

// Lazy Load Components
const FileExplorer = lazy(() => import('./FileExplorer'))
const PdfViewer = lazy(() => import('./pdf/PdfViewer'))

function LeftPanel({
    panelRef,
    width,
    activeTab,
    // FileExplorer props
    onFileSelect,
    // PdfViewer props
    pdfFile,
    onSelectPdf,
    onTextSelection
}) {
    const { t } = useLanguage()

    return (
        <motion.div
            layout
            ref={panelRef}
            className="glass-panel flex-shrink-0 flex flex-col overflow-hidden min-w-[300px]"
            style={{ width: `${width}%`, willChange: 'width, transform' }}
            transition={{ layout: { duration: 0.4, ease: "easeInOut" } }} // Özel layout geçişi
        >
            <ErrorBoundary title={t('error_pdf_handler')}>
                <Worker workerUrl={pdfjsWorkerUrl}>
                    {/* Tab Contents - Now Full Screen without Header */}
                    <div className="flex-1 overflow-hidden relative">
                        <Suspense fallback={
                            <div className="flex items-center justify-center h-full">
                                <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-amber-500 animate-spin" />
                            </div>
                        }>
                            {/* FileExplorer */}
                            {activeTab === LEFT_PANEL_TABS.EXPLORER && (
                                <div className="absolute inset-0 w-full h-full animate-in fade-in duration-300">
                                    <ErrorBoundary title={t('error_file_explorer')}>
                                        <FileExplorer
                                            onFileSelect={onFileSelect}
                                            className="h-full"
                                        />
                                    </ErrorBoundary>
                                </div>
                            )}

                            {/* PdfViewer */}
                            {activeTab === LEFT_PANEL_TABS.VIEWER && (
                                <div className="absolute inset-0 w-full h-full animate-in fade-in duration-300">
                                    <ErrorBoundary title={t('error_pdf_viewer')}>
                                        <PdfViewer
                                            pdfFile={pdfFile}
                                            onSelectPdf={onSelectPdf}
                                            onTextSelection={onTextSelection}
                                            t={t}
                                        />
                                    </ErrorBoundary>
                                </div>
                            )}
                        </Suspense>
                    </div>
                </Worker>
            </ErrorBoundary>
        </motion.div>
    )
}

export default memo(LeftPanel)

