import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useLanguage } from '../context/LanguageContext'

// Minimum selection size (px)
const MIN_SELECTION_SIZE = 20

/**
 * Screenshot Tool
 * Allows selecting an area and capturing it to send to AI.
 */
function ScreenshotTool({ isActive, onCapture, onClose }) {
    const { t } = useLanguage()
    const [isSelecting, setIsSelecting] = useState(false)
    const [startPos, setStartPos] = useState({ x: 0, y: 0 })
    const [endPos, setEndPos] = useState({ x: 0, y: 0 })
    const overlayRef = useRef(null)

    // Calculate selection rectangle
    const getSelectionRect = useCallback(() => {
        const left = Math.min(startPos.x, endPos.x)
        const top = Math.min(startPos.y, endPos.y)
        const width = Math.abs(endPos.x - startPos.x)
        const height = Math.abs(endPos.y - startPos.y)
        return { left, top, width, height }
    }, [startPos, endPos])

    // Mouse down - start selection
    const handleMouseDown = (e) => {
        if (e.button !== 0) return
        setIsSelecting(true)
        setStartPos({ x: e.clientX, y: e.clientY })
        setEndPos({ x: e.clientX, y: e.clientY })
    }

    // Mouse move - update selection
    const handleMouseMove = (e) => {
        if (!isSelecting) return
        setEndPos({ x: e.clientX, y: e.clientY })
    }

    // Mouse up - finish selection and capture
    const handleMouseUp = async (e) => {
        if (!isSelecting) return
        setIsSelecting(false)

        const rect = getSelectionRect()

        // Minimum size check
        if (rect.width < MIN_SELECTION_SIZE || rect.height < MIN_SELECTION_SIZE) {
            onClose()
            return
        }

        await captureScreen(rect)
    }

    // Cancel with ESC
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose()
        }

        if (isActive) {
            document.addEventListener('keydown', handleKeyDown)
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [isActive, onClose])

    // Capture screen process
    const captureScreen = async (rect) => {
        if (overlayRef.current) {
            overlayRef.current.style.display = 'none'
        }

        // Wait for DOM update
        await new Promise(resolve => requestAnimationFrame(() => {
            requestAnimationFrame(resolve)
        }))

        try {
            const fullScreenshot = await window.electronAPI?.captureScreen()

            if (!fullScreenshot) {
                onClose()
                return
            }

            const img = new Image()
            img.src = fullScreenshot

            await new Promise((resolve, reject) => {
                img.onload = resolve
                img.onerror = reject
            })

            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

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
            onClose()
        } catch (error) {
            console.error('[ScreenshotTool] Capture error:', error)
            onClose()
        }
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
            {/* Darkening overlays */}
            {isSelecting && selectionRect.width > 0 && selectionRect.height > 0 && (
                <>
                    <div className="screenshot-dim" style={{ top: 0, left: 0, width: '100%', height: selectionRect.top }} />
                    <div className="screenshot-dim" style={{ top: selectionRect.top, left: 0, width: selectionRect.left, height: selectionRect.height }} />
                    <div className="screenshot-dim" style={{ top: selectionRect.top, left: selectionRect.left + selectionRect.width, right: 0, height: selectionRect.height }} />
                    <div className="screenshot-dim" style={{ top: selectionRect.top + selectionRect.height, left: 0, width: '100%', bottom: 0 }} />

                    {/* Selection Frame */}
                    <div
                        className="screenshot-selection"
                        style={{
                            left: selectionRect.left,
                            top: selectionRect.top,
                            width: selectionRect.width,
                            height: selectionRect.height
                        }}
                    >
                        <div className="screenshot-size-indicator">
                            {Math.round(selectionRect.width)} × {Math.round(selectionRect.height)}
                        </div>

                        <div className="screenshot-handle top-left" />
                        <div className="screenshot-handle top-right" />
                        <div className="screenshot-handle bottom-left" />
                        <div className="screenshot-handle bottom-right" />
                    </div>
                </>
            )}

            {!isSelecting && (
                <div className="screenshot-esc-hint">
                    {t('cancel_with_esc')}
                </div>
            )}
        </div>
    )
}

export default ScreenshotTool
