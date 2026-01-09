import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocalStorage } from './useLocalStorage'

/**
 * Panel boyutlandırma işlemlerini yöneten hook
 * 
 * PERFORMANS OPTİMİZASYONU (v2 - Geliştirilmiş):
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 1. Resize sırasında state güncellemesi YOK → React re-render YOK
 * 2. requestAnimationFrame ile 60fps akıcılık garantisi
 * 3. isResizingRef ile gereksiz re-render'lar önleniyor
 * 4. Sadece mouseup'ta final değer state'e yazılır
 * 5. CSS class toggle doğrudan DOM üzerinden yapılır
 * 
 * NEDEN BU YAKLAŞIM?
 * ━━━━━━━━━━━━━━━━━━
 * - mousemove saniyede 60+ kez tetiklenir
 * - Her state güncellemesi React tree'sini re-render eder
 * - Ref + DOM manipülasyonu ile bunu bypass ediyoruz
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
    // Final genişlik değeri (localStorage ile senkronize)
    const [leftPanelWidth, setLeftPanelWidth] = useLocalStorage(storageKey, initialWidth)

    // isResizing STATE - sadece component mount/unmount için
    // Aslında resize sırasında REF kullanıyoruz, state sadece dışarıya expose için
    const [isResizing, setIsResizing] = useState(false)

    // DOM elementi ref'leri - resize sırasında doğrudan manipülasyon için
    const leftPanelRef = useRef(null)
    const rightPanelRef = useRef(null)
    const resizerRef = useRef(null)

    // Geçici genişlik değeri (resize sırasında state güncellemeden saklamak için)
    const pendingWidthRef = useRef(leftPanelWidth)

    // Resize durumu REF olarak - state güncellemeden takip için
    const isResizingRef = useRef(false)

    // requestAnimationFrame ID'si - cleanup için
    const rafIdRef = useRef(null)

    // Mouse down - resize başlat
    const handleMouseDown = useCallback((e) => {
        e.preventDefault()

        // REF'i güncelle (re-render YOK)
        isResizingRef.current = true

        // STATE'i güncelle (sadece 1 kez, başlangıçta)
        // Bu, isResizing prop'unu kullanan bileşenlere bildirim için gerekli
        setIsResizing(true)

        // Cursor ve selection stillerini ayarla
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'

        // Resizer'a dragging class'ı ekle (CSS animasyonları için)
        if (resizerRef.current) {
            resizerRef.current.classList.add('dragging')
        }

        // Mevcut genişliği pending ref'e kaydet
        pendingWidthRef.current = leftPanelWidth
    }, [leftPanelWidth])

    // Mouse move ve mouse up event listener'ları
    useEffect(() => {
        // requestAnimationFrame ile throttle edilmiş DOM güncellemesi
        const updatePanelWidth = (percentage) => {
            if (leftPanelRef.current) {
                leftPanelRef.current.style.width = `${percentage}%`
            }
        }

        const handleMouseMove = (e) => {
            // REF kontrolü - state kontrolünden daha hızlı
            if (!isResizingRef.current) return

            const containerWidth = window.innerWidth
            const newLeftWidth = e.clientX
            const maxLeft = containerWidth - minRight - 6

            if (newLeftWidth >= minLeft && newLeftWidth <= maxLeft) {
                const percentage = (newLeftWidth / containerWidth) * 100

                // PERFORMANS: State güncellemesi YOK!
                // Sadece ref'e kaydet
                pendingWidthRef.current = percentage

                // requestAnimationFrame ile bir sonraki frame'de güncelle
                // Bu, browser'ın paint cycle'ı ile senkronize çalışır
                if (rafIdRef.current) {
                    cancelAnimationFrame(rafIdRef.current)
                }
                rafIdRef.current = requestAnimationFrame(() => {
                    updatePanelWidth(percentage)
                })
            }
        }

        const handleMouseUp = () => {
            // REF kontrolü
            if (!isResizingRef.current) return

            // REF'i sıfırla
            isResizingRef.current = false

            // Bekleyen RAF'ı iptal et
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current)
                rafIdRef.current = null
            }

            // Cursor ve selection stillerini sıfırla
            document.body.style.cursor = ''
            document.body.style.userSelect = ''

            // Resizer'dan dragging class'ını kaldır
            if (resizerRef.current) {
                resizerRef.current.classList.remove('dragging')
            }

            // STATE güncelle (sadece 1 kez, bitişte)
            // Bu, isResizing prop'unu kullanan bileşenlere bildirim için gerekli
            setIsResizing(false)

            // Final değeri state'e kaydet → tek bir re-render
            // Bu aynı zamanda localStorage'a da kaydeder (useLocalStorage sayesinde)
            setLeftPanelWidth(pendingWidthRef.current)
        }

        // Event listener'ları ekle
        document.addEventListener('mousemove', handleMouseMove, { passive: true })
        document.addEventListener('mouseup', handleMouseUp)

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)

            // Cleanup: bekleyen RAF'ı iptal et
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current)
            }
        }
    }, [minLeft, minRight, setLeftPanelWidth]) // isResizing bağımlılığı KALDIRILDI - artık ref kullanıyoruz

    return {
        leftPanelWidth,
        setLeftPanelWidth,
        isResizing,
        handleMouseDown,
        // Panel ref'lerini dışarı ver - App.jsx'te panellere bağlanacak
        leftPanelRef,
        rightPanelRef,
        // Yeni: Resizer ref'i - class toggle için
        resizerRef
    }
}
