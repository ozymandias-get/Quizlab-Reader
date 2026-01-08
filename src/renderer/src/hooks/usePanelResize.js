import { useState, useEffect, useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'

/**
 * Panel boyutlandırma işlemlerini yöneten hook
 * @param {Object} options - Yapılandırma seçenekleri
 * @param {number} options.initialWidth - Başlangıç panel genişliği (%)
 * @param {number} options.minLeft - Sol panel minimum genişliği (px)
 * @param {number} options.minRight - Sağ panel minimum genişliği (px)
 * @param {string} options.storageKey - localStorage anahtarı
 * @returns {Object} - Panel boyutlandırma durumu ve fonksiyonları
 */
export function usePanelResize({
    initialWidth = 50,
    minLeft = 300,
    minRight = 400,
    storageKey = 'leftPanelWidth'
} = {}) {
    const [leftPanelWidth, setLeftPanelWidth] = useLocalStorage(storageKey, initialWidth)
    const [isResizing, setIsResizing] = useState(false)

    // Mouse down - resize başlat
    const handleMouseDown = useCallback((e) => {
        e.preventDefault()
        setIsResizing(true)
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'
    }, [])

    // Mouse move ve mouse up event listener'ları
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing) return

            const containerWidth = window.innerWidth
            const newLeftWidth = e.clientX
            const maxLeft = containerWidth - minRight - 6

            if (newLeftWidth >= minLeft && newLeftWidth <= maxLeft) {
                const percentage = (newLeftWidth / containerWidth) * 100
                setLeftPanelWidth(percentage)
            }
        }

        const handleMouseUp = () => {
            if (isResizing) {
                setIsResizing(false)
                document.body.style.cursor = ''
                document.body.style.userSelect = ''
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
        handleMouseDown
    }
}
