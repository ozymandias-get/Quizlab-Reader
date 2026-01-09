import { createContext, useContext, useCallback, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

/**
 * FileContext - Sanal dosya sistemi yönetimi için React Context
 * localStorage ile kalıcı veri saklama sağlar
 * Root klasör yok - dosyalar ve klasörler doğrudan en üst seviyede
 */

// Context oluştur
const FileContext = createContext(null)

/**
 * Benzersiz ID üretici
 * @returns {string} Benzersiz ID
 */
const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

/**
 * FileProvider - Dosya sistemi state'ini yöneten provider bileşeni
 * @param {Object} props - Bileşen props'ları
 * @param {React.ReactNode} props.children - Alt bileşenler
 */
export function FileProvider({ children }) {
    // localStorage ile senkronize dosya sistemi state'i
    // Başlangıçta boş liste - kullanıcı kendi klasörlerini oluşturacak
    const [fileSystem, setFileSystem] = useLocalStorage('quizlab-filesystem', [])

    /**
     * Yeni klasör ekleme
     * @param {string} name - Klasör adı
     * @param {string|null} parentId - Üst klasör ID'si (null ise en üst seviyeye eklenir)
     * @returns {Object} Oluşturulan klasör objesi
     */
    const addFolder = useCallback((name, parentId = null) => {
        const newFolder = {
            id: generateId(),
            name: name.trim(),
            type: 'folder',
            parentId: parentId
        }

        setFileSystem(prev => [...prev, newFolder])

        return newFolder
    }, [setFileSystem])

    /**
     * Yeni dosya ekleme
     * @param {Object} fileObj - Dosya objesi { name: string, path?: string, size?: number, streamUrl?: string }
     * @param {string|null} parentId - Üst klasör ID'si (null ise en üst seviyeye eklenir)
     * @returns {Object} Oluşturulan dosya objesi
     */
    const addFile = useCallback((fileObj, parentId = null) => {
        const newFile = {
            id: generateId(),
            name: fileObj.name?.trim() || 'Adsız Dosya',
            type: 'file',
            parentId: parentId,
            path: fileObj.path || null,
            size: fileObj.size || null,
            streamUrl: fileObj.streamUrl || null
        }

        setFileSystem(prev => [...prev, newFile])

        return newFile
    }, [setFileSystem])

    /**
     * Birden fazla dosya ekleme (tek seferde)
     * @param {Array} filesArray - Dosya objeleri dizisi
     * @param {string|null} parentId - Üst klasör ID'si
     * @returns {Array} Oluşturulan dosya objeleri
     */
    const addFiles = useCallback((filesArray, parentId = null) => {
        const newFiles = filesArray.map(fileObj => ({
            id: generateId(),
            name: fileObj.name?.trim() || 'Adsız Dosya',
            type: 'file',
            parentId: parentId,
            path: fileObj.path || null,
            size: fileObj.size || null,
            streamUrl: fileObj.streamUrl || null
        }))

        setFileSystem(prev => [...prev, ...newFiles])

        return newFiles
    }, [setFileSystem])

    /**
     * Öğeyi başka bir klasöre taşıma
     * @param {string} itemId - Taşınacak öğenin ID'si
     * @param {string|null} newParentId - Hedef klasör ID'si (null = en üst seviye)
     * @returns {boolean} İşlem başarılı mı
     */
    const moveItem = useCallback((itemId, newParentId) => {
        // Bir öğeyi kendi içine veya alt klasörüne taşımayı engelle
        const isDescendant = (parentId, targetId, items) => {
            if (parentId === targetId) return true
            const parent = items.find(item => item.id === parentId)
            if (!parent || parent.parentId === null) return false
            return isDescendant(parent.parentId, targetId, items)
        }

        setFileSystem(prev => {
            // Kendine taşıma kontrolü
            if (itemId === newParentId) {
                console.warn('FileContext: Öğe kendine taşınamaz.')
                return prev
            }

            // Alt klasöre taşıma kontrolü (klasör için)
            const item = prev.find(i => i.id === itemId)
            if (item?.type === 'folder' && newParentId && isDescendant(newParentId, itemId, prev)) {
                console.warn('FileContext: Klasör kendi alt klasörüne taşınamaz.')
                return prev
            }


            return prev.map(item =>
                item.id === itemId
                    ? { ...item, parentId: newParentId }
                    : item
            )
        })

        return true
    }, [setFileSystem])

    /**
     * Öğeyi silme (alt öğelerle birlikte)
     * @param {string} itemId - Silinecek öğenin ID'si
     * @returns {boolean} İşlem başarılı mı
     */
    const deleteItem = useCallback((itemId) => {
        setFileSystem(prev => {
            // Silinecek öğe ve tüm alt öğelerini bul
            const itemsToDelete = new Set()

            const collectChildren = (parentId) => {
                itemsToDelete.add(parentId)
                prev.forEach(item => {
                    if (item.parentId === parentId) {
                        collectChildren(item.id)
                    }
                })
            }

            collectChildren(itemId)


            // Silinecek öğeler hariç diğerlerini döndür
            return prev.filter(item => !itemsToDelete.has(item.id))
        })

        return true
    }, [setFileSystem])

    /**
     * Belirli bir klasörün alt öğelerini getir (veya en üst seviye öğeler)
     * @param {string|null} parentId - Üst klasör ID'si (null = en üst seviye)
     * @returns {Array} Alt öğeler listesi
     */
    const getChildren = useCallback((parentId = null) => {
        return fileSystem.filter(item => item.parentId === parentId)
    }, [fileSystem])

    /**
     * En üst seviyedeki öğeleri getir
     * @returns {Array} En üst seviye öğeler
     */
    const getRootItems = useCallback(() => {
        return fileSystem.filter(item => item.parentId === null)
    }, [fileSystem])

    /**
     * ID'ye göre öğe bul
     * @param {string} itemId - Öğe ID'si
     * @returns {Object|undefined} Bulunan öğe veya undefined
     */
    const getItemById = useCallback((itemId) => {
        return fileSystem.find(item => item.id === itemId)
    }, [fileSystem])

    /**
     * Öğenin tam yolunu (breadcrumb) hesapla
     * @param {string} itemId - Öğe ID'si
     * @returns {Array} Yol dizisi
     */
    const getItemPath = useCallback((itemId) => {
        const path = []
        let currentItem = fileSystem.find(item => item.id === itemId)

        while (currentItem) {
            path.unshift(currentItem)
            currentItem = fileSystem.find(item => item.id === currentItem.parentId)
        }

        return path
    }, [fileSystem])

    /**
     * localStorage'ı temizle (debug için)
     */
    const clearAll = useCallback(() => {
        setFileSystem([])

    }, [setFileSystem])

    // Context değerini memo'la
    const contextValue = useMemo(() => ({
        fileSystem,
        addFolder,
        addFile,
        addFiles,
        moveItem,
        deleteItem,
        getChildren,
        getRootItems,
        getItemById,
        getItemPath,
        clearAll
    }), [fileSystem, addFolder, addFile, addFiles, moveItem, deleteItem, getChildren, getRootItems, getItemById, getItemPath, clearAll])

    return (
        <FileContext.Provider value={contextValue}>
            {children}
        </FileContext.Provider>
    )
}

/**
 * useFileSystem hook - FileContext'e erişim sağlar
 * @returns {Object} Dosya sistemi context değeri
 * @throws {Error} Provider dışında kullanılırsa hata fırlatır
 */
export function useFileSystem() {
    const context = useContext(FileContext)

    if (!context) {
        throw new Error('useFileSystem hook\'u FileProvider içinde kullanılmalıdır.')
    }

    return context
}

export default FileContext
