import { useEffect } from 'react'

/**
 * PDF sağ tık menüsünü yöneten custom hook
 * Container içindeki sağ tıklamaları yakalayıp main process'e iletir
 * @param {React.RefObject} containerRef - PDF container ref
 */
export function usePdfContextMenu(containerRef) {
    useEffect(() => {
        const handleContextMenuGlobal = (e) => {
            const container = containerRef.current
            // Tıklama container içindeyse yakala
            if (container && container.contains(e.target)) {
                e.preventDefault()
                e.stopPropagation() // Diğer dinleyicileri durdur

                if (window.electronAPI?.showPdfContextMenu) {
                    window.electronAPI.showPdfContextMenu()
                } else {
                    console.warn('[PdfContextMenu] Sağ tık API bulunamadı (Preload güncel değil mi?)')
                }
            }
        }

        // Document seviyesinde capture true ile yakala
        document.addEventListener('contextmenu', handleContextMenuGlobal, true)

        return () => {
            document.removeEventListener('contextmenu', handleContextMenuGlobal, true)
        }
    }, [containerRef])
}
