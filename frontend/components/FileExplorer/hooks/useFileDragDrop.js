import { useState, useCallback } from 'react'
import { useFileSystem } from '../../../context/FileContext'

/**
 * TreeItem için sürükle-bırak mantığını yöneten custom hook
 * Hem dahili öğe taşımayı hem de harici dosya bırakmayı destekler
 * 
 * @param {Object} item - Üzerinde işlem yapılan öğe
 * @param {Function} onDragComplete - İşlem tamamlandığında çalışacak callback
 * @returns {Object} DND state ve handler'ları
 */
export function useFileDragDrop(item, onDragComplete) {
    const [isDragging, setIsDragging] = useState(false)
    const [isDragOver, setIsDragOver] = useState(false)
    const { moveItem, addFiles } = useFileSystem()

    const isFolder = item.type === 'folder'
    // Eylem hedefi: Klasörse kendisi, dosyaysa parent'ı
    const targetId = isFolder ? item.id : item.parentId

    const handleDragStart = useCallback((e) => {
        setIsDragging(true)
        e.dataTransfer.setData('application/json', JSON.stringify({
            id: item.id,
            type: item.type,
            name: item.name,
            parentId: item.parentId
        }))
        e.dataTransfer.effectAllowed = 'move'
    }, [item])

    const handleDragEnd = useCallback(() => {
        setIsDragging(false)
    }, [])

    const handleDragOver = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()

        // Harici dosyalar için 'copy', dahili için 'move'
        if (e.dataTransfer.types.includes('Files')) {
            e.dataTransfer.dropEffect = 'copy'
        } else {
            e.dataTransfer.dropEffect = 'move'
        }

        setIsDragOver(true)
    }, [])

    const handleDragLeave = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(false)
    }, [])

    const handleDrop = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(false)

        if (onDragComplete) onDragComplete()

        // 1. Harici dosya (OS'den sürüklenen) kontrolü
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files)
            const pdfFiles = files.filter(f => f.name.toLowerCase().endsWith('.pdf'))

            if (pdfFiles.length > 0) {
                const filesToAdd = pdfFiles.map(f => ({
                    name: f.name,
                    path: f.path || null,
                    size: f.size,
                    streamUrl: null
                }))
                addFiles(filesToAdd, targetId)
            }
            return
        }

        // 2. Dahili öğe taşıma
        try {
            const jsonData = e.dataTransfer.getData('application/json')
            if (!jsonData) return

            const data = JSON.parse(jsonData)
            if (!data?.id || data.id === item.id || data.parentId === targetId) return

            moveItem(data.id, targetId)
        } catch (error) {
            console.error('Drop error:', error)
        }
    }, [item.id, targetId, addFiles, moveItem, onDragComplete])

    return {
        isDragging,
        isDragOver,
        dragHandlers: {
            onDragStart: handleDragStart,
            onDragEnd: handleDragEnd,
            onDragOver: handleDragOver,
            onDragLeave: handleDragLeave,
            onDrop: handleDrop
        }
    }
}
