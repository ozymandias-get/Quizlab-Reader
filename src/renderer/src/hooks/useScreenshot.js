import { useState, useCallback } from 'react'

/**
 * Ekran görüntüsü alma işlemlerini yöneten hook
 * @param {Function} onSendToAI - Görüntüyü AI'ya gönderme fonksiyonu
 * @returns {Object} - Screenshot durumu ve fonksiyonları
 */
export function useScreenshot(onSendToAI) {
    const [isScreenshotMode, setIsScreenshotMode] = useState(false)
    const [capturedImage, setCapturedImage] = useState(null)

    /**
     * Ekran görüntüsü modunu başlat
     */
    const startScreenshot = useCallback(() => {
        setIsScreenshotMode(true)
    }, [])

    /**
     * Ekran görüntüsü modunu kapat
     */
    const closeScreenshot = useCallback(() => {
        setIsScreenshotMode(false)
        setCapturedImage(null)
    }, [])

    /**
     * Ekran görüntüsü yakalandığında
     * @param {string} imageData - Base64 formatında görüntü verisi
     * @param {Object} rect - Seçim dikdörtgeni {width, height, x, y}
     */
    const handleCapture = useCallback(async (imageData, rect) => {

        setCapturedImage(imageData)
        setIsScreenshotMode(false)

        // Görüntüyü AI'ya gönder
        if (onSendToAI) {
            await onSendToAI(imageData)
        }

        // State'i temizle
        setCapturedImage(null)
    }, [onSendToAI])

    return {
        isScreenshotMode,
        capturedImage,
        startScreenshot,
        closeScreenshot,
        handleCapture
    }
}
