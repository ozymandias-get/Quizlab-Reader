/**
 * PDF Protocol Module
 * Custom local-pdf:// protokolü ve PDF işlemleri
 * 
 * Bellek Optimizasyonu:
 * - PDF dosyaları Base64 yerine streaming protocol ile yüklenir
 * - Backpressure yönetimi ile RAM'de veri birikmesi önlenir
 */
const { protocol, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

// Güvenli PDF yollarını saklamak için Map
// Her kayıt { path, createdAt } formatında tutulur (yaşam döngüsü yönetimi için)
const authorizedPdfPaths = new Map()

// PDF yaşam döngüsü sabitleri
const PDF_PATH_MAX_AGE_MS = 30 * 60 * 1000 // 30 dakika
const PDF_CLEANUP_INTERVAL_MS = 10 * 60 * 1000 // 10 dakikada bir temizlik

/**
 * Benzersiz PDF ID'si oluştur
 */
function generatePdfId() {
    return `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Belirli bir PDF ID'sini temizle
 */
function removePdfPath(pdfId) {
    if (authorizedPdfPaths.has(pdfId)) {
        authorizedPdfPaths.delete(pdfId)
        console.log(`[PDF Cleanup] Kaldırıldı: ${pdfId}`)
        return true
    }
    return false
}

/**
 * Eski PDF kayıtlarını temizle (bellek optimizasyonu)
 * Varsayılan olarak 30 dakikadan eski kayıtlar silinir
 */
function clearOldPdfPaths(maxAgeMs = PDF_PATH_MAX_AGE_MS) {
    const now = Date.now()
    let removedCount = 0

    for (const [pdfId, data] of authorizedPdfPaths.entries()) {
        const age = now - data.createdAt
        if (age > maxAgeMs) {
            authorizedPdfPaths.delete(pdfId)
            removedCount++
        }
    }

    if (removedCount > 0) {
        console.log(`[PDF Cleanup] ${removedCount} eski kayıt temizlendi. Kalan: ${authorizedPdfPaths.size}`)
    }

    return removedCount
}

/**
 * Tüm PDF kayıtlarını temizle
 */
function clearAllPdfPaths() {
    const count = authorizedPdfPaths.size
    authorizedPdfPaths.clear()
    console.log(`[PDF Cleanup] Tüm kayıtlar temizlendi: ${count}`)
    return count
}

// Periyodik temizlik için interval (modül yüklendiğinde başlar)
let cleanupInterval = null

function startPdfCleanupInterval() {
    if (cleanupInterval) return // Zaten çalışıyor

    cleanupInterval = setInterval(() => {
        clearOldPdfPaths()
    }, PDF_CLEANUP_INTERVAL_MS)

    console.log('[PDF Cleanup] Periyodik temizlik başlatıldı (10 dakika aralık)')
}

function stopPdfCleanupInterval() {
    if (cleanupInterval) {
        clearInterval(cleanupInterval)
        cleanupInterval = null
        console.log('[PDF Cleanup] Periyodik temizlik durduruldu')
    }
}

/**
 * Custom protokolü privileged olarak kaydet
 * app.whenReady() öncesi çağrılmalı
 * 
 * GÜVENLİK NOT:
 * - bypassCSP: true - PDF viewer'ın fetch() kullanabilmesi için gerekli
 * - Güvenlik: Sadece authorizedPdfPaths'te kayıtlı ID'ler erişebilir
 * - secure: true - HTTPS benzeri davranış
 */
function registerPdfScheme() {
    protocol.registerSchemesAsPrivileged([
        {
            scheme: 'local-pdf',
            privileges: {
                standard: true,
                secure: true,
                supportFetchAPI: true,
                stream: true,
                bypassCSP: true // PDF viewer fetch için gerekli - erişim ID kontrolü ile güvenli
            }
        }
    ])
}

/**
 * PDF streaming protokolünü kaydet
 * app.whenReady() sonrası çağrılmalı
 */
function registerPdfProtocol() {
    const { Readable } = require('stream')

    protocol.handle('local-pdf', async (request) => {
        try {
            const url = new URL(request.url)
            const pdfId = url.host

            const pdfData = authorizedPdfPaths.get(pdfId)

            if (!pdfData) {
                console.error('[PDF Protocol] Erişim reddedildi - yetkisiz ID:', pdfId)
                return new Response('Unauthorized', { status: 403 })
            }

            const filePath = pdfData.path

            if (!fs.existsSync(filePath)) {
                console.error('[PDF Protocol] Dosya bulunamadı:', filePath)
                return new Response('Not Found', { status: 404 })
            }

            const stats = await fs.promises.stat(filePath)

            // BACKPRESSURE YÖNETİMİ ile streaming
            const nodeStream = fs.createReadStream(filePath, {
                highWaterMark: 64 * 1024 // 64KB chunks
            })

            const webStream = Readable.toWeb(nodeStream)

            // GÜVENLİK: CORS header'ları kısıtlandı
            // * yerine sadece uygulama origin'ine izin ver
            return new Response(webStream, {
                status: 200,
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Length': String(stats.size),
                    'Access-Control-Allow-Origin': 'null', // file:// ve custom protocol için
                    'X-Content-Type-Options': 'nosniff', // MIME sniffing engelle
                    'Cache-Control': 'private, no-cache'
                }
            })
        } catch (error) {
            console.error('[PDF Protocol] Hata:', error)
            return new Response('Internal Error', { status: 500 })
        }
    })
}

/**
 * PDF ile ilgili IPC handler'ları kaydet
 */
function registerPdfHandlers() {
    // PDF dosyası seçme
    ipcMain.handle('select-pdf', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'PDF Dosyaları', extensions: ['pdf'] }
            ]
        })

        if (result.canceled || result.filePaths.length === 0) {
            return null
        }

        const filePath = result.filePaths[0]

        try {
            await fs.promises.access(filePath, fs.constants.R_OK)
            const stats = await fs.promises.stat(filePath)

            const pdfId = generatePdfId()
            authorizedPdfPaths.set(pdfId, { path: filePath, createdAt: Date.now() })

            return {
                path: filePath,
                name: path.basename(filePath),
                size: stats.size,
                streamUrl: `local-pdf://${pdfId}`
            }
        } catch (error) {
            console.error('PDF erişim hatası:', error)
            return null
        }
    })

    // Dosya yolundan streamUrl üret (drag & drop için)
    ipcMain.handle('get-pdf-stream-url', async (event, filePath) => {
        try {
            if (!filePath) {
                console.error('[get-pdf-stream-url] Dosya yolu belirtilmedi')
                return null
            }

            await fs.promises.access(filePath, fs.constants.R_OK)

            const pdfId = generatePdfId()
            authorizedPdfPaths.set(pdfId, { path: filePath, createdAt: Date.now() })

            return {
                streamUrl: `local-pdf://${pdfId}`
            }
        } catch (error) {
            console.error('[get-pdf-stream-url] Hata:', error)
            return null
        }
    })
}

module.exports = {
    registerPdfScheme,
    registerPdfProtocol,
    registerPdfHandlers,
    authorizedPdfPaths,
    // Yaşam döngüsü yönetimi
    removePdfPath,
    clearOldPdfPaths,
    clearAllPdfPaths,
    startPdfCleanupInterval,
    stopPdfCleanupInterval
}
