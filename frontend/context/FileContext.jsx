import { createContext, useContext, useCallback, useMemo, useEffect, useRef } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useLanguage } from './LanguageContext'
import { validateFileName } from '../utils/fileUtils'
import { generateId } from '../utils/uiUtils'

const REHYDRATION_BATCH_SIZE = 5
const FileContext = createContext(null)

/**
 * FileProvider - Manages the virtual file system state
 */
export function FileProvider({ children }) {
    const [fileSystem, setFileSystem] = useLocalStorage('quizlab-filesystem', [])
    const { t } = useLanguage()

    // PDF Stream URL Re-hydration
    // Since local-pdf:// IDs are session-based, they must be refreshed on app start
    useEffect(() => {
        let isMounted = true

        const rehydrateFiles = async () => {
            const api = window.electronAPI
            if (!api || !fileSystem.length) return

            const fileIds = new Set(fileSystem.map(i => i.id))
            const filesToRehydrate = fileSystem.filter(i => i.type === 'file' && i.path)

            if (!filesToRehydrate.length) return

            const updates = new Map()

            // Process in batches to avoid overwhelming the IPC channel
            for (let i = 0; i < filesToRehydrate.length; i += REHYDRATION_BATCH_SIZE) {
                if (!isMounted) return

                const batch = filesToRehydrate.slice(i, i + REHYDRATION_BATCH_SIZE)
                await Promise.all(batch.map(async (file) => {
                    try {
                        const result = await api.getPdfStreamUrl(file.path)
                        updates.set(file.id, {
                            streamUrl: result?.streamUrl || null,
                            error: !result?.streamUrl
                        })
                    } catch (err) {
                        updates.set(file.id, { error: true })
                    }
                }))
            }

            if (isMounted && updates.size > 0) {
                setFileSystem(current =>
                    current.map(item =>
                        fileIds.has(item.id) && updates.has(item.id)
                            ? { ...item, ...updates.get(item.id) }
                            : item
                    )
                )
            }
        }

        rehydrateFiles()
        return () => { isMounted = false }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ===== Helpers =====

    const findItem = useCallback((id) => fileSystem.find(i => i.id === id), [fileSystem])

    const isDescendant = useCallback((parentId, targetId, items) => {
        if (!parentId || parentId === targetId) return true
        let currentParentId = parentId

        while (currentParentId) {
            if (currentParentId === targetId) return true
            const parent = items.find(i => i.id === currentParentId)
            currentParentId = parent?.parentId
        }
        return false
    }, [])

    const internalCreateFile = useCallback((f, parentId) => {
        const validation = validateFileName(f.name)
        return {
            id: generateId(),
            name: validation.valid ? validation.name : t('untitled_file'),
            type: 'file',
            parentId,
            path: f.path || null,
            size: f.size || null,
            streamUrl: f.streamUrl || null
        }
    }, [t])

    // ===== Mutations =====

    const addFolder = useCallback((name, parentId = null) => {
        const validation = validateFileName(name)
        if (!validation.valid) return null

        const newFolder = { id: generateId(), name: validation.name, type: 'folder', parentId }
        setFileSystem(prev => [...prev, newFolder])
        return newFolder
    }, [setFileSystem])

    const addFile = useCallback((fileObj, parentId = null) => {
        const newFile = internalCreateFile(fileObj, parentId)
        setFileSystem(prev => [...prev, newFile])
        return newFile
    }, [setFileSystem, internalCreateFile])

    const addFiles = useCallback((filesArray, parentId = null) => {
        const newFiles = filesArray.map(f => internalCreateFile(f, parentId))
        setFileSystem(prev => [...prev, ...newFiles])
        return newFiles
    }, [setFileSystem, internalCreateFile])


    const moveItem = useCallback((itemId, newParentId) => {
        setFileSystem(prev => {
            if (itemId === newParentId) return prev
            const item = prev.find(i => i.id === itemId)
            if (!item || (item.type === 'folder' && newParentId && isDescendant(newParentId, itemId, prev))) {
                return prev
            }
            return prev.map(i => i.id === itemId ? { ...i, parentId: newParentId } : i)
        })
        return true
    }, [setFileSystem, isDescendant])

    const deleteItem = useCallback((itemId) => {
        setFileSystem(prev => {
            const childMap = new Map()
            prev.forEach(item => {
                if (item.parentId) {
                    if (!childMap.has(item.parentId)) childMap.set(item.parentId, [])
                    childMap.get(item.parentId).push(item.id)
                }
            })

            const idsToDelete = new Set()
            const queue = [itemId]

            while (queue.length > 0) {
                const currentId = queue.shift()
                idsToDelete.add(currentId)
                const children = childMap.get(currentId) || []
                children.forEach(childId => queue.push(childId))
            }

            return prev.filter(i => !idsToDelete.has(i.id))
        })
        return true
    }, [setFileSystem])

    const clearAll = useCallback(() => setFileSystem([]), [setFileSystem])

    // ===== Optimization: Child Lookup Map =====
    // We use a ref to store the previous map to enable stable array references
    const prevChildrenMapRef = useRef(new Map())

    const childrenMap = useMemo(() => {
        const nextMap = new Map()

        // 1. Build new map with fresh arrays
        fileSystem.forEach(item => {
            const pid = item.parentId || 'root'
            if (!nextMap.has(pid)) nextMap.set(pid, [])
            nextMap.get(pid).push(item)
        })

        // 2. Diff with previous map to preserve stable references for unchanged folders
        const prevMap = prevChildrenMapRef.current
        const finalMap = new Map()

        // Iterate over all keys in the new map (and potential old keys if needed, but we only care about current data)
        for (const [key, newChildren] of nextMap.entries()) {
            const oldChildren = prevMap.get(key)

            // Check if arrays are identical (same length, same item references)
            let isSame = false
            if (oldChildren && oldChildren.length === newChildren.length) {
                isSame = true
                for (let i = 0; i < newChildren.length; i++) {
                    if (newChildren[i] !== oldChildren[i]) {
                        isSame = false
                        break
                    }
                }
            }

            // Reuse old array instance if identical
            finalMap.set(key, isSame ? oldChildren : newChildren)
        }

        prevChildrenMapRef.current = finalMap
        return finalMap
    }, [fileSystem])

    // ===== Queries =====

    const getChildren = useCallback((parentId = null) =>
        childrenMap.get(parentId || 'root') || [], [childrenMap])

    const getRootItems = useCallback(() =>
        childrenMap.get('root') || [], [childrenMap])

    const getItemPath = useCallback((itemId) => {
        const path = []
        let currentItem = findItem(itemId)
        while (currentItem) {
            path.unshift(currentItem)
            currentItem = findItem(currentItem.parentId)
        }
        return path
    }, [findItem])

    const contextValue = useMemo(() => ({
        fileSystem,
        addFolder,
        addFile,
        addFiles,
        moveItem,
        deleteItem,
        getChildren,
        getRootItems,
        getItemById: findItem,
        getItemPath,
        clearAll
    }), [fileSystem, addFolder, addFile, addFiles, moveItem, deleteItem, getChildren, getRootItems, findItem, getItemPath, clearAll])

    return <FileContext.Provider value={contextValue}>{children}</FileContext.Provider>
}

export function useFileSystem() {
    const context = useContext(FileContext)
    if (!context) throw new Error('useFileSystem must be used within FileProvider')
    return context
}

export default FileContext
