import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocalStorage } from './useLocalStorage'

/**
 * Panel boyutlandırma işlemlerini yöneten hook
 * PERFORMANS OPTİMİZASYONU: 
 * - Resize sırasında state güncellemesi YOK → React re-render YOK
 * - Sadece DOM manipülasyonu (ref üzerinden) → 60fps akıcılık
 * - mouseup'ta final değer state'e yazılır
 * 
 * @param {Object} options - Yapılandırma seçenekleri
 * @param {number} options.initialWidth - Başlangıç panel genişliği (%)
 * @param {number} options.minLeft - Sol panel minimum genişliği (px)
 * @param {number} options.minRight - Sağ panel minimum genişliği (px)
 * @param {string} options.storageKey - localStorage anahtarı (STORAGE_KEYS sabitlerinden kullanın)
 * @returns {Object} - Panel boyutlandırma durumu ve fonksiyonları
 * 
 * @example
 * import { STORAGE_KEYS } from '../constants/storageKeys'
 * const { leftPanelWidth } = usePanelResize({ storageKey: STORAGE_KEYS.LEFT_PANEL_WIDTH })
 */
export function usePanelResize({
    initialWidth = 50,
    minLeft = 300,
    minRight = 400,
    storageKey // Zorunlu - STORAGE_KEYS'den geçirilmeli
} = {}) {
    const [leftPanelWidth, setLeftPanelWidth] = useLocalStorage(storageKey, initialWidth)
    const [isResizing, setIsResizing] = useState(false)

    // DOM elementi ref'leri - resize sırasında doğrudan manipülasyon için
    const leftPanelRef = useRef(null)
    const rightPanelRef = useRef(null)

    // Geçici genişlik değeri (resize sırasında state güncellemeden saklamak için)
    const pendingWidthRef = useRef(leftPanelWidth)

    // Mouse down - resize başlat
    const handleMouseDown = useCallback((e) => {
        e.preventDefault()
        setIsResizing(true)
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'

        // Mevcut genişliği pending ref'e kaydet
        pendingWidthRef.current = leftPanelWidth
    }, [leftPanelWidth])

    // Mouse move ve mouse up event listener'ları
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing) return

            const containerWidth = window.innerWidth
            const newLeftWidth = e.clientX
            const maxLeft = containerWidth - minRight - 6

            if (newLeftWidth >= minLeft && newLeftWidth <= maxLeft) {
                const percentage = (newLeftWidth / containerWidth) * 100

                // PERFORMANS: State güncellemesi YOK!
                // Sadece ref'e kaydet ve DOM'u doğrudan güncelle
                pendingWidthRef.current = percentage

                // Sol paneli doğrudan güncelle (ref varsa)
                if (leftPanelRef.current) {
                    leftPanelRef.current.style.width = `${percentage}%`
                }
            }
        }

        const handleMouseUp = () => {
            if (isResizing) {
                setIsResizing(false)
                document.body.style.cursor = ''
                document.body.style.userSelect = ''

                // SADECE BURADA state güncelle → tek bir re-render
                // Bu aynı zamanda localStorage'a da kaydeder (useLocalStorage sayesinde)
                setLeftPanelWidth(pendingWidthRef.current)
            }
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isResizing, minLeft, minRight, setLeftPanelWidth])

    return {
        leftPanelWidth,
        setLeftPanelWidth,
        isResizing,
        handleMouseDown,
        // Yeni: Panel ref'lerini dışarı ver - App.jsx'te panellere bağlanacak
        leftPanelRef,
        rightPanelRef
    }
}
