import React, { useState, useCallback } from 'react'
import { useFileSystem } from '../../context/FileContext'
import { FolderIcon, PdfIcon, ChevronIcon, TrashIcon, SparklesIcon } from './icons/FileExplorerIcons'

/**
 * Dosya ağacındaki her bir öğeyi render eden bileşen
 * Sürükle-bırak, açılır-kapanır klasörler ve silme işlemlerini destekler
 */
function TreeItem({ item, level = 0, onFileClick, onDeleteItem, onDragComplete }) {
    const isFolder = item.type === 'folder'

    const [isOpen, setIsOpen] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const [isDragOver, setIsDragOver] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const { getChildren, moveItem, addFiles } = useFileSystem()

    const children = isFolder ? getChildren(item.id) : []

    const handleToggle = useCallback(() => {
        if (isFolder) {
            setIsOpen(prev => !prev)
        }
    }, [isFolder])

    const handleClick = useCallback(() => {
        if (!isFolder && onFileClick) {
            onFileClick(item)
        } else {
            handleToggle()
        }
    }, [isFolder, onFileClick, item, handleToggle])

    const handleDelete = useCallback((e) => {
        e.stopPropagation()
        if (onDeleteItem) {
            onDeleteItem(item.id)
        }
    }, [item.id, onDeleteItem])

    // ===== DRAG & DROP =====

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

        // Hedef klasör ID'sini belirle (Klasörse kendisi, dosyaysa parent'ı)
        const targetId = isFolder ? item.id : item.parentId

        // 1. Harici dosya (OS'den sürüklenen) kontrolü
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files)
            const pdfFiles = files.filter(file => file.name.toLowerCase().endsWith('.pdf'))

            if (pdfFiles.length > 0) {
                const filesToAdd = pdfFiles.map(file => ({
                    name: file.name,
                    path: file.path || null,
                    size: file.size,
                    streamUrl: null
                }))

                // Hedef klasöre ekle
                addFiles(filesToAdd, targetId)

                if (isFolder) setIsOpen(true)
            }
            return
        }

        // 2. Dahili öğe taşıma kontrolü
        try {
            const jsonData = e.dataTransfer.getData('application/json')

            if (!jsonData || jsonData.trim() === '') return

            const data = JSON.parse(jsonData)

            if (!data || !data.id) return

            // Kendine veya aynı parent'a taşıma kontrolü
            if (data.id === item.id || data.parentId === targetId) {
                return
            }

            const success = moveItem(data.id, targetId)
            if (success && isFolder) {
                setIsOpen(true)
            }
        } catch (error) {
            // Sessizce başarısız ol
        }
    }, [isFolder, item, moveItem, addFiles, onDragComplete])

    // Dosya boyutunu formatla
    const formatSize = (bytes) => {
        if (!bytes) return ''
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    return (
        <div className="select-none">
            <div
                draggable={true}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    group relative flex items-center gap-2.5 px-3 py-2 mx-1 my-0.5 rounded-xl cursor-pointer
                    transition-all duration-300 ease-out z-10
                    ${isDragging ? 'opacity-40 scale-95 rotate-1' : ''}
                    ${isDragOver
                        ? 'bg-gradient-to-r from-amber-500/30 to-orange-500/20 ring-2 ring-amber-400/60 ring-inset shadow-lg shadow-amber-500/20'
                        : ''
                    }
                    ${isHovered && !isDragOver
                        ? isFolder
                            ? 'bg-gradient-to-r from-stone-800/80 to-stone-800/40'
                            : 'bg-gradient-to-r from-rose-500/10 to-transparent'
                        : ''
                    }
                    ${!isHovered && !isDragOver ? 'hover:bg-stone-800/40' : ''}
                `}
                style={{ marginLeft: `${level * 12}px` }}
                onClick={handleClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Sol kenar çizgisi (level > 0) */}
                {level > 0 && (
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-stone-700/50 to-transparent" />
                )}

                {/* Açılır ok (klasörler için) */}
                {isFolder ? (
                    <button
                        className="p-1 -ml-1 hover:bg-white/10 rounded-lg transition-all duration-200"
                        onClick={(e) => { e.stopPropagation(); handleToggle(); }}
                    >
                        <ChevronIcon isOpen={isOpen} />
                    </button>
                ) : (
                    <span className="w-5" />
                )}

                {/* İkon */}
                <div className="flex-shrink-0">
                    {isFolder ? <FolderIcon isOpen={isOpen || isDragOver} /> : <PdfIcon />}
                </div>

                {/* İsim ve meta bilgi */}
                <div className="flex-1 min-w-0">
                    <span className={`
                        block text-sm font-medium truncate transition-colors duration-200
                        ${isFolder
                            ? isDragOver
                                ? 'text-amber-200'
                                : 'text-stone-200'
                            : 'text-stone-300 group-hover:text-rose-200'
                        }
                    `}>
                        {item.name}
                    </span>
                    {/* Dosya boyutu */}
                    {!isFolder && item.size && (
                        <span className="text-[10px] text-stone-500 font-medium">
                            {formatSize(item.size)}
                        </span>
                    )}
                </div>

                {/* Sağ taraf aksiyonlar */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    {/* Drop göstergesi */}
                    {isFolder && isDragOver && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold bg-amber-500/20 px-2 py-0.5 rounded-full">
                            <SparklesIcon />
                            Bırak
                        </span>
                    )}

                    {/* Silme butonu */}
                    {!isDragOver && (
                        <button
                            className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-rose-500/20 
                                       transition-all duration-200 hover:scale-110"
                            onClick={handleDelete}
                            title="Sil"
                        >
                            <TrashIcon />
                        </button>
                    )}
                </div>

                {/* Hover glow efekti */}
                {isHovered && !isDragOver && (
                    <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none
                        ${isFolder ? 'bg-gradient-to-r from-amber-500/5 to-transparent' : 'bg-gradient-to-r from-rose-500/5 to-transparent'}
                    `} />
                )}
            </div>

            {/* Alt öğeler */}
            {isFolder && isOpen && (
                <div className={`
                    overflow-hidden transition-all duration-300 ease-out
                    ${isOpen ? 'opacity-100' : 'opacity-0'}
                `}>
                    {children.length > 0 ? (
                        children
                            .sort((a, b) => {
                                if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
                                return a.name.localeCompare(b.name, 'tr')
                            })
                            .map(child => (
                                <TreeItem
                                    key={child.id}
                                    item={child}
                                    level={level + 1}
                                    onFileClick={onFileClick}
                                    onDeleteItem={onDeleteItem}
                                    onDragComplete={onDragComplete}
                                />
                            ))
                    ) : (
                        <div
                            className="flex items-center gap-2 text-xs text-stone-600 italic py-3 px-4"
                            style={{ marginLeft: `${(level + 1) * 12 + 16}px` }}
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-stone-700" />
                            Boş klasör
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default TreeItem
