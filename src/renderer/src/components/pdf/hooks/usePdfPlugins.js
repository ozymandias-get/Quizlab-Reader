import { useEffect, useRef } from 'react'
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation'
import { zoomPlugin } from '@react-pdf-viewer/zoom'
import { scrollModePlugin } from '@react-pdf-viewer/scroll-mode'
import { searchPlugin } from '@react-pdf-viewer/search'

/**
 * PDF Viewer plugin'lerini yöneten custom hook
 * Plugin instance'larını oluşturur ve API'lerini döner
 */
export function usePdfPlugins() {
    // Plugin instance'ları - @react-pdf-viewer bunları içsel olarak yönetiyor
    const pageNavigationPluginInstance = pageNavigationPlugin()
    const { jumpToPage } = pageNavigationPluginInstance

    const zoomPluginInstance = zoomPlugin()
    const { ZoomIn, ZoomOut, CurrentScale } = zoomPluginInstance

    const scrollModePluginInstance = scrollModePlugin()

    // Search plugin - Arama özelliği için
    const searchPluginInstance = searchPlugin()
    const { highlight, clearHighlights } = searchPluginInstance

    // jumpToPage ref'i - useCallback içinde kullanmak için
    const jumpToPageRef = useRef(jumpToPage)
    useEffect(() => {
        jumpToPageRef.current = jumpToPage
    }, [jumpToPage])

    return {
        // Plugin instances (Viewer'a geçilecek)
        plugins: [
            pageNavigationPluginInstance,
            zoomPluginInstance,
            scrollModePluginInstance,
            searchPluginInstance
        ],

        // Navigation API
        jumpToPage,
        jumpToPageRef,

        // Zoom API
        ZoomIn,
        ZoomOut,
        CurrentScale,

        // Search API
        highlight,
        clearHighlights
    }
}
