import React, { useState, useRef } from 'react'
import PdfViewer from './components/PdfViewer'
import AiWebview from './components/AiWebview'
import BottomBar from './components/BottomBar'
import FloatingButton from './components/FloatingButton'
import ScreenshotTool from './components/ScreenshotTool'

// Modüler importlar
import { AI_SITES, DEFAULT_AI, VALID_AI_OPTIONS } from './constants/aiSites'
import {
    useLocalStorageString,
    useLocalStorageBoolean,
    usePanelResize,
    useAISender,
    useScreenshot
} from './hooks'

function App() {
    // Hooks ve State
    const [currentAI, setCurrentAI] = useLocalStorageString('lastSelectedAI', DEFAULT_AI, VALID_AI_OPTIONS)
    const [autoSend, setAutoSend, toggleAutoSend] = useLocalStorageBoolean('autoSendEnabled', false)

    const {
        leftPanelWidth,
        isResizing,
        handleMouseDown
    } = usePanelResize({
        initialWidth: 50,
        minLeft: 300,
        minRight: 400,
        storageKey: 'leftPanelWidth'
    })

    // Local State
    const [pdfFile, setPdfFile] = useState(null)
    const [selectedText, setSelectedText] = useState('')
    const [selectionPosition, setSelectionPosition] = useState(null)
    const [isBarHovered, setIsBarHovered] = useState(false)
    const webviewRef = useRef(null)

    // Custom Hooks
    const { sendTextToAI, sendImageToAI } = useAISender(webviewRef, autoSend)
    const {
        isScreenshotMode,
        startScreenshot,
        closeScreenshot,
        handleCapture
    } = useScreenshot(sendImageToAI)

    // Handlers
    const handleSelectPdf = async () => {
        if (!window.electronAPI?.selectPdf) return
        try {
            const result = await window.electronAPI.selectPdf()
            if (result) setPdfFile(result)
        } catch (error) {
            console.error('PDF seçme hatası:', error)
        }
    }

    const handleTextSelection = (text, position) => {
        setSelectedText(text)
        setSelectionPosition(position)
    }

    const handleSendToAI = async () => {
        if (!selectedText) return
        const success = await sendTextToAI(selectedText)
        if (success) {
            setSelectedText('')
            setSelectionPosition(null)
        }
    }

    return (
        <div className="h-screen w-screen overflow-hidden relative">
            {/* Background Blobs */}
            <div className="fixed inset-0 bg-stone-950 z-[-1]">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-900/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-amber-900/20 rounded-full blur-[100px]" />
            </div>

            {/* Main Container - Split View */}
            <div
                className="main-panels-container flex h-screen w-screen p-3 pb-10 gap-2"
                style={{
                    transform: isBarHovered ? 'translateY(-30px)' : 'translateY(0)',
                    transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)'
                }}
            >
                {/* Left Panel - PDF Viewer */}
                <div
                    className="glass-panel flex-shrink-0 flex flex-col overflow-hidden"
                    style={{ width: `${leftPanelWidth}%`, minWidth: '300px' }}
                >
                    <PdfViewer
                        pdfFile={pdfFile}
                        onSelectPdf={handleSelectPdf}
                        onTextSelection={handleTextSelection}
                        onScreenshot={startScreenshot}
                        autoSend={autoSend}
                        onAutoSendToggle={toggleAutoSend}
                    />
                </div>

                {/* Resizer */}
                <div
                    className={`resizer ${isResizing ? 'dragging' : ''}`}
                    onMouseDown={handleMouseDown}
                />

                {/* Right Panel - AI Webview */}
                <div className="glass-panel flex-1 min-w-[350px] flex flex-col overflow-hidden">
                    <AiWebview
                        ref={webviewRef}
                        currentAI={currentAI}
                        aiSites={AI_SITES}
                    />
                </div>
            </div>

            {/* Bottom Bar */}
            <BottomBar
                currentAI={currentAI}
                onAIChange={setCurrentAI}
                autoSend={autoSend}
                onHoverChange={setIsBarHovered}
            />

            {/* Floating Send Button */}
            {selectedText && selectionPosition && (
                <FloatingButton
                    onClick={handleSendToAI}
                    position={selectionPosition}
                />
            )}

            {/* Screenshot Tool */}
            <ScreenshotTool
                isActive={isScreenshotMode}
                onCapture={handleCapture}
                onClose={closeScreenshot}
            />
        </div>
    )
}

export default App
