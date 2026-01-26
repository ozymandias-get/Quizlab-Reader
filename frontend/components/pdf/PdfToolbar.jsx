import React, { memo, useState, useCallback } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import PdfSearchBar from './PdfSearchBar'
import {
    SelectPdfIcon,
    ScreenshotIcon,
    FullPageScreenshotIcon,
    AutoSendIcon,
    PrevPageIcon,
    NextPageIcon,
    ZoomInIcon,
    ZoomOutIcon
} from '../Icons'

/**
 * PDF bottom toolbar component
 */
function PdfToolbar({
    pdfFile,
    onSelectPdf,
    onStartScreenshot,
    onFullPageScreenshot,
    autoSend,
    onToggleAutoSend,
    currentPage,
    totalPages,
    onPreviousPage,
    onNextPage,
    highlight,
    clearHighlights,
    ZoomIn,
    ZoomOut,
    CurrentScale
}) {
    const { t } = useLanguage()
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [searchKeyword, setSearchKeyword] = useState('')

    const handleSearch = useCallback(() => {
        if (searchKeyword.trim()) {
            highlight(searchKeyword)
        }
    }, [searchKeyword, highlight])

    const handleClearSearch = useCallback(() => {
        setIsSearchOpen(false)
        setSearchKeyword('')
        clearHighlights()
    }, [clearHighlights])

    return (
        <div className="pdf-bottom-toolbar flex-shrink-0">
            {/* Left: Actions */}
            <button
                className="btn-icon"
                onClick={onSelectPdf}
                title={t('select_pdf')}
            >
                <SelectPdfIcon width="16" height="16" />
            </button>

            <button
                className="btn-icon text-amber-500"
                onClick={onStartScreenshot}
                title={t('screenshot')}
            >
                <ScreenshotIcon width="16" height="16" />
            </button>

            <button
                className="btn-icon text-emerald-500"
                onClick={onFullPageScreenshot}
                title={t('full_page_screenshot')}
            >
                <FullPageScreenshotIcon width="16" height="16" />
            </button>

            <button
                className={`btn-icon ${autoSend ? 'text-green-400' : ''}`}
                onClick={onToggleAutoSend}
                title={autoSend ? t('auto_send_on') : t('auto_send_off')}
            >
                <AutoSendIcon width="16" height="16" />
            </button>

            {/* Search */}
            <PdfSearchBar
                isOpen={isSearchOpen}
                onToggle={() => setIsSearchOpen(true)}
                keyword={searchKeyword}
                onKeywordChange={setSearchKeyword}
                onSearch={handleSearch}
                onClear={handleClearSearch}
                fileName={pdfFile?.name}
            />

            {/* Navigation */}
            <div className="flex items-center gap-2">
                <button
                    className="btn-icon"
                    onClick={onPreviousPage}
                    disabled={currentPage <= 1}
                    title={t('prev_page')}
                >
                    <PrevPageIcon width="14" height="14" />
                </button>

                <span className="text-stone-300 text-sm font-medium min-w-[60px] text-center">
                    {currentPage} / {totalPages}
                </span>

                <button
                    className="btn-icon"
                    onClick={onNextPage}
                    disabled={currentPage >= totalPages}
                    title={t('next_page')}
                >
                    <NextPageIcon width="14" height="14" />
                </button>
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-1 ml-3 border-l border-stone-700/50 pl-3">
                <ZoomOut>
                    {(props) => (
                        <button className="btn-icon" onClick={props.onClick} title={t('zoom_out')}>
                            <ZoomOutIcon width="14" height="14" />
                        </button>
                    )}
                </ZoomOut>

                <CurrentScale>
                    {(props) => (
                        <span className="text-stone-400 text-xs font-medium min-w-[40px] text-center">
                            {Math.round(props.scale * 100)}%
                        </span>
                    )}
                </CurrentScale>

                <ZoomIn>
                    {(props) => (
                        <button className="btn-icon" onClick={props.onClick} title={t('zoom_in')}>
                            <ZoomInIcon width="14" height="14" />
                        </button>
                    )}
                </ZoomIn>
            </div>
        </div>
    )
}

export default memo(PdfToolbar)
