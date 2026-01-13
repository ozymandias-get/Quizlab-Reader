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
            // DOM güncellemesini bekle (currentPage state değişikliği DOM'a yansısın)
            await new Promise(resolve => setTimeout(resolve, 100))

            const pageLayers = document.querySelectorAll('.rpv-core__page-layer')
            let targetCanvas = null
            let foundMethod = ''

            // Mevcut sayfayı bul (0-indexed)
            const pageIndex = currentPage - 1

            console.log('[PdfScreenshot] 📸 Ekran görüntüsü alınıyor - Sayfa:', currentPage, 'Index:', pageIndex)

            // Method 1: Page layer'ı data-page-number attribute'u ile bul
            for (const layer of pageLayers) {
                const pageNum = layer.getAttribute('data-page-number')
                if (pageNum && parseInt(pageNum) === pageIndex) {
                    targetCanvas = layer.querySelector('canvas')
                    if (targetCanvas) {
                        foundMethod = `data-page-number: ${pageNum}`
                        console.log('[PdfScreenshot] ✓ Canvas bulundu (data-page-number):', pageNum)
                        break
                    }
                }
            }

            // Method 2: En büyük görünür alandaki canvas'ı bul
            if (!targetCanvas) {
                const canvasList = document.querySelectorAll('.rpv-core__page-layer canvas')
                let maxVisibleArea = 0

                for (const canvas of canvasList) {
                    const rect = canvas.getBoundingClientRect()

                    // Görünür alanı hesapla
                    const visibleTop = Math.max(0, rect.top)
                    const visibleBottom = Math.min(window.innerHeight, rect.bottom)
                    const visibleLeft = Math.max(0, rect.left)
                    const visibleRight = Math.min(window.innerWidth, rect.right)

                    const visibleHeight = Math.max(0, visibleBottom - visibleTop)
                    const visibleWidth = Math.max(0, visibleRight - visibleLeft)
                    const visibleArea = visibleHeight * visibleWidth

                    if (visibleArea > maxVisibleArea) {
                        maxVisibleArea = visibleArea
                        targetCanvas = canvas
                        foundMethod = `en büyük görünür alan: ${Math.round(visibleArea)} px²`
                    }
                }

                if (targetCanvas && maxVisibleArea > 0) {
                    console.log('[PdfScreenshot] ✓ Canvas bulundu (visibility check):', foundMethod)
                }
            }

            // Method 3: Fallback - viewport'un tam ortasındaki canvas'ı al
            if (!targetCanvas) {
                const canvasList = document.querySelectorAll('.rpv-core__page-layer canvas')
                const viewportCenterY = window.innerHeight / 2

                let minDistance = Infinity

                for (const canvas of canvasList) {
                    const rect = canvas.getBoundingClientRect()
                    const canvasCenterY = rect.top + rect.height / 2
                    const distance = Math.abs(canvasCenterY - viewportCenterY)

                    if (distance < minDistance) {
                        minDistance = distance
                        targetCanvas = canvas
                        foundMethod = `viewport merkezine en yakın (${Math.round(distance)} px)`
                    }
                }

                if (targetCanvas) {
                    console.log('[PdfScreenshot] ✓ Canvas bulundu (fallback - merkez):', foundMethod)
                }
            }

            if (!targetCanvas) {
                console.warn('[PdfScreenshot] ❌ Canvas bulunamadı')
                return
            }

            console.log('[PdfScreenshot] ✓ Canvas seçildi:', foundMethod)

            // Canvas'tan yüksek kaliteli görüntü al
            const dataUrl = targetCanvas.toDataURL('image/png', 1.0)

            // AI'ya gönder
            const success = await sendImageToAI(dataUrl)

            if (!success) {
                console.warn('[PdfScreenshot] ⚠️ Screenshot gönderilemedi')
            } else {
                console.log('[PdfScreenshot] ✓ Ekran görüntüsü başarıyla gönderildi')
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
