import React, { memo, useRef, useEffect } from 'react'

/**
 * PDF arama çubuğu bileşeni
 * @param {Object} props
 * @param {boolean} props.isOpen - Arama çubuğu açık mı
 * @param {Function} props.onToggle - Arama çubuğunu aç/kapat
 * @param {string} props.keyword - Arama kelimesi
 * @param {Function} props.onKeywordChange - Arama kelimesi değiştiğinde
 * @param {Function} props.onSearch - Arama yap
 * @param {Function} props.onClear - Aramayı temizle
 * @param {string} props.fileName - Gösterilecek dosya adı
 */
function PdfSearchBar({
    isOpen,
    onToggle,
    keyword,
    onKeywordChange,
    onSearch,
    onClear,
    fileName
}) {
    const inputRef = useRef(null)

    // Arama açıldığında input'a focus
    useEffect(() => {
        if (isOpen) {
            const timeout = setTimeout(() => inputRef.current?.focus(), 100)
            return () => clearTimeout(timeout)
        }
    }, [isOpen])

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && keyword.trim()) {
            onSearch()
        } else if (e.key === 'Escape') {
            onClear()
        }
    }

    const handleClose = () => {
        onClear()
    }

    if (isOpen) {
        return (
            <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-[200px]">
                    <input
                        ref={inputRef}
                        type="text"
                        value={keyword}
                        onChange={(e) => onKeywordChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ara..."
                        className="w-full px-3 py-1.5 text-xs bg-stone-800/60 border border-stone-700/50 rounded-lg text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500/50"
                        autoFocus
                    />
                </div>
                <button
                    className="btn-icon"
                    onClick={() => keyword.trim() && onSearch()}
                    title="Ara"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                </button>
                <button
                    className="btn-icon"
                    onClick={handleClose}
                    title="Kapat"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>
        )
    }

    return (
        <>
            {/* Arama Butonu */}
            <button
                className="btn-icon"
                onClick={onToggle}
                title="Ara"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                </svg>
            </button>

            {/* Dosya Adı */}
            <div className="flex-1 px-3 text-stone-400 text-xs font-medium truncate">
                {fileName || 'PDF'}
            </div>
        </>
    )
}

export default memo(PdfSearchBar)
