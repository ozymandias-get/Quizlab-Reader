const { protocol, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const { Readable } = require('stream')
const crypto = require('crypto')
const APP_CONFIG = require('./constants')

// Registry to map unique IDs to local file paths
const pdfRegistry = new Map()

// Cleanup constants
const MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes

let cleanupInterval = null

/**
 * Generate a unique ID for the PDF stream
 */
function generateId() {
    return `pdf_${crypto.randomBytes(6).toString('hex')}_${Date.now()}`
}

/**
 * Cleanup old registry entries to free up memory
 */
function runCleanup() {
    const now = Date.now()
    let removed = 0
    for (const [id, data] of pdfRegistry.entries()) {
        if (now - data.createdAt > MAX_AGE_MS) {
            pdfRegistry.delete(id)
            removed++
        }
    }
    if (removed > 0) console.log(`[PDFProtocol] Cleaned up ${removed} expired entries`)
}

// ============================================
// PROTOCOL REGISTRATION
// ============================================

function registerPdfScheme() {
    protocol.registerSchemesAsPrivileged([
        {
            scheme: 'local-pdf',
            privileges: {
                standard: true,
                secure: true,
                supportFetchAPI: true,
                stream: true,
                bypassCSP: true
            }
        }
    ])
}

function registerPdfProtocol() {
    protocol.handle('local-pdf', async (request) => {
        try {
            const url = new URL(request.url)
            const pdfId = url.host
            const pdfData = pdfRegistry.get(pdfId)

            if (!pdfData) {
                return new Response('Forbidden', { status: 403 })
            }

            const filePath = pdfData.path
            if (!fs.existsSync(filePath)) {
                return new Response('Not Found', { status: 404 })
            }

            const stats = await fs.promises.stat(filePath)
            const nodeStream = fs.createReadStream(filePath, { highWaterMark: 128 * 1024 })
            const webStream = Readable.toWeb(nodeStream)

            return new Response(webStream, {
                status: 200,
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Length': String(stats.size),
                    'Cache-Control': 'private, no-cache',
                    'X-Content-Type-Options': 'nosniff'
                }
            })
        } catch (error) {
            console.error('[PDFProtocol] Stream Error:', error)
            return new Response('Internal Server Error', { status: 500 })
        }
    })
}

// ============================================
// IPC HANDLERS
// ============================================

function registerPdfHandlers() {
    const { IPC_CHANNELS } = APP_CONFIG

    // Select PDF via dialog
    ipcMain.handle(IPC_CHANNELS.SELECT_PDF, async (event, options = {}) => {
        const filterName = options.filterName || 'PDF Documents'
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{ name: filterName, extensions: ['pdf'] }]
        })

        if (canceled || filePaths.length === 0) return null

        const filePath = filePaths[0]
        try {
            const stats = await fs.promises.stat(filePath)
            const id = generateId()
            pdfRegistry.set(id, { path: filePath, createdAt: Date.now() })

            return {
                path: filePath,
                name: path.basename(filePath),
                size: stats.size,
                streamUrl: `local-pdf://${id}`
            }
        } catch (err) {
            console.error('[PDFProtocol] Selection error:', err)
            return null
        }
    })

    // Get stream URL from path (for rehydration or drag-drop)
    ipcMain.handle(IPC_CHANNELS.GET_PDF_STREAM_URL, async (event, filePath) => {
        if (!filePath) return null
        try {
            if (fs.existsSync(filePath) && filePath.toLowerCase().endsWith('.pdf')) {
                const id = generateId()
                pdfRegistry.set(id, { path: filePath, createdAt: Date.now() })
                return { streamUrl: `local-pdf://${id}` }
            }
        } catch (err) {
            console.error('[PDFProtocol] Resolve Error:', err)
        }
        return null
    })
}

// ============================================
// LIFECYCLE
// ============================================

function startPdfCleanupInterval() {
    if (!cleanupInterval) {
        cleanupInterval = setInterval(runCleanup, CLEANUP_INTERVAL_MS)
    }
}

function stopPdfCleanupInterval() {
    if (cleanupInterval) {
        clearInterval(cleanupInterval)
        cleanupInterval = null
    }
}

module.exports = {
    registerPdfScheme,
    registerPdfProtocol,
    registerPdfHandlers,
    startPdfCleanupInterval,
    stopPdfCleanupInterval,
    clearAllPdfPaths: () => pdfRegistry.clear()
}
