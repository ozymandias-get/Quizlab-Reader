import React, { useState, useRef, useEffect, useCallback } from 'react'

/**
 * Ekran Görüntüsü Alma Aracı
 * PDF veya herhangi bir alandan seçim yaparak yapay zekaya gönderebilir
 */
function ScreenshotTool({ isActive, onCapture, onClose }) {
    const [isSelecting, setIsSelecting] = useState(false)
    const [startPos, setStartPos] = useState({ x: 0, y: 0 })
    const [endPos, setEndPos] = useState({ x: 0, y: 0 })
    const overlayRef = useRef(null)

    // Seçim alanı hesaplama
    const getSelectionRect = useCallback(() => {
        const left = Math.min(startPos.x, endPos.x)
        const top = Math.min(startPos.y, endPos.y)
        const width = Math.abs(endPos.x - startPos.x)
        const height = Math.abs(endPos.y - startPos.y)
        return { left, top, width, height }
    }, [startPos, endPos])

    // Mouse down - seçim başlat
    const handleMouseDown = (e) => {
        if (e.button !== 0) return // Sadece sol tık
        setIsSelecting(true)
        setStartPos({ x: e.clientX, y: e.clientY })
        setEndPos({ x: e.clientX, y: e.clientY })
    }

    // Mouse move - seçimi güncelle
    const handleMouseMove = (e) => {
        if (!isSelecting) return
        setEndPos({ x: e.clientX, y: e.clientY })
    }

    // Mouse up - seçimi bitir ve ekran görüntüsü al
    const handleMouseUp = async (e) => {
        if (!isSelecting) return
        setIsSelecting(false)

        const rect = getSelectionRect()

        // Minimum boyut kontrolü (en az 20x20 piksel)
        if (rect.width < 20 || rect.height < 20) {
            onClose()
            return
        }

        // Ekran görüntüsü al
        await captureScreen(rect)
    }

    // ESC ile iptal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        if (isActive) {
            document.addEventListener('keydown', handleKeyDown)
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [isActive, onClose])

    // Ekran görüntüsü alma işlemi
    const captureScreen = async (rect) => {
        // Overlay'ı hemen gizle ve kapat
        if (overlayRef.current) {
            overlayRef.current.style.display = 'none'
        }

        // Minimum gecikme - DOM güncellemesi için
        await new Promise(resolve => requestAnimationFrame(() => {
            requestAnimationFrame(resolve)
        }))

        try {
            // Electron API ile ekran görüntüsü al
            const fullScreenshot = await window.electronAPI?.captureScreen()

            if (!fullScreenshot) {
                console.error('Ekran görüntüsü alınamadı')
                onClose()
                return
            }

            // Görüntüyü yükle ve seçilen alanı kırp
            const img = new Image()
            img.src = fullScreenshot

            await new Promise((resolve, reject) => {
                img.onload = resolve
                img.onerror = reject
            })

            // Canvas oluştur ve kırp
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

            // Device pixel ratio hesaba kat
            const dpr = window.devicePixelRatio || 1
            const scaleX = img.width / window.innerWidth
            const scaleY = img.height / window.innerHeight

            canvas.width = rect.width * scaleX
            canvas.height = rect.height * scaleY

            ctx.drawImage(
                img,
                rect.left * scaleX,
                rect.top * scaleY,
                rect.width * scaleX,
                rect.height * scaleY,
                0,
                0,
                canvas.width,
                canvas.height
            )

            const croppedImage = canvas.toDataURL('image/png')
            onCapture(croppedImage, rect)
        } catch (error) {
            console.error('Ekran görüntüsü alma hatası:', error)
        }

        onClose()
    }

    if (!isActive) return null

    const selectionRect = getSelectionRect()

    return (
        <div
            ref={overlayRef}
            className="screenshot-overlay"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            {/* Karartma - Seçim alanı dışındaki bölgeler */}
            {isSelecting && selectionRect.width > 0 && selectionRect.height > 0 && (
                <>
                    {/* Üst karartma */}
                    <div
                        className="screenshot-dim"
                        style={{
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: selectionRect.top
                        }}
                    />
                    {/* Sol karartma */}
                    <div
                        className="screenshot-dim"
                        style={{
                            top: selectionRect.top,
                            left: 0,
                            width: selectionRect.left,
                            height: selectionRect.height
                        }}
                    />
                    {/* Sağ karartma */}
                    <div
                        className="screenshot-dim"
                        style={{
                            top: selectionRect.top,
                            left: selectionRect.left + selectionRect.width,
                            right: 0,
                            height: selectionRect.height
                        }}
                    />
                    {/* Alt karartma */}
                    <div
                        className="screenshot-dim"
                        style={{
                            top: selectionRect.top + selectionRect.height,
                            left: 0,
                            width: '100%',
                            bottom: 0
                        }}
                    />

                    {/* Seçim çerçevesi */}
                    <div
                        className="screenshot-selection"
                        style={{
                            left: selectionRect.left,
                            top: selectionRect.top,
                            width: selectionRect.width,
                            height: selectionRect.height
                        }}
                    >
                        {/* Boyut göstergesi */}
                        <div className="screenshot-size-indicator">
                            {Math.round(selectionRect.width)} × {Math.round(selectionRect.height)}
                        </div>

                        {/* Köşe tutamaçları */}
                        <div className="screenshot-handle top-left" />
                        <div className="screenshot-handle top-right" />
                        <div className="screenshot-handle bottom-left" />
                        <div className="screenshot-handle bottom-right" />
                    </div>
                </>
            )}



            {/* ESC ile iptal ipucu - sağ üst köşede küçük bir gösterge */}
            {!isSelecting && (
                <div className="screenshot-esc-hint">
                    ESC ile iptal
                </div>
            )}
        </div>
    )
}

export default ScreenshotTool
