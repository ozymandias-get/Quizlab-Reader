import { useState, useCallback, useRef } from 'react'

/**
 * Harici dosya sürükle-bırak işlemlerini yöneten custom hook
 * @param {Function} addFiles - Dosyaları eklemek için callback
 * @returns {Object} Drag-drop state ve event handler'ları
 */
export function useExternalDragDrop(addFiles) {
    const [isExternalDragOver, setIsExternalDragOver] = useState(false)
    const dragCounterRef = useRef(0)
    const containerRef = useRef(null)

    const handleExternalDragEnter = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()

        dragCounterRef.current++

        if (e.dataTransfer.types.includes('Files')) {
            setIsExternalDragOver(true)
        }
    }, [])

    const handleExternalDragOver = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()

        if (e.dataTransfer.types.includes('Files')) {
            e.dataTransfer.dropEffect = 'copy'
        }
    }, [])

    const handleExternalDragLeave = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()

        dragCounterRef.current--

        if (dragCounterRef.current === 0) {
            setIsExternalDragOver(false)
        }
    }, [])

    const handleExternalDrop = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()

        dragCounterRef.current = 0
        setIsExternalDragOver(false)

        const files = Array.from(e.dataTransfer.files)
        const pdfFiles = files.filter(file => file.name.toLowerCase().endsWith('.pdf'))

        if (pdfFiles.length === 0) {
            return
        }

        // Tüm PDF dosyalarını hazırla
        const filesToAdd = pdfFiles.map(file => ({
            name: file.name,
            path: file.path || null,
            size: file.size,
            streamUrl: null
        }))

        // Tek seferde ekle
        addFiles(filesToAdd, null)
    }, [addFiles])

    const resetDragState = useCallback(() => {
        dragCounterRef.current = 0
        setIsExternalDragOver(false)
    }, [])

    return {
        isExternalDragOver,
        containerRef,
        dragHandlers: {
            onDragEnter: handleExternalDragEnter,
            onDragOver: handleExternalDragOver,
            onDragLeave: handleExternalDragLeave,
            onDrop: handleExternalDrop
        },
        resetDragState
    }
}

export default useExternalDragDrop
