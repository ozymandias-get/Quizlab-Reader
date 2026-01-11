import { createContext, useContext, useCallback, useMemo, useEffect } from 'react'
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

    // Uygulama başlatıldığında dosya erişimlerini yenile (Re-hydration)
    // FIX: Stale closure sorunu çözüldü - sadece başlangıçtaki dosyaları günceller
    // PERFORMANS: Batch işleme ile aynı anda çok fazla I/O önlenir
    useEffect(() => {
        let isMounted = true // Unmount kontrolü için flag

        const rehydrateFiles = async () => {
            if (!window.electronAPI) return

            // İlk snapshot'ı al - bu an mevcut olan dosyaların ID'lerini kaydet
            // Asenkron işlem sırasında eklenen dosyalar bu listede OLMAYACAK
            const initialFileSystem = [...fileSystem]
            const initialFileIds = new Set(initialFileSystem
                .filter(item => item && item.id) // Null/undefined item kontrolü
                .map(item => item.id))

            // Sadece fiziksel yolu olan dosyaları filtrele
            const filesToRehydrate = initialFileSystem.filter(
                item => item.type === 'file' && item.path
            )

            if (filesToRehydrate.length === 0) return

            const updates = new Map()

            // PERFORMANS: 5'erli batch'ler halinde işle (concurrent I/O limiti)
            const BATCH_SIZE = 5
            for (let i = 0; i < filesToRehydrate.length; i += BATCH_SIZE) {
                if (!isMounted) return // Component unmount olduysa dur

                const batch = filesToRehydrate.slice(i, i + BATCH_SIZE)

                await Promise.all(batch.map(async (file) => {
                    try {
                        const result = await window.electronAPI.getPdfStreamUrl(file.path)

                        if (result && result.streamUrl) {
                            // Yeni streamUrl alındı
                            updates.set(file.id, { streamUrl: result.streamUrl, error: false })
                        } else {
                            // Dosya bulunamadı veya erişim hatası
                            updates.set(file.id, { error: true })
                        }
                    } catch (err) {
                        console.error('[Rehydration] Dosya yenileme hatası:', file.path, err)
                        updates.set(file.id, { error: true })
                    }
                }))
            }

            // Değişiklik varsa state'i güncelle (sadece component hala mount ise)
            // FIX: Fonksiyonel güncelleme ile EN GÜNCEL state'i kullan
            if (isMounted && updates.size > 0) {
                setFileSystem(currentState => {
                    // Array kontrolü
                    if (!Array.isArray(currentState)) {
                        console.warn('[FileContext] currentState is not an array in rehydrateFiles update')
                        return []
                    }
                    // currentState şu anki EN GÜNCEL değer
                    return currentState.map(item => {
                        // Sadece başlangıçta var olan ve güncellenmesi gereken dosyaları güncelle
                        // Yeni eklenen dosyalara DOKUNMA
                        if (initialFileIds.has(item.id) && updates.has(item.id)) {
                            return { ...item, ...updates.get(item.id) }
                        }
                        return item
                    })
                })
            }
        }

        rehydrateFiles()

        return () => {
            isMounted = false // Cleanup: unmount flag'i
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Sadece mount anında çalışsın

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
        const isDescendant = (parentId, targetId, items, visited = new Set()) => {
            if (parentId === targetId) return true
            // Circular reference kontrolü
            if (visited.has(parentId)) {
                console.warn('[FileContext] Circular reference detected in isDescendant')
                return false
            }
            visited.add(parentId)
            const parent = items.find(item => item.id === parentId)
            if (!parent || parent.parentId === null) return false
            return isDescendant(parent.parentId, targetId, items, visited)
        }

        setFileSystem(prev => {
            // Array kontrolü
            if (!Array.isArray(prev)) {
                console.warn('[FileContext] fileSystem is not an array in moveItem')
                return []
            }

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
            // Array kontrolü
            if (!Array.isArray(prev)) {
                console.warn('[FileContext] fileSystem is not an array in deleteItem')
                return []
            }

            // Silinecek öğe ve tüm alt öğelerini bul
            const itemsToDelete = new Set()

            const collectChildren = (parentId, visited = new Set()) => {
                // Circular reference kontrolü
                if (visited.has(parentId)) {
                    console.warn('[FileContext] Circular reference detected in collectChildren')
                    return
                }
                visited.add(parentId)
                itemsToDelete.add(parentId)
                prev.forEach(item => {
                    if (item.parentId === parentId) {
                        collectChildren(item.id, visited)
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
        if (!Array.isArray(fileSystem)) {
            console.warn('[FileContext] fileSystem is not an array, returning empty array')
            return []
        }
        return fileSystem.filter(item => item.parentId === parentId)
    }, [fileSystem])

    /**
     * En üst seviyedeki öğeleri getir
     * @returns {Array} En üst seviye öğeler
     */
    const getRootItems = useCallback(() => {
        if (!Array.isArray(fileSystem)) {
            console.warn('[FileContext] fileSystem is not an array, returning empty array')
            return []
        }
        return fileSystem.filter(item => item.parentId === null)
    }, [fileSystem])

    /**
     * ID'ye göre öğe bul
     * @param {string} itemId - Öğe ID'si
     * @returns {Object|undefined} Bulunan öğe veya undefined
     */
    const getItemById = useCallback((itemId) => {
        if (!Array.isArray(fileSystem)) {
            console.warn('[FileContext] fileSystem is not an array, returning undefined')
            return undefined
        }
        return fileSystem.find(item => item.id === itemId)
    }, [fileSystem])

    /**
     * Öğenin tam yolunu (breadcrumb) hesapla
     * @param {string} itemId - Öğe ID'si
     * @returns {Array} Yol dizisi
     */
    const getItemPath = useCallback((itemId) => {
        if (!Array.isArray(fileSystem)) {
            console.warn('[FileContext] fileSystem is not an array, returning empty array')
            return []
        }
        const path = []
        const visited = new Set() // Circular reference kontrolü için
        let currentItem = fileSystem.find(item => item.id === itemId)

        while (currentItem) {
            // Circular reference kontrolü
            if (visited.has(currentItem.id)) {
                console.warn('[FileContext] Circular reference detected in getItemPath')
                break
            }
            visited.add(currentItem.id)
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
