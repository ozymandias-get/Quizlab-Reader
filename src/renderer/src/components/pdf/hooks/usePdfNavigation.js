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

    // Fare tekerleği ile sayfa değiştirme - useCallback ile sarılmış
    const handleWheel = useCallback((e) => {
        // Throttle - 300ms'de bir sayfa değiştir
        const now = Date.now()
        if (now - lastWheelTime.current < 300) return

        const current = currentPageRef.current
        const total = totalPagesRef.current

        if (total === 0) return

        e.preventDefault()
        lastWheelTime.current = now

        if (e.deltaY > 0) {
            // Aşağı scroll - sonraki sayfa
            if (current < total) {
                jumpToPageRef.current(current) // 0-indexed, current zaten 1 fazla
            }
        } else if (e.deltaY < 0) {
            // Yukarı scroll - önceki sayfa
            if (current > 1) {
                jumpToPageRef.current(current - 2) // 0-indexed
            }
        }
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
