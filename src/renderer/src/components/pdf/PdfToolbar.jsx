import React, { memo, useState, useCallback } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import PdfSearchBar from './PdfSearchBar'

/**
 * PDF alt toolbar bileşeni
 * Tüm PDF kontrolleri: navigasyon, zoom, arama, screenshot vb.
 */
function PdfToolbar({
    // File & Selection
    pdfFile,
    onSelectPdf,

    // Screenshot
    onStartScreenshot,
    onFullPageScreenshot,

    // Auto Send
    autoSend,
    onToggleAutoSend,

    // Navigation
    currentPage,
    totalPages,
    onPreviousPage,
    onNextPage,

    // Search
    highlight,
    clearHighlights,

    // Zoom
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

    const handleToggleSearch = useCallback(() => {
        setIsSearchOpen(true)
    }, [])

    return (
        <div className="pdf-bottom-toolbar flex-shrink-0">
            {/* Sol - PDF Seç, Screenshot, Auto Send */}
            <button
                className="btn-icon"
                onClick={onSelectPdf}
                title={t('select_pdf')}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" />
                    <path d="M17 8L12 3L7 8" />
                    <path d="M12 3V15" />
                </svg>
            </button>

            {/* Ekran Görüntüsü */}
            <button
                className="btn-icon text-amber-500"
                onClick={onStartScreenshot}
                title={t('screenshot')}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M8 8h8v8H8z" strokeDasharray="2 2" />
                </svg>
            </button>

            {/* Tam Sayfa Görüntüsü */}
            <button
                className="btn-icon text-emerald-500"
                onClick={onFullPageScreenshot}
                title="Tam Sayfa Görüntüsü Al"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="1.8"></path>
                    <path d="M14 2v6h6" strokeWidth="1.8"></path>
                    <rect x="8" y="11" width="8" height="6" rx="1" strokeWidth="1.5"></rect>
                    <circle cx="12" cy="14" r="1.5" fill="currentColor"></circle>
                </svg>
            </button>

            {/* Otomatik Gönder Toggle */}
            <button
                className={`btn-icon ${autoSend ? 'text-green-400' : ''}`}
                onClick={onToggleAutoSend}
                title={autoSend ? t('auto_send_on') : t('auto_send_off')}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2L11 13" />
                    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
            </button>

            {/* Arama */}
            <PdfSearchBar
                isOpen={isSearchOpen}
                onToggle={handleToggleSearch}
                keyword={searchKeyword}
                onKeywordChange={setSearchKeyword}
                onSearch={handleSearch}
                onClear={handleClearSearch}
                fileName={pdfFile?.name}
            />

            {/* Sayfa Navigasyonu */}
            <div className="flex items-center gap-2">
                <button
                    className="btn-icon"
                    onClick={onPreviousPage}
                    disabled={currentPage <= 1}
                    title="Önceki Sayfa"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>

                <span className="text-stone-300 text-sm font-medium min-w-[60px] text-center">
                    {currentPage} / {totalPages}
                </span>

                <button
                    className="btn-icon"
                    onClick={onNextPage}
                    disabled={currentPage >= totalPages}
                    title="Sonraki Sayfa"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </button>
            </div>

            {/* Zoom Kontrolleri */}
            <div className="flex items-center gap-1 ml-3 border-l border-stone-700/50 pl-3">
                <ZoomOut>
                    {(props) => (
                        <button className="btn-icon" onClick={props.onClick} title="Küçült">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M8 11h6" />
                            </svg>
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
                        <button className="btn-icon" onClick={props.onClick} title="Büyüt">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M11 8v6M8 11h6" />
                            </svg>
                        </button>
                    )}
                </ZoomIn>
            </div>
        </div>
    )
}

export default memo(PdfToolbar)
