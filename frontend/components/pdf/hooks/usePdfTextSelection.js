import { useEffect, useCallback } from 'react'

/**
 * PDF içinde metin seçimini izleyen custom hook
 * Seçim yapıldığında konum bilgisiyle birlikte callback çağırır
 * @param {Object} options - Hook options
 * @param {React.RefObject} options.containerRef - PDF container ref
 * @param {Function} options.onTextSelection - Metin seçildiğinde çağrılacak callback
 */
export function usePdfTextSelection({ containerRef, onTextSelection }) {
    // Metin seçimi hesaplama - pozisyon sınır kontrolleri dahil
    const calculateSelectionPosition = useCallback((selection, container) => {
        const text = selection?.toString().trim()

        // Seçim boşsa veya yoksa
        if (!text || text.length === 0 || selection.rangeCount === 0) {
            return { text: '', position: null }
        }

        // Seçimin PDF container içinde olup olmadığını kontrol et
        const anchorNode = selection.anchorNode
        if (!anchorNode || !container.contains(anchorNode)) {
            // Seçim PDF container dışında - floating button gösterme
            return null
        }

        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()

        // Buton boyutları
        const btnWidth = 140
        const btnHeight = 44
        const margin = 10
        const bottomBarHeight = 80 // Alt bar yüksekliği (tahmini)

        // Varsayılan pozisyon: seçimin üstünde ortalanmış
        let top = rect.top - btnHeight - margin
        let left = rect.left + (rect.width / 2)

        // === SINIR KONTROLLERI ===

        // Üst sınır: Buton ekranın üstüne çıkıyorsa, seçimin altına koy
        if (top < margin) {
            top = rect.bottom + margin
        }

        // Alt sınır: Buton ekranın altına veya taskbar'a gizleniyorsa
        if (top + btnHeight > window.innerHeight - bottomBarHeight - margin) {
            const topPosition = rect.top - btnHeight - margin
            if (topPosition >= margin) {
                top = topPosition
            } else {
                top = Math.max(margin, window.innerHeight - bottomBarHeight - btnHeight - margin)
            }
        }

        // Sol sınır: Buton ekranın soluna çıkmasın
        if (left < btnWidth / 2 + margin) {
            left = btnWidth / 2 + margin
        }

        // Sağ sınır: Buton ekranın sağına çıkmasın
        if (left > window.innerWidth - btnWidth / 2 - margin) {
            left = window.innerWidth - btnWidth / 2 - margin
        }

        return { text, position: { top, left } }
    }, [])

    useEffect(() => {
        if (!onTextSelection) return

        const handleSelection = () => {
            const selection = window.getSelection()
            const container = containerRef.current

            if (!container) {
                onTextSelection('', null)
                return
            }

            const result = calculateSelectionPosition(selection, container)

            // null ise seçim container dışında - mevcut durumu koru
            if (result === null) return

            onTextSelection(result.text, result.position)
        }

        // Tıklama ile seçim iptalini dinle
        const handleClick = () => {
            setTimeout(() => {
                const selection = window.getSelection()
                const text = selection?.toString().trim()
                if (!text || text.length === 0) {
                    onTextSelection('', null)
                }
            }, 10)
        }

        document.addEventListener('mouseup', handleSelection)
        document.addEventListener('keyup', handleSelection)
        document.addEventListener('mousedown', handleClick)

        return () => {
            document.removeEventListener('mouseup', handleSelection)
            document.removeEventListener('keyup', handleSelection)
            document.removeEventListener('mousedown', handleClick)
        }
    }, [onTextSelection, containerRef, calculateSelectionPosition])
}
