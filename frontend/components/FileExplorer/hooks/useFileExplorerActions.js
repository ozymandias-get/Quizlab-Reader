import { useState, useCallback } from 'react'
import { validateFileName } from '../../../utils/fileUtils'

/**
 * Hook to manage FileExplorer actions (Folder, PDF, Delete operations)
 */
export function useFileExplorerActions({
    addFolder,
    addFile,
    deleteItem,
    clearAll,
    getItemById,
    showError,
    showSuccess,
    t
}) {
    // undefined = not adding, null = adding to root, string = adding to folderId
    const [addingToFolderId, setAddingToFolderId] = useState(undefined)
    const [newFolderName, setNewFolderName] = useState('')
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        type: 'single',
        itemId: null,
        itemName: ''
    })

    // ===== Folder Actions =====

    const handleAddFolder = useCallback(() => {
        const validation = validateFileName(newFolderName)

        if (!validation.valid) {
            showError(validation.error) // 'empty_name' or 'invalid_chars'
            return
        }

        const parentId = addingToFolderId // might be null or string
        const result = addFolder(validation.name, parentId)

        if (result) {
            setNewFolderName('')
            setAddingToFolderId(undefined)
            showSuccess('toast_folder_created', null, { folderName: validation.name })
        }
    }, [newFolderName, addFolder, addingToFolderId, showError, showSuccess])

    const handleCancelFolder = useCallback(() => {
        setAddingToFolderId(undefined)
        setNewFolderName('')
    }, [])

    const initiateAddFolder = useCallback((parentId = null) => {
        setAddingToFolderId(parentId)
    }, [])

    // ===== PDF Actions =====

    const handleAddPdf = useCallback(async () => {
        const api = window.electronAPI
        if (!api?.selectPdf) {
            showError('toast_api_unavailable')
            return
        }

        try {
            const result = await api.selectPdf({ filterName: t('pdf_documents') })
            // Robust check for result object and its properties
            if (result && (result.path || result.streamUrl)) {
                addFile(result, null)
            }
        } catch (error) {
            console.error('[FileExplorer] PDF Selection Error:', error)
            showError('toast_pdf_load_error', null, { error: error.message || 'Unknown' })
        }
    }, [addFile, showError, t])

    // ===== Delete Actions =====

    const handleDeleteItem = useCallback((itemId) => {
        const item = getItemById(itemId)
        if (item) {
            setDeleteModal({ isOpen: true, type: 'single', itemId, itemName: item.name })
        }
    }, [getItemById])

    const handleClearAllClick = useCallback(() => {
        setDeleteModal({ isOpen: true, type: 'all', itemId: null, itemName: t('all_files') })
    }, [t])

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

    return {
        // State
        addingToFolderId,
        newFolderName,
        setNewFolderName,
        deleteModal,

        // Actions
        handleAddFolder,
        handleCancelFolder,
        initiateAddFolder,
        handleAddPdf,
        handleDeleteItem,
        handleClearAllClick,
        confirmDelete,
        cancelDelete
    }
}
