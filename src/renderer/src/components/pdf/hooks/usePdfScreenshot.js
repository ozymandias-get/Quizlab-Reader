import { useEffect, useCallback } from 'react'

/**
 * PDF screenshot alma işlemlerini yöneten custom hook
 * @param {Object} options - Hook options
 * @param {number} options.currentPage - Mevcut sayfa numarası
 * @param {Function} options.sendImageToAI - Görüntüyü AI'ya gönderen fonksiyon
 * @param {Function} options.startScreenshot - Crop screenshot başlatan fonksiyon
 */
export function usePdfScreenshot({ currentPage, sendImageToAI, startScreenshot }) {

    // Tam Sayfa Screenshot Alma (Canvas'tan)
    const handleFullPageScreenshot = useCallback(async () => {
        try {
            const pageLayers = document.querySelectorAll('.rpv-core__page-layer')
            let targetCanvas = null

            // Mevcut sayfayı bul (0-indexed)
            const pageIndex = currentPage - 1

            // Page layer'ı data-page-number attribute'u ile bul
            for (const layer of pageLayers) {
                const pageNum = layer.getAttribute('data-page-number')
                if (pageNum && parseInt(pageNum) === pageIndex) {
                    targetCanvas = layer.querySelector('canvas')
                    if (targetCanvas) {
                        console.log('[PdfScreenshot] Canvas bulundu (data-page-number):', pageNum)
                        break
                    }
                }
            }

            if (!targetCanvas) {
                const canvasList = document.querySelectorAll('.rpv-core__page-layer canvas')

                // En görünür canvas'ı bul (viewport içinde olan)
                for (const canvas of canvasList) {
                    const rect = canvas.getBoundingClientRect()
                    const isVisible = rect.top < window.innerHeight && rect.bottom > 0

                    if (isVisible) {
                        targetCanvas = canvas
                        console.log('[PdfScreenshot] Canvas bulundu (visibility check)')
                        break
                    }
                }

                // Eğer hala yoksa ilk canvas'ı al
                if (!targetCanvas && canvasList.length > 0) {
                    targetCanvas = canvasList[0]
                    console.log('[PdfScreenshot] Canvas bulundu (fallback - ilk canvas)')
                }
            }

            if (!targetCanvas) {
                console.warn('[PdfScreenshot] Canvas bulunamadı')
                return
            }

            // Canvas'tan yüksek kaliteli görüntü al
            const dataUrl = targetCanvas.toDataURL('image/png', 1.0)

            // AI'ya gönder
            const success = await sendImageToAI(dataUrl)

            if (!success) {
                console.warn('[PdfScreenshot] ⚠️ Screenshot gönderilemedi')
            }

        } catch (error) {
            console.error('[PdfScreenshot] ❌ Full page screenshot hatası:', error)
        }
    }, [sendImageToAI, currentPage])

    // Main Process'ten gelen tetikleyicileri dinle (Right Click Menu)
    useEffect(() => {
        if (!window.electronAPI?.onTriggerScreenshot) return

        const removeListener = window.electronAPI.onTriggerScreenshot((type) => {
            if (type === 'crop') {
                startScreenshot()
            } else if (type === 'full-page') {
                handleFullPageScreenshot()
            }
        })

        return () => {
            if (removeListener && typeof removeListener === 'function') {
                removeListener()
            }
        }
    }, [startScreenshot, handleFullPageScreenshot])

    return {
        handleFullPageScreenshot
    }
}
