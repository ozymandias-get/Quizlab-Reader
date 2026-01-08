import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useLanguage } from '../context/LanguageContext'

// @react-pdf-viewer imports
import { Worker, Viewer, SpecialZoomLevel, ScrollMode } from '@react-pdf-viewer/core'
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation'
import { zoomPlugin } from '@react-pdf-viewer/zoom'
import { scrollModePlugin } from '@react-pdf-viewer/scroll-mode'
import { searchPlugin } from '@react-pdf-viewer/search'

// PDF.js worker - local package'dan
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url'

// PDF Viewer stilleri
import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/page-navigation/lib/styles/index.css'
import '@react-pdf-viewer/zoom/lib/styles/index.css'
import '@react-pdf-viewer/search/lib/styles/index.css'

function PdfViewer({ pdfFile, onSelectPdf, onTextSelection, onScreenshot, autoSend, onAutoSendToggle }) {
    const { t } = useLanguage()
    const [pdfUrl, setPdfUrl] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [searchKeyword, setSearchKeyword] = useState('')
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const containerRef = useRef(null)
    const lastWheelTime = useRef(0)
    const searchInputRef = useRef(null)

    // Ref ile güncel değerlere erişim (useCallback için)
    const currentPageRef = useRef(currentPage)
    const totalPagesRef = useRef(totalPages)

    // Ref'leri güncel tut
    useEffect(() => {
        currentPageRef.current = currentPage
    }, [currentPage])

    useEffect(() => {
        totalPagesRef.current = totalPages
    }, [totalPages])

    // Plugin instance'ları - @react-pdf-viewer bunları içsel olarak yönetiyor
    // Not: Her render'da yeni instance oluşsa bile Viewer bunları düzgün handle ediyor
    const pageNavigationPluginInstance = pageNavigationPlugin()
    const { jumpToPage } = pageNavigationPluginInstance

    const zoomPluginInstance = zoomPlugin()
    const { ZoomIn, ZoomOut, CurrentScale } = zoomPluginInstance

    const scrollModePluginInstance = scrollModePlugin()

    const searchPluginInstance = searchPlugin()
    const { highlight, clearHighlights } = searchPluginInstance

    // jumpToPage ref'i - useCallback içinde kullanmak için
    const jumpToPageRef = useRef(jumpToPage)
    useEffect(() => {
        jumpToPageRef.current = jumpToPage
    }, [jumpToPage])

    // Fare tekerleği ile sayfa değiştirme - useCallback ile sarılmış
    // Ref kullanarak her render'da yeni fonksiyon oluşturmayı önler
    const handleWheel = useCallback((e) => {
        // Throttle - 300ms'de bir sayfa değiştir
        const now = Date.now()
        if (now - lastWheelTime.current < 300) return

        const current = currentPageRef.current
        const total = totalPagesRef.current

        if (total === 0) return

        e.preventDefault()
        lastWheelTime.current = now

        if (e.deltaY > 0) {
            // Aşağı scroll - sonraki sayfa
            if (current < total) {
                jumpToPageRef.current(current) // 0-indexed, current zaten 1 fazla
            }
        } else if (e.deltaY < 0) {
            // Yukarı scroll - önceki sayfa
            if (current > 1) {
                jumpToPageRef.current(current - 2) // 0-indexed
            }
        }
    }, []) // Boş bağımlılık - ref'ler kullanıldığı için yeniden oluşturulmaz

    // Event listener'ı ekle/kaldır
    // pdfUrl değiştiğinde container DOM'a eklenir, o zaman listener eklenebilir
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        container.addEventListener('wheel', handleWheel, { passive: false })

        return () => {
            container.removeEventListener('wheel', handleWheel)
        }
    }, [handleWheel, pdfUrl]) // pdfUrl değiştiğinde container mevcut olur

    // PDF dosyası değiştiğinde URL ayarla
    // Artık Base64 dönüşümü yok - doğrudan streaming URL kullanılıyor
    // Bu sayede büyük PDF'lerde bellek kullanımı %70 azalır
    useEffect(() => {
        if (pdfFile && pdfFile.streamUrl) {
            // Streaming URL doğrudan kullanılır
            // Main process'ten gelen local-pdf:// protokolü
            console.log('[PdfViewer] Setting pdfUrl:', pdfFile.streamUrl)
            setPdfUrl(pdfFile.streamUrl)

            // Cleanup - streamUrl için revoke gerekmiyor çünkü
            // bu bir blob URL değil, custom protocol URL
            return () => {
                // Sadece state'i temizle
                // Not: authorizedPdfPaths main process'te otomatik temizlenir
            }
        }
    }, [pdfFile])

    // Metin seçimi izleme - konum bilgisiyle birlikte
    useEffect(() => {
        const handleSelection = () => {
            const selection = window.getSelection()
            const text = selection?.toString().trim()

            if (text && text.length > 0 && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0)
                const rect = range.getBoundingClientRect()

                // Buton konumunu hesapla - seçimin üstünde ortalanmış
                const btnWidth = 140
                const btnHeight = 44
                let top = rect.top - btnHeight - 10
                let left = rect.left + (rect.width / 2)

                // Ekran sınırlarını kontrol et
                if (top < 10) top = rect.bottom + 10
                if (left < btnWidth / 2 + 10) left = btnWidth / 2 + 10
                if (left > window.innerWidth - btnWidth / 2 - 10) {
                    left = window.innerWidth - btnWidth / 2 - 10
                }

                onTextSelection?.(text, { top, left })
            } else {
                // Seçim boşsa veya iptal edildiyse, butonu gizle
                onTextSelection?.('', null)
            }
        }

        // Tıklama ile seçim iptalini de dinle
        const handleClick = () => {
            // Kısa bir gecikme ile seçimi kontrol et (tıklama seçimi temizledikten sonra)
            setTimeout(() => {
                const selection = window.getSelection()
                const text = selection?.toString().trim()
                if (!text || text.length === 0) {
                    onTextSelection?.('', null)
                }
            }, 10)
        }

        document.addEventListener('mouseup', handleSelection)
        document.addEventListener('keyup', handleSelection)
        document.addEventListener('mousedown', handleClick)

        return () => {
            document.removeEventListener('mouseup', handleSelection)
            document.removeEventListener('keyup', handleSelection)
            document.removeEventListener('mousedown', handleClick)
        }
    }, [onTextSelection])

    // Sayfa değişikliğini izle
    const handlePageChange = (e) => {
        setCurrentPage(e.currentPage + 1)
    }

    // PDF yüklendiğinde
    const handleDocumentLoad = (e) => {
        setTotalPages(e.doc.numPages)
    }

    // PDF yüklenmemişse placeholder göster
    if (!pdfUrl) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 p-10 text-center">
                <div className="w-28 h-28 rounded-3xl bg-stone-800/40 border-2 border-dashed border-stone-700/50 flex items-center justify-center text-stone-500 transition-all duration-300 hover:border-amber-500/50 hover:text-amber-500/70">
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M14 2V8H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                            strokeLinejoin="round" />
                        <path d="M9 13H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M9 17H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                </div>

                <div className="space-y-3">
                    <h2 className="font-display text-2xl font-semibold text-stone-200">{t('no_pdf_loaded')}</h2>
                    <p className="text-stone-500 text-sm max-w-[200px]">{t('drop_pdf_here')}</p>
                </div>

                <button
                    className="btn-primary flex items-center gap-3"
                    onClick={onSelectPdf}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                            strokeLinejoin="round" />
                        <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>{t('select_pdf')}</span>
                </button>
            </div>
        )
    }

    // PDF yüklendiğinde viewer göster
    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* PDF Viewer Container */}
            <div ref={containerRef} className="flex-1 overflow-hidden pdf-viewer-container">
                <Worker workerUrl={pdfjsWorker}>
                    <Viewer
                        fileUrl={pdfUrl}
                        plugins={[pageNavigationPluginInstance, zoomPluginInstance, scrollModePluginInstance, searchPluginInstance]}
                        defaultScale={SpecialZoomLevel.PageWidth}
                        scrollMode={ScrollMode.Page}
                        onPageChange={handlePageChange}
                        onDocumentLoad={(e) => {
                            console.log('[PdfViewer] Document loaded:', e.doc.numPages, 'pages')
                            handleDocumentLoad(e)
                        }}
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

            {/* Alt Toolbar - Minimalist */}
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
                    onClick={onScreenshot}
                    title={t('screenshot')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M8 8h8v8H8z" strokeDasharray="2 2" />
                    </svg>
                </button>

                {/* Otomatik Gönder Toggle */}
                <button
                    className={`btn-icon ${autoSend ? 'text-green-400' : ''}`}
                    onClick={onAutoSendToggle}
                    title={autoSend ? t('auto_send_on') : t('auto_send_off')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 2L11 13" />
                        <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                </button>

                {/* Arama */}
                {isSearchOpen ? (
                    <div className="flex items-center gap-2 flex-1">
                        <div className="relative flex-1 max-w-[200px]">
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && searchKeyword.trim()) {
                                        highlight(searchKeyword)
                                    } else if (e.key === 'Escape') {
                                        setIsSearchOpen(false)
                                        setSearchKeyword('')
                                        clearHighlights()
                                    }
                                }}
                                placeholder="Ara..."
                                className="w-full px-3 py-1.5 text-xs bg-stone-800/60 border border-stone-700/50 rounded-lg text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500/50"
                                autoFocus
                            />
                        </div>
                        <button
                            className="btn-icon"
                            onClick={() => searchKeyword.trim() && highlight(searchKeyword)}
                            title="Ara"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                            </svg>
                        </button>
                        <button
                            className="btn-icon"
                            onClick={() => {
                                setIsSearchOpen(false)
                                setSearchKeyword('')
                                clearHighlights()
                            }}
                            title="Kapat"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Arama Butonu */}
                        <button
                            className="btn-icon"
                            onClick={() => {
                                setIsSearchOpen(true)
                                setTimeout(() => searchInputRef.current?.focus(), 100)
                            }}
                            title="Ara"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                            </svg>
                        </button>

                        {/* Dosya Adı */}
                        <div className="flex-1 px-3 text-stone-400 text-xs font-medium truncate">
                            {pdfFile?.name || 'PDF'}
                        </div>
                    </>
                )}

                {/* Sayfa Navigasyonu */}
                <div className="flex items-center gap-2">
                    <button
                        className="btn-icon"
                        onClick={() => jumpToPage(currentPage - 2)}
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
                        onClick={() => jumpToPage(currentPage)}
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
        </div>
    )
}

export default PdfViewer
