import { useEffect, useCallback } from 'react'
import { APP_CONSTANTS } from '../../../constants/appConstants'

const { SCREENSHOT_TYPES } = APP_CONSTANTS

/**
 * PDF screenshot alma işlemlerini yöneten custom hook
 * @param {Object} options - Hook options
 * @param {number} options.currentPage - Mevcut sayfa numarası
 * @param {Function} options.sendImageToAI - Görüntüyü AI'ya gönderen fonksiyon
 * @param {Function} options.startScreenshot - Crop screenshot başlatan fonksiyon
 */
export function usePdfScreenshot({ currentPage, sendImageToAI, startScreenshot }) {

    // Yardımcı: Ana thread'i bloklamadan Canvas -> DataURL dönüşümü
    const canvasToDataURLAsync = (canvas) => {
        return new Promise((resolve, reject) => {
            // toBlob asenkron çalışır ve UI'ı dondurmaz
            canvas.toBlob((blob) => {
                if (!blob) return reject(new Error('Canvas boş veya oluşturulamadı'))
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result)
                reader.onerror = reject
                reader.readAsDataURL(blob)
            }, 'image/png', 1.0)
        })
    }

    // Tam Sayfa Screenshot Alma (Canvas'tan)
    const handleFullPageScreenshot = useCallback(async () => {
        try {
            let targetCanvas = null
            const pageIndex = currentPage - 1
            const maxAttempts = 10 // 500ms toplam bekleme süresi

            // Canvas'ın render edilmesini bekle (Polling)
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                // Method 1: Kesin sayfa eşleşmesi
                const specificLayer = document.querySelector(`.rpv-core__page-layer[data-page-number="${pageIndex}"]`)
                if (specificLayer) {
                    const canvas = specificLayer.querySelector('canvas')
                    // Canvas var ve boyutu > 0 ise hazır demektir
                    if (canvas && canvas.width > 0 && canvas.height > 0) {
                        targetCanvas = canvas
                        break
                    }
                }

                // Method 2: Görünür alandaki en büyük canvas (Fallback)
                // Sadece birkaç denemeden sonra hala bulamadıysak buna başvur
                if (attempt > 2) {
                    const allCanvases = document.querySelectorAll('.rpv-core__page-layer canvas')
                    let maxVisibleArea = -1
                    let bestCandidate = null

                    allCanvases.forEach(canvas => {
                        if (canvas.width === 0 || canvas.height === 0) return;

                        const rect = canvas.getBoundingClientRect()
                        const intersectionTop = Math.max(0, rect.top)
                        const intersectionBottom = Math.min(window.innerHeight, rect.bottom)
                        const intersectionLeft = Math.max(0, rect.left)
                        const intersectionRight = Math.min(window.innerWidth, rect.right)

                        if (intersectionBottom > intersectionTop && intersectionRight > intersectionLeft) {
                            const visibleArea = (intersectionBottom - intersectionTop) * (intersectionRight - intersectionLeft)
                            if (visibleArea > maxVisibleArea) {
                                maxVisibleArea = visibleArea
                                bestCandidate = canvas
                            }
                        }
                    })

                    if (bestCandidate) {
                        targetCanvas = bestCandidate
                        break
                    }
                }

                // Biraz bekle ve tekrar dene
                await new Promise(r => setTimeout(r, 50))
            }

            if (!targetCanvas) {
                console.warn('[PdfScreenshot] Canvas bulunamadı, screenshot alınamıyor.')
                return
            }

            // Performanslı dönüşüm ve gönderim
            const dataUrl = await canvasToDataURLAsync(targetCanvas)
            await sendImageToAI(dataUrl)

        } catch (error) {
            console.error('[PdfScreenshot] Full page capture error:', error)
        }
    }, [sendImageToAI, currentPage])

    // Main Process'ten gelen tetikleyicileri dinle (Right Click Menu)
    useEffect(() => {
        if (!window.electronAPI?.onTriggerScreenshot) return

        const removeListener = window.electronAPI.onTriggerScreenshot((type) => {
            if (type === SCREENSHOT_TYPES.CROP) {
                startScreenshot()
            } else if (type === SCREENSHOT_TYPES.FULL) {
                handleFullPageScreenshot()
            }
        })

        return () => {
            if (typeof removeListener === 'function') removeListener()
        }
    }, [startScreenshot, handleFullPageScreenshot])

    return { handleFullPageScreenshot }
}
