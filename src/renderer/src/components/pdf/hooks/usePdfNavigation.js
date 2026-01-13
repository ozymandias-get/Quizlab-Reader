import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * PDF sayfa navigasyonu ve wheel event'lerini yöneten custom hook
 * @param {Object} options - Hook options
 * @param {React.RefObject} options.containerRef - PDF container ref
 * @param {React.RefObject} options.jumpToPageRef - jumpToPage fonksiyonu ref'i
 * @param {string|null} options.pdfUrl - Mevcut PDF URL'i
 */
export function usePdfNavigation({ containerRef, jumpToPageRef, pdfUrl }) {
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const lastWheelTime = useRef(0)

    // Ref ile güncel değerlere erişim (useCallback için)
    const currentPageRef = useRef(currentPage)
    const totalPagesRef = useRef(totalPages)

    // Ref'leri güncel tut
    useEffect(() => {
        currentPageRef.current = currentPage
    }, [currentPage])

    useEffect(() => {
        totalPagesRef.current = totalPages
    }, [totalPages])

    // Cumulative delta for touchpad (touchpad'ler küçük delta değerleri gönderir)
    const accumulatedDelta = useRef(0)
    const DELTA_THRESHOLD = 50 // Sayfa değişimi için minimum delta eşiği
    const THROTTLE_MS = 400 // Throttle süresi (touchpad için artırıldı)

    // Fare tekerleği ile sayfa değiştirme - useCallback ile sarılmış
    const handleWheel = useCallback((e) => {
        const now = Date.now()
        const current = currentPageRef.current
        const total = totalPagesRef.current

        if (total === 0) return

        e.preventDefault()

        // Throttle kontrolü - çok hızlı art arda sayfa değişimini engelle
        const timeSinceLastWheel = now - lastWheelTime.current

        // Uzun süre scroll yapılmadıysa birikimi sıfırla
        if (timeSinceLastWheel > 200) {
            accumulatedDelta.current = 0
        }

        // Delta'yı biriktir (touchpad için küçük değerler toplanır)
        accumulatedDelta.current += e.deltaY

        // Eşik kontrolü - yeterli scroll birikti mi?
        if (Math.abs(accumulatedDelta.current) < DELTA_THRESHOLD) {
            return
        }

        // Throttle kontrolü - son sayfa değişiminden yeterli süre geçti mi?
        if (timeSinceLastWheel < THROTTLE_MS) {
            return
        }

        // Sayfa değişimini gerçekleştir
        lastWheelTime.current = now

        if (accumulatedDelta.current > 0) {
            // Aşağı scroll - sonraki sayfa
            if (current < total) {
                jumpToPageRef.current(current) // 0-indexed, current zaten 1 fazla
            }
        } else if (accumulatedDelta.current < 0) {
            // Yukarı scroll - önceki sayfa
            if (current > 1) {
                jumpToPageRef.current(current - 2) // 0-indexed
            }
        }

        // Birikimi sıfırla
        accumulatedDelta.current = 0
    }, [jumpToPageRef])

    // Wheel Event Listener
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const handleWheelEvent = (e) => handleWheel(e)

        container.addEventListener('wheel', handleWheelEvent, { passive: false })

        return () => {
            container.removeEventListener('wheel', handleWheelEvent)
        }
    }, [handleWheel, pdfUrl, containerRef])

    // Sayfa değişikliğini izle
    const handlePageChange = useCallback((e) => {
        setCurrentPage(e.currentPage + 1)
    }, [])

    // PDF yüklendiğinde
    const handleDocumentLoad = useCallback((e) => {
        setTotalPages(e.doc.numPages)
    }, [])

    // Önceki/sonraki sayfa navigasyonu
    const goToPreviousPage = useCallback(() => {
        if (currentPage > 1 && jumpToPageRef.current) {
            jumpToPageRef.current(currentPage - 2) // 0-indexed
        }
    }, [currentPage, jumpToPageRef])

    const goToNextPage = useCallback(() => {
        if (currentPage < totalPages && jumpToPageRef.current) {
            jumpToPageRef.current(currentPage) // 0-indexed
        }
    }, [currentPage, totalPages, jumpToPageRef])

    return {
        currentPage,
        totalPages,
        handlePageChange,
        handleDocumentLoad,
        goToPreviousPage,
        goToNextPage
    }
}
