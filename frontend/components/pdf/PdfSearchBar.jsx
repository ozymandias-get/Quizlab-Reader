import React, { memo, useRef, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext'

/**
 * PDF search bar component
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
    const { t } = useLanguage()
    const inputRef = useRef(null)

    // Focus input when open
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
                        placeholder={t('search_placeholder')}
                        className="w-full px-3 py-1.5 text-xs bg-stone-800/60 border border-stone-700/50 rounded-lg text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500/50"
                        autoFocus
                    />
                </div>
                <button
                    className="btn-icon"
                    onClick={() => keyword.trim() && onSearch()}
                    title={t('search')}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                </button>
                <button
                    className="btn-icon"
                    onClick={onClear}
                    title={t('close')}
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
            <button
                className="btn-icon"
                onClick={onToggle}
                title={t('search')}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                </svg>
            </button>

            <div className="flex-1 px-3 text-stone-400 text-xs font-medium truncate">
                {fileName || 'PDF'}
            </div>
        </>
    )
}

export default memo(PdfSearchBar)
