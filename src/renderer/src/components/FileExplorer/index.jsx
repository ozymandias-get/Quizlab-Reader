import React, { useState, useCallback } from 'react'
import { useFileSystem } from '../../context/FileContext'

// Alt bileşenler
import TreeItem from './TreeItem'
import DeleteConfirmModal from './DeleteConfirmModal'
import FileExplorerHeader from './FileExplorerHeader'
import FileExplorerFooter from './FileExplorerFooter'
import NewFolderInput from './NewFolderInput'
import EmptyState from './EmptyState'
import DropOverlay from './DropOverlay'

// Hook'lar
import { useExternalDragDrop } from './hooks/useExternalDragDrop'

/**
 * FileExplorer - Modern dosya gezgini bileşeni
 * Premium glassmorphism tasarım, animasyonlar ve sürükle-bırak desteği
 */
function FileExplorer({ onFileSelect, className = '' }) {
    const { fileSystem, addFolder, addFile, addFiles, deleteItem, getItemById, getRootItems, clearAll } = useFileSystem()
    const [isAddingFolder, setIsAddingFolder] = useState(false)
    const [newFolderName, setNewFolderName] = useState('')

    // Harici drag-drop hook'u
    const { isExternalDragOver, containerRef, dragHandlers, resetDragState } = useExternalDragDrop(addFiles)

    // En üst seviyedeki öğeleri al (parentId === null)
    const rootItems = getRootItems()

    // ===== FOLDER İŞLEMLERİ =====

    const handleAddFolder = useCallback(() => {
        if (newFolderName.trim()) {
            addFolder(newFolderName.trim(), null)
            setNewFolderName('')
            setIsAddingFolder(false)
        }
    }, [newFolderName, addFolder])

    const handleCancelFolder = useCallback(() => {
        setIsAddingFolder(false)
        setNewFolderName('')
    }, [])

    // ===== PDF EKLEME =====

    const handleAddPdf = useCallback(async () => {
        try {
            if (window.electronAPI?.selectPdf) {
                const result = await window.electronAPI.selectPdf()
                if (!result) return

                addFile({
                    name: result.name,
                    path: result.path,
                    size: result.size,
                    streamUrl: result.streamUrl
                }, null)
            } else {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = '.pdf'
                input.onchange = (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                        addFile({
                            name: file.name,
                            path: file.path || null,
                            size: file.size
                        }, null)
                    }
                }
                input.click()
            }
        } catch (error) {
            console.error('PDF ekleme hatası:', error)
        }
    }, [addFile])

    // ===== DOSYA SEÇİMİ =====

    const handleFileClick = useCallback((item) => {
        if (onFileSelect) {
            onFileSelect(item)
        }
    }, [onFileSelect])

    // ===== SİLME İŞLEMLERİ =====

    const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: 'single', itemId: null, itemName: '' })

    const handleDeleteItem = useCallback((itemId) => {
        const item = getItemById(itemId)
        if (item) {
            setDeleteModal({ isOpen: true, type: 'single', itemId, itemName: item.name })
        }
    }, [getItemById])

    const handleClearAllClick = useCallback(() => {
        setDeleteModal({ isOpen: true, type: 'all', itemId: null, itemName: 'Tüm Dosyalar' })
    }, [])

    const confirmDelete = useCallback(() => {
        if (deleteModal.type === 'all') {
            clearAll()
        } else if (deleteModal.itemId) {
            deleteItem(deleteModal.itemId)
        }
        setDeleteModal({ isOpen: false, type: 'single', itemId: null, itemName: '' })
    }, [deleteItem, clearAll, deleteModal])

    const cancelDelete = useCallback(() => {
        setDeleteModal({ isOpen: false, type: 'single', itemId: null, itemName: '' })
    }, [])

    // ===== İSTATİSTİKLER =====

    const fileCount = fileSystem.filter(i => i.type === 'file').length
    const folderCount = fileSystem.filter(i => i.type === 'folder').length

    return (
        <div
            className={`
                flex flex-col h-full
                bg-gradient-to-b from-stone-900/95 via-stone-900/90 to-stone-950
                overflow-hidden relative
                ${className}
            `}
            ref={containerRef}
            {...dragHandlers}
        >
            {/* Drop Overlay */}
            <DropOverlay isVisible={isExternalDragOver} />

            {/* Başlık */}
            <FileExplorerHeader
                onAddFolder={() => setIsAddingFolder(true)}
                onAddPdf={handleAddPdf}
                onClearAll={handleClearAllClick}
            />

            {/* Yeni klasör input */}
            {isAddingFolder && (
                <NewFolderInput
                    value={newFolderName}
                    onChange={setNewFolderName}
                    onSubmit={handleAddFolder}
                    onCancel={handleCancelFolder}
                />
            )}

            {/* Dosya ağacı */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 custom-scrollbar relative">
                {rootItems.length > 0 ? (
                    rootItems
                        .sort((a, b) => {
                            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
                            return a.name.localeCompare(b.name, 'tr')
                        })
                        .map(item => (
                            <TreeItem
                                key={item.id}
                                item={item}
                                level={0}
                                onFileClick={handleFileClick}
                                onDeleteItem={handleDeleteItem}
                                onDragComplete={resetDragState}
                            />
                        ))
                ) : (
                    <EmptyState />
                )}
            </div>

            {/* Alt bilgi */}
            <FileExplorerFooter fileCount={fileCount} folderCount={folderCount} />

            {/* Silme onay modal'ı */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                type={deleteModal.type}
                itemName={deleteModal.itemName}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
        </div>
    )
}

export default FileExplorer
